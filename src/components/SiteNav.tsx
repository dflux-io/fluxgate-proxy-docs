import { NavLink, useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';
import { manifest, sectionMeta } from '../manifest';

interface SiteNavProps {
  onNavigate: () => void;
}

export default function SiteNav({ onNavigate }: SiteNavProps) {
  const location = useLocation();

  return (
    <nav className="space-y-7">
      <div>
        <NavLink
          to="/"
          onClick={onNavigate}
          end
          className={({ isActive }) =>
            [
              'flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-surface-subtle text-ink'
                : 'text-ink-muted hover:bg-surface-muted hover:text-ink',
            ].join(' ')
          }
        >
          <Home size={14} strokeWidth={1.75} aria-hidden />
          Home
        </NavLink>
      </div>

      {manifest.groups.map((group) => {
        const { Icon } = sectionMeta(group.title);
        return (
          <div key={group.title}>
            <h2 className="mb-2 flex items-center gap-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
              <Icon size={12} strokeWidth={2} aria-hidden />
              {group.title}
            </h2>
            <ul className="ml-[7px] space-y-0.5 border-l border-surface-border">
              {group.pages.map((page) => {
                const to = `/${page.slug}`;
                const isActive = location.pathname === to;
                return (
                  <li key={page.slug} className="-ml-px">
                    <NavLink
                      to={to}
                      onClick={onNavigate}
                      className={[
                        'block border-l-2 py-1.5 pl-3.5 pr-3 text-[13px] leading-snug transition-colors',
                        isActive
                          ? 'border-l-accent font-medium text-accent'
                          : 'border-l-transparent text-ink-muted hover:border-l-surface-border-strong hover:text-ink',
                      ].join(' ')}
                    >
                      {page.title}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
