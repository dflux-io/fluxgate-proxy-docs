import { Search } from 'lucide-react';

interface SearchTriggerProps {
  onOpen: () => void;
}

// Top-bar control that opens the search modal. Shows the keyboard hint
// inline so people learn the Cmd+K / Ctrl+K shortcut. Detects platform
// once on mount so the label reads natively per OS.
export default function SearchTrigger({ onOpen }: SearchTriggerProps) {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Search docs"
      className="flex items-center gap-2.5 rounded-md border border-surface-border bg-surface-muted px-2.5 py-1.5 text-[13px] text-ink-muted transition-colors hover:border-accent/40 hover:text-ink"
    >
      <Search size={14} strokeWidth={1.75} aria-hidden />
      <span className="hidden sm:inline">Search docs</span>
      <kbd className="hidden rounded border border-surface-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-ink-subtle sm:inline">
        {modKey} K
      </kbd>
    </button>
  );
}
