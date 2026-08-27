import { MINIMO_PARA_PASSAR, type Resultado as DadosResultado } from './simulado'
import type { Prova } from './historico'

export function Resultado({
  resultado,
  historico,
  aoRecomecar,
}: {
  resultado: DadosResultado
  historico: Prova[]
  aoRecomecar: () => void
}) {
  const { acertos, total, aprovado, erros } = resultado

  return (
    <section className="estudo">
      <p className="nota" data-testid="nota">
        <b>{acertos}</b>/{total}
      </p>
      <p className={aprovado ? 'acertou' : 'errou'} data-testid="veredito">
        {aprovado
          ? `Você passaria. O mínimo é ${MINIMO_PARA_PASSAR}.`
          : `Você não passaria. Faltaram ${MINIMO_PARA_PASSAR - acertos} para o mínimo de ${MINIMO_PARA_PASSAR}.`}
      </p>

      <button type="button" className="avancar" data-testid="acao" onClick={aoRecomecar}>
        Fazer outra prova
      </button>

      {historico.length > 0 && (
        <>
          <h2>Provas anteriores</h2>
          <ul className="historico">
            {historico.map((p) => (
              <li key={p.em} data-testid="prova-anterior">
                <b>
                  {p.acertos}/{p.total}
                </b>{' '}
                <span className="fraco">{p.em.slice(0, 10).split('-').reverse().join('/')}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {erros.length > 0 && (
        <>
          <h2>
            {erros.length} {erros.length === 1 ? 'erro' : 'erros'} para revisar
          </h2>
          <ol className="revisao">
            {erros.map(({ questao, marcada }) => (
              <li key={questao.id} data-testid="erro">
                <p className="enunciado">{questao.enunciado}</p>
                <p className="errou">
                  Você marcou: {marcada === null ? '(em branco)' : questao.opcoes[marcada]}
                </p>
                <p className="acertou">Correta: {questao.opcoes[questao.indiceCorreto]}</p>
                <p className="comentario">{questao.comentario}</p>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  )
}
