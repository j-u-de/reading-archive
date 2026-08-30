import json, os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib import request, parse
for line in open('.env.local',encoding='utf-8') if os.path.exists('.env.local') else []:
    if '=' in line and not line.lstrip().startswith('#'):
        k,v=line.strip().split('=',1); os.environ.setdefault(k,v)
def upstream(p):
    kind=p.get('kind')
    if kind=='mcp': kind='openlibrary'
    if kind=='ai':
        base=os.getenv('AI_BASE_URL','https://api.deepseek.com/v1').rstrip('/'); body=json.dumps(p.get('body',{}),ensure_ascii=True).encode('ascii'); req=request.Request(base+'/chat/completions',data=body,headers={'Authorization':'Bearer '+os.getenv('AI_API_KEY',''),'Content-Type':'application/json'})
    elif kind=='openlibrary':
        q=parse.quote(str(p.get('query',''))); req=request.Request(f'https://openlibrary.org/search.json?q={q}&limit=8',headers={'User-Agent':'ReadingArchive/1.0'})
    elif kind in ('books','cover'):
        value=str(p.get('isbn') or p.get('query','')); q=parse.quote(value); key=os.getenv('GOOGLE_BOOKS_API_KEY',''); prefix='isbn:' if p.get('isbn') else ''; req=request.Request(f'https://www.googleapis.com/books/v1/volumes?q={prefix}{q}&maxResults=1'+(f'&key={key}' if key else ''),headers={'User-Agent':'ReadingArchive/1.0'})
    else: raise ValueError('unsupported kind')
    with request.urlopen(req,timeout=45) as r:return json.loads(r.read().decode())
class Handler(BaseHTTPRequestHandler):
    def log_message(self,*a): pass
    def do_GET(self):
        self.send_response(200); self.send_header('Content-Type','application/json'); self.end_headers(); self.wfile.write(b'{"ok":true,"service":"reading-archive-python"}')
    def do_POST(self):
        try: n=int(self.headers.get('Content-Length','0')); out={'ok':True,'data':upstream(json.loads(self.rfile.read(n)))}; code=200
        except Exception as e: out={'ok':False,'error':str(e)}; code=502
        self.send_response(code); self.send_header('Content-Type','application/json'); self.end_headers(); self.wfile.write(json.dumps(out,ensure_ascii=True).encode())
ThreadingHTTPServer(('127.0.0.1',8765),Handler).serve_forever()
