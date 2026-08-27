import { readFileSync } from 'node:fs'
import { carregarQuestoes } from '../dados/carregar'
import { estaPendente, registrarResposta, type Progresso } from '../estudo/fila'
import {
  MINIMO_PARA_PASSAR,
  QUESTOES,
  avancar,
  criarSimulado,
  finalizar,
  responder,
  respostasDaProva,
  resultado,
} from './simulado'

const banco = carregarQuestoes()

/** Faz a prova inteira acertando as `acertos` primeiras e errando o resto. */
function fazerProva(acertos: number) {
  let s = criarSimulado(banco)
  for (let i = 0; i < QUESTOES; i++) {
    const q = s.questoes[i]!
    const escolha = i < acertos ? q.indiceCorreto : (q.indiceCorreto + 1) % q.opcoes.length
    s = responder(s, escolha)
    if (i < QUESTOES - 1) s = avancar(s)
  }
  return s
}

describe('criarSimulado', () => {
  it('devolve 30 questões (critério 1)', () => {
    expect(criarSimulado(banco).questoes).toHaveLength(QUESTOES)
    expect(QUESTOES).toBe(30)
    expect(MINIMO_PARA_PASSAR).toBe(24)
  })

  it('não repete questão na mesma prova (critério 1)', () => {
    const ids = criarSimulado(banco).questoes.map((q) => q.id)
    expect(new Set(ids).size).toBe(30)
  })

  it('respeita a distribuição 8/4/13/5 por módulo (critério 1)', () => {
    const s = criarSimulado(banco)
    expect([1, 2, 3, 4].map((m) => s.questoes.filter((q) => q.modulo === m).length)).toEqual([
      8, 4, 13, 5,
    ])
  })

  it('entrega questões preparadas, sem gabarito exposto (critério 2)', () => {
    const q = criarSimulado(banco).questoes[0]!
    expect(q.opcoes).toHaveLength(4)
    expect(q).not.toHaveProperty('alternativas')
    expect(q).not.toHaveProperty('respostaCorreta')
  })

  it('começa na primeira questão, sem resposta e sem estar finalizado', () => {
    const s = criarSimulado(banco)
    expect(s.atual).toBe(0)
    expect(s.respostas).toEqual(Array(30).fill(null))
    expect(s.finalizado).toBe(false)
  })

  it('é reprodutível com RNG injetado', () => {
    const rng = () => 0.42
    expect(criarSimulado(banco, rng).questoes.map((q) => q.id)).toEqual(
      criarSimulado(banco, rng).questoes.map((q) => q.id),
    )
  })
})

describe('responder e avancar', () => {
  it('registra a escolha na questão atual (critério 3)', () => {
    const s = responder(criarSimulado(banco), 2)
    expect(s.respostas[0]).toBe(2)
    expect(s.respostas[1]).toBeNull()
  })

  it('não expõe se acertou antes de finalizar (critério 3)', () => {
    const s = responder(criarSimulado(banco), 0)
    expect(Object.keys(s)).toEqual(['questoes', 'respostas', 'atual', 'finalizado'])
    expect(JSON.stringify(s)).not.toContain('acertos')
    expect(s.finalizado).toBe(false)
  })

  it('é puro: não muta o simulado recebido', () => {
    const antes = criarSimulado(banco)
    responder(antes, 3)
    expect(antes.respostas[0]).toBeNull()
  })

  it('trocar a resposta na mesma questão substitui (critério 4)', () => {
    const s = responder(responder(criarSimulado(banco), 1), 3)
    expect(s.respostas[0]).toBe(3)
  })

  it('depois de avançar, a resposta anterior é final (critério 4)', () => {
    const s = avancar(responder(criarSimulado(banco), 1))
    expect(s.atual).toBe(1)
    const depois = responder(s, 2)
    expect(depois.respostas[0]).toBe(1)
    expect(depois.respostas[1]).toBe(2)
  })

  it('avancar sem ter respondido não faz nada (critério 5)', () => {
    const s = criarSimulado(banco)
    expect(avancar(s).atual).toBe(0)
    expect(avancar(s)).toEqual(s)
  })

  it('avancar na última questão não sai dela (critério 6)', () => {
    let s = criarSimulado(banco)
    for (let i = 0; i < 30; i++) s = avancar(responder(s, 0))
    expect(s.atual).toBe(29)
    expect(s.finalizado).toBe(false)
  })

  it('responder não mexe em questão que não é a atual', () => {
    const s = responder(avancar(responder(criarSimulado(banco), 0)), 3)
    expect(s.respostas.filter((r) => r !== null)).toHaveLength(2)
  })
})

