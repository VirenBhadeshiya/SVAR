import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';


export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 5173,
      host: true,
      allowedHosts: [
        'downiest-jaylene-nonsyntonically.ngrok-free.dev'
      ],
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true
        },
        '/uploads': {
          target: 'http://localhost:3000',
          changeOrigin: true
        }
      }
    },
    plugins: [
      react(),
      tailwindcss(),

    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'react': path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      }
    }
  };
});
