# Banco Nacional de Questões — extração para `questoes.json`

Extração completa das questões do PDF `Banco Nacional de Questões.pdf`
(313 páginas, versão 1.0, CNH do Brasil — Ministério dos Transportes / SENATRAN)
para uso como fonte de dados de uma aplicação de simulados.

- **Arquivo gerado:** `questoes.json` (~1,2 MB, UTF-8)
- **Total extraído:** 1500 questões — todas com 4 alternativas (1 correta + 3 incorretas) e comentário

## Estrutura do JSON

```jsonc
{
  "meta": {
    "fonte": "Banco Nacional de Questões - CNH do Brasil",
    "orgao": "Ministério dos Transportes - Secretaria Nacional de Trânsito (SENATRAN)",
    "versao": "1.0",
    "totalQuestoes": 1500,
    "partes": [ { "numero": 1, "nome": "..." } ],
    "modulos": [ { "numero": 1, "nome": "..." } ],
    "dificuldades": ["Fácil", "Intermediário", "Difícil"],
    "questoesComCodigoPlaca": 227,
    "questoesQueRequeremImagemDaPlaca": 171,
    "duplicatasExatas": [899, 926, 930, 1437],
    "campos": { /* dicionário de cada campo da questão */ }
  },
  "questoes": [ /* ... */ ]
}
```

### Campos de cada questão

| Campo | Descrição |
|---|---|
| `id` | Identificador sequencial único (1..1500) |
| `parte` | `1` = Banco Nacional de Questões, `2` = Teste seus conhecimentos |
| `parteNome` | Nome da parte |
| `modulo` | `1`..`4` |
| `moduloNome` | Nome do módulo |
| `numeroNoModulo` | Numeração original impressa no PDF; **reinicia a cada parte/módulo** |
| `dificuldade` | `Fácil` \| `Intermediário` \| `Difícil` |
| `enunciado` | Texto da pergunta |
| `codigoPlaca` | Código oficial da placa (ex.: `R-3`, `A-33a`) quando aplicável; senão `null` |
| `requerImagem` | `true` quando o enunciado se refere visualmente à placa (ver consideração 2) |
| `alternativas` | Array de 4 strings; **índice 0 é sempre a correta no arquivo** |
| `respostaCorreta` | Índice da alternativa correta (sempre `0`) |
| `comentario` | Justificativa / feedback da resposta correta |
| `duplicataDe` | `id` da questão idêntica anterior, ou `null` |

## Cobertura

| Recorte | Quantidade |
|---|---|
| **Parte 1 — Banco Nacional de Questões** | **1341** |
| M1 · Placas, Cores e Caminhos | 371 |
| M2 · Escolhas e Consequências | 171 |
| M3 · Na Direção da Segurança | 575 |
| M4 · Cuidar, Agir e Preservar | 224 |
| **Parte 2 — Teste seus conhecimentos** | **159** |
| M1 · Placas, Cores e Caminhos | 41 |
| M2 · Escolhas e Consequências | 34 |
| M3 · Na Direção da Segurança | 48 |
| M4 · Cuidar, Agir e Preservar | 36 |
| **Fácil / Intermediário / Difícil** | 743 / 533 / 224 |
| Com `codigoPlaca` | 227 |

### Validação executada (0 erros)

- Numeração original de cada parte/módulo conferida como sequencial e completa (`1..N`, sem lacunas).
- `id` único de 1 a 1500.
- Toda questão tem enunciado, comentário, exatamente 4 alternativas não vazias e parte/módulo definidos.
- Rodapés de página, quebras de linha e marcadores `✓`/`✗` removidos; acentuação e aspas tipográficas
  do original preservadas.

## Considerações para a aplicação de simulados

### 1. Embaralhar as alternativas em tempo de execução

`alternativas[0]` é **sempre** a correta no arquivo (`respostaCorreta: 0`), porque essa é a ordem
da fonte (o PDF lista "Alternativa correta" e depois "Respostas incorretas"). Se as alternativas
forem renderizadas na ordem do JSON, o gabarito fica trivial.

Ao embaralhar, guarde o texto da alternativa correta (ou o novo índice) antes de exibir:

```js
function prepararQuestao(q) {
  const correta = q.alternativas[q.respostaCorreta];
  const opcoes = [...q.alternativas].sort(() => Math.random() - 0.5);
  return { ...q, opcoes, indiceCorreto: opcoes.indexOf(correta) };
}
```

### 2. As imagens das placas NÃO estão no PDF

O PDF não contém imagens das placas — o único conteúdo gráfico é a capa. Ainda assim,
**171 questões têm enunciado que depende visualmente da placa** ("O que indica a placa acima?",
"O que essa placa indica?"), marcadas com `requerImagem: true`.

Essas questões só fazem sentido se a aplicação renderizar a placa a partir do `codigoPlaca`,
usando um acervo próprio de imagens (padrão CONTRAN/DENATRAN — Manual Brasileiro de Sinalização
de Trânsito). Sugestão: mapear `codigoPlaca` → arquivo (ex.: `assets/placas/A-33a.svg`) e ocultar
ou pular as questões cujo código não tenha imagem disponível.

As outras 56 questões com `codigoPlaca` são autoexplicativas (citam a placa pelo nome no enunciado)
e funcionam sem imagem.

### 3. Quatro duplicatas exatas na fonte

As questões de `id` **899, 926, 930 e 1437** repetem integralmente (enunciado + alternativas)
uma questão anterior. Elas trazem o `id` da original em `duplicataDe` — filtre por
`duplicataDe === null` ao montar simulados para não repetir a mesma pergunta na mesma prova.

Atenção: cerca de 61 outras questões **repetem o enunciado genérico** ("O que indica a placa acima?")
mas diferem pelo `codigoPlaca` — não são duplicatas e não devem ser filtradas. Por isso a detecção
considera enunciado + alternativas + `codigoPlaca`, e não só o enunciado.

## Como a extração foi feita

1. `pdftotext -layout` sobre o PDF (texto nativo; não houve necessidade de OCR).
2. Remoção do rodapé repetido em toda página e da capa.
3. Máquina de estados sobre os marcadores fixos do documento:
   `● (Dificuldade) N.` → `Código da placa:` (opcional) → `Alternativa correta:` →
   `Comentário:` → `Respostas incorretas:` + linhas `✗`.
4. Junção de linhas quebradas pela paginação e normalização de espaços.
5. Validação estrutural e de contagens descrita acima.

Para reprocessar (por exemplo, se sair uma versão 1.1 do banco), refaça os passos acima com
o novo PDF e reexecute a validação — os marcadores do documento são estáveis.
