import DocPage from '../../components/DocPage';
import CliReference from '../../components/CliReference';
import { Link } from 'react-router-dom';

export default function FgpCli() {
  return (
    <DocPage
      slug="reference/fgp-cli"
      lede="fgp is the proxy server binary. It runs from a config file; the flags below overlay that config for one-off invocations. This reference is generated from fgp --help, so it always matches the binary."
    >
      <p>
        Most deployments run <code>{`fgp -config /etc/fgp/fgp.yaml`}</code> and set everything in the{' '}
        <Link to="/reference/config-schema">config file</Link>. The flags are for overrides and
        debugging. The admin CLI is <Link to="/reference/fgpctl">fgpctl</Link>.
      </p>
      <CliReference cliKey="fgp" />
    </DocPage>
  );
}
