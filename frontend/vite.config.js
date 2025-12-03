import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000', // Make sure this matches your Flask port!
        changeOrigin: true,
        secure: false,      
        
        // 1. We removed '_options' from here because we don't use it
        configure: (proxy) => { 
          
          // 2. We removed '_req' and '_res' from here
          proxy.on('error', (err) => { 
            console.log('proxy error', err);
          });

          // 3. We removed '_res' from here
          proxy.on('proxyReq', (proxyReq, req) => { 
            console.log('Sending Request to the Target:', req.method, req.url);
          });

          // 4. We removed '_res' from here too
          proxy.on('proxyRes', (proxyRes, req) => { 
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  }
});