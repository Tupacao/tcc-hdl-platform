# RF19 - Coleta de metricas anonimas de uso

| Campo | Valor |
| --- | --- |
| ID | RF19 |
| Categoria | Requisito Funcional |
| Prioridade (MoSCoW) | Could Have |
| Epico | Validacao da proposta |
| Status | Nao implementado |
| Requisitos relacionados | RF17, RF03, RNF06, RNF07 |

## 1. Enunciado

> A plataforma deve coletar metricas anonimas de uso para fins de validacao da
> proposta.

## 2. O que e

Registro de eventos de uso, sem identificar quem os produziu, para responder
perguntas objetivas sobre a plataforma no capitulo de resultados do TCC:

- quantas simulacoes foram executadas, e quantas terminaram com erro de
  compilacao?
- quanto tempo leva uma simulacao tipica (a evidencia direta de RNF07)?
- quais funcionalidades sao efetivamente usadas - abas, temas, formas de onda,
  exportacao?
- em que ponto as pessoas param?

"Anonimas" e a restricao central: sem identificador de pessoa, sem IP em claro,
sem conteudo de codigo. O que se mede e comportamento agregado, nao usuario.

## 3. Para que serve

Um TCC que propoe uma plataforma precisa de evidencia de que ela funciona e e
usada. Sem numero, o capitulo de resultados vira relato de intencao.

RF19 e a metade quantitativa dessa evidencia; RF17 (feedback) e a qualitativa.
Juntas sustentam afirmacoes como "a mediana das simulacoes ficou em X ms, abaixo
do limite de cinco segundos previsto em RNF07".

Ha tambem uso operacional: taxa de erro por tipo revela onde a ferramenta
confunde, e a distribuicao de duracao dimensiona os limites de RF03.

## 4. Impacto

**Para o usuario.** Idealmente nenhum: a coleta e invisivel, nao atrasa a
interface e nao muda o comportamento.

**Na privacidade.** E o ponto mais sensivel. As regras que precisam valer:

- nunca coletar o codigo submetido - so tamanho, tempo e desfecho;
- nunca guardar identificador estavel de pessoa ou de navegador;
- IP apenas em hash com sal, se for necessario, ou nem isso;
- deixar claro na interface o que e coletado, com forma de recusar.

Para um trabalho academico com usuarios reais, isso nao e detalhe: e a diferenca
entre coleta legitima e coleta indevida.

**Na arquitetura.** Duas fontes possiveis: eventos do servidor (a fila e o worker
ja sabem tudo sobre simulacao) e eventos do cliente (o que so o navegador ve).
Comecar pelo servidor e mais barato e mais confiavel - RF03-I04 ja instrumenta o
worker, e boa parte do dado necessario nasce ali.

**No custo.** Desprezivel usando o Postgres existente. Introduzir servico externo
de analytics acrescentaria custo, dependencia e problema de privacidade.

## 5. Estado atual no repositorio

- Nao ha coleta de metrica, evento ou telemetria em nenhum lugar.
- Nao ha ferramenta de analytics no frontend - o que e um bom ponto de partida.
- `SimulationResultSchema` ja carrega `durationMs` e `failure`, os dois campos
  mais importantes.
- RF03-I04 preve logs estruturados e contadores no worker, com sobreposicao
  direta com esta feature.
- **Falta**: tudo.

## 6. Escopo

**Dentro**

- Catalogo explicito de eventos, com o que cada um carrega.
- Coleta no servidor a partir do pipeline de simulacao.
- Coleta minima no cliente, para o que so o navegador observa.
- Aviso ao usuario e opcao de recusa.
- Consulta agregada para o texto do TCC.

**Fora**

- Ferramenta externa de analytics.
- Identificacao de usuario, mesmo pseudonima.
- Gravacao de sessao, mapa de calor ou captura de tela.
- Painel de metricas em tempo real.

## 7. Criterios de aceite da feature

- [ ] Cada simulacao registra desfecho e duracao, sem qualquer identificador de
      pessoa.
- [ ] Nenhum evento carrega codigo do usuario.
- [ ] Existe aviso acessivel do que e coletado, com opcao de recusar.
- [ ] Recusar impede a coleta no cliente e nao afeta o uso.
- [ ] E possivel responder as perguntas da secao 2 com uma consulta.
- [ ] A coleta nao atrasa a interface nem a resposta da API.
- [ ] Nenhum servico externo recebe dado.

## 8. Quebra em issues

| Issue | Titulo | Branch | Tamanho |
| --- | --- | --- | --- |
| [issue-01](issue-01-eventos-e-coleta.md) | Catalogo de eventos e coleta anonima | `feat/rf19-eventos-e-coleta` | M |
| [issue-02](issue-02-consentimento-e-relatorio.md) | Aviso, recusa e relatorio agregado | `feat/rf19-consentimento-e-relatorio` | M |

## 9. Dependencias

- Depende do Postgres (RF07-I01) e se apoia na instrumentacao de RF03-I04.
- Fornece a evidencia quantitativa de RNF07.

## 10. Design

Ver [figma/WILL-BE-DONE.md](figma/WILL-BE-DONE.md).
