// GERADO por scripts/cobertura-placas.ts a partir de public/placas/. Não editar à mão.
export const PLACAS_DISPONIVEIS: ReadonlySet<string> = new Set([
  'A-14',
  'A-15',
  'A-2b',
  'A-31',
  'R-25c',
  'R-28',
  'R-32',
  'R-37',
  'R-38',
  'R-5a',
  'R-6a',
  'R-7',
])

export function temPlaca(codigo: string): boolean {
  return PLACAS_DISPONIVEIS.has(codigo)
}
