import type { NextConfig } from "next"

const securityHeaders = [
  {
    // SAMEORIGIN (not DENY): the in-app PDF <iframe> loads /api/files/*
  // from the same origin. External framing is still blocked.
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    // No `preload`: self-hosters on LAN IPs / shared domains must not get
    // baked into the HSTS preload list. Enable preload only with your own
    // HTTPS domain + reverse proxy in front.
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https://lh3.googleusercontent.com https://avatars.githubusercontent.com data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      // Same-origin framing for the evidence PDF preview iframe.
      "frame-ancestors 'self'",
      "base-uri 'self'",
      // OAuth sign-in posts to the providers after the same-origin Auth.js step.
      "form-action 'self' https://accounts.google.com https://github.com",
    ].join("; "),
  },
]

const nextConfig: NextConfig = {
  // Stop Next from inferring C:\Users\ASUS as the workspace root (a stray
  // package-lock.json up there was picked over this repo's pnpm-lock.yaml).
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: securityHeaders,
    },
  ],
}

export default nextConfig
