/**
 * OpenTelemetry bootstrap — must be the FIRST require in process startup.
 * Referenced via the `--require` flag in package.json start scripts.
 *
 * Example package.json script:
 *   "start": "node --require ./dist/tracing.js dist/main.js"
 *   "start:dev": "ts-node --require ./src/tracing.ts -r tsconfig-paths/register src/main.ts"
 */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

const sdk = new NodeSDK({
    serviceName: process.env.OTEL_SERVICE_NAME ?? 'core-svc',
    traceExporter: otlpEndpoint
        ? new OTLPTraceExporter({ url: `${otlpEndpoint}/v1/traces` })
        : undefined,
    instrumentations: [
        getNodeAutoInstrumentations({
            // Disable noisy fs instrumentation
            '@opentelemetry/instrumentation-fs': { enabled: false },
        }),
    ],
});

sdk.start();

process.on('SIGTERM', () => {
    sdk.shutdown().finally(() => process.exit(0));
});
