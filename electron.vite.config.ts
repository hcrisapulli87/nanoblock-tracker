import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    root: 'src/renderer',
    // Expose VITE_* (e.g. Supabase URL/key) to the renderer in electron-vite.
    envPrefix: ['VITE_', 'RENDERER_VITE_'],
    build: { rollupOptions: { input: 'src/renderer/index.html' } },
    plugins: [react()],
  },
})
