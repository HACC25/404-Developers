import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Production tweak: set a relative base so hashed asset paths load when served by FastAPI static mount.
// This prevents "unstyled page" issues if the app isn't at absolute domain root or if a CDN rewrites paths.
export default defineConfig({
  base: './',
  plugins: [react()],
})
