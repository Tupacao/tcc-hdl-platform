# RF17 - Mecanismo de envio de feedback pelos usuarios

| Campo | Valor |
| --- | --- |
| ID | RF17 |
| Categoria | Requisito Funcional |
| Prioridade (MoSCoW) | Should Have |
| Epico | Validacao da proposta |
| Status | Nao implementado |
| Requisitos relacionados | RF19, RF07, RNF01, RNF06 |

## 1. Enunciado

> A plataforma deve disponibilizar um mecanismo de envio de feedback pelos
> usuarios.

## 2. O que e

Um canal dentro da aplicacao para o usuario relatar problema, sugerir melhoria ou
comentar a experiencia, sem sair da ferramenta e sem precisar de conta.

Na pratica: uma acao sempre acessivel, um formulario curto (tipo, mensagem,
contato opcional) e um armazenamento onde o autor do TCC consegue ler o que foi
enviado.

## 3. Para que serve

Este requisito serve ao TCC tanto quanto ao produto. A plataforma e uma proposta
que precisa ser **validada**, e validacao exige evidencia de uso real. Um
formulario de feedback e a fonte qualitativa dessa evidencia - complementar as
metricas quantitativas de RF19 -, e o que permite escrever no trabalho "os
usuarios relataram X" com respaldo.

Do lado do produto, e o caminho mais curto entre um defeito percebido e quem
pode corrigi-lo. Sem canal proprio, o relato se perde numa conversa de corredor.

## 4. Impacto

**Para o usuario.** Sensacao de que ha alguem do outro lado, e um caminho para
reportar o que travou.

**Na qualidade do dado.** Feedback sem contexto e quase inutil: "nao funcionou"
nao diz nada. Anexar automaticamente contexto tecnico - navegador, tamanho de
tela, ultimo erro de simulacao, projeto aberto - transforma relato vago em pista
acionavel. Isso precisa ser transparente para quem envia.

**Na privacidade.** O formulario aceita texto livre, onde as pessoas colam de
tudo, inclusive dado pessoal. Coletar contexto tecnico automaticamente aumenta a
responsabilidade: e preciso dizer o que vai junto, coletar o minimo e nao
armazenar o que nao sera usado.

**Na operacao.** Um endpoint publico que grava texto e alvo obvio de abuso. Rate
limit, limite de tamanho e algum controle antiautomacao sao requisitos, nao
extras.

**No custo.** Desprezivel: uma tabela e uma rota, aproveitando o Postgres que ja
existe.

## 5. Estado atual no repositorio

- Nao ha rota, schema ou tabela de feedback.
- `apps/api/src/app.ts` ja tem `@fastify/rate-limit` global (`max: 60`,
  `timeWindow: '1 minute'`), reaproveitavel com configuracao propria por rota.
- `sonner` ja esta disponivel no frontend para confirmacao de envio.
- **Falta**: tudo.

## 6. Escopo

**Dentro**

- Endpoint de recebimento com validacao, limites e protecao contra abuso.
- Armazenamento no Postgres, com contexto tecnico opcional.
- Formulario acessivel de qualquer tela.
- Forma de o autor do TCC ler o que foi enviado.

**Fora**

- Painel administrativo com moderacao e fluxo de tratamento.
- Resposta ao usuario dentro da plataforma.
- Integracao com issue tracker, e-mail ou servico externo.
- Captura automatica de tela ou gravacao de sessao.

## 7. Criterios de aceite da feature

- [ ] O usuario envia feedback de qualquer tela, sem precisar de conta.
- [ ] O formulario tem tipo, mensagem e contato opcional.
- [ ] O envio confirma visivelmente o recebimento.
- [ ] O contexto tecnico anexado e informado ao usuario antes do envio.
- [ ] Rajada de envios e limitada.
- [ ] Mensagem vazia ou grande demais e recusada com mensagem clara.
- [ ] O autor do TCC consegue ler os envios.
- [ ] O que e coletado esta declarado de forma acessivel ao usuario.

## 8. Quebra em issues

| Issue | Titulo | Branch | Tamanho |
| --- | --- | --- | --- |
| [issue-01](issue-01-endpoint-e-armazenamento.md) | Endpoint, validacao e armazenamento do feedback | `feat/rf17-endpoint-e-armazenamento` | M |
| [issue-02](issue-02-formulario-na-interface.md) | Formulario de feedback na interface | `feat/rf17-formulario-na-interface` | P |

## 9. Dependencias

- Depende do Postgres (RF07-I01 traz Prisma e a infraestrutura de migracao).
- Complementa RF19 (metricas quantitativas).
- Se RF14 existir, associar o feedback ao usuario logado quando houver sessao.

## 10. Design

Ver [figma/WILL-BE-DONE.md](figma/WILL-BE-DONE.md).
