import withPWA from 'next-pwa'

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
  },
}

export default withPWA({
  dest: 'public',
  register: false, // 手動登録を使用するため false に設定
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  customWorkerSrc: 'worker',
  runtimeCaching: [
    {
      urlPattern: ({ url }) => url.pathname.startsWith('/admin'),
      handler: 'NetworkOnly',
    },
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60, // 24時間
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'imageCache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30日
        },
      },
    },
    {
      urlPattern: /\.(?:js|css|woff|woff2|ttf|eot)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'staticCache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7日
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'googleFontsCache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1年
        },
      },
    },
  ],
  buildExcludes: [/middleware-manifest\.json$/],
  publicExcludes: ['!noprecache/**/*'],
})(nextConfig)
