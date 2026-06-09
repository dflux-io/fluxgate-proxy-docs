import DocPage from '../../components/DocPage';
import { Link } from 'react-router-dom';

export default function Why() {
  return (
    <DocPage
      slug="introduction/why"
      lede="When fluxgate-proxy is the right tool, when it is not, and where it fits in your signaling plane."
    >
      <p>
        fluxgate-proxy sits in front of the NFs you operate. Every request a consumer makes to a
        producer flows through the same pipeline, and both protocol planes — HTTP/2 SBI and
        Diameter over TCP/SCTP — share it. That single-pipeline design is what makes the proxy a
        good fit for some problems and the wrong fit for others. This page is the decision: read
        it before you commit.
      </p>

      <h2 id="when-to-pick">When to pick fluxgate-proxy</h2>
      <p>Reach for fluxgate-proxy when:</p>
      <ul>
        <li>
          <strong>You need one policy across SBI and Diameter.</strong> A consumer that registers a
          UE on Nudm and updates a profile on S6a is one rule set in the proxy — not two stacks to
          keep in sync.
        </li>
        <li>
          <strong>You want to harden a multi-vendor signaling plane.</strong> The proxy terminates
          consumer connections, applies your rules, and re-originates the request — producers
          downstream never see consumer credentials.
        </li>
        <li>
          <strong>You need to transform or redact at wire speed.</strong> Strip identifiers from
          inbound traffic, inject correlation IDs, mask body fields for tenant isolation — all in a
          request and response phase, without touching the NFs themselves.
        </li>
        <li>
          <strong>You need a record of what was allowed and denied.</strong> Every decision is
          emitted as a structured JSON log line and counted in Prometheus metrics, so you can ship
          the decision stream to your log pipeline or SIEM and alert on allow/deny rates without
          instrumenting the NFs.
        </li>
        <li>
          <strong>You need to roll out producer changes safely.</strong> Drain a producer, shift
          weight, or run a canary with weighted targets — without restarting the proxy or touching
          consumer config.
        </li>
      </ul>

      <h2 id="when-not-to-pick">When <em>not</em> to pick fluxgate-proxy</h2>
      <ul>
        <li>
          <strong>You need a working NF.</strong> fluxgate-proxy is a proxy, not an AMF, SMF, or
          HSS. Stand up the real NF; put the proxy in front of it.
        </li>
        <li>
          <strong>You need a service mesh.</strong> The proxy focuses on 3GPP signaling; if you
          want mTLS-everywhere east-west for arbitrary microservices, a mesh fits better.
        </li>
        <li>
          <strong>You only need a load balancer.</strong> If a layer-4 LB suffices, the proxy is
          overkill. It earns its place when policy, transformation, or content-based routing
          matter.
        </li>
      </ul>

      <h2 id="where-to-go-next">Where to go next</h2>
      <ul>
        <li>
          <Link to="/introduction">Overview</Link> — what the proxy does and how the two binaries
          run.
        </li>
        <li>
          <Link to="/introduction/quickstart">Quickstart</Link> — build, run, and exercise the
          proxy in about 10 minutes.
        </li>
      </ul>
    </DocPage>
  );
}
