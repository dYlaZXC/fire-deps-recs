/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Исправленные настройки для Next.js 15
  serverExternalPackages: ['maplibre-gl'],
  experimental: {
    optimizeCss: true,
    turbo: {
      loaders: {
        // Ускорение загрузки JSON
        '.json': 'json-loader',
      },
    },
  },
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Оптимизации для Windows
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      }
      
      // Включаем кэширование для ускорения
      config.cache = {
        type: 'filesystem',
      }
      
      // Оптимизация модулей
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      }
      
      // Исключаем большие файлы из hot reload
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules/**',
          '**/public/data/**',
          '**/.git/**',
          '**/backup*',
        ],
      }
    }
    return config
  },
  // Кеширование
  onDemandEntries: {
    maxInactiveAge: 60 * 1000, // 1 минута
    pagesBufferLength: 2,
  },
}

export default nextConfig
