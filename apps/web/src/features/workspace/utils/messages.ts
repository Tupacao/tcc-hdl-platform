/** Textos fixos de interface do workspace — não deixar string solta em componente. */

export const WAVEFORM_EMPTY_STATE = {
  BEFORE_DUMPFILE: 'Nenhuma forma de onda ainda. Use ',
  DUMPFILE: '$dumpfile',
  BETWEEN_DIRECTIVES: ' e ',
  DUMPVARS: '$dumpvars',
  AFTER_DUMPVARS: ' no testbench e execute a simulação.',
};

export const WAVEFORM_LOADING_MESSAGE = 'Interpretando a forma de onda...';

export const WAVEFORM_UNPARSEABLE_MESSAGE =
  'Não foi possível interpretar a forma de onda recebida.';

export const WAVEFORM_TRUNCATED_MESSAGE =
  'O arquivo .vcd foi truncado; a forma de onda pode estar incompleta.';

export const OPEN_PROJECTS_BUTTON_LABEL = 'Meus projetos';
export const RESET_LAYOUT_BUTTON_LABEL = 'Restaurar layout padrão';

// --- Vínculo com o projeto aberto (RF07-I03) --------------------------------

export const SAVE_BUTTON_LABEL = 'Salvar';
export const EXPORT_BUTTON_LABEL = 'Exportar projeto em .zip';
export const EXPORT_ERROR_MESSAGE = 'Não foi possível gerar o arquivo para exportar.';
export const UNSAVED_INDICATOR_LABEL = 'Alterações não salvas';
export const SAVED_INDICATOR_LABEL = 'Tudo salvo';

export const LEAVE_DIALOG = {
  TITLE: 'Sair sem salvar?',
  BODY: 'Este projeto tem alterações não salvas. Elas continuam guardadas como rascunho neste navegador, mas o projeto só é atualizado de verdade quando você salva.',
  CANCEL: 'Cancelar',
  DISCARD: 'Sair sem salvar',
  SAVE_AND_LEAVE: 'Salvar e sair',
};

export const RESTORE_DRAFT_DIALOG = {
  TITLE: 'Recuperar rascunho não salvo?',
  DISCARD: 'Manter versão salva',
  USE_DRAFT: 'Usar rascunho',
};

export function formatRestoreDraftBody(savedAtLabel: string): string {
  return `Encontramos alterações de ${savedAtLabel} que não chegaram a ser salvas neste projeto. Usar o rascunho ou manter a última versão salva?`;
}

// --- Abrir exemplo da documentação com um projeto aberto (RF11, Figma "Onde abrir") ------

export function formatOpenExampleTitle(projectName: string): string {
  return `Você tem "${projectName}" aberto`;
}

export function formatReplaceCurrentSubtitle(projectName: string): string {
  return `O código de "${projectName}" é descartado`;
}

export const OPEN_EXAMPLE_DIALOG = {
  DESCRIPTION: 'Este trecho pode substituir o que está no editor ou virar um projeto novo.',
  OPEN_AS_NEW_TITLE: 'Abrir em um projeto novo',
  OPEN_AS_NEW_SUBTITLE: 'O projeto atual fica como está',
  REPLACE_CURRENT_TITLE: 'Substituir o conteúdo atual',
  CANCEL: 'Cancelar',
  SUBMIT: 'Abrir',
};

// --- Painel inferior: Console e Problemas (RF05, Figma 2.3 e 4.1) -----------

export const CONSOLE_TABS = {
  LABEL: 'Saída da execução',
  CONSOLE: 'Console',
  PROBLEMS: 'Problemas',
};

export const CONSOLE_EMPTY_STATE = {
  TITLE: 'A saída do compilador aparece aqui',
  HINT_PREFIX: 'Clique em Executar ou pressione ',
};

export const CONSOLE_RUNNING_MESSAGE = 'Compilando e simulando...';

export const PROBLEMS_PANEL = {
  LIST_LABEL: 'Diagnósticos',
  COLUMN_LOCATION: 'Arquivo e posição',
  COLUMN_MESSAGE: 'Mensagem',
  EMPTY_NOT_RUN: 'Execute a simulação para ver os problemas aqui.',
  EMPTY_NO_PROBLEMS: 'Nenhum erro ou aviso.',
  FOOTER_HINT:
    'Clique em um item para ir direto à linha no editor · os avisos não impedem a execução',
  ALL_CLEAR: '0 erros · a simulação rodou normalmente',
  GO_TO_LINE: 'Ir para a linha',
  NO_POSITION: 'sem posição no código',
};

// --- Abas de arquivo, divisores e barra de estado (RF09-I03) -----------------

export const FILE_TABS = {
  LABEL: 'Arquivos do projeto',
  ROLES: { design: 'circuito', testbench: 'testbench' },
  HAS_ERRORS: ' (com erros)',
  UNSAVED: ' (alterações não salvas)',
};

export const RESIZE_HANDLE = {
  LABEL_EDITOR_WAVEFORM: 'Ajustar largura entre editor e formas de onda',
  LABEL_EDITOR_CONSOLE: 'Ajustar altura entre editor e console',
  KEYBOARD_HINT_COLUMN: '← →  ajustar',
  KEYBOARD_HINT_ROW: '↑ ↓  ajustar',
};

export const STATUS_BAR = {
  LABEL: 'Estado da execução e do projeto',
  FOCUS_PROBLEMS: 'Ver problemas no console',
  LANGUAGE: 'Verilog',
  ENCODING: 'UTF-8',
  ALL_SAVED: 'Todas as alterações salvas',
  UNSAVED: 'Alterações não salvas',
};

export function formatCursorPosition(line: number, column: number): string {
  return `Ln ${line}, Col ${column}`;
}
