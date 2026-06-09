import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function AuditAndCompliance() {
  return (
    <DocPage
      slug="guides/audit-and-compliance"
      lede="fluxgate-proxy has no separate audit store. Your audit trail is the structured JSON decision log the proxy emits per request, shipped to your log pipeline or SIEM, alongside Prometheus metrics and a deny-by-default policy posture. This guide shows how to assemble those signals into a compliance story."
    >
      <Callout type="warning" title="No audit subsystem">
        The proxy does not persist a signed audit trail, export to webhook or syslog sinks, or
        generate a compliance report. There is no <code>audit</code> config block, no{' '}
        <code>storage.audit</code> driver, no <code>/admin/audit*</code> endpoint, and no{' '}
        <code>fgpctl audit</code> command. Decisions are emitted as structured JSON logs and as
        Prometheus metrics — those are what you build evidence from.
      </Callout>

      <h2 id="decision-logs">Structured decision logs</h2>
      <p>
        The proxy logs each request decision as a structured JSON line (zerolog). These lines are
        your record of what traffic the proxy saw and how it ruled on it. Ship them to your log
        pipeline or SIEM the same way you ship any container logs — there is no separate audit
        sink to configure.
      </p>
      <p>The decision-relevant messages are:</p>
      <ul>
        <li>
          <code>proxied</code> — a request was forwarded. Fields include <code>request_id</code>,{' '}
          <code>target_nf_type</code>, <code>producer</code>, <code>path</code>,{' '}
          <code>status</code>, and <code>duration</code>.
        </li>
        <li>
          <code>request denied</code> — the policy filter rejected the request. Fields include the
          matched <code>rule</code>, the <code>path</code>, and <code>target_nf_type</code>.
        </li>
        <li>
          <code>rate limit exceeded</code> — a rate-limit rule rejected the request. Fields include{' '}
          <code>request_id</code>, <code>source_nf</code>, <code>target_nf</code>, the bucket{' '}
          <code>key</code>, and the matched <code>rule</code>.
        </li>
        <li>
          <code>redirected</code> — an SCP-style redirect was returned, with{' '}
          <code>request_id</code>, <code>target_nf_type</code>, <code>producer</code>, and{' '}
          <code>redirect_url</code>.
        </li>
      </ul>
      <p>A denied request looks like this on the wire:</p>
      <CodeBlock lang="json" code={`{"level":"info","rule":"block-nudm-write","path":"/nudm-sdm/v2/...","target_nf_type":"UDM","time":"2026-06-09T10:22:31Z","message":"request denied"}`} />

      <Callout type="note" title="Set the log format for ingestion">
        Run the proxy with JSON log output so each decision is one parseable line. See{' '}
        <Link to="/guides/observability">Setting up observability</Link> for log level and format
        configuration, and for wiring logs into a collector.
      </Callout>

      <h2 id="metrics">Metrics for control evidence</h2>
      <p>
        Prometheus metrics give you the aggregate counts auditors usually ask for — request
        volume, status-code distribution, and how often each filter allowed or denied traffic —
        without parsing every log line.
      </p>
      <ul>
        <li>
          <code>fgp_requests_total</code> (labels <code>method</code>, <code>target_nf_type</code>,{' '}
          <code>status_code</code>) — request volume and outcome distribution per target NF type.
        </li>
        <li>
          <code>fgp_filter_decisions_total</code> (labels <code>filter</code>, <code>decision</code>)
          — allow/deny counts per filter, so you can show the policy and rate-limit filters are
          actively enforcing.
        </li>
        <li>
          <code>fgp_request_duration_seconds</code> (labels <code>method</code>,{' '}
          <code>target_nf_type</code>) — latency, for SLO evidence.
        </li>
      </ul>
      <p>
        Scrape these into your long-term metrics store and you have a durable, queryable time
        series. See <Link to="/reference/metrics">Metrics reference</Link> for the full list.
      </p>

      <h2 id="posture">Deny-by-default posture</h2>
      <p>
        The strongest single control statement you can make is that the proxy fails closed. With{' '}
        <code>admin.default_action: deny</code> (the v1 default), any request that does not match
        an explicit allow rule is rejected and logged as <code>request denied</code>. Auditors can
        read the active policy as configuration evidence and the decision logs as evidence the
        configuration was enforced.
      </p>
      <p>
        Read the active policy and rule counts straight from the admin API or CLI to capture a
        configuration snapshot:
      </p>
      <CodeBlock lang="bash" code={`# active policy as JSON
fgpctl policy

# or via the admin API
curl -sH "Authorization: Bearer $TOKEN" \\
  http://127.0.0.1:9091/admin/policy | jq`} />
      <p>
        For how authentication, the base URL, and the <code>default_action</code> default work, see{' '}
        <Link to="/guides/securing-the-admin-api">Securing the admin API</Link>.
      </p>

      <h2 id="building-the-story">Building the compliance story</h2>
      <p>Assemble the three signals the proxy actually produces:</p>
      <ul>
        <li>
          <strong>Configuration evidence</strong> — periodically snapshot the active policy,
          rate-limit, transformation, and routing rules from the admin API (cron + curl + archive),
          along with the <code>default_action: deny</code> posture.
        </li>
        <li>
          <strong>Enforcement evidence</strong> — retain the structured decision logs in your SIEM
          for your compliance window; their retention is governed by your log pipeline, not the
          proxy.
        </li>
        <li>
          <strong>Aggregate evidence</strong> — keep the Prometheus metrics as a queryable time
          series of volume, outcomes, and filter decisions.
        </li>
      </ul>

      <h2 id="where-to-go-next">Where to go next</h2>
      <ul>
        <li>
          <Link to="/guides/observability">Setting up observability</Link> — log format, metrics
          scraping, and tracing.
        </li>
        <li>
          <Link to="/reference/metrics">Metrics reference</Link> — every metric and its labels.
        </li>
        <li>
          <Link to="/guides/securing-the-admin-api">Securing the admin API</Link> — auth and the
          deny-by-default posture.
        </li>
        <li>
          <Link to="/reference/config-schema">Config schema</Link> — admin and storage configuration.
        </li>
      </ul>
    </DocPage>
  );
}
