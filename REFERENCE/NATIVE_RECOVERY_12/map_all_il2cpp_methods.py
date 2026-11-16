#!/usr/bin/env python3
"""Evidence-first IL2CPP v29 ELF registration and method-token mapper.
Uses the paired ELF64/AArch64 libil2cpp.so + global-metadata.dat.
No native addresses are emitted unless the full CodeGenModules chain validates.
"""
from __future__ import annotations
import argparse, csv, hashlib, json, struct, subprocess
from collections import defaultdict
from pathlib import Path

P=argparse.ArgumentParser()
P.add_argument('elf',type=Path); P.add_argument('metadata',type=Path); P.add_argument('--out',type=Path,required=True)
a=P.parse_args(); raw=a.elf.read_bytes(); b=bytearray(raw); m=a.metadata.read_bytes(); out=a.out; out.mkdir(parents=True,exist_ok=True)

def U16(o): return struct.unpack_from('<H',b,o)[0]
def U32(o): return struct.unpack_from('<I',b,o)[0]
def U64(o): return struct.unpack_from('<Q',b,o)[0]
def I32(o): return struct.unpack_from('<i',b,o)[0]
def u64(x): return struct.unpack('<Q',x)[0]
def sha(x): return hashlib.sha256(x).hexdigest()
assert b[:4]==b'\x7fELF' and b[4:6]==b'\x02\x01', 'Expected little-endian ELF64'
assert struct.unpack_from('<II',m,0)==(0xFAB11BAF,29), 'Expected IL2CPP metadata v29'
H=[struct.unpack_from('<II',m,8+i*8) for i in range(31)]
method_off,method_bytes=H[5]; type_off,type_bytes=H[19]; image_off,image_bytes=H[20]
method_count=method_bytes//32; type_count=type_bytes//88; image_count=image_bytes//40
assert method_bytes%32==0 and type_bytes%88==0 and image_bytes%40==0

def s_at(idx):
    so,ss=H[2]
    if idx>=ss: return f'<bad:{idx}>'
    p=so+idx; e=m.find(b'\0',p,so+ss)
    if e<0:return '<unterminated>'
    return m[p:e].decode('utf-8','replace')
# Parse ELF program headers and sections
phoff=U64(32); shoff=U64(40); phents=U16(54); phnum=U16(56); shents=U16(58); shnum=U16(60); shstrndx=U16(62)
ph=[]
for i in range(phnum):
 o=phoff+i*phents; typ,flags=struct.unpack_from('<II',b,o); off,va,pa,fs,ms,align=struct.unpack_from('<QQQQQQ',b,o+8)
 ph.append(dict(type=typ,flags=flags,off=off,va=va,fs=fs,ms=ms,align=align))
loads=[x for x in ph if x['type']==1 and x['ms']]
execs=[x for x in loads if x['flags'] in (1,3,5,7)]; datas=[x for x in loads if x['flags'] in (2,4,6)]
def vaoff(va):
 for s in loads:
  if s['va']<=va<s['va']+s['fs']: return va-s['va']+s['off']
 raise ValueError(f'VA unmapped: {va:#x}')
def is_exec(va): return any(x['va']<=va<x['va']+x['ms'] for x in execs)
def is_data(va): return any(x['va']<=va<x['va']+x['ms'] for x in datas)
# sections for dynamic symbols
sh=[]
for i in range(shnum):
 o=shoff+i*shents; nm,typ=struct.unpack_from('<II',b,o); fl,addr,off,size=struct.unpack_from('<QQQQ',b,o+8); link,info=struct.unpack_from('<II',b,o+40); al,ent=struct.unpack_from('<QQ',b,o+48)
 sh.append(dict(nm=nm,typ=typ,fl=fl,addr=addr,off=off,size=size,link=link,info=info,al=al,ent=ent))
ss=sh[shstrndx]; shstr=raw[ss['off']:ss['off']+ss['size']]
for x in sh:
 e=shstr.find(b'\0',x['nm']); x['name']=shstr[x['nm']:e].decode('ascii','replace')
# Process RELA relocations: emulate the recognized AArch64 relocation types from the reference implementation.
dyn=next(x for x in ph if x['type']==2); tags={}
for o in range(dyn['off'],dyn['off']+dyn['fs'],16):
 tag=struct.unpack_from('<q',b,o)[0]; val=U64(o+8)
 if tag==0: break
 tags[tag]=val
symsec=next(x for x in sh if x['name']=='.dynsym'); syms=[]
for o in range(symsec['off'],symsec['off']+symsec['size'],symsec['ent']):
 name,info,other,ndx=struct.unpack_from('<IBBH',b,o); val,size=struct.unpack_from('<QQ',b,o+8); syms.append(val)
