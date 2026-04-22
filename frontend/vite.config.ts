import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  // Load env from the current directory
  const env = loadEnv(mode, process.cwd(), '');

  return {
    root: __dirname,
    base: '/',
    
    plugins: [react(), tailwindcss()],
    
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    server: {
      port: 5173,
      strictPort: true,
      // THE PROXY: This bridges the gap between Port 5173 and Port 3000
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          // This ensures /api/auth/login goes exactly where Python expects it
        },
      },
      fs: {
        allow: ['..']
      },
      hmr: {
        overlay: true,
      },
      watch: {
        usePolling: true,
      }
    },

    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: true, 
    }
  };
});