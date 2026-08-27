import { useMemo } from 'react'
import { carregarQuestoes } from '../dados/carregar'
import type { Dificuldade, Modulo } from '../dados/tipos'
import type { FiltroEstudo } from './useEstudo'

const DIFICULDADES: Dificuldade[] = ['Fácil', 'Intermediário', 'Difícil']

export function Filtros({
  filtro,
  aoMudar,
}: {
  filtro: FiltroEstudo
  aoMudar: (f: FiltroEstudo) => void
}) {
  // Nomes vêm do próprio dado, para não haver uma segunda cópia deles no código.
  const modulos = useMemo(() => {
    const nomes = new Map<Modulo, string>()
    for (const q of carregarQuestoes()) nomes.set(q.modulo, q.moduloNome)
    return [...nomes].sort(([a], [b]) => a - b)
  }, [])

  return (
    <nav className="filtros">
      <label>
        Módulo
        <select
          value={filtro.modulos?.[0] ?? ''}
          onChange={(e) =>
            aoMudar({
              ...filtro,
              modulos: e.target.value === '' ? undefined : [Number(e.target.value) as Modulo],
            })
          }
        >
          <option value="">Todos</option>
          {modulos.map(([numero, nome]) => (
            <option key={numero} value={numero}>
              M{numero} · {nome}
            </option>
          ))}
        </select>
      </label>

      <label>
        Dificuldade
        <select
          value={filtro.dificuldades?.[0] ?? ''}
          onChange={(e) =>
            aoMudar({
              ...filtro,
              dificuldades: e.target.value === '' ? undefined : [e.target.value as Dificuldade],
            })
          }
        >
          <option value="">Todas</option>
          {DIFICULDADES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>
    </nav>
  )
}
