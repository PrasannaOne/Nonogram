#!/usr/bin/env python3
"""Resolve IL2CPP v29 generic shared-method pointers back to metadata method definitions."""
import struct,csv,json,hashlib
from pathlib import Path
root=Path('/mnt/data/v10_stage/nonogram_v8_work/nonogram_v3/REFERENCE')
elfp=root/'split_config.arm64_v8a/lib/arm64-v8a/libil2cpp.so'
metap=root/'assets/bin/Data/Managed/Metadata/global-metadata.dat'
b=bytearray(elfp.read_bytes()); m=metap.read_bytes()
u16=lambda o:struct.unpack_from('<H',b,o)[0];u32=lambda o:struct.unpack_from('<I',b,o)[0];u64=lambda o:struct.unpack_from('<Q',b,o)[0]
assert b[:6]==b'\x7fELF\x02\x01' and struct.unpack_from('<II',m,0)==(0xFAB11BAF,29)
phoff=u64(32);phents=u16(54);phnum=u16(56); loads=[]
for i in range(phnum):
 o=phoff+i*phents;typ,fl=struct.unpack_from('<II',b,o);off,va,pa,fs,ms,al=struct.unpack_from('<QQQQQQ',b,o+8)
 if typ==1 and ms:loads.append((fl,off,va,fs,ms))
def vaoff(v):
 for fl,off,va,fs,ms in loads:
  if va<=v<va+fs:return v-va+off
 raise ValueError(hex(v))
def is_exec(v):return any(fl in (1,3,5,7) and va<=v<va+ms for fl,off,va,fs,ms in loads)
# sections and dynsyms
shoff=u64(40);shents=u16(58);shnum=u16(60);shstrndx=u16(62);sh=[]
for i in range(shnum):
 o=shoff+i*shents;nm,ty=struct.unpack_from('<II',b,o);fl,ad,off,size=struct.unpack_from('<QQQQ',b,o+8);link,info=struct.unpack_from('<II',b,o+40);al,ent=struct.unpack_from('<QQ',b,o+48);sh.append(dict(nm=nm,ty=ty,off=off,size=size,link=link,ent=ent,addr=ad))
ss=sh[shstrndx];names=bytes(b[ss['off']:ss['off']+ss['size']])
for x in sh:
 e=names.find(b'\0',x['nm']);x['name']=names[x['nm']:e].decode(errors='replace')
symsec=next(x for x in sh if x['name']=='.dynsym');syms=[]
for o in range(symsec['off'],symsec['off']+symsec['size'],symsec['ent']):
 name,info,other,ndx=struct.unpack_from('<IBBH',b,o);val,size=struct.unpack_from('<QQ',b,o+8);syms.append(val)
for i in range(phnum):
 o=phoff+i*phents
 if u32(o)==2:dynoff=u64(o+8);dynsize=u64(o+32);break
tags={}
for o in range(dynoff,dynoff+dynsize,16):
 t=struct.unpack_from('<q',b,o)[0];v=u64(o+8)
 if t==0:break
 tags[t]=v
for o in range(vaoff(tags[7]),vaoff(tags[7])+tags[8],24):
 ro,ri,ra=struct.unpack_from('<QQq',b,o);ty=ri&0xffffffff;si=ri>>32
 if ty==1027:v=ra&0xffffffffffffffff
 elif ty==257 and si<len(syms):v=(syms[si]+ra)&0xffffffffffffffff
 else:continue
 try:struct.pack_into('<Q',b,vaoff(ro),v)
 except Exception:pass
# global metadata offsets by header order
H=[struct.unpack_from('<II',m,8+i*8) for i in range(31)]
method_off,method_size=H[5]; type_off,type_size=H[19]; image_off,image_size=H[20]
method_count=method_size//32;type_count=type_size//88;image_count=image_size//40
string_off,string_size=H[2]
def s_at(i):
 if i>=string_size:return '<bad>'
 p=string_off+i;e=m.find(b'\0',p,string_off+string_size);return m[p:e].decode('utf-8','replace')
# parse metadata image array and type definitions
imgs=[]
for i in range(image_count):
 vals=struct.unpack_from('<Ii iI iI iI iI'.replace(' ',''),m,image_off+i*40)
 imgs.append(dict(name=s_at(vals[0]),typeStart=vals[2],typeCount=vals[3]))
types=[]
for i in range(type_count):
 o=type_off+i*88;nameidx,nsidx=struct.unpack_from('<II',m,o);meth_start=struct.unpack_from('<i',m,o+36)[0];meth_count=struct.unpack_from('<H',m,o+64)[0]
 types.append(dict(name=s_at(nameidx),namespace=s_at(nsidx),methodStart=meth_start,methodCount=meth_count))
