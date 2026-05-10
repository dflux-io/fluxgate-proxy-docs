import { useEffect, useRef, useState } from 'react';
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
}

export default function CodeBlock({ code, lang }: CodeBlockProps) {
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

  return (
    <div className="not-prose group relative my-6 overflow-hidden rounded-xl border border-surface-border bg-surface-muted panel-glow">
      {lang && (
        <div className="absolute right-12 top-2.5 text-[10px] font-medium uppercase tracking-wider text-ink-subtle/80 select-none">
          {lang}
        </div>
      )}
      <button
        type="button"
        onClick={onCopy}
        aria-label="Copy code"
        className="absolute right-2 top-2 rounded-md border border-surface-border bg-surface px-2 py-1 text-xs text-ink-muted opacity-0 transition-opacity hover:bg-surface-subtle hover:text-ink group-hover:opacity-100 focus-visible:opacity-100"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre className="overflow-x-auto px-4 py-3.5 text-[13px] leading-relaxed">
        <code ref={codeRef} className={lang ? `hljs language-${lang}` : 'hljs'} />
      </pre>
    </div>
  );
}
