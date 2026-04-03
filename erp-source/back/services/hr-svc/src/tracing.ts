/**
 * OpenTelemetry bootstrap for hr-svc.
 * Must be required FIRST — before any other imports — via --require flag.
 */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

const sdk = new NodeSDK({
    serviceName: process.env.OTEL_SERVICE_NAME ?? 'hr-svc',
    traceExporter: otlpEndpoint
        ? new OTLPTraceExporter({ url: `${otlpEndpoint}/v1/traces` })
        : undefined,
    instrumentations: [
        getNodeAutoInstrumentations({
            '@opentelemetry/instrumentation-fs': { enabled: false },
        }),
    ],
});

sdk.start();

process.on('SIGTERM', () => {
    sdk.shutdown().finally(() => process.exit(0));
});
