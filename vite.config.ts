// File: packages/frontend/vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';

export default defineConfig({
  server: {
    host: true,        // exposes to your local network
    port: 5173,        // optional
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Web3 Lottery',
        short_name: 'Lottery',
        description: 'A decentralized and transparent lottery DApp.',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],

  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'window', // Fix "global is not defined"
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true, // Fix "Buffer is not defined"
        }),
        NodeModulesPolyfillPlugin(),
      ],
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      buffer: 'buffer',
    },
  },

  define: {
    'process.env': {},
  },

  build: {
    sourcemap: true,
  },
});
