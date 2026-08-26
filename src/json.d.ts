// `resolveJsonModule` está desligado: inferir tipos literais de 1,2 MB de JSON
// deixa o tsc lento e sem ganho. O cast único acontece em src/dados/carregar.ts,
// que é o lugar certo pra validar a fronteira com o dado externo.
declare module '*.json' {
  const conteudo: unknown
  export default conteudo
}
