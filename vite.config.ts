import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(env.ANALYZE === 'true'
        ? [
            visualizer({
              filename: 'dist/stats.html',
              open: true,
              gzipSize: true,
              brotliSize: true,
            }),
          ]
        : []),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
        manifest: {
          name: 'Benim Olan — Alışverişin Yeni Adresi',
          short_name: 'Benim Olan',
          description: 'Global Artisan Marketplace — El işçiliği ve özel tasarım ürünler',
          theme_color: '#1A1033',
          background_color: '#F8F8FA',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          lang: 'tr',
          categories: ['shopping', 'ecommerce'],
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            {
              src: '/icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          navigateFallbackDenylist: [/\/api\//, /\/__\//, /\.well-known\//],
          runtimeCaching: [
            {
              urlPattern: /\.(?:png|jpg|jpeg|gif|webp|svg|ico)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'image-cache',
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'font-cache',
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 60 },
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Note: file watching may cause flickering during automated edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return undefined;

            // React ecosystem
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/react-is/') ||
              id.includes('node_modules/scheduler/')
            ) {
              return 'vendor-react';
            }

            // Firebase Firestore (large, dedicate its own chunk)
            if (
              id.includes('node_modules/@firebase/firestore/') ||
              id.includes('node_modules/firebase/firestore/') ||
              id.includes('node_modules/@grpc/') ||
              id.includes('node_modules/protobufjs/')
            ) {
              return 'vendor-firebase-firestore';
            }

            // Firebase core (app, auth, storage) + admin
            if (
              id.includes('node_modules/firebase/') ||
              id.includes('node_modules/firebase-admin/') ||
              id.includes('node_modules/@firebase/')
            ) {
              return 'vendor-firebase';
            }

            // Charts
            if (
              id.includes('node_modules/recharts/') ||
              id.includes('node_modules/d3-') ||
              id.includes('node_modules/internmap/') ||
              id.includes('node_modules/delaunator/') ||
              id.includes('node_modules/robust-predicates/')
            ) {
              return 'vendor-charts';
            }

            // Motion (Framer Motion v12)
            if (id.includes('node_modules/motion/') || id.includes('node_modules/framer-motion/')) {
              return 'vendor-motion';
            }

            // Stripe
            if (id.includes('node_modules/@stripe/')) {
              return 'vendor-stripe';
            }

            // DnD Kit
            if (id.includes('node_modules/@dnd-kit/')) {
              return 'vendor-dnd';
            }

            // Three.js (large 3D lib, dedicate its own chunk)
            if (id.includes('node_modules/three/')) {
              return 'vendor-three';
            }

            // UI libraries
            if (
              id.includes('node_modules/lucide-react/') ||
              id.includes('node_modules/@google/model-viewer/') ||
              id.includes('node_modules/react-helmet-async/')
            ) {
              return 'vendor-ui';
            }

            // Utilities
            if (
              id.includes('node_modules/axios/') ||
              id.includes('node_modules/papaparse/') ||
              id.includes('node_modules/clsx/') ||
              id.includes('node_modules/tailwind-merge/') ||
              id.includes('node_modules/zod/')
            ) {
              return 'vendor-utils';
            }

            // Remaining node_modules — let Vite default splitting handle them
            // (avoid catch-all bucket that causes circular chunk warnings)
            return undefined;
          },
        },
      },
    },
  };
});
