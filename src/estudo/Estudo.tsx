import { Placa } from '../placas/Placa'
import { LegendaAtalhos } from '../ui/LegendaAtalhos'
import { useAtalhos } from '../ui/useAtalhos'
import { useEstudo, type FiltroEstudo } from './useEstudo'

const LETRAS = ['A', 'B', 'C', 'D']

export function Estudo({ filtro = {} }: { filtro?: FiltroEstudo }) {
  const { questao, escolha, responder, avancar, contadores } = useEstudo(filtro)
  const respondida = escolha !== null

  useAtalhos({ responder, avancar })

  if (questao === null) {
    return <p className="vazio">Nenhuma questão com os filtros atuais.</p>
  }

  return (
    <section className="estudo">
      <header className="contadores" data-testid="contadores">
        <span>
          <b>{contadores.dominadas}</b> aprendidas
        </span>
        <span>
          <b>{contadores.pendentes}</b> a revisar
        </span>
        <span>
          <b>{contadores.ineditas}</b> inéditas
        </span>
        <span className="fraco">
          {questao.moduloNome} · {questao.dificuldade}
        </span>
      </header>

      <progress
        className="barra"
        data-testid="barra-progresso"
        max={contadores.total}
        value={contadores.dominadas}
      >
        {contadores.dominadas} de {contadores.total}
      </progress>

      <p className="enunciado" data-testid="enunciado">
        {questao.enunciado}
      </p>

      {questao.requerImagem && questao.codigoPlaca !== null && (
        <div className="placa">
          <Placa codigo={questao.codigoPlaca} />
        </div>
      )}

      <LegendaAtalhos />

      <ol className="opcoes">
        {questao.opcoes.map((texto, i) => {
          const correta = respondida && i === questao.indiceCorreto
          const escolhidaErrada = respondida && i === escolha && i !== questao.indiceCorreto
          return (
            <li key={texto}>
              <button
                type="button"
                onClick={() => responder(i)}
                disabled={respondida}
                className={correta ? 'correta' : escolhidaErrada ? 'errada' : undefined}
                // Atributos independentes: a mesma opção pode ser a escolhida E a correta.
                // Um data-testid único faria um estado esconder o outro.
                data-correta={correta || undefined}
                data-escolhida={i === escolha || undefined}
              >
                <span className="letra">{LETRAS[i]}.</span> {texto}
              </button>
            </li>
          )
        })}
      </ol>

      {respondida && (
        <div className="feedback" role="status">
          <p className={escolha === questao.indiceCorreto ? 'acertou' : 'errou'}>
            {escolha === questao.indiceCorreto ? 'Certo.' : 'Errado.'}
          </p>
          <p className="comentario" data-testid="comentario">
            {questao.comentario}
          </p>
          <button type="button" className="avancar" data-testid="acao" onClick={avancar} autoFocus>
            Próxima questão <kbd>Enter</kbd>
          </button>
        </div>
      )}
    </section>
  )
}
