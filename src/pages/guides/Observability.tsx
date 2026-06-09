import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function Observability() {
  return (
    <DocPage
      slug="guides/observability"
      lede="fluxgate-proxy emits Prometheus metrics, structured logs, OTLP traces, and a deep health endpoint. This guide covers how to scrape, dashboard, alert, and trace through a typical deployment."
    >
      <h2 id="metrics">Prometheus metrics</h2>
      <p>
        Metrics are exposed on the SBI listener at <code>/metrics</code>. Common request:
      </p>
      <CodeBlock lang="bash" code={`curl -s http://fgp.svc:8090/metrics | head -40`} />

      <p>Headline series to scrape and dashboard:</p>
      <ul>
        <li><code>fgp_requests_total</code> (counter) — total requests, by <code>method</code>, <code>target_nf_type</code>, <code>status_code</code>.</li>
        <li><code>fgp_request_duration_seconds</code> (histogram) — end-to-end request latency, by <code>method</code> and <code>target_nf_type</code>.</li>
        <li><code>fgp_active_requests</code> (gauge) — in-flight requests.</li>
        <li><code>fgp_errors_total</code> (counter) — proxy-side errors by <code>category</code>.</li>
        <li><code>fgp_filter_decisions_total</code> (counter) — decisions by <code>filter</code> and <code>decision</code>.</li>
        <li><code>fgp_rate_limit_exceeded_total</code> (counter) — denials by rate-limit <code>rule</code>.</li>
        <li><code>fgp_producer_requests_total</code> (counter) — forwarded requests by <code>nf_type</code>, <code>producer</code>, and <code>result</code>.</li>
        <li><code>fgp_circuit_breaker_open</code> (gauge) — per-producer breaker state (1=open, 0=closed), by <code>nf_type</code> and <code>producer</code>.</li>
        <li><code>fgp_sync_lag_seconds</code> (gauge) — seconds since the last successful policy sync from the control-plane store.</li>
        <li><code>fgp_policy_reload_errors_total</code> (counter) — failed policy reload attempts.</li>
        <li><code>fgp_diameter_requests_total</code> (counter) — Diameter requests by <code>application</code>, <code>command</code>, and <code>result_code</code>.</li>
        <li><code>fgp_diameter_forward_total</code> (counter) — forwarded requests by <code>result</code>.</li>
        <li><code>fgp_diameter_forward_duration_seconds</code> (histogram) — Diameter forward latency by <code>result</code>.</li>
        <li><code>fgp_diameter_active_peers</code> (gauge) — peers currently up.</li>
      </ul>

      <p>
        Full label list lives in <Link to="/reference/metrics">Reference → Metrics</Link>.
      </p>

      <h2 id="scrape-config">Scrape config</h2>
      <CodeBlock lang="yaml" code={`# prometheus.yml
scrape_configs:
  - job_name: fluxgate-proxy
    metrics_path: /metrics
    static_configs:
      - targets: ["fgp.svc:8090"]
    relabel_configs:
      - source_labels: [__address__]
        target_label: instance`} />

      <p>
        Scrape every 15s. Most series are cheap; the three histograms —
        {' '}<code>fgp_request_duration_seconds</code>, <code>fgp_filter_duration_seconds</code>, and{' '}
        <code>fgp_diameter_forward_duration_seconds</code> — carry the bulk of the cardinality.
      </p>

      <h2 id="dashboards">Dashboards</h2>
      <p>A four-panel core dashboard covers most operational questions:</p>
      <ol>
        <li><strong>Request rate</strong> by <code>target_nf_type</code> and decision (allowed / denied).</li>
        <li><strong>P50 / P95 / P99 latency</strong> from <code>fgp_request_duration_seconds</code>.</li>
        <li><strong>Filter decisions</strong> stacked by filter (auth / policy / rate-limit / transformation).</li>
        <li><strong>Producer health</strong> from <code>fgp_producer_requests_total</code> + circuit-breaker state.</li>
      </ol>

      <p>For Diameter:</p>
      <ol>
        <li>Peer count from <code>fgp_diameter_active_peers</code>.</li>
        <li>Per-command request rate from <code>fgp_diameter_requests_total</code>.</li>
        <li>Forward latency P95 from <code>fgp_diameter_forward_duration_seconds</code>.</li>
        <li>Loop detection counter <code>fgp_diameter_loop_detected_total</code>.</li>
      </ol>

      <h2 id="alerts">Alerts to set early</h2>
      <ul>
        <li>
          <strong>Sync lag rising.</strong> <code>fgp_sync_lag_seconds</code> climbing past your
          sync interval means the proxy can't reach the control-plane store; running policy is
          going stale.
        </li>
        <li>
          <strong>Policy reload errors &gt; 0.</strong> <code>fgp_policy_reload_errors_total</code>{' '}
          incremented — a reload was rejected and the previous policy is still in force.
        </li>
        <li>
          <strong>Producer error rate &gt; 5% over 5m.</strong> Producer-side issue or routing
          misconfiguration.
        </li>
        <li>
          <strong>Circuit breaker open on any producer.</strong> <code>fgp_circuit_breaker_open</code>{' '}
          is 1 — that producer is out of rotation. Page if it persists.
        </li>
        <li>
          <strong>Diameter active peers below expected count.</strong> A peer dropped and isn't
          reconnecting.
        </li>
      </ul>

      <h2 id="deep-health">Deep health</h2>
      <p>
        Plain liveness (TCP probe) tells you "the process is up". <code>/admin/health/deep</code>{' '}
        tells you "the process can actually serve traffic" — it checks producer availability,
        control-plane store reachability, and Diameter status:
      </p>
      <CodeBlock lang="bash" code={`fgpctl health-deep
# or
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" https://fgp.svc:9091/admin/health/deep`} />

      <p>
        The response carries a <code>checks</code> map with one entry each for{' '}
        <code>producers</code>, <code>store</code>, and <code>diameter</code>. It returns 200 only
        when none of those checks is <code>fail</code> (a 503 otherwise). Use it as a Kubernetes
        readiness probe; never as a liveness probe — you don't want kube to restart the proxy
        because a producer is briefly down.
      </p>

      <h2 id="tracing">OTLP tracing</h2>
      <p>Configure under <code>observability.tracing</code>:</p>
      <CodeBlock lang="yaml" code={`observability:
  tracing:
    endpoint: otel-collector:4317
    service_name: fgp
    sample_rate: 0.1            # 10% sampling
    insecure: false`} />

      <p>
        The proxy emits spans for: inbound request, each filter, routing decision, outbound
        forward, and response stage. Trace context (W3C <code>traceparent</code>) is propagated
        through to the producer so downstream traces stitch into a single timeline.
      </p>

      <h2 id="logging">Logs</h2>
      <p>
        Decisions are emitted as structured zerolog records — the same JSON stream you ship to a
        log pipeline or SIEM for the request-level trail. Choose between human-readable console
        output and one JSON object per line.
      </p>
      <CodeBlock lang="yaml" code={`observability:
  logging:
    level: info                 # trace | debug | info | warn | error
    format: json                # console | json
    logfile: /var/log/fgp/fgp.log
    caller: false               # include file:line on every line
    db_query_log: false         # log every SQL query (debug; warn for slow >200ms)`} />

      <Callout type="warning" title="trace leaks bodies">
        <code>level: trace</code> includes request and response bodies. Useful for debugging,
        unsafe in production where bodies may contain PII.
      </Callout>

      <p>
        Change the log level on a running daemon without a restart — useful when chasing an issue.
        The level accepts <code>debug</code>, <code>info</code>, <code>warn</code>, or{' '}
        <code>error</code>:
      </p>
      <CodeBlock lang="bash" code={`fgpctl log-level                  # show current
fgpctl log-level set debug        # raise verbosity
fgpctl log-level set info         # back to normal`} />

      <h2 id="pprof">Profiling</h2>
      <p>Set <code>observability.pprof.enabled: true</code> to expose <code>net/http/pprof</code> on the SBI listener. Useful for CPU or memory profiles during load tests; <strong>never enable in production</strong> on a publicly-reachable listener.</p>

      <h2 id="related">Where to go next</h2>
      <ul>
        <li><Link to="/reference/metrics">Reference → Metrics</Link> — full series + label list.</li>
        <li><Link to="/api/observability">Admin API → Observability</Link> — metrics summary and health endpoints.</li>
      </ul>
    </DocPage>
  );
}
