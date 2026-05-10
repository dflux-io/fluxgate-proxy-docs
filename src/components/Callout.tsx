import type { ReactNode } from 'react';

type CalloutType = 'note' | 'tip' | 'warning';

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
}

const styles: Record<CalloutType, { ring: string; label: string; tone: string }> = {
  note: {
    ring: 'border-blue-500/30 bg-blue-500/5',
    label: 'Note',
    tone: 'text-blue-400',
  },
  tip: {
    ring: 'border-emerald-500/30 bg-emerald-500/5',
    label: 'Tip',
    tone: 'text-emerald-400',
  },
  warning: {
    ring: 'border-amber-500/30 bg-amber-500/5',
    label: 'Warning',
    tone: 'text-amber-400',
  },
};

export default function Callout({ type = 'note', title, children }: CalloutProps) {
  const s = styles[type];
  return (
    <div className={`not-prose my-6 rounded-xl border ${s.ring} px-4 py-3 panel-glow`}>
      <div className={`mb-1 text-xs font-semibold uppercase tracking-wider ${s.tone}`}>
        {title ?? s.label}
      </div>
      <div className="text-sm leading-relaxed text-ink">{children}</div>
    </div>
  );
}
