import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import HttpMethod from '../../components/HttpMethod';

export default function StatusAndConfig() {
  return (
    <DocPage
      slug="api/status-and-config"
      lede="Daemon-wide status, the resolved running configuration, the runtime log level, and bootstrap config validation. Read-only endpoints plus one mutation for log level and one for validation."
    >
      <h2 id="status">Status</h2>
      <p><HttpMethod method="GET" /> <code>/admin/status</code></p>
      <p>Returns proxy state and a summary of the loaded control-plane store.</p>
      <CodeBlock lang="json" code={`{
  "status": "running",
  "version": "1.4.0",
  "producers": true,
  "producer_counts": { "AMF": 2, "SMF": 1 },
  "filter_count": 4,
  "policy_rules": 12,
  "rate_limits": 3
}`} />
      <p>
        <code>producers</code> is a boolean indicating whether any producer is registered;{' '}
        <code>producer_counts</code> breaks that down per NF type. <code>filter_count</code>,{' '}
        <code>policy_rules</code>, and <code>rate_limits</code> reflect the currently active
        filter chain and rules in the control-plane store.
      </p>

      <h2 id="config">Running config</h2>
      <p><HttpMethod method="GET" /> <code>/admin/config</code></p>
      <p>
        Returns the resolved running configuration as JSON. Secret-bearing fields are redacted.
        This goes through the same redaction path as <code>fgp -print-config</code>, so the two
        views can't diverge.
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
        <code>warn</code>, <code>error</code>, <code>fatal</code>, <code>panic</code>. The change
        takes effect immediately. It is held in the running process only — it is node-local
        (not cluster-wide) and resets to the configured level on restart.
      </p>

      <h2 id="config-validate">Validate config</h2>
      <p><HttpMethod method="POST" /> <code>/admin/config/validate</code></p>
      <p>
        Validates a full <code>Config</code> bootstrap payload without applying it — useful for
        checking a YAML or JSON config before a deploy. Send the document as the request body
        (set <code>Content-Type: application/yaml</code> for YAML; JSON is the default). On
        success:
      </p>
      <CodeBlock lang="json" code={`{"valid": true}`} />
      <p>On failure, the response carries the validation errors:</p>
      <CodeBlock lang="json" code={`{"valid": false, "errors": ["listen: missing port", "..."]}`} />

      <h2 id="examples">Examples</h2>
      <CodeBlock lang="bash" code={`# Status
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" https://fgp.svc:9091/admin/status | jq

# Running config (redacted JSON)
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" https://fgp.svc:9091/admin/config | jq

# Bump log level for an investigation
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" -H "Content-Type: application/json" \\
  -X PUT https://fgp.svc:9091/admin/log-level \\
  -d '{"level":"debug"}'

# Validate a config bundle before applying it
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" -H "Content-Type: application/yaml" \\
  -X POST https://fgp.svc:9091/admin/config/validate \\
  --data-binary @fgp.yaml | jq`} />
    </DocPage>
  );
}
