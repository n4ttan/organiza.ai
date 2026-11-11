import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// O token do GitHub fica no localStorage: só script próprio e só api.github.com.
const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src https://api.github.com"

export default defineConfig({
  base: '/organiza.ai/',
  plugins: [
    react(),
    tailwindcss(),
    {
      // só no build: em dev o Vite injeta script inline, que a CSP bloquearia
      name: 'csp',
      apply: 'build',
      transformIndexHtml: () => [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
          injectTo: 'head-prepend',
        },
      ],
    },
  ],
})
