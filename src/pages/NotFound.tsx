import { Link } from 'react-router-dom';
import { Compass, Home, Search } from 'lucide-react';
import { manifest } from '../manifest';

// Friendlier 404 — same chrome as the rest of the site (sidebar +
// top bar are already provided by Layout). Offers concrete next moves:
// open search, jump home, or pick from the major sections.
export default function NotFound() {
  // Take one prominent page per section to surface as escape routes.
  const escapes = manifest.groups.flatMap((g) => g.pages.slice(0, 1));

  return (
    <main className="min-w-0 flex-1 px-6 py-12 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="not-prose rounded-2xl border border-surface-border bg-surface-muted px-8 py-10 panel-glow">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-accent">
            <Compass size={14} strokeWidth={2} aria-hidden />
            404
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
            That page isn&rsquo;t here.
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-muted">
            The URL doesn&rsquo;t match any docs page. It may have been renamed during
            a recent restructure, or the link is just slightly off. Try search, head
            home, or pick a section below.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            <button
              type="button"
              onClick={() => {
                // Synthesise a Cmd+K to open the search modal. Layout owns it.
                window.dispatchEvent(
                  new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }),
                );
              }}
              className="inline-flex items-center gap-2 rounded-md bg-accent px-3 py-1.5 font-medium text-accent-fg transition-opacity hover:opacity-90"
            >
              <Search size={14} strokeWidth={2} aria-hidden />
              Search the docs
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-md border border-surface-border bg-surface px-3 py-1.5 font-medium text-ink-muted transition-colors hover:text-ink"
            >
              <Home size={14} strokeWidth={2} aria-hidden />
              Home
            </Link>
          </div>
        </div>

        <h2 className="mt-10 text-xs font-semibold uppercase tracking-wider text-ink-subtle">
          Or jump to a section
        </h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {escapes.map((p) => (
            <li key={p.slug}>
              <Link
                to={`/${p.slug}`}
                className="block rounded-lg border border-surface-border bg-surface-muted px-4 py-3 text-sm transition-colors hover:border-accent/50"
              >
                <div className="text-[11px] uppercase tracking-wider text-ink-subtle">
                  {p.group}
                </div>
                <div className="mt-0.5 font-medium text-ink">{p.title}</div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
