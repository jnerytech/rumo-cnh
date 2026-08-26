export type Dificuldade = 'Fácil' | 'Intermediário' | 'Difícil'
export type Modulo = 1 | 2 | 3 | 4
export type Parte = 1 | 2

/**
 * Questão como está em questoes.json. Uso interno de src/dados/ — não exportar
 * para fora do módulo (fronteira do SPEC-dados): `alternativas[0]` é sempre a
 * correta aqui, e a UI não pode ter acesso a isso.
 */
export type QuestaoFonte = {
  id: number
  parte: Parte
  parteNome: string
  modulo: Modulo
  moduloNome: string
  numeroNoModulo: number
  dificuldade: Dificuldade
  enunciado: string
  codigoPlaca: string | null
  requerImagem: boolean
  alternativas: string[]
  respostaCorreta: number
  comentario: string
  duplicataDe: number | null
}
