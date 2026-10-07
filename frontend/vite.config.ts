import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true,
    port: 5173,
    //https: {
    //key: fs.readFileSync(path.resolve(__dirname, '../key.pem')),
    //cert: fs.readFileSync(path.resolve(__dirname, '../cert.pem')),
    //},
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err: any) => {
            // Suppress benign ECONNRESET errors emitted when the browser tab reloads or closes
            if (err?.code === 'ECONNRESET') return;
            console.warn('[vite ws proxy error]:', err?.message || err);
          });
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss()
  ],
})
