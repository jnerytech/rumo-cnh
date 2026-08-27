import { useState } from 'react'
import { Estudo } from './estudo/Estudo'
import { Filtros } from './estudo/Filtros'
import { registrarResposta } from './estudo/fila'
import { carregarProgresso, salvarProgresso } from './estudo/persistencia'
import type { FiltroEstudo } from './estudo/useEstudo'
import { Resultado } from './simulado/Resultado'
import { Simulado } from './simulado/Simulado'
import { carregarHistorico, registrarProva, type Prova } from './simulado/historico'
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

  function trocarModo(novo: Modo) {
    setModo(novo)
    if (novo === 'simulado') novaProva()
  }

  return (
    <>
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
      </nav>

      {modo === 'estudo' ? (
        <>
          {/* Filtros ficam FORA de Estudo: se um recorte não tiver questão, ainda é
              preciso poder trocar o filtro para sair de lá. */}
          <Filtros filtro={filtro} aoMudar={setFiltro} />
          <Estudo filtro={filtro} />
        </>
      ) : terminado ? (
        <Resultado resultado={resultado(terminado)} historico={historico} aoRecomecar={novaProva} />
      ) : (
        <Simulado key={prova} aoTerminar={aoTerminarProva} />
      )}
    </>
  )
}
