import DocPage from '../../components/DocPage';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function RequestPipeline() {
  return (
    <DocPage
      slug="concepts/request-pipeline"
      lede="Every SBI and Diameter request runs through one ordered filter chain before routing. The order is fixed in code; each filter can deny and short-circuit. Understanding the order tells you exactly what FGP did — and didn't — do on any given request."
    >
      <h2 id="overview">Pipeline overview</h2>
      <p>The full path from inbound to forwarded looks like this:</p>
      <pre><code>{`Filter Chain (request) → Routing → Forward → Response Stage`}</code></pre>
      <p>
        The filter chain is a plain ordered slice (<code>{`[]RequestFilter`}</code>). A filter
        denies by returning an error; the chain short-circuits and the request is rejected.
        Routing runs <em>after</em> the chain returns "allow" — routing is not itself a filter.
      </p>

      <h2 id="filter-order">Filter order</h2>
      <p>
        Built once by <code>{`buildRequestFilterChain`}</code>. Order is fixed in code — there
        is no per-filter priority knob.
      </p>

      <table>
        <thead>
          <tr><th>#</th><th>Filter</th><th>Included when</th></tr>
        </thead>
        <tbody>
          <tr><td>1</td><td><strong>Auth</strong> (OAuth2 / JWT)</td><td><code>oauth2_required: true</code></td></tr>
          <tr><td>2</td><td><strong>Policy</strong> (allow/deny)</td><td>always</td></tr>
          <tr><td>3..N</td><td>Rate limit</td><td>one filter per entry in <code>rate_limits[]</code></td></tr>
          <tr><td></td><td>Threat detection</td><td>IMSI-catcher or location-tracking enabled</td></tr>
          <tr><td></td><td>Anomaly scoring</td><td><code>anomaly_scoring.enabled: true</code></td></tr>
          <tr><td></td><td>Tenant</td><td><code>tenants[]</code> non-empty</td></tr>
          <tr><td></td><td><strong>Transformation</strong> (request phase)</td><td>request-phase rules in <code>transformation_rules[]</code></td></tr>
          <tr><td>last</td><td>Audit</td><td>always</td></tr>
        </tbody>
      </table>

      <Callout type="note" title="Audit runs last on purpose">
        The audit filter sits at the end of the chain so it sees the <em>final</em> decision,
        not an intermediate one. If policy denies, the audit record captures that. If a
        transformation modifies the request before forwarding, the audit record captures the
        post-transformation state.
      </Callout>

      <h2 id="what-each-filter-does">What each filter does</h2>

      <h3 id="auth">Auth</h3>
      <p>
        Validates the <code>Authorization: Bearer …</code> header against the configured OAuth2
        / JWT settings. Accepts RS256 with a configured public key, ES256/HS256 with the
        appropriate secret, and supports JWKS rotation. Rejects requests with missing or
        invalid tokens, expired tokens, or insufficient scope. Skipped entirely when{' '}
        <code>oauth2_required</code> is false.
      </p>

      <h3 id="policy">Policy</h3>
      <p>
        Evaluates the active policy rules in <strong>store order — first match wins</strong>.
        Each <code>PolicyRule</code> has an action (<code>allow</code>/<code>deny</code>) and a
        match block. If no rule matches, the configured default action applies. The v1 default
        is <code>deny</code> (fail-closed). See <Link to="/concepts/policy-engine">Policy engine</Link>{' '}
        for the full evaluation model.
      </p>

      <h3 id="rate-limit">Rate limit</h3>
      <p>
        One filter per entry in <code>rate_limits[]</code>. Each rate limit is a token bucket
        keyed by consumer identity, SUPI, NF type, or a combination. Exceeding a bucket denies
        the request with a configurable HTTP status (typically <code>429</code> on SBI,{' '}
        <code>DIAMETER_TOO_BUSY</code> on Diameter).
      </p>

      <h3 id="threat-detection">Threat detection</h3>
      <p>
        Detects IMSI-catcher signatures (high-volume identity requests) and location tracking
        (repeated cell-id queries for the same SUPI from different consumers). Configurable
        windows and thresholds. Decisions feed back into the audit record and metrics.
      </p>

      <h3 id="anomaly-scoring">Anomaly scoring</h3>
      <p>
        A sliding-window scorer that flags requests with unusual shape — rare paths, off-hours
        traffic, unfamiliar consumer identity. Configurable score thresholds turn high scores
        into deny decisions; the default is observe-only.
      </p>

      <h3 id="tenant">Tenant</h3>
      <p>
        Resolves the PLMN (<code>MCC</code> / <code>MNC</code>) in the SUPI or the
        Origin-Realm AVP to a tenant, attaches the tenant identity to the request, and rejects
        traffic for unknown tenants when configured. Used downstream by per-tenant quotas and
        per-tenant policy rules.
      </p>

      <h3 id="transform-request">Transformation (request phase)</h3>
      <p>
        Applies header injection / removal / rewriting and body field operations to the request
        before forwarding. Rules are sorted by <code>priority</code> ascending at filter-build
        time (lowest value runs first), per phase. Operators iterate with the dry-run endpoint
        so a malformed rule never reaches the data path. See{' '}
        <Link to="/concepts/transformation-engine">Transformation engine</Link>.
      </p>

      <h3 id="audit">Audit</h3>
      <p>
        Always last in the request chain. Builds a structured record (timestamp, request ID,
        method, path or AVP set, target NF type, source NF type, decision, deny reason, status
        code, duration) and enqueues it on the audit queue. Workers drain the queue and write
        to the audit store and fan out to any configured sinks.
      </p>

      <h2 id="routing">Routing</h2>
      <p>
        Routing runs <em>after</em> the filter chain returns "allow":
      </p>
      <ul>
        <li><strong>SBI:</strong> <code>RoutingEngine.Resolve</code> picks a target producer.</li>
        <li>
          <strong>Diameter:</strong> <code>RoutingEngine.ResolveWithFailover</code> picks a peer
          for the message's realm, with retry on the next peer if the first fails.
        </li>
      </ul>
      <p>
        Routing reads the same control-plane store as the filter chain — routing rules,
        producer pool, weights, sticky-session table, drained-peer set.
      </p>

      <h2 id="response-stage">Response stage</h2>
      <table>
        <thead>
          <tr><th></th><th>SBI</th><th>Diameter</th></tr>
        </thead>
        <tbody>
          <tr><td>Wrapper</td><td><code>ResponseFilterChain</code> (3 filters)</td><td>Single <code>TransformationResponseFilter</code></td></tr>
          <tr><td>Filters</td><td>HeaderStrip → TopologyHiding → Transformation (response)</td><td>Transformation (response) only — <code>ApplyDiameterAnswer</code></td></tr>
          <tr><td>Failure semantics</td><td>Filter error in <code>ModifyResponse</code> → 502 to client; retry path logs and continues</td><td>Errors logged, answer still sent</td></tr>
          <tr><td>Audit pairing</td><td><code>EmitResponseAudit</code> via chain</td><td><code>EmitResponseAudit</code> invoked explicitly from <code>saveDiameterAudit</code></td></tr>
        </tbody>
      </table>

      <h2 id="hot-reload">Hot reload</h2>
      <p>
        Each chain is immutable once built. When a config or control-plane-store change lands,
        FGP builds fresh request and response chains and replaces them atomically. The SBI
        proxy and Diameter relay both receive the same chain pointer — policy stays consistent
        across protocols, and there is no per-request lock. See{' '}
        <Link to="/guides/hot-reload-and-runtime-ops">Hot reload and runtime ops</Link>.
      </p>
    </DocPage>
  );
}
