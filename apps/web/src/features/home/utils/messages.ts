/** Textos fixos de interface da feature home — nao deixar string solta em componente. */

export const BRAND_NAME = 'TP Lab';
export const NAV_DOCS_LABEL = 'Documentacao';
export const NAV_OPEN_EDITOR_LABEL = 'Abrir o editor';

export const BADGE_TEXT = 'Trabalho de conclusao de curso - PUC Minas - Engenharia de Software';
export const HEADLINE = 'Verilog no navegador, sem instalar nada.';
export const SUBHEADLINE =
  'Escreva o circuito, rode o testbench e veja as formas de onda na mesma tela. Sem pacote de instalacao, sem variavel de ambiente, sem terminal - so o navegador que voce ja tem aberto.';
export const DISCLAIMER =
  'Gratis - sem cadastro - seu codigo roda em contêiner isolado e nunca sai do seu projeto';

export const CTA_START_CODING = 'Comecar a programar';
export const CTA_OPEN_SAMPLE = 'Abrir um exemplo pronto';

export const RESUME_CARD = {
  EYEBROW: 'Continuar de onde parou',
  OPEN: 'Abrir',
};

export function formatEditedAt(relativeTime: string): string {
  return `editado ${relativeTime} - neste navegador`;
}

/** Mesmos rotulos de `LastRunStatus` que `ProjectCard` usa (RF07-I02) - versao compacta para o card de retomada. */
export const RESUME_STATUS_LABELS = {
  never: 'nunca executado',
  success: 'executado sem erros',
  failure: 'ultima execucao com erro',
};

export function formatViewAllProjects(count: number): string {
  return count === 1 ? 'Ver meu 1 projeto' : `Ver meus ${count} projetos`;
}

export const START_NEW_PROJECT = 'Comecar um projeto novo';

export const FEATURES_TITLE = 'O que da para fazer hoje';

export const FEATURE_CARDS = [
  {
    title: 'Zero instalacao',
    body: 'Abre e funciona. Nenhum pacote grande para baixar, nenhuma licenca para renovar, nenhuma variavel de ambiente para configurar antes da primeira aula.',
  },
  {
    title: 'Erros com a linha certa',
    body: 'Cada erro do compilador aponta o arquivo e a linha exata, com um clique no console que leva direto ate ela no editor.',
  },
  {
    title: 'Ondas interativas',
    body: 'O resultado da simulacao vira grafico na mesma tela: sinais um por linha, cursor de tempo e leitura dos valores em qualquer instante.',
  },
  {
    title: 'Seus projetos, seus arquivos',
    body: 'Crie, renomeie e exclua a vontade. Exporte em .zip com o circuito e o testbench juntos, prontos para abrir no Vivado ou no Quartus.',
  },
] as const;

export const HOW_IT_WORKS_TITLE = 'Tres passos ate a primeira onda';
export const HOW_IT_WORKS_SUBTITLE = 'Cinco minutos, contando o tempo de ler.';

export const HOW_IT_WORKS_STEPS = [
  {
    number: '01',
    title: 'Descreva o circuito',
    body: 'Escreva o modulo em Verilog no editor, com destaque de sintaxe.',
  },
  {
    number: '02',
    title: 'Escreva o testbench',
    body: 'Diga quais valores testar. Se preferir, carregue um exemplo comentado e mexa nele.',
  },
  {
    number: '03',
    title: 'Execute e leia',
    body: 'Um clique compila e simula. As formas de onda aparecem ao lado e o console mostra a saida.',
  },
] as const;

export const POSITIONING = {
  TITLE: 'O TP Lab nao substitui o Vivado nem o Quartus - prepara para eles.',
  BODY: 'Nao ha sintese logica, gravacao em FPGA nem VHDL nesta versao. O que ha e a parte em que se aprende a descrever e simular circuitos, sem a barreira de instalar e configurar um ambiente industrial antes da primeira linha de codigo.',
  CTA: 'Ver os limites em detalhe',
};

export const FOOTER_TAGLINE =
  'Plataforma web educacional para desenvolvimento em HDL - PUC Minas, 2026';
