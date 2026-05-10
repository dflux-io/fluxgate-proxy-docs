import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function ConfigSchema() {
  return (
    <DocPage
      slug="reference/config-schema"
      lede="Every top-level block of the YAML/JSON config file. The only accepted schema version is v1. Most fields are optional; the minimal config in examples/fgp-minimal.yaml shows the smallest valid file. The full example with comments lives at examples/fgp-full.yaml."
    >
      <h2 id="version">version</h2>
      <p>
        Schema version. The only accepted value today is <code>"v1"</code>. Empty defaults to
        <code>"v1"</code>. A future v2 will be a hard break.
      </p>

      <h2 id="mode">mode</h2>
      <p>Top-level role selector:</p>
      <ul>
        <li><code>""</code> (default) — auto. SBI on unless Diameter is enabled with no SBI workload.</li>
        <li><code>sbi</code> — SBI listener only.</li>
        <li><code>diameter</code> — Diameter listener only.</li>
        <li><code>both</code> — both protocols.</li>
      </ul>

      <h2 id="server">server (SBI HTTP/2 listener)</h2>
      <p>
        Inbound transport is HTTPS+HTTP/2 when <code>server.tls</code> is set, h2c (HTTP/2
        cleartext) otherwise. There is no HTTP/1.1 fallback — 3GPP SBI mandates HTTP/2.
      </p>
      <table>
        <thead><tr><th>Field</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>listen</code></td><td>string</td><td><code>:8090</code></td><td>Listen address.</td></tr>
          <tr><td><code>tls.cert_file</code></td><td>string</td><td>—</td><td>Server certificate. Required when <code>tls</code> is set.</td></tr>
          <tr><td><code>tls.key_file</code></td><td>string</td><td>—</td><td>Server private key. Required when <code>tls</code> is set.</td></tr>
          <tr><td><code>tls.ca_file</code></td><td>string</td><td>—</td><td>CA bundle. Required when <code>require_client_cert: true</code>.</td></tr>
          <tr><td><code>tls.insecure</code></td><td>bool</td><td><code>false</code></td><td>Disable cert verification on the server side. Rare.</td></tr>
          <tr><td><code>require_client_cert</code></td><td>bool</td><td><code>false</code></td><td>Enforce mTLS.</td></tr>
          <tr><td><code>timeouts.read_timeout</code></td><td>duration</td><td><code>30s</code></td><td></td></tr>
          <tr><td><code>timeouts.read_header_timeout</code></td><td>duration</td><td><code>10s</code></td><td></td></tr>
          <tr><td><code>timeouts.write_timeout</code></td><td>duration</td><td><code>60s</code></td><td></td></tr>
          <tr><td><code>timeouts.idle_timeout</code></td><td>duration</td><td><code>120s</code></td><td></td></tr>
          <tr><td><code>timeouts.max_header_bytes</code></td><td>int</td><td><code>1048576</code></td><td>1 MiB.</td></tr>
          <tr><td><code>max_request_body_size</code></td><td>int</td><td><code>1048576</code></td><td>1 MiB.</td></tr>
        </tbody>
      </table>

      <h2 id="diameter">diameter (relay)</h2>
      <p>
        See <Link to="/concepts/diameter-peering">Diameter peering</Link> for the full
        connection-mode model.
      </p>
      <table>
        <thead><tr><th>Field</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>enabled</code></td><td>bool</td><td><code>false</code></td><td>Enable the Diameter relay.</td></tr>
          <tr><td><code>listen_addr</code></td><td>string</td><td>—</td><td>Listen address. Required when any peer is <code>responder</code> or <code>both</code>.</td></tr>
          <tr><td><code>transport</code></td><td>string</td><td><code>tcp</code></td><td><code>tcp</code> or <code>sctp</code>.</td></tr>
          <tr><td><code>origin_host</code></td><td>string</td><td>—</td><td>Origin-Host AVP value.</td></tr>
          <tr><td><code>origin_realm</code></td><td>string</td><td>—</td><td>Single Origin-Realm form. Ignored when <code>origin_realms</code> is non-empty.</td></tr>
          <tr><td><code>origin_realms</code></td><td>[]string</td><td>—</td><td>All realms this node is authoritative for; first entry is primary (RFC 6733 §6.3 requires one per message).</td></tr>
          <tr><td><code>vendor_id</code></td><td>uint32</td><td><code>0</code></td><td>Vendor-Id AVP.</td></tr>
          <tr><td><code>accept_undefined_peer</code></td><td>bool</td><td><code>false</code></td><td>Accept CER from peers not listed in <code>peers[]</code>.</td></tr>
          <tr><td><code>product_name</code></td><td>string</td><td><code>FluxGate-FGP</code></td><td>Product-Name AVP in CER/CEA.</td></tr>
          <tr><td><code>host_ip_addresses</code></td><td>[]string</td><td>library-derived</td><td>Host-IP-Address AVPs.</td></tr>
          <tr><td><code>timers.cea_timeout</code></td><td>duration</td><td><code>10s</code></td><td>CER/CEA capabilities-exchange timeout.</td></tr>
          <tr><td><code>timers.dwa_timeout</code></td><td>duration</td><td><code>10s</code></td><td>DWR/DWA watchdog answer timeout.</td></tr>
          <tr><td><code>timers.dpa_timeout</code></td><td>duration</td><td><code>5s</code></td><td>DPR/DPA disconnect timeout.</td></tr>
          <tr><td><code>timers.stop_timeout</code></td><td>duration</td><td><code>10s</code></td><td>Graceful-shutdown bound. Caller deadlines win.</td></tr>
          <tr><td><code>duplicate_protection</code></td><td>bool</td><td><code>false</code></td><td>Enable RFC 6733 §6.3.4 duplicate detection.</td></tr>
          <tr><td><code>duplicate_timer</code></td><td>duration</td><td><code>240s</code></td><td>Per-entry TTL when protection is on.</td></tr>
          <tr><td><code>watchdog_interval</code></td><td>duration</td><td>library default</td><td>DWR send cadence.</td></tr>
          <tr><td><code>reconnect_interval</code></td><td>duration</td><td>library default</td><td>Delay before reconnecting a dropped peer.</td></tr>
          <tr><td><code>request_timeout</code></td><td>duration</td><td><code>10s</code></td><td>Upper bound on how long the relay waits for an upstream answer.</td></tr>
          <tr><td><code>max_missed_watchdogs</code></td><td>int</td><td>library default</td><td>Close the peer after this many missed DWA answers.</td></tr>
          <tr><td><code>applications[]</code></td><td>list</td><td>—</td><td>Each entry: <code>app_id</code>, <code>vendor_id</code>, <code>app_type</code> (<code>auth</code>/<code>acct</code>).</td></tr>
          <tr><td><code>peers[]</code></td><td>list</td><td>—</td><td>Each entry: <code>address</code>, <code>connection_mode</code> (<code>initiator</code>/<code>responder</code>/<code>both</code>), optional <code>name</code>, <code>realm</code>, <code>rating</code>.</td></tr>
          <tr><td><code>routes[]</code></td><td>list</td><td>—</td><td>Realm-based routes: <code>realm</code>, <code>application_ids</code>, <code>peers</code>, <code>local_action</code>.</td></tr>
          <tr><td><code>sctp</code></td><td>object</td><td>—</td><td>SCTP tuning (used only when <code>transport: sctp</code>).</td></tr>
          <tr><td><code>tls</code></td><td>object</td><td>—</td><td>TLS configuration (used only when <code>transport: tcp</code>).</td></tr>
        </tbody>
      </table>

      <Callout type="note" title="Duration format">
        YAML accepts Go duration strings (<code>10s</code>, <code>250ms</code>). JSON requires
        nanoseconds as an integer (<code>10000000000</code> for 10s).
      </Callout>

      <h2 id="process">process</h2>
      <table>
        <thead><tr><th>Field</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>shutdown_timeout</code></td><td>duration</td><td><code>15s</code></td><td>Graceful-shutdown bound.</td></tr>
          <tr><td><code>store_watch_interval</code></td><td>duration</td><td><code>5s</code></td><td>Control-plane store poll cadence.</td></tr>
          <tr><td><code>audit_queue.queue_size</code></td><td>int</td><td><code>256</code></td><td>Audit pipeline buffer size.</td></tr>
          <tr><td><code>audit_queue.workers</code></td><td>int</td><td><code>4</code></td><td>Audit pipeline workers.</td></tr>
          <tr><td><code>audit_queue.drain_timeout</code></td><td>duration</td><td><code>10s</code></td><td>Shutdown drain bound for the audit pipeline.</td></tr>
        </tbody>
      </table>

      <h2 id="storage">storage</h2>
      <p>See <Link to="/guides/using-postgres">Using PostgreSQL</Link> for the production patterns.</p>
      <table>
        <thead><tr><th>Field</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>audit.driver</code></td><td>string</td><td><code>memory</code></td><td><code>memory</code>, <code>sqlite</code>, <code>postgres</code>.</td></tr>
          <tr><td><code>audit.dsn</code></td><td>string</td><td>—</td><td>Connection string. <code>dsn_file:</code> sibling reads from a file.</td></tr>
          <tr><td><code>control_plane_db.driver</code></td><td>string</td><td><code>sqlite</code></td><td><code>sqlite</code> or <code>postgres</code>.</td></tr>
          <tr><td><code>control_plane_db.dsn</code></td><td>string</td><td>in-memory shared-cache sqlite</td><td>Connection string.</td></tr>
        </tbody>
      </table>

      <h2 id="admin">admin</h2>
      <p>See <Link to="/guides/securing-the-admin-api">Securing the admin API</Link>.</p>
      <table>
        <thead><tr><th>Field</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>listen</code></td><td>string</td><td><code>127.0.0.1:8091</code></td><td>Listen address.</td></tr>
          <tr><td><code>default_action</code></td><td>string</td><td><code>deny</code></td><td><code>allow</code> or <code>deny</code>. Seeded into the policy store on first run.</td></tr>
          <tr><td><code>allow_anonymous</code></td><td>bool</td><td><code>false</code></td><td>Must be true if <code>auth</code> is empty, otherwise FGP refuses to start.</td></tr>
          <tr><td><code>allow_insecure</code></td><td>bool</td><td><code>false</code></td><td>Opt into cleartext h2c. Production should use TLS.</td></tr>
          <tr><td><code>auth.api_key</code></td><td>string</td><td>—</td><td>Legacy single key. Prefer <code>api_key_file</code>.</td></tr>
          <tr><td><code>auth.api_key_file</code></td><td>string</td><td>—</td><td>Path to a file holding the API key.</td></tr>
          <tr><td><code>auth.jwt_secret</code></td><td>string</td><td>—</td><td>HMAC secret. Prefer <code>jwt_secret_file</code>.</td></tr>
          <tr><td><code>auth.jwt_secret_file</code></td><td>string</td><td>—</td><td>Path to a file holding the HMAC secret.</td></tr>
          <tr><td><code>auth.jwt_public_key</code></td><td>string</td><td>—</td><td>Path to RSA/ECDSA public key for JWT verification.</td></tr>
          <tr><td><code>tls</code></td><td>object</td><td>—</td><td>TLS material. Configuring this lets you drop <code>allow_insecure</code>.</td></tr>
          <tr><td><code>require_client_cert</code></td><td>bool</td><td><code>false</code></td><td>mTLS on the admin listener.</td></tr>
        </tbody>
      </table>

      <h2 id="observability">observability</h2>
      <table>
        <thead><tr><th>Field</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>logging.level</code></td><td>string</td><td><code>info</code></td><td><code>trace</code> | <code>debug</code> | <code>info</code> | <code>warn</code> | <code>error</code>.</td></tr>
          <tr><td><code>logging.format</code></td><td>string</td><td><code>console</code></td><td><code>console</code> or <code>json</code>.</td></tr>
          <tr><td><code>logging.logfile</code></td><td>string</td><td>stderr</td><td>Append log output here instead of stderr.</td></tr>
          <tr><td><code>logging.caller</code></td><td>bool</td><td><code>false</code></td><td>Include <code>file:line</code> on every line.</td></tr>
          <tr><td><code>logging.db_query_log</code></td><td>bool</td><td><code>false</code></td><td>Log every SQL query (debug; warn for slow &gt; 200 ms).</td></tr>
          <tr><td><code>pprof.enabled</code></td><td>bool</td><td><code>false</code></td><td>Expose <code>net/http/pprof</code> on the SBI listener.</td></tr>
          <tr><td><code>tracing.endpoint</code></td><td>string</td><td>—</td><td>OTLP gRPC endpoint.</td></tr>
          <tr><td><code>tracing.service_name</code></td><td>string</td><td><code>fgp</code></td><td>OTLP service.name.</td></tr>
          <tr><td><code>tracing.sample_rate</code></td><td>float</td><td><code>1.0</code></td><td>0.0 to 1.0.</td></tr>
          <tr><td><code>tracing.insecure</code></td><td>bool</td><td><code>false</code></td><td>Disable TLS on the OTLP connection.</td></tr>
        </tbody>
      </table>

      <h2 id="nrf">nrf</h2>
      <table>
        <thead><tr><th>Field</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>urls</code></td><td>[]string</td><td>—</td><td>Ordered NRF URLs, primary first. Empty disables NRF.</td></tr>
          <tr><td><code>heartbeat_interval</code></td><td>duration</td><td><code>60s</code></td><td>How often to heartbeat the registered profile.</td></tr>
          <tr><td><code>discover_producers</code></td><td>bool</td><td><code>false</code></td><td>Discover downstream producers from the NRF.</td></tr>
          <tr><td><code>outbound_h2c</code></td><td>bool</td><td><code>false</code></td><td>Use HTTP/2 cleartext for outbound NRF / producer calls.</td></tr>
          <tr><td><code>callback_base_url</code></td><td>string</td><td>—</td><td>Externally-reachable base URL for NRF subscription notifications.</td></tr>
          <tr><td><code>register_max_attempts</code></td><td>int</td><td><code>5</code></td><td>Retries on initial register.</td></tr>
          <tr><td><code>register_backoff</code></td><td>duration</td><td><code>2s</code></td><td>Backoff between register attempts.</td></tr>
          <tr><td><code>profiles</code></td><td>list</td><td>—</td><td>NF profiles this proxy registers as.</td></tr>
          <tr><td><code>producers</code></td><td>list</td><td>—</td><td>Static producer endpoints.</td></tr>
        </tbody>
      </table>

      <h2 id="response-policy">response_policy</h2>
      <table>
        <thead><tr><th>Field</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>strip_headers</code></td><td>[]string</td><td>—</td><td>Headers to remove from every response.</td></tr>
          <tr><td><code>topology_hiding.enabled</code></td><td>bool</td><td><code>false</code></td><td>Rewrite producer-side hostnames in responses.</td></tr>
          <tr><td><code>topology_hiding.external_address</code></td><td>string</td><td>—</td><td>Hostname or URL to substitute.</td></tr>
        </tbody>
      </table>

      <h2 id="audit">audit</h2>
      <p>See <Link to="/guides/audit-and-compliance">Audit and compliance</Link>.</p>
      <table>
        <thead><tr><th>Field</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>export.webhook_url</code></td><td>string</td><td>—</td><td>HTTPS endpoint to POST batches to.</td></tr>
          <tr><td><code>export.webhook_timeout</code></td><td>duration</td><td><code>5s</code></td><td>Per-batch request timeout.</td></tr>
          <tr><td><code>export.webhook_token</code> / <code>_file</code></td><td>string</td><td>—</td><td>Bearer token.</td></tr>
          <tr><td><code>export.webhook_api_key</code> / <code>_file</code></td><td>string</td><td>—</td><td>API key for sinks that use one.</td></tr>
          <tr><td><code>export.syslog_addr</code></td><td>string</td><td>—</td><td>Syslog over TCP/TLS or UDP.</td></tr>
          <tr><td><code>export.file_path</code></td><td>string</td><td>—</td><td>Local JSONL sink.</td></tr>
          <tr><td><code>export.file_max_size_mb</code></td><td>int</td><td><code>100</code></td><td>Rotation size.</td></tr>
          <tr><td><code>export.file_max_files</code></td><td>int</td><td><code>5</code></td><td>How many rotated files to keep.</td></tr>
          <tr><td><code>export.filter_decision</code></td><td>string</td><td>—</td><td>Only export records with this decision (e.g. <code>denied</code>).</td></tr>
          <tr><td><code>export.batch_size</code></td><td>int</td><td><code>100</code></td><td>Records per batch.</td></tr>
          <tr><td><code>export.batch_timeout</code></td><td>duration</td><td><code>5s</code></td><td>Max wait before flushing a partial batch.</td></tr>
          <tr><td><code>export.max_retries</code></td><td>int</td><td><code>3</code></td><td>Per-batch retries before drop.</td></tr>
          <tr><td><code>signing_key_file</code></td><td>string</td><td>—</td><td>HMAC key path. Presence enables signing.</td></tr>
          <tr><td><code>retention.max_age</code></td><td>duration</td><td><code>0s</code></td><td>Delete records older than this. 0 disables.</td></tr>
          <tr><td><code>retention.max_records</code></td><td>int</td><td><code>0</code></td><td>Keep at most N records. 0 = unlimited.</td></tr>
          <tr><td><code>retention.cleanup_interval</code></td><td>duration</td><td><code>1h</code></td><td>How often the cleanup goroutine runs.</td></tr>
        </tbody>
      </table>

      <h2 id="defaults">defaults</h2>
      <table>
        <thead><tr><th>Field</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>producer.retry.max_attempts</code></td><td>int</td><td><code>3</code></td><td></td></tr>
          <tr><td><code>producer.retry.base_delay</code></td><td>duration</td><td><code>100ms</code></td><td></td></tr>
          <tr><td><code>producer.retry.max_delay</code></td><td>duration</td><td><code>2s</code></td><td></td></tr>
          <tr><td><code>producer.circuit_breaker.threshold</code></td><td>int</td><td><code>5</code></td><td>Consecutive failures before opening.</td></tr>
          <tr><td><code>producer.circuit_breaker.timeout</code></td><td>duration</td><td><code>30s</code></td><td>Open-state cool-down.</td></tr>
          <tr><td><code>producer.timeout</code></td><td>duration</td><td><code>30s</code></td><td>Per-request producer timeout.</td></tr>
          <tr><td><code>producer.redirect</code></td><td>bool</td><td><code>false</code></td><td>307 redirect to producer instead of proxying.</td></tr>
        </tbody>
      </table>

      <h2 id="request-signing">request_signing / request_verification</h2>
      <p>
        Optional message-level signing for outbound requests, and verification for inbound.
        When both sides of a proxy chain use signing, you can confirm that an in-flight message
        hasn't been tampered with by an intermediate.
      </p>
      <table>
        <thead><tr><th>Field</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>request_signing.enabled</code></td><td>bool</td><td><code>false</code></td><td></td></tr>
          <tr><td><code>request_signing.private_key_file</code></td><td>string</td><td>—</td><td>PEM-encoded private key.</td></tr>
          <tr><td><code>request_signing.key_id</code></td><td>string</td><td>—</td><td>Carried in the signature header for the verifier.</td></tr>
          <tr><td><code>request_signing.algorithm</code></td><td>string</td><td><code>rsa-pss-sha256</code></td><td><code>rsa-pss-sha256</code> or <code>ecdsa-p256-sha256</code>.</td></tr>
          <tr><td><code>request_verification.enabled</code></td><td>bool</td><td><code>false</code></td><td></td></tr>
          <tr><td><code>request_verification.public_key_file</code></td><td>string</td><td>—</td><td>PEM-encoded public key.</td></tr>
        </tbody>
      </table>

      <h2 id="examples">Examples</h2>
      <p>
        Minimal — the smallest valid file:
      </p>
      <CodeBlock lang="yaml" code={`version: "v1"
server:
  listen: ":8090"
observability:
  logging:
    level: info
    format: console`} />

      <p>
        Full — see <code>examples/fgp-full.yaml</code> in the repo for the canonical commented
        example.
      </p>
    </DocPage>
  );
}
