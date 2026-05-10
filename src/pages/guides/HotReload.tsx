import DocPage from '../../components/DocPage';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function HotReload() {
  return (
    <DocPage
      slug="guides/hot-reload-and-runtime-ops"
      lede="Most operational changes to FGP take effect without restarting the daemon. This guide spells out exactly what's hot-reloadable, what isn't, and the runtime ops you can perform — drain a producer, change log level, validate a config — without a redeploy."
    >
      <h2 id="mechanism">The mechanism</h2>
      <p>
        FGP holds the request and response filter chains in <code>atomic.Pointer[T]</code>{' '}
        fields. When the control-plane-store watcher detects a change (default poll interval
        5s), the proxy builds a fresh chain off the request path and atomic-swaps it in. No
        per-request lock, no draining of in-flight requests, no dropped connections.
      </p>

      <h2 id="hot-reloadable">Hot-reloadable (no restart)</h2>
      <table>
        <thead>
          <tr><th>Change</th><th>How it lands</th></tr>
        </thead>
        <tbody>
          <tr><td>Policy rules — add / update / delete / rollback</td><td>admin API mutation → store → next watcher tick → atomic swap</td></tr>
          <tr><td>Rate-limit rules</td><td>same</td></tr>
          <tr><td>Transformation rules</td><td>same</td></tr>
          <tr><td>Routing rules</td><td>same</td></tr>
          <tr><td>Tenants</td><td>same</td></tr>
          <tr><td>Anomaly scoring and threat-detection config</td><td>same</td></tr>
          <tr><td>Producer pool — drain / restore / weight</td><td>direct admin endpoint; takes effect on next request</td></tr>
          <tr><td>Producer configs (persistent)</td><td>store → next watcher tick</td></tr>
          <tr><td>Log level</td><td><code>PUT /admin/log-level</code>; immediate</td></tr>
          <tr><td>Active policy version (rollback)</td><td>atomic swap to historical document</td></tr>
        </tbody>
      </table>

      <Callout type="tip" title="Watch your fingertips">
        Every hot-reloadable mutation lands in the admin audit log with the operator identity.
        A "the rule disappeared" incident is almost always something explainable — check the
        admin audit log first.
      </Callout>

      <h2 id="restart-required">Requires restart</h2>
      <table>
        <thead>
          <tr><th>Change</th><th>Why a restart</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>NRF profile <em>registration</em></td>
            <td>The registrar component snapshots profiles at startup; admin-API edits persist but don't re-register</td>
          </tr>
          <tr><td>Listen addresses (SBI / admin / Diameter)</td><td>Listeners bind at startup</td></tr>
          <tr><td>TLS material on the listeners</td><td>Reloaded on certificate file change via the cert reloader; full TLS block swaps require restart</td></tr>
          <tr><td>Diameter applications, transport, origin host/realm</td><td>The Diameter node bootstraps at startup</td></tr>
          <tr><td>Diameter peers — adding / removing</td><td>Peer set is bound at startup; tweak from the config file then restart</td></tr>
          <tr><td>Storage drivers / DSNs</td><td>Connection pools open at startup</td></tr>
          <tr><td>Audit signing key</td><td>Loaded once at startup</td></tr>
          <tr><td>Audit sink configuration</td><td>Sink workers spawn at startup</td></tr>
          <tr><td>pprof, tracing endpoint, server timeouts</td><td>Bound to long-lived components</td></tr>
        </tbody>
      </table>

      <h2 id="cert-reload">Certificate reload</h2>
      <p>
        The certificate reloader watches the configured <code>cert_file</code> and{' '}
        <code>key_file</code> paths and reloads on change. The standard ops pattern:
      </p>
      <ol>
        <li>Drop the new cert + key alongside the old, or rename atomically.</li>
        <li>The reloader picks up the change on the next file-watch tick.</li>
        <li>New TLS handshakes use the new material; established connections keep their existing TLS state.</li>
      </ol>
      <p>This applies to both SBI and admin listeners (and Diameter TCP TLS).</p>

      <h2 id="runtime-ops">Runtime ops cheat sheet</h2>

      <h3 id="drain-a-producer">Drain and restore a producer</h3>
      <p>
        Take a single SBI producer out of rotation without removing it from config — useful for
        targeted ops on a flapping instance.
      </p>
      <pre><code>{`fgpctl producers drain UDM http://udm-2.svc:8080
# verify
fgpctl producers list UDM
# restore when done
fgpctl producers restore UDM http://udm-2.svc:8080`}</code></pre>

      <h3 id="weight-shift">Shift producer weight</h3>
      <pre><code>{`fgpctl producers weight UDM http://udm-canary.svc:8080 5
fgpctl producers weight UDM http://udm-prod.svc:8080  95`}</code></pre>
      <p>Both take effect on the next request. No restart.</p>

      <h3 id="log-level">Change log level live</h3>
      <pre><code>{`fgpctl log-level                    # show current
fgpctl log-level set debug          # raise verbosity
fgpctl log-level set info           # revert`}</code></pre>

      <h3 id="validate-before-apply">Validate before apply</h3>
      <pre><code>{`fgpctl validate config new-fgp.yaml
fgpctl validate policy new-policy.json`}</code></pre>

      <h3 id="watcher-cadence">Tune watcher cadence</h3>
      <p>
        The store-watcher polls at <code>process.store_watch_interval</code> (default 5s).
        Tighter means faster propagation in multi-instance deployments; looser means fewer DB
        round-trips. Restart required to change.
      </p>

      <h2 id="multi-instance">Multi-instance propagation</h2>
      <p>
        When two or more FGP instances share a Postgres control-plane store, a hot-reloadable
        change applied to one instance propagates to the others within the watcher window.
        For coordinated rollouts (e.g. a policy change you want to land everywhere
        simultaneously), drop the watcher interval temporarily, apply, then restore.
      </p>

      <h2 id="related">Related</h2>
      <ul>
        <li><Link to="/concepts/architecture">Architecture</Link> — the atomic-swap mechanism.</li>
        <li><Link to="/guides/policy-versioning">Policy versioning and rollback</Link> — atomic rollback flow.</li>
        <li><Link to="/api/producers-and-profiles">Admin API → Producers and profiles</Link>.</li>
      </ul>
    </DocPage>
  );
}
