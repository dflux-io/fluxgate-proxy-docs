import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function Overview() {
  return (
    <DocPage
      slug="api/overview"
      lede="The admin API is FGP's HTTP control plane. fgpctl is a thin client over it, and you can drive it from curl or any HTTP client. This page covers auth, base URL, content types, error model, idempotency, and the dry-run pattern."
    >
      <h2 id="base-url">Base URL</h2>
      <p>
        The admin listener defaults to <code>127.0.0.1:8091</code>. Everywhere in this section
        we use a placeholder host:
      </p>
      <CodeBlock lang="text" code={`https://fgp.svc:8091`} />

      <p>
        Production should expose the admin listener over HTTPS with TLS configured under
        <code>admin.tls</code>. See <Link to="/guides/securing-the-admin-api">Securing the admin API</Link>.
      </p>

      <h2 id="auth">Authentication</h2>
      <p>FGP supports three auth modes on the admin API:</p>
      <ul>
        <li>
          <strong>API key</strong> — pass in the <code>X-Admin-Key</code> header.
          <CodeBlock lang="bash" code={`curl -H "X-Admin-Key: $FGP_ADMIN_KEY" https://fgp.svc:8091/admin/status`} />
        </li>
        <li>
          <strong>JWT bearer</strong> — pass in the <code>Authorization: Bearer …</code> header.
          FGP validates signature, expiry, and the <code>fgp:admin</code> scope claim.
        </li>
        <li><strong>mTLS</strong> — client certificate, identity recorded in the admin audit log.</li>
      </ul>
      <p>
        Configure one or more under <code>admin.auth</code>. When none is configured, FGP
        refuses to start unless <code>admin.allow_anonymous: true</code> is also set.
      </p>

      <h2 id="content-types">Content types</h2>
      <ul>
        <li>Requests with a body: <code>Content-Type: application/json</code>.</li>
        <li>Responses are <code>application/json</code> unless documented otherwise (e.g. CSV from audit export).</li>
        <li>UTF-8 throughout.</li>
      </ul>

      <h2 id="error-model">Error model</h2>
      <p>Errors are JSON with a stable shape:</p>
      <CodeBlock lang="json" code={`{
  "error": {
    "code": "validation_failed",
    "message": "rules[0].match.method: invalid HTTP method 'POSST'",
    "details": [
      {"path": "rules[0].match.method", "issue": "must be one of GET, POST, PUT, …"}
    ]
  }
}`} />

      <p>HTTP status follows the obvious mapping:</p>
      <ul>
        <li><strong>200</strong> — success with a body.</li>
        <li><strong>201</strong> — resource created.</li>
        <li><strong>204</strong> — success with no body (deletes).</li>
        <li><strong>400</strong> — validation failure on the request body.</li>
        <li><strong>401</strong> — missing or invalid auth.</li>
        <li><strong>403</strong> — auth succeeded but the actor isn't authorized for the action (e.g. JWT lacks the required scope).</li>
        <li><strong>404</strong> — resource by that name doesn't exist.</li>
        <li><strong>409</strong> — conflict (e.g. creating a tenant for a PLMN that already has one).</li>
        <li><strong>422</strong> — semantically valid request that violates a constraint (e.g. rolling back to a nonexistent version).</li>
        <li><strong>500</strong> — internal error. Check the FGP logs.</li>
      </ul>

      <h2 id="idempotency">Idempotency</h2>
      <p>
        All <code>PUT</code> endpoints are idempotent. The CRUD pattern is:
      </p>
      <ul>
        <li><strong>POST</strong> creates a new resource. Fails 409 if a resource by that key already exists.</li>
        <li><strong>PUT /{`{name}`}</strong> updates the resource. Most also accept an upsert (creates if missing) — the resource page documents which.</li>
        <li><strong>DELETE</strong> is idempotent: deleting a nonexistent resource returns 204, not 404.</li>
      </ul>

      <h2 id="dry-run">Dry-run / validate pattern</h2>
      <p>
        Several endpoints support a "validate" variant that runs the same shape-and-semantic
        checks as a real write, without committing:
      </p>
      <ul>
        <li><code>POST /admin/config/validate</code> — validate a config file.</li>
        <li><code>POST /admin/policy/validate</code> — validate a policy document.</li>
        <li>Transformation rules support a dry-run that takes a candidate rule + sample request and shows the transformed request.</li>
      </ul>
      <p>Use these in CI before deploying.</p>

      <Callout type="tip" title="fgpctl drives the same endpoints">
        Everything documented in the API pages is exactly what <code>fgpctl</code> calls
        underneath. Read the API page for the endpoint shape; reach for <code>fgpctl</code>{' '}
        for the human-friendly client. See <Link to="/reference/fgpctl">fgpctl reference</Link>.
      </Callout>

      <h2 id="hot-reload">Hot reload</h2>
      <p>
        Mutations land in the control-plane store. The proxy's store-watcher polls every{' '}
        <code>process.store_watch_interval</code> (default 5s) and atomically swaps the filter
        chain. There is no separate "reload" endpoint — apply the change, the proxy picks it
        up. See <Link to="/guides/hot-reload-and-runtime-ops">Hot reload and runtime ops</Link>{' '}
        for what is and isn't hot-reloadable.
      </p>

      <h2 id="admin-audit">Every mutation is audited</h2>
      <p>
        Every <code>POST</code>, <code>PUT</code>, and <code>DELETE</code> on the admin API
        lands in the admin audit log at <code>GET /admin/audit/admin-actions</code>. Records
        carry the actor identity (from API key, JWT, or mTLS), endpoint, path params, request
        id, and result. Forward to your SIEM for operator forensics.
      </p>

      <h2 id="rate-limits">Admin-side rate limits</h2>
      <p>
        The admin listener has its own rate limit, separate from data-plane rate limits, to
        guard against runaway scripts. Limits are conservative — single-digit RPS per token —
        and configurable under <code>admin.auth</code>.
      </p>

      <h2 id="endpoints">Endpoint groups</h2>
      <ul>
        <li><Link to="/api/status-and-config">Status and config</Link> — health, config dump, log level, compliance report.</li>
        <li><Link to="/api/policy">Policy</Link> — full doc, versions, diff, rollback, per-rule CRUD.</li>
        <li><Link to="/api/rate-limits">Rate limits</Link> — CRUD.</li>
        <li><Link to="/api/transformations">Transformations</Link> — CRUD + dry-run.</li>
        <li><Link to="/api/routing">Routing</Link> — CRUD.</li>
        <li><Link to="/api/producers-and-profiles">Producers and profiles</Link> — producer configs, NRF profiles, SBI peer ops, Diameter peers and stats.</li>
        <li><Link to="/api/observability">Observability</Link> — deep health, validate, metrics summary, audit.</li>
      </ul>
    </DocPage>
  );
}