type_img={}
for im in imgs:
 for ti in range(im['typeStart'],im['typeStart']+im['typeCount']):type_img[ti]=im['name']
# parse all method definitions into rows
methods=[]
for i in range(method_count):
 o=method_off+i*32;nameidx,decl,ret,param,generic,token=struct.unpack_from('<IiiIiI',m,o);flags,iflags,slot,pc=struct.unpack_from('<4H',m,o+24)
 if 0<=decl<type_count:
  t=types[decl];methods.append(dict(index=i,name=s_at(nameidx),decl=decl,namespace=t['namespace'],type=t['name'],image=type_img.get(decl,''),token=token,flags=flags,iflags=iflags,slot=slot,paramcount=pc))
# Registration structure verified by v29 structure pattern
meta_reg=0x19e8620; mr=[u64(vaoff(meta_reg+i*8)) for i in range(16)]
# Code registration previously independently confirmed by module chain
code_reg=0x19d8248; cr=[u64(vaoff(code_reg+i*8)) for i in range(15)]
generic_ptr_count=cr[2];generic_ptr_va=cr[3]
generic_ptrs=[u64(vaoff(generic_ptr_va+i*8)) for i in range(generic_ptr_count)]
gmt_count=mr[4];gmt_va=mr[5];spec_count=mr[8];spec_va=mr[9]
# v29 GenericMethodFunctionsDefinitions = int + int + int + int = 16 bytes
# MethodSpec = 3 int32 = 12 bytes
hits=[];bad=[]
for i in range(gmt_count):
 o=vaoff(gmt_va)+i*16; spec_idx,method_idx,invoker_idx,adjustor=struct.unpack_from('<iiii',b,o)
 if not (0<=spec_idx<spec_count and 0<=method_idx<generic_ptr_count):
  bad.append((i,spec_idx,method_idx));continue
 target=generic_ptrs[method_idx]
 if target in (0x00b1f7d0,0x00b1f8b4,0x00b20a4c,0x00b175b4,0x00b681c8,0x00d6bd0c,0x00d6b330,0x0012dc16c,0x0092c1d0,0x0092dac0,0x0092bdd8,0x0092c1d0,0x0092dac0,0x00e2f584):
  mo=vaoff(spec_va)+spec_idx*12; mdidx,clidx,midx=struct.unpack_from('<iii',b,mo)
  mdef=methods[mdidx] if 0<=mdidx<len(methods) else None
  hits.append(dict(target=f'0x{target:x}',table_entry=i,method_index=method_idx,method_spec_index=spec_idx,method_definition_index=mdidx,class_inst_index=clidx,method_inst_index=midx,method=mdef))
# Also write a full target map summary with each generic method pointer slot and specs where target can map.
out=Path('/mnt/data/il2cpp_v29_out/generic_methods');out.mkdir(parents=True,exist_ok=True)
with (out/'GENERIC_TARGET_HITS.json').open('w') as f:json.dump(hits,f,indent=2)
with (out/'GENERIC_TARGET_HITS.csv').open('w',newline='') as f:
 cols=['target','table_entry','method_index','method_spec_index','method_definition_index','class_inst_index','method_inst_index','image','namespace','type','method','method_token','method_flags','method_slot']
 w=csv.DictWriter(f,fieldnames=cols);w.writeheader()
 for x in hits:
  md=x['method'] or {};w.writerow({**{k:x[k] for k in cols[:7]},'image':md.get('image',''),'namespace':md.get('namespace',''),'type':md.get('type',''),'method':md.get('name',''),'method_token':f"0x{md.get('token',0):08x}" if md else '', 'method_flags':f"0x{md.get('flags',0):04x}" if md else '', 'method_slot':md.get('slot','')})
report=['IL2CPP v29 GENERIC METHOD POINTER INVESTIGATION','='*55,'',f'Generic method pointers: {generic_ptr_count} at 0x{generic_ptr_va:x}',f'Generic method table entries: {gmt_count} at 0x{gmt_va:x}',f'Method specs: {spec_count} at 0x{spec_va:x}',f'MetadataRegistration verified base: 0x{meta_reg:x}','',f'Generic method table entries with invalid indexes: {len(bad)}','TARGET RESOLUTIONS:']
for x in hits:
 md=x['method'] or {};report.append(f"{x['target']} => {md.get('image','')} :: {md.get('namespace','')}.{md.get('type','')}.{md.get('name','')} token=0x{md.get('token',0):08x} [spec={x['method_spec_index']} methodIndex={x['method_index']}]")
report+=['','Important: generic method entries include shared instantiations; method-definition resolution identifies the generic definition, not necessarily the concrete type arguments.']
(out/'GENERIC_METHOD_MAPPING_REPORT.txt').write_text('\n'.join(report)+'\n')
print('\n'.join(report))
