# Design (Figma) - RF17

**Status: feito.** Arquivo:
[HDL Lab — Plataforma Educacional HDL (MVP)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-),
pagina "10 · Avulsos".

- [10.1 · Feedback e métricas anônimas (RF17 · RF19)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=69-2) -
  ponto de acesso na barra de estado (nunca botao flutuante); formulario com
  tipo (Algo quebrou / Tenho uma sugestao / Esta funcionando bem), mensagem
  e interruptor de contexto tecnico.
- [10.5 · Feedback — validação, envio e limites (RF17)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=111-2)
  fecha as quatro coisas que faltavam:
  - **Contexto tecnico expandido**: lista item a item do que vai junto
    (navegador, tela, projeto, ultima execucao, saida do compilador,
    identificador de sessao anonimo) — o interruptor sozinho pedia confianca
    cega; a lista mostra exatamente o que sai, inclusive a saida do
    compilador, o dado mais util e o mais pessoal que alguem poderia supor
    que fosse enviado. O codigo do circuito nunca vai junto.
  - **Validacao**: so aparece depois da primeira tentativa de enviar, nunca
    enquanto a pessoa digita ("Conte um pouco mais…", contador de
    caracteres, botao so acende a partir de 20 caracteres).
  - **Estados de envio**: Enviando (botao trava, dialogo nao fecha) →
    Obrigado — recebido (fecha sozinho em 2s) ou Nao foi possivel enviar
    (texto continua no campo, "Tentar de novo"). Em nenhum o texto e apagado
    antes da confirmacao do servidor.
  - **Limite de envios atingido**: "Voce ja enviou 5 mensagens hoje", zera
    no dia seguinte. O limite e por sessao anonima, nao por pessoa —
    proposital e frouxo, porque o custo de bloquear um relato legitimo e
    maior que o de receber uma mensagem repetida.

Ambos os temas.
