import DocPage from '../../components/DocPage';
import CodeBlock from '../../components/CodeBlock';
import Callout from '../../components/Callout';
import { Link } from 'react-router-dom';

export default function SecuringAdminApi() {
  return (
    <DocPage
      slug="guides/securing-the-admin-api"
      lede="The admin API is the HTTP control surface for the proxy. Anything that touches policy, transformation rules, routing, or producers goes through it. This guide covers locking it down with TLS, username/password login, API keys, JWT bearer auth, and mTLS, plus the v1 default-action semantics you should understand before deploying."
    >
      <h2 id="threat-model">Threat model</h2>
      <p>The admin API can:</p>
      <ul>
        <li>Mutate any policy rule, rate-limit rule, transformation rule, or routing rule.</li>
        <li>Drain or restore producers.</li>
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
        This value seeds the policy store that gates proxied SBI traffic, so a fresh install with
        no policy rules denies every request on the SBI listener. Flip to <code>allow</code> only
        when you understand the implications — typically a lab or bring-up environment.
      </p>

      <h3 id="loopback">Admin listener defaults to loopback</h3>
      <p>
        The admin listener defaults to <code>127.0.0.1:9091</code> (the SBI/proxy listener is
        separate, on <code>:8090</code>). The proxy binds the admin API locally so a fresh install
        isn't reachable from outside the host. To expose it to operators or CI, change the listen
        address and turn on TLS + auth at the same time.
      </p>

      <h3 id="allow-insecure">allow_insecure</h3>
      <p>
        The admin listener requires TLS by default. Setting <code>admin.allow_insecure: true</code>{' '}
        opts into cleartext h2c — fine for local development on loopback, but exposes bearer
        tokens and API keys on the wire over any shared network. Production should configure{' '}
        <code>admin.tls</code> and remove this flag.
      </p>

      <Callout type="warning" title="The example configs ship allow_insecure: true">
        <code>examples/fgp-minimal.yaml</code> and <code>examples/fgp-full.yaml</code> set{' '}
        <code>allow_insecure: true</code> so a clean clone runs. Flip it and configure{' '}
        <code>admin.tls</code> before deploying anywhere outside loopback.
      </Callout>

      <h3 id="anonymous">allow_anonymous</h3>
      <p>
        The proxy refuses to start unless <code>admin.auth</code> is populated or{' '}
        <code>admin.allow_anonymous: true</code> is set. This catches the misconfiguration
        where someone forgets to configure auth on a publicly-exposed admin port.{' '}
        <code>examples/fgp-minimal.yaml</code> satisfies the gate by populating{' '}
        <code>admin.auth.users</code> (see <a href="#login">username/password login</a> below);{' '}
        <code>examples/fgp-full.yaml</code> ships no credentials and sets{' '}
        <code>allow_anonymous: true</code> so it runs out of the box — turn that off and populate{' '}
        <code>admin.auth</code> for any real deployment.
      </p>

      <h2 id="login">Username/password login</h2>
      <p>
        The default mechanism the shipped configs use: an operator roster under{' '}
        <code>admin.auth.users</code>, each entry pairing a username, a bcrypt{' '}
        <code>password_hash</code>, and an RBAC <code>role</code> (<code>admin</code>,{' '}
        <code>operator</code>, or <code>viewer</code>). Clients exchange those credentials at{' '}
        <code>POST /admin/login</code> for a short-lived bearer token.
      </p>
      <CodeBlock lang="yaml" code={`admin:
  auth:
    jwt_secret: "change-me-to-a-long-random-string"   # signs login tokens
    login_token_ttl: 24h                              # token lifetime (default 24h)
    users:
      - username: admin
        password_hash: "$2b$10$..."   # generate with: htpasswd -bnBC 10 "" yourpw | tr -d ':\\n'
        role: admin`} />

      <p>
        The dev default ships <code>admin</code> / <code>admin</code>. Replace the hash before
        deploying. Login issues an HMAC JWT signed with <code>jwt_secret</code> carrying the role
        claim, which the admin API then validates on each request.
      </p>
      <CodeBlock lang="bash" code={`curl -s https://fgp.svc:9091/admin/login \\
  -H 'Content-Type: application/json' \\
  -d '{"username":"admin","password":"admin"}'
# => {"token":"<jwt>","username":"admin","role":"admin","expires_at":"..."}`} />

      <Callout type="note" title="login_token_ttl requires jwt_secret">
        An empty <code>users</code> list disables <code>/admin/login</code>; the API-key and
        bearer-token paths are unaffected. Issuing login tokens requires{' '}
        <code>admin.auth.jwt_secret</code> to be set.
      </Callout>

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
fgpctl -url https://fgp.svc:9091 status`} />

      <h2 id="jwt">JWT bearer auth</h2>
      <p>
        For environments where the admin client is itself authenticated (CI, SSO, an operator
        portal), accept JWT bearer tokens minted by your issuer. The proxy validates either
        against an HMAC secret or an asymmetric public key.
      </p>
      <CodeBlock lang="yaml" code={`admin:
  auth:
    jwt_public_key: /etc/fgp/jwt.pem          # RSA or ECDSA public key
    # or
    jwt_secret_file: /run/secrets/jwt-hmac    # shared HMAC secret`} />

      <p>
        The proxy enforces the signature and expiry, then reads the <code>role</code> claim
        (<code>admin</code>, <code>operator</code>, or <code>viewer</code>) and rejects any
        unknown role. Map your SSO identities to that claim in the issuer that mints these tokens.
      </p>

      <h2 id="tls">TLS on the admin listener</h2>
      <p>Configure server-side TLS:</p>
      <CodeBlock lang="yaml" code={`admin:
  listen: 0.0.0.0:9091
  allow_insecure: false        # required for TLS to take effect
  tls:
    cert_file: /etc/fgp/certs/admin.crt
    key_file: /etc/fgp/certs/admin.key
    ca_file: /etc/fgp/certs/ca.crt
  # require_client_cert: false`} />

      <p>
        The proxy serves HTTPS on HTTP/2. <code>ca_file</code> is required only when{' '}
        <code>require_client_cert: true</code>.
      </p>

      <h2 id="mtls">mTLS</h2>
      <p>
        For the strongest gate, require client certificates. Combined with TLS, mTLS makes the
        admin listener reachable only from clients that hold a cert signed by your CA.
      </p>
      <CodeBlock lang="yaml" code={`admin:
  listen: 0.0.0.0:9091
  allow_insecure: false
  tls:
    cert_file: /etc/fgp/certs/admin.crt
    key_file: /etc/fgp/certs/admin.key
    ca_file: /etc/fgp/certs/ca.crt
  require_client_cert: true`} />

      <p>
        Pair mTLS with one of the auth modes above so the listener both verifies the client's
        certificate and resolves an RBAC role for each request.
      </p>

      <h2 id="checklist">Pre-prod checklist</h2>
      <ul>
        <li><code>admin.default_action</code> is <code>deny</code> unless you've consciously chosen otherwise.</li>
        <li><code>admin.allow_insecure</code> is <code>false</code>.</li>
        <li><code>admin.allow_anonymous</code> is <code>false</code>.</li>
        <li>One of <code>admin.auth.users</code>, <code>admin.auth.api_key_file</code>, or <code>admin.auth.jwt_*</code> is configured.</li>
        <li>The dev <code>admin</code> / <code>admin</code> password hash has been replaced.</li>
        <li><code>admin.tls</code> is configured.</li>
        <li>Admin listen address is reachable only by operators / CI — firewall, ACLs, or service-mesh policy.</li>
      </ul>

      <h2 id="related">Where to go next</h2>
      <ul>
        <li><Link to="/concepts/policy-engine">Policy engine</Link> — what <code>default_action</code> gates.</li>
        <li><Link to="/api/overview">Admin API overview</Link> — auth header, base URL, error shape.</li>
        <li><Link to="/guides/observability">Setting up observability</Link> — shipping decision logs and metrics to your pipeline.</li>
      </ul>
    </DocPage>
  );
}
