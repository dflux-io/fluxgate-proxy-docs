import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import HttpMethod from '../../components/HttpMethod';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function ProducersAndProfiles() {
  return (
    <DocPage
      slug="api/producers-and-profiles"
      lede="Persistent producer configs, NRF NF profiles, runtime SBI peer ops (weight and drain / restore state), and peer + relay observability."
    >
      <h2 id="persistent-producers">Persistent producer configs</h2>
      <p>Define producers in the control-plane store, decoupled from NRF discovery.</p>

      <p><HttpMethod method="GET" /> <code>/admin/producer-configs</code></p>
      <p><HttpMethod method="POST" /> <code>/admin/producer-configs</code></p>
      <p><HttpMethod method="GET" /> <code>/admin/producer-configs/{`{name}`}</code></p>
      <p><HttpMethod method="PUT" /> <code>/admin/producer-configs/{`{name}`}</code></p>
      <p><HttpMethod method="DELETE" /> <code>/admin/producer-configs/{`{name}`}</code></p>

      <h2 id="nrf-profiles">NRF NF profiles</h2>
      <p>Shadow profiles the proxy registers with the NRF on its own behalf.</p>

      <p><HttpMethod method="GET" /> <code>/admin/nrf-profiles</code></p>
      <p><HttpMethod method="POST" /> <code>/admin/nrf-profiles</code></p>
      <p><HttpMethod method="GET" /> <code>/admin/nrf-profiles/{`{name}`}</code></p>
      <p><HttpMethod method="PUT" /> <code>/admin/nrf-profiles/{`{name}`}</code></p>
      <p><HttpMethod method="DELETE" /> <code>/admin/nrf-profiles/{`{name}`}</code></p>

      <Callout type="note" title="Profile changes are hot-reloaded">
        Every create, update, or delete on <code>/admin/nrf-profiles</code> persists and takes
        effect immediately: the NRF registration component deregisters, swaps in the new profile
        set, and re-registers synchronously. No restart is needed.
      </Callout>

      <h2 id="sbi-peer-ops">SBI peer ops</h2>
      <p>Runtime ops on the producer pool — list, weight, and state (drain / restore).</p>

      <p><HttpMethod method="GET" /> <code>/admin/peers/sbi</code></p>
      <p>List all SBI peers across all NF types.</p>

      <p><HttpMethod method="GET" /> <code>/admin/peers/sbi/{`{nf_type}`}</code></p>
      <p>List SBI peers for one NF type.</p>

      <p><HttpMethod method="PUT" /> <code>/admin/peers/sbi/{`{nf_type}`}/weight</code></p>
      <p>Update a peer's weight. Body:</p>
      <CodeBlock lang="json" code={`{"address": "http://udm-2.svc:8080", "weight": 50}`} />

      <p><HttpMethod method="PATCH" /> <code>/admin/peers/sbi/{`{nf_type}`}</code></p>
      <p>
        Set a peer's state. Body is <code>{`{address, state}`}</code> where <code>state</code> is{' '}
        <code>"drained"</code> (stop new traffic, let in-flight requests complete) or{' '}
        <code>"active"</code> (restore a drained peer). Patching to the same state is idempotent.
      </p>
      <CodeBlock lang="json" code={`{"address": "http://udm-2.svc:8080", "state": "drained"}`} />

      <h2 id="diameter-peers">Peer and relay observability</h2>

      <p><HttpMethod method="GET" /> <code>/admin/peers/diameter</code></p>
      <p>List Diameter peer connections and state. Each entry is <code>{`{uri, state}`}</code>.</p>

      <p><HttpMethod method="GET" /> <code>/admin/stats/diameter</code></p>
      <p>Diameter relay summary: <code>origin_host</code>, <code>origin_realm</code>, and <code>peer_count</code>.</p>

      <p><HttpMethod method="GET" /> <code>/admin/stats/sbi</code></p>
      <p>Aggregate SBI peer counts (<code>total</code> / <code>healthy</code> / <code>draining</code>), with a <code>by_nf_type</code> breakdown.</p>

      <h2 id="examples">Examples</h2>

      <h3 id="drain-flapping">Drain a flapping producer</h3>
      <CodeBlock lang="bash" code={`# stop new traffic
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" -H "Content-Type: application/json" \\
  -X PATCH https://fgp.svc:9091/admin/peers/sbi/UDM \\
  -d '{"address":"http://udm-2.svc:8080","state":"drained"}'

# verify
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" \\
  https://fgp.svc:9091/admin/peers/sbi/UDM | jq

# investigate, fix, restore
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" -H "Content-Type: application/json" \\
  -X PATCH https://fgp.svc:9091/admin/peers/sbi/UDM \\
  -d '{"address":"http://udm-2.svc:8080","state":"active"}'`} />

      <h3 id="diameter-status">Check Diameter peer state</h3>
      <CodeBlock lang="bash" code={`curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" \\
  https://fgp.svc:9091/admin/peers/diameter | jq`} />

      <CodeBlock lang="json" code={`[
  {
    "uri": "aaa://10.56.56.10:3868",
    "state": "STATE_OPEN"
  }
]`} />

      <h2 id="related">Related</h2>
      <ul>
        <li><Link to="/concepts/nrf-and-producers">NRF and producers</Link>.</li>
        <li><Link to="/concepts/diameter-peering">Diameter peering</Link>.</li>
        <li><Link to="/guides/hot-reload-and-runtime-ops">Hot reload and runtime ops</Link>.</li>
      </ul>
    </DocPage>
  );
}
