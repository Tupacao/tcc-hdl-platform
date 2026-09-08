# RNF02 - Compatibilidade com Chrome, Firefox, Edge e Safari

| Campo | Valor |
| --- | --- |
| ID | RNF02 |
| Categoria | Requisito Nao Funcional |
| Prioridade (MoSCoW) | Must Have |
| Epico | Distribuicao e acesso |
| Status | Nao verificado |
| Requisitos relacionados | RF01, RF06, RF10, RNF03 |

## 1. Enunciado

> A plataforma deve ser compativel com as versoes recentes dos principais
> navegadores (Chrome, Firefox, Edge e Safari).

## 2. O que e

O compromisso de que o fluxo completo - escrever, executar, ler diagnosticos, ver
formas de onda - funciona igualmente nos quatro navegadores citados, em suas
versoes recentes.

"Recentes" precisa de definicao operacional. A proposta, coerente com o alvo de
build do Vite: as duas ultimas versoes maiores de cada navegador, o que na
pratica cobre o parque de maquinas de laboratorio e os aparelhos pessoais dos
alunos.

Safari merece atencao separada: e o unico com motor diferente (WebKit), e o unico
que nao roda em Windows ou Linux, e historicamente o que mais atrasa a adocao de
APIs.

## 3. Para que serve

RNF02 e a condicao para RF01 nao ser uma meia-verdade. "Acessivel por navegador"
so vale se for pelo navegador que a pessoa tem. Num laboratorio a instituicao
escolhe; num Mac pessoal o padrao e Safari.

Sem verificacao, o risco e concreto e conhecido: uma API usada sem checagem,
funcional no Chrome, que quebra o Safari sem erro visivel - e a plataforma
simplesmente nao funciona para parte da turma.

## 4. Impacto

**Para o usuario.** Nao precisar trocar de navegador para usar a ferramenta.

**Na escolha de tecnologia.** Restringe o que pode ser usado. Os pontos de risco
concretos deste projeto:

- **Monaco Editor** - suportado nos quatro, mas com diferencas de comportamento
  de teclado e de IME no Safari.
- **Web Worker** - o worker do Monaco (`editor.worker?worker`) e o worker do
  parser de VCD (RF06-I04) dependem do empacotamento do Vite.
- **Canvas 2D** com `devicePixelRatio` (RF06-I02) - diferencas de nitidez e de
  medicao de texto entre motores.
- **`localStorage` / `sessionStorage`** - o Safari e mais restritivo, e apaga
  dados de sites pouco visitados.
- **Cookies de terceiros e `SameSite`** (RF14) - o Safari bloqueia por padrao o
  que os outros permitem; e a fonte mais provavel de quebra no login.
- **`URL.createObjectURL` e `<a download>`** (RF08) - comportamento de download
  varia.

**Na verificacao.** Testar em quatro navegadores manualmente e caro e repetitivo,
e nao ha suite de testes de frontend no projeto. A alternativa realista para o
prazo do TCC e uma matriz manual documentada, executada em marcos definidos.

## 5. Estado atual no repositorio

- `apps/web/vite.config.ts` nao define `build.target` nem `browserslist` - vale o
  padrao do Vite (`baseline-widely-available`, que cobre navegadores recentes,
  mas nao esta declarado nem verificado).
- Nao ha teste de navegador, nem manual nem automatizado.
- Nao ha registro de qual navegador foi usado no desenvolvimento.
- O MCP `chrome-devtools` esta configurado em `.mcp.json`, o que ajuda no Chrome
  e nao cobre os demais.
- **Falta**: declarar o alvo, verificar e registrar.

## 6. Escopo

**Dentro**

- Definicao explicita dos navegadores e versoes suportados.
- Configuracao do alvo de build coerente com essa definicao.
- Matriz de verificacao manual do fluxo completo.
- Registro dos resultados e das limitacoes conhecidas.

**Fora**

- Suporte a navegadores antigos (Internet Explorer, versoes fora do alvo).
- Navegadores moveis (RNF03 limita a plataforma a 1024px).
- Testes automatizados entre navegadores.
- Correcao de defeito exclusivo de navegador fora do alvo.

## 7. Criterios de aceite da feature

- [ ] Os navegadores e versoes suportados estao declarados no `README.md`.
- [ ] O alvo de build do Vite corresponde a essa declaracao.
- [ ] O fluxo completo foi verificado nos quatro navegadores.
- [ ] O editor, o console e as formas de onda funcionam nos quatro.
- [ ] O tema claro/escuro funciona nos quatro.
- [ ] As limitacoes conhecidas estao documentadas.
- [ ] A plataforma avisa quando aberta em navegador fora do alvo.

## 8. Quebra em issues

| Issue | Titulo | Branch | Tamanho |
| --- | --- | --- | --- |
| [issue-01](issue-01-alvo-de-build-e-suporte.md) | Declaracao do alvo de build e navegadores suportados | `chore/rnf02-alvo-de-build-e-suporte` | P |
| [issue-02](issue-02-matriz-verificacao-navegadores.md) | Matriz de verificacao entre navegadores | `chore/rnf02-matriz-verificacao-navegadores` | M |

## 9. Dependencias

- Depende de RF01-I02 (URL publica) para verificar em maquinas de terceiros,
  especialmente macOS.
- Verifica RF06 e RF10 nos quatro navegadores.

## 10. Design

Ver [figma/WILL-BE-DONE.md](figma/WILL-BE-DONE.md).
