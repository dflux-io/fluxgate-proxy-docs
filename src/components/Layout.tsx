import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { manifest } from '../manifest';
import TopBar from './TopBar';
import SiteNav from './SiteNav';
import SearchModal from './SearchModal';

export default function Layout() {
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  // Close the search modal on every route change so navigating to a
  // result actually dismisses the overlay (the modal calls navigate +
  // onClose, but the route change can come from anywhere else too).
  useEffect(() => {
    setSearchOpen(false);
  }, [location.pathname]);

  // Global Cmd+K / Ctrl+K opens search; / also works (matches GitHub,
  // Stripe, Notion, etc. — easy on keyboards without a meta key).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === '/' && !isTyping && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  return (
    <div className="flex min-h-screen flex-col bg-surface text-ink">
      <TopBar
        projectName={manifest.projectName}
        onToggleNav={() => setNavOpen((v) => !v)}
        onOpenSearch={openSearch}
      />

      <div className="mx-auto flex w-full max-w-[88rem] flex-1">
        <aside
          className={[
            'fixed inset-y-0 left-0 top-14 z-30 w-72 shrink-0 overflow-y-auto border-r border-surface-border bg-surface px-4 py-8',
            'transition-transform md:sticky md:top-14 md:h-[calc(100vh-3.5rem)] md:translate-x-0',
            navOpen ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
        >
          <SiteNav onNavigate={() => setNavOpen(false)} />
        </aside>

        {navOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 top-14 z-20 bg-black/40 md:hidden"
            onClick={() => setNavOpen(false)}
          />
        )}

        <Outlet />
      </div>

      <SearchModal open={searchOpen} onClose={closeSearch} />
    </div>
  );
}
