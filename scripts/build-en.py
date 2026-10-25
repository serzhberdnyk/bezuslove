"""Build static English pages from the maintained Russian pages and reviewed copy."""
from pathlib import Path
import json,re
root=Path(__file__).resolve().parents[1]
t=json.loads((root/'scripts/translations-en.json').read_text())
cards=json.loads((root/'scripts/service-translations-en.json').read_text())
def translate(s):
 # Replace as one pass so shorter phrases cannot alter completed translations.
 return re.sub('|'.join(map(re.escape,sorted(t,key=len,reverse=True))),lambda m:t[m.group()],s)
for suffix in ['', 'lyubov/']:
 p=root/'public'/suffix/'index.html';html=p.read_text()
 html=translate(html).replace('<html lang="ru">','<html lang="en">')
 html=html.replace('property="og:locale" content="ru_RU"','property="og:locale" content="en_US"')
 html=html.replace('property="og:locale:alternate" content="en_US"','property="og:locale:alternate" content="ru_RU"')
 html=html.replace('rel="canonical" href="https://bezuslove.com/"','rel="canonical" href="https://bezuslove.com/en/"')
 html=html.replace('property="og:url" content="https://bezuslove.com/"','property="og:url" content="https://bezuslove.com/en/"')
 html=re.sub(r'(data-language="ru"[^>]*?) aria-current="true"',r'\1',html).replace('data-language="en"','data-language="en" aria-current="true"')
 html=html.replace('src="/app.js"','src="/en/app.js"').replace('src="/lyubov/app.js"','src="/en/app.js"')
 n=[0]
 def details(m):
  i=n[0];n[0]+=1
  return m.group()[:-9]+'<details class="service-translation"><summary>Read the English translation</summary><div>'+cards[i]+'<p class="original-contact">Telegram: <a href="https://t.me/bezuslovno_love" target="_blank" rel="noopener noreferrer">bezuslovno_love</a></p></div></details></figure>'
 html=re.sub(r'<figure class="service-original">.*?</figure>',details,html,flags=re.S)
 assert n[0]==4
 # Only the native Russian language option may use Cyrillic on the English page.
 assert not re.search('[А-Яа-яЁё]',html.replace('aria-label="Русский"','')),re.findall('.{0,20}[А-Яа-яЁё].{0,40}',html)
 out=root/'public/en'/suffix/'index.html';out.parent.mkdir(parents=True,exist_ok=True);out.write_text(html)
js=translate((root/'public/app.js').read_text()).replace("remaining+' seconds of quiet'","remaining+(remaining===1?' second of quiet':' seconds of quiet')")
assert not re.search('[А-Яа-яЁё]',js)
(root/'public/en/app.js').write_text(js)
print('Built both English pages and interactive copy')
