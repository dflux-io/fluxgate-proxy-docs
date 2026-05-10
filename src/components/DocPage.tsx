import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { neighbors, pageBySlug, sectionMeta } from '../manifest';
import type { OutlineHeading } from '../types';
import PageOutline from './PageOutline';
import PrevNext from './PrevNext';
import PageHeader from './PageHeader';
import Breadcrumbs from './Breadcrumbs';

interface DocPageProps {
  slug: string;
  // Optional lede shown under the page title in the header card.
  // Pages whose first paragraph reads as a lede should pass it here and
  // omit it from the body.
  lede?: string;
  // When true, the auto-generated PageHeader and Breadcrumbs are skipped —
  // useful for the home page which has its own hero treatment.
  bare?: boolean;
  children: ReactNode;
}

// DocPage wraps every content page with the prev/next footer and the
// right-side "On this page" outline. The outline is built from the
// rendered DOM after mount (every H2/H3 with an `id` attribute).
export default function DocPage({ slug, lede, bare, children }: DocPageProps) {
  const location = useLocation();
  const articleRef = useRef<HTMLElement>(null);
  const [headings, setHeadings] = useState<OutlineHeading[]>([]);
  const page = pageBySlug(slug);
  const { prev, next } = neighbors(slug);
  const meta = page && page.group ? sectionMeta(page.group) : null;

  // Walk the rendered article for h2/h3 with ids whenever the slug changes.
  useEffect(() => {
    if (!articleRef.current) return;
    const els = articleRef.current.querySelectorAll<HTMLElement>('h2[id], h3[id]');
    const list: OutlineHeading[] = [];
    els.forEach((el) => {
      list.push({
        id: el.id,
        text: el.textContent?.replace(/#$/, '').trim() ?? '',
        level: el.tagName === 'H2' ? 2 : 3,
      });
    });
    setHeadings(list);
  }, [slug, children]);

  // Scroll: jump to top on new slug, or to anchor when present.
  useEffect(() => {
    if (location.hash) {
      requestAnimationFrame(() => {
        const el = document.getElementById(location.hash.slice(1));
        if (el) el.scrollIntoView();
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [location.hash, location.pathname]);

  // Update the document title from the manifest.
  useEffect(() => {
    if (page) {
      document.title = `${page.title} — fluxgate-proxy docs`;
    }
  }, [page]);

  return (
    <>
      <main className="min-w-0 flex-1 px-6 py-10 lg:px-10">
        <article
          ref={articleRef}
          className="prose prose-slate mx-auto max-w-3xl dark:prose-invert prose-headings:scroll-mt-20 prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0 prose-code:before:hidden prose-code:after:hidden"
        >
          {!bare && page && (
            <>
              <Breadcrumbs section={page.group || undefined} title={page.title} />
              <PageHeader
                section={page.group || 'Documentation'}
                Icon={meta?.Icon ?? sectionMeta('Glossary').Icon}
                title={page.title}
                lede={lede}
              />
            </>
          )}
          {children}
          <PrevNext prev={prev} next={next} />
        </article>
      </main>

      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto px-6 py-10">
          <PageOutline headings={headings} />
        </div>
      </aside>
    </>
  );
}
