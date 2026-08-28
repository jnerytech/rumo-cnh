import { readFileSync, existsSync } from 'node:fs'
import { inflateSync } from 'node:zlib'
import { ICONES, manifesto } from './manifesto'

/**
 * Valida um PNG de verdade: não basta o cabeçalho dizer 192x192.
 * O bug que motivou este teste tinha IHDR anunciando RGB (3 bytes/pixel) e
 * dados RGBA (4 bytes/pixel) — `file` aprovava, todo decodificador recusava,
 * e o Chrome se recusava a instalar o app sem dizer por quê.
 */
function lerPng(caminho: string) {
  const d = readFileSync(caminho)
  if (!d.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    throw new Error(`${caminho}: não é PNG`)
  }
  const largura = d.readUInt32BE(16)
  const altura = d.readUInt32BE(20)
  const profundidade = d[24]!
  const tipoCor = d[25]!
  const canais = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[tipoCor]
  if (!canais) throw new Error(`${caminho}: tipo de cor ${tipoCor} desconhecido`)

  const idat: Buffer[] = []
  let i = 8
  while (i < d.length) {
    const tam = d.readUInt32BE(i)
    const tipo = d.subarray(i + 4, i + 8).toString()
    if (tipo === 'IDAT') idat.push(d.subarray(i + 8, i + 8 + tam))
    i += 12 + tam
    if (tipo === 'IEND') break
  }
  const bruto = inflateSync(Buffer.concat(idat))
  const esperado = altura * (1 + Math.ceil((largura * canais * profundidade) / 8))
  return { largura, altura, tipoCor, bytes: bruto.length, esperado }
}

describe('ícones do PWA', () => {
  it.each(ICONES)('$arquivo existe', ({ arquivo }) => {
    expect(existsSync(`public/${arquivo}`), `public/${arquivo}`).toBe(true)
  })

  it.each(ICONES)('$arquivo tem $lado x $lado como o manifesto declara', ({ arquivo, lado }) => {
    const png = lerPng(`public/${arquivo}`)
    expect(png.largura).toBe(lado)
    expect(png.altura).toBe(lado)
  })

  it.each(ICONES)('$arquivo decodifica: dados batem com o cabeçalho', ({ arquivo }) => {
    const png = lerPng(`public/${arquivo}`)
    expect(png.bytes, `${arquivo}: IHDR e IDAT discordam`).toBe(png.esperado)
  })
})

describe('manifesto', () => {
  it('está em português — o app é todo em pt-BR', () => {
    expect(manifesto.lang).toBe('pt-BR')
  })

  it('usa as cores do app, não um azul genérico', () => {
    expect(manifesto.theme_color).toBe('#fbfaf8')
    expect(manifesto.background_color).toBe('#fbfaf8')
  })

  it('declara os tamanhos que o Chrome exige para instalar', () => {
    const tamanhos = manifesto.icons.map((i) => i.sizes)
    expect(tamanhos).toContain('192x192')
    expect(tamanhos).toContain('512x512')
  })

  it('tem um ícone maskable separado, com margem de segurança', () => {
    const maskable = manifesto.icons.filter((i) => i.purpose === 'maskable')
    expect(maskable.length).toBeGreaterThan(0)
    // "any maskable" no mesmo arquivo obriga o desenho a servir aos dois usos,
    // e o recorte circular do Android come as bordas. O tipo IconeManifesto já
    // torna esse valor impossível; aqui a checagem é do valor serializado.
    const serializado = JSON.stringify(manifesto.icons)
    expect(serializado).not.toContain('any maskable')
  })

  it('abre na raiz do próprio deploy, seja em subcaminho ou não', () => {
    expect(manifesto.start_url).toBe('./')
    expect(manifesto.scope).toBe('./')
    expect(manifesto.display).toBe('standalone')
  })
})
