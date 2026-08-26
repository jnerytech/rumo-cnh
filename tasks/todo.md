# Tarefas — onda 1 (`dados` + `acervo-placas`)

Plano: [`tasks/plan.md`](plan.md) · Specs: [`SPEC-dados.md`](../SPEC-dados.md),
[`SPEC-acervo-placas.md`](../SPEC-acervo-placas.md)

Ordem por dependência. Trilhas **A** e **B** são paralelas depois de A1.
Nenhuma tarefa toca mais de ~5 arquivos.

---

## A1 · Andaime do projeto
- [ ] **Tarefa:** Vite 6 + React 19 + TS strict + Vitest + ESLint/Prettier, com todos os scripts do mapa
  - **Aceite:** `npm run dev` sobe; `npm test`, `npm run typecheck`, `npm run lint` passam num projeto vazio; `tsconfig` com `strict: true` e `noUncheckedIndexedAccess`; um teste-sentinela `expect(1).toBe(1)` roda
  - **Verificar:** os quatro comandos acima, verdes
  - **Arquivos:** `package.json`, `tsconfig.json`, `vite.config.ts`, `.eslintrc.cjs`, `.prettierrc`
  - **Nota:** `npm run placas:cobertura` já entra no `package.json` apontando pra B1 (falha até B1 existir — esperado)

## B1 · Cobertura de placas, mensurável desde zero
- [ ] **Tarefa:** `scripts/cobertura-placas.ts` + geração de `src/placas/acervo.ts`
  - **Aceite:** lê os 69 códigos de `questoes.json` (`requerImagem: true`, deduplicado — não hardcodar a lista); lista o que existe em `public/placas/`; imprime `N/69 placas · M/171 questões destravadas` e o que falta em ordem de frequência; gera `PLACAS_DISPONIVEIS` a partir do disco; exit ≠ 0 se algum SVG estiver vazio ou não for SVG válido
  - **Verificar:** `npm run placas:cobertura` com `public/placas/` vazio → reporta `0/69 · 0/171`, exit 0
  - **Arquivos:** `scripts/cobertura-placas.ts`, `src/placas/acervo.ts` (gerado), `package.json`
  - **Depende de:** A1 · Critérios: SPEC-acervo 1, 2, 4

## A2 · Tipos e carregamento
- [ ] **Tarefa:** `QuestaoFonte`, `Dificuldade`, `carregarQuestoes()`
  - **Aceite:** tipos derivados do dado real, sem `any`; duplicatas filtradas na entrada
  - **Verificar:** `npm test` — 1496 questões, nenhuma com `duplicataDe !== null`, todas com 4 alternativas não vazias e `enunciado`/`comentario` preenchidos
  - **Arquivos:** `src/dados/tipos.ts`, `src/dados/carregar.ts`, `src/dados/carregar.test.ts`
  - **Depende de:** A1 · Critérios: SPEC-dados 1, 2

## B2 · As 12 placas mais cobradas → Marco 1
- [ ] **Tarefa:** baixar `R-28 R-7 R-6a R-5a A-31 A-15 R-25c R-38 A-14 R-32 R-37 A-2b` para `public/placas/`
  - **Aceite:** 12 SVGs, nomeados exatamente como o `codigoPlaca` (case-sensitive), válidos e legíveis a 96 px
  - **Verificar:** `npm run placas:cobertura` → `12/69 · 58/171 (33%)`
  - **Arquivos:** 12 arquivos em `public/placas/`
  - **Depende de:** B1 · Critérios: SPEC-acervo 5 · **Checkpoint 3 do plano**

## A3 · Embaralhamento sem viés  ⚠️ tarefa mais importante da onda
- [ ] **Tarefa:** `embaralhar` (Fisher–Yates, RNG injetável) + `prepararQuestao` → `QuestaoPreparada`
  - **Aceite:** `QuestaoPreparada` não tem os campos `alternativas` nem `respostaCorreta` (garantia de tipo, não de disciplina); `opcoes[indiceCorreto]` bate com a correta da fonte nas 1496; `opcoes` é permutação exata; RNG injetado → reprodutível
  - **Verificar:** `npm test` — inclusive o teste anti-viés: 10 000 preparações com `Math.random` real, cada posição em 25% ± 2 p.p.
  - **Arquivos:** `src/dados/embaralhar.ts`, `src/dados/preparar.ts` + `.test.ts` de cada
  - **Depende de:** A2 · Critérios: SPEC-dados 3, 4, 5, 6

