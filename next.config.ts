import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// No nonces, so Next's inline scripts need 'unsafe-inline'. Dev also
// needs 'unsafe-eval' and plain http.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https:",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  // Content is read at runtime, so ship it with the server build.
  outputFileTracingIncludes: {
    "/*": ["posts/**/*", "projects/**/*"],
  },
  images: {
    unoptimized: true,
  },
  // Extra hosts the dev server is reached through (comma-separated).
  allowedDevOrigins: process.env.DEV_ORIGINS?.split(",").filter(Boolean) ?? [],
  devIndicators: false,
};

export default nextConfig;
