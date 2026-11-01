import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { pwaBuild } from './scripts/pwa-build'
import marketHandler from './api/market'
import perpetualHandler from './api/perpetuals'
import watchHandler from './api/watch'

export default defineConfig({
  plugins: [react(), pwaBuild(), {
    name: 'market-api-development',
    configureServer(server) {
      server.middlewares.use((req,res,next)=>{
        if(new URL(req.url,'http://localhost').pathname==='/api/market')return marketHandler(req,res);
        if(new URL(req.url,'http://localhost').pathname==='/api/perpetuals')return perpetualHandler(req,res);
        if(new URL(req.url,'http://localhost').pathname==='/api/watch')return watchHandler(req,res);
        next();
      });
    },
  }],
  server: {
    port: 3001,
    allowedHosts: [
      'unteeming-uncommiserated-bradly.ngrok-free.dev',
      '.ngrok-free.dev',
      '.ngrok.app'
    ]
  },
  optimizeDeps: {
    force: true
  },
  build: {
    // Optimisation pour PWA
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  publicDir: 'public' // Assure que les fichiers public sont copiés dans dist
})

