import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { manifesto } from './src/pwa/manifesto'

export default defineConfig({
  // Relativo: o build precisa funcionar servido de um subcaminho, como
  // jnerytech.github.io/rumo-cnh/, e não só da raiz de um domínio.
  base: './',
  plugins: [
    react(),
    VitePWA({
      // 'prompt' e não 'autoUpdate': com autoUpdate a página recarrega sozinha
      // quando sai versão nova, e recarregar no meio de um simulado de 30
      // questões perde a prova inteira — o estado da prova vive em memória.
      // Assim a versão nova espera e entra quando o app for aberto de novo.
      registerType: 'prompt',
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'],
        // 1,2 MB de questoes.json entram no bundle; o padrão do workbox corta em 2 MiB.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        // Ativa só quando o usuário pede (skipWaiting via mensagem), mas quando
        // ativa precisa reivindicar as páginas abertas. Sem isto o worker novo
        // ativa, a página fica sem controlador e o recarregamento nunca acontece.
        skipWaiting: false,
        clientsClaim: true,
      },
      manifest: manifesto,
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