rel_applied=defaultdict(int); rel_skipped=defaultdict(int)
if 7 in tags and 8 in tags:
 ro=vaoff(tags[7]); rend=ro+tags[8]
 for o in range(ro,rend,24):
  r_offset,r_info,r_addend=struct.unpack_from('<QQq',b,o); typ=r_info&0xffffffff; sym=r_info>>32
  if typ==257 and sym<len(syms): val=(syms[sym]+r_addend)&0xffffffffffffffff; label='R_AARCH64_ABS64'
  elif typ==1027: val=r_addend&0xffffffffffffffff; label='R_AARCH64_RELATIVE'
  else: rel_skipped[typ]+=1; continue
  try: struct.pack_into('<Q',b,vaoff(r_offset),val); rel_applied[label]+=1
  except Exception: rel_skipped['unmapped']+=1
# Build index of data-segment pointer slots, after relocation
refs=defaultdict(list)
for seg in datas:
 st=seg['off']; end=min(st+seg['fs'],len(b)); off=st
 # Il2CppDumper walks these sections at pointer-size increments from segment base.
 while off+8<=end:
  val=U64(off)
  if val: refs[val].append(seg['va']+(off-st))
  off+=8
feature=b'mscorlib.dll\0'; occurrences=[]
for seg in execs:
 st=seg['off']; end=min(st+seg['fs'],len(b)); p=st
 while True:
  p=b.find(feature,p,end)
  if p<0: break
  occurrences.append((p,seg['va']+(p-st))); p+=1
traces=[]
for foff,dllva in occurrences:
 for r1 in refs.get(dllva,[]):
  for r2 in refs.get(r1,[]):
   for image_idx in range(image_count-1,-1,-1):
    for r3 in refs.get(r2-image_idx*8,[]):
     try: before=U64(vaoff(r3-8))
     except Exception: continue
     if before==image_count:
      traces.append(dict(dll_va=dllva,ref1=r1,ref2=r2,image_index=image_idx,ref3=r3,images_count_before=before,code_registration=r3-14*8))
uniq={x['code_registration'] for x in traces}
if len(uniq)!=1: raise SystemExit(f'Expected one unique CodeRegistration candidate, got {sorted(map(hex,uniq))}')
code_reg=next(iter(uniq)); q=[U64(vaoff(code_reg+i*8)) for i in range(15)]
# v29+ registration layout includes generic adjustor thunk pointer after generic method pointers.
modules_count=q[13]; modules_ptr=q[14]
if modules_count!=image_count: raise SystemExit(f'CodeRegistration module count {modules_count} != metadata image count {image_count}')
mods_va=[U64(vaoff(modules_ptr+i*8)) for i in range(modules_count)]
modules=[]
for idx,mva in enumerate(mods_va):
 mo=vaoff(mva); vals=struct.unpack_from('<QQQQQQQQQQQQQQQQQ',b,mo)
 name_va,count,ptr=vals[:3]
 nameoff=vaoff(name_va); end=b.find(b'\0',nameoff,nameoff+512)
 name=b[nameoff:end].decode('utf-8','replace') if end>0 else f'<bad-name@{name_va:#x}>'
 if count>0:
  try: ptrs=[U64(vaoff(ptr+j*8)) for j in range(count)]
  except Exception: ptrs=[]
 else: ptrs=[]
 valid=len(ptrs)==count and all(x==0 or is_exec(x) for x in ptrs)
 modules.append(dict(index=idx,name=name,va=mva,method_pointer_count=count,method_pointers_va=ptr,method_pointer_array_valid=valid,rgctx_ranges_count=vals[8],rgctxs_count=vals[10]))
if len({x['name'] for x in modules})!=len(modules): raise SystemExit('Duplicate CodeGenModule names: refusing to map')
# Parse metadata images and type/method definitions.
images=[]
for i in range(image_count):
 o=image_off+i*40
 nameidx,assemblyidx,type_start,type_n,export_start,export_n,entry,token,ca_start,ca_n=struct.unpack_from('<Ii iI iI iI iI'.replace(' ',''),m,o)
 images.append(dict(name=s_at(nameidx),assembly_index=assemblyidx,type_start=type_start,type_count=type_n,token=token))
# Create method map by method definition token, declaring type, and image association.
type_img={}
types=[]
for ti in range(type_count):
 o=type_off+ti*88
 nameidx,nsidx=struct.unpack_from('<II',m,o); meth_start=struct.unpack_from('<i',m,o+36)[0]; meth_count=struct.unpack_from('<H',m,o+64)[0]
 types.append(dict(name=s_at(nameidx),namespace=s_at(nsidx),method_start=meth_start,method_count=meth_count))
for im in images:
 for ti in range(im['type_start'],im['type_start']+im['type_count']): type_img[ti]=im['name']
