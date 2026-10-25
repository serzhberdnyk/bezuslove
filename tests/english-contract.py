from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
import re,subprocess
base=Path('public')
class Page(HTMLParser):
 def __init__(self,s):super().__init__();self.tags=[];self.data=[];self.feed(s)
 def handle_starttag(self,t,a):self.tags.append((t,dict(a)))
 def handle_data(self,s):self.data.append(s)
for suffix in ['', 'lyubov/']:
 ru=base/suffix/'index.html';en=base/'en'/suffix/'index.html'
 original=subprocess.check_output(['git','show','a633b0283736f4141312e950d66d706c6129a060:'+str(ru)]).decode()
 R=Page(ru.read_text());E=Page(en.read_text());O=Page(original)
 cleaned=re.sub(r'<div class="language-switch".*?</div>','',ru.read_text())
 cleaned=re.sub(r'<figure class="project-support-qr">.*?</figure>','',cleaned)
 cleaned=cleaned.replace('Путь к себе практики','Путь к себе Практики')
 assert Page(cleaned).data==O.data,'Russian copy changed beyond the approved lowercase correction/QR caption'
 assert '<html lang="en">' in en.read_text()
 assert not re.search('[А-Яа-яЁё]',en.read_text().replace('aria-label="Русский"',''))
 images=lambda p:[a['src'] for t,a in p.tags if t=='img' and a['src']!='/assets/tbank-donation-qr.svg']
 assert images(O)==images(R)==images(E),'Original photos changed'
 links=lambda p:[a['href'] for t,a in p.tags if t=='a' and a.get('href','').startswith(('https:','mailto:','tel:'))]
 orig=links(O);new=links(E)
 assert all(new.count(x)>=orig.count(x) for x in orig),'External link lost'
 assert not any(t in ['form','input','iframe'] for t,a in E.tags),'Unexpected data collection'
 for lang,path in [('ru','https://bezuslove.com/'),('en','https://bezuslove.com/en/')]:
  assert any(t=='link' and a.get('hreflang')==lang and a.get('href')==path for t,a in E.tags)
 for t,a in E.tags:
  if t=='img':assert a.get('alt') and not re.search('[А-Яа-яЁё]',a['alt'])
  for k in ['src','href']:
   u=a.get(k,'');parsed=urlsplit(u)
   if u.startswith('/') and not u.startswith('//'):
    target=base/parsed.path.lstrip('/')
    assert target.is_file() or (target/'index.html').is_file(),(en,u)
  if a.get('target')=='_blank':assert {'noopener','noreferrer'}<=set(a.get('rel','').split())
 assert en.read_text().count('Read the English translation')==4
 assert 'Wallet address and network are available on request in a private message.' in en.read_text()
 assert 'https://tbank.ru/cf/9oCYecYk7tX' in en.read_text()
 assert 'RUB 1,000,000' in en.read_text() and 'RUB 9,437' in en.read_text()
 assert 'unclear on the original card' in en.read_text()
 assert 'aria-current="true"' in en.read_text()
 for name in ['title','description']:
  assert any(t==name or a.get('name')==name for t,a in E.tags)
for p in base.rglob('*'):
 if p.is_file() and p.suffix in ['.png','.jpg','.svg'] and p.name!='tbank-donation-qr.svg':
  assert subprocess.check_output(['git','show','a633b0283736f4141312e950d66d706c6129a060:'+str(p)])==p.read_bytes(),p
js=(base/'en/app.js').read_text()
assert not re.search('[А-Яа-яЁё]',js)
for s in ['do not replace medical care','not a reliable way to predict events','medical, financial or legal decisions','Stop if you feel uncomfortable']:
 assert s in js
css=(base/'locale.css').read_text()
for s in ['max-width:900px','max-width:500px','max-width:360px','min-height:44px']:assert s in css
print('PASS both RU/EN pages: Russian copy exact, 4 translated service transcripts, original image bytes/external links/support details unchanged, local links/meta/lang/alt/accessibility contracts, responsive CSS rules.')
