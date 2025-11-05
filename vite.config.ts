import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return defineConfig({
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'june.png'],
        manifest: {
          name: 'The June-bug Diaries',
          short_name: "June's Diary",
          description: 'A simple app to track your puppy\'s daily activities.',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'june.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'june.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'june.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
      }),
    ],
    define: {
      'process.env': env,
    },
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), 'src'),
      },
    },
  });
};
