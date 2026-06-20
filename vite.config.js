import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base: './' makes asset paths relative, so the build works whether it is served
// from a root domain or a GitHub Pages subpath like /your-repo-name/.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
