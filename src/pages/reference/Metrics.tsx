import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function Metrics() {
  return (
    <DocPage
      slug="reference/metrics"
      lede="Every Prometheus series exported by fluxgate-proxy. Series are split into proxy-side metrics, rate-limit and policy metrics, Diameter relay metrics, and the standard Go runtime metrics. Use the labels listed here to slice in dashboards and alerts."
    >
      <h2 id="scrape">Scrape</h2>
      <p>
        The <code>/metrics</code> endpoint is served on both the SBI listener
        (<code>:8090</code>) and the admin port (<code>:9091</code>), so metrics
        are reachable even when the SBI listener is not being scraped.
      </p>
      <CodeBlock lang="bash" code={`curl -s http://fgp.svc:8090/metrics
curl -s http://fgp.svc:9091/metrics`} />

      <h2 id="proxy-metrics">Proxy metrics</h2>

      <h3 id="requests-total">fgp_requests_total</h3>
      <p>Counter. Total requests through the proxy.</p>
      <p><strong>Labels:</strong> <code>method</code>, <code>target_nf_type</code>, <code>status_code</code>.</p>

      <h3 id="request-duration">fgp_request_duration_seconds</h3>
      <p>Histogram. End-to-end request latency.</p>
      <p><strong>Labels:</strong> <code>method</code>, <code>target_nf_type</code>.</p>

      <h3 id="active-requests">fgp_active_requests</h3>
      <p>Gauge. In-flight requests.</p>

      <h3 id="errors-total">fgp_errors_total</h3>
      <p>Counter. Proxy-side errors by category.</p>
      <p><strong>Labels:</strong> <code>category</code> (for example <code>circuit_breaker_open</code> or <code>filter_&lt;name&gt;</code>).</p>

      <h3 id="filter-decisions">fgp_filter_decisions_total</h3>
      <p>Counter. Decisions made by each filter, by outcome.</p>
      <p><strong>Labels:</strong> <code>filter</code> (<code>auth</code>, <code>policy</code>, <code>ratelimit:&lt;rule&gt;</code>, <code>transformation</code>), <code>decision</code> (<code>allowed</code> / <code>denied</code>).</p>

      <h3 id="filter-duration">fgp_filter_duration_seconds</h3>
      <p>Histogram. Time spent inside each filter.</p>
      <p><strong>Labels:</strong> <code>filter</code>, <code>phase</code>, <code>protocol</code>.</p>

      <h3 id="filter-chain-length">fgp_filter_chain_length</h3>
      <p>Gauge. Number of filters currently in the active chain.</p>
      <p><strong>Labels:</strong> <code>phase</code> (<code>request</code> / <code>response</code>).</p>

      <h3 id="producer-requests">fgp_producer_requests_total</h3>
      <p>Counter. Requests forwarded to a producer.</p>
      <p><strong>Labels:</strong> <code>nf_type</code>, <code>producer</code>, <code>result</code> (<code>success</code> / <code>error</code>).</p>

      <h3 id="circuit-breaker">fgp_circuit_breaker_open</h3>
      <p>Gauge. Per-producer circuit-breaker state: <code>1</code> open, <code>0</code> closed.</p>
      <p><strong>Labels:</strong> <code>nf_type</code>, <code>producer</code>.</p>

      <h2 id="rate-limit-and-policy">Rate limit and policy</h2>

      <h3 id="rate-limit-exceeded">fgp_rate_limit_exceeded_total</h3>
      <p>Counter. Requests rejected by rate limiting.</p>
      <p><strong>Labels:</strong> <code>rule</code>.</p>

      <h3 id="policy-reload-errors">fgp_policy_reload_errors_total</h3>
      <p>Counter. Failed policy reload attempts. Should stay flat; spikes indicate a malformed update reached the control-plane store.</p>

      <h3 id="sync-lag">fgp_sync_lag_seconds</h3>
      <p>Gauge. Seconds since the last successful policy sync from the control-plane store. Should hover near zero; rising lag means the store watcher is no longer applying updates.</p>

      <h2 id="diameter-metrics">Diameter relay</h2>

      <h3 id="diameter-requests">fgp_diameter_requests_total</h3>
      <p>Counter. Diameter requests handled by the relay, broken down by Application-Id, Command-Code, and observed Result-Code (all decimal strings).</p>
      <p><strong>Labels:</strong> <code>application</code>, <code>command</code>, <code>result_code</code>.</p>

      <h3 id="diameter-forward">fgp_diameter_forward_total</h3>
      <p>Counter. Relay forward outcomes.</p>
      <p><strong>Labels:</strong> <code>result</code> (<code>success</code>, <code>protocol_error</code>, <code>transient_failure</code>, <code>permanent_failure</code>, <code>unable_to_deliver</code>, <code>loop_detected</code>, <code>timeout</code>, <code>other</code>).</p>

      <h3 id="diameter-forward-duration">fgp_diameter_forward_duration_seconds</h3>
      <p>Histogram. Wall-clock latency of each forward attempt.</p>
      <p><strong>Labels:</strong> <code>result</code> (same set as <code>fgp_diameter_forward_total</code>).</p>

      <h3 id="diameter-loop">fgp_diameter_loop_detected_total</h3>
      <p>Counter. Loop-detection events (RFC 6733 §6.1.8). Should stay zero; non-zero means a routing misconfiguration or a misbehaving peer.</p>
      <p><strong>Labels:</strong> <code>direction</code> (<code>inbound</code> / <code>outbound</code>).</p>

      <h3 id="diameter-active-peers">fgp_diameter_active_peers</h3>
      <p>Gauge. Currently-open Diameter peer connections (post CER/CEA, pre disconnect). Alert if below expected baseline.</p>

      <h3 id="diameter-avp-unknown">fgp_diameter_avp_unknown_total</h3>
      <p>Counter. Wire AVPs whose (app, code, vendor) tuple is missing from the loaded dictionary. A non-zero rate means the runtime is falling back to OctetString for those AVPs.</p>
      <p><strong>Labels:</strong> <code>app</code>, <code>code</code>, <code>vendor</code>.</p>

      <h3 id="diameter-avp-type-mismatch">fgp_diameter_avp_type_mismatch_total</h3>
      <p>Counter. AVPs whose decoded wire type does not match the dictionary&apos;s declared type. Populated only under strict validation.</p>
      <p><strong>Labels:</strong> <code>app</code>, <code>code</code>.</p>

      <h3 id="diameter-dictionary-reload">fgp_diameter_dictionary_reload_total</h3>
      <p>Counter. Dictionary-reload outcomes.</p>
      <p><strong>Labels:</strong> <code>result</code> (<code>success</code> / <code>parse_error</code> / <code>merge_error</code>).</p>

      <h3 id="diameter-dictionary-avp-count">fgp_diameter_dictionary_avp_count</h3>
      <p>Gauge. AVPs loaded in the dictionary, re-set on every successful reload. Alert on accidental empty reloads (the gauge falling to zero for an app that previously had hundreds of AVPs).</p>
      <p><strong>Labels:</strong> <code>app</code>.</p>

      <h2 id="go-runtime">Go runtime</h2>
      <p>
        Standard Go runtime metrics are also registered: <code>go_goroutines</code>,
        <code>go_memstats_*</code>, <code>process_cpu_seconds_total</code>, file descriptors,
        and so on. Useful for capacity planning but not specific to fluxgate-proxy.
      </p>

      <Callout type="note" title="Label cardinality">
        <code>fgp_producer_requests_total</code> and <code>fgp_circuit_breaker_open</code>{' '}
        fan out by <code>producer</code>, making them the highest-cardinality
        proxy-side series. Keep an eye on these if your producer set is large; drop
        labels in your Prometheus config if cardinality becomes a problem.
      </Callout>

      <h2 id="related">Where to go next</h2>
      <ul>
        <li><Link to="/guides/observability">Setting up observability</Link> — scrape config, dashboards, alerts.</li>
        <li><Link to="/api/observability">Admin API → Observability</Link> — metrics summary and health endpoints.</li>
      </ul>
    </DocPage>
  );
}
