/** Textos fixos de interface da feature projects — nao deixar string solta em componente. */

export const PAGE_TITLE = 'Meus projetos';

export function formatProjectCountSubtitle(count: number): string {
  return count === 1
    ? '1 projeto salvo neste navegador'
    : `${count} projetos salvos neste navegador`;
}

export const SEARCH_PLACEHOLDER = 'Buscar por nome do projeto...';
export const NEW_PROJECT_BUTTON_LABEL = 'Novo projeto';
export const NAVIGATE_BACK_LABEL = 'Voltar ao editor';

export const STORAGE_NOTICE = {
  TITLE: 'Seus projetos ficam salvos neste navegador',
  BODY: 'Ainda nao existe conta nesta versao. Exporte em .zip para guardar o circuito e o testbench antes de limpar os dados do navegador.',
};

export const NEW_PROJECT_CARD = {
  TITLE: 'Novo projeto',
  SUBTITLE: 'Comece em branco ou com um exemplo',
};

export const STATUS_LABELS = {
  NEVER_RUN: 'Nunca executado',
  SUCCESS: 'Executado sem erros',
  FAILURE: 'Erro de compilacao',
};

export const PROJECT_CARD_MENU_LABEL = 'Acoes do projeto';

export function formatOpenProjectLabel(name: string): string {
  return `Abrir ${name}.v no editor`;
}

export const PROJECT_ACTIONS = {
  OPEN: 'Abrir no editor',
  RENAME: 'Renomear',
  DUPLICATE: 'Duplicar',
  EXPORT: 'Exportar',
  DELETE: 'Excluir projeto',
};

// --- Exportacao (.zip, RF08) --------------------------------------------------

export const EXPORT_ERROR_MESSAGE = 'Nao foi possivel gerar o arquivo para exportar.';

// --- Vazio -----------------------------------------------------------------

export const EMPTY_STATE = {
  SUBTITLE: 'Nenhum projeto ainda - o primeiro leva menos de um minuto',
  TITLE: 'Voce ainda nao tem projetos',
  BODY: 'Um projeto guarda o circuito, o testbench e o resultado da ultima execucao. Comece em branco se ja sabe o que quer escrever, ou parta de um exemplo comentado e mexa nele.',
  CREATE_BLANK: 'Criar projeto em branco',
  START_FROM_SAMPLE: 'Comecar com um exemplo',
  FOOTER:
    'Os projetos ficam salvos neste navegador. Exportar em .zip e o que garante que nada se perde.',
};

// --- Busca sem resultado -----------------------------------------------------

export function formatNoSearchResultsMessage(query: string): string {
  return `Nenhum projeto encontrado para "${query}".`;
}

// --- Dialogo: novo projeto ---------------------------------------------------

export const NEW_PROJECT_DIALOG = {
  TITLE: 'Novo projeto',
  DESCRIPTION: 'Escolha um nome e um ponto de partida. Da para trocar tudo depois.',
  NAME_LABEL: 'Nome do projeto',
  NAME_HINT: 'Letras, numeros e sublinhado. Vira o nome do arquivo .v e do modulo principal.',
  START_LABEL: 'Ponto de partida',
  START_BLANK_TITLE: 'Em branco',
  START_BLANK_SUBTITLE: 'circuito e testbench vazios',
  START_SAMPLE_TITLE: 'Somador completo de 1 bit',
  START_SAMPLE_SUBTITLE: 'exemplo comentado',
  CANCEL: 'Cancelar',
  SUBMIT: 'Criar projeto',
};

export const PROJECT_NAME_ERRORS = {
  REQUIRED: 'Informe um nome para o projeto.',
  TOO_LONG: 'O nome pode ter no maximo 35 caracteres.',
  INVALID_CHARACTERS: 'Use apenas letras, numeros e sublinhado, comecando com letra ou _.',
  DUPLICATE: 'Ja existe um projeto com esse nome neste navegador.',
};

// --- Dialogo: renomear --------------------------------------------------------

export const RENAME_DIALOG = {
  TITLE: 'Renomear projeto',
  NAME_LABEL: 'Nome do projeto',
  HINT: 'Renomear o projeto nao altera o nome do modulo dentro do codigo.',
  CANCEL: 'Cancelar',
  SUBMIT: 'Salvar',
};

// --- Dialogo: excluir ---------------------------------------------------------

export function formatDeleteDialogTitle(name: string): string {
  return `Excluir "${name}"?`;
}

export const DELETE_DIALOG = {
  BODY: 'Esta acao nao pode ser desfeita. O circuito, o testbench e o historico de execucoes serao apagados deste navegador.',
  CANCEL: 'Cancelar',
  SUBMIT: 'Excluir projeto',
};

export function formatDeleteToast(name: string): string {
  return `Projeto "${name}" excluido.`;
}

export const UNDO_LABEL = 'Desfazer';

// --- Erros de armazenamento ----------------------------------------------------

export const STORAGE_ERROR = {
  LOAD_TITLE: 'Nao foi possivel carregar seus projetos',
  LOAD_BODY: 'Os dados deste navegador nao puderam ser lidos.',
  RETRY: 'Tentar de novo',
};
