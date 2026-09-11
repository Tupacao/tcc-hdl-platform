# Design (Figma) - RNF06

**Status: feito.** Arquivo:
[HDL Lab — Plataforma Educacional HDL (MVP)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-),
pagina "8 · Contas e acesso".

[8.5 · Autorização e limites de acesso (RNF06 · RF15)](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=105-2)
cobre os quatro estados que faltavam, todos partindo do principio ja fechado
em [8.3](https://www.figma.com/design/DElDfWdhpc3CzHvGgmtFBf/HDL-Lab-%E2%80%94-Plataforma-Educacional-HDL--MVP-?node-id=85-2):
**a resposta nunca revela se o recurso existe, so que este usuario nao pode
chegar nele**.

- **Sessao necessaria**: "Entre para ver os projetos da nuvem" — nao e
  parede, a lista local continua a um clique ("Ver os locais"). RF14 e
  Should Have justamente porque a conta nunca pode ser condicao para usar a
  plataforma, nem depois de ela existir.
- **Projeto nao encontrado**: mesma redacao da tela 8.3, de proposito — "nao
  esta disponivel", nunca "nao existe" nem "voce nao tem permissao" (a
  segunda frase confirmaria que o projeto existe e e de outra pessoa).
  Acoes: "Ir para meus projetos" / "Criar um novo".
- **Acao indisponivel**: botoes Compartilhar/Exportar ficam **visiveis e
  desabilitados**, nao escondidos, com tooltip "So o dono pode compartilhar
  · Duplique para o seu navegador e o link passa a ser seu."
- **Duplicar para editar, sem conta nenhuma (RF15)**: fluxo "antes/depois"
  mostrando que duplicar nao pede conta, e-mail nem dialogo no meio — a
  copia fica pronta no navegador de quem clicou. **Decisao fechada**:
  duplicar nao exige conta; compartilhar exige, porque um link publico
  precisa de dono para poder ser revogado, e uma copia local de quem clicou
  nao precisa de nada — pedir cadastro ali seria no ponto de menor
  paciencia do funil.

Os frames de login em si pertencem a RF14 - ver
`docs/requisitos/funcional/RF14/figma/WILL-BE-DONE.md`.
