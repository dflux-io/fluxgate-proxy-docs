import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbsProps {
  section?: string;
  title: string;
}

// Tiny crumbs shown at the very top of the article. Home → Section → Page.
// Section is optional (the home page itself, glossary, etc. omit it).
export default function Breadcrumbs({ section, title }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="not-prose mb-3 flex items-center gap-1.5 text-[12px] text-ink-subtle"
    >
      <Link to="/" className="transition-colors hover:text-ink">
        Home
      </Link>
      {section && (
        <>
          <ChevronRight size={12} strokeWidth={2} aria-hidden />
          <span>{section}</span>
        </>
      )}
      <ChevronRight size={12} strokeWidth={2} aria-hidden />
      <span className="truncate text-ink-muted">{title}</span>
    </nav>
  );
}
