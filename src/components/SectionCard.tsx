import { Link } from 'react-router-dom';
import { ArrowRight, type LucideIcon } from 'lucide-react';

interface SectionCardProps {
  to: string;
  Icon: LucideIcon;
  section: string;
  title: string;
  description: string;
}

// One card on the home page — clickable, leads into a section.
export default function SectionCard({ to, Icon, section, title, description }: SectionCardProps) {
  return (
    <Link
      to={to}
      className="group flex flex-col gap-3 rounded-2xl border border-surface-border bg-surface-muted p-5 panel-glow transition-colors hover:border-accent/50"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border bg-surface-subtle text-accent">
          <Icon size={18} strokeWidth={1.75} aria-hidden />
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">
          {section}
        </div>
      </div>
      <h3 className="text-base font-semibold text-ink group-hover:text-accent">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-ink-muted">{description}</p>
      <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-ink-subtle group-hover:text-accent">
        Explore <ArrowRight size={12} strokeWidth={2.5} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
