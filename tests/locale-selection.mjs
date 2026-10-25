import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync(process.env.LOCALE_SCRIPT || new URL('../public/locale.js',import.meta.url),'utf8');
const KEY='bezuslove:language:v1';
const stored=(locale,updatedAt=1)=>JSON.stringify({locale,updatedAt});
const memory=(initial={},mode='ok')=>({
 data:{...initial},writes:0,
 getItem(k){if(mode==='blocked')throw Error('SecurityError');return this.data[k]??null},
 setItem(k,v){if(mode==='blocked'||mode==='readonly')throw Error('QuotaExceededError');if(mode==='silent')return;this.writes++;this.data[k]=v}
});
let runs=0;
function run({url='https://bezuslove.com/',languages=['ru-RU'],language='ru',local=memory(),session=memory(),storageGetterBlocked=false,historyBlocked=false,priorState={},navigationType='navigate'}={}){
 runs++;
 let location=new URL(url);const redirects=[],history=[];
 const window={navigator:{languages,language},performance:{getEntriesByType:()=>[{type:navigationType}]},events:{},addEventListener(k,f){this.events[k]=f}};
 Object.defineProperty(window,'location',{value:{get pathname(){return location.pathname},get search(){return location.search},get hash(){return location.hash},replace(target){redirects.push(target);location=new URL(target,location)}}});
 for(const [name,storage] of [['localStorage',local],['sessionStorage',session]]) Object.defineProperty(window,name,{get(){if(storageGetterBlocked)throw Error('SecurityError');return storage}});
 window.history={state:{existingState:true,...priorState},replaceState(state,title,target){if(historyBlocked)throw Error('SecurityError');assert.equal(state.existingState,true);this.state=state;if(target!==undefined){history.push(target);location=new URL(target,location)}}};
 const route=location.pathname.replace(/^\/en(?=\/)/,'');
 const links=[route,'/en'+route].map(path=>({attrs:{'data-language-path':path},events:{},getAttribute(k){return this.attrs[k]},setAttribute(k,v){this.attrs[k]=v},addEventListener(k,f){this.events[k]=f}}));
 vm.runInNewContext(source,{window,document:{querySelectorAll:selector=>selector==='[data-language-path]'?links:[],querySelector:()=>null,addEventListener:(name,fn)=>{if(name==='DOMContentLoaded')fn()}},Date,JSON,Number});
 return {window,links,local,session,redirects,history,get url(){return location.href},setURL(url){location=new URL(url)}};
}
function auto(languages,expected,extra={}){const r=run({languages,...extra});assert.deepEqual(r.redirects,expected==='en'?['/en/']:[]);assert.equal(r.local.writes+r.session.writes,0);return r}
for(const languages of [['ru'],['ru-RU'],['ru-UA','en-GB'],['de-DE','ru-RU','en-US'],['RU_ru','en']])auto(languages,'ru');
for(const languages of [['en'],['en-GB'],['en-US','ru'],['fr','en','ru'],['fr','de'],['zh-Hans'],['uk-UA'],['']])auto(languages,'en');
auto([],'en',{language:'en-US'});auto([],'ru',{language:'ru'});auto(null,'en',{language:'en'});
// Saved manual preference beats the browser, independent of visit/session.
assert.equal(run({languages:['en'],local:memory({[KEY]:stored('ru')})}).redirects.length,0);
assert.deepEqual(run({languages:['ru'],local:memory({[KEY]:stored('en')})}).redirects,['/en/']);
assert.equal(run({languages:['en'],local:memory({[KEY]:'corrupt'}),session:memory({[KEY]:stored('ru',2)})}).redirects.length,0);
assert.equal(run({languages:['en'],local:memory({[KEY]:stored('en',1)}),session:memory({[KEY]:stored('ru',2)})}).redirects.length,0);
assert.deepEqual(run({languages:['ru'],local:memory({[KEY]:stored('en',3)}),session:memory({[KEY]:stored('ru',2)})}).redirects,['/en/']);
// Direct EN and service URLs stay explicit, with no inferred manual preference.
for(const path of ['/en/','/en/led-ekrany/','/led-ekrany/','/factoria/','/en/factoria/demo/ergon/']){
 const r=run({url:'https://bezuslove.com'+path,languages:['ru'],local:memory({[KEY]:stored('ru')})});assert.deepEqual(r.redirects,[]);assert.equal(r.local.writes,0);
}
assert.deepEqual(run({url:'https://bezuslove.com/en/?bez_lang=ru',languages:['ru']}).redirects,[]);
// Browser redirect preserves exact unrelated bytes and fragment, replaces history once.
const raw='?a=hello%20world&a=hello+world&&signed=x%2By%2Fz&';
const autoEN=run({url:'https://bezuslove.com/'+raw+'#contacts',languages:['en']});
assert.deepEqual(autoEN.redirects,['/en/'+raw+'#contacts']);assert.equal(autoEN.history.length,0);
assert.deepEqual(run({url:autoEN.url,languages:['en']}).redirects,[]);
// Intent is not recorded merely on focus/pointerdown; native click is not prevented.
const en=run({url:'https://bezuslove.com/en/'+raw+'#contacts',languages:['en']});
assert.equal(en.links[0].attrs.href,'/'+raw+'&bez_lang=ru#contacts');
en.links[0].events.focus();en.links[0].events.pointerdown();assert.equal(en.local.writes,0);
en.links[0].events.click({defaultPrevented:true});assert.equal(en.local.writes,0);
en.links[0].events.click({});assert.equal(JSON.parse(en.local.data[KEY]).locale,'ru');
const ru=run({url:new URL(en.links[0].attrs.href,'https://bezuslove.com').href,languages:['en'],local:en.local,session:en.session});
assert.deepEqual(ru.redirects,[]);assert.equal(ru.url,'https://bezuslove.com/'+raw+'#contacts');assert.equal(ru.history.length,1);
assert.equal(run({languages:['en'],local:ru.local}).redirects.length,0);
// Context menu/new-tab links record a manual choice on destination without source click.
const newTab=run({url:'https://bezuslove.com/en/?utm_source=test&bez_lang=en#services',languages:['ru']});
assert.equal(JSON.parse(newTab.local.data[KEY]).locale,'en');assert.equal(newTab.url,'https://bezuslove.com/en/?utm_source=test#services');
assert.deepEqual(run({languages:['ru'],local:newTab.local}).redirects,['/en/']);
// Private/blocked/silent/quota-limited storage never throws or bounces RU back to EN.
for(const mode of ['blocked','silent','readonly']){
 const local=memory({[KEY]:stored('en')},mode),session=memory({},mode);
 const r=run({url:'https://bezuslove.com/?utm=x&bez_lang=ru#contacts',languages:['en'],local,session});
 assert.deepEqual(r.redirects,[]);assert.equal(r.url,'https://bezuslove.com/?utm=x&bez_lang=ru#contacts');assert.equal(r.history.length,0);
 assert.equal(run({url:r.url,languages:['en'],local,session}).redirects.length,0);
}
assert.deepEqual(run({languages:['en'],storageGetterBlocked:true}).redirects,['/en/']);
assert.deepEqual(run({url:'https://bezuslove.com/?utm=x&bez_lang=en#contacts',languages:['ru'],storageGetterBlocked:true}).redirects,['/en/?utm=x&bez_lang=en#contacts']);
assert.equal(run({url:'https://bezuslove.com/?bez_lang=ru',languages:['en'],storageGetterBlocked:true}).redirects.length,0);
// A new session fallback outranks stale readable localStorage after a failed write.
const fallbackLocal=memory({[KEY]:stored('en')},'readonly'), fallbackSession=memory();
const fallback=run({url:'https://bezuslove.com/?bez_lang=ru',languages:['en'],local:fallbackLocal,session:fallbackSession});
assert.equal(fallback.url,'https://bezuslove.com/');assert.equal(run({languages:['en'],local:fallbackLocal,session:fallbackSession}).redirects.length,0);
// A denied history operation leaves a harmless explicit marker, without errors/loops.
assert.equal(run({url:'https://bezuslove.com/?bez_lang=ru#contacts',languages:['en'],historyBlocked:true}).redirects.length,0);
// Bad/duplicate markers and data cannot create an open redirect or corrupt query data.
assert.deepEqual(run({url:'https://bezuslove.com/?bez_lang=https%3A%2F%2Fevil.invalid&x=%ZZ',languages:['en']}).redirects,['/en/?x=%ZZ']);
const dedup=run({url:'https://bezuslove.com/?x=1&bez_lang=ru&bez_lang=en#contacts',languages:['en']});
assert.equal(dedup.url,'https://bezuslove.com/?x=1#contacts');assert.equal(dedup.redirects.length,0);
for(const value of ['{}','null',stored('xx'),'{"locale":"ru","updatedAt":null}']) assert.deepEqual(run({languages:['en'],local:memory({[KEY]:value})}).redirects,['/en/']);
// Same-page hash/history changes refresh links without changing language or recording preference.
const hooks=run({url:'https://bezuslove.com/led-ekrany/?a=1#old',languages:['en']});
hooks.setURL('https://bezuslove.com/led-ekrany/?a=2#new');hooks.window.events.hashchange();assert.equal(hooks.links[1].attrs.href,'/en/led-ekrany/?a=2&bez_lang=en#new');
hooks.setURL('https://bezuslove.com/led-ekrany/');hooks.window.events.popstate();assert.equal(hooks.links[0].attrs.href,'/led-ekrany/?bez_lang=ru');assert.equal(hooks.local.writes,0);
assert.deepEqual(run({languages:['en'],priorState:{bezusloveLocale:'ru'}}).redirects,[]);
assert.deepEqual(run({languages:['en'],navigationType:'back_forward'}).redirects,[]);
assert.deepEqual(run({url:'https://bezuslove.com/index.html?x=a%20b#about',languages:['en']}).redirects,['/en/?x=a%20b#about']);
console.log(`PASS locale matrix: ${runs} synthetic loads; ordered ru/en/mixed, explicit URLs, manual return/new-tab, exact query/hash, history replacement, blocked storage, no redirect loops.`);
