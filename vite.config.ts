import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '')

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: '工体·燃冬冰雪嘉年华',
          short_name: '燃冬嘉年华',
          description: '工体·三里屯商圈打卡赢好礼，碰一碰NFC解锁商家优惠券与惊喜团购福利。',
          theme_color: '#2563eb',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            {
              src: 'https://picsum.photos/seed/snow_icon/192/192',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'https://picsum.photos/seed/snow_icon/512/512',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        },
        workbox: {
          // Runtime caching for external images (Picsum) and fonts if any
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/picsum\.photos\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'demo-images',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 Days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ],
    build: {
      outDir: 'dist',
      sourcemap: true
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  }
})