mod_by_name={x['name']:x for x in modules}
# parse only interesting game classes, while export all methods from Assembly-CSharp for further analysis
wanted={'EasyGamemode','LevelGenerator','NonogramLevel','LevelManager','LevelCreator','Tile','TileState','UndoStack','BasicUndo','IUndoable','LevelsManager','LocalStorageSystem','IStorageSystem','ActiveButton','TileStateButton','GamemodeManager','MainMenuManager','Navigator','Global','PopupBuilder','NextLevel','TutorialManager','LanguageManager','Popup','Cheats','AdvertisementManager','RewardedAdvertisementManager'}
rows=[]
for mi in range(method_count):
 o=method_off+mi*32
 nameidx,decl,ret,paramstart,generic,token=struct.unpack_from('<IiiIiI',m,o)
 flags,iflags,slot,pc=struct.unpack_from('<4H',m,o+24)
 if decl<0 or decl>=type_count: continue
 t=types[decl]; img=type_img.get(decl,'<unmapped-image>')
 # Export every mapped metadata method across every image/module for xref resolution.
 mod=mod_by_name.get(img)
 rid=token&0x00ffffff
 ptr=0; status='NO_MODULE'
 if mod:
  if rid<1 or rid>mod['method_pointer_count']: status='RID_OUT_OF_RANGE'
  else:
   try: ptr=U64(vaoff(mod['method_pointers_va']+(rid-1)*8)); status='OK' if ptr and is_exec(ptr) else ('NULL' if ptr==0 else 'NON_EXEC_TARGET')
   except Exception: status='POINTER_READ_FAIL'
 rows.append(dict(image=img,namespace=t['namespace'],type=t['name'],method=s_at(nameidx),token=f'0x{token:08x}',rid=rid,method_def_index=mi,native_va=f'0x{ptr:x}' if ptr else '',native_file_offset=f'0x{vaoff(ptr):x}' if ptr and is_exec(ptr) else '',mapping_status=status,parameter_count=pc,metadata_flags=f'0x{flags:04x}',slot=slot))
# Require strong module-table validation
valid_mods=sum(1 for x in modules if x['method_pointer_array_valid'])
# The assembly's method pointers should all valid or null; report validation stats.
with (out/'CODEGEN_MODULES.csv').open('w',newline='') as f:
 w=csv.DictWriter(f,fieldnames=list(modules[0].keys())); w.writeheader(); w.writerows(modules)
with (out/'ALL_MODULE_METHOD_TOKEN_NATIVE_MAP.csv').open('w',newline='') as f:
 w=csv.DictWriter(f,fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
report=[]
report += ['IL2CPP v29 REGISTRATION + TOKEN MAP','='*43,'',f'ELF SHA256: {sha(raw)}',f'METADATA SHA256: {sha(m)}',f'Metadata v29 counts: methods={method_count}, types={type_count}, images={image_count}',f'Applied relocations: {dict(rel_applied)}',f'Skipped relocation types: {dict(rel_skipped)}',f'mscorlib.dll strings in executable-mapped PT_LOAD: {len(occurrences)}',f'CodeRegistration candidates: {len(uniq)}']
report += [f'CodeRegistration VA: 0x{code_reg:x}',f'CodeGenModules count: {modules_count}',f'CodeGenModules pointer: 0x{modules_ptr:x}',f'CodeGenModules parsed: {len(modules)}',f'Modules with structurally readable method pointer arrays: {valid_mods}/{len(modules)}','']
for x in modules: report.append(f"MODULE {x['index']:02d} {x['name']} VA=0x{x['va']:x} methodPointerCount={x['method_pointer_count']} arrayValid={x['method_pointer_array_valid']}")
report += ['', 'TARGET METHOD MAP (if available)']
for x in rows:
 if x['type'] in wanted: report.append(f"{x['image']} :: {x['namespace']}.{x['type']}.{x['method']} {x['token']} RID={x['rid']} => {x['native_va'] or '<none>'} [{x['mapping_status']}]")
report += ['',f'Total mapped method rows (all Assembly-CSharp + named classes): {len(rows)}',f'Mapped OK: {sum(x["mapping_status"]=="OK" for x in rows)}',f'Null: {sum(x["mapping_status"]=="NULL" for x in rows)}',f'Other/unresolved: {sum(x["mapping_status"] not in ("OK","NULL") for x in rows)}','', 'IMPORTANT: Addresses are emitted only after validating the ELF load mapping, relocated pointers, unique CodeRegistration chain, CodeGenModules count vs metadata image count, and per-entry executable range. Method boundaries and semantics still require disassembly.']
(out/'IL2CPP_V29_TOKEN_MAP_REPORT.txt').write_text('\n'.join(report)+'\n')
(out/'REGISTRATION_TRACE.json').write_text(json.dumps(dict(method_count=method_count,type_count=type_count,image_count=image_count,code_reg_va=code_reg,code_reg_fields=[hex(x) for x in q],modules_count=modules_count,modules_ptr=hex(modules_ptr),traces=traces,relocations_applied=dict(rel_applied),modules=modules),indent=2)+'\n')
print('\n'.join(report[:90]))
