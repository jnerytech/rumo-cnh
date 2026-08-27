import { useState } from 'react'
import { carregarQuestoes } from '../dados/carregar'
import { filtrar } from '../dados/filtrar'
import { Placa } from '../placas/Placa'
import { temPlaca } from '../placas/acervo'
import { LegendaAtalhos } from '../ui/LegendaAtalhos'
import { useAtalhos } from '../ui/useAtalhos'
import {
  avancar,
  criarSimulado,
  finalizar,
  responder,
  type Simulado as EstadoSimulado,
} from './simulado'

const LETRAS = ['A', 'B', 'C', 'D']

export function Simulado({ aoTerminar }: { aoTerminar: (s: EstadoSimulado) => void }) {
  const [estado, setEstado] = useState<EstadoSimulado>(() =>
    criarSimulado(filtrar(carregarQuestoes(), { temPlaca })),
  )

  const questao = estado.questoes[estado.atual]
  const escolha = questao ? (estado.respostas[estado.atual] ?? null) : null
  const ultima = estado.atual === estado.questoes.length - 1

  // Mesmos atalhos do modo estudo. Na última questão, avançar é finalizar.
  useAtalhos({
    responder: (i) => setEstado(responder(estado, i)),
    avancar: () => {
      if (escolha === null) return
      if (ultima) aoTerminar(finalizar(estado))
      else setEstado(avancar(estado))
    },
  })

  if (!questao) return null

  return (
    <section className="estudo">
      <header className="contadores">
        {/* Posição, nunca placar: saber quantas já acertou durante a prova é feedback. */}
        <span data-testid="posicao">
          Questão <b>{estado.atual + 1}</b>/{estado.questoes.length}
        </span>
        <span className="fraco">simulado</span>
      </header>

      <p className="enunciado">{questao.enunciado}</p>

      {questao.requerImagem && questao.codigoPlaca !== null && (
        <div className="placa">
          <Placa codigo={questao.codigoPlaca} />
        </div>
      )}

      <LegendaAtalhos />

      <ol className="opcoes">
        {questao.opcoes.map((texto, i) => (
          <li key={texto}>
            <button
              type="button"
              onClick={() => setEstado(responder(estado, i))}
              data-escolhida={i === escolha || undefined}
              className={i === escolha ? 'escolhida' : undefined}
            >
              <span className="letra">{LETRAS[i]}.</span> {texto}
            </button>
          </li>
        ))}
      </ol>

      <div className="feedback">
        {ultima ? (
          <button
            type="button"
            className="avancar"
            data-testid="acao"
            data-avanca
            disabled={escolha === null}
            onClick={() => aoTerminar(finalizar(estado))}
          >
            Finalizar prova
          </button>
        ) : (
          <button
            type="button"
            className="avancar"
            data-testid="acao"
            data-avanca
            disabled={escolha === null}
            onClick={() => setEstado(avancar(estado))}
          >
            Próxima questão
          </button>
        )}
      </div>
    </section>
  )
}
