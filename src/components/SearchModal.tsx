import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, FileText, Hash } from 'lucide-react';
import type MiniSearch from 'minisearch';
import { getIndex, snippet, type IndexEntry } from '../lib/search';
import { manifest } from '../manifest';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

interface DisplayResult extends IndexEntry {
  score: number;
}

const MAX_RESULTS = 18;

export default function SearchModal({ open, onClose }: SearchModalProps) {
  const navigate = useNavigate();
  const [index, setIndex] = useState<MiniSearch<IndexEntry> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Lazy-load the index when the modal is first opened. Cached after that.
  useEffect(() => {
    if (!open || index) return;
    getIndex()
      .then(setIndex)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [open, index]);

  // Focus the input every time the modal opens; reset state on close.
  useEffect(() => {
    if (open) {
      // Defer to next frame so the input is mounted.
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setQuery('');
      setActive(0);
    }
  }, [open]);

  // Compute results.
  const results = useMemo<DisplayResult[]>(() => {
    if (!index || !query.trim()) return [];
    const raw = index.search(query.trim()).slice(0, MAX_RESULTS);
    return raw.map((r) => ({
      id: String(r.id),
      type: r.type,
      slug: r.slug,
      pageTitle: r.pageTitle,
      section: r.section,
      title: r.title,
      body: r.body,
      score: r.score,
    }));
  }, [index, query]);

  // Reset active row whenever results change.
  useEffect(() => {
    setActive(0);
  }, [query]);

  // Keep the active row visible.
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const go = useCallback(
    (idx: number) => {
      const r = results[idx];
      if (!r) return;
      onClose();
      navigate(`/${r.slug}`);
    },
    [results, navigate, onClose],
  );

  const onKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((i) => Math.min(i + 1, Math.max(0, results.length - 1)));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        go(active);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [results.length, active, go, onClose],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh]"
      onMouseDown={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-2xl panel-glow"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-surface-border px-4 py-3">
          <Search size={18} strokeWidth={1.75} className="text-ink-subtle" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search the docs…"
            className="flex-1 bg-transparent text-base text-ink placeholder:text-ink-subtle focus:outline-none"
            aria-label="Search docs"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="rounded-md p-1 text-ink-subtle hover:bg-surface-muted hover:text-ink"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>

        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
          {error && (
            <div className="px-4 py-3 text-sm text-rose-400">Search failed: {error}</div>
          )}
          {!error && !index && (
            <div className="px-4 py-3 text-sm text-ink-subtle">Loading index…</div>
          )}
          {!error && index && query.trim() === '' && (
            <div className="px-4 py-6 text-center text-sm text-ink-subtle">
              Type to search across all pages and sections.
            </div>
          )}
          {!error && index && query.trim() !== '' && results.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-ink-subtle">
              No results for &ldquo;{query}&rdquo;.
            </div>
          )}
          {results.map((r, idx) => {
            const isActive = idx === active;
            const IconEl = r.type === 'page' ? FileText : Hash;
            return (
              <button
                key={r.id}
                data-idx={idx}
                type="button"
                onMouseEnter={() => setActive(idx)}
                onClick={() => go(idx)}
                className={[
                  'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
                  isActive ? 'bg-surface-subtle' : 'hover:bg-surface-muted',
                ].join(' ')}
              >
                <div
                  className={[
                    'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border',
                    isActive ? 'border-accent/40 text-accent' : 'border-surface-border text-ink-subtle',
                  ].join(' ')}
                >
                  <IconEl size={12} strokeWidth={1.75} aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-ink-subtle">
                    <span>{r.section || 'Docs'}</span>
                    {r.type === 'section' && (
                      <>
                        <span>·</span>
                        <span className="truncate">{r.pageTitle}</span>
                      </>
                    )}
                  </div>
                  <div className={['mt-0.5 text-sm font-medium', isActive ? 'text-accent' : 'text-ink'].join(' ')}>
                    {r.title}
                  </div>
                  <div className="mt-0.5 truncate text-[13px] text-ink-muted">
                    {snippet(r.body, query)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-surface-border px-4 py-2 text-[11px] text-ink-subtle">
          <div className="flex items-center gap-3">
            <Hint label="↑↓" desc="navigate" />
            <Hint label="↵" desc="open" />
            <Hint label="esc" desc="close" />
          </div>
          <span>{manifest.projectName} docs</span>
        </div>
      </div>
    </div>
  );
}

function Hint({ label, desc }: { label: string; desc: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <kbd className="rounded border border-surface-border bg-surface-muted px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">
        {label}
      </kbd>
      {desc}
    </span>
  );
}
