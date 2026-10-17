import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { backendOrigin } from './shared/backendOrigin.js'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  backendOrigin(env.VITE_SERVER_URL, command === 'build');
  return {
  plugins: [
    tailwindcss(),
    react()
  ],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@babylonjs')) {
            return 'babylon';
          }
        }
      }
    }
  }
  };
})
