# Capability Map: rumo-cnh

App de estudo para a prova teórica da CNH, para uso pessoal, rodando no navegador do desktop.
Intenção confirmada em [`docs/intent/simulado-cnh.md`](docs/intent/simulado-cnh.md).

## Módulos

| Module id | Responsabilidade | Depende de |
|---|---|---|
| `dados` | Carregar `questoes.json`, embaralhar alternativas sem vazar gabarito, filtrar duplicatas, filtrar/sortear por módulo, dificuldade e disponibilidade de placa | — |
| `acervo-placas` | 69 SVGs mapeados `codigoPlaca` → arquivo, adicionados por ordem de frequência; relatório de cobertura | — |
| `modo-estudo` | Varrer questões com o `comentario` como feedback, fila de erros, progresso persistido | `dados`, `acervo-placas` |
| `modo-simulado` | 30 questões sorteadas, nota, veredito ≥ 24/30 | `dados`, `acervo-placas` |

**Build order:** `dados` + `acervo-placas` (paralelos) → `modo-estudo` → `modo-simulado`

`modo-simulado` **não** depende de `modo-estudo`: eles compartilham dados, não código.
`dados` é módulo e não utilitário porque `alternativas[0]` é sempre a correta na fonte — o erro
que ele previne falha em silêncio e transforma o app inteiro em gabarito.

Specs por módulo: `SPEC-dados.md`, `SPEC-acervo-placas.md`, `SPEC-modo-estudo.md`,
`SPEC-modo-simulado.md` (escritos em ordem de dependência, não todos de uma vez).

---

# Fundações compartilhadas

Valem para todos os módulos. As specs de módulo referenciam esta seção em vez de repeti-la.

## Tech Stack

| Peça | Escolha |
|---|---|
| Build / dev server | Vite 8 |
| UI | React 19 + TypeScript 6 (strict, `noUncheckedIndexedAccess`) |
| Testes | Vitest 4 + @testing-library/react |
| Lint / format | ESLint + Prettier |
| Persistência | `localStorage` (progresso é pequeno: ids + contadores) |
| Backend | nenhum |

## Commands

```
Dev:      npm run dev
Build:    npm run build
Preview:  npm run preview
Test:     npm test
Watch:    npm run test:watch
Cobertura de testes: npm test -- --coverage
Lint:     npm run lint -- --fix
Typecheck: npm run typecheck        # tsc --noEmit
Cobertura de placas: npm run placas:cobertura
```

## Project Structure

```
questoes.json           → fonte de dados (artefato de extração; ver QUESTOES.md)
CAPABILITY-MAP.md       → este arquivo
SPEC-*.md               → spec por módulo
docs/intent/            → intenção confirmada
public/placas/          → SVGs das placas, nomeados pelo código (A-33a.svg)
scripts/                → utilitários de build/checagem (cobertura de placas)
src/dados/              → módulo dados (tipos, carregamento, embaralhamento, filtros, sorteio)
src/placas/             → mapa código → asset e componente <Placa/>
src/estudo/             → modo estudo
src/simulado/           → modo simulado
src/ui/                 → componentes compartilhados
src/App.tsx, main.tsx   → shell e roteamento entre os modos
tasks/                  → plan.md e todo.md
```

Testes co-localizados: `src/dados/embaralhar.test.ts` ao lado de `src/dados/embaralhar.ts`.

`questoes.json` permanece na raiz e é importado estaticamente (`import questoes from '../../questoes.json'`).
Vite embute ~1,2 MB no bundle — irrelevante em localhost, e elimina estado de carregamento assíncrono.

`resolveJsonModule` fica **desligado**: inferir tipos literais de 1,2 MB de JSON deixa o `tsc` lento
sem ganho nenhum. `src/json.d.ts` declara `*.json` como `unknown`, e o cast único acontece em
`src/dados/carregar.ts` — a fronteira com o dado externo, que é onde a validação pertence.

## Code Style

Funções puras com dependências injetadas (sobretudo aleatoriedade — testes precisam ser determinísticos).
Tipos derivados do dado real, sem `any`. Nomes de domínio em português; palavras-chave da linguagem
em inglês. Sem comentário que reafirme o código; comentário só para o que não é óbvio pelo nome.

```ts
// src/dados/embaralhar.ts
export type Rng = () => number

/** Fisher–Yates. Não use `sort(() => Math.random() - 0.5)`: enviesa a posição da correta. */
export function embaralhar<T>(itens: readonly T[], rng: Rng = Math.random): T[] {
  const saida = [...itens]
  for (let i = saida.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[saida[i], saida[j]] = [saida[j], saida[i]]
  }
  return saida
}
```

## Testing Strategy

- **Vitest**, testes co-localizados como `*.test.ts` / `*.test.tsx`.
- Exigência de **100% de branches** vale para a lógica pura onde um erro não dá sintoma:
  `src/dados/` e `src/estudo/fila.ts`. É pequena, é pura, e é onde um bug corrompe o resto calado.
- `acervo-placas` é verificado por script (`npm run placas:cobertura`), não por unit test.
- UI: testes de comportamento com Testing Library apenas nos fluxos que decidem certo/errado
  (responder, revelar comentário, calcular nota). Nada de snapshot de layout.
- Testes de aleatoriedade usam RNG determinístico injetado, exceto o teste estatístico de viés,
  que usa `Math.random` de propósito.

## Boundaries

**Sempre**
- Rodar `npm test` e `npm run typecheck` antes de commitar.
- Injetar RNG em qualquer função que sorteie ou embaralhe.
- Renderizar alternativas a partir de `opcoes` (embaralhado), nunca de `alternativas`.

**Perguntar antes**
- Adicionar qualquer dependência nova.
- Alterar o formato ou o conteúdo de `questoes.json`.
- Mudar fronteira de módulo, direção de dependência ou ordem de build deste mapa.

**Nunca**
- Editar `questoes.json` à mão — é artefato de extração; reprocessar conforme `QUESTOES.md`.
- Redistribuir o PDF do SENATRAN ou publicar o banco como produto (fora de escopo: uso pessoal).
- Renderizar `alternativas` na ordem da fonte em qualquer tela.
- Remover ou pular teste que falha sem aprovação.
