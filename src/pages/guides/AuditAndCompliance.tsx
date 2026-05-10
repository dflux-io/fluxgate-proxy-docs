import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function AuditAndCompliance() {
  return (
    <DocPage
      slug="guides/audit-and-compliance"
      lede="Every request decision lands in the audit store. Records can be signed (HMAC), retained on a schedule, exported to syslog / webhook / file, and rolled up into a compliance report. This guide covers configuring each piece for a production signaling-plane audit trail."
    >
      <h2 id="what-an-audit-record-contains">What a record contains</h2>
      <p>One record per request decision. Fields include:</p>
      <ul>
        <li>Timestamp, request id, duration.</li>
        <li>Method, path or AVP set, target NF type, source NF type.</li>
        <li>Decision (<code>allowed</code> / <code>denied</code>) and the deny reason if denied.</li>
        <li>Matched rule name (if any).</li>
        <li>HTTP status code or Diameter result code.</li>
        <li>Consumer identity (from auth filter), tenant identity, SUPI / GPSI when extracted.</li>
        <li>Optional HMAC signature when signing is on.</li>
      </ul>

      <h2 id="store">The audit store</h2>
      <p>
        The store backs both API reads (<code>fgpctl audit</code>, the admin API) and the
        compliance report. Drivers:
      </p>
      <ul>
        <li><code>memory</code> — in-process, lost on restart. Default; fine for dev, never for production.</li>
        <li><code>sqlite</code> — file-backed. Right for a single-host deploy.</li>
        <li><code>postgres</code> — remote DB; <code>sslmode</code> required. Right for multi-host or when audit needs to outlive the FGP host.</li>
      </ul>
      <CodeBlock lang="yaml" code={`storage:
  audit:
    driver: postgres
    dsn: \${FGP_AUDIT_DSN:?required}    # postgres://fgp:…@audit-db/fgp?sslmode=verify-full`} />

      <h2 id="signing">Signing</h2>
      <p>
        When <code>audit.signing_key_file</code> is set, FGP HMACs each record with the key
        from that file and stores the signature alongside the record. Verifying a signature
        later confirms the record hasn't been tampered with in storage or in export.
      </p>
      <CodeBlock lang="yaml" code={`audit:
  signing_key_file: /run/secrets/fgp-audit-hmac    # >= 32 bytes random`} />

      <p>
        Rotate the key by appending a new entry to a key-set file and accepting both old and
        new during the rollover window. The signing scheme is documented in the audit module —
        for routine compliance, the file-based setup above is enough.
      </p>

      <h2 id="sinks">Export to external sinks</h2>
      <p>The audit pipeline can fan out to several sinks in parallel. Configure under <code>audit.export</code>:</p>

      <h3 id="webhook">Webhook</h3>
      <CodeBlock lang="yaml" code={`audit:
  export:
    webhook_url: https://siem.example.com/ingest/fgp
    webhook_timeout: 5s
    webhook_token_file: /run/secrets/siem-bearer
    batch_size: 100
    batch_timeout: 5s
    max_retries: 3
    filter_decision: ""           # "" = all decisions; set to "denied" for denies-only`} />

      <h3 id="syslog">Syslog</h3>
      <CodeBlock lang="yaml" code={`audit:
  export:
    syslog_addr: "tcp+tls://syslog.example.com:6514"`} />

      <h3 id="file">File</h3>
      <CodeBlock lang="yaml" code={`audit:
  export:
    file_path: /var/log/fgp/audit.jsonl
    file_max_size_mb: 100
    file_max_files: 5`} />

      <Callout type="note" title="Sinks are best-effort">
        If a sink is unreachable, the audit pipeline retries up to <code>max_retries</code>{' '}
        then drops the batch and increments <code>fgp_audit_sink_drops_total</code>. The
        record is still persisted to the audit store regardless of sink success — sinks are a
        delivery channel, not the source of truth.
      </Callout>

      <h2 id="retention">Retention</h2>
      <p>The audit store grows without bounds unless you set retention. Two knobs:</p>
      <CodeBlock lang="yaml" code={`audit:
  retention:
    max_age: 720h         # delete records older than 30 days; 0 = disabled
    max_records: 0        # keep at most N records; 0 = unlimited
    cleanup_interval: 1h  # how often the cleanup goroutine runs`} />

      <p>
        Tune <code>max_age</code> to your compliance window. For SOC 2 or similar, 90–365 days
        is typical; in highly-regulated telco environments the window may be longer. Pair with
        a long-term archive sink (file → S3, or syslog → SIEM) so retention deletes don't
        equal loss.
      </p>

      <h2 id="query">Query the trail</h2>
      <p>From the CLI:</p>
      <CodeBlock lang="bash" code={`fgpctl audit --limit 500

# export to CSV, denies only
fgpctl audit export --format csv --decision denied --limit 5000 > denies.csv`} />

      <p>From the admin API:</p>
      <CodeBlock lang="bash" code={`curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" \\
  "https://fgp.svc:8091/admin/audit/admin-actions?limit=200" | jq`} />

      <h2 id="admin-audit">Admin actions are audited separately</h2>
      <p>
        Mutations to the admin API land in <code>/admin/audit/admin-actions</code>, distinct
        from the request audit trail. This is the trail for "who changed policy?", not "what
        traffic did the proxy see?" — both should flow to your SIEM. See{' '}
        <Link to="/guides/securing-the-admin-api">Securing the admin API</Link>.
      </p>

      <h2 id="compliance-report">Compliance report</h2>
      <p>
        FGP rolls audit and configuration state into a single report consumable by auditors.
        Generate it from the admin API:
      </p>
      <CodeBlock lang="bash" code={`curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" \\
  https://fgp.svc:8091/admin/compliance-report > report.json`} />

      <p>Contents include:</p>
      <ul>
        <li>Active policy version + rule counts, broken down by action and key fields.</li>
        <li>Active rate limits + transformation rules + routing rules.</li>
        <li>Audit volume by decision over a window.</li>
        <li>Top deny reasons and top denied consumers.</li>
        <li>Tenant inventory.</li>
        <li>Whether audit signing is enabled, retention windows, and sink configuration (with secrets redacted).</li>
      </ul>
      <p>
        The report is a snapshot — schedule a periodic capture (cron + curl + archive) for a
        time series. Use it as evidence that controls are in place; use the underlying audit
        trail as evidence of what actually happened.
      </p>

      <h2 id="related">Related</h2>
      <ul>
        <li><Link to="/api/observability">Admin API → Observability</Link> — audit and report endpoints.</li>
        <li><Link to="/reference/config-schema">Config schema</Link> — full <code>audit</code> and <code>storage.audit</code> blocks.</li>
        <li><Link to="/guides/observability">Observability</Link> — metrics and tracing.</li>
      </ul>
    </DocPage>
  );
}
