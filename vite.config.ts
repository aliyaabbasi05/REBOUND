import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(() => {
  // The default targets this sandbox's public hostname on the app's default
  // port. Set VITE_ALLOWED_HOST when using another preview hostname.
  const additionalAllowedHost = process.env.VITE_ALLOWED_HOST?.trim()
    || '3000-il5p7cyslaq8szg9mu3kg-baa14ec9.us1.manus.computer';
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': projectRoot,
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      ...(additionalAllowedHost ? { allowedHosts: [additionalAllowedHost] } : {}),
    },
  };
});
