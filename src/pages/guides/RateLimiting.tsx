import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function RateLimiting() {
  return (
    <DocPage
      slug="guides/rate-limiting"
      lede="FGP rate-limits with token buckets keyed by consumer identity, SUPI, NF type, or a combination. Limits are first-class rules in the control plane: write them as JSON, hot-reload, observe via Prometheus, and tune from the audit trail."
    >
      <h2 id="model">The token-bucket model</h2>
      <p>Each rate-limit rule is a token bucket with three knobs:</p>
      <ul>
        <li><code>rate</code> — tokens added per second (the steady-state limit).</li>
        <li><code>burst</code> — bucket capacity (peak traffic accepted instantly).</li>
        <li><code>key</code> — what gets its own bucket (per-consumer, per-SUPI, per-NF-type, or composite).</li>
      </ul>
      <p>
        A request consumes one token. If the bucket is empty, the request is denied — 429 on
        SBI, <code>DIAMETER_TOO_BUSY</code> on Diameter — and the denial lands in the audit
        trail and the <code>fgp_rate_limit_exceeded_total</code> counter.
      </p>

      <h2 id="write-a-rule">Write a rule</h2>
      <p>
        A per-consumer limit at 100 RPS, burst 200, scoped to UDM traffic:
      </p>
      <CodeBlock lang="json" code={`{
  "name": "per-consumer-udm",
  "rate": 100,
  "burst": 200,
  "key": "consumer",
  "match": {
    "nf_type": "UDM"
  },
  "description": "Cap per-consumer UDM traffic at 100 RPS / 200 burst."
}`} />

      <p>Deploy:</p>
      <CodeBlock lang="bash" code={`fgpctl rate-limits add @per-consumer-udm.json`} />

      <h2 id="keys">Choose the right key</h2>
      <ul>
        <li>
          <strong><code>consumer</code></strong> — one bucket per upstream consumer identity
          (derived from OAuth2 subject, mTLS client cert, or NF discovery context). Use this
          when you want to protect downstream producers from a runaway consumer.
        </li>
        <li>
          <strong><code>supi</code></strong> — one bucket per subscriber. Use this when a single
          UE going wild shouldn't drown out other UEs.
        </li>
        <li>
          <strong><code>nf_type</code></strong> — one bucket per target NF type. Use this when
          you want a hard cap on producer load regardless of which consumer is calling.
        </li>
        <li>
          <strong>Composite keys</strong> — e.g. <code>consumer+supi</code> for "no single
          consumer can spam any single subscriber". Use sparingly; bucket cardinality multiplies.
        </li>
      </ul>

      <Callout type="warning" title="Watch bucket cardinality">
        A per-SUPI bucket holds state per active subscriber. Millions of active SUPIs means
        millions of buckets — memory grows with traffic. The bucket store uses sliding-window
        sweeping to drop idle buckets, but spikes can pressure memory. Profile in staging
        before deploying per-SUPI limits at scale.
      </Callout>

      <h2 id="multiple-limits">Multiple limits on the same traffic</h2>
      <p>
        Each entry in <code>rate_limits[]</code> becomes a separate filter in the request
        chain. A request that matches two rules consumes a token from <em>both</em> buckets and
        is rate-limited by whichever is tighter.
      </p>
      <p>Layered protection looks like:</p>
      <ol>
        <li>Per-NF-type global cap to protect producers in aggregate.</li>
        <li>Per-consumer cap to bound any single consumer.</li>
        <li>Per-SUPI cap for hot-subscriber protection.</li>
      </ol>

      <h2 id="observe">Observe</h2>
      <p>Two Prometheus series tell the rate-limiting story:</p>
      <ul>
        <li>
          <code>fgp_rate_limit_exceeded_total{`{rule="…"}`}</code> — counter, ticks every time a
          bucket denies a request.
        </li>
        <li>
          <code>fgp_filter_decisions_total{`{filter="rate-limit", decision="denied"}`}</code> —
          the same denial seen through the generic filter-decision counter.
        </li>
      </ul>
      <p>
        Alert on <code>rate_limit_exceeded_total</code> rising sharply — that's either a real
        attack or a legitimate workload outgrowing its cap. Investigate via the audit trail
        before reflexively raising the limit.
      </p>

      <h2 id="tune">Tune from audit</h2>
      <p>
        The audit record carries the matched rule name and the denial reason. Slice by
        consumer / SUPI / NF-type to see which key is hitting the cap.
      </p>
      <CodeBlock lang="bash" code={`fgpctl audit export --decision denied --limit 1000 \\
  | jq '[.[] | select(.deny_reason | startswith("rate_limit:"))] | group_by(.consumer) | map({consumer: .[0].consumer, denials: length})'`} />

      <h2 id="hot-reload">Hot reload</h2>
      <p>
        Rate-limit rules hot-reload like every other control-plane mutation. The filter chain
        rebuilds, the new bucket set takes effect on the next request, and in-flight buckets
        either carry over (same name + key) or are reset (renamed or changed key).
      </p>

      <h2 id="related">Related</h2>
      <ul>
        <li><Link to="/concepts/request-pipeline">Request pipeline</Link> — where rate limits sit in the chain.</li>
        <li><Link to="/reference/policy-schema">Policy schema</Link> — rate-limit rule fields.</li>
        <li><Link to="/api/rate-limits">Admin API → Rate limits</Link>.</li>
      </ul>
    </DocPage>
  );
}
