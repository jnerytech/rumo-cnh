import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/dados/**'],
      // src/dados é o único módulo com exigência de cobertura (SPEC-dados, critério 10):
      // é lógica pura, é pequena, e é onde um erro silencioso corrompe todo o resto.
      thresholds: { branches: 100, functions: 100, lines: 100, statements: 100 },
    },
  },
})
