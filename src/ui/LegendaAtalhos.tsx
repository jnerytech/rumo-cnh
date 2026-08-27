/**
 * Atalhos escritos na tela em vez de escondidos. Some em aparelho sem teclado
 * (ver `@media (hover: none)` no CSS) — no celular seria ruído.
 */
export function LegendaAtalhos() {
  return (
    <p className="atalhos" data-testid="legenda-atalhos">
      <kbd>A</kbd>–<kbd>D</kbd> ou <kbd>1</kbd>–<kbd>4</kbd> respondem · <kbd>Enter</kbd> avança
    </p>
  )
}
