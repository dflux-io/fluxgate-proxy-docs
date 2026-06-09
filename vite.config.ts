import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Bind dev + preview servers to all interfaces so the site is
    // reachable from other machines on the LAN. Override per-run with
    // `--host <specific-ip>` if you need to bind to one NIC.
    host: true,
    // Dedicated port so this docs site never collides with the default
    // 5173 (or the sibling fluxproto-light-docs on 5180). strictPort fails
    // loudly instead of silently hopping. Override with `--port`.
    port: 5182,
    strictPort: true,
  },
  preview: {
    host: true,
    port: 5183,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
