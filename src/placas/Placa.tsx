import { temPlaca } from './acervo'

/**
 * Renderiza a placa a partir do código. Devolve null quando o código não está no
 * acervo — quem decide pular a questão é o chamador, não este componente.
 */
export function Placa({ codigo }: { codigo: string }) {
  if (!temPlaca(codigo)) return null
  return (
    <img src={`/placas/${codigo}.svg`} alt={`Placa ${codigo}`} width={160} height={160} />
  )
}
