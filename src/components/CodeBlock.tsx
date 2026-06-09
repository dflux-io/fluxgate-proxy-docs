import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import bash from 'highlight.js/lib/languages/bash';
import yaml from 'highlight.js/lib/languages/yaml';
import json from 'highlight.js/lib/languages/json';
import go from 'highlight.js/lib/languages/go';
import http from 'highlight.js/lib/languages/http';

// Register only the languages we actually use to keep the bundle small.
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);
hljs.registerLanguage('json', json);
hljs.registerLanguage('go', go);
hljs.registerLanguage('http', http);

interface CodeBlockProps {
  code: string;
  lang?: string;
  filename?: string;
}

export default function CodeBlock({ code, lang, filename }: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!codeRef.current) return;
    if (lang && hljs.getLanguage(lang)) {
      const result = hljs.highlight(code, { language: lang, ignoreIllegals: true });
      codeRef.current.innerHTML = result.value;
    } else {
      // No registered highlighter — render plain text.
      codeRef.current.textContent = code;
    }
  }, [code, lang]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // clipboard gated; degrade silently
    }
  };

  const copyBtn = (
    <button
      type="button"
      onClick={onCopy}
      aria-label="Copy code"
      className="inline-flex items-center gap-1 rounded-md border border-surface-border bg-surface px-2 py-1 text-xs text-ink-muted transition-colors hover:bg-surface-subtle hover:text-ink"
    >
      {copied ? <Check size={12} aria-hidden /> : <Copy size={12} aria-hidden />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );

  return (
    <div className="not-prose group relative my-6 overflow-hidden rounded-lg border border-surface-border bg-surface-muted">
      {filename ? (
        <div className="flex items-center justify-between border-b border-surface-border px-3.5 py-2">
          <span className="font-mono text-xs text-ink-muted">{filename}</span>
          <div className="flex items-center gap-2">
            {lang && <span className="text-[10px] font-medium uppercase tracking-wider text-ink-subtle/80">{lang}</span>}
            {copyBtn}
          </div>
        </div>
      ) : (
        <>
          {lang && (
            <div className="pointer-events-none absolute right-[4.75rem] top-2.5 text-[10px] font-medium uppercase tracking-wider text-ink-subtle/80 select-none">
              {lang}
            </div>
          )}
          <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            {copyBtn}
          </div>
        </>
      )}
      <pre className="overflow-x-auto px-4 py-3.5 text-[13px] leading-relaxed">
        <code ref={codeRef} className={lang ? `hljs language-${lang}` : 'hljs'} />
      </pre>
    </div>
  );
}
