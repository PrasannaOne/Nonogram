import struct,csv,json
from pathlib import Path
root=Path('/mnt/data/v10_stage/nonogram_v8_work/nonogram_v3/REFERENCE')
b=bytearray((root/'split_config.arm64_v8a/lib/arm64-v8a/libil2cpp.so').read_bytes());m=(root/'assets/bin/Data/Managed/Metadata/global-metadata.dat').read_bytes()
u16=lambda o:struct.unpack_from('<H',b,o)[0];u32=lambda o:struct.unpack_from('<I',b,o)[0];u64=lambda o:struct.unpack_from('<Q',b,o)[0]
phoff=u64(32);pe=u16(54);pn=u16(56);loads=[]
for i in range(pn):
 o=phoff+i*pe;t,fl=struct.unpack_from('<II',b,o);off,va,pa,fs,ms,al=struct.unpack_from('<QQQQQQ',b,o+8)
 if t==1 and ms:loads.append((fl,off,va,fs,ms))
def vo(v):
 for fl,off,va,fs,ms in loads:
  if va<=v<va+fs:return v-va+off
 raise ValueError(hex(v))
# ELF relocs
shoff=u64(40);se=u16(58);sn=u16(60);ss=u16(62);sections=[]
for i in range(sn):
 o=shoff+i*se;nm,ty=struct.unpack_from('<II',b,o);fl,ad,off,size=struct.unpack_from('<QQQQ',b,o+8);link,info=struct.unpack_from('<II',b,o+40);al,ent=struct.unpack_from('<QQ',b,o+48);sections.append((nm,ty,off,size,ent,link))
stsec=sections[ss];st=bytes(b[stsec[2]:stsec[2]+stsec[3]])
symtab=[]
for x in sections:
 e=st.find(b'\0',x[0]);name=st[x[0]:e].decode(errors='replace')
 if name=='.dynsym':
  for o in range(x[2],x[2]+x[3],x[4]):
   ni,inf,oth,ndx=struct.unpack_from('<IBBH',b,o);v,z=struct.unpack_from('<QQ',b,o+8);symtab.append(v)
for i in range(pn):
 o=phoff+i*pe
 if u32(o)==2:do=u64(o+8);ds=u64(o+32);break
T={}
for o in range(do,do+ds,16):
 t=struct.unpack_from('<q',b,o)[0];v=u64(o+8)
 if t==0:break
 T[t]=v
for o in range(vo(T[7]),vo(T[7])+T[8],24):
 ro,ri,ra=struct.unpack_from('<QQq',b,o);t=ri&0xffffffff;s=ri>>32
 if t==1027:v=ra&((1<<64)-1)
 elif t==257 and s<len(symtab):v=(symtab[s]+ra)&((1<<64)-1)
 else:continue
 try:struct.pack_into('<Q',b,vo(ro),v)
 except:pass
H=[struct.unpack_from('<II',m,8+i*8) for i in range(31)]
str_off,str_sz=H[2];field_off,field_sz=H[11];type_off,type_sz=H[19];method_off,method_sz=H[5]
def s(i):
 p=str_off+i;e=m.find(b'\0',p,str_off+str_sz);return m[p:e].decode('utf8','replace')
# metareg
mr=0x19e8620; q=[u64(vo(mr+i*8)) for i in range(16)]; fieldoff_ptrs=q[11]; type_count=type_sz//88
# decode
want={'NonogramLevel','EasyGamemode','LocalStorageSystem','LevelManager','User','UndoStack','Tile','LevelInfo'}
for ti in range(type_count):
 o=type_off+ti*88; nameidx,nsidx=struct.unpack_from('<II',m,o); fs=struct.unpack_from('<i',m,o+32)[0]; ms=struct.unpack_from('<i',m,o+36)[0]; mc=struct.unpack_from('<H',m,o+64)[0]; fc=struct.unpack_from('<H',m,o+68)[0]
 name=s(nameidx);ns=s(nsidx)
 if name not in want:continue
 ptr=u64(vo(fieldoff_ptrs+ti*8)); offs=[]
 try: offs=[struct.unpack_from('<i',b,vo(ptr+j*4))[0] for j in range(fc)] if ptr else []
 except Exception as e: offs=[]
 print(f'\nTYPE {ns}.{name} index={ti} fieldStart={fs} fields={fc} fieldOffsetsPtr={hex(ptr)}')
 for j in range(fc):
  fo=field_off+(fs+j)*12; name_i,type_i,tok=struct.unpack_from('<I i I',m,fo)
  print(f' {j:2} {s(name_i):24} offset={offs[j] if j<len(offs) else "?"} typeIndex={type_i} token=0x{tok:08x}')
# method impl metadata for LocalStorageSystem etc
print('\nMETHOD METADATA:')
for ti in range(type_count):
 o=type_off+ti*88;nameidx,nsidx=struct.unpack_from('<II',m,o);fs=struct.unpack_from('<i',m,o+32)[0];ms=struct.unpack_from('<i',m,o+36)[0];mc=struct.unpack_from('<H',m,o+64)[0]
 if s(nameidx) not in {'LocalStorageSystem','IStorageSystem','User'}:continue
 for j in range(mc):
  mi=ms+j; mo=method_off+mi*32; name_idx,decl,ret,par,generic,token=struct.unpack_from('<IiiIiI',m,mo);flags,iflags,slot,pc=struct.unpack_from('<4H',m,mo+24)
  print(s(nameidx),s(nameidx),s(name_idx),hex(token),f'flags={flags:#x}',f'iflags={iflags:#x}',f'slot={slot}',f'params={pc}',f'method_idx={mi}')
