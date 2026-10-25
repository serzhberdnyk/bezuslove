from pathlib import Path
from html.parser import HTMLParser
class Links(HTMLParser):
 def __init__(self):super().__init__();self.links=[];self.tags=[]
 def handle_starttag(self,tag,attrs):
  self.tags.append(tag)
  if tag=='a':self.links.append(dict(attrs))
for root in [Path('public'),Path('public/lyubov')]:
 h=(root/'index.html').read_text();start=h.index('<aside class="project-support"');block=h[start:h.index('</aside>',start)+8];p=Links();p.feed(block)
 assert [a['href'] for a in p.links if a['href'].startswith('https:')]==['https://tbank.ru/cf/9oCYecYk7tX','https://t.me/bezuslovno_love']
 assert all(a['target']=='_blank' and set(a['rel'].split())=={'noopener','noreferrer'} for a in p.links)
 assert not set(p.tags)&{'form','input','iframe'}
 assert block.count('src="/assets/tbank-donation-qr.svg"')==1
 assert 'Номер договора' not in block and 'Игоревна' not in block
 assert 'Путь к себе практики' in h and 'Путь к себе Практики' not in h
 assert 'Поддержать проект через Т-Банк' in block
 assert 'Поддержать криптовалютой' in block
 assert 'Адрес кошелька и сеть - по запросу в личных сообщениях.' in block
 assert '@media(max-width:760px)' in (root/'style.css').read_text()
print('PASS supplied bank URL, crypto by personal request, root and legacy, responsive CSS')
