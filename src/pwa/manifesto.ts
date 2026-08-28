/**
 * Manifesto do PWA, fora do vite.config para poder ser testado.
 *
 * Os caminhos são relativos de propósito: o app é servido de um subcaminho
 * (jnerytech.github.io/rumo-cnh/), e o navegador resolve `./` contra a URL do
 * próprio manifesto.
 */
export type IconeManifesto = {
  src: string
  sizes: string
  type: 'image/png'
  purpose?: 'maskable'
}

/** Arquivos que precisam existir em `public/` e decodificar de verdade. */
export const ICONES = [
  { arquivo: 'icon-192.png', lado: 192 },
  { arquivo: 'icon-512.png', lado: 512 },
  { arquivo: 'icon-maskable-512.png', lado: 512 },
  { arquivo: 'apple-touch-icon.png', lado: 180 },
] as const

export const manifesto = {
  name: 'Rumo à CNH',
  short_name: 'Rumo CNH',
  description: 'Estude para a prova teórica da CNH: fila de erros e simulados de 30 questões.',
  lang: 'pt-BR',
  dir: 'ltr' as const,
  categories: ['education'],
  start_url: './',
  scope: './',
  display: 'standalone' as const,
  // As cores do app. O azul que estava aqui não aparecia em lugar nenhum da
  // interface, e é ele que pinta a barra de status e a tela de abertura.
  theme_color: '#fbfaf8',
  background_color: '#fbfaf8',
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
    // Separado do "any": o Android recorta o maskable num círculo, e um desenho
    // que preenche a moldura inteira perde as bordas nesse corte.
    { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ] satisfies IconeManifesto[],
}
