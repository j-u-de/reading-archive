"""Small, dependency-free Python API for live book search.

Run with: python reading_archive_api.py
The service intentionally uses public Open Library data and requires no API key.
"""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, quote, urlparse
from urllib.request import Request, urlopen
import json

import os
HOST, PORT = "127.0.0.1", int(os.getenv("READING_API_PORT", "8787"))

def search_books(query: str):
    url = f"https://openlibrary.org/search.json?q={quote(query)}&limit=10"
    req = Request(url, headers={"User-Agent": "ReadingArchive/1.0 (personal app)"})
    try:
        with urlopen(req, timeout=12) as response:
            payload = json.load(response)
    except Exception:
        # Google Books is a genuine secondary source; an API key is optional.
        google = Request(
            f"https://www.googleapis.com/books/v1/volumes?q={quote(query)}&maxResults=10",
            headers={"User-Agent": "ReadingArchive/1.0"},
        )
        with urlopen(google, timeout=12) as response:
            data = json.load(response)
        return [google_book(x) for x in data.get("items", [])]
    books = []
    for item in payload.get("docs", []):
        isbn = (item.get("isbn") or [None])[0]
        cover = item.get("cover_i")
        books.append({
            "id": item.get("key", ""), "title": item.get("title", "未命名"),
            "author": (item.get("author_name") or [None])[0],
            "publisher": (item.get("publisher") or [None])[0],
            "publish_year": item.get("first_publish_year"), "isbn": isbn,
            "cover_url": f"https://covers.openlibrary.org/b/id/{cover}-M.jpg" if cover else None,
        })
    return books

def google_book(item):
    info = item.get("volumeInfo", {})
    identifiers = info.get("industryIdentifiers", [])
    return {"id": "google-" + item.get("id", ""), "title": info.get("title", "未命名"),
            "author": (info.get("authors") or [None])[0], "publisher": info.get("publisher"),
            "publish_year": int(info["publishedDate"][:4]) if info.get("publishedDate", "")[:4].isdigit() else None,
            "isbn": identifiers[0].get("identifier") if identifiers else None,
            "cover_url": (info.get("imageLinks") or {}).get("thumbnail")}

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_): pass
    def send_json(self, data, status=200):
        raw = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(status); self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*"); self.send_header("Content-Length", str(len(raw))); self.end_headers(); self.wfile.write(raw)
    def do_GET(self):
        if urlparse(self.path).path == "/health": return self.send_json({"ok": True, "service": "reading-archive-python"})
        if urlparse(self.path).path != "/search": return self.send_json({"error": "not found"}, 404)
        query = parse_qs(urlparse(self.path).query).get("q", [""])[0].strip()[:120]
        if not query: return self.send_json({"results": [], "error": "请输入书名或 ISBN"}, 400)
        try: return self.send_json({"query": query, "results": search_books(query), "source": "openlibrary"})
        except Exception as exc: return self.send_json({"results": [], "source": "unavailable", "error": str(exc)}, 502)
    def do_POST(self):
        # Compatibility with the existing Next.js Python proxy contract.
        if urlparse(self.path).path != "/": return self.send_json({"error": "not found"}, 404)
        try:
            size = int(self.headers.get("Content-Length", "0"))
            body = json.loads(self.rfile.read(size) or b"{}")
            if body.get("kind") != "books": return self.send_json({"ok": False, "error": "unsupported kind"}, 400)
            items = [{"id": b["id"], "volumeInfo": {"title": b["title"], "authors": [b["author"]] if b.get("author") else []}} for b in search_books(str(body.get("query", "")))]
            return self.send_json({"ok": True, "data": {"items": items}})
        except Exception as exc: return self.send_json({"ok": False, "error": str(exc)}, 502)

if __name__ == "__main__":
    print(f"Reading Archive API listening on http://{HOST}:{PORT}")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
