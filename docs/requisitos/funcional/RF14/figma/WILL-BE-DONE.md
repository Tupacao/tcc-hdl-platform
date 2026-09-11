# Design (Figma) - RF14

**Status: feito.** Arquivo:
[HDL Lab — Plataforma Educacional HDL (MVP)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-),
pagina "8 · Contas e acesso".

- [8.1 · Conta e compartilhamento (RF14 · RF15)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=63-2) -
  cabecalho sem conta (botao secundario "Entrar com Google"), cabecalho com
  conta (avatar + "sincronizado"), menu da conta.
- [8.4 · Entrar com Google — botão e estados (RF14)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=103-50)
  fecha o restante:
  - **Botao oficial** nos dois temas (44px de altura — minimo especificado
    pelo Google, mais restritivo que os 40px do sistema, "quando a regra
    externa e mais restritiva que a nossa, vale a externa"). Aviso no
    proprio frame: **a marca desenhada e aproximacao de prototipo** — a
    implementacao deve usar o SVG oficial do kit de marca do Google, sem
    recolorir nem alterar proporcao ou espacamento.
  - **Carregando e retorno do OAuth**: botao trava enquanto a aba do Google
    esta aberta; tela de retorno reaproveita a de carregamento inicial
    (2.6), porque o app ainda nao montou.
  - **Os tres erros**: "Voce cancelou o acesso", "O Google nao respondeu"
    (ambos com "Agora nao" / "Tentar de novo", nunca beco sem saida) e "Sua
    sessao expirou" (o unico vermelho, porque muda o estado do app — a acao
    primaria e "Entrar de novo").
  - **Dialogo "o que fazer com o trabalho local ao entrar"**: "Levar para a
    minha conta" / "Manter so neste navegador" / "Decidir depois" — nenhuma
    opcao apaga nada.
  - **Distincao local/nuvem na lista de projetos**: chip "☁ nuvem" por
    projeto sincronizado; contagem "7 na nuvem · 3 so neste navegador".

RF14 e o primeiro elo da cadeia critica do projeto (`RF07-I01 → RF14-I01 →
RF14-I02 → RNF06-I01 → RF01-I02`) — ver `docs/requisitos/README.md`.
