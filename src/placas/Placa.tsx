import { temPlaca } from './acervo'

/**
 * Renderiza a placa a partir do código. Devolve null quando o código não está no
 * acervo — quem decide pular a questão é o chamador, não este componente.
 */
export function Placa({ codigo }: { codigo: string }) {
  if (!temPlaca(codigo)) return null
  return (
    <img
      // BASE_URL, não "/": servido de um subcaminho, o caminho absoluto apontaria
      // para fora do site e as 69 placas dariam 404.
      src={`${import.meta.env.BASE_URL}placas/${codigo}.svg`}
      alt={`Placa ${codigo}`}
      width={160}
      height={160}
    />
  )
}
