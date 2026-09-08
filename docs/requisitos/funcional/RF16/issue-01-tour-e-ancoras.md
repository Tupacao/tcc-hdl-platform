# RF16-I01 - Tour guiado, roteiro e ancoras

| Campo | Valor |
| --- | --- |
| Feature | [RF16](feature.md) |
| Branch | `feat/rf16-tour-e-ancoras` |
| Tamanho | M (aprox. 1 dia) |
| Depende de | RF09-I03 |

## Contexto

O workspace nao tem nenhuma ancora estavel para um tour se prender. Amarrar os
passos a seletores de classe do Tailwind e garantia de quebra silenciosa: as
classes mudam a cada ajuste de estilo, e so o primeiro acesso executa o tour -
ninguem percebe que ele apontou para o vazio.

## Objetivo

Implementar o tour de primeiro acesso com roteiro definido e ancoras que nao
quebrem com mudanca de estilo.

## Escopo tecnico

- `apps/web/package.json` - `driver.js`
- `apps/web/src/features/tour/steps.ts` (novo) - roteiro
- `apps/web/src/features/tour/use-tour.ts` (novo)
- `apps/web/src/features/workspace/` - atributos de ancora

## Passo a passo

1. Avaliar e instalar `driver.js`, medindo o impacto no bundle. E uma biblioteca
   pequena, mas o registro do peso segue o padrao adotado para as demais
   dependencias de interface.
2. Marcar as ancoras com atributo dedicado (`data-tour="editor"`,
   `"file-tabs"`, `"run-button"`, `"console"`, `"waveform"`,
   `"theme-toggle"`), nos componentes correspondentes. Atributo semantico proprio
   nao muda quando o estilo muda.
3. Escrever o roteiro em um modulo unico, cada passo com ancora, titulo, texto e
   posicionamento preferido. Ordem sugerida:
   1. boas-vindas e o que da para fazer aqui;
   2. o editor e o codigo de exemplo ja carregado;
   3. as abas: design e testbench, e o papel de cada um;
   4. o botao executar - compila e simula no servidor;
   5. o console: mensagens de erro clicaveis que levam a linha;
   6. as formas de onda;
   7. onde encontrar a documentacao completa (RF11) e como reabrir o tour.
4. Textos curtos, em portugues, uma ideia por passo, consistentes com o guia de
   RF11-I02.
5. Verificar a existencia de cada ancora antes de iniciar: ancora ausente e
   passo pulado, com aviso no console em desenvolvimento - o tour nunca quebra a
   aplicacao.
6. Iniciar apenas depois de a interface estar pronta, incluindo o Monaco, que
   carrega de forma assincrona - destacar um editor ainda em "Carregando
   editor..." e pior que nao destacar.
7. Acessibilidade: foco preso no balao enquanto o tour roda, `Esc` encerra,
   `Tab` circula pelas acoes do balao, e o foco volta ao ponto de origem ao
   terminar. Balao com `role="dialog"` e `aria-labelledby`.
8. Estilizar com os tokens de tema, funcionando nos dois modos.
9. Testar em 1024px, a largura mais apertada (RNF03).

## Criterios de aceite

- [ ] O tour percorre os passos do roteiro na ordem.
- [ ] Todas as ancoras usam `data-tour`, nenhuma usa classe de estilo.
- [ ] Ancora ausente e pulada sem quebrar nada.
- [ ] O tour so inicia com a interface pronta, incluindo o editor.
- [ ] `Esc` encerra e devolve o foco ao ponto de origem.
- [ ] O balao e navegavel por teclado e anunciado como dialogo.
- [ ] Funciona nos dois temas e em 1024px.
- [ ] Os textos sao consistentes com o guia de RF11.

## Verificacao

```bash
pnpm typecheck
pnpm --filter @tplab/web build
```

Manual: percorrer o tour inteiro so com teclado; remover uma ancora do codigo e
confirmar que o passo e pulado.

## Riscos

- Iniciar antes do Monaco carregar destaca um retangulo vazio; esperar o editor
  montar e parte do requisito, nao um detalhe.
- O recorte de destaque do `driver.js` interage mal com elementos de posicao
  fixa e com paineis redimensionaveis; validar com os divisores em posicoes
  diferentes.
