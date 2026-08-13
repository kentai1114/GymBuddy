import { copyFileSync, existsSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function spaFallback(): Plugin {
  return {
    name: 'spa-fallback-404',
    closeBundle() {
      const index = fileURLToPath(new URL('./dist/index.html', import.meta.url))
      const fallback = fileURLToPath(new URL('./dist/404.html', import.meta.url))
      if (existsSync(index)) copyFileSync(index, fallback)
    },
  }
}

export default defineConfig({
  base: process.env.GITHUB_PAGES_BASE || '/',
  plugins: [react(), spaFallback()],
  envPrefix: ['VITE_', 'OPENAI_', 'OPENROUTER_'],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
