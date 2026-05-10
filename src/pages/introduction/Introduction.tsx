import DocPage from '../../components/DocPage';
import { Link } from 'react-router-dom';

export default function Introduction() {
  return (
    <DocPage
      slug="introduction"
      lede="fluxgate-proxy (FGP) is a high-performance signaling proxy for telecom networks. It sits between NF consumers and producers, enforcing policy, transforming traffic, routing on content, and emitting audit and metrics — across both 5G SBI (HTTP/2) and 4G Diameter — from a single Go binary."
    >
      <p>
        FGP runs in front of the NFs you operate. Every request a consumer makes to a producer
        flows through the same pipeline: authenticate, allow or deny, rate-limit, transform,
        route, forward, audit. Both protocol planes — HTTP/2 SBI and Diameter over TCP/SCTP —
        share that pipeline, so a single policy can govern both.
      </p>

      <h2 id="what-fgp-does">What FGP does</h2>
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
          <strong>Threat and anomaly</strong> — IMSI-catcher detection, location tracking,
          configurable anomaly scoring.
        </li>
        <li>
          <strong>Audit and compliance</strong> — structured records with optional HMAC
          signing, export to webhook / syslog / file, configurable retention, compliance
          report generation.
        </li>
        <li>
          <strong>Observability</strong> — Prometheus <code>{`/metrics`}</code>, deep health,
          OTLP tracing, structured zerolog, runtime log-level changes.
        </li>
        <li>
          <strong>Hot reload</strong> — policy, rate limits, transforms, routes, and producer
          weights swap atomically without dropping connections.
        </li>
      </ul>

      <h2 id="how-fgp-runs">How FGP runs</h2>
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
          transformation rules, routing, peer ops, audit, validation.
        </li>
      </ul>
      <p>
        State lives in SQLite (default) or PostgreSQL via Bun. The control-plane store (rules,
        transforms, routes, tenants) and the audit store can use different drivers.
      </p>

      <h2 id="when-to-pick-fgp">When to pick FGP</h2>
      <p>You should pick fluxgate-proxy when:</p>
      <ul>
        <li>
          <strong>You need one policy across SBI and Diameter.</strong> A consumer that registers
          a UE on Nudm and updates a profile on S6a is one rule set in FGP — not two.
        </li>
        <li>
          <strong>You want to harden a multi-vendor signaling plane.</strong> FGP terminates
          consumer connections, applies your rules, and re-originates the request — vendors
          downstream never see consumer credentials.
        </li>
        <li>
          <strong>You need to transform or redact at wire speed.</strong> Strip identifiers from
          inbound traffic, inject correlation IDs, mask body fields for tenant isolation — all
          without touching the NFs themselves.
        </li>
        <li>
          <strong>You need an auditable signaling trail.</strong> Every request and decision
          records to an audit store, signed if you turn signing on, exportable to your SIEM.
        </li>
        <li>
          <strong>You need to roll out producer changes safely.</strong> Drain a producer, shift
          weight, run a canary — without restarting the proxy or touching consumer config.
        </li>
      </ul>

      <h2 id="when-not-to-pick-fgp">When <em>not</em> to pick FGP</h2>
      <ul>
        <li>
          <strong>You need a working NF.</strong> FGP is a proxy, not an AMF, SMF, or HSS. Stand
          up the real NF; put FGP in front of it.
        </li>
        <li>
          <strong>You need a service mesh.</strong> FGP focuses on 3GPP signaling; if you want
          mTLS-everywhere-east-west for arbitrary microservices, a mesh fits better.
        </li>
        <li>
          <strong>You only need a load balancer.</strong> If a layer-4 LB suffices, FGP is
          overkill. FGP earns its place when policy, transformation, or audit matter.
        </li>
      </ul>

      <h2 id="where-to-go-next">Where to go next</h2>
      <ul>
        <li><Link to="/introduction/quickstart">Quickstart</Link> — build, run, and exercise FGP in ~10 minutes.</li>
        <li><Link to="/concepts/architecture">Architecture</Link> — the model behind the proxy.</li>
        <li><Link to="/concepts/request-pipeline">Request pipeline</Link> — what each filter does and the order they run in.</li>
        <li><Link to="/reference/config-schema">Config schema</Link> — every YAML field.</li>
      </ul>
    </DocPage>
  );
}
