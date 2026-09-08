# RF15 - Links publicos de compartilhamento de projetos

| Campo | Valor |
| --- | --- |
| ID | RF15 |
| Categoria | Requisito Funcional |
| Prioridade (MoSCoW) | Should Have |
| Epico | Contas e acesso |
| Status | Nao implementado |
| Requisitos relacionados | RF07, RF14, RF08, RNF06 |

## 1. Enunciado

> A plataforma deve gerar links publicos de compartilhamento de projetos.

## 2. O que e

Uma URL que abre um projeto para quem nao e o dono e, dependendo da politica
escolhida, nem esta logado. O dono aciona "compartilhar" e recebe um endereco
como `https://tplab.exemplo/p/aG7kQ2x` que pode colar em um e-mail, no Moodle ou
em uma mensagem.

Duas decisoes definem a feature:

1. **como o link autoriza** - um token opaco e nao adivinhavel na URL, e nao o id
   do projeto (que e sequencialmente descobrivel e usado nas rotas privadas);
2. **o que o visitante pode fazer** - ver, executar e derivar uma copia propria,
   mas nunca alterar o original.

## 3. Para que serve

Tres usos concretos no contexto do TCC:

- **Aula.** O professor prepara um exercicio e distribui um link; a turma abre e
  ja tem o codigo na tela, sem cadastro.
- **Ajuda.** O aluno com um erro que nao entende manda o link em vez de colar
  codigo no chat - quem ajuda ve exatamente o mesmo estado.
- **Demonstracao.** O proprio TCC pode citar um link vivo na defesa.

E o mesmo movimento que consolidou o EDA Playground como referencia: o valor esta
menos em editar e mais em conseguir mostrar.

## 4. Impacto

**Para o usuario.** Colaboracao assincrona sem infraestrutura: nada de anexar
arquivo, nada de exigir conta de quem vai apenas olhar.

**Na seguranca.** E o unico ponto do sistema que expoe dado deliberadamente, e
por isso o mais sensivel:

- o token precisa ser longo e aleatorio - id sequencial ou UUID do projeto na URL
  transforma "compartilhar um" em "expor todos";
- o compartilhamento tem de ser reversivel, e revogar precisa valer na hora;
- a rota publica nao pode devolver dado do dono (e-mail, nome) junto do projeto;
- executar simulacao a partir de um link publico consome o mesmo recurso caro de
  RF03 - o rate limit precisa cobrir esse caminho.

**Na arquitetura.** Uma rota publica, fora do escopo de sessao de RNF06, que le
por token em vez de por dono. E a excecao a regra de autorizacao, e por isso
precisa estar isolada e explicita.

**Na relacao com RF08.** Sao as duas saidas da plataforma: exportar leva os
arquivos, compartilhar leva o estado vivo.

## 5. Estado atual no repositorio

- Nao ha nocao de compartilhamento, token ou visibilidade em
  `packages/shared/src/schemas/project.ts`.
- Todas as rotas de projeto sao igualmente abertas hoje - nao ha distincao entre
  publico e privado porque nao ha autorizacao nenhuma.
- Nao ha roteamento no frontend, entao nao ha como uma URL abrir um projeto
  especifico.
- **Falta**: tudo.

## 6. Escopo

**Dentro**

- Token de compartilhamento por projeto, gerado sob demanda e revogavel.
- Rota publica de leitura por token, sem exigir sessao.
- Interface de compartilhar: gerar, copiar, revogar.
- Visualizacao do projeto compartilhado, com opcao de criar uma copia propria.

**Fora**

- Compartilhamento com permissao de edicao.
- Edicao colaborativa em tempo real (Won't Have).
- Compartilhar com pessoas ou grupos especificos.
- Expiracao automatica programada, estatisticas de acesso.

## 7. Criterios de aceite da feature

- [ ] O dono gera um link e copia com um clique.
- [ ] Abrir o link em janela anonima carrega o projeto sem exigir login.
- [ ] O visitante consegue executar a simulacao e ver as formas de onda.
- [ ] O visitante nao consegue alterar o projeto original.
- [ ] O visitante pode criar uma copia propria (com conta).
- [ ] Revogar invalida o link imediatamente.
- [ ] O token nao e derivavel do id do projeto.
- [ ] A rota publica nao expoe dado pessoal do dono.

## 8. Quebra em issues

| Issue | Titulo | Branch | Tamanho |
| --- | --- | --- | --- |
| [issue-01](issue-01-token-e-rota-publica.md) | Token de compartilhamento e rota publica | `feat/rf15-token-e-rota-publica` | M |
| [issue-02](issue-02-interface-compartilhar-e-visualizar.md) | Interface de compartilhar e pagina do projeto compartilhado | `feat/rf15-interface-compartilhar-e-visualizar` | M |

## 9. Dependencias

- Depende de RF07 (projeto persistido) e, para fazer sentido, de RF14/RNF06 -
  sem dono e sem autorizacao, tudo ja e publico e o link nao acrescenta nada.
- Depende de RF01-I02 (endereco publico estavel).

## 10. Design

Ver [figma/WILL-BE-DONE.md](figma/WILL-BE-DONE.md).
