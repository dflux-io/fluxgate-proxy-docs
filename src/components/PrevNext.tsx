import { Link } from 'react-router-dom';
import type { ManifestPage } from '../types';

interface PrevNextProps {
  prev?: ManifestPage;
  next?: ManifestPage;
}

export default function PrevNext({ prev, next }: PrevNextProps) {
  if (!prev && !next) return null;

  return (
    <nav
      aria-label="Page navigation"
      className="not-prose mt-12 flex flex-col gap-3 border-t border-surface-border pt-6 sm:flex-row sm:justify-between"
    >
      {prev ? (
        <Link
          to={`/${prev.slug}`}
          className="group flex flex-1 flex-col rounded-xl border border-surface-border bg-surface-muted px-4 py-3 panel-glow transition-colors hover:border-accent/50"
        >
          <span className="text-[11px] uppercase tracking-wider text-ink-subtle">Previous</span>
          <span className="mt-1 text-sm font-medium text-ink-muted group-hover:text-accent">
            ← {prev.title}
          </span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
      {next ? (
        <Link
          to={`/${next.slug}`}
          className="group flex flex-1 flex-col rounded-xl border border-surface-border bg-surface-muted px-4 py-3 text-right panel-glow transition-colors hover:border-accent/50"
        >
          <span className="text-[11px] uppercase tracking-wider text-ink-subtle">Next</span>
          <span className="mt-1 text-sm font-medium text-ink-muted group-hover:text-accent">
            {next.title} →
          </span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </nav>
  );
}
