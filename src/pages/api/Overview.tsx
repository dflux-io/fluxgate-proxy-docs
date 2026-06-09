import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function Overview() {
  return (
    <DocPage
      slug="api/overview"
      lede="The admin API is the HTTP control surface for fluxgate-proxy. fgpctl is a thin client over it, and you can drive it from curl or any HTTP client. This page covers auth, base URL, content types, error model, idempotency, and the dry-run pattern."
    >
      <h2 id="base-url">Base URL</h2>
      <p>
        The admin listener defaults to <code>127.0.0.1:9091</code>. Everywhere in this section
        we use a placeholder host:
      </p>
      <CodeBlock lang="text" code={`https://fgp.svc:9091`} />

      <p>
        Production should expose the admin listener over HTTPS with TLS configured under
        <code>admin.tls</code>. See <Link to="/guides/securing-the-admin-api">Securing the admin API</Link>.
      </p>

      <h2 id="auth">Authentication</h2>
      <p>
        This page is the canonical home for admin API authentication; other <code>/api/*</code>{' '}
        pages link here. The admin API accepts two credential types, configured under{' '}
        <code>admin.auth</code>:
      </p>
      <ul>
        <li>
          <strong>API key</strong> — pass in the <code>X-Admin-Key</code> header.
          <CodeBlock lang="bash" code={`curl -H "X-Admin-Key: $FGP_ADMIN_KEY" https://fgp.svc:9091/admin/status`} />
        </li>
        <li>
          <strong>JWT bearer</strong> — pass in the <code>Authorization: Bearer …</code> header.
          The proxy validates the signature and expiry, then maps the token's{' '}
          <code>role</code> claim to an admin role for role-based access control.
        </li>
      </ul>
      <p>
        Each request tries the bearer token first, then falls back to the API key. When
        neither <code>admin.auth</code> credentials nor <code>admin.allow_anonymous: true</code>{' '}
        is configured, the proxy refuses to start.
      </p>
      <p>
        On top of credentials, you can require a client certificate at the transport layer
        with <code>admin.require_client_cert: true</code> (which needs{' '}
        <code>admin.tls.ca_file</code>). This is transport hardening, not a third credential
        type — see <Link to="/guides/securing-the-admin-api">Securing the admin API</Link>.
      </p>

      <h2 id="content-types">Content types</h2>
      <ul>
        <li>Requests with a body: <code>Content-Type: application/json</code>.</li>
        <li>Responses are <code>application/json</code> unless documented otherwise (e.g. the Prometheus exposition format from <code>/metrics</code>).</li>
        <li>UTF-8 throughout.</li>
      </ul>

      <h2 id="error-model">Error model</h2>
      <p>Errors are JSON with a stable shape:</p>
      <CodeBlock lang="json" code={`{
  "error": {
    "code": "validation_failed",
    "message": "rules[0].methods: invalid HTTP method 'POSST'",
    "details": [
      {"path": "rules[0].methods", "issue": "must be one of GET, POST, PUT, …"}
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
        <li><strong>409</strong> — conflict (e.g. creating a rule whose name already exists).</li>
        <li><strong>422</strong> — semantically valid request that violates a constraint (e.g. restoring a nonexistent policy snapshot).</li>
        <li><strong>500</strong> — internal error. Check the proxy logs.</li>
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

      <h2 id="decision-logs">Mutations and decisions are logged</h2>
      <p>
        Admin mutations and data-path decisions are emitted as structured JSON logs (zerolog),
        not stored in a queryable audit endpoint — there is no admin audit API. Ship those logs
        to your log pipeline or SIEM for operator forensics, and pair them with Prometheus
        metrics. See <Link to="/api/observability">Observability</Link>.
      </p>

      <h2 id="endpoints">Endpoint groups</h2>
      <ul>
        <li><Link to="/api/status-and-config">Status and config</Link> — health, config dump, log level.</li>
        <li><Link to="/api/policy">Policy</Link> — read-only policy doc, snapshots (create/restore), per-rule CRUD.</li>
        <li><Link to="/api/rate-limits">Rate limits</Link> — CRUD.</li>
        <li><Link to="/api/transformations">Transformations</Link> — CRUD + dry-run.</li>
        <li><Link to="/api/routing">Routing</Link> — CRUD.</li>
        <li><Link to="/api/producers-and-profiles">Producers and profiles</Link> — producer configs, NRF profiles, SBI peer ops, Diameter peers and stats.</li>
        <li><Link to="/api/observability">Observability</Link> — deep health, metrics summary.</li>
      </ul>
    </DocPage>
  );
}
