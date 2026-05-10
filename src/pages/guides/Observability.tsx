import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function Observability() {
  return (
    <DocPage
      slug="guides/observability"
      lede="FGP emits Prometheus metrics, structured logs, OTLP traces, and a deep health endpoint. This guide covers how to scrape, dashboard, alert, and trace through a typical deployment."
    >
      <h2 id="metrics">Prometheus metrics</h2>
      <p>
        Metrics are exposed on the SBI listener at <code>/metrics</code>. Common request:
      </p>
      <CodeBlock lang="bash" code={`curl -s http://fgp.svc:8090/metrics | head -40`} />

      <p>Headline series to scrape and dashboard:</p>
      <ul>
        <li><code>fgp_requests_total</code> (counter) — total requests, by method, NF type, status code.</li>
        <li><code>fgp_request_duration_seconds</code> (histogram) — end-to-end request latency.</li>
        <li><code>fgp_active_requests</code> (gauge) — in-flight requests.</li>
        <li><code>fgp_errors_total</code> (counter) — proxy-side errors by kind.</li>
        <li><code>fgp_filter_decisions_total</code> (counter) — decisions by filter and outcome.</li>
        <li><code>fgp_rate_limit_exceeded_total</code> (counter) — denials by rate-limit rule.</li>
        <li><code>fgp_producer_requests_total</code> (counter) — forwarded requests by producer and outcome.</li>
        <li><code>fgp_circuit_breaker_state</code> (gauge) — per-producer circuit breaker state.</li>
        <li><code>fgp_audit_queue_depth</code> (gauge) — audit pipeline backlog.</li>
        <li><code>fgp_audit_sink_drops_total</code> (counter) — dropped audit exports.</li>
        <li><code>fgp_policy_version</code> (gauge) — active policy version (use as a deploy marker).</li>
        <li><code>fgp_diameter_requests_total</code> (counter) — Diameter requests by command code.</li>
        <li><code>fgp_diameter_forward_total</code> (counter) — forwarded by peer and outcome.</li>
        <li><code>fgp_diameter_forward_duration_seconds</code> (histogram) — Diameter forward latency.</li>
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
        Scrape every 15s. Most series are cheap; only <code>fgp_filter_duration_seconds</code>{' '}
        and <code>fgp_diameter_forward_duration_seconds</code> are histograms with non-trivial
        cardinality.
      </p>

      <h2 id="dashboards">Dashboards</h2>
      <p>A four-panel core dashboard covers most operational questions:</p>
      <ol>
        <li><strong>Request rate</strong> by NF type and decision (allowed / denied).</li>
        <li><strong>P50 / P95 / P99 latency</strong> from <code>fgp_request_duration_seconds</code>.</li>
        <li><strong>Filter decisions</strong> stacked by filter (policy / rate-limit / threat / …).</li>
        <li><strong>Producer health</strong> from <code>fgp_producer_requests_total</code> + circuit-breaker state.</li>
      </ol>

      <p>For Diameter:</p>
      <ol>
        <li>Peer count from <code>fgp_diameter_active_peers</code>.</li>
        <li>Per-command-code request rate from <code>fgp_diameter_requests_total</code>.</li>
        <li>Forward latency P95 from <code>fgp_diameter_forward_duration_seconds</code>.</li>
        <li>Loop detection counter <code>fgp_diameter_loop_detected_total</code>.</li>
      </ol>

      <h2 id="alerts">Alerts to set early</h2>
      <ul>
        <li>
          <strong>Audit queue depth ≥ 80% of capacity for &gt; 5m.</strong> The pipeline is
          falling behind; sinks may be slow or down. Investigate before drops start.
        </li>
        <li>
          <strong>Audit sink drops &gt; 0.</strong> Records aren't reaching the SIEM. Page
          on-call.
        </li>
        <li>
          <strong>Producer error rate &gt; 5% over 5m.</strong> Producer-side issue or routing
          misconfiguration.
        </li>
        <li>
          <strong>Circuit breaker open on any producer.</strong> The breaker has tripped — that
          producer is out of rotation. Page if it persists.
        </li>
        <li>
          <strong>Policy version unchanged after deploy.</strong> Compare expected vs scraped
          version after a deploy. If they don't match, the apply didn't take.
        </li>
        <li>
          <strong>Diameter active peers below expected count.</strong> A peer dropped and isn't
          reconnecting.
        </li>
      </ul>

      <h2 id="deep-health">Deep health</h2>
      <p>
        Plain liveness (TCP probe) tells you "the process is up". <code>/admin/health/deep</code>{' '}
        tells you "the process can actually serve traffic" — it walks the producer pool and
        verifies reachability:
      </p>
      <CodeBlock lang="bash" code={`fgpctl health-deep
# or
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" https://fgp.svc:8091/admin/health/deep`} />

      <p>
        Returns 200 only when at least one producer per configured NF type is reachable. Use
        as a Kubernetes readiness probe; never as a liveness probe (you don't want kube to
        restart FGP because a producer is briefly down).
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
        FGP emits spans for: inbound request, each filter, routing decision, outbound forward,
        and response stage. Trace context (W3C <code>traceparent</code>) is propagated through
        to the producer so downstream traces stitch into a single timeline.
      </p>

      <h2 id="logging">Logs</h2>
      <p>
        Structured zerolog. Choose between human-readable console output and one JSON object
        per line.
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
        unsafe in production where bodies may contain PII. Use{' '}
        <code>fgpctl log-level set debug</code> to enable temporarily, then{' '}
        <code>fgpctl log-level set info</code> to revert without restarting.
      </Callout>

      <h2 id="runtime-log-level">Runtime log level</h2>
      <p>Change the log level on a running daemon — useful when chasing an issue:</p>
      <CodeBlock lang="bash" code={`fgpctl log-level                  # show current
fgpctl log-level set debug        # raise verbosity
fgpctl log-level set info         # back to normal`} />

      <h2 id="pprof">Profiling</h2>
      <p>Set <code>observability.pprof.enabled: true</code> to expose <code>net/http/pprof</code> on the SBI listener. Useful for CPU or memory profiles during load tests; <strong>never enable in production</strong> on a publicly-reachable listener.</p>

      <h2 id="related">Related</h2>
      <ul>
        <li><Link to="/reference/metrics">Reference → Metrics</Link> — full series + label list.</li>
        <li><Link to="/api/observability">Admin API → Observability</Link>.</li>
        <li><Link to="/guides/audit-and-compliance">Audit and compliance</Link> — request-level trail.</li>
      </ul>
    </DocPage>
  );
}
