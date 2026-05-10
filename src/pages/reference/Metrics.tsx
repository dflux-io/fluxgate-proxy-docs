import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function Metrics() {
  return (
    <DocPage
      slug="reference/metrics"
      lede="Every Prometheus series exported by FGP. The metrics endpoint is /metrics on the SBI listener. Series are split into proxy-side metrics, Diameter relay metrics, and audit-pipeline metrics. Use the labels listed here to slice in dashboards and alerts."
    >
      <h2 id="scrape">Scrape</h2>
      <CodeBlock lang="bash" code={`curl -s http://fgp.svc:8090/metrics`} />

      <h2 id="proxy-metrics">Proxy metrics</h2>

      <h3 id="requests-total">fgp_requests_total</h3>
      <p>Counter. Total requests through the proxy.</p>
      <p><strong>Labels:</strong> <code>method</code>, <code>nf_type</code>, <code>status_code</code>.</p>

      <h3 id="request-duration">fgp_request_duration_seconds</h3>
      <p>Histogram. End-to-end request latency.</p>
      <p><strong>Labels:</strong> <code>method</code>, <code>nf_type</code>.</p>

      <h3 id="active-requests">fgp_active_requests</h3>
      <p>Gauge. In-flight requests.</p>

      <h3 id="errors-total">fgp_errors_total</h3>
      <p>Counter. Proxy-side errors by kind.</p>
      <p><strong>Labels:</strong> <code>kind</code> (<code>upstream_timeout</code>, <code>upstream_5xx</code>, <code>filter_error</code>, …).</p>

      <h3 id="filter-decisions">fgp_filter_decisions_total</h3>
      <p>Counter. Decisions made by each filter, by outcome.</p>
      <p><strong>Labels:</strong> <code>filter</code> (<code>auth</code>, <code>policy</code>, <code>rate-limit</code>, <code>threat</code>, <code>anomaly</code>, <code>tenant</code>, <code>transform</code>, <code>audit</code>), <code>decision</code> (<code>allowed</code> / <code>denied</code>).</p>

      <h3 id="filter-duration">fgp_filter_duration_seconds</h3>
      <p>Histogram. Time spent inside each filter.</p>
      <p><strong>Labels:</strong> <code>filter</code>.</p>

      <h3 id="filter-chain-length">fgp_filter_chain_length</h3>
      <p>Gauge. Number of filters currently in the request chain.</p>
      <p><strong>Labels:</strong> <code>kind</code> (<code>request</code> / <code>response</code>).</p>

      <h3 id="producer-requests">fgp_producer_requests_total</h3>
      <p>Counter. Requests forwarded to a producer.</p>
      <p><strong>Labels:</strong> <code>nf_type</code>, <code>producer</code>, <code>result</code> (<code>success</code> / <code>error</code> / <code>timeout</code>).</p>

      <h3 id="circuit-breaker">fgp_circuit_breaker_state</h3>
      <p>Gauge. Per-producer circuit-breaker state. <code>0</code> closed, <code>1</code> open, <code>2</code> half-open.</p>
      <p><strong>Labels:</strong> <code>nf_type</code>, <code>producer</code>.</p>

      <h2 id="rate-limit-and-policy">Rate limit and policy</h2>

      <h3 id="rate-limit-exceeded">fgp_rate_limit_exceeded_total</h3>
      <p>Counter. Denials by rate-limit rule.</p>
      <p><strong>Labels:</strong> <code>rule</code>.</p>

      <h3 id="policy-version">fgp_policy_version</h3>
      <p>Gauge. Current active policy version. Use as a deploy marker.</p>

      <h3 id="policy-reload-errors">fgp_policy_reload_errors_total</h3>
      <p>Counter. Failed policy reload attempts. Should stay flat; spikes indicate a malformed update reached the store.</p>

      <h2 id="tenant-metrics">Tenant</h2>

      <h3 id="tenant-requests">fgp_tenant_requests_total</h3>
      <p>Counter. Requests per tenant.</p>
      <p><strong>Labels:</strong> <code>tenant</code>, <code>decision</code>.</p>

      <h3 id="tenant-quota">fgp_tenant_quota_usage</h3>
      <p>Gauge. Tokens consumed in the current window, per tenant.</p>
      <p><strong>Labels:</strong> <code>tenant</code>.</p>

      <h2 id="audit-metrics">Audit pipeline</h2>

      <h3 id="audit-queue-depth">fgp_audit_queue_depth</h3>
      <p>Gauge. Current size of the audit pipeline queue. Alert at &gt; 80% of capacity for &gt; 5m.</p>

      <h3 id="audit-queue-capacity">fgp_audit_queue_capacity</h3>
      <p>Gauge. Configured capacity. Useful in dashboards alongside <code>depth</code>.</p>

      <h3 id="audit-sink-drops">fgp_audit_sink_drops_total</h3>
      <p>Counter. Batches dropped after exceeding <code>max_retries</code>.</p>
      <p><strong>Labels:</strong> <code>sink</code> (<code>webhook</code> / <code>syslog</code> / <code>file</code>).</p>

      <h3 id="sync-lag">fgp_sync_lag_seconds</h3>
      <p>Gauge. Age of the most recent enqueued audit record. Should hover near zero; rising lag is a sink-side problem.</p>

      <h3 id="audit-export-lag">fgp_audit_export_lag_seconds</h3>
      <p>Gauge. Age of the most recent successfully-exported record. Trails <code>sync_lag</code> by the batch interval.</p>

      <h2 id="diameter-metrics">Diameter relay</h2>

      <h3 id="diameter-requests">fgp_diameter_requests_total</h3>
      <p>Counter. Diameter requests received.</p>
      <p><strong>Labels:</strong> <code>application_id</code>, <code>command_code</code>, <code>direction</code>.</p>

      <h3 id="diameter-forward">fgp_diameter_forward_total</h3>
      <p>Counter. Requests forwarded to a peer.</p>
      <p><strong>Labels:</strong> <code>peer</code>, <code>application_id</code>, <code>command_code</code>, <code>result</code>.</p>

      <h3 id="diameter-forward-duration">fgp_diameter_forward_duration_seconds</h3>
      <p>Histogram. Forward latency by peer + application.</p>
      <p><strong>Labels:</strong> <code>peer</code>, <code>application_id</code>.</p>

      <h3 id="diameter-loop">fgp_diameter_loop_detected_total</h3>
      <p>Counter. Loop-detection trips. Should stay zero; non-zero means a routing misconfiguration or a peer doing something weird.</p>
      <p><strong>Labels:</strong> <code>peer</code>.</p>

      <h3 id="diameter-active-peers">fgp_diameter_active_peers</h3>
      <p>Gauge. Peers currently in <code>STATE_OPEN</code>. Alert if below expected baseline.</p>

      <h2 id="go-runtime">Go runtime</h2>
      <p>
        Standard Go runtime metrics are also registered: <code>go_goroutines</code>,
        <code>go_memstats_*</code>, <code>process_cpu_seconds_total</code>, file descriptors,
        etc. Useful for capacity planning but not FGP-specific.
      </p>

      <Callout type="note" title="Label cardinality">
        <code>fgp_diameter_forward_total</code> and <code>fgp_producer_requests_total</code>{' '}
        are the highest-cardinality series in FGP — they fan out by peer / producer. Keep an
        eye on these if your peer set is large; drop labels in your Prometheus config if
        cardinality becomes a problem.
      </Callout>

      <h2 id="related">Related</h2>
      <ul>
        <li><Link to="/guides/observability">Observability</Link> — scrape config, dashboards, alerts.</li>
        <li><Link to="/api/observability">Admin API → Observability</Link> — metrics summary and health endpoints.</li>
      </ul>
    </DocPage>
  );
}
