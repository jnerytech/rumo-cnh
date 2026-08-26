/**
 * Relatório de cobertura do acervo de placas + geração de src/placas/acervo.ts.
 * Rodar: npm run placas:cobertura
 *
 * Sai com código != 0 se algum SVG for inválido ou se houver asset órfão.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  calcularCobertura,
  codigosNecessarios,
  gerarAcervoTs,
  motivoInvalido,
  type QuestaoComPlaca,
} from '../src/placas/cobertura.ts'

const DIR_PLACAS = 'public/placas'
const SAIDA_ACERVO = 'src/placas/acervo.ts'

const fonte = JSON.parse(readFileSync('questoes.json', 'utf8')) as {
  questoes: QuestaoComPlaca[]
}
const necessarias = codigosNecessarios(fonte.questoes)

mkdirSync(DIR_PLACAS, { recursive: true })
const arquivos = readdirSync(DIR_PLACAS).filter((f) => f.endsWith('.svg'))
const emDisco = arquivos.map((f) => f.slice(0, -'.svg'.length))

const problemas = emDisco
  .map((codigo) => motivoInvalido(codigo, readFileSync(join(DIR_PLACAS, `${codigo}.svg`), 'utf8')))
  .filter((m): m is string => m !== null)

const c = calcularCobertura(necessarias, emDisco)
const pct = (n: number, total: number) => (total === 0 ? 0 : Math.round((n / total) * 100))

console.log(
  `\nAcervo de placas: ${c.presentes.length}/${c.necessarias.length} placas ` +
    `(${pct(c.presentes.length, c.necessarias.length)}%) · ` +
    `${c.questoesDestravadas}/${c.questoesTotais} questões destravadas ` +
    `(${pct(c.questoesDestravadas, c.questoesTotais)}%)\n`,
)

if (c.faltando.length > 0) {
  console.log(`faltando ${c.faltando.length}, por frequência de cobrança:`)
  for (const p of c.faltando) console.log(`  ${p.codigo.padEnd(8)} ${p.questoes} questão(ões)`)
  console.log()
}

writeFileSync(SAIDA_ACERVO, gerarAcervoTs(emDisco))
console.log(`${SAIDA_ACERVO} gerado com ${emDisco.length} placa(s).\n`)

if (problemas.length > 0) {
  console.error('SVGs inválidos:')
  for (const p of problemas) console.error(`  ${p}`)
  process.exit(1)
}
if (c.orfaos.length > 0) {
  console.error(`assets órfãos (não correspondem a nenhum código necessário): ${c.orfaos.join(', ')}`)
  process.exit(1)
}
