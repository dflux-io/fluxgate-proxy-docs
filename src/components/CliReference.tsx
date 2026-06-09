import { useEffect, useState } from 'react';
import CodeBlock from './CodeBlock';
import Callout from './Callout';
import { getCli, type CliDoc } from '../lib/cli';

// Renders a generated CLI reference: one section per help group (flags or
// subcommands) as a two-column table, plus an Examples block. The data comes
// from public/cli-<key>.json (generated from the binary's --help).
function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function CliReference({ cliKey }: { cliKey: string }) {
  const [doc, setDoc] = useState<CliDoc | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCli(cliKey).then(setDoc).catch((e) => setError(String(e)));
  }, [cliKey]);

  if (error) {
    return (
      <Callout type="warning" title="CLI reference unavailable">
        Could not load the CLI data ({error}). Run <code>{`npm run build:cli`}</code> locally to regenerate it.
      </Callout>
    );
  }
  if (!doc) return <p className="text-sm text-ink-muted">Loading reference…</p>;

  return (
    <>
      {doc.sections.map((section) => (
        <section key={section.title}>
          <h2 id={slugify(section.title)}>{section.title}</h2>
          <div className="not-prose overflow-hidden rounded-lg border border-surface-border">
            <table className="w-full border-collapse text-sm">
              <tbody>
                {section.items.map((item, i) => (
                  <tr key={item.syntax} className={i % 2 ? 'bg-surface-muted/40' : ''}>
                    <td className="border-b border-surface-border px-3 py-2 align-top">
                      <code className="whitespace-nowrap font-mono text-[13px] text-accent">{item.syntax}</code>
                    </td>
                    <td className="border-b border-surface-border px-3 py-2 align-top text-ink-muted">
                      {item.desc || <span className="text-ink-subtle">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {doc.examples.length > 0 && (
        <section>
          <h2 id="examples">Examples</h2>
          <CodeBlock lang="bash" code={doc.examples.join('\n')} />
        </section>
      )}

      <p className="mt-8 text-xs text-ink-subtle">
        Generated from <code>{`${doc.name} --help`}</code> on {doc.generatedAt}. Regenerate with{' '}
        <code>{`npm run build:cli`}</code>.
      </p>
    </>
  );
}