describe('finalizar', () => {
  it('não finaliza sem responder a última questão (critério 7)', () => {
    let s = criarSimulado(banco)
    for (let i = 0; i < QUESTOES - 1; i++) s = avancar(responder(s, 0))
    expect(finalizar(s).finalizado).toBe(false)
  })

  it('finaliza depois de responder a última', () => {
    expect(finalizar(fazerProva(30)).finalizado).toBe(true)
  })
})

describe('resultado', () => {
  it('recusa prova não finalizada — o gabarito não sai antes da hora (critério 3)', () => {
    expect(() => resultado(fazerProva(30))).toThrow(/finaliza/i)
  })

  it('conta os acertos comparando com indiceCorreto (critério 8)', () => {
    const r = resultado(finalizar(fazerProva(26)))
    expect(r.acertos).toBe(26)
    expect(r.total).toBe(30)
  })

  it('aprova com exatamente 24 (critério 10)', () => {
    const r = resultado(finalizar(fazerProva(MINIMO_PARA_PASSAR)))
    expect(r.acertos).toBe(24)
    expect(r.aprovado).toBe(true)
  })

  it('reprova com 23 (critério 10)', () => {
    const r = resultado(finalizar(fazerProva(MINIMO_PARA_PASSAR - 1)))
    expect(r.acertos).toBe(23)
    expect(r.aprovado).toBe(false)
  })

  it('lista os erros com a questão e o índice marcado (critério 9)', () => {
    const r = resultado(finalizar(fazerProva(28)))
    expect(r.erros).toHaveLength(2)
    for (const erro of r.erros) {
      expect(erro.marcada).not.toBe(erro.questao.indiceCorreto)
      expect(erro.questao.comentario).not.toBe('')
    }
  })

  it('prova perfeita não tem erros', () => {
    const r = resultado(finalizar(fazerProva(30)))
    expect(r.acertos).toBe(30)
    expect(r.erros).toEqual([])
    expect(r.aprovado).toBe(true)
  })

  it('prova zerada reprova e lista as 30', () => {
    const r = resultado(finalizar(fazerProva(0)))
    expect(r.acertos).toBe(0)
    expect(r.erros).toHaveLength(30)
    expect(r.aprovado).toBe(false)
  })
})

describe('respostasDaProva — ponte com a fila de estudo (critério 11)', () => {
  it('exige prova finalizada', () => {
    expect(() => respostasDaProva(fazerProva(30))).toThrow(/finaliza/i)
  })

  it('descreve cada questão como acertada ou errada', () => {
    const respostas = respostasDaProva(finalizar(fazerProva(28)))
    expect(respostas).toHaveLength(30)
    expect(respostas.filter((r) => r.acertou)).toHaveLength(28)
    expect(respostas.filter((r) => !r.acertou)).toHaveLength(2)
  })

  it('aplicada ao progresso, deixa as erradas pendentes de revisão', () => {
    const s = finalizar(fazerProva(28))
    const progresso = respostasDaProva(s).reduce(
      (p, r) => registrarResposta(p, r.id, r.acertou),
      {} as Progresso,
    )
    const errados = resultado(s).erros.map((e) => e.questao.id)
    expect(errados).toHaveLength(2)
    for (const id of errados) expect(estaPendente(progresso[id])).toBe(true)
  })

  it('as acertadas não entram na fila de revisão', () => {
    const s = finalizar(fazerProva(30))
    const progresso = respostasDaProva(s).reduce(
      (p, r) => registrarResposta(p, r.id, r.acertou),
      {} as Progresso,
    )
    expect(s.questoes.every((q) => !estaPendente(progresso[q.id]))).toBe(true)
  })

  it('não depende do módulo de estudo: simulado.ts não importa src/estudo', () => {
    const fonte = readFileSync('src/simulado/simulado.ts', 'utf8')
    expect(fonte).not.toMatch(/from '.*estudo/)
  })
})

describe('prova finalizada é imutável', () => {
  it('responder não muda nada depois de finalizada', () => {
    const s = finalizar(fazerProva(30))
    expect(responder(s, 2)).toEqual(s)
  })

  it('avancar não muda nada depois de finalizada', () => {
    const s = finalizar(fazerProva(30))
    expect(avancar(s)).toEqual(s)
  })
})

describe('questão sem resposta', () => {
  it('conta como erro, com marcada null', () => {
    // A navegação impede chegar aqui, mas o resultado não pode inventar um acerto
    // se algum dia chegar: sem resposta é erro, não é acerto e não é omissão.
    const base = finalizar(fazerProva(30))
    const semResposta = {
      ...base,
      respostas: base.respostas.map((r, i) => (i === 5 ? null : r)),
    }
    const r = resultado(semResposta)
    expect(r.acertos).toBe(29)
    expect(r.erros).toHaveLength(1)
    expect(r.erros[0]!.marcada).toBeNull()
  })
})
