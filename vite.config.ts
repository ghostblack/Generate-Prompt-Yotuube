import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Combine system process.env (for Netlify CI) and loaded .env (for local dev)
  const processEnv = { ...process.env, ...env };

  return {
    plugins: [react()],
    define: {
      // This exposes process.env.API_KEY to the client-side code safely
      'process.env.API_KEY': JSON.stringify(processEnv.API_KEY)
    }
  }
})