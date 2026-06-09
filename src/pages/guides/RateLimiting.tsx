import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function RateLimiting() {
  return (
    <DocPage
      slug="guides/rate-limiting"
      lede="fluxgate-proxy rate-limits with token buckets keyed by source NF type, subscriber SUPI, or a Diameter dimension. Rate-limit rules are first-class entries in the control-plane store: write them as JSON, hot-reload, and watch denials through Prometheus and the structured decision logs."
    >
      <h2 id="model">The token-bucket model</h2>
      <p>Each rate-limit rule is a token bucket with two rate knobs plus a key:</p>
      <ul>
        <li><code>rps</code> — tokens added per second (the steady-state limit).</li>
        <li><code>burst</code> — bucket capacity (peak traffic accepted instantly).</li>
        <li>
          a key that selects what gets its own bucket — see{' '}
          <a href="#keys">Choose the right key</a>.
        </li>
      </ul>
      <p>
        A request consumes one token. If the bucket is empty, the request is denied — 429 on
        SBI, <code>DIAMETER_AUTHORIZATION_REJECTED</code> (5003) on Diameter — and the denial
        increments the <code>fgp_rate_limit_exceeded_total</code> counter and is written to the
        structured decision log.
      </p>

      <h2 id="write-a-rule">Write a rule</h2>
      <p>
        A limit at 100 RPS, burst 200, scoped to traffic from UDM consumers:
      </p>
      <CodeBlock lang="json" code={`{
  "name": "udm-source-cap",
  "source_nf_type": "UDM",
  "rps": 100,
  "burst": 200
}`} />

      <p>Deploy it:</p>
      <CodeBlock lang="bash" code={`fgpctl rate-limits add @udm-source-cap.json`} />

      <p>
        <code>fgpctl</code> talks to the admin API on <code>http://127.0.0.1:9091</code> by
        default. See <Link to="/reference/fgpctl">the fgpctl reference</Link> for auth and the
        base-URL flag.
      </p>

      <h2 id="keys">Choose the right key</h2>
      <p>
        <code>source_nf_type</code> scopes which traffic a rule <em>applies to</em> (by source
        NF type). The bucket dimension — what gets its own counter — is set separately:
      </p>
      <ul>
        <li>
          <strong><code>key_by_supi: true</code></strong> — one bucket per subscriber SUPI. Use
          this so a single misbehaving UE can't drown out other subscribers.
        </li>
        <li>
          <strong><code>key</code></strong> — selects an explicit bucket dimension. One of:
          <code>global</code> (a single cluster-wide bucket),
          <code>diameter_origin_host</code>, <code>diameter_origin_realm</code>,
          <code>diameter_app_id</code>, <code>diameter_command_code</code>, or
          <code>imsi_prefix:N</code> (the first <code>N</code> IMSI digits — e.g.
          <code>imsi_prefix:6</code> is MCC+MNC).
        </li>
        <li>
          <strong>neither set</strong> — the legacy default: one bucket per source IP on SBI,
          per Origin-Host on Diameter.
        </li>
      </ul>
      <p>
        An unknown <code>key</code> value is a load-time error, so a typo fails the reload rather
        than silently passing traffic.
      </p>

      <Callout type="warning" title="Watch bucket cardinality">
        A per-SUPI bucket holds state per active subscriber. Millions of active SUPIs means
        millions of buckets — memory grows with traffic. A background sweep runs every minute and
        evicts buckets idle for more than five minutes, but spikes can still pressure memory.
        Profile in staging before deploying <code>key_by_supi</code> limits at scale.
      </Callout>

      <h2 id="multiple-limits">Multiple limits on the same traffic</h2>
      <p>
        Each entry in <code>rate_limits[]</code> becomes a separate filter in the request chain.
        A request that matches two rules consumes a token from <em>both</em> buckets and is
        denied by whichever is tighter.
      </p>
      <p>Layered protection looks like:</p>
      <ol>
        <li>A <code>global</code> cap to protect producers in aggregate.</li>
        <li>A per-source-NF-type cap to bound any single consumer class.</li>
        <li>A <code>key_by_supi</code> cap for hot-subscriber protection.</li>
      </ol>

      <h2 id="observe">Observe</h2>
      <p>Two Prometheus series tell the rate-limiting story:</p>
      <ul>
        <li>
          <code>fgp_rate_limit_exceeded_total{`{rule="…"}`}</code> — counter, ticks every time a
          bucket denies a request, labelled by rule name.
        </li>
        <li>
          <code>fgp_filter_decisions_total{`{filter="ratelimit:<rule>", decision="deny"}`}</code> —
          the same denial seen through the generic filter-decision counter (the filter label is
          the rule's filter name, <code>ratelimit:</code> plus the rule name).
        </li>
      </ul>
      <p>
        Alert on <code>fgp_rate_limit_exceeded_total</code> rising sharply — that's either a real
        attack or a legitimate workload outgrowing its cap. Each denial is also logged as a
        structured JSON record carrying <code>request_id</code>, <code>source_nf</code>,
        <code>target_nf</code>, the bucket <code>key</code>, and the <code>rule</code> name, so
        you can slice denials by source or subscriber in your log pipeline before reflexively
        raising the limit.
      </p>

      <h2 id="hot-reload">Hot reload</h2>
      <p>
        Rate-limit rules hot-reload like every other control-plane mutation — the filter chain
        rebuilds and the new bucket set takes effect on the next request. See{' '}
        <Link to="/guides/hot-reload-and-runtime-ops">Hot reload and runtime ops</Link> for the
        reload guarantee and how in-flight buckets carry over or reset.
      </p>

      <h2 id="related">Where to go next</h2>
      <ul>
        <li><Link to="/concepts/request-pipeline">Request pipeline</Link> — where rate limits sit in the chain.</li>
        <li><Link to="/reference/config-schema">Config schema</Link> — the full RateLimitRule fields.</li>
        <li><Link to="/api/rate-limits">Admin API → Rate limits</Link>.</li>
      </ul>
    </DocPage>
  );
}
