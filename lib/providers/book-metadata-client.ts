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

const fetchJson = async (url: string) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(12000), headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
};

const normalizeOpenLibrary = (data: any): BookCandidate[] =>
  Array.isArray(data?.docs)
    ? data.docs.map((x: any) => ({
        id: x.key,
        title: x.title,
        author: x.author_name?.[0],
        publish_year: x.first_publish_year,
        isbn: x.isbn?.[0],
        publisher: x.publisher?.[0],
      }))
    : [];

const normalizeGoogleBooks = (data: any, query: string): BookCandidate[] =>
  Array.isArray(data?.items)
    ? data.items.map((x: { id: string; volumeInfo?: any }) => ({
        id: `google-${x.id}`,
        title: x.volumeInfo?.title || query,
        author: x.volumeInfo?.authors?.[0],
        publish_year: x.volumeInfo?.publishedDate ? Number(x.volumeInfo.publishedDate.slice(0, 4)) : undefined,
        description: x.volumeInfo?.description,
        publisher: x.volumeInfo?.publisher,
        cover_url: x.volumeInfo?.imageLinks?.thumbnail,
        isbn: x.volumeInfo?.industryIdentifiers?.[0]?.identifier,
      }))
    : [];

export async function searchBooksFromBrowser(query: string): Promise<BookCandidate[]> {
  const q = query.trim();
  if (!q) return [];

  const openLibraryUrl = new URL("https://openlibrary.org/search.json");
  openLibraryUrl.searchParams.set("q", q);
  openLibraryUrl.searchParams.set("limit", "8");

  try {
    const data = await fetchJson(openLibraryUrl.toString());
    const results = normalizeOpenLibrary(data);
    if (results.length) return results;
  } catch {}

  const googleBooksUrl = new URL("https://www.googleapis.com/books/v1/volumes");
  googleBooksUrl.searchParams.set("q", q);
  googleBooksUrl.searchParams.set("maxResults", "8");

  try {
    const data = await fetchJson(googleBooksUrl.toString());
    return normalizeGoogleBooks(data, q);
  } catch {
    return [];
  }
}

