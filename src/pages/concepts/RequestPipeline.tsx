import DocPage from '../../components/DocPage';
import Callout from '../../components/Callout';
import CodeBlock from '../../components/CodeBlock';
import { Link } from 'react-router-dom';

export default function RequestPipeline() {
  return (
    <DocPage
      slug="concepts/request-pipeline"
      lede="Every SBI and Diameter request runs through one ordered filter chain before routing. The order is fixed; each filter can deny and short-circuit. Understanding the order tells you exactly what the proxy did — and didn't — do on any given request."
    >
      <h2 id="overview">Pipeline overview</h2>
      <p>The full path from inbound to forwarded looks like this:</p>
      <CodeBlock code={`Filter chain (request) → Routing → Forward → Response stage`} />
      <p>
        The request filter chain is an ordered sequence of filters. A filter denies by
        returning an error; the chain short-circuits and the request is rejected without
        running the filters that follow. Routing runs <em>after</em> the chain allows the
        request — routing is not itself a filter.
      </p>

      <h2 id="filter-order">Filter order</h2>
      <p>
        The request chain has exactly four filters, in this fixed order. There is no
        per-filter priority knob for the chain itself; each filter is added only when its
        feature is configured.
      </p>

      <table>
        <thead>
          <tr><th>#</th><th>Filter</th><th>Included when</th></tr>
        </thead>
        <tbody>
          <tr><td>1</td><td><strong>Auth</strong> (OAuth2 / JWT)</td><td><code>oauth2_required: true</code></td></tr>
          <tr><td>2</td><td><strong>Policy</strong> (allow/deny)</td><td>always</td></tr>
          <tr><td>3..N</td><td><strong>Rate limit</strong></td><td>one filter per entry in <code>rate_limits[]</code></td></tr>
          <tr><td>last</td><td><strong>Transformation</strong> (request phase)</td><td><code>transformation_rules[]</code> non-empty</td></tr>
        </tbody>
      </table>

      <Callout type="note" title="Decisions are logged, not audited">
        The proxy has no audit store. Each request's decision (allow or deny, the deny reason,
        the matched rule, and timing) is emitted as a structured JSON log line and counted in
        Prometheus metrics. Ship those logs to your log pipeline or SIEM. See{' '}
        <Link to="/concepts/policy-engine">Policy engine</Link> for the decision model and{' '}
        <Link to="/guides/observability">Setting up observability</Link> for the log and metric surface.
      </Callout>

      <h2 id="what-each-filter-does">What each filter does</h2>

      <h3 id="auth">Auth</h3>
      <p>
        Validates the <code>Authorization: Bearer …</code> header against the configured OAuth2
        / JWT settings. Tokens must be signed with RS256; the proxy verifies the signature
        against a configured public key or a key fetched by <code>kid</code> from a JWKS URL,
        which supports key rotation. It enforces required scopes and can optionally reject
        replayed tokens by <code>jti</code>. Requests with a missing, invalid, expired, or
        out-of-scope token are denied. The filter is skipped entirely when{' '}
        <code>oauth2_required</code> is false.
      </p>

      <h3 id="policy">Policy</h3>
      <p>
        Evaluates the active policy rules in <strong>priority order — first match wins</strong>.
        Rules are sorted by <code>priority</code> ascending (lower value runs first), with the
        rule name as a deterministic tiebreak. Each <code>PolicyRule</code> has an action
        (<code>allow</code> / <code>deny</code>) and its conditions. If no rule matches, the
        configured default action applies. The v1 default is <code>deny</code> (fail-closed).
        See <Link to="/concepts/policy-engine">Policy engine</Link> for the full evaluation model.
      </p>

      <h3 id="rate-limit">Rate limit</h3>
      <p>
        One filter is added per entry in <code>rate_limits[]</code>. Each rate-limit rule is a
        token bucket keyed by consumer identity, SUPI, NF type, or a combination. When a bucket
        is exhausted the filter denies the request and the chain short-circuits. See{' '}
        <Link to="/guides/rate-limiting">Configuring rate limiting</Link>.
      </p>

      <h3 id="transform-request">Transformation (request phase)</h3>
      <p>
        Applies header injection, removal, and rewriting, plus body field operations, to the
        request before forwarding. Request-phase rules run in <code>priority</code> order
        (lowest value first). The filter is added only when <code>transformation_rules[]</code>{' '}
        is non-empty. See <Link to="/concepts/transformation-engine">Transformation engine</Link>.
      </p>

      <h2 id="routing">Routing</h2>
      <p>
        Routing runs <em>after</em> the filter chain allows the request:
      </p>
      <ul>
        <li><strong>SBI:</strong> the routing engine picks a target producer.</li>
        <li>
          <strong>Diameter:</strong> the routing engine picks a peer for the message's realm,
          retrying on the next peer if the first fails.
        </li>
      </ul>
      <p>
        Routing reads the same control-plane store as the filter chain — routing rules,
        producer pool, weights, sticky-session table, drained-peer set. See{' '}
        <Link to="/concepts/routing-engine">Routing engine</Link>.
      </p>

      <h2 id="response-stage">Response stage</h2>
      <p>
        After the producer (or peer) answers, the response runs through a separate response
        stage before it reaches the consumer.
      </p>
      <table>
        <thead>
          <tr><th></th><th>SBI</th><th>Diameter</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Steps</td>
            <td>Strip configured response headers → apply topology hiding (mask internal producer addresses) → apply response-phase transformation rules</td>
            <td>Apply response-phase transformation rules to the answer</td>
          </tr>
          <tr>
            <td>Failure semantics</td>
            <td>A response-rewrite error returns <code>502</code> to the consumer; the retry path logs and continues</td>
            <td>Errors are logged and the answer is still sent</td>
          </tr>
        </tbody>
      </table>

      <h2 id="hot-reload">Hot reload</h2>
      <p>
        Each chain is immutable once built. When a config or control-plane-store change lands,
        the proxy builds fresh request and response chains and swaps them in atomically. The SBI
        proxy and the Diameter relay both pick up the new chains without dropping in-flight
        requests, so policy stays consistent across protocols. See{' '}
        <Link to="/guides/hot-reload-and-runtime-ops">Hot reload and runtime ops</Link>.
      </p>
    </DocPage>
  );
}
