import { useState } from 'react'
import { Estudo } from './estudo/Estudo'
import { Filtros } from './estudo/Filtros'
import { registrarResposta } from './estudo/fila'
import { carregarProgresso, salvarProgresso, zerarProgresso } from './estudo/persistencia'
import type { FiltroEstudo } from './estudo/useEstudo'
import { AvisoAtualizacao } from './pwa/AvisoAtualizacao'
import { Resultado } from './simulado/Resultado'
import { Simulado } from './simulado/Simulado'
import { carregarHistorico, registrarProva, zerarHistorico, type Prova } from './simulado/historico'
import { respostasDaProva, resultado, type Simulado as EstadoSimulado } from './simulado/simulado'
import './estudo/estudo.css'

type Modo = 'estudo' | 'simulado'

export function App() {
  const [modo, setModo] = useState<Modo>('estudo')
  const [filtro, setFiltro] = useState<FiltroEstudo>({})
  const [terminado, setTerminado] = useState<EstadoSimulado | null>(null)
  const [historico, setHistorico] = useState<Prova[]>([])
  /** Muda a cada prova nova para o componente remontar com outro sorteio. */
  const [prova, setProva] = useState(0)
  /** Muda no reset, para o Estudo remontar e reler o progresso já vazio. */
  const [geracao, setGeracao] = useState(0)
  const [confirmandoZerar, setConfirmandoZerar] = useState(false)

  /**
   * Raiz de composição: é aqui que `modo-simulado` e `modo-estudo` se encontram.
   * Nenhum dos dois importa o outro — o CAPABILITY-MAP não declara essa seta.
   * O relógio também vive aqui, e não dentro dos módulos puros.
   */
  function aoTerminarProva(s: EstadoSimulado) {
    const progresso = respostasDaProva(s).reduce(
      (p, r) => registrarResposta(p, r.id, r.acertou),
      carregarProgresso(),
    )
    salvarProgresso(progresso)

    const r = resultado(s)
    registrarProva({ em: new Date().toISOString(), acertos: r.acertos, total: r.total })
    setHistorico(carregarHistorico().slice(1))
    setTerminado(s)
  }

  function novaProva() {
    setTerminado(null)
    setProva((n) => n + 1)
  }

  function zerar() {
    // Dois cliques de propósito: apagar semanas de estudo não pode ser um toque
    // acidental, e um window.confirm é feio e bloqueável.
    if (!confirmandoZerar) {
      setConfirmandoZerar(true)
      return
    }
    zerarProgresso()
    zerarHistorico()
    setHistorico([])
    setTerminado(null)
    setConfirmandoZerar(false)
    setGeracao((n) => n + 1)
  }

  function trocarModo(novo: Modo) {
    setConfirmandoZerar(false)
    setModo(novo)
    if (novo === 'simulado') novaProva()
  }

  return (
    <>
      <AvisoAtualizacao />
      <nav className="modos">
        <button
          type="button"
          data-testid="modo-estudo"
          aria-pressed={modo === 'estudo'}
          onClick={() => trocarModo('estudo')}
        >
          Estudar
        </button>
        <button
          type="button"
          data-testid="modo-simulado"
          aria-pressed={modo === 'simulado'}
          onClick={() => trocarModo('simulado')}
        >
          Simulado
        </button>
        <button
          type="button"
          className={confirmandoZerar ? 'zerar confirmando' : 'zerar'}
          data-testid="zerar"
          onClick={zerar}
        >
          {confirmandoZerar ? 'Confirmar apagar tudo?' : 'Zerar progresso'}
        </button>
      </nav>

      {modo === 'estudo' ? (
        <>
          {/* Filtros ficam FORA de Estudo: se um recorte não tiver questão, ainda é
              preciso poder trocar o filtro para sair de lá. */}
          <Filtros filtro={filtro} aoMudar={setFiltro} />
          <Estudo key={geracao} filtro={filtro} />
        </>
      ) : terminado ? (
        <Resultado resultado={resultado(terminado)} historico={historico} aoRecomecar={novaProva} />
      ) : (
        <Simulado key={prova} aoTerminar={aoTerminarProva} />
      )}
    </>
  )
}
