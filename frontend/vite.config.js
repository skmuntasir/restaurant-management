import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Split vendor code into long-lived chunks: the browser caches them
    // across deployments and downloads them in parallel.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//.test(id)) return 'react';
          if (/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(id)) return 'motion';
          if (/node_modules\/(@reduxjs|redux|react-redux|immer|reselect|redux-thunk|@tanstack|axios)\//.test(id)) return 'data';
        },
      },
    },
  },
})
