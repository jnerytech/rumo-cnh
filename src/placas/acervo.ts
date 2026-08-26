// GERADO por scripts/cobertura-placas.ts a partir de public/placas/. Não editar à mão.
export const PLACAS_DISPONIVEIS: ReadonlySet<string> = new Set([

])

export function temPlaca(codigo: string): boolean {
  return PLACAS_DISPONIVEIS.has(codigo)
}
