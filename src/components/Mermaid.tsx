import { useEffect, useRef, useState } from 'react';
import { onThemeChange, getTheme } from '../lib/theme';

interface MermaidProps {
  code: string;
}

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `mermaid-${idCounter}`;
}

let mermaidPromise: Promise<typeof import('mermaid').default> | null = null;
async function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((m) => m.default);
  }
  return mermaidPromise;
}

export default function Mermaid({ code }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null);
  const idRef = useRef<string>(nextId());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      try {
        const mermaid = await loadMermaid();
        mermaid.initialize({
          startOnLoad: false,
          theme: getTheme() === 'dark' ? 'dark' : 'default',
          securityLevel: 'strict',
          fontFamily: 'inherit',
        });
        const { svg } = await mermaid.render(idRef.current, code);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          setError(null);
        }
      } catch (e: unknown) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      }
    }
    render();
    const off = onThemeChange(() => {
      idRef.current = nextId();
      render();
    });
    return () => {
      cancelled = true;
      off();
    };
  }, [code]);

  if (error) {
    return (
      <div className="not-prose my-6 overflow-x-auto rounded-md border border-red-500/40 bg-red-500/5 p-4 text-sm">
        <div className="mb-2 font-semibold text-red-400">Mermaid render error</div>
        <pre className="whitespace-pre-wrap text-red-400">{error}</pre>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="not-prose my-6 flex justify-center overflow-x-auto rounded-xl border border-surface-border bg-surface-muted p-4 panel-glow [&>svg]:max-w-full"
    />
  );
}
