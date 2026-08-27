# Spec: `acervo-placas`

Módulo `acervo-placas` do [`CAPABILITY-MAP.md`](CAPABILITY-MAP.md). Depende de: nada.
Tech stack, comandos, estrutura, estilo, testes e fronteiras: ver *Fundações compartilhadas* no mapa.

## Objective

Fazer as 171 questões visuais do módulo 1 serem respondíveis, renderizando a placa a partir do
`codigoPlaca`. Sem isso, 171 questões perguntam "o que indica a placa acima?" sem placa acima.

Usuário: `modo-estudo` e `modo-simulado`, via um componente `<Placa codigo="R-28" />`.

Por decisão explícita registrada em `docs/intent/simulado-cnh.md`, este módulo está no **caminho
crítico** — vem antes do app estar usável, e não depois.

## Escopo apurado

Medido sobre `questoes.json`, não estimado:

- 171 questões com `requerImagem: true` — **todas** no módulo 1, **todas** com `codigoPlaca`
  preenchido (nenhuma órfã).
- Elas usam **69 códigos distintos**: 30 de advertência (`A-*`), 38 de regulamentação (`R-*`),
  1 de serviço auxiliar (`SAU-06`).
- As outras 20 dos 89 códigos do arquivo pertencem a questões autoexplicativas — **fora de escopo**.

Cobertura é concentrada, então o acervo entra por frequência e cada placa adicionada já vale:

| Placas adicionadas | Questões destravadas |
|---|---|
| 12 | 58 / 171 (33%) |
| 20 | 82 / 171 (47%) |
| 40 | 133 / 171 (77%) |
| 60 | 162 / 171 (94%) |
| 69 | 171 / 171 (100%) |

Ordem de entrada (as 12 primeiras): `R-28`, `R-7`, `R-6a`, `R-5a`, `A-31`, `A-15`, `R-25c`,
`R-38`, `A-14`, `R-32`, `R-37`, `A-2b`.

Os 69 códigos: `A-11a A-12 A-14 A-15 A-17 A-18 A-19 A-1a A-1b A-20a A-20b A-2a A-2b A-31 A-32a
A-35 A-39 A-3a A-40 A-41 A-42a A-42b A-42c A-45 A-4b A-5a A-6 A-7a A-8 A-9 R-10 R-14 R-15 R-16
R-19 R-20 R-23 R-24a R-24b R-25a R-25b R-25c R-25d R-26 R-27 R-28 R-29 R-30 R-31 R-32 R-33 R-34
R-35 R-37 R-38 R-39 R-44 R-4a R-4b R-5a R-5b R-6a R-6b R-6c R-7 R-8a R-8b R-9 SAU-06`

## Contrato

```
public/placas/<CODIGO>.svg     // nome do arquivo == codigoPlaca, exato, case-sensitive
```

```tsx
// src/placas/Placa.tsx
export function Placa({ codigo }: { codigo: string }): JSX.Element | null
// renderiza <img src={`/placas/${codigo}.svg`} alt={`Placa ${codigo}`} />
// retorna null se o código não estiver no acervo — quem decide pular é `dados`, não a UI

// src/placas/acervo.ts
export const PLACAS_DISPONIVEIS: ReadonlySet<string>   // gerado, não escrito à mão
export function temPlaca(codigo: string): boolean
```

`PLACAS_DISPONIVEIS` é gerado por `npm run placas:cobertura` a partir do que existe em
`public/placas/`, para não haver como o mapa mentir sobre o acervo.

## Fonte das imagens

Padrão CONTRAN/DENATRAN (Manual Brasileiro de Sinalização de Trânsito). As placas brasileiras
estão disponíveis em SVG no Wikimedia Commons; sinalização oficial de trânsito brasileira é obra
oficial e o uso aqui é pessoal e não comercial.

**Resultado apurado:** 67 dos 69 códigos vieram do Commons. Dois foram desenhados, porque não
existem em SVG em lugar nenhum:

- `R-44` — "Circulação compartilhada de ciclistas e pedestres". É sinalização nova: o índice do
  Manual Brasileiro de Sinalização (Vol. I, p. 8) já a lista, mas nem o Commons nem a Wikipédia
  têm o desenho. O layout foi conferido contra o quadro da p. 12 do manual do SENATRAN, onde ela
  aparece sob o código antigo `R-46`: pedestre acima, bicicleta abaixo, sem divisória.
- `SAU-06` — telefone público, placa azul de serviço auxiliar.

## Discrepância de código na fonte

O banco rotula como `R-35` uma questão cujo gabarito diz "pedestres devem circular à esquerda e os
ciclistas à direita". Esse sinal é o **R-36b** no manual oficial; o `R-35a`/`R-35b` de verdade é
"ciclista, transite à esquerda/direita".

O arquivo `public/placas/R-35.svg` segue o **significado do gabarito**, não o código impresso: quem
estuda precisa reconhecer o sinal que a questão descreve. A discrepância está registrada em
`public/placas/fontes.json`.

## Success Criteria

1. `npm run placas:cobertura` imprime, para cada um dos 69 códigos, se há SVG — e o total de
   questões destravadas. Sai com código ≠ 0 se algum SVG estiver corrompido ou vazio.
2. Todo arquivo em `public/placas/` corresponde a um dos 69 códigos — sem asset órfão.
3. Todo SVG abre e renderiza legível a 96×96 px (verificação visual, uma vez, na revisão).
4. `PLACAS_DISPONIVEIS` é idêntico ao conjunto de arquivos em disco (teste do script).
5. **Marco 1 (destrava o `modo-estudo`):** ≥ 12 placas → ≥ 33% das questões visuais.
6. **Marco 2 (pronto):** 69/69 → 171/171 questões visuais respondíveis.

O `modo-estudo` pode começar assim que o Marco 1 estiver de pé; o Marco 2 não bloqueia o resto.

## Boundaries

Além das do mapa:

- **Sempre:** nomear o arquivo exatamente como o `codigoPlaca` da fonte, incluindo o sufixo
  minúsculo (`A-42c.svg`, não `A-42C.svg`).
- **Perguntar antes:** usar PNG em vez de SVG para algum código.
- **Nunca:** editar `codigoPlaca` em `questoes.json` para casar com um nome de arquivo — o mapa
  se ajusta ao dado, não o contrário.

## Open Questions

1. **Quem baixa as 69 imagens?** Posso buscá-las e conferir uma a uma, ou você prefere baixar em
   lote e eu só conferir cobertura e nomeação?
   → Assumo que **eu busco**, código a código, em ordem de frequência.
2. **Verificação visual.** Placa errada (`R-6a` vs `R-6b`, por exemplo) passa em todo teste
   automático e ensina errado. Proponho um contact sheet HTML com as 69 lado a lado para você
   conferir de uma vez.
