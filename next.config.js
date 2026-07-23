/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // Two lockfiles (npm + pnpm) live in this folder; pin the tracing root so Next
  // doesn't walk up and mis-detect a workspace root when computing function bundles.
  outputFileTracingRoot: __dirname,
  // The Hardhat/contracts toolchain is dev-only and never imported by app code —
  // keep it out of every serverless function bundle as insurance (smaller cold starts).
  outputFileTracingExcludes: {
    '*': [
      'node_modules/hardhat/**',
      'node_modules/@nomicfoundation/**',
      'node_modules/@typechain/**',
      'node_modules/typechain/**',
      'node_modules/solc/**',
      'contracts/**',
      'artifacts/**',
      'cache/**',
      'typechain-types/**',
      'scripts/**',
    ],
  },
  experimental: {
    // lucide-react is a huge icon barrel imported across dozens of files; rewrite
    // to per-icon deep imports so only used glyphs land in the bundle.
    optimizePackageImports: ['lucide-react'],
  },
  async redirects() {
    return [
      // Legacy dashboard paths → canonical Creator Studio (vNext)
      { source: "/dashboard", destination: "/studio", permanent: false },
      { source: "/dashboard/orders", destination: "/studio/orders", permanent: false },
      { source: "/dashboard/orders/:id", destination: "/studio/orders/:id", permanent: false },
      { source: "/dashboard/settings", destination: "/studio/settings", permanent: false },
      { source: "/studio/login", destination: "/sign-in?next=/studio", permanent: false },
      // Admin aliases from older shells
      { source: "/admin/accounts", destination: "/admin/users", permanent: false },
      { source: "/demo", destination: "/services", permanent: false },
      { source: "/demo/base-sepolia", destination: "/services", permanent: false },
    ];
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://analytics.vgdh.io",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com https://analytics.vgdh.io https://cca-lite.coinbase.com https://*.walletconnect.com https://*.walletconnect.org https://polygon-rpc.com https://polygon-bor-rpc.publicnode.com https://api.coingecko.com https://*.supabase.co https://accounts.google.com",
      "frame-src 'self' https://verify.walletconnect.org https://verify.walletconnect.com https://accounts.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ');
    // Security headers apply to every route. Cache-Control is scoped to public,
    // non-personal, statically-rendered pages ONLY. The app shell reads the session
    // client-side (fetch /api/auth/session), so this HTML carries no per-user data
    // and is safe to serve from the edge. Personal/dynamic routes (/orders,
    // /receipts, /account, /studio/*, /admin/*, /checkout/*, /pay/*, /my-orders,
    // /faq [force-dynamic]) are intentionally omitted and keep Next's no-store default.
    const cacheLong = 'public, s-maxage=3600, stale-while-revalidate=86400';
    const cacheShort = 'public, s-maxage=300, stale-while-revalidate=3600';
    const cacheHeader = (value) => [{ key: 'Cache-Control', value }];
    return [
      { source: '/(.*)', headers: [
        { key: 'Content-Security-Policy', value: csp },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
      ] },
      // Evergreen marketing / legal pages — long edge cache, background revalidate.
      { source: '/privacy', headers: cacheHeader(cacheLong) },
      { source: '/terms', headers: cacheHeader(cacheLong) },
      { source: '/how-it-works', headers: cacheHeader(cacheLong) },
      { source: '/for-creators', headers: cacheHeader(cacheLong) },
      { source: '/contact', headers: cacheHeader(cacheLong) },
      // Catalog surfaces — static shell (data hydrates client-side); short cache so
      // service copy/price edits propagate quickly.
      { source: '/', headers: cacheHeader(cacheShort) },
      { source: '/services', headers: cacheHeader(cacheShort) },
      { source: '/services/:slug*', headers: cacheHeader(cacheShort) },
    ];
  },
  webpack: (config, { webpack }) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    // @wagmi/connectors re-exports a `baseAccount` connector (via its barrel) that
    // pulls @base-org/account → @coinbase/cdp-sdk, which statically imports optional
    // @x402/* payment modules that are not installed. We only use injected /
    // coinbaseWallet / walletConnect, so this code path is dead — ignore the missing
    // @x402 specifiers so the bundle builds instead of failing module resolution.
    config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^@x402\// }));
    return config;
  },
};
module.exports = nextConfig;
