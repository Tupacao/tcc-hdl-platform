# RNF09 - Contraste de cores no nivel AA do WCAG, nos dois modos

| Campo | Valor |
| --- | --- |
| ID | RNF09 |
| Categoria | Requisito Nao Funcional |
| Prioridade (MoSCoW) | Must Have |
| Epico | Experiencia integrada |
| Status | Nao verificado (a base foi escolhida com isso em mente) |
| Requisitos relacionados | RF10, RF02, RF05, RF06, RNF01 |

## 1. Enunciado

> A interface deve atender ao nivel AA das diretrizes WCAG para contraste de
> cores, em ambos os modos de exibicao.

## 2. O que e

O compromisso de que todo texto e todo elemento de interface tenham contraste
suficiente contra o fundo, nos temas claro e escuro. Os limiares do WCAG 2.2
nivel AA:

| Criterio | Requisito | Aplica-se a |
| --- | --- | --- |
| 1.4.3 Contraste (minimo) | 4,5:1 | texto normal |
| 1.4.3 Contraste (minimo) | 3:1 | texto grande (>= 18,66px negrito ou 24px) |
| 1.4.11 Contraste de elementos | 3:1 | bordas de controle, icones, foco |
| 1.4.1 Uso de cor | - | cor nao pode ser o unico meio de informacao |

O ultimo aparece aqui por consequencia direta: no TPLab, severidade de
diagnostico (RF05) e nivel logico em forma de onda (RF06) sao comunicados por
cor. Contraste adequado nao resolve daltonismo - por isso o criterio de canal
redundante acompanha.

## 3. Para que serve

Acessibilidade e requisito de uma plataforma educacional publica, nao um extra.
Um aluno com baixa visao ou daltonismo tem o mesmo direito de usar a ferramenta -
e cerca de 8% dos homens tem alguma deficiencia de percepcao de cor, uma
proporcao relevante em turmas de engenharia.

Ha tambem o beneficio geral: contraste adequado ajuda quem usa a plataforma em
laboratorio com reflexo na tela, projetor desbotado ou monitor antigo.

## 4. Impacto

**Na paleta.** Amarra as decisoes de cor. Cada par fundo/texto precisa ser
verificado nos dois temas. O trabalho e maior do que parece: a plataforma tem
tokens de estado (`--destructive`, `--warning`, `--success`) usados sobre fundos
diferentes.

**No editor.** O Monaco tem tema proprio, com dezenas de cores de token de
sintaxe. Os temas padrao `vs` e `vs-dark` nao foram feitos para AA - RF02-I02 ja
preve definir tema customizado caso a verificacao reprove.

**No canvas.** As formas de onda de RF06 desenham em canvas, onde nenhuma
ferramenta automatica de auditoria alcanca. A verificacao ali e manual, sobre as
cores declaradas.

**Na verificacao.** Parte e automatizavel (contraste de tokens, auditoria de
DOM); parte nao (canvas, estados transitorios, foco). O projeto ja tem a skill
`a11y-audit` em `.claude/skills/`, com um verificador de contraste - util, com a
ressalva registrada em `CLAUDE.md` de que os scripts Python nao rodam sem Python
instalado.

## 5. Estado atual no repositorio

- `apps/web/src/index.css` define a paleta completa em `:root` e `.dark`, em
  `oklch`, com o comentario afirmando que os pares seguem o preset slate do
  shadcn/ui, "cujo contraste atende o nivel AA" - afirmacao herdada, nao
  verificada neste projeto.
- Foram acrescentados dois tokens fora do preset: `--success` e `--warning`, com
  valores proprios nos dois temas. Sao justamente os que nao herdam garantia
  nenhuma.
- `--warning` e usado em `console-panel.tsx` como `text-warning` sobre o fundo do
  console - um par que precisa de verificacao explicita.
- `--border` e `--input` no tema escuro usam branco com 12% e 18% de opacidade,
  valores que podem nao atingir 3:1 para contraste de elementos.
- shadcn/ui sobre Radix entrega foco visivel e semantica adequada de fabrica.
- Nao ha nenhuma verificacao de contraste registrada.
- **Falta**: auditar os tokens, o editor e o canvas.

## 6. Escopo

**Dentro**

- Auditoria de contraste de todos os pares de token, nos dois temas.
- Auditoria do tema do editor Monaco.
- Verificacao das cores do visualizador de formas de onda.
- Canais redundantes onde a cor comunica informacao.
- Registro dos resultados como evidencia.

**Fora**

- Conformidade WCAG completa (RNF09 trata de contraste; a skill `a11y-audit`
  cobre o resto e e usada nas issues das features).
- Nivel AAA.
- Tema de alto contraste dedicado.
- Auditoria por terceiro certificado.

## 7. Criterios de aceite da feature

- [ ] Todo par texto/fundo atinge 4,5:1 (ou 3:1 para texto grande) nos dois
      temas.
- [ ] Bordas de controle, icones informativos e indicador de foco atingem 3:1.
- [ ] O tema do editor atende AA para os tokens de sintaxe.
- [ ] As cores do visualizador de ondas atendem AA.
- [ ] Nenhuma informacao e comunicada apenas por cor.
- [ ] Os resultados estao registrados, par a par.
- [ ] Ha verificacao repetivel para regressao.

## 8. Quebra em issues

| Issue | Titulo | Branch | Tamanho |
| --- | --- | --- | --- |
| [issue-01](issue-01-auditoria-tokens-de-tema.md) | Auditoria de contraste dos tokens de tema | `chore/rnf09-auditoria-tokens-de-tema` | M |
| [issue-02](issue-02-contraste-editor-e-ondas.md) | Contraste do editor e do visualizador de ondas | `chore/rnf09-contraste-editor-e-ondas` | M |

## 9. Dependencias

- Depende de RF10 (os dois temas) e verifica RF02, RF05 e RF06.
- Usa a skill `a11y-audit` de `.claude/skills/`.

## 10. Design

Ver [figma/WILL-BE-DONE.md](figma/WILL-BE-DONE.md).
