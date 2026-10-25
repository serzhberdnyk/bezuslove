from pathlib import Path
import json,hashlib,base64,mimetypes,gzip,shutil
root=Path('public'); blobs={};routes={}
for p in root.rglob('*'):
 if not p.is_file():continue
 b=p.read_bytes();key=hashlib.sha256(b).hexdigest();blobs[key]=base64.b64encode(b).decode();url='/'+p.relative_to(root).as_posix();typ=mimetypes.guess_type(str(p))[0] or 'application/octet-stream';routes[url]=[key,typ]
 if url.endswith('/index.html'):routes[url[:-10]]=routes[url];routes[url[:-11] or '/']=routes[url]
redirects={}
for path in ['/led-ekrany','/svetovye-vyveski','/uslugi/dizayn-i-pechat-poligrafii-sochi','/factoria','/factoria/demo/ergon']:
 for suffix in ['','/','/index.html']:redirects[path+suffix]='https://ra-xott.com'+path+'/'
s='const blobs='+json.dumps(blobs,separators=(',',':'))+';\nconst routes='+json.dumps(routes,separators=(',',':'))+';\nconst redirects='+json.dumps(redirects,separators=(',',':'))+''';
export default {async fetch(request){
 const url=new URL(request.url);
 if(redirects[url.pathname]) return Response.redirect(redirects[url.pathname]+url.search,301);
 if(!['GET','HEAD'].includes(request.method)) return new Response('Method Not Allowed',{status:405,headers:{Allow:'GET, HEAD'}});
 const item=routes[url.pathname];
 if(!item) return new Response('Not found',{status:404,headers:{'Content-Type':'text/plain; charset=utf-8'}});
 const headers={'Content-Type':item[1]+(item[1].startsWith('text/')?'; charset=utf-8':''),'Cache-Control':item[1]==='text/html'?'public,max-age=0,must-revalidate':'public,max-age=3600'};
 const body=request.method==='HEAD'?null:Uint8Array.from(atob(blobs[item[0]]),c=>c.charCodeAt(0));
 return new Response(body,{status:200,headers});
}};
'''
shutil.rmtree('dist',ignore_errors=True)
p=Path('dist/server');p.mkdir(parents=True,exist_ok=True);(p/'index.js').write_text(s);meta=Path('dist/.openai');meta.mkdir(exist_ok=True);(meta/'hosting.json').write_bytes(Path('.openai/hosting.json').read_bytes());print('Worker bytes',len(s.encode()),'gzip bytes',len(gzip.compress(s.encode())),'unique blobs',len(blobs),'routes',len(routes))