## A3b · Provar que o teste anti-viés detecta o bug
- [ ] **Tarefa:** trocar Fisher–Yates por `sort(() => Math.random() - 0.5)` temporariamente e confirmar que o teste **falha**; reverter
  - **Aceite:** falha observada e registrada na descrição do teste; código revertido
  - **Verificar:** `npm test` vermelho com o `sort`, verde de novo depois de reverter (`git diff` limpo)
  - **Arquivos:** `src/dados/embaralhar.ts` (temporário)
  - **Depende de:** A3 · **Checkpoint 2 do plano** — teste que nunca falha não protege nada

## B3 · Contact sheet para conferência visual
- [ ] **Tarefa:** `scripts/contact-sheet.ts` → HTML com todas as placas baixadas, cada uma sob seu código
  - **Aceite:** grade com código + imagem; questões que usam cada placa contadas ao lado; abre direto no navegador sem servidor
  - **Verificar:** **gate humano** — você confere placa por placa e aprova
  - **Arquivos:** `scripts/contact-sheet.ts`, `contact-sheet.html` (gerado, não versionado)
  - **Depende de:** B2 · Critérios: SPEC-acervo 3 · **Checkpoint 4 do plano**

## A4 · Filtros e sorteio do simulado
- [ ] **Tarefa:** `filtrar` (com `temPlaca` injetado) + `sortearSimulado`
  - **Aceite:** filtros combinam por AND, filtro vazio devolve a entrada; `temPlaca` sempre-falso → 1325, sempre-verdadeiro → 1496; sorteio de 30 sem `id` repetido na distribuição 8/4/13/5 (maior resto); nenhum `import` de `src/placas/` neste arquivo
  - **Verificar:** `npm test` + `grep -r "placas" src/dados/` vazio
  - **Arquivos:** `src/dados/filtrar.ts`, `src/dados/sortear.ts` + `.test.ts` de cada
  - **Depende de:** A3 · Critérios: SPEC-dados 7, 8, 9

## B5 · Componente `<Placa/>`
- [ ] **Tarefa:** `<Placa codigo="R-28" />` — `<img>` com `alt="Placa R-28"`, `null` se fora do acervo
  - **Aceite:** renderiza a imagem quando o código existe; retorna `null` quando não; não decide pular questão (isso é do chamador)
  - **Verificar:** `npm test` — Testing Library, um caso presente e um ausente
  - **Arquivos:** `src/placas/Placa.tsx`, `src/placas/Placa.test.tsx`
  - **Depende de:** B1

## A5 · Fechar cobertura de `dados`
- [ ] **Tarefa:** levar `src/dados/` a 100% de branches e travar o limite na config do Vitest
  - **Aceite:** 100% de branches em `src/dados/`; threshold configurado, então regressão quebra o build
  - **Verificar:** `npm test -- --coverage`
  - **Arquivos:** `vite.config.ts`, testes existentes
  - **Depende de:** A4 · Critérios: SPEC-dados 10

## B4 · As 57 placas restantes → Marco 2
- [ ] **Tarefa:** completar o acervo em ordem de frequência; desenhar à mão o que o acervo externo não tiver
  - **Aceite:** `69/69 · 171/171`, ou lista explícita do que faltou e por quê
  - **Verificar:** `npm run placas:cobertura` + contact sheet atualizado aprovado por você
  - **Arquivos:** até 57 arquivos em `public/placas/`
  - **Depende de:** B3 · Critérios: SPEC-acervo 6 · **não bloqueia o gate da onda 1**

---

## GATE — onda 1 completa
`dados` com 100% de branches, `<Placa/>` de pé, Marco 1 fechado.
→ Aí escrevo `SPEC-modo-estudo.md`. **Não** começar tela antes deste gate.
