/**
 * Lógica pura da cobertura do acervo de placas (módulo `acervo-placas`).
 * Sem `fs` e sem `console`: quem faz I/O é scripts/cobertura-placas.ts.
 *
 * Tipo local de propósito — B1 não deve depender de src/dados/tipos.ts (tarefa A2),
 * porque as trilhas A e B são paralelas.
 */
export type QuestaoComPlaca = {
  requerImagem: boolean
  codigoPlaca: string | null
  duplicataDe: number | null
}

export type PlacaNecessaria = { codigo: string; questoes: number }

/** Códigos que precisam de imagem, do mais cobrado ao menos. Empate: ordem alfabética. */
export function codigosNecessarios(questoes: readonly QuestaoComPlaca[]): PlacaNecessaria[] {
  const contagem = new Map<string, number>()
  for (const q of questoes) {
    if (q.duplicataDe !== null || !q.requerImagem || q.codigoPlaca === null) continue
    contagem.set(q.codigoPlaca, (contagem.get(q.codigoPlaca) ?? 0) + 1)
  }
  return [...contagem]
    .map(([codigo, questoes]) => ({ codigo, questoes }))
    .sort((a, b) => b.questoes - a.questoes || a.codigo.localeCompare(b.codigo))
}

export type Cobertura = {
  necessarias: PlacaNecessaria[]
  presentes: PlacaNecessaria[]
  faltando: PlacaNecessaria[]
  orfaos: string[]
  questoesTotais: number
  questoesDestravadas: number
}

export function calcularCobertura(
  necessarias: readonly PlacaNecessaria[],
  emDisco: readonly string[],
): Cobertura {
  const disco = new Set(emDisco)
  const presentes = necessarias.filter((p) => disco.has(p.codigo))
  const precisos = new Set(necessarias.map((p) => p.codigo))
  return {
    necessarias: [...necessarias],
    presentes,
    faltando: necessarias.filter((p) => !disco.has(p.codigo)),
    orfaos: emDisco.filter((c) => !precisos.has(c)).sort(),
    questoesTotais: necessarias.reduce((s, p) => s + p.questoes, 0),
    questoesDestravadas: presentes.reduce((s, p) => s + p.questoes, 0),
  }
}

/** Um SVG serve se não está vazio e é realmente SVG. Devolve o motivo, ou null se está ok. */
export function motivoInvalido(codigo: string, conteudo: string): string | null {
  if (conteudo.trim() === '') return `${codigo}: arquivo vazio`
  if (!conteudo.includes('<svg')) return `${codigo}: não contém <svg`
  return null
}

export function gerarAcervoTs(codigos: readonly string[]): string {
  const ordenados = [...codigos].sort()
  const linhas = ordenados.map((c) => `  '${c}',`).join('\n')
  return `// GERADO por scripts/cobertura-placas.ts a partir de public/placas/. Não editar à mão.
export const PLACAS_DISPONIVEIS: ReadonlySet<string> = new Set([
${linhas}
])

export function temPlaca(codigo: string): boolean {
  return PLACAS_DISPONIVEIS.has(codigo)
}
`
}
