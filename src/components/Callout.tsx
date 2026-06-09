import type { ReactNode } from 'react';
import { Info, Lightbulb, AlertTriangle, AlertOctagon, type LucideIcon } from 'lucide-react';

type CalloutType = 'note' | 'tip' | 'warning' | 'danger';

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
}

const styles: Record<CalloutType, { rail: string; bg: string; ring: string; tone: string; label: string; Icon: LucideIcon }> = {
  note: {
    rail: 'border-l-blue-500',
    bg: 'bg-blue-500/[0.06]',
    ring: 'border-blue-500/25',
    tone: 'text-blue-500 dark:text-blue-400',
    label: 'Note',
    Icon: Info,
  },
  tip: {
    rail: 'border-l-emerald-500',
    bg: 'bg-emerald-500/[0.06]',
    ring: 'border-emerald-500/25',
    tone: 'text-emerald-600 dark:text-emerald-400',
    label: 'Tip',
    Icon: Lightbulb,
  },
  warning: {
    rail: 'border-l-amber-500',
    bg: 'bg-amber-500/[0.06]',
    ring: 'border-amber-500/25',
    tone: 'text-amber-600 dark:text-amber-400',
    label: 'Warning',
    Icon: AlertTriangle,
  },
  danger: {
    rail: 'border-l-rose-500',
    bg: 'bg-rose-500/[0.06]',
    ring: 'border-rose-500/25',
    tone: 'text-rose-600 dark:text-rose-400',
    label: 'Danger',
    Icon: AlertOctagon,
  },
};

export default function Callout({ type = 'note', title, children }: CalloutProps) {
  const s = styles[type];
  const { Icon } = s;
  return (
    <div className={`not-prose my-6 flex gap-3 rounded-lg border border-l-2 ${s.ring} ${s.rail} ${s.bg} px-4 py-3`}>
      <Icon size={16} strokeWidth={2} className={`mt-0.5 shrink-0 ${s.tone}`} aria-hidden />
      <div className="min-w-0">
        <div className={`mb-1 text-xs font-semibold uppercase tracking-wider ${s.tone}`}>{title ?? s.label}</div>
        <div className="text-sm leading-relaxed text-ink [&_a]:text-accent [&_a:hover]:underline [&>*+*]:mt-2">{children}</div>
      </div>
    </div>
  );
}
