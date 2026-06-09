import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function DiameterS6aRelay() {
  return (
    <DocPage
      slug="tutorials/diameter-s6a-relay"
      lede="Bring up fluxgate-proxy as an S6a relay between an MME and an HSS. Walks through enabling the Diameter listener, declaring the application, configuring two peers, and verifying CER/CEA exchange and routing on a live message."
    >
      <h2 id="prereqs">Before you start</h2>
      <ul>
        <li>fluxgate-proxy built (<code>make build</code>).</li>
        <li>
          An MME or test peer that can speak S6a to a configured peer (any RFC 6733
          implementation that knows the S6a app id will do).
        </li>
        <li>
          An HSS or HSS simulator reachable on a known address and port. For lab work an
          open-source HSS simulator is fine.
        </li>
        <li>
          Either TCP or SCTP available between the proxy and the HSS. This tutorial uses SCTP
          because that is the typical 3GPP choice; TCP works with a one-line change.
        </li>
      </ul>

      <h2 id="topology">Topology</h2>
      <CodeBlock code={`MME / test peer              fgp                    HSS / simulator
  (initiator)         <-->   (both)         <-->   (initiator-side from fgp)
                              :3868                      :3868`} />
      <p>
        The proxy listens for inbound from the MME on its <code>listen_addr</code>, and dials the
        HSS for the outbound side. We model the HSS peer as <code>connection_mode: initiator</code>{' '}
        (the proxy dials it). The MME side is implicit — anything that connects in on the listen
        address is accepted when <code>accept_undefined_peer: true</code>, or you can list MMEs
        explicitly with <code>connection_mode: responder</code>.
      </p>

      <h2 id="config">Write the config</h2>
      <p>
        Start from <code>examples/fgp-minimal.yaml</code> and add a <code>diameter</code>{' '}
        block. The minimum that brings up an S6a relay:
      </p>
      <CodeBlock lang="yaml" code={`version: "v1"
mode: diameter

server:
  listen: ":8090"

admin:
  listen: 127.0.0.1:9091
  allow_anonymous: true
  allow_insecure: true
  default_action: allow    # turn off policy for the lab; tighten before prod

diameter:
  enabled: true
  listen_addr: ":3868"
  transport: sctp
  origin_host: fgp.epc.example.com
  origin_realm: epc.example.com
  accept_undefined_peer: true
  applications:
    - {app_id: 16777251, vendor_id: 10415, app_type: auth}    # S6a
  peers:
    - address: "aaa://10.56.56.10:3868"
      connection_mode: initiator
      name: hss.epc.example.com
      realm: epc.example.com
  routes:
    - realm: epc.example.com
      application_ids: [16777251]
      peers: ["aaa://10.56.56.10:3868"]
  sctp:
    max_in_streams: 16
    max_out_streams: 16

observability:
  logging:
    level: info
    format: console`} />

      <p>Save as <code>fgp-s6a.yaml</code>.</p>

      <Callout type="warning" title="default_action: allow is for the lab only">
        We set <code>default_action: allow</code> here to focus on Diameter wiring. In
        production, leave it <code>deny</code> and add explicit allow rules — see{' '}
        <Link to="/tutorials/first-sbi-policy">the policy tutorial</Link> and{' '}
        <Link to="/guides/securing-the-admin-api">Securing the admin API</Link>.
      </Callout>

      <h2 id="run">Run</h2>
      <CodeBlock lang="bash" code={`./bin/fgp -config fgp-s6a.yaml`} />

      <p>On startup you should see CER/CEA exchange with the HSS:</p>
      <CodeBlock lang="text" code={`INF Diameter listener listening addr=:3868 transport=sctp
INF Diameter peer dialing addr=aaa://10.56.56.10:3868
INF Diameter peer CER sent addr=aaa://10.56.56.10:3868
INF Diameter peer CEA received addr=aaa://10.56.56.10:3868 result=DIAMETER_SUCCESS
INF Diameter peer up addr=aaa://10.56.56.10:3868`} />

      <p>If the HSS is offline, the dial fails and the proxy retries on <code>reconnect_interval</code>.</p>

      <h2 id="verify-peer">Verify peer state</h2>
      <CodeBlock lang="bash" code={`./bin/fgpctl -url http://127.0.0.1:9091 diameter peers`} />

      <p>
        Each entry carries the peer <code>uri</code> and its current <code>state</code>. Expect at
        least one peer in <code>open</code> (the operational state; other values are{' '}
        <code>disconnected</code>, <code>connecting</code>, <code>handshaking</code>, and{' '}
        <code>closing</code>):
      </p>
      <CodeBlock lang="json" code={`[
  {
    "uri": "aaa://10.56.56.10:3868",
    "state": "open"
  }
]`} />

      <h2 id="point-mme">Point the MME at the proxy</h2>
      <p>
        Configure the MME's S6a peer to point at the proxy's <code>listen_addr</code> instead of
        the HSS directly. The exact mechanism depends on your MME; the key fact is that the MME
        opens an SCTP association to the proxy, exchanges CER/CEA, and starts sending S6a requests.
      </p>

      <h2 id="exercise">Exercise with a UE attach</h2>
      <p>
        Trigger an attach on the MME. The S6a flow is:
      </p>
      <ol>
        <li>MME sends <strong>AIR</strong> (Authentication-Information-Request) to the proxy.</li>
        <li>The proxy runs the request through the filter chain, then forwards via the route for realm <code>epc.example.com</code> to the HSS.</li>
        <li>HSS replies with <strong>AIA</strong>.</li>
        <li>The proxy runs the response stage and returns the AIA to the MME.</li>
        <li>MME proceeds with <strong>ULR/ULA</strong> for location update.</li>
      </ol>

      <p>Check the relay summary while the flow runs:</p>
      <CodeBlock lang="bash" code={`./bin/fgpctl -url http://127.0.0.1:9091 diameter stats`} />

      <p>
        This returns the relay's identity and live peer count — confirm <code>peer_count</code>{' '}
        reflects the HSS (and any MMEs) that have come up:
      </p>
      <CodeBlock lang="json" code={`{
  "origin_host": "fgp.epc.example.com",
  "origin_realm": "epc.example.com",
  "peer_count": 1
}`} />

      <p>
        Per-message counters and latencies are exposed as Prometheus metrics on the proxy's{' '}
        <code>/metrics</code> endpoint, not in this command. Look for these while the flow runs:
      </p>
      <ul>
        <li><code>fgp_diameter_requests_total</code> incrementing per AIR / ULR.</li>
        <li><code>fgp_diameter_forward_total</code> incrementing with <code>result=success</code>.</li>
        <li><code>fgp_diameter_forward_duration_seconds</code> histogram updated.</li>
      </ul>

      <h2 id="watchdog">Watch the watchdog</h2>
      <p>
        Periodically (default 30s) the proxy sends DWR to each peer. The peer answers DWA. If{' '}
        <code>max_missed_watchdogs</code> DWAs are missed, the proxy closes the peer and reconnects.
        Watch it happen by temporarily killing the HSS process — the proxy detects the missed DWAs,
        marks the peer down, and reconnects automatically when the HSS returns.
      </p>

      <h2 id="hardening">Hardening before production</h2>
      <ul>
        <li>
          Turn <code>accept_undefined_peer</code> off and list MMEs explicitly with
          <code>connection_mode: responder</code>.
        </li>
        <li>
          Turn <code>default_action</code> back to <code>deny</code> and add policy rules. The
          same rule set covers both protocol planes — see{' '}
          <Link to="/concepts/policy-engine">Policy engine</Link>.
        </li>
        <li>
          Enable TLS on the TCP transport (or rely on SCTP path security + network-level
          isolation for SCTP).
        </li>
        <li>
          Configure realm-scoped routes if you proxy more than one application. Use{' '}
          <code>origin_realms[]</code> if the proxy is authoritative for multiple realms.
        </li>
        <li>
          Decide whether to enable <code>duplicate_protection</code> — needed when peers
          retransmit aggressively; off by default to save memory.
        </li>
      </ul>

      <h2 id="related">Related</h2>
      <ul>
        <li><Link to="/concepts/diameter-peering">Diameter peering</Link> — connection-mode model, watchdog, duplicate protection.</li>
        <li><Link to="/reference/config-schema">Config schema</Link> — every <code>diameter</code> field.</li>
        <li><Link to="/api/producers-and-profiles">Admin API → Producers and profiles</Link> — peers, stats endpoints.</li>
      </ul>
    </DocPage>
  );
}
