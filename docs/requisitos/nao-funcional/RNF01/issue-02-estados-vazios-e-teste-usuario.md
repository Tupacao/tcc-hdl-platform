# RNF01-I02 - Estados vazios e verificacao com usuarios

| Campo | Valor |
| --- | --- |
| Feature | [RNF01](feature.md) |
| Branch | `chore/rnf01-estados-vazios-e-teste-usuario` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RNF01-I01 |

## Contexto

"Simples para iniciantes" nao se verifica por inspecao de quem construiu a
ferramenta: quem escreveu o codigo sempre acha a interface obvia. A unica
verificacao valida e observar alguem do publico-alvo usando pela primeira vez.

Para o TCC isso tem valor duplo: a observacao vira dado do capitulo de
resultados, ao lado de RF17 (feedback) e RF19 (metricas).

Os estados vazios entram na mesma issue porque sao o que o usuario ve primeiro:
o console e o painel de ondas comecam vazios em toda sessao.

## Objetivo

Padronizar os estados vazios da plataforma e verificar o fluxo principal com
pessoas do publico-alvo.

## Escopo tecnico

- `apps/web/src/features/workspace/console-panel.tsx`
- `apps/web/src/features/workspace/waveform-panel.tsx`
- `apps/web/src/features/projects/`, `features/docs/` - quando existirem
- `docs/VERIFICACAO-USUARIOS.md` (novo) - roteiro e resultados

## Passo a passo

1. Inventariar todos os estados vazios existentes e previstos: console antes da
   primeira execucao, ondas sem `.vcd`, lista de projetos vazia, busca sem
   resultado, resultado sem diagnostico.
2. Aplicar a mesma estrutura a todos, conforme o design de RNF01: o que e este
   espaco, por que esta vazio, o que fazer agora. O `WaveformPanel` ja segue esse
   padrao ao explicar `$dumpfile`/`$dumpvars` - usa-lo como referencia.
3. Extrair um componente comum de estado vazio, para que consistencia deixe de
   depender de disciplina e passe a ser estrutural.
4. Escrever o roteiro de verificacao: tarefas objetivas, sem instrucao de como
   fazer. Por exemplo: "execute o codigo que esta na tela e diga se funcionou";
   "descubra o que significa a mensagem vermelha"; "faca o sinal `sum` aparecer
   no grafico".
5. Recrutar de tres a cinco pessoas do publico-alvo - estudantes que tiveram
   pouco ou nenhum contato com HDL. Cinco e suficiente para revelar os problemas
   mais frequentes.
6. Observar sem ajudar. Registrar onde cada pessoa hesita, o que interpreta
   errado e o que desiste de procurar. Anotar o tempo ate a primeira simulacao
   bem-sucedida.
7. Consolidar em `docs/VERIFICACAO-USUARIOS.md`: metodo, participantes (sem
   identificacao), tarefas, observacoes e conclusoes.
8. Transformar cada dificuldade recorrente em ajuste imediato ou em issue
   registrada. Dificuldade observada e nao registrada e trabalho perdido.

## Criterios de aceite

- [ ] Todos os estados vazios usam o componente comum e a mesma estrutura.
- [ ] Nenhum estado vazio apenas informa que esta vazio.
- [ ] O roteiro de verificacao esta escrito e e livre de instrucao embutida.
- [ ] Ao menos tres pessoas do publico-alvo executaram o roteiro.
- [ ] As observacoes estao registradas em `docs/VERIFICACAO-USUARIOS.md`.
- [ ] Cada dificuldade recorrente virou ajuste ou issue.
- [ ] O tempo ate a primeira simulacao bem-sucedida esta registrado.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

A verificacao principal desta issue nao e automatizada: e a sessao de observacao
com usuarios e o documento que ela produz.

## Riscos

- Ajudar durante a observacao invalida o resultado; a instrucao ao observador e
  so anotar, mesmo quando a pessoa trava.
- Testar com colegas que ja conhecem HDL mede a coisa errada; o recrutamento
  precisa respeitar o publico-alvo.
- Fazer a verificacao cedo demais, antes de RF11 e RF16, mede uma plataforma
  incompleta; agendar depois deles, ou registrar a limitacao no documento.
