import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

import Index from './pages/Index';
import Glossary from './pages/Glossary';

import Introduction from './pages/introduction/Introduction';
import Why from './pages/introduction/Why';
import Quickstart from './pages/introduction/Quickstart';

import Architecture from './pages/concepts/Architecture';
import RequestPipeline from './pages/concepts/RequestPipeline';
import PolicyEngine from './pages/concepts/PolicyEngine';
import TransformationEngine from './pages/concepts/TransformationEngine';
import RoutingEngine from './pages/concepts/RoutingEngine';
import NrfAndProducers from './pages/concepts/NrfAndProducers';
import DiameterPeering from './pages/concepts/DiameterPeering';

import FirstSbiPolicy from './pages/tutorials/FirstSbiPolicy';
import FirstTransformationRule from './pages/tutorials/FirstTransformationRule';
import DiameterS6aRelay from './pages/tutorials/DiameterS6aRelay';

import Deploying from './pages/guides/Deploying';
import SecuringAdminApi from './pages/guides/SecuringAdminApi';
import PolicyVersioning from './pages/guides/PolicyVersioning';
import RateLimiting from './pages/guides/RateLimiting';
import AuditAndCompliance from './pages/guides/AuditAndCompliance';
import Observability from './pages/guides/Observability';
import UsingPostgres from './pages/guides/UsingPostgres';
import HotReload from './pages/guides/HotReload';

import FgpCli from './pages/reference/FgpCli';
import Fgpctl from './pages/reference/Fgpctl';
import ConfigSchema from './pages/reference/ConfigSchema';
import PolicySchema from './pages/reference/PolicySchema';
import TransformationSchema from './pages/reference/TransformationSchema';
import RoutingSchema from './pages/reference/RoutingSchema';
import Metrics from './pages/reference/Metrics';

import ApiOverview from './pages/api/Overview';
import ApiStatusAndConfig from './pages/api/StatusAndConfig';
import ApiPolicy from './pages/api/Policy';
import ApiRateLimits from './pages/api/RateLimits';
import ApiTransformations from './pages/api/Transformations';
import ApiRouting from './pages/api/Routing';
import ApiProducersAndProfiles from './pages/api/ProducersAndProfiles';
import ApiObservability from './pages/api/Observability';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Index />} />
        <Route path="/glossary" element={<Glossary />} />

        <Route path="/introduction" element={<Introduction />} />
        <Route path="/introduction/why" element={<Why />} />
        <Route path="/introduction/quickstart" element={<Quickstart />} />

        <Route path="/concepts/architecture" element={<Architecture />} />
        <Route path="/concepts/request-pipeline" element={<RequestPipeline />} />
        <Route path="/concepts/policy-engine" element={<PolicyEngine />} />
        <Route path="/concepts/transformation-engine" element={<TransformationEngine />} />
        <Route path="/concepts/routing-engine" element={<RoutingEngine />} />
        <Route path="/concepts/nrf-and-producers" element={<NrfAndProducers />} />
        <Route path="/concepts/diameter-peering" element={<DiameterPeering />} />

        <Route path="/tutorials/first-sbi-policy" element={<FirstSbiPolicy />} />
        <Route path="/tutorials/first-transformation-rule" element={<FirstTransformationRule />} />
        <Route path="/tutorials/diameter-s6a-relay" element={<DiameterS6aRelay />} />

        <Route path="/guides/deploying" element={<Deploying />} />
        <Route path="/guides/securing-the-admin-api" element={<SecuringAdminApi />} />
        <Route path="/guides/policy-versioning" element={<PolicyVersioning />} />
        <Route path="/guides/rate-limiting" element={<RateLimiting />} />
        <Route path="/guides/audit-and-compliance" element={<AuditAndCompliance />} />
        <Route path="/guides/observability" element={<Observability />} />
        <Route path="/guides/using-postgres" element={<UsingPostgres />} />
        <Route path="/guides/hot-reload-and-runtime-ops" element={<HotReload />} />

        <Route path="/reference/fgp-cli" element={<FgpCli />} />
        <Route path="/reference/fgpctl" element={<Fgpctl />} />
        <Route path="/reference/config-schema" element={<ConfigSchema />} />
        <Route path="/reference/policy-schema" element={<PolicySchema />} />
        <Route path="/reference/transformation-schema" element={<TransformationSchema />} />
        <Route path="/reference/routing-schema" element={<RoutingSchema />} />
        <Route path="/reference/metrics" element={<Metrics />} />

        <Route path="/api/overview" element={<ApiOverview />} />
        <Route path="/api/status-and-config" element={<ApiStatusAndConfig />} />
        <Route path="/api/policy" element={<ApiPolicy />} />
        <Route path="/api/rate-limits" element={<ApiRateLimits />} />
        <Route path="/api/transformations" element={<ApiTransformations />} />
        <Route path="/api/routing" element={<ApiRouting />} />
        <Route path="/api/producers-and-profiles" element={<ApiProducersAndProfiles />} />
        <Route path="/api/observability" element={<ApiObservability />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

function NotFound() {
  return (
    <main className="flex-1 px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-ink">Page not found</h1>
        <p className="mt-2 text-ink-muted">No page is registered at this path.</p>
      </div>
    </main>
  );
}
