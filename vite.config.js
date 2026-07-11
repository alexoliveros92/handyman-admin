import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin';


export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: 'your-sentry-org',
      project: 'handyman-admin',
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  build: {
    sourcemap: true, // Required for Sentry to show readable stack traces
  },
});