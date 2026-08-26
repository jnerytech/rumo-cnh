import fonteJson from '../../questoes.json'
import type { QuestaoFonte } from './tipos'

// Único cast do projeto sobre o dado externo. `src/json.d.ts` tipa *.json como
// `unknown` de propósito, então a fronteira com o arquivo fica aqui, explícita.
const fonte = fonteJson as { questoes: QuestaoFonte[] }

/** As 1496 questões únicas: as 4 duplicatas exatas da fonte já saem daqui. */
export function carregarQuestoes(): QuestaoFonte[] {
  return fonte.questoes.filter((q) => q.duplicataDe === null)
}
