# RF14 - Autenticacao opcional por conta Google

| Campo | Valor |
| --- | --- |
| ID | RF14 |
| Categoria | Requisito Funcional |
| Prioridade (MoSCoW) | Should Have |
| Epico | Contas e acesso |
| Status | Nao implementado |
| Requisitos relacionados | RF07, RF15, RNF06, RF19 |

## 1. Enunciado

> A plataforma deve oferecer autenticacao por meio de conta Google, de forma
> opcional, para persistencia dos projetos na nuvem.

## 2. O que e

Login com Google via OAuth2, com duas caracteristicas que o enunciado fixa:

- **opcional**: a plataforma continua utilizavel sem conta. Escrever codigo,
  compilar, simular e ver formas de onda nao exigem login;
- **para persistencia**: o que a conta acrescenta e ter projetos que sobrevivem
  ao navegador e acompanham o usuario entre maquinas.

Google e a escolha por ser a conta que o publico universitario ja tem, e por
dispensar a plataforma de guardar senha - o que elimina a maior fonte de risco de
seguranca em um projeto deste porte.

## 3. Para que serve

Sem conta, "meus projetos" (RF07) e uma promessa vazia: os projetos ficam em uma
lista global, sem dono, visiveis para qualquer um. Login e o que da sentido a
posse, e o que permite RNF06 (autorizacao) e RF15 (compartilhar deliberadamente,
em vez de tudo ser publico por omissao).

Manter o acesso anonimo importa igualmente: o argumento central de RF01 e "abram
este link e comecem". Exigir login antes da primeira simulacao destruiria isso.

## 4. Impacto

**Para o usuario.** Trabalho preservado entre sessoes e dispositivos, com um
clique e sem criar mais uma senha.

**Na arquitetura.** Introduz sessao na API, que hoje e completamente sem estado.
Decisoes a tomar: onde a sessao vive (cookie assinado ou JWT), como o worker e as
rotas publicas convivem com isso, e como o frontend sabe quem esta logado.
Recomendacao: cookie `httpOnly`, `Secure` e `SameSite=Lax` - a alternativa
(guardar token no `localStorage`) e mais simples e mais exposta a XSS.

**No modelo de dados.** `Project` ganha dono. RF07-I01 ja preve a coluna
`ownerId` nullable justamente para que essa migracao nao exija reescrever a
tabela com dados em producao.

**Na privacidade.** Passa a haver dado pessoal (nome, e-mail, avatar) de
terceiros. Isso obriga a pensar em o que e guardado, por quanto tempo e como o
usuario apaga - questoes que nao existem enquanto tudo e anonimo, e que valem
mencao no texto do TCC.

**No custo.** OAuth do Google e gratuito no volume do projeto. Nao ha novo
servico a operar; a sessao pode usar o Redis que ja existe.

## 5. Estado atual no repositorio

- `apps/api/src/app.ts` registra `helmet`, `cors` e `rate-limit`; nao ha
  autenticacao, sessao ou cookie.
- Nao ha `@fastify/cookie`, `@fastify/session`, `@fastify/oauth2` nem Auth.js nas
  dependencias.
- `apps/api/src/config/env.ts` nao tem variavel de OAuth nem segredo de sessao.
- `ProjectSchema` nao tem dono; `GET /api/projects` lista tudo para todos.
- Nao ha nenhuma nocao de usuario no frontend.
- **Falta**: tudo.

## 6. Escopo

**Dentro**

- Fluxo OAuth2 com Google no backend, com sessao segura.
- Modelo de usuario e vinculo de projeto ao dono.
- Interface de entrar, sair e ver quem esta logado.
- Convivencia entre modo anonimo e modo autenticado, incluindo o que acontece
  com o trabalho local ao entrar.

**Fora**

- Login por e-mail e senha, ou por outros provedores.
- Perfis e permissoes diferenciadas (Won't Have: gestao educacional).
- Recuperacao de conta, exclusao de conta pela interface e portal de privacidade.
- Autorizacao propriamente dita (RNF06 trata disso; RF14 entrega a identidade).

## 7. Criterios de aceite da feature

- [ ] E possivel escrever codigo, simular e ver ondas sem nenhum login.
- [ ] Entrar com Google funciona e o usuario ve quem esta logado.
- [ ] Projetos criados apos o login pertencem ao usuario.
- [ ] Sair encerra a sessao de fato, no servidor.
- [ ] A sessao sobrevive a fechar e reabrir o navegador, dentro da validade.
- [ ] Trabalho local nao e perdido ao entrar - o usuario decide o que fazer com
      ele.
- [ ] Nenhum segredo de OAuth vai para o repositorio ou para o bundle.

## 8. Quebra em issues

| Issue | Titulo | Branch | Tamanho |
| --- | --- | --- | --- |
| [issue-01](issue-01-oauth-google-sessao.md) | Fluxo OAuth2 com Google e sessao | `feat/rf14-oauth-google-sessao` | G |
| [issue-02](issue-02-modelo-usuario-posse-projeto.md) | Modelo de usuario e posse dos projetos | `feat/rf14-modelo-usuario-posse-projeto` | M |
| [issue-03](issue-03-interface-login-modo-anonimo.md) | Interface de login e convivencia com o modo anonimo | `feat/rf14-interface-login-modo-anonimo` | M |

## 9. Dependencias

- Depende de RF07-I01 (persistencia) e de RF01-I02 (HTTPS: OAuth exige origem
  segura e cookie `Secure`).
- Bloqueia RNF06 (autorizacao) e RF15 (compartilhamento com dono definido).

## 10. Design

Ver [figma/WILL-BE-DONE.md](figma/WILL-BE-DONE.md).
