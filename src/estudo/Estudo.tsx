import { useEffect } from 'react'
import { Placa } from '../placas/Placa'
import { useEstudo, type FiltroEstudo } from './useEstudo'

const LETRAS = ['A', 'B', 'C', 'D']

export function Estudo({ filtro = {} }: { filtro?: FiltroEstudo }) {
  const { questao, escolha, responder, avancar, contadores } = useEstudo(filtro)
  const respondida = escolha !== null

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement | null
      if (alvo?.tagName === 'INPUT' || alvo?.tagName === 'SELECT') return

      const indice = LETRAS.findIndex((_, i) => e.key === String(i + 1))
      if (indice >= 0) {
        e.preventDefault()
        responder(indice)
        return
      }
      if (e.key === 'Enter' || e.key === ' ') {
        // Botão focado já ativa sozinho; interceptar aqui avançaria duas questões.
        if (alvo?.tagName === 'BUTTON') return
        e.preventDefault()
        avancar()
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [responder, avancar])

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
          <button type="button" className="avancar" onClick={avancar} autoFocus>
            Próxima questão <kbd>Enter</kbd>
          </button>
        </div>
      )}
    </section>
  )
}
