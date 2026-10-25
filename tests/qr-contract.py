"""Validate the approved QR without logging or persisting its encoded payment URL."""
from pathlib import Path
from PIL import Image
import ctypes,hashlib,sys,xml.etree.ElementTree as ET
lib=ctypes.CDLL('libzbar.so.0');ptr=ctypes.c_void_p
for name,args,rest in [
 ('zbar_image_scanner_create',[],ptr),('zbar_image_scanner_set_config',[ptr,ctypes.c_int,ctypes.c_int,ctypes.c_int],ctypes.c_int),
 ('zbar_image_create',[],ptr),('zbar_image_set_format',[ptr,ctypes.c_ulong],None),('zbar_image_set_size',[ptr,ctypes.c_uint,ctypes.c_uint],None),
 ('zbar_image_set_data',[ptr,ptr,ctypes.c_ulong,ptr],None),('zbar_scan_image',[ptr,ptr],ctypes.c_int),('zbar_image_first_symbol',[ptr],ptr),
 ('zbar_symbol_get_data',[ptr],ctypes.c_char_p),('zbar_image_destroy',[ptr],None),('zbar_image_scanner_destroy',[ptr],None)]:
 f=getattr(lib,name);f.argtypes=args;f.restype=rest
expected='259e83490eb920b7f7e486a9caba40f0887b4a4465bb0965d8dedab3e5389405'
paths=sys.argv[1:];assert paths,'Pass rendered local PNG paths.'
for p in paths:
 im=Image.open(p).convert('L');data=im.tobytes();buf=ctypes.create_string_buffer(data)
 scanner=lib.zbar_image_scanner_create();lib.zbar_image_scanner_set_config(scanner,0,0,1)
 img=lib.zbar_image_create();lib.zbar_image_set_format(img,0x30303859);lib.zbar_image_set_size(img,*im.size);lib.zbar_image_set_data(img,buf,len(data),None)
 assert lib.zbar_scan_image(scanner,img)==1,'QR must decode exactly once'
 payload=lib.zbar_symbol_get_data(lib.zbar_image_first_symbol(img))
 assert hashlib.sha256(payload).hexdigest()==expected,'QR must match the approved payload exactly'
 lib.zbar_image_destroy(img);lib.zbar_image_scanner_destroy(scanner)
svg=Path('public/assets/tbank-donation-qr.svg').read_text();doc=ET.fromstring(svg)
assert doc.attrib['viewBox']=='0 0 41 41'
assert set(e.tag.split('}')[-1] for e in doc.iter())=={'svg','title','rect','path'}
assert ''.join(doc.itertext()).strip()=='Donation QR code'
assert 'href' not in svg and '<image' not in svg and 'data:' not in svg
print(f'PASS exact approved QR payload in {len(paths)} rendered sizes; QR-only SVG has no screenshot, recipient name, contract number or embedded URL text.')
