import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Relativo: o build precisa funcionar servido de um subcaminho, como
  // jnerytech.github.io/rumo-cnh/, e não só da raiz de um domínio.
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,jpg,svg,webp}'],
      },
      manifest: {
        name: 'Rumo à CNH',
        short_name: 'Rumo CNH',
        description: 'Estude para a prova teórica da CNH com questões e simulados.',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: './',
        start_url: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  // Porta travada: o progresso vive no localStorage, que é preso à origem.
  // Se o Vite caísse para 5174 por a 5173 estar ocupada, o histórico de estudo
  // simplesmente não estaria lá. Melhor falhar alto do que abrir um app vazio.
  server: { port: 5173, strictPort: true },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/dados/**', 'src/estudo/fila.ts', 'src/simulado/simulado.ts'],
      // Lógica pura onde um erro não dá sintoma (SPEC-dados critério 10,
      // SPEC-modo-estudo critério 12). É pequena, e é onde um bug corrompe o resto calado.
      thresholds: { branches: 100, functions: 100, lines: 100, statements: 100 },
    },
  },
})
