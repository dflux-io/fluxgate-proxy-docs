import DocPage from '../../components/DocPage';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function NrfAndProducers() {
  return (
    <DocPage
      slug="concepts/nrf-and-producers"
      lede="On the SBI side, fluxgate-proxy integrates with the NRF in two roles: it registers a shadow NF profile for itself so consumers discover the proxy, and it discovers downstream producers so requests can be routed dynamically. The producer pool can also be populated from static config."
    >
      <h2 id="two-roles">Two NRF roles</h2>
      <p>fluxgate-proxy plays two roles with respect to the NRF:</p>
      <ul>
        <li>
          <strong>Registration.</strong> At startup, the proxy registers one or more shadow NF
          profiles with the configured NRF — for example a UDM profile that lists the proxy's
          listen address. Consumers that discover UDM through the NRF see the proxy as a UDM
          instance and send their requests to it. The proxy heartbeats the profile at a
          configurable cadence.
        </li>
        <li>
          <strong>Discovery.</strong> The proxy queries the NRF for available producers (by NF
          type and selection criteria), populates a producer pool, and selects from that pool
          when routing.
        </li>
      </ul>

      <h2 id="shadow-profiles">Shadow NF profiles</h2>
      <p>
        A shadow profile is just an NRF profile the proxy registers on its own behalf. The
        profile advertises:
      </p>
      <ul>
        <li>The NF type the proxy impersonates (UDM, AUSF, PCF, UDR, SMF, AMF, NSSF, …).</li>
        <li>The proxy's listen address(es) and supported services.</li>
        <li>PLMN and S-NSSAI scope.</li>
        <li>Priority and capacity hints used by consumers for selection.</li>
      </ul>
      <p>
        Profiles are configured via the admin API (<code>/admin/nrf-profiles</code>) or in the
        config file. See <Link to="/reference/config-schema">Config schema</Link> for the field
        list.
      </p>

      <Callout type="note" title="NRF profile changes re-register live">
        Changes under <code>/admin/nrf-profiles</code> persist immediately and re-register with
        the NRF without a restart: each create, update, or delete triggers the NRF registration
        component to deregister and re-register the full profile set against the NRF. The same
        hot-reload guarantee applies to other control-plane changes (policy, rate-limit,
        transformation, and routing rules, and the producer pool).
      </Callout>

      <h2 id="discovery">Producer discovery</h2>
      <p>
        When <code>nrf.discover_producers: true</code>, the proxy periodically issues NF-Discovery
        requests to the NRF for each producer NF type it needs. Discovered instances populate
        the producer pool with their advertised addresses, priorities, and capacities.
      </p>
      <p>
        Discovery is incremental and idempotent — new instances join the pool, drained
        instances drop out, and existing instances are updated. The pool refresh interval is
        configurable.
      </p>

      <h2 id="producer-pool">The producer pool</h2>
      <p>
        The producer pool is the in-memory list of reachable producers per NF type. The
        routing engine reads it when no explicit routing rule applies (or when a rule resolves
        to an NF type rather than a specific address).
      </p>
      <p>The pool combines:</p>
      <ul>
        <li><strong>NRF-discovered producers</strong> — automatically refreshed.</li>
        <li>
          <strong>Static producers</strong> — declared in <code>nrf.producers[]</code> or
          via <code>/admin/producer-configs</code>. Useful for environments without an NRF, or
          to pin a particular instance.
        </li>
      </ul>

      <h2 id="runtime-ops">Runtime producer ops</h2>
      <p>The admin API exposes runtime knobs on the pool:</p>
      <ul>
        <li>
          <strong>Drain / restore</strong> — <code>PATCH /admin/peers/sbi/{`{nf_type}`}</code>{' '}
          with a JSON body of <code>{`{address, state}`}</code>, where <code>state</code> is{' '}
          <code>drained</code> or <code>active</code>. A drained producer stops receiving new
          requests while in-flight requests complete; setting it back to <code>active</code>{' '}
          returns it to the pool. PATCH to the same state is idempotent.
        </li>
        <li>
          <strong>Weight</strong> — <code>PUT /admin/peers/sbi/{`{nf_type}`}/weight</code>.
          Shift traffic share without removing the producer.
        </li>
        <li>
          <strong>List</strong> — <code>GET /admin/peers/sbi</code> and{' '}
          <code>GET /admin/peers/sbi/{`{nf_type}`}</code>.
        </li>
      </ul>
      <p>
        These knobs are hot-reloadable: no restart, decisions take effect on the next request.
        See <Link to="/api/producers-and-profiles">Admin API → Producers and profiles</Link>.
      </p>

      <h2 id="health">Deep health</h2>
      <p>
        <code>GET /admin/health/deep</code> walks the producer pool and reports each producer's
        reachability. It is the operator's primary signal for "is this proxy actually able to
        serve traffic?" — distinct from the cheap liveness check on the SBI listener.
      </p>

      <h2 id="related">Related</h2>
      <ul>
        <li><Link to="/concepts/routing-engine">Routing engine</Link> — how the pool feeds routing.</li>
        <li><Link to="/api/producers-and-profiles">Admin API → Producers and profiles</Link>.</li>
        <li><Link to="/reference/config-schema">Config schema</Link> — <code>nrf</code> block fields.</li>
      </ul>
    </DocPage>
  );
}
