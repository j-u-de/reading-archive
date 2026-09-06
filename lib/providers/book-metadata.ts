export type BookCandidate = {
  id: string;
  title: string;
  author?: string;
  cover_url?: string;
  description?: string;
  publisher?: string;
  publish_year?: number;
  isbn?: string;
  total_pages?: number;
};

import { pythonProxy } from "./python-proxy";

export interface BookMetadataProvider {
  searchBooks(query: string): Promise<BookCandidate[]>;
  getBookDetail(id: string): Promise<BookCandidate | null>;
  enrichBook(book: BookCandidate): Promise<BookCandidate>;
}

const jsonFetch = async (url: string) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { accept: "application/json", "user-agent": "ReadingArchive/1.0" } });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
};

const openLibraryDirectSearch = async (query: string) => {
  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "8");
  return jsonFetch(url.toString());
};

const googleBooksDirectSearch = async (query: string, isbn?: string) => {
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", isbn ? `isbn:${isbn}` : query);
  url.searchParams.set("maxResults", "1");
  return jsonFetch(url.toString());
};

export class OpenLibraryProvider implements BookMetadataProvider {
  async searchBooks(query: string) {
    try {
      const data = await openLibraryDirectSearch(query);
      if (Array.isArray(data.docs) && data.docs.length) {
        return data.docs.map((x: any) => ({
          id: x.key,
          title: x.title,
          author: x.author_name?.[0],
          publish_year: x.first_publish_year,
          isbn: x.isbn?.[0],
          publisher: x.publisher?.[0],
        }));
      }
    } catch {}
    try {
      const data = await pythonProxy({ kind: "openlibrary", query });
      return (data.docs || []).map((x: any) => ({
        id: x.key,
        title: x.title,
        author: x.author_name?.[0],
        publish_year: x.first_publish_year,
        isbn: x.isbn?.[0],
        publisher: x.publisher?.[0],
      }));
    } catch {
      return [];
    }
  }

  async getBookDetail(_id: string) {
    return null;
  }

  async enrichBook(book: BookCandidate) {
    return book;
  }
}

export class GoogleBooksProvider implements BookMetadataProvider {
  async searchBooks(query: string) {
    try {
      const data = await googleBooksDirectSearch(query);
      if (Array.isArray(data.items)) {
        return data.items.map((x: { id: string; volumeInfo?: any }) => ({
          id: `google-${x.id}`,
          title: x.volumeInfo?.title || query,
          author: x.volumeInfo?.authors?.[0],
          publish_year: x.volumeInfo?.publishedDate ? Number(x.volumeInfo.publishedDate.slice(0, 4)) : undefined,
          description: x.volumeInfo?.description,
          publisher: x.volumeInfo?.publisher,
          cover_url: x.volumeInfo?.imageLinks?.thumbnail,
          isbn: x.volumeInfo?.industryIdentifiers?.[0]?.identifier,
        }));
      }
    } catch {}
    try {
      const data = await pythonProxy({ kind: "books", query });
      return (data.items || []).map((x: { id: string; volumeInfo?: any }) => ({
        id: `google-${x.id}`,
        title: x.volumeInfo?.title || query,
        author: x.volumeInfo?.authors?.[0],
        publish_year: x.volumeInfo?.publishedDate ? Number(x.volumeInfo.publishedDate.slice(0, 4)) : undefined,
        description: x.volumeInfo?.description,
        publisher: x.volumeInfo?.publisher,
        cover_url: x.volumeInfo?.imageLinks?.thumbnail,
        isbn: x.volumeInfo?.industryIdentifiers?.[0]?.identifier,
      }));
    } catch {
      return [];
    }
  }

  async getBookDetail() {
    return null;
  }

  async enrichBook(book: BookCandidate) {
    return book;
  }
}

export class FallbackBookMetadataProvider implements BookMetadataProvider {
  async searchBooks(_query: string) {
    return [];
  }

  async getBookDetail(_id: string) {
    return null;
  }

  async enrichBook(book: BookCandidate) {
    return book;
  }
}

export class ResilientBookMetadataProvider implements BookMetadataProvider {
  private fallback = new FallbackBookMetadataProvider();
  private remote = new OpenLibraryProvider();
  private secondary = new GoogleBooksProvider();

  async searchBooks(q: string) {
    try {
      const result = await this.remote.searchBooks(q);
      if (result.length) return result;
    } catch {}
    try {
      const result = await this.secondary.searchBooks(q);
      if (result.length) return result;
    } catch {}
    return this.fallback.searchBooks(q);
  }

  async getBookDetail(id: string) {
    return this.fallback.getBookDetail(id);
  }

  async enrichBook(book: BookCandidate) {
    return book;
  }
}

export const bookMetadataProvider: BookMetadataProvider = new ResilientBookMetadataProvider();

