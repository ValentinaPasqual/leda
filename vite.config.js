// vite.config.js
import { defineConfig, loadEnv } from 'vite'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const BASE_PATH = env.VITE_BASE_PATH || '/';

  return {
    base: BASE_PATH,  
    
    define: {
      __APP_ID__: JSON.stringify(BASE_PATH.replace(/\//g, '') || 'root')
    },
    
    resolve: {
      alias: {
        '@imgs': resolve(__dirname, 'src/styles/imgs')
      }
    },
    
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          mappa: resolve(__dirname, 'pages/mappa.html'),
          indice: resolve(__dirname, 'pages/indice.html'),
          indici: resolve(__dirname, 'pages/indici.html'),
          percorsi: resolve(__dirname, 'pages/percorsi.html'),
          percorso: resolve(__dirname, 'pages/percorso.html'),
        },
        output: {
          entryFileNames: 'assets/js/[name].js',
          chunkFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: (info) => {
            if (info.name.endsWith('.css')) {
              return 'assets/css/[name][extname]';
            }
            return 'assets/[ext]/[name][extname]';
          }
        }
      }
    }
  }
})