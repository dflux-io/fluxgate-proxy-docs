type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

interface HttpMethodProps {
  method: string;
}

// Color tokens are chosen to read well against both surfaces (dark + light).
// Using opacity-tinted backgrounds keeps the chip recognisable as a UI
// element rather than competing with body text.
const styles: Record<Method, { bg: string; ring: string; text: string }> = {
  GET:     { bg: 'bg-blue-500/15',    ring: 'ring-blue-500/30',    text: 'text-blue-400' },
  POST:    { bg: 'bg-emerald-500/15', ring: 'ring-emerald-500/30', text: 'text-emerald-400' },
  PUT:     { bg: 'bg-amber-500/15',   ring: 'ring-amber-500/30',   text: 'text-amber-400' },
  PATCH:   { bg: 'bg-amber-500/15',   ring: 'ring-amber-500/30',   text: 'text-amber-400' },
  DELETE:  { bg: 'bg-rose-500/15',    ring: 'ring-rose-500/30',    text: 'text-rose-400' },
  OPTIONS: { bg: 'bg-violet-500/15',  ring: 'ring-violet-500/30',  text: 'text-violet-400' },
  HEAD:    { bg: 'bg-zinc-500/15',    ring: 'ring-zinc-500/30',    text: 'text-zinc-400' },
};

export default function HttpMethod({ method }: HttpMethodProps) {
  const m = method.toUpperCase() as Method;
  const s = styles[m] ?? styles.GET;
  return (
    <span
      className={`not-prose inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ring-1 ring-inset ${s.bg} ${s.ring} ${s.text}`}
    >
      {m}
    </span>
  );
}
