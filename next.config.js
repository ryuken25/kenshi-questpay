/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  async redirects() {
    return [
      { source: "/studio", destination: "/dashboard", permanent: false },
      { source: "/studio/orders", destination: "/dashboard/orders", permanent: false },
      { source: "/studio/settings", destination: "/dashboard/settings", permanent: false },
      { source: "/demo", destination: "/services", permanent: false },
      { source: "/demo/base-sepolia", destination: "/services", permanent: false },
    ];
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://analytics.vgdh.io",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://analytics.vgdh.io https://*.walletconnect.com https://*.walletconnect.org https://polygon-rpc.com https://polygon-bor-rpc.publicnode.com https://api.coingecko.com https://*.supabase.co",
      "frame-src 'self' https://verify.walletconnect.org https://verify.walletconnect.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ');
    return [{ source: '/(.*)', headers: [
      { key: 'Content-Security-Policy', value: csp },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
    ] }];
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
};
module.exports = nextConfig;
