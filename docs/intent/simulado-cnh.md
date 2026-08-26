# Intenção confirmada — app de estudo para a prova da CNH

> Produzido por `/interview-me` em 2026-08-26. Confirmado explicitamente pelo usuário.
> Este documento registra **o que se quer e por quê** — não é spec nem plano.

## Entendimento

- **Resultado:** um app web que roda no navegador do PC, onde o usuário varre as questões do
  Banco Nacional (`questoes.json`, 1500 questões) **vendo as placas**, e depois faz simulados
  para medir se passaria.
- **Usuário:** uma única pessoa — o autor do repo. Sem outras pessoas envolvidas.
- **Por que agora:** prova de legislação já marcada, em semanas. Os dados já estão extraídos e
  validados (0 erros, ver `QUESTOES.md`); o que falta é a interface.
- **Sucesso:** acertar ≥ 24/30 num simulado. Antes disso: conseguir responder as 371 questões do
  módulo de placas com a placa renderizada na tela.
- **Restrição vinculante:** o prazo. O acervo de imagens de placas está no caminho crítico por
  decisão explícita do usuário — mas são **69 imagens**, não 227, adicionadas por ordem de
  frequência, então não bloqueia o app por dias.

## Ordem decidida

1. Acervo de placas (69 SVGs, mapeados `codigoPlaca` → arquivo), por frequência de cobrança.
2. Modo estudo — varrer o conteúdo por módulo/dificuldade, com o `comentario` como feedback.
3. Modo simulado — 30 questões, nota, medir prontidão.

O usuário escolheu esta ordem contra a recomendação de inverter (app cru primeiro, placas depois).
Decisão registrada e aceita. Risco correspondente: se o acervo emperrar, fica sem app e sem estudo.

## Fora de escopo (explícito)

- Outras pessoas, contas, multi-usuário, qualquer noção de produto.
- Celular e sincronização entre dispositivos.
- Backend — progresso vive no próprio navegador.
- Simulado cronometrado antes do modo estudo com placas estar de pé.
- As 20 placas restantes (das questões autoexplicativas, que citam a placa pelo nome) — opcionais.

## Números que sustentam as decisões

Apurados diretamente sobre `questoes.json`:

| Fato | Valor |
|---|---|
| Questões com `requerImagem: true` | 171 |
| Dessas, quantas têm `codigoPlaca` | 171 (todas — nenhuma órfã) |
| **Códigos distintos necessários para elas** | **69** |
| Códigos distintos no arquivo inteiro | 89 |
| Questões com `codigoPlaca` (total) | 227 |

Concentração da cobertura (placas ordenadas por frequência):

| Placas adicionadas | Questões cobertas |
|---|---|
| 12 | 58 / 171 (33%) |
| 20 | 82 / 171 (47%) |
| 40 | 133 / 171 (77%) |
| 60 | 162 / 171 (94%) |
| 69 | 171 / 171 (100%) |

Mais cobradas: `R-28` (8×), `R-7` (6×), `R-6a` (6×), `R-5a` (5×), `A-31` (5×), `A-15` (4×),
`R-25c` (4×), `R-38` (4×), `A-14` (4×), `R-32` (4×), `R-37` (4×), `A-2b` (4×).

## Próximo passo

Spec ou plano de implementação — ambos consomem esta intenção, não o pedido original.
