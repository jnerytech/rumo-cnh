# Plano de implementação — rumo-cnh

Consome `CAPABILITY-MAP.md` (aprovado), `SPEC-dados.md` e `SPEC-acervo-placas.md` (aprovadas).
Intenção: `docs/intent/simulado-cnh.md`.

**Escopo deste plano:** onda 1 apenas — `dados` + `acervo-placas`. `modo-estudo` e `modo-simulado`
recebem spec própria depois que a onda 1 fechar, conforme a recursão do mapa. Planejar as telas
agora seria planejar contra spec que não existe.

## Componentes e dependências

```
A. Andaime (Vite+React+TS+Vitest)
   │
   ├──> A2 tipos + carregarQuestoes ──> A3 embaralhar + prepararQuestao ──> A4 filtrar + sortear
   │                                                                              │
   └──> B1 script de cobertura + acervo.ts gerado                                 │
             │                                                                    │
             ├──> B2 as 12 primeiras placas (Marco 1) ──> B3 contact sheet        │
             │                                                                    │
             ├──> B5 componente <Placa/> ─────────────────────────────────────────┤
             │                                                                    ▼
             └──> B4 as 57 restantes (Marco 2, não bloqueia) ──────────> GATE onda 1
                                                                                  │
                                                          SPEC-modo-estudo.md ────┘
```

A trilha **A** (dados) e a trilha **B** (placas) tocam arquivos disjuntos — `src/dados/` vs
`src/placas/` + `public/placas/` + `scripts/`. São paralelizáveis de verdade depois de A1.

## Ordem de execução

| # | Trilha | Entrega | Por que aqui |
|---|---|---|---|
| A1 | — | Andaime: Vite, React, TS strict, Vitest, ESLint/Prettier, todos os scripts do mapa | Nada roda sem isso; é o único gargalo serial |
| B1 | B | `scripts/cobertura-placas.ts` + `src/placas/acervo.ts` gerado | Escrito **antes** de existir placa: com 0 assets ele reporta 0/69. Torna o progresso mensurável desde o primeiro download |
| A2 | A | Tipos + `carregarQuestoes()` | Critérios 1–2 |
| B2 | B | 12 placas mais cobradas → **Marco 1** (33%) | Primeiro valor real; destrava começar o modo estudo |
| A3 | A | `embaralhar` (Fisher–Yates) + `prepararQuestao` | Critérios 3–6, incluindo o teste anti-viés. **O ponto mais importante do projeto** |
| B3 | B | Contact sheet HTML com as placas baixadas | Conferência visual é a única defesa contra placa trocada |
| A4 | A | `filtrar` (com `temPlaca` injetado) + `sortearSimulado` | Critérios 7–9 |
| B5 | B | `<Placa codigo />` | Precisa de B1; usado pelas duas telas |
| A5 | A | Fechar 100% de branches em `src/dados/` | Critério 10 |
| B4 | B | 57 placas restantes → **Marco 2** (100%) | Incremental, **não bloqueia** o gate |

## Checkpoints de verificação

1. **Depois de A1:** `npm run dev`, `npm test`, `npm run typecheck`, `npm run lint` todos verdes num projeto vazio. Se o andaime não estiver limpo, nada depois é confiável.
2. **Depois de A3:** o teste anti-viés passa com Fisher–Yates **e** falha se trocado por `sort(() => Math.random() - 0.5)`. Provar que o teste detecta o bug é parte do checkpoint — teste que nunca falha não protege nada.
3. **Depois de B2:** `npm run placas:cobertura` reporta ≥ 12/69 e ≥ 58/171 questões destravadas.
4. **Depois de B3:** você confere o contact sheet e aprova as placas uma a uma. **Gate humano.**
5. **Gate da onda 1** (A5 + B5 + Marco 1): `dados` 100% coberto, `<Placa/>` funcionando, ≥ 33% das questões visuais respondíveis → aí escrevo `SPEC-modo-estudo.md`.

## Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| Acervo externo não tem os 69 códigos com esse nome | Marco 2 não fecha | B1 vem primeiro, então a lacuna é **medida** e não presumida. Fallback: desenhar o SVG faltante a partir do padrão CONTRAN |
| Placa visualmente errada (`R-6a` no lugar de `R-6b`) | Ensina errado, passa em 100% dos testes | B3 contact sheet + gate humano no checkpoint 4 |
| Acervo emperra e consome o prazo | Sem app **e** sem ter estudado | B1 e B2 são pequenos e mensuráveis. Se o Marco 1 não fechar numa sessão, paramos e reconsideramos a ordem — a inversão que você recusou volta à mesa com dado em vez de palpite |
| Embaralhamento enviesado passa despercebido | App vira gabarito, sem sintoma | Critério 5 + checkpoint 2 (provar que o teste pega o bug) |
| `dados` acaba importando de `placas` | Quebra o mapa | Já resolvido na spec: `temPlaca` injetado. A4 tem teste que roda sem importar `src/placas/` |
| Escopo vazar pras telas antes da spec | Retrabalho | Este plano para no gate da onda 1, de propósito |

## Fora deste plano

`modo-estudo`, `modo-simulado`, persistência de progresso, fila de erros, deploy, e as 20 placas
das questões autoexplicativas. Cada um entra quando tiver spec.
