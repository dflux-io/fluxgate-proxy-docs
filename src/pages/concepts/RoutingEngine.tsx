import DocPage from '../../components/DocPage';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function RoutingEngine() {
  return (
    <DocPage
      slug="concepts/routing-engine"
      lede="The routing engine picks a producer (SBI) or peer (Diameter) for each request that survived the filter chain. It supports content-based matching, SUPI ranges, time windows, weighted targets, and sticky sessions — all hot-reloadable."
    >
      <h2 id="when-routing-runs">When routing runs</h2>
      <p>
        Routing runs <em>after</em> the request filter chain returns "allow". On SBI, the engine
        calls <code>RoutingEngine.Resolve</code> to pick a target producer. On Diameter, it
        calls <code>RoutingEngine.ResolveWithFailover</code>, which retries on the next peer
        for the same realm if the first peer fails.
      </p>

      <h2 id="match-conditions">Match conditions</h2>
      <p>A routing rule's match block can constrain on:</p>
      <ul>
        <li><strong>Path</strong> and <strong>method</strong> for SBI.</li>
        <li><strong>NF type</strong> — route only requests targeting a particular NF.</li>
        <li>
          <strong>SUPI range</strong> — route by subscriber identity prefix or numeric range.
          Useful for sending a tenant's subscribers to a dedicated UDM cluster.
        </li>
        <li>
          <strong>Time window</strong> — route only during a window (e.g., maintenance window,
          off-peak hours, regional outage).
        </li>
        <li><strong>Tenant</strong> — route by resolved tenant identity.</li>
        <li><strong>AVP matcher</strong> — for Diameter, match on AVP values.</li>
      </ul>

      <h2 id="targets">Targets</h2>
      <p>A rule resolves to one or more targets. A target carries:</p>
      <ul>
        <li><strong>Address</strong> — the producer URL or Diameter peer address.</li>
        <li>
          <strong>Weight</strong> — how often this target is selected relative to others on the
          same rule. Set to <code>0</code> to drain without removing.
        </li>
        <li><strong>Sticky session</strong> flag — see below.</li>
      </ul>

      <h2 id="weighted-targets">Weighted targets</h2>
      <p>
        When a rule has multiple targets, FGP selects one weighted-randomly per request. Common
        patterns:
      </p>
      <ul>
        <li>
          <strong>Canary:</strong> 95 / 5 split between the production target and the canary
          target.
        </li>
        <li>
          <strong>Blue/green:</strong> 100 / 0 today, 0 / 100 after cutover — weight changes
          hot-reload, no restart.
        </li>
        <li>
          <strong>Drain:</strong> set a target's weight to <code>0</code> to stop new traffic
          without removing the entry, then restore later.
        </li>
      </ul>

      <h2 id="sticky-sessions">Sticky sessions</h2>
      <p>
        For workloads where the same subscriber must keep landing on the same producer (session
        state, idempotency tokens), enable the sticky-session flag on the target. FGP keys on
        the request's SUPI and uses consistent hashing to pick a target, so the same SUPI maps
        to the same producer until the target is drained or weights change.
      </p>

      <Callout type="note" title="Sticky sessions are best-effort">
        Consistent hashing keeps the mapping stable while the target set is stable. Adding or
        removing a target reshuffles a fraction of the keys. If you must avoid any reshuffling
        during a deploy, drain weight-to-zero first, let in-flight sessions complete, then
        remove.
      </Callout>

      <h2 id="diameter-failover">Diameter realm failover</h2>
      <p>
        Diameter routes work by realm: each route lists application ids and a peer set for a
        named realm. When forwarding, FGP picks the highest-priority reachable peer in the
        realm. On failure, <code>ResolveWithFailover</code> tries the next peer. Watchdog state
        (DWA / DPA) feeds the reachable-peer set in real time — a peer that misses too many
        watchdogs drops out of routing automatically.
      </p>

      <h2 id="evaluation-order">Rule evaluation order</h2>
      <p>
        Routing rules are evaluated in order; the first matching rule wins. If no rule matches,
        FGP falls back to the producer pool (NRF-discovered producers for the request's NF
        type, weighted by their NRF profile). If neither produces a target, the request is
        rejected with the appropriate protocol-level error.
      </p>

      <h2 id="related">Related</h2>
      <ul>
        <li><Link to="/reference/routing-schema">Routing schema</Link> — full rule fields.</li>
        <li><Link to="/api/routing">Admin API → Routing</Link> — CRUD.</li>
        <li><Link to="/api/producers-and-profiles">Admin API → Producers and profiles</Link> — runtime peer ops.</li>
        <li><Link to="/concepts/nrf-and-producers">NRF and producers</Link> — how the producer pool gets populated.</li>
      </ul>
    </DocPage>
  );
}
