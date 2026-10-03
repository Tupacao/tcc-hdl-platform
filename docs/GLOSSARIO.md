# Glossário da interface (RNF01-I01)

Um termo por conceito, em toda a interface, na documentação (RF11) e nas mensagens de erro da
API — o usuário não distingue a origem do texto. Fonte: Figma "1.3 · Tipografia, densidade e
glossário". **Antes de escrever texto novo visível ao usuário, consulte esta tabela.**

| Conceito                                      | Termo adotado     | Nunca usar                                  |
| --------------------------------------------- | ----------------- | ------------------------------------------- |
| Conjunto salvo de arquivos e metadados        | `projeto`         | sketch, arquivo, workspace                  |
| Arquivo que descreve o hardware               | `circuito`        | design, DUT, unidade sob teste              |
| Arquivo que exercita o circuito               | `testbench`       | banco de testes, teste, bancada             |
| Módulo instanciado pelo testbench             | `módulo principal`| top module, módulo de topo                  |
| Traduzir o código para forma executável       | `compilar`        | build, montar                               |
| Rodar o testbench e produzir os sinais        | `simular`         | rodar, testar                               |
| Ação única do usuário: compilar e simular     | `Executar`        | Rodar, Play, Compilar e simular             |
| Gráfico de sinais ao longo do tempo           | `forma de onda`   | waveform, gráfico, timing                   |
| Erro ou aviso vindo do compilador             | `erro` / `aviso`  | diagnóstico, issue, problema                |
| Painel que reúne erros e avisos               | `Problemas`       | Diagnósticos, Console de erros              |
| Saída textual bruta da execução               | `Console`         | terminal, log, output                       |

## Decisões

- **Um único botão primário, `Executar`.** Compilar e simular são fases dele e aparecem como
  estado do botão e da barra de estado ("Compilando…", "Simulando…"), nunca como dois botões:
  dois botões obrigariam o iniciante a saber que a compilação precede a simulação.
- **`testbench` fica em inglês**, explicado na primeira ocorrência (documentação, RF11):
  traduzi-lo ("banco de testes") confunde mais do que ajuda, pois é o termo das ferramentas.
- **"Diagnóstico" só existe no código** (`DiagnosticSchema`, `diagnostics.ts`); o usuário lê
  erro, aviso e Problemas.
- **"Executar" vs. "simular"**: executar é a ação do usuário; simular é a fase de rodar o
  testbench. "Rodar" não é usado nem como sinônimo informal.

## Critérios de redação

1. **Diz o que houve e qual o próximo passo.** "Falha ao executar a simulação" descreve;
   "O código enviado excede o limite. Reduza o tamanho dos arquivos e execute novamente" orienta.
2. Segunda pessoa, frases curtas, sem exclamação, sem culpar o usuário.
3. Preferir a palavra que o aluno já viu na disciplina; termo técnico inevitável é usado e
   explicado na primeira ocorrência.
4. Português com acentuação correta em todo texto novo ou tocado (`CLAUDE.md`).

## Como conferir

Mensagens da API ficam em `apps/api` (`app.ts`, `routes.ts`, `application/**/controller`,
`testbench.ts`, `hints.ts`) e de validação em `packages/shared/src/schemas`. Textos da interface
em `apps/web/src/features/*/utils/messages.ts` e `features/docs/content`. Uma busca por
`design`, `módulo de topo`, `diagnóstico`, `rodar`, `waveform` nesses lugares não deve
encontrar texto visível ao usuário.
