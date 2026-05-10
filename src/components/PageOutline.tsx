import { useEffect, useState } from 'react';
import type { OutlineHeading } from '../types';

interface PageOutlineProps {
  headings: OutlineHeading[];
}

export default function PageOutline({ headings }: PageOutlineProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) {
      setActiveId(null);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-72px 0px -70% 0px', threshold: [0, 1] },
    );
    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="On this page" className="space-y-3 text-sm">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
        On this page
      </h2>
      <ul className="space-y-1.5 border-l border-surface-border">
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? 'pl-5' : 'pl-3'}>
            <a
              href={`#${h.id}`}
              className={[
                'block -ml-px border-l-2 py-0.5 pl-3 text-[13px] leading-snug transition-colors',
                activeId === h.id
                  ? 'border-accent text-accent font-medium'
                  : 'border-transparent text-ink-muted hover:text-ink',
              ].join(' ')}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
