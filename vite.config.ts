import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
