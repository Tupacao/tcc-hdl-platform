/** Textos fixos de interface do workspace — nao deixar string solta em componente. */

export const WAVEFORM_EMPTY_STATE = {
  BEFORE_DUMPFILE: 'Nenhuma forma de onda ainda. Use ',
  DUMPFILE: '$dumpfile',
  BETWEEN_DIRECTIVES: ' e ',
  DUMPVARS: '$dumpvars',
  AFTER_DUMPVARS: ' no testbench e execute a simulacao.',
};

export const WAVEFORM_LOADING_MESSAGE = 'Interpretando a forma de onda...';

export const WAVEFORM_UNPARSEABLE_MESSAGE =
  'Nao foi possivel interpretar a forma de onda recebida.';

export const WAVEFORM_TRUNCATED_MESSAGE =
  'O arquivo .vcd foi truncado; a forma de onda pode estar incompleta.';
