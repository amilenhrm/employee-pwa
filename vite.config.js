import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// ⚙️ Vite configuration
export default defineConfig({
  base: "/employee-pwa/",
  plugins: [
    react(),

    // 🔋 Progressive Web App configuration
    VitePWA({
      registerType: 'autoUpdate', // auto-refresh kapag may bagong build
      includeAssets: [
        'favicon.svg',
        'robots.txt',
        'offline.html',
        'icons/*.png'
      ],

      // 📱 Manifest (metadata para sa installable app)
      manifest: {
        name: 'Employee PWA System',
        short_name: 'EmployeePWA',
        description: 'Employee & Payroll Management App',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/maskable-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },

      // 🧱 Workbox configuration (caching + offline)
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,

        // 🔄 Offline fallback page kapag walang internet
        navigateFallback: '/offline.html',

        // 💾 Allow caching for JS files up to 5MB
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,

        // 🧩 Runtime caching rules
        runtimeCaching: [
          {
            // 🔥 Cache Firebase / Firestore API calls
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60 // 5 minutes
              }
            }
          },
          {
            // 🖼️ Cache images locally for faster load
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              }
            }
          }
        ]
      }
    })
  ]
})
