import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  section: string;
  Icon: LucideIcon;
  title: string;
  lede?: string;
}

export default function PageHeader({ section, Icon, title, lede }: PageHeaderProps) {
  return (
    <header className="not-prose mb-10 rounded-2xl border border-surface-border bg-surface-muted px-6 py-6 panel-glow">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-surface-border bg-surface-subtle text-accent">
          <Icon size={20} strokeWidth={1.75} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
            {section}
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
            {title}
          </h1>
          {lede && (
            <p className="mt-2 text-base leading-relaxed text-ink-muted">{lede}</p>
          )}
        </div>
      </div>
    </header>
  );
}
