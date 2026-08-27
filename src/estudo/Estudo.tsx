import { Placa } from '../placas/Placa'
import { useEstudo, type FiltroEstudo } from './useEstudo'

const LETRAS = ['A', 'B', 'C', 'D']

export function Estudo({ filtro = {} }: { filtro?: FiltroEstudo }) {
  const { questao, escolha, responder, avancar, contadores } = useEstudo(filtro)
  const respondida = escolha !== null

  if (questao === null) {
    return <p className="vazio">Nenhuma questão com os filtros atuais.</p>
  }

  return (
    <section className="estudo">
      <header className="contadores" data-testid="contadores">
        <span>
          <b>{contadores.ineditas}</b> inéditas
        </span>
        <span>
          <b>{contadores.pendentes}</b> a revisar
        </span>
        <span className="fraco">
          {questao.moduloNome} · {questao.dificuldade}
        </span>
      </header>

      <p className="enunciado" data-testid="enunciado">
        {questao.enunciado}
      </p>

      {questao.requerImagem && questao.codigoPlaca !== null && (
        <div className="placa">
          <Placa codigo={questao.codigoPlaca} />
        </div>
      )}

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
                data-testid={
                  correta ? 'opcao-correta' : i === escolha ? 'opcao-escolhida' : undefined
                }
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
          <button type="button" className="avancar" onClick={avancar} autoFocus>
            Próxima questão
          </button>
        </div>
      )}
    </section>
  )
}
