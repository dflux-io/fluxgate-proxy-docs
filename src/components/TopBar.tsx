import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

interface TopBarProps {
  projectName: string;
  onToggleNav: () => void;
}

export default function TopBar({ projectName, onToggleNav }: TopBarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center border-b border-surface-border bg-surface">
      <div className="mx-auto flex w-full max-w-[88rem] items-center gap-4 px-4 md:px-6">
        <button
          type="button"
          aria-label="Toggle navigation"
          onClick={onToggleNav}
          className="rounded-md p-1.5 text-ink-muted hover:bg-surface-muted hover:text-ink md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <Link
          to="/"
          className="flex items-center gap-2.5 text-ink transition-colors hover:text-accent"
        >
          <span className="block h-6 w-6 rounded-md bg-accent panel-glow" aria-hidden />
          <span className="font-semibold tracking-tight">{projectName}</span>
        </Link>

        <div className="flex-1" />

        <ThemeToggle />
      </div>
    </header>
  );
}
