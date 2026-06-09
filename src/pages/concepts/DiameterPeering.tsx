import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function DiameterPeering() {
  return (
    <DocPage
      slug="concepts/diameter-peering"
      lede="Diameter (RFC 6733) has no client/server concept — every node is a peer, and every connection has an Initiator (sent CER) and a Responder (sent CEA). fluxgate-proxy exposes this directly with a per-peer connection_mode field that says whether the proxy dials, accepts, or both."
    >
      <h2 id="connection-modes">Connection modes</h2>
      <p>
        Listening is implied by the presence of <code>diameter.listen_addr</code>. Per-peer
        behaviour is controlled by <code>connection_mode</code> on each entry in{' '}
        <code>peers[]</code>:
      </p>

      <table>
        <thead>
          <tr>
            <th><code>connection_mode</code></th>
            <th>Dials this peer</th>
            <th>Accepts inbound from this peer</th>
            <th>Use case</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>initiator</code> <em>(default)</em></td>
            <td>yes</td>
            <td>only via the listener (if <code>listen_addr</code> set)</td>
            <td>The proxy dials a producer HSS or PCRF</td>
          </tr>
          <tr>
            <td><code>responder</code></td>
            <td><strong>no</strong></td>
            <td>yes (requires <code>listen_addr</code>)</td>
            <td>Other peers connect <em>to</em> the proxy</td>
          </tr>
          <tr>
            <td><code>both</code></td>
            <td>yes</td>
            <td>yes</td>
            <td>Symmetric peering with election per RFC 6733 §5.6.4</td>
          </tr>
        </tbody>
      </table>

      <Callout type="warning" title="responder / both require listen_addr">
        A <code>responder</code> or <code>both</code> peer without <code>listen_addr</code> is
        rejected at startup. The legacy top-level <code>diameter.mode</code> field
        (<code>client</code> / <code>server</code> / <code>both</code>) is no longer accepted;
        configs that set it fail with a migration error.
      </Callout>

      <h2 id="examples">Examples</h2>

      <h3 id="initiator-only">Initiator-only — outbound to an HSS</h3>
      <CodeBlock lang="json" code={`{
  "diameter": {
    "enabled": true,
    "transport": "sctp",
    "origin_host": "fgp.epc.example.com",
    "origin_realm": "epc.example.com",
    "applications": [
      {"app_id": 16777251, "vendor_id": 10415, "app_type": "auth"}
    ],
    "peers": [
      {"address": "aaa://10.56.56.10:3868", "connection_mode": "initiator"}
    ],
    "routes": [
      {"realm": "epc.example.com", "application_ids": [16777251], "peers": ["aaa://10.56.56.10:3868"]}
    ],
    "sctp": {"max_in_streams": 16, "max_out_streams": 16}
  }
}`} />

      <h3 id="responder-only">Responder-only — accept inbound on :3868</h3>
      <CodeBlock lang="json" code={`{
  "diameter": {
    "enabled": true,
    "listen_addr": ":3868",
    "transport": "sctp",
    "origin_host": "fgp.epc.example.com",
    "origin_realm": "epc.example.com",
    "accept_undefined_peer": true,
    "applications": [
      {"app_id": 16777251, "vendor_id": 10415, "app_type": "auth"}
    ]
  }
}`} />

      <h3 id="both">Both — listen and dial the same peer</h3>
      <CodeBlock lang="json" code={`{
  "diameter": {
    "enabled": true,
    "listen_addr": ":3868",
    "transport": "tcp",
    "origin_host": "fgp.epc.example.com",
    "origin_realm": "epc.example.com",
    "applications": [
      {"app_id": 16777251, "vendor_id": 10415, "app_type": "auth"}
    ],
    "peers": [
      {"address": "aaa://10.56.56.10:3868", "connection_mode": "both"}
    ]
  }
}`} />

      <h2 id="origin">Origin-Host and Origin-Realms</h2>
      <p>
        <code>origin_host</code> is the Origin-Host AVP advertised in CER/CEA. Realms can be
        configured two ways:
      </p>
      <ul>
        <li>
          <strong>Single realm:</strong> <code>origin_realm: "example.com"</code>. Legacy form.
        </li>
        <li>
          <strong>Multiple realms:</strong> <code>origin_realms: ["epc.…", "ims.…"]</code>. The
          first entry is the primary realm used in the Origin-Realm AVP of every base-protocol
          message (RFC 6733 §6.3 requires exactly one per message). Other realms are still
          authoritative — useful when one proxy serves S6a in one realm and Rx in another.
        </li>
      </ul>

      <h2 id="timers-and-watchdog">Timers and watchdog</h2>
      <p>The proxy carries an explicit set of timers:</p>
      <ul>
        <li><code>timers.cea_timeout</code> — CER/CEA capabilities-exchange timeout (default 10s).</li>
        <li><code>timers.dwa_timeout</code> — DWR/DWA device-watchdog answer timeout (default 10s).</li>
        <li><code>timers.dpa_timeout</code> — DPR/DPA disconnect answer timeout (default 5s).</li>
        <li><code>watchdog_interval</code> — DWR send cadence.</li>
        <li><code>reconnect_interval</code> — delay before reconnecting a dropped peer.</li>
        <li><code>max_missed_watchdogs</code> — close the peer after this many missed DWA answers.</li>
        <li><code>request_timeout</code> — upper bound on how long the relay waits for a producer answer (default 10s).</li>
      </ul>

      <h2 id="duplicate-protection">Duplicate protection</h2>
      <p>
        RFC 6733 §6.3.4 specifies handling of duplicate messages identified by the
        (Origin-Host, End-to-End-Id) tuple. When <code>duplicate_protection: true</code>, the
        relay caches the answer sent for each tuple for <code>duplicate_timer</code> (default
        240s) and short-circuits retransmitted duplicates without re-invoking the handler or
        re-forwarding upstream.
      </p>
      <p>
        Memory usage scales with offered request rate × <code>duplicate_timer</code>. Off by
        default; zero cost when off.
      </p>

      <h2 id="applications">Applications</h2>
      <p>
        Each entry in <code>applications[]</code> declares an application id, vendor id, and
        type (<code>auth</code> or <code>acct</code>). Common 3GPP applications:
      </p>
      <ul>
        <li><strong>S6a / S6d</strong> — app id <code>16777251</code>, vendor id <code>10415</code>, auth.</li>
        <li><strong>Gx</strong> — app id <code>16777238</code>, vendor id <code>10415</code>, auth.</li>
        <li><strong>Rx</strong> — app id <code>16777236</code>, vendor id <code>10415</code>, auth.</li>
      </ul>

      <h2 id="related">Where to go next</h2>
      <ul>
        <li><Link to="/reference/config-schema">Config schema</Link> — full <code>diameter</code> block.</li>
        <li><Link to="/api/producers-and-profiles">Admin API → Producers and profiles</Link> — peer status.</li>
        <li><Link to="/tutorials/diameter-s6a-relay">Tutorial: bring up a Diameter S6a relay</Link>.</li>
      </ul>
    </DocPage>
  );
}
