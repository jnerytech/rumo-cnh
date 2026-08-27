import { useState } from 'react'
import { Estudo } from './estudo/Estudo'
import { Filtros } from './estudo/Filtros'
import type { FiltroEstudo } from './estudo/useEstudo'
import './estudo/estudo.css'

export function App() {
  const [filtro, setFiltro] = useState<FiltroEstudo>({})
  return (
    <>
      {/* Filtros ficam FORA de Estudo: se um recorte não tiver questão, ainda é
          preciso poder trocar o filtro para sair de lá. */}
      <Filtros filtro={filtro} aoMudar={setFiltro} />
      <Estudo filtro={filtro} />
    </>
  )
}
