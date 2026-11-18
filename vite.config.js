import { defineConfig } from 'vite';

// V3 preview only; main branch and production Pages site remain untouched.
export default defineConfig({
  root: 'v3',
  base: '/',
  server: { host: '0.0.0.0', port: 5173 },
  preview: { host: '0.0.0.0', port: 4173 },
  build: { outDir: '../dist-v3', emptyOutDir: true },
});
