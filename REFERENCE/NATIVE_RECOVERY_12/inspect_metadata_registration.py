import struct, json
from pathlib import Path
elf=Path('/mnt/data/v10_stage/nonogram_v8_work/nonogram_v3/REFERENCE/split_config.arm64_v8a/lib/arm64-v8a/libil2cpp.so').read_bytes(); b=bytearray(elf)
meta=Path('/mnt/data/v10_stage/nonogram_v8_work/nonogram_v3/REFERENCE/assets/bin/Data/Managed/Metadata/global-metadata.dat').read_bytes()
U16=lambda o:struct.unpack_from('<H',b,o)[0]; U32=lambda o:struct.unpack_from('<I',b,o)[0]; U64=lambda o:struct.unpack_from('<Q',b,o)[0]
phoff=U64(32); phents=U16(54); phnum=U16(56)
loads=[]
for i in range(phnum):
 o=phoff+i*phents; typ,flags=struct.unpack_from('<II',b,o); off,va,pa,fs,ms,al=struct.unpack_from('<QQQQQQ',b,o+8)
 if typ==1 and ms: loads.append((flags,off,va,fs,ms))
def vaoff(va):
 for fl,off,addr,fs,ms in loads:
  if addr<=va<addr+fs:return va-addr+off
 raise ValueError(hex(va))
# apply relocations same method as mapper
shoff=U64(40); shents=U16(58); shnum=U16(60); shstrndx=U16(62)
sh=[]
for i in range(shnum):
 o=shoff+i*shents; nm,ty=struct.unpack_from('<II',b,o); fl,addr,off,size=struct.unpack_from('<QQQQ',b,o+8); link,info=struct.unpack_from('<II',b,o+40); al,ent=struct.unpack_from('<QQ',b,o+48); sh.append(dict(nm=nm,ty=ty,off=off,size=size,ent=ent,link=link,addr=addr))
ss=sh[shstrndx]; st=bytes(b[ss['off']:ss['off']+ss['size']])
for s in sh:
 e=st.find(b'\0',s['nm']); s['name']=st[s['nm']:e].decode(errors='replace')
symsec=next(x for x in sh if x['name']=='.dynsym'); syms=[]
for o in range(symsec['off'],symsec['off']+symsec['size'],symsec['ent']):
 n,inf,oth,ndx=struct.unpack_from('<IBBH',b,o); val,size=struct.unpack_from('<QQ',b,o+8); syms.append(val)
dyn=next(x for x in range(phnum) if False) if False else None
for i in range(phnum):
 o=phoff+i*phents; typ=U32(o); 
 if typ==2: do,ds=U64(o+8),U64(o+32); break
tags={}
for o in range(do,do+ds,16):
 tag=struct.unpack_from('<q',b,o)[0]; val=U64(o+8)
 if tag==0:break
 tags[tag]=val
if 7 in tags:
 off=vaoff(tags[7]); end=off+tags[8]
 for o in range(off,end,24):
  ro,ri,ra=struct.unpack_from('<QQq',b,o); typ=ri&0xffffffff; si=ri>>32
  if typ==1027: v=ra&0xffffffffffffffff
  elif typ==257 and si<len(syms):v=(syms[si]+ra)&0xffffffffffffffff
  else:continue
  try:struct.pack_into('<Q',b,vaoff(ro),v)
  except:pass
# metadata type count
H=[struct.unpack_from('<II',meta,8+i*8) for i in range(31)]
type_count=H[19][1]//88
# segments
execs=[x for x in loads if x[0] in (1,3,5,7)]; datas=[x for x in loads if x[0] in (2,4,6)]
refs={}
for fl,off,va,fs,ms in datas:
 for pos in range(off,min(off+fs,len(b))-7,8):
  v=struct.unpack_from('<Q',b,pos)[0]
  if v:refs.setdefault(v,[]).append(va+(pos-off))
cands=[]; eq=[]; tested=0
for fl,off,va,fs,ms in datas:
 for pos in range(off,min(off+fs,len(b))-24,8):
  if struct.unpack_from('<Q',b,pos)[0]==type_count and struct.unpack_from('<Q',b,pos+16)[0]==type_count:
   eq.append((va+(pos-off),struct.unpack_from('<Q',b,pos+24)[0]))
   ptr=struct.unpack_from('<Q',b,pos+24)[0]
   try: arr=[struct.unpack_from('<Q',b,vaoff(ptr+j*8))[0] for j in range(type_count)]
   except Exception:continue
   if all(any(x<=p<x+sz for f,o,x,fs2,sz in execs) for p in arr):
    cand=va+(pos-off)-80
    cands.append((cand,va+(pos-off),ptr,arr[:5],arr[-5:]))
print('type_count',type_count,'metadata registration candidates',len(cands),'equal count pairs',len(eq)); print('sample pairs',[(hex(a),hex(p)) for a,p in eq[:30]])
for c in cands:
 print('base',hex(c[0]),'types-size-fields',hex(c[1]),'candidate pointer',hex(c[2]),'pointer samples',*[list(map(hex,c[3])),list(map(hex,c[4]))])
 if len(cands)==1:
  base=c[0]; p=vaoff(base); q=list(struct.unpack_from('<16Q',b,p))
  print('q fields:')
  for i,v in enumerate(q):print(i,hex(v),v)
  for label,ci,pi in [('genericClasses',0,1),('genericInsts',2,3),('genericMethodTable',4,5),('types',6,7),('methodSpecs',8,9),('fieldOffsets',10,11),('typeDefinitionsSizes',12,13),('metadataUsages',14,15)]:
   cnt=q[ci]; ptr=q[pi]; print(label,'count',cnt,'ptr',hex(ptr))
