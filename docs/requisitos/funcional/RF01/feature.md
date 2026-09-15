# RF01 - Acesso integral por navegador, sem instalacao local

| Campo | Valor |
| --- | --- |
| ID | RF01 |
| Categoria | Requisito Funcional |
| Prioridade (MoSCoW) | Must Have |
| Epico | Distribuicao e acesso |
| Status | Parcial (roda em dev; falta publicacao) |
| Requisitos relacionados | RF09, RNF02, RNF03, RNF07 |

## 1. Enunciado

> A plataforma deve ser acessivel integralmente por navegador, sem exigir
> instalacao local.

## 2. O que e

E a premissa de distribuicao do TPLab: todo o fluxo de trabalho do estudante
(escrever Verilog, compilar, simular, ver formas de onda, gerenciar projetos)
acontece dentro de uma aba do navegador. Nenhum binario, toolchain, plugin ou
extensao precisa ser instalado na maquina do usuario. O `iverilog`/`vvp` existe
apenas no servidor, dentro do sandbox (RNF04).

Na pratica, RF01 se traduz em tres compromissos tecnicos:

1. o frontend e uma SPA estatica (React + Vite) servida por HTTP;
2. toda capacidade que exige toolchain nativa e exposta como API HTTP;
3. existe um endereco publico estavel onde a aplicacao esta no ar.

## 3. Para que serve

O levantamento do TCC identificou a barreira de instalacao (Vivado, Quartus,
ModelSim) como o principal atrito para quem tem o primeiro contato com HDL:
downloads de dezenas de GB, licencas, incompatibilidade de sistema operacional e
configuracao de PATH consomem a aula antes de qualquer aprendizado acontecer.
Eliminar a instalacao e o que permite que o professor diga "abram este link" e a
turma inteira esteja produtiva em segundos - o mesmo movimento que tornou o EDA
Playground uma referencia.

## 4. Impacto

**Para o usuario.** O tempo ate a primeira simulacao cai de horas para segundos.
Funciona no laboratorio da faculdade sem privilegio de administrador, em
Chromebook e em maquina pessoal, indiferente do sistema operacional.

**Na arquitetura.** Obriga a separacao cliente/servidor ja adotada: nada de
execucao de toolchain no navegador (WASM ficou fora do escopo por custo de
implementacao), nada de estado exclusivo em disco local. Reforca RNF07 (a
latencia de rede entra no orcamento dos 5 segundos) e RNF02/RNF03 (o navegador e
a plataforma-alvo, entao compatibilidade e responsividade viram requisitos
duros).

**No custo e na operacao.** Transfere para o servidor o custo de computacao de
toda a turma. E o que justifica a fila BullMQ e os limites de recurso por
execucao (RNF05).

**Risco se nao atendido.** Sem um endereco publico no ar, o TCC nao tem como ser
demonstrado nem avaliado por terceiros - RF01 e o requisito que transforma o
repositorio em produto.

## 5. Estado atual no repositorio

- SPA React + Vite ja existe (`apps/web`) e roda em `localhost:5173`.
- API Fastify em `localhost:3333`, com proxy `/api` configurado em
  `apps/web/vite.config.ts`, portanto sem CORS em desenvolvimento.
- `infra/docker-compose.yml` sobe postgres, redis, api e worker.
- **Falta**: build de producao publicado, dominio com TLS, CORS de producao,
  configuracao da URL da API por ambiente e verificacao de que a aplicacao abre
  em uma maquina limpa.
- **Bonus (fora da quebra em issues abaixo)**: a pagina "0 · Home" do Figma -
  material de marketing complementar, nao cobertura funcional de RF01 (ver
  [figma/WILL-BE-DONE.md](figma/WILL-BE-DONE.md)) - foi implementada em
  `apps/web/src/features/home/` (`HomePage`) como tela inicial da aplicacao.
  "Comecar a programar"/"Abrir o editor" levam direto ao workspace, sem
  barreira.

## 6. Escopo

**Dentro**

- Build de producao do frontend e publicacao em host estatico.
- Publicacao de API, worker, Redis e Postgres na VM, com HTTPS.
- Configuracao da origem da API por variavel de ambiente e CORS de producao.
- Checklist de verificacao "maquina limpa, so navegador".

**Fora**

- PWA e uso offline.
- Execucao da toolchain no navegador (WASM).
- CDN, autoescala e alta disponibilidade.

## 7. Criterios de aceite da feature

- [ ] Um usuario sem nenhuma dependencia instalada abre a URL publica e completa
      o fluxo escrever -> simular -> ver forma de onda.
- [ ] Nenhuma etapa do fluxo exige download, instalacao ou permissao especial.
- [ ] A aplicacao e servida por HTTPS e a API responde na origem publica.
- [ ] O `README.md` documenta a URL publica e o procedimento de deploy.

## 8. Quebra em issues

| Issue | Titulo | Branch | Tamanho |
| --- | --- | --- | --- |
| [issue-01](issue-01-build-producao-frontend.md) | Build de producao do frontend e configuracao por ambiente | `feat/rf01-build-producao-frontend` | P |
| [issue-02](issue-02-deploy-api-worker-vm.md) | Deploy da API, worker e infraestrutura na VM com HTTPS | `feat/rf01-deploy-api-worker-vm` | G |
| [issue-03](issue-03-verificacao-acesso-limpo.md) | Verificacao de acesso em maquina limpa e documentacao | `chore/rf01-verificacao-acesso-limpo` | P |

## 9. Dependencias

- Depende de RF03/RF04 funcionando fim a fim (nao ha o que publicar sem
  pipeline).
- Bloqueia RNF02 (teste cross-browser real) e RF15 (link publico so faz sentido
  com host publico).

## 10. Design

Sem tela propria. Ver [figma/WILL-BE-DONE.md](figma/WILL-BE-DONE.md).
