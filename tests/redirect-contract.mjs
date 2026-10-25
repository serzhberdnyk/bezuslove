import fs from 'node:fs';import path from 'node:path';
const source=fs.readFileSync('dist/server/index.js','utf8');const worker=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).default;
function walk(d){return fs.readdirSync(d,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(path.join(d,x.name)):[path.join(d,x.name)])}
for(const f of walk('public')){const u='/'+path.relative('public',f).split(path.sep).join('/');const r=await worker.fetch(new Request('https://bezuslove.com'+u));if(r.status!==200||!Buffer.from(await r.arrayBuffer()).equals(fs.readFileSync(f)))throw Error('Asset mismatch '+u)}
for(const route of ['/led-ekrany','/svetovye-vyveski','/uslugi/dizayn-i-pechat-poligrafii-sochi','/factoria','/factoria/demo/ergon'])for(const suffix of ['','/','/index.html']){const r=await worker.fetch(new Request('https://bezuslove.com'+route+suffix+'?utm_source=test'));if(r.status!==301||r.headers.get('location')!=='https://ra-xott.com'+route+'/?utm_source=test')throw Error('Redirect mismatch')}
for(const route of ['/','/lyubov/'])if((await worker.fetch(new Request('https://bezuslove.com'+route))).status!==200)throw Error('Personal path lost');
console.log('PASS all personal assets exact;15 permanent redirects preserve query;root and legacy personal remain200');
