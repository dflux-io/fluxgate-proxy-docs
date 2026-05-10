import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function SecuringAdminApi() {
  return (
    <DocPage
      slug="guides/securing-the-admin-api"
      lede="The admin API is the control plane for the proxy. Anything that touches policy, transforms, routing, peers, or audit goes through it. This guide covers locking it down with TLS, API keys, JWT bearer auth, and mTLS, plus the v1 default-action semantics you should understand before deploying."
    >
      <h2 id="threat-model">Threat model</h2>
      <p>The admin API can:</p>
      <ul>
        <li>Mutate any policy rule, rate limit, transformation, or route.</li>
        <li>Drain or restore producers.</li>
        <li>Read the full audit trail.</li>
        <li>Change the log level (including <code>trace</code>, which leaks request bodies).</li>
      </ul>
      <p>
        An attacker with admin API access can bypass every gate the proxy enforces. Treat the
        admin port the same way you'd treat a root shell on the host.
      </p>

      <h2 id="defaults">Defaults to understand</h2>

      <h3 id="default-action">default_action: deny</h3>
      <p>
        The v1 default for <code>admin.default_action</code> is <code>deny</code> (fail-closed).
        A fresh install with no rules denies every request to the SBI listener. Flip to{' '}
        <code>allow</code> only when you understand the implications — typically a lab or
        bring-up environment.
      </p>

      <h3 id="loopback">Admin listener defaults to loopback</h3>
      <p>
        The admin listener defaults to <code>127.0.0.1:8091</code>. The proxy binds it locally
        so a fresh install isn't reachable from outside the host. To expose the admin API to
        operators or CI, change the listen address and turn on TLS + auth at the same time.
      </p>

      <h3 id="allow-insecure">allow_insecure</h3>
      <p>
        The admin listener requires TLS by default. Setting <code>admin.allow_insecure: true</code>{' '}
        opts into cleartext h2c — fine for local development on loopback, but exposes bearer
        tokens and API keys on the wire over any shared network. Production should configure{' '}
        <code>admin.tls</code> and remove this flag.
      </p>

      <Callout type="warning" title="The example configs ship allow_insecure: true">
        <code>examples/fgp-minimal.yaml</code> and <code>examples/fgp-full.yaml</code> set
        <code>allow_insecure: true</code> so a clean clone runs. Flip it and configure{' '}
        <code>admin.tls</code> before deploying anywhere outside loopback.
      </Callout>

      <h3 id="anonymous">allow_anonymous</h3>
      <p>
        FGP refuses to start if neither <code>admin.auth</code> is populated nor{' '}
        <code>admin.allow_anonymous: true</code> is set. This catches the misconfiguration
        where someone forgets to configure auth on a publicly-exposed admin port. The example
        configs use <code>allow_anonymous: true</code> so they run out of the box — turn it
        off and populate <code>admin.auth</code> for any real deployment.
      </p>

      <h2 id="api-keys">API keys</h2>
      <p>The simplest gate: a static key in the <code>X-Admin-Key</code> header.</p>
      <CodeBlock lang="yaml" code={`admin:
  auth:
    api_key_file: /run/secrets/fgp-admin-api-key`} />

      <p>
        Use the <code>_file:</code> variant in production so the key doesn't appear in your
        config repo. Set strong random keys (32+ bytes), rotate periodically, and gate file
        access on a small operator group.
      </p>
      <p>
        <code>fgpctl</code> picks the key up from the <code>FGP_ADMIN_KEY</code> environment
        variable or the <code>-key</code> flag.
      </p>
      <CodeBlock lang="bash" code={`export FGP_ADMIN_KEY=$(cat /run/secrets/fgp-admin-api-key)
fgpctl -url https://fgp.svc:8091 status`} />

      <h2 id="jwt">JWT bearer auth</h2>
      <p>
        For environments where the admin client is itself authenticated (CI, SSO, an operator
        portal), accept JWT bearer tokens. FGP validates either against an HMAC secret or an
        asymmetric public key.
      </p>
      <CodeBlock lang="yaml" code={`admin:
  auth:
    jwt_public_key: /etc/fgp/jwt-rs256.pem    # RSA public key
    # or
    jwt_secret_file: /run/secrets/jwt-hmac    # shared HMAC secret`} />

      <p>
        FGP enforces signature, expiry, and a <code>fgp:admin</code> scope claim. Map your SSO
        identities to the scope claim in the issuer that mints these tokens.
      </p>

      <h2 id="tls">TLS on the admin listener</h2>
      <p>Configure server-side TLS:</p>
      <CodeBlock lang="yaml" code={`admin:
  listen: 0.0.0.0:8091
  allow_insecure: false        # required for TLS to take effect
  tls:
    cert_file: /etc/fgp/certs/admin.crt
    key_file: /etc/fgp/certs/admin.key
    ca_file: /etc/fgp/certs/ca.crt
  # require_client_cert: false`} />

      <p>
        FGP serves HTTPS on HTTP/2. <code>ca_file</code> is required only when{' '}
        <code>require_client_cert: true</code>.
      </p>

      <h2 id="mtls">mTLS</h2>
      <p>
        For the strongest gate, require client certificates. Combined with TLS, mTLS makes the
        admin listener reachable only from clients that hold a cert signed by your CA.
      </p>
      <CodeBlock lang="yaml" code={`admin:
  listen: 0.0.0.0:8091
  allow_insecure: false
  tls:
    cert_file: /etc/fgp/certs/admin.crt
    key_file: /etc/fgp/certs/admin.key
    ca_file: /etc/fgp/certs/ca.crt
  require_client_cert: true`} />

      <p>
        The certificate's CN or SAN is recorded on every admin mutation, so the admin audit
        log identifies the operator who made the change.
      </p>

      <h2 id="admin-audit">The admin audit log</h2>
      <p>
        Every mutation to the admin API records to a dedicated admin audit log. Inspect recent
        entries:
      </p>
      <CodeBlock lang="bash" code={`fgpctl audit --limit 200
# or
curl -sH "X-Admin-Key: $FGP_ADMIN_KEY" \\
  https://fgp.svc:8091/admin/audit/admin-actions?limit=200`} />

      <p>
        Records carry the actor identity (from API key, JWT, or mTLS), the endpoint, the path
        parameters, request id, and result. Export to your SIEM for operator forensics.
      </p>

      <h2 id="checklist">Pre-prod checklist</h2>
      <ul>
        <li><code>admin.default_action</code> is <code>deny</code> unless you've consciously chosen otherwise.</li>
        <li><code>admin.allow_insecure</code> is <code>false</code>.</li>
        <li><code>admin.allow_anonymous</code> is <code>false</code>.</li>
        <li>Either <code>admin.auth.api_key_file</code> or <code>admin.auth.jwt_*</code> is configured.</li>
        <li><code>admin.tls</code> is configured.</li>
        <li>Admin listen address is reachable only by operators / CI — firewall, ACLs, or service-mesh policy.</li>
        <li>Admin audit log is forwarded to your SIEM.</li>
      </ul>

      <h2 id="related">Related</h2>
      <ul>
        <li><Link to="/concepts/policy-engine">Policy engine</Link> — what <code>default_action</code> gates.</li>
        <li><Link to="/api/overview">Admin API overview</Link> — auth header, base URL, error shape.</li>
        <li><Link to="/guides/audit-and-compliance">Audit and compliance</Link> — including the admin audit log.</li>
      </ul>
    </DocPage>
  );
}
