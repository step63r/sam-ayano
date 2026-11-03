import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    // 既存の運用（build/ を S3 に手動配置）を変えないため、Vite 既定の dist ではなく build を使う
    outDir: 'build',
  },
});
