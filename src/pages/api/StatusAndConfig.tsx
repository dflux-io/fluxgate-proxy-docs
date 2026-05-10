import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import HttpMethod from '../../components/HttpMethod';

export default function StatusAndConfig() {
  return (
    <DocPage
      slug="api/status-and-config"
      lede="Daemon-wide status, the resolved running configuration, runtime log level, and the compliance report. Read-only endpoints plus one mutation for log level."
    >
      <h2 id="status">Status</h2>
      <p><HttpMethod method="GET" /> <code>/admin/status</code></p>
      <p>Returns proxy state and uptime.</p>
      <CodeBlock lang="json" code={`{
  "status": "ok",
  "version": "1.2.3",
  "uptime_seconds": 3600,
  "mode": "both",
  "policy_version": 42
}`} />

      <h2 id="config">Running config</h2>
      <p><HttpMethod method="GET" /> <code>/admin/config</code></p>
      <p>
        Returns the resolved running configuration. Secrets are redacted. Equivalent to{' '}
        <code>fgp -print-config</code> but on a live daemon.
      </p>

      <h2 id="log-level">Log level</h2>
      <p><HttpMethod method="GET" /> <code>/admin/log-level</code></p>
      <p>Returns the current log level.</p>
      <CodeBlock lang="json" code={`{"level": "info"}`} />

      <p><HttpMethod method="PUT" /> <code>/admin/log-level</code></p>
      <p>Change the log level at runtime. Body:</p>
      <CodeBlock lang="json" code={`{"level": "debug"}`} />
      <p>
        Accepted values: <code>trace</code>, <code>debug</code>, <code>info</code>,{' '}
        <code>warn</code>, <code>error</code>. The change takes effect immediately and
        persists for the lifetime of the process.
      </p>

      <h2 id="compliance-report">Compliance report</h2>
      <p><HttpMethod method="GET" /> <code>/admin/compliance-report</code></p>
      <p>
        Generates a snapshot of policy + audit + config posture suitable for an auditor.
        Returns JSON. See <a href="/guides/audit-and-compliance">Audit and compliance</a> for
        the field list.
      </p>

      <h2 id="examples">Examples</h2>
      <CodeBlock lang="bash" code={`# Status
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" https://fgp.svc:8091/admin/status

# Running config (redacted) as YAML; transform to JSON locally if you prefer
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" https://fgp.svc:8091/admin/config | jq

# Bump log level for an investigation
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" -H "Content-Type: application/json" \\
  -X PUT https://fgp.svc:8091/admin/log-level \\
  -d '{"level":"debug"}'

# Snapshot the compliance report
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" \\
  https://fgp.svc:8091/admin/compliance-report > report-$(date +%F).json`} />
    </DocPage>
  );
}
