import DocPage from '../../components/DocPage';
import Mermaid from '../../components/Mermaid';
import { Link } from 'react-router-dom';

export default function Architecture() {
  return (
    <DocPage
      slug="concepts/architecture"
      lede="fluxgate-proxy terminates two protocol planes — SBI HTTP/2 and Diameter over TCP/SCTP — and feeds every request through a single shared filter chain before routing it to a producer. The chain swaps atomically on hot reload, so policy stays consistent across both planes."
    >
      <h2 id="picture">The picture</h2>

      <Mermaid
        code={`flowchart LR
  subgraph Consumers["NF consumers / 4G clients"]
    C1["SBI consumer\\n(AMF, SMF, …)"]
    C2["Diameter peer\\n(MME, PCEF, IMS)"]
  end

  subgraph FGP["fluxgate-proxy"]
    direction TB
    L1["SBI listener\\nHTTP/2 + h2c"]
    L2["Diameter listener\\nTCP / SCTP"]
    F["Request filter chain\\n(auth → policy → rate-limit → transform-req)"]
    R["Routing engine\\n(SBI / Diameter with failover)"]
    RS["Response stage\\nSBI: header strip → topology hiding → transform-resp\\nDiameter: transform-resp"]
    A["Admin API\\nfgpctl + REST"]
    S[("Control-plane store\\nSQLite / Postgres")]
  end

  subgraph Producers["NF producers / Diameter producers"]
    P1["UDM / AUSF / PCF / …"]
    P2["HSS / PCRF / TDF"]
  end

  C1 --> L1
  C2 --> L2
  L1 --> F
  L2 --> F
  F --> R
  R --> P1
  R --> P2
  P1 --> RS
  P2 --> RS
  RS --> L1
  RS --> L2
  A --- S
  F --- S`}
      />

      <h2 id="two-listeners-one-pipeline">Two listeners, one pipeline</h2>
      <p>
        Inbound traffic arrives on one of two listeners and is wrapped into a protocol-neutral
        request value before the filter chain runs. The same chain runs for both planes, so a
        deny decision in the policy filter blocks SBI and Diameter the same way. The chain has
        exactly four filters in a fixed order: authentication (only when{' '}
        <code>{`oauth2_required`}</code> is set), policy (always), rate limiting (one filter per{' '}
        <code>{`rate_limits[]`}</code> entry), and request-phase transformation.
      </p>
      <p>
        The chain order is fixed; there is no per-filter priority knob outside the chain — rules{' '}
        <em>inside</em> a filter have their own ordering (see{' '}
        <Link to="/concepts/policy-engine">Policy engine</Link> and{' '}
        <Link to="/concepts/transformation-engine">Transformation engine</Link>).
      </p>

      <h2 id="response-stage">Response stage</h2>
      <p>
        After the producer answers, the proxy runs a protocol-specific response stage before the
        answer goes back to the consumer:
      </p>
      <ul>
        <li>
          <strong>SBI:</strong> a small response chain applies header stripping (e.g.{' '}
          <code>{`Server`}</code> banners), topology hiding (rewrite producer host references),
          and response-phase transformations.
        </li>
        <li>
          <strong>Diameter:</strong> a single response filter applies response-phase
          transformations to the answer AVPs.
        </li>
      </ul>

      <h2 id="control-plane">Configuration and hot reload</h2>
      <p>
        Policy rules, rate-limit rules, transformation rules, routing rules, tenants, producer
        configs, and NRF profiles all live in the control-plane store — the persistence layer.
        The admin API, the HTTP control surface, mutates the store; the data path reads it.
      </p>
      <p>
        A background worker in the proxy polls the store (default every 5 s) for changes. When
        something changes, the proxy rebuilds the request and response filter chains and swaps
        them in atomically. This is the hot-reload guarantee: configuration changes take effect
        with no restart, no request-path lock, and no dropped connections, and both the SBI
        proxy and the Diameter relay pick up the same chains — so policy stays consistent across
        protocols.
      </p>

      <h2 id="storage">Storage</h2>
      <p>
        The proxy keeps a single control-plane store holding rules, transformation rules,
        routing rules, tenants, producer configs, and NRF profiles. It runs on{' '}
        <strong>SQLite (default) or PostgreSQL</strong>. Decisions are not written to a database;
        they are emitted as structured JSON logs you can ship to a log pipeline or SIEM (see{' '}
        <Link to="/guides/observability">Setting up observability</Link>). For production storage,
        see <Link to="/guides/using-postgres">Using PostgreSQL</Link>.
      </p>

      <h2 id="processes">Process layout</h2>
      <p>The proxy runs as a single binary. Inside that binary:</p>
      <ul>
        <li>One SBI HTTP/2 listener (with h2c fallback).</li>
        <li>One Diameter relay (TCP or SCTP) — optional, enabled in config.</li>
        <li>One admin HTTP/2 listener on a separate port (default <code>:9091</code>).</li>
        <li>One background worker that polls the control-plane store.</li>
        <li>
          Prometheus metrics at <code>/metrics</code>, served on both the SBI listener and the
          admin listener.
        </li>
      </ul>
      <p>
        There is no external broker, no separate sidecar, and no required runtime beyond Go
        1.26.1 and your storage backend. <code>fgpctl</code> talks to the daemon over HTTP — you
        can run it from the same host or anywhere with network reach to the admin port.
      </p>
    </DocPage>
  );
}
