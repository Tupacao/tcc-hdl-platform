# RNF06 - Autenticacao e autorizacao para acesso a projetos privados

| Campo | Valor |
| --- | --- |
| ID | RNF06 |
| Categoria | Requisito Nao Funcional |
| Prioridade (MoSCoW) | Must Have |
| Epico | Contas e acesso |
| Status | Nao implementado (divida de seguranca conhecida) |
| Requisitos relacionados | RF14, RF07, RF08, RF15, RNF04 |

## 1. Enunciado

> A plataforma deve implementar mecanismos de autenticacao e autorizacao para o
> acesso a projetos privados.

## 2. O que e

Duas coisas distintas que o enunciado junta, e que precisam ser separadas para
serem implementadas:

- **Autenticacao** - saber quem e o usuario. E o que RF14 entrega, via OAuth com
  Google.
- **Autorizacao** - decidir o que esse usuario pode fazer. E o objeto de RNF06:
  garantir que cada operacao sobre um projeto so seja permitida a quem tem
  direito.

Na pratica: toda rota que le ou escreve um projeto verifica se o solicitante e o
dono, e nega quando nao for. A unica excecao deliberada e a rota publica por
token de RF15.

## 3. Para que serve

Sem autorizacao, "projeto privado" e ficcao. Hoje `GET /api/projects` devolve
tudo para qualquer um, `GET /api/projects/:id` abre qualquer projeto e
`DELETE /api/projects/:id` apaga o projeto de qualquer pessoa.

Enquanto os dados sao efemeros e a plataforma nao esta publicada, isso e um
problema teorico. No momento em que RF01-I02 coloca a API na internet e RF07-I01
faz os dados persistirem, vira exposicao real de trabalho academico de terceiros.

## 4. Impacto

**Na ordem de implementacao.** Esta e a dependencia mais importante do
cronograma: publicar (RF01-I02) e persistir (RF07-I01) **sem** RNF06 cria uma
janela de exposicao. A regra pratica: ou RNF06 entra antes da publicacao com
dados reais, ou a plataforma fica com acesso restrito ate ele entrar.

**Na arquitetura.** Autorizacao espalhada por `if` em cada rota e frageil - basta
esquecer em uma rota nova. As defesas estruturais possiveis:

- escopo de dono **obrigatorio no tipo** do repositorio (previsto em
  RF14-I02): o compilador cobra;
- um hook do Fastify aplicado ao prefixo das rotas de projeto, exigindo sessao;
- verificacao de posse dentro do repositorio, nao na rota - o ponto por onde todo
  acesso passa.

**Na relacao com RF15.** Compartilhamento e a excecao. Por isso ele vive em rota
propria, com schema reduzido, fora do escopo de sessao - a excecao precisa ser
visivel no codigo, nao um caso especial escondido dentro da rota normal.

**No que nao muda.** A simulacao (`POST /api/simulations`) continua publica: ela
recebe codigo no corpo, nao le projeto. E o que preserva o uso anonimo de RF01.

## 5. Estado atual no repositorio

- Nao ha autenticacao, sessao ou verificacao de posse em lugar nenhum.
- `apps/api/src/modules/projects/routes.ts` expoe os cinco endpoints sem qualquer
  verificacao.
- `ProjectRepository` nao tem nocao de dono; `InMemoryProjectRepository` guarda
  tudo em um `Map` unico.
- `app.ts` registra `helmet`, `cors` e `rate-limit`, nenhum plugin de
  autenticacao.
- RF07-I01 preve a coluna `ownerId` e RF14-I02 preve o escopo obrigatorio no
  tipo - as duas preparacoes para esta feature.
- **Falta**: tudo, e depende de RF14.

## 6. Escopo

**Dentro**

- Exigencia de sessao nas rotas de projeto.
- Verificacao de posse em toda leitura e escrita de projeto.
- Escopo de dono aplicado no repositorio, nao apenas na rota.
- Testes de acesso negado como parte da suite.

**Fora**

- Papeis e permissoes diferenciadas (Won't Have: professor/aluno).
- Compartilhamento com permissao de edicao.
- Auditoria de acesso.
- Autenticacao propriamente dita (RF14).

## 7. Criterios de aceite da feature

- [ ] Sem sessao, as rotas de projeto respondem `401`.
- [ ] Com sessao, listar traz apenas os projetos do usuario.
- [ ] Abrir, editar, excluir ou exportar projeto de outro usuario responde `404`.
- [ ] A rota publica de RF15 continua funcionando sem sessao.
- [ ] `POST /api/simulations` continua publica.
- [ ] O escopo de dono e obrigatorio no tipo do repositorio.
- [ ] Ha teste de acesso negado para cada rota de projeto.
- [ ] Nenhuma rota nova de projeto pode ser escrita sem passar pelo escopo.

## 8. Quebra em issues

| Issue | Titulo | Branch | Tamanho |
| --- | --- | --- | --- |
| [issue-01](issue-01-autorizacao-rotas-projeto.md) | Autorizacao nas rotas de projeto | `feat/rnf06-autorizacao-rotas-projeto` | M |
| [issue-02](issue-02-testes-de-acesso-negado.md) | Testes de acesso negado e revisao da superficie | `chore/rnf06-testes-de-acesso-negado` | M |

## 9. Dependencias

- Depende inteiramente de RF14 (identidade) e de RF14-I02 (posse).
- Restringe RF07, RF08 e RF15.
- Bloqueia a publicacao com dados reais (RF01-I02).

## 10. Design

Ver [figma/WILL-BE-DONE.md](figma/WILL-BE-DONE.md).
