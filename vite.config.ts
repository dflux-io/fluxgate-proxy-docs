import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Bind dev + preview servers to all interfaces so the site is
    // reachable from other machines on the LAN. Override per-run with
    // `--host <specific-ip>` if you need to bind to one NIC.
    host: true,
  },
  preview: {
    host: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
