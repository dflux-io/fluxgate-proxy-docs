import DocPage from '../components/DocPage';

export default function Glossary() {
  return (
    <DocPage
      slug="glossary"
      lede="3GPP, Diameter, and fluxgate-proxy terminology used throughout this documentation. Glance at this page when something reads opaque; refer back when authoring rules."
    >
      <h2 id="terms">Terms</h2>

      <dl>
        <dt><strong>AMF</strong> — Access and Mobility Management Function</dt>
        <dd>5G NF responsible for connection and mobility management. Anchors NAS signaling.</dd>

        <dt><strong>AUSF</strong> — Authentication Server Function</dt>
        <dd>5G NF that authenticates the UE; sits between the AMF and UDM.</dd>

        <dt><strong>AVP</strong> — Attribute-Value Pair</dt>
        <dd>The atomic unit of a Diameter message. Identified by code + vendor id, carries a typed value (string, integer, grouped, etc.).</dd>

        <dt><strong>CER / CEA</strong> — Capabilities-Exchange-Request / Answer</dt>
        <dd>Diameter handshake messages exchanged when a peer connection opens.</dd>

        <dt><strong>DPR / DPA</strong> — Disconnect-Peer-Request / Answer</dt>
        <dd>Diameter messages exchanged for graceful peer disconnect.</dd>

        <dt><strong>DWR / DWA</strong> — Device-Watchdog-Request / Answer</dt>
        <dd>Diameter heartbeat. Missing too many DWAs drops the peer.</dd>

        <dt><strong>DNN</strong> — Data Network Name</dt>
        <dd>5G identifier for the data network a session connects to (the LTE APN, conceptually).</dd>

        <dt><strong>FGP</strong> — fluxgate-proxy</dt>
        <dd>Abbreviation for this product, fluxgate-proxy. Used in diagram labels and log fields; prose calls it the proxy.</dd>

        <dt><strong>GPSI</strong> — Generic Public Subscription Identifier</dt>
        <dd>The publicly-visible identifier for a 5G subscriber. Typically an MSISDN (<code>msisdn-…</code>).</dd>

        <dt><strong>Gx</strong></dt>
        <dd>Diameter application between PCEF (in the PGW) and PCRF. Carries policy and charging rules. App id 16777238, vendor id 10415.</dd>

        <dt><strong>HSS</strong> — Home Subscriber Server</dt>
        <dd>4G EPC element holding subscriber data; speaks Diameter on S6a.</dd>

        <dt><strong>HTTP/2</strong></dt>
        <dd>Required transport for 5G SBI (3GPP TS 29.500). The proxy serves h2c (cleartext) or HTTPS+h2.</dd>

        <dt><strong>h2c</strong></dt>
        <dd>HTTP/2 cleartext. Used inside trusted boundaries when TLS is provided at a different layer.</dd>

        <dt><strong>MCC / MNC</strong></dt>
        <dd>Mobile Country Code / Mobile Network Code. Together form the PLMN identifier.</dd>

        <dt><strong>MME</strong> — Mobility Management Entity</dt>
        <dd>4G EPC element responsible for connection and mobility. Speaks Diameter on S6a toward the HSS.</dd>

        <dt><strong>mTLS</strong></dt>
        <dd>Mutual TLS — both client and server present certificates. The proxy supports mTLS on the SBI and admin listeners.</dd>

        <dt><strong>NEF</strong> — Network Exposure Function</dt>
        <dd>5G NF that exposes 3GPP capabilities to external applications via REST.</dd>

        <dt><strong>NF</strong> — Network Function</dt>
        <dd>3GPP shorthand for any of the 5G core elements (AMF, SMF, UDM, …).</dd>

        <dt><strong>NRF</strong> — Network Repository Function</dt>
        <dd>5G service registry. NFs register their profiles with the NRF; consumers discover producers through it.</dd>

        <dt><strong>NSSF</strong> — Network Slice Selection Function</dt>
        <dd>5G NF that selects the slice (S-NSSAI) for a UE.</dd>

        <dt><strong>NSSAI / S-NSSAI</strong></dt>
        <dd>Network Slice Selection Assistance Information. The single-slice form (S-NSSAI) is a <code>(sst, sd)</code> tuple identifying one network slice.</dd>

        <dt><strong>OAuth2 / JWT</strong></dt>
        <dd>The 5G SBI access-token model (3GPP TS 33.501). The proxy enforces token signature, expiry, and scope on inbound requests.</dd>

        <dt><strong>PCEF</strong> — Policy and Charging Enforcement Function</dt>
        <dd>The point where PCC rules are enforced; typically sits in the PGW/SMF.</dd>

        <dt><strong>PCF</strong> — Policy Control Function</dt>
        <dd>5G NF that issues policy rules to consumers.</dd>

        <dt><strong>PCRF</strong> — Policy and Charging Rules Function</dt>
        <dd>4G analog of PCF. Speaks Diameter on Gx and Rx.</dd>

        <dt><strong>PGW</strong> — Packet Data Network Gateway</dt>
        <dd>4G EPC gateway between the operator's IP network and the public internet.</dd>

        <dt><strong>PLMN</strong> — Public Land Mobile Network</dt>
        <dd>Identifier for an operator's network — <code>(MCC, MNC)</code> pair. Policy and routing rules can match on <code>visited_plmns</code>.</dd>

        <dt><strong>Rx</strong></dt>
        <dd>Diameter application between AF and PCRF (IMS use case). App id 16777236, vendor id 10415.</dd>

        <dt><strong>S6a / S6d</strong></dt>
        <dd>Diameter application between MME / SGSN and HSS. Carries authentication and location-update procedures. App id 16777251, vendor id 10415.</dd>

        <dt><strong>SBI</strong> — Service-Based Interface</dt>
        <dd>3GPP's term for the HTTP/2 + REST service interfaces between 5G core NFs.</dd>

        <dt><strong>SCTP</strong> — Stream Control Transmission Protocol</dt>
        <dd>Transport layer protocol (RFC 4960). The typical 3GPP transport for Diameter; the proxy supports both SCTP and TCP.</dd>

        <dt><strong>SMF</strong> — Session Management Function</dt>
        <dd>5G NF responsible for session establishment and management.</dd>

        <dt><strong>SUPI</strong> — Subscription Permanent Identifier</dt>
        <dd>5G subscriber identifier; typically encodes an IMSI (<code>imsi-…</code>) or NAI (<code>nai-…</code>).</dd>

        <dt><strong>SUCI</strong> — Subscription Concealed Identifier</dt>
        <dd>Privacy-preserving encrypted form of SUPI exchanged over the radio.</dd>

        <dt><strong>UDM</strong> — Unified Data Management</dt>
        <dd>5G NF holding subscription data. Equivalent in role to the 4G HSS.</dd>

        <dt><strong>UDR</strong> — Unified Data Repository</dt>
        <dd>5G data backing store behind UDM, PCF, NEF, etc.</dd>

        <dt><strong>UE</strong> — User Equipment</dt>
        <dd>The end-user device — phone, modem, IoT module.</dd>
      </dl>

      <h2 id="fgp-terms">fluxgate-proxy terms</h2>

      <dl>
        <dt><strong>Filter chain</strong></dt>
        <dd>The request filter chain, built in a fixed order: Auth (only when <code>oauth2_required</code>) &rarr; Policy (always) &rarr; one Rate-limit filter per <code>rate_limits[]</code> entry &rarr; Transformation (request phase). Swapped atomically on hot reload.</dd>

        <dt><strong>Phase</strong></dt>
        <dd>Either <code>request</code> or <code>response</code>. Transformation rules and the response stage are phase-aware.</dd>

        <dt><strong>Control-plane store</strong></dt>
        <dd>The database that holds rules, transforms, routes, tenants, profiles. SQLite or Postgres.</dd>

        <dt><strong>Producer pool</strong></dt>
        <dd>The in-memory list of reachable producers per NF type, populated from NRF discovery and/or static config.</dd>

        <dt><strong>Shadow profile</strong></dt>
        <dd>An NRF NF profile that the proxy registers on its own behalf so consumers discover the proxy instead of the real producer.</dd>

        <dt><strong>Connection mode</strong></dt>
        <dd>Per-peer Diameter setting: <code>initiator</code> / <code>responder</code> / <code>both</code>. Replaces the legacy <code>diameter.mode</code> field.</dd>

        <dt><strong>Sticky session</strong></dt>
        <dd>Routing-target option that consistent-hashes a configurable key (<code>sticky_key</code>: one of <code>supi</code>, <code>gpsi</code>, <code>imsi</code>, <code>session_id</code>, <code>origin_host</code>, or <code>request_id</code>) to pin a subscriber to the same producer for the duration of <code>sticky_ttl</code>.</dd>

        <dt><strong>Dry-run</strong></dt>
        <dd>A read-only validation endpoint that checks a candidate config or Diameter dictionary without committing it.</dd>
      </dl>
    </DocPage>
  );
}
