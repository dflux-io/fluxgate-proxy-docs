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
        Routing runs <em>after</em> the request filter chain returns "allow". The engine
        evaluates the configured routing rules in priority order, resolves the matched rule's
        target to a single producer (SBI) or Diameter peer, and hands the request to the
        forwarder. A routing rule may also carry a failover producer list that the forwarder
        falls back to if the primary attempt fails — see <a href="#failover">Failover</a>.
      </p>

      <h2 id="match-conditions">Match conditions</h2>
      <p>A routing rule's <code>condition</code> block can constrain on:</p>
      <ul>
        <li>
          <strong>Path patterns</strong> (<code>path_patterns</code>) and{' '}
          <strong>methods</strong> for SBI.
        </li>
        <li>
          <strong>NF type</strong> — <code>target_nf_types</code> /{' '}
          <code>source_nf_types</code> to route by the requesting or destination NF.
        </li>
        <li>
          <strong>SUPI range</strong> (<code>supi_ranges</code>) — route by subscriber identity
          range. Useful for sending a slice of subscribers to a dedicated UDM cluster.
        </li>
        <li>
          <strong>Slice and DNN</strong> — <code>snssais</code>, <code>dnns</code>,{' '}
          <code>visited_plmns</code>, and <code>api_versions</code>.
        </li>
        <li>
          <strong>Header and body match</strong> — <code>header_match</code> and{' '}
          <code>body_field_match</code> for content-based routing.
        </li>
        <li>
          <strong>Time window</strong> (<code>time_windows</code>) — match only during a window
          (e.g., a maintenance window or off-peak hours).
        </li>
        <li>
          <strong>Diameter matchers</strong> — <code>diameter_apps</code>,{' '}
          <code>command_codes</code>, origin/destination realms and hosts, and{' '}
          <code>imsi_ranges</code>.
        </li>
      </ul>

      <h2 id="targets">Targets</h2>
      <p>A matched rule's <code>target</code> resolves to a single producer. A target can carry:</p>
      <ul>
        <li>
          <strong><code>nf_type</code></strong> — when set without explicit producers, the
          request falls through to the producer pool for that NF type.
        </li>
        <li>
          <strong><code>producers</code></strong> — an explicit list of producer addresses, each
          with an optional <code>weight</code> for weighted-random selection.
        </li>
        <li>
          <strong><code>weighted_targets</code></strong> — a percentage split for canary and
          blue/green rollouts — see below.
        </li>
        <li>
          <strong><code>sticky_key</code></strong> / <strong><code>sticky_ttl</code></strong> —
          session affinity — see <a href="#sticky-sessions">Sticky sessions</a>.
        </li>
        <li>
          <strong><code>failover</code></strong> — a fallback producer list — see{' '}
          <a href="#failover">Failover</a>.
        </li>
      </ul>

      <h2 id="weighted-targets">Weighted targets</h2>
      <p>
        When a target lists <code>weighted_targets</code>, the proxy selects one address per
        request, weighted-randomly by the percentage on each entry. Each weight is{' '}
        <code>1</code>–<code>100</code> and the set must sum to <code>100</code>. Common
        patterns:
      </p>
      <ul>
        <li>
          <strong>Canary:</strong> a 95 / 5 split between the production target and the canary
          target.
        </li>
        <li>
          <strong>Blue/green:</strong> shift the split toward the new target over successive
          edits, e.g. 90 / 10 then 50 / 50 then 10 / 90. Weight changes hot-reload, no restart.
        </li>
      </ul>
      <Callout type="note" title="Draining a producer is a separate operation">
        Weighted-target weights cannot be set to <code>0</code> (validation requires each weight
        in <code>1</code>–<code>100</code>). To take a producer out of rotation, use the
        producer-pool drain operation on the admin API rather than zeroing a routing weight —
        see <Link to="/api/producers-and-profiles">Admin API → Producers and profiles</Link>.
      </Callout>

      <h2 id="sticky-sessions">Sticky sessions</h2>
      <p>
        For workloads where the same subscriber must keep landing on the same producer (session
        state, idempotency tokens), set <code>sticky_key</code> on the target together with a{' '}
        <code>sticky_ttl</code>. The sticky key is configurable — one of <code>supi</code>,{' '}
        <code>gpsi</code>, <code>imsi</code>, <code>session_id</code>, <code>origin_host</code>,
        or <code>request_id</code>. On the first request for a given key value, the engine picks
        a producer normally and caches that producer under the key value; subsequent requests
        with the same value reuse the cached producer until the entry expires.
      </p>

      <Callout type="note" title="Stickiness is a TTL cache">
        The mapping is a per-key TTL cache, not consistent hashing. An entry lives for{' '}
        <code>sticky_ttl</code> after it is set, then expires and the next request re-resolves a
        producer. Sticky lookups bypass the primary/failover path for the duration of the TTL.
      </Callout>

      <h2 id="failover">Failover</h2>
      <p>
        A routing rule's <code>target.failover</code> carries an ordered list of fallback
        producers. When the primary attempt fails, the forwarder retries against those producers
        in order, bounded by <code>max_retries</code>. This applies to both SBI and Diameter and
        is independent of Diameter realm-peer selection performed by the relay.
      </p>
      <p>
        Failover triggers on more than transport failure. The default is transport-only, but a
        failover target can also retry on application-level responses: <code>trigger_on_status</code>{' '}
        lists HTTP status codes (SBI) and <code>trigger_on_result_code</code> lists Diameter
        Result-Code / Experimental-Result-Code values that should be treated as a retryable
        failure.
      </p>

      <h2 id="evaluation-order">Rule evaluation order</h2>
      <p>
        Routing rules are evaluated in priority order; the first matching rule wins. If no rule
        matches, the proxy falls back to the producer pool (NRF-discovered producers for the
        request's NF type, weighted by their NRF profile). If neither produces a target, the
        request is rejected with the appropriate protocol-level error.
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
