import DocPage from '../../components/DocPage';
import { Link } from 'react-router-dom';

export default function Introduction() {
  return (
    <DocPage
      slug="introduction"
      lede="fluxgate-proxy is a high-performance signaling proxy for telecom networks. It sits between NF consumers and producers — enforcing policy, transforming traffic, routing on content, and emitting decision logs and metrics across both 5G SBI (HTTP/2) and 4G Diameter — all from a single Go binary."
    >
      <p>
        The proxy runs in front of the NFs you operate. Every request a consumer makes to a
        producer flows through the same pipeline: authenticate, allow or deny, rate-limit,
        transform, route, forward. Both protocol planes — HTTP/2 SBI and Diameter over TCP/SCTP —
        share that pipeline, so a single policy can govern both.
      </p>

      <h2 id="what-it-does">What fluxgate-proxy does</h2>
      <ul>
        <li>
          <strong>SBI reverse proxy</strong> — HTTP/2 (with h2c) for 5G service-based interfaces.
          NRF registration, heartbeat, and dynamic producer discovery.
        </li>
        <li>
          <strong>Diameter relay</strong> — RFC 6733 base protocol over TCP or SCTP, with S6a,
          Gx, and Rx application filters.
        </li>
        <li>
          <strong>Policy engine</strong> — allow/deny rules by NF type, HTTP method, path,
          SUPI/GPSI/DNN/S-NSSAI, or AVP. OAuth2 / JWT verification with scope enforcement.
        </li>
        <li>
          <strong>Transformation engine</strong> — header injection, removal, rewriting;
          body field masking and redaction; regex-based matching and substitution. Runs in a
          request phase before forwarding and a response phase before the answer reaches the
          consumer.
        </li>
        <li>
          <strong>Content-based routing</strong> — path / method / NF-type matching, SUPI-range
          routing, time-window routing, sticky sessions (consistent hashing by SUPI), and
          weighted targets for canary or blue/green.
        </li>
        <li>
          <strong>Rate limiting</strong> — per-consumer and per-SUPI token buckets.
        </li>
        <li>
          <strong>Observability</strong> — Prometheus <code>{`/metrics`}</code>, deep health,
          OTLP tracing, structured decision logs, runtime log-level changes.
        </li>
        <li>
          <strong>Hot reload</strong> — policy, rate limits, transforms, routes, and producer
          weights swap atomically without dropping connections.
        </li>
      </ul>

      <h2 id="how-it-runs">How fluxgate-proxy runs</h2>
      <p>
        Two binaries:
      </p>
      <ul>
        <li>
          <strong><code>{`fgp`}</code></strong> — the daemon. Reads a YAML or JSON config, opens
          one or both protocol listeners, and serves an admin API on a separate port.
        </li>
        <li>
          <strong><code>{`fgpctl`}</code></strong> — the admin CLI. Talks to the daemon's admin
          API for everything you'd otherwise hit via <code>{`curl`}</code>: policy CRUD,
          transformation rules, routing, peer ops, and validation.
        </li>
      </ul>
      <p>
        State lives in the control-plane store (rules, transformation rules, routes), backed by
        SQLite (default) or PostgreSQL.
      </p>

      <h2 id="where-to-go-next">Where to go next</h2>
      <ul>
        <li><Link to="/introduction/why">Why fluxgate-proxy</Link> — when to pick the proxy, and when not to.</li>
        <li><Link to="/introduction/quickstart">Quickstart</Link> — build, run, and exercise the proxy in ~10 minutes.</li>
        <li><Link to="/concepts/architecture">Architecture</Link> — the model behind the proxy.</li>
        <li><Link to="/concepts/request-pipeline">Request pipeline</Link> — what each filter does and the order they run in.</li>
        <li><Link to="/reference/config-schema">Config schema</Link> — every YAML field.</li>
      </ul>
    </DocPage>
  );
}
