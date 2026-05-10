import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import HttpMethod from '../../components/HttpMethod';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function ProducersAndProfiles() {
  return (
    <DocPage
      slug="api/producers-and-profiles"
      lede="Persistent producer configs, NRF NF profiles, runtime SBI peer ops (drain / restore / weight), and Diameter peer + stats visibility."
    >
      <h2 id="persistent-producers">Persistent producer configs</h2>
      <p>Define producers in the control-plane store, decoupled from NRF discovery.</p>

      <p><HttpMethod method="GET" /> <code>/admin/producer-configs</code></p>
      <p><HttpMethod method="POST" /> <code>/admin/producer-configs</code></p>
      <p><HttpMethod method="GET" /> <code>/admin/producer-configs/{`{name}`}</code></p>
      <p><HttpMethod method="PUT" /> <code>/admin/producer-configs/{`{name}`}</code></p>
      <p><HttpMethod method="DELETE" /> <code>/admin/producer-configs/{`{name}`}</code></p>

      <h2 id="nrf-profiles">NRF NF profiles</h2>
      <p>Shadow profiles FGP registers with the NRF on its own behalf.</p>

      <p><HttpMethod method="GET" /> <code>/admin/nrf-profiles</code></p>
      <p><HttpMethod method="POST" /> <code>/admin/nrf-profiles</code></p>
      <p><HttpMethod method="GET" /> <code>/admin/nrf-profiles/{`{name}`}</code></p>
      <p><HttpMethod method="PUT" /> <code>/admin/nrf-profiles/{`{name}`}</code></p>
      <p><HttpMethod method="DELETE" /> <code>/admin/nrf-profiles/{`{name}`}</code></p>

      <Callout type="warning" title="Profile registration needs a restart">
        Changes to <code>/admin/nrf-profiles</code> persist immediately, but the registrar
        component takes its snapshot of profiles at startup. To re-register with new or edited
        profiles, restart the proxy. Other control-plane changes are fully hot-reloadable.
      </Callout>

      <h2 id="sbi-peer-ops">SBI peer ops</h2>
      <p>Runtime ops on the producer pool — drain, restore, weight, list.</p>

      <p><HttpMethod method="GET" /> <code>/admin/peers/sbi</code></p>
      <p>List all SBI peers across all NF types.</p>

      <p><HttpMethod method="GET" /> <code>/admin/peers/sbi/{`{nf_type}`}</code></p>
      <p>List SBI peers for one NF type.</p>

      <p><HttpMethod method="PUT" /> <code>/admin/peers/sbi/{`{nf_type}`}/weight</code></p>
      <p>Update a peer's weight. Body:</p>
      <CodeBlock lang="json" code={`{"address": "http://udm-2.svc:8080", "weight": 50}`} />

      <p><HttpMethod method="POST" /> <code>/admin/peers/sbi/{`{nf_type}`}/drain</code></p>
      <p>Drain a peer — stop new traffic, allow in-flight to complete. Body:</p>
      <CodeBlock lang="json" code={`{"address": "http://udm-2.svc:8080"}`} />

      <p><HttpMethod method="POST" /> <code>/admin/peers/sbi/{`{nf_type}`}/restore</code></p>
      <p>Restore a drained peer.</p>

      <h2 id="diameter-peers">Diameter peers and stats</h2>

      <p><HttpMethod method="GET" /> <code>/admin/peers/diameter</code></p>
      <p>List Diameter peer connections and state. Each entry includes address, origin host/realm, state, applications advertised, connection mode, and watchdog miss count.</p>

      <p><HttpMethod method="GET" /> <code>/admin/stats/diameter</code></p>
      <p>Diameter relay statistics — request counts, forward counts, error breakdowns.</p>

      <p><HttpMethod method="GET" /> <code>/admin/stats/sbi</code></p>
      <p>Aggregate SBI peer counts (total / healthy / draining), by NF type.</p>

      <h2 id="examples">Examples</h2>

      <h3 id="drain-flapping">Drain a flapping producer</h3>
      <CodeBlock lang="bash" code={`# stop new traffic
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" -H "Content-Type: application/json" \\
  -X POST https://fgp.svc:8091/admin/peers/sbi/UDM/drain \\
  -d '{"address":"http://udm-2.svc:8080"}'

# verify
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" \\
  https://fgp.svc:8091/admin/peers/sbi/UDM | jq

# investigate, fix, restore
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" -H "Content-Type: application/json" \\
  -X POST https://fgp.svc:8091/admin/peers/sbi/UDM/restore \\
  -d '{"address":"http://udm-2.svc:8080"}'`} />

      <h3 id="diameter-status">Check Diameter peer state</h3>
      <CodeBlock lang="bash" code={`curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" \\
  https://fgp.svc:8091/admin/peers/diameter | jq`} />

      <CodeBlock lang="json" code={`[
  {
    "address": "aaa://10.56.56.10:3868",
    "origin_host": "hss.epc.example.com",
    "origin_realm": "epc.example.com",
    "state": "STATE_OPEN",
    "applications": [{"app_id": 16777251, "vendor_id": 10415}],
    "connection_mode": "initiator",
    "watchdog_misses": 0,
    "last_dwa_seconds_ago": 27
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
