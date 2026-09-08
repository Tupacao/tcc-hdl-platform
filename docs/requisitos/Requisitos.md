# Requisitos da Plataforma Web Educacional para HDL

Documento consolidado com todos os requisitos do MVP, organizados segundo o método
de priorização **MoSCoW** (Must Have, Should Have, Could Have, Won't Have).

---

## 1. Requisitos Funcionais

### 1.1 Must Have (núcleo do MVP)

| ID | Descrição |
|---|---|
| RF01 | A plataforma deve ser acessível integralmente por navegador, sem exigir instalação local. |
| RF02 | A plataforma deve fornecer um editor de código Verilog com destaque de sintaxe. |
| RF03 | A plataforma deve compilar o código HDL submetido pelo usuário em um ambiente de execução no lado do servidor. |
| RF04 | A plataforma deve executar a simulação do circuito descrito a partir de um testbench fornecido pelo usuário. |
| RF05 | A plataforma deve apresentar mensagens de erro de compilação de forma contextualizada, indicando a linha correspondente no código-fonte. |
| RF06 | A plataforma deve exibir as formas de onda resultantes da simulação em um visualizador gráfico interativo. |
| RF07 | O usuário deve poder criar, listar, abrir, renomear e excluir seus projetos. |
| RF08 | O usuário deve poder exportar seus projetos em formato compactado, contendo o código-fonte e o testbench. |
| RF09 | O editor de código, o compilador, o simulador e o visualizador de formas de onda devem ser integrados em uma única interface. |
| RF10 | A plataforma deve oferecer alternância entre os modos claro e escuro. |
| RF11 | A plataforma deve disponibilizar documentação estática contendo guia de início rápido e referência básica de sintaxe. |

### 1.2 Should Have

| ID | Descrição |
|---|---|
| RF12 | A plataforma deve permitir a modelagem visual de circuitos digitais combinacionais por meio de um editor baseado em blocos lógicos, à semelhança do CircuitVerse. |
| RF13 | A plataforma deve gerar código Verilog equivalente a partir do circuito modelado visualmente. |
| RF14 | A plataforma deve oferecer autenticação por meio de conta Google, de forma opcional, para persistência dos projetos na nuvem. |
| RF15 | A plataforma deve gerar links públicos de compartilhamento de projetos. |
| RF16 | A plataforma deve fornecer um tutorial guiado de primeiro acesso apresentando o fluxo básico de utilização. |
| RF17 | A plataforma deve disponibilizar um mecanismo de envio de feedback pelos usuários. |

### 1.3 Could Have

| ID | Descrição |
|---|---|
| RF18 | A plataforma deve oferecer sugestões de autocompletar para palavras-chave da linguagem Verilog. |
| RF19 | A plataforma deve coletar métricas anônimas de uso para fins de validação da proposta. |
| RF20 | A plataforma deve disponibilizar projetos de exemplo pré-carregados, como somador, multiplexador e contador. |
| RF21 | O editor visual de circuitos deve suportar componentes sequenciais básicos, como flip-flops. |

---

## 2. Requisitos Não Funcionais

| ID | Descrição |
|---|---|
| RNF01 | A interface deve seguir princípios de simplicidade e ser orientada a usuários iniciantes. |
| RNF02 | A plataforma deve ser compatível com as versões recentes dos principais navegadores (Chrome, Firefox, Edge e Safari). |
| RNF03 | A interface deve ser responsiva, com resolução mínima recomendada de 1024 pixels de largura. |
| RNF04 | O código submetido pelo usuário deve ser executado em ambiente isolado por meio de contêineres, garantindo a segurança do servidor. |
| RNF05 | Cada execução de simulação deve possuir limites de tempo e de consumo de memória previamente definidos. |
| RNF06 | A plataforma deve implementar mecanismos de autenticação e autorização para o acesso a projetos privados. |
| RNF07 | Simulações de baixa complexidade devem apresentar resposta em tempo inferior a cinco segundos, em condições normais de operação. |
| RNF08 | A arquitetura da plataforma deve ser modular, permitindo a integração futura com serviços de síntese lógica e gravação em dispositivos FPGA. |
| RNF09 | A interface deve atender ao nível AA das diretrizes WCAG para contraste de cores, em ambos os modos de exibição. |

---

## 3. Escopo Excluído do MVP (Won't Have)

| Área | Item |
|---|---|
| Síntese lógica | Síntese, posicionamento, roteamento e geração de bitstream. |
| Hardware físico | Gravação em dispositivos FPGA e integração com laboratórios remotos. |
| Linguagens adicionais | Suporte completo a VHDL e SystemVerilog. |
| Inteligência artificial | Assistente baseado em LLM para geração, explicação e correção de código HDL. |
| Depuração avançada | Breakpoints, execução passo a passo e inspeção de sinais internos. |
| Colaboração | Edição colaborativa em tempo real. |
| Gestão educacional | Recursos de turmas, notas, trilhas de aprendizagem e perfis diferenciados de professor e aluno. |
| Internacionalização | Suporte a idiomas adicionais além do português. |

---

## 4. Contexto e Justificativa

Os requisitos foram derivados da análise comparativa de ferramentas HDL (Vivado,
Quartus Prime, ModelSim/Questa, GHDL, Icarus Verilog, EDA Playground, SHDL e
CircuitVerse), realizada sob três dimensões: **usabilidade**, **aspectos técnicos**
e **aspectos econômicos**. A plataforma proposta adota como principais referências:

- **EDA Playground** — acessibilidade via navegador, compilação e simulação sem instalação local.
- **SHDL** — abordagem didática de abstração e geração de código VHDL/Verilog limpo.
- **CircuitVerse** — interação visual com circuitos lógicos e recursos colaborativos.

O escopo do MVP foi controlado via método MoSCoW para viabilizar a implementação em
um prazo aproximado de um mês, adiando funcionalidades avançadas (síntese física,
integração FPGA, suporte multilíngue de HDL, IA generativa) para trabalhos futuros,
mantendo, porém, a arquitetura preparada para essa evolução modular (RNF08).