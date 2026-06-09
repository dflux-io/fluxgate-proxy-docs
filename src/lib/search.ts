import MiniSearch, { type SearchResult } from 'minisearch';

export interface IndexEntry {
  id: string;
  type: 'page' | 'section';
  slug: string;             // route incl. optional #fragment
  pageTitle: string;
  section: string;          // group name from the manifest
  title: string;            // heading text (or page title for type=page)
  body: string;             // truncated body excerpt
}

let loadingPromise: Promise<MiniSearch<IndexEntry>> | null = null;
let cachedEntries: IndexEntry[] = [];

// Build / cache the index. Loaded lazily on first open of the modal so
// it doesn't cost the initial page-load budget.
export async function getIndex(): Promise<MiniSearch<IndexEntry>> {
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    const r = await fetch('/search-index.json', { cache: 'force-cache' });
    if (!r.ok) throw new Error(`search-index: HTTP ${r.status}`);
    const entries = (await r.json()) as IndexEntry[];
    cachedEntries = entries;
    const ms = new MiniSearch<IndexEntry>({
      fields: ['title', 'body', 'pageTitle', 'section'],
      storeFields: ['title', 'slug', 'section', 'pageTitle', 'type', 'body'],
      searchOptions: {
        boost: { title: 3, pageTitle: 2, section: 1.5 },
        fuzzy: 0.2,
        prefix: true,
        combineWith: 'AND',
      },
    });
    ms.addAll(entries);
    return ms;
  })();
  return loadingPromise;
}

// Snippet: returns up to ~140 chars of `body` centred around the first
// occurrence of any query term, with surrounding ellipses. Falls back to
// the body's head if no terms hit.
export function snippet(body: string, query: string, max = 140): string {
  if (!body) return '';
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1);
  const lower = body.toLowerCase();
  let hit = -1;
  for (const t of terms) {
    const idx = lower.indexOf(t);
    if (idx >= 0) {
      hit = idx;
      break;
    }
  }
  if (hit < 0) return body.length <= max ? body : body.slice(0, max) + '…';

  // Centre the window on the hit.
  const start = Math.max(0, hit - Math.floor(max / 3));
  const end = Math.min(body.length, start + max);
  const slice = body.slice(start, end);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < body.length ? '…' : '';
  return prefix + slice + suffix;
}

export type { SearchResult };
export { cachedEntries };
