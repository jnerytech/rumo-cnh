import { useEffect } from 'react'

export type Atalhos = {
  responder?: (indice: number) => void
  avancar?: () => void
}

/** `1`–`4` e `a`–`d` apontam para os mesmos índices: o rótulo na tela é A–D. */
const TECLAS = ['1', '2', '3', '4', 'a', 'b', 'c', 'd']

/** Atalhos compartilhados pelos dois modos — a prova e o estudo se dirigem igual. */
export function useAtalhos({ responder, avancar }: Atalhos) {
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement | null
      const tag = alvo?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return

      const posicao = TECLAS.indexOf(e.key.toLowerCase())
      if (posicao >= 0) {
        e.preventDefault()
        responder?.(posicao % 4)
        return
      }
      if (e.key === 'Enter' || e.key === ' ') {
        // Botão focado já ativa sozinho; interceptar aqui avançaria duas vezes.
        if (tag === 'BUTTON') return
        e.preventDefault()
        avancar?.()
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [responder, avancar])
}
