import struct, re, sys, collections, hashlib
from pathlib import Path
ELF=Path(sys.argv[1]); META=Path(sys.argv[2]); blob=bytearray(ELF.read_bytes()); m=META.read_bytes()
U16=lambda o: struct.unpack_from('<H',blob,o)[0]
U32=lambda o: struct.unpack_from('<I',blob,o)[0]
U64=lambda o: struct.unpack_from('<Q',blob,o)[0]
# metadata v29 counts from canonical header pairs
assert struct.unpack_from('<II',m,0)==(0xFAB11BAF,29)
header=[struct.unpack_from('<II',m,8+i*8) for i in range(31)]
method_count=header[5][1]//32
type_count=header[19][1]//88
image_count=header[20][1]//40
print('META',len(m),'version=29','methodDefs=',method_count,'typeDefs=',type_count,'images=',image_count)
# ELF64 header, program headers, section headers
assert blob[:4]==b'\x7fELF' and blob[4]==2 and blob[5]==1
phoff=U64(32); shoff=U64(40); phents=U16(54); phnum=U16(56); shents=U16(58); shnum=U16(60); shstrndx=U16(62)
ph=[]
for i in range(phnum):
 o=phoff+i*phents
 p_type,p_flags=struct.unpack_from('<II',blob,o)
 p_offset,p_vaddr,p_paddr,p_filesz,p_memsz,p_align=struct.unpack_from('<QQQQQQ',blob,o+8)
 ph.append(dict(type=p_type,flags=p_flags,off=p_offset,va=p_vaddr,fs=p_filesz,ms=p_memsz,align=p_align))

def va_off(va):
 for s in ph:
  if s['type']==1 and s['va']<=va<s['va']+s['fs']:
   return va-s['va']+s['off']
 raise ValueError('VA unmapped '+hex(va))
def is_va_in(va, segs): return any(s['va']<=va<s['va']+s['ms'] for s in segs)
# Sections: .dynsym and dynstr details
sh=[]
for i in range(shnum):
 o=shoff+i*shents
 sh_name,sh_type=struct.unpack_from('<II',blob,o)
 sh_flags,sh_addr,sh_offset,sh_size=struct.unpack_from('<QQQQ',blob,o+8)
 sh_link,sh_info=struct.unpack_from('<II',blob,o+40)
 sh_addralign,sh_entsize=struct.unpack_from('<QQ',blob,o+48)
 sh.append(dict(nameoff=sh_name,type=sh_type,flags=sh_flags,addr=sh_addr,off=sh_offset,size=sh_size,link=sh_link,info=sh_info,align=sh_addralign,entsize=sh_entsize))
strtab=blob[sh[shstrndx]['off']:sh[shstrndx]['off']+sh[shstrndx]['size']]
for s in sh:
 end=strtab.find(b'\0',s['nameoff']); s['name']=strtab[s['nameoff']:end].decode('ascii','replace')
print('LOADS')
for s in ph:
 if s['type']==1: print(' ',{k:hex(v) if isinstance(v,int) else v for k,v in s.items()})
execs=[s for s in ph if s['type']==1 and s['ms'] and s['flags'] in (1,3,5,7)]
datas=[s for s in ph if s['type']==1 and s['ms'] and s['flags'] in (2,4,6)]
print('EXEC',len(execs),'DATA',len(datas))
for s in sh:
 if s['name'] in ('.dynsym','.dynstr','.rela.dyn','.rela.plt','.rodata','.data.rel.ro','.data','.bss'):
  print('SEC',s['name'],'off',hex(s['off']),'size',hex(s['size']),'addr',hex(s['addr']),'ent',s['entsize'])
# Apply known AArch64 RELA relocations like Il2CppDumper (ABS64, RELATIVE)
dyn=next(s for s in ph if s['type']==2)
dyntags={}
for o in range(dyn['off'],dyn['off']+dyn['fs'],16):
 tag=struct.unpack_from('<q',blob,o)[0]; val=U64(o+8)
 if tag==0: break
 dyntags[tag]=val
print('DYNAMIC tags', {hex(k):hex(v) for k,v in dyntags.items() if k in (4,5,6,7,8,9,10,11,17,18,19,20,23,2,3)})
dynsym=next(s for s in sh if s['name']=='.dynsym')
symbols=[]
for o in range(dynsym['off'],dynsym['off']+dynsym['size'],dynsym['entsize']):
 name,info,other,ndx=struct.unpack_from('<IBBH',blob,o); val,size=struct.unpack_from('<QQ',blob,o+8); symbols.append(val)
rel_addr=dyntags.get(7,0); rel_size=dyntags.get(8,0)
reltab=va_off(rel_addr)
rel_ok=collections.Counter(); rel_skip=collections.Counter()
for o in range(reltab,reltab+rel_size,24):
 r_offset,r_info,r_addend=struct.unpack_from('<QQq',blob,o)
 typ=r_info & 0xffffffff; sym=r_info>>32
 if typ==257: # R_AARCH64_ABS64
  value=(symbols[sym]+r_addend)&0xffffffffffffffff; rel_ok['ABS64']+=1
 elif typ==1027: # R_AARCH64_RELATIVE
  value=r_addend & 0xffffffffffffffff; rel_ok['RELATIVE']+=1
 else:
  rel_skip[typ]+=1; continue
 try: dst=va_off(r_offset); struct.pack_into('<Q',blob,dst,value)
 except Exception: rel_skip['unmapped']+=1
print('RELOC applied',dict(rel_ok),'skipped',dict(rel_skip))
# Search mscorlib.dll
target=b'mscorlib.dll\0'; occurrences=[]
for s in execs:
 start=s['off']; end=start+s['fs']; pos=start
 while True:
  pos=blob.find(target,pos,end)
  if pos<0: break
  occurrences.append((pos,s['va']+(pos-start)))
  pos+=1
print('mscorlib occurrences',len(occurrences),[(hex(o),hex(v)) for o,v in occurrences[:20]])
# index all word-aligned pointer values in data PT_LOAD, mapping VA targets to locations (VA)
refs=collections.defaultdict(list)
for s in datas:
 start=s['off']; end=min(start+s['fs'],len(blob))
 for off in range(start, end-7, 8):
  val=struct.unpack_from('<Q',blob,off)[0]
  if val: refs[val].append(s['va']+(off-start))
print('indexed data pointer slots',sum(map(len,refs.values())),'distinct targets',len(refs))
# Follow dumper's exact reference chain.
candidates=[]; traces=[]
for fo,dllva in occurrences:
 r1=refs.get(dllva,[])
 for refva in r1:
  r2=refs.get(refva,[])
  for refva2 in r2:
   for i in range(image_count-1,-1,-1):
    want=refva2-i*8
    for refva3 in refs.get(want,[]):
     try: prev=struct.unpack_from('<Q',blob,va_off(refva3-8))[0]
     except Exception: continue
     if prev==image_count:
      cand=refva3-14*8
      candidates.append(cand); traces.append((dllva,refva,refva2,i,refva3,prev,cand))
print('CODE REG CANDIDATES',len(candidates))
for tr in traces[:50]: print(' TRACE dll=%#x ref1=%#x ref2=%#x image_idx=%d ref3=%#x prev=%d candidate=%#x'%(tr))
# Probe candidate structure and related module name list
for cand in sorted(set(candidates)):
 try:
  fo=va_off(cand); vals=struct.unpack_from('<'+'Q'*14,blob,fo)
  print('CODE REG',hex(cand),'14Q=',[hex(x) for x in vals])
 except Exception as e: print('cand err',hex(cand),e)
