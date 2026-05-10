import DocPage from '../../components/DocPage';
import Mermaid from '../../components/Mermaid';
import { Link } from 'react-router-dom';

export default function Architecture() {
  return (
    <DocPage
      slug="concepts/architecture"
      lede="FGP terminates two protocol planes — SBI HTTP/2 and Diameter over TCP/SCTP — and feeds every request through a single shared filter chain before routing it to a producer. The chain swaps atomically on hot reload, so policy is always consistent across both planes."
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
    F["Request filter chain\\n(auth → policy → rate-limit → threat → anomaly\\n→ tenant → transform-req → audit)"]
    R["Routing engine\\n(SBI: Resolve / Diameter: ResolveWithFailover)"]
    RS["Response stage\\nSBI: HeaderStrip → TopologyHiding → Transform-resp\\nDiameter: Transform-resp + Audit"]
    A["Admin API\\nfgpctl + REST"]
    S[("Control plane store\\n+ audit store\\nSQLite / Postgres")]
  end

  subgraph Producers["NF producers / Diameter upstreams"]
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
        request value before the filter chain runs. The chain is the same{' '}
        <code>{`[]RequestFilter`}</code> in both directions, so a deny decision in the policy
        filter blocks SBI and Diameter the same way.
      </p>
      <p>
        The chain order is fixed in code (built once by <code>{`buildRequestFilterChain`}</code>{' '}
        in the proxy). There is no per-filter priority knob outside the chain — rules{' '}
        <em>inside</em> a filter have their own ordering (see{' '}
        <Link to="/concepts/policy-engine">Policy engine</Link> and{' '}
        <Link to="/concepts/transformation-engine">Transformation engine</Link>).
      </p>

      <h2 id="response-stage">Response stage</h2>
      <p>
        After the producer answers, FGP runs a protocol-specific response stage before the
        answer goes back to the consumer:
      </p>
      <ul>
        <li>
          <strong>SBI:</strong> a small <code>{`ResponseFilterChain`}</code> applies header
          stripping (e.g. <code>{`Server`}</code> banners), topology hiding (rewrite producer
          host references), and response-phase transformations.
        </li>
        <li>
          <strong>Diameter:</strong> a single response filter applies response-phase
          transformations to the answer AVPs, then emits the response audit record.
        </li>
      </ul>

      <h2 id="control-plane">The control plane</h2>
      <p>
        Policy rules, rate-limit rules, transformation rules, routing rules, tenants, producer
        configs, and NRF profiles all live in the control-plane store. The admin API mutates
        the store; the data path reads it.
      </p>
      <p>
        A watcher in the proxy polls the store (default every 5 s) for changes. When something
        changes, FGP builds a fresh request filter chain and response filter chain and swaps
        them in atomically via <code>{`atomic.Pointer[T]`}</code>. No restart, no request-path
        lock, no dropped connections. Both the SBI proxy and the Diameter relay get the same
        chain pointer — policy stays consistent across protocols.
      </p>

      <h2 id="storage">Storage</h2>
      <p>FGP has two stores:</p>
      <ul>
        <li>
          <strong>Control-plane store</strong> — rules, transforms, routes, tenants, profiles.
          SQLite or PostgreSQL.
        </li>
        <li>
          <strong>Audit store</strong> — one record per request decision, with sink fan-out to
          webhook / syslog / file. SQLite, PostgreSQL, or in-memory.
        </li>
      </ul>
      <p>
        Both stores can use the same driver, different drivers, or different DSNs. In-memory
        audit is the default for development; it loses records on restart. See{' '}
        <Link to="/guides/using-postgres">Using PostgreSQL</Link> for production storage.
      </p>

      <h2 id="processes">Process layout</h2>
      <p>FGP runs as a single binary. Inside that binary:</p>
      <ul>
        <li>One SBI HTTP/2 listener (with h2c fallback).</li>
        <li>One Diameter relay (TCP or SCTP) — optional, enabled in config.</li>
        <li>One admin HTTP/2 listener on a separate port (default <code>:8091</code>).</li>
        <li>One audit queue with worker pool for sink fan-out.</li>
        <li>One store watcher goroutine.</li>
        <li>Prometheus metrics exposed inline on the SBI listener at <code>/metrics</code>.</li>
      </ul>
      <p>
        There is no external broker, no separate sidecar, and no required runtime beyond Go
        1.25 and your storage backend. <code>fgpctl</code> talks to the daemon over HTTP — you
        can run it from the same host or anywhere with network reach to the admin port.
      </p>
    </DocPage>
  );
}
