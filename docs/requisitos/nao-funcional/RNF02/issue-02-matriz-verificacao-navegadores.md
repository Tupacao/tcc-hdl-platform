# RNF02-I02 - Matriz de verificacao entre navegadores

| Campo | Valor |
| --- | --- |
| Feature | [RNF02](feature.md) |
| Branch | `chore/rnf02-matriz-verificacao-navegadores` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RNF02-I01, RF01-I02 |

## Contexto

Declarar o alvo nao prova nada: a compatibilidade so e conhecida quando alguem
abre a aplicacao nos quatro navegadores e percorre o fluxo. O projeto nao tem
teste de frontend, e montar automacao entre navegadores nao cabe no prazo do TCC.

A alternativa realista e uma matriz manual, executada em marcos definidos, com o
resultado registrado - o que tambem produz evidencia citavel no trabalho.

O Safari e o caso mais dificil: exige macOS. Sem acesso a um, isso precisa ser
resolvido (emprestimo, laboratorio, servico de teste) ou declarado como limitacao
conhecida - nao ignorado.

## Objetivo

Verificar o fluxo completo nos quatro navegadores e registrar o resultado.

## Escopo tecnico

- `docs/COMPATIBILIDADE.md` (novo) - matriz e resultados
- `README.md` - referencia ao documento
- Correcoes pontuais nos componentes afetados

## Passo a passo

1. Escrever o roteiro de verificacao cobrindo o fluxo inteiro:
   1. abrir a aplicacao e conferir que o editor carrega;
   2. digitar codigo, incluindo acentuacao e caracteres especiais;
   3. alternar entre as abas de arquivo, preservando cursor e scroll;
   4. executar a simulacao e acompanhar os estados;
   5. clicar num diagnostico e conferir a navegacao ate a linha;
   6. inspecionar as formas de onda: zoom, deslocamento, cursor;
   7. alternar o tema nos tres modos;
   8. arrastar os divisores dos paineis;
   9. exportar um projeto e conferir o download;
   10. entrar com Google e sair, quando RF14 existir;
   11. percorrer o fluxo principal apenas com teclado.
2. Montar a matriz com uma coluna por navegador e uma linha por item, com espaco
   para observacoes.
3. Executar em Chrome, Firefox e Edge no Windows, e Safari no macOS. Registrar
   versao exata de cada um e a data.
4. Prestar atencao especial aos pontos de risco listados em RNF02: workers do
   Monaco e do parser de VCD, nitidez do canvas com `devicePixelRatio`,
   `localStorage` no Safari, download de `.zip` e comportamento de cookie no
   login.
5. Registrar cada divergencia com evidencia (captura de tela, mensagem de
   console) e classificar: impeditivo, degradacao aceitavel ou cosmetico.
6. Corrigir os impeditivos nesta issue; abrir issue para os demais.
7. Definir quando a matriz deve ser reexecutada - antes da entrega e apos
   qualquer mudanca em editor, canvas ou autenticacao.
8. Se o Safari nao puder ser testado, registrar isso explicitamente como
   limitacao conhecida, no `README.md` e no texto do TCC.

## Criterios de aceite

- [ ] `docs/COMPATIBILIDADE.md` traz a matriz preenchida, com versoes e data.
- [ ] Os quatro navegadores foram verificados, ou a ausencia esta declarada.
- [ ] Cada divergencia esta registrada e classificada.
- [ ] Nenhum defeito impeditivo permanece nos navegadores do alvo.
- [ ] O fluxo por teclado foi verificado em todos.
- [ ] O criterio de reexecucao esta documentado.

## Verificacao

A verificacao desta issue e a propria execucao da matriz, sobre a URL publica de
RF01-I02.

```bash
pnpm --filter @tplab/web build
pnpm --filter @tplab/web preview
```

## Riscos

- Testar apenas em desenvolvimento esconde defeito que so aparece no build de
  producao (chunks, workers, CSP); a matriz precisa rodar contra o build
  publicado.
- Verificacao manual sem registro nao tem valor de evidencia; a matriz preenchida
  e o entregavel, nao o ato de testar.
- Sem acesso a macOS, o item mais arriscado fica descoberto; resolver ou declarar,
  nunca omitir.
