import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { manifest } from '../manifest';
import TopBar from './TopBar';
import SiteNav from './SiteNav';

export default function Layout() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-surface text-ink">
      <TopBar
        projectName={manifest.projectName}
        onToggleNav={() => setNavOpen((v) => !v)}
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
    </div>
  );
}
