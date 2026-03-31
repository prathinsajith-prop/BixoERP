import { createServiceConfig } from "@erp/config";

function getHrBackendUrl(): string {
  if (process.env.DOCKER_ENV === "true") return "http://hr-svc:3003";
  return `http://localhost:${process.env.HR_BACKEND_PORT || "3003"}`;
}

const nextConfig = createServiceConfig("hr", {
  async rewrites() {
    const dest = getHrBackendUrl();
    return {
      beforeFiles: [
        { source: "/api/v1/hr/:path*", destination: `${dest}/api/v1/hr/:path*`, basePath: false },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
});

export default nextConfig;
