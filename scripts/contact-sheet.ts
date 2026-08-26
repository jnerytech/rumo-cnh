/**
 * Gera contact-sheet.html: todas as placas do acervo lado a lado, cada uma com o
 * código, quantas questões dependem dela e a resposta correta de uma dessas questões.
 *
 * A resposta correta é o ponto: sem ela, conferir "esta imagem é mesmo a R-28?"
 * exigiria decorar o manual. Com ela, basta olhar a imagem e ler o que ela deveria dizer.
 *
 * Rodar: npm run placas:contact-sheet
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { codigosNecessarios, type QuestaoComPlaca } from '../src/placas/cobertura.ts'

type Questao = QuestaoComPlaca & { enunciado: string; alternativas: string[]; comentario: string }

const fonte = JSON.parse(readFileSync('questoes.json', 'utf8')) as { questoes: Questao[] }
const emDisco = new Set(
  readdirSync('public/placas')
    .filter((f) => f.endsWith('.svg'))
    .map((f) => f.slice(0, -'.svg'.length)),
)

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const cartoes = codigosNecessarios(fonte.questoes)
  .filter((p) => emDisco.has(p.codigo))
  .map((p) => {
    const candidatas = fonte.questoes.filter((x) => x.codigoPlaca === p.codigo && x.requerImagem)
    // Preferir a questão que pede a identificação da placa ("o que indica...") em vez de uma
    // sobre consequência ou local de uso — só a primeira serve para conferir a imagem.
    const identifica = /o que (a placa|essa placa|indica|significa|est[áa] avisando)/i
    // Nem toda placa tem questão do tipo "o que indica" (R-7 não tem). Aí vale a questão cujo
    // comentário descreve a placa, que é a segunda melhor pista para conferir a imagem.
    const descreve = /a placa (acima )?(proíbe|indica|adverte|alerta|obriga|restringe)/i
    const q =
      candidatas.find((x) => identifica.test(x.enunciado)) ??
      candidatas.find((x) => descreve.test(x.comentario)) ??
      candidatas[0]
    // alternativas[0] é a correta na fonte — aqui é justamente o que queremos mostrar.
    const significado = q?.alternativas[0] ?? '(sem questão associada)'
    const comentario = q?.comentario ?? ''
    return `<figure>
      <img src="public/placas/${esc(p.codigo)}.svg" alt="Placa ${esc(p.codigo)}" />
      <figcaption>
        <b>${esc(p.codigo)}</b> <span class="n">${p.questoes} questão(ões)</span>
        <p>${esc(significado)}</p>
        <p class="coment">${esc(comentario)}</p>
      </figcaption>
    </figure>`
  })

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<title>Conferência do acervo de placas — ${cartoes.length} placas</title>
<style>
  body { font: 15px/1.5 system-ui, sans-serif; margin: 2rem; background: #fafafa; color: #222 }
  h1 { font-size: 1.3rem }
  .grade { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem }
  figure { margin: 0; background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 1rem;
           display: flex; flex-direction: column; align-items: center; text-align: center }
  img { width: 120px; height: 120px; object-fit: contain }
  figcaption { margin-top: .75rem }
  .n { color: #777; font-size: .85em }
  p { margin: .5rem 0 0; font-size: .85em; color: #444 }
  .coment { color: #777; font-size: .8em; font-style: italic }
</style></head><body>
<h1>Conferência do acervo — ${cartoes.length} placas</h1>
<p>Cada cartão mostra a imagem baixada e <b>o que a placa deveria significar</b>, segundo o gabarito
das questões. Se a imagem não bate com o texto, a placa está errada.</p>
<div class="grade">
${cartoes.join('\n')}
</div>
</body></html>
`
writeFileSync('contact-sheet.html', html)
console.log(`contact-sheet.html gerado com ${cartoes.length} placas.`)
