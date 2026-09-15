import type { WaveSignal, WaveTransition, Waveform } from '../models/types';

const IGNORED_DIRECTIVES = new Set(['$dumpvars', '$dumpall', '$dumpon', '$dumpoff']);

/**
 * $date, $version, $comment e $timescale são "declaration_command"s do VCD cujo
 * conteúdo pode vir em uma única linha (`$timescale 1ns $end`) ou espalhado por
 * várias, com o `$end` sozinho numa linha própria — é exatamente o que o
 * iverilog emite (`$date\n\tSat ...\n$end`). Precisam de um modo "bloco pendente"
 * em vez do despacho linha-a-linha usado para o resto do cabeçalho.
 */
const BLOCK_DIRECTIVES = new Set(['$date', '$version', '$comment', '$timescale']);

class MalformedLineError extends Error {}

interface ParserState {
  scopeStack: string[];
  signals: WaveSignal[];
  transitions: Map<string, WaveTransition[]>;
  currentTime: number;
  timescale: number;
  timeUnit: string;
  endTime: number;
  pendingBlock: 'timescale' | 'skip' | null;
  pendingTokens: string[];
}

function currentScope(state: ParserState): string {
  return state.scopeStack.join('.');
}

/** Varre o texto por índice, devolvendo uma linha por chamada, sem alocar um array com todas as linhas. */
function* iterateLines(text: string): Generator<string> {
  let start = 0;
  while (start <= text.length) {
    const next = text.indexOf('\n', start);
    if (next === -1) {
      yield text.slice(start);
      return;
    }
    let end = next;
    if (end > start && text[end - 1] === '\r') {
      end -= 1;
    }
    yield text.slice(start, end);
    start = next + 1;
  }
}

/** Aplica o texto acumulado de um bloco `$timescale`. Texto que não casa é ignorado (mantém o padrão). */
function applyTimescale(tokens: string[], state: ParserState): void {
  const combined = tokens.join('');
  const match = /^(\d+)([a-zA-Z]+)$/.exec(combined);
  if (!match) return;
  state.timescale = Number(match[1]);
  state.timeUnit = match[2] ?? '';
}

/** Abre um bloco `$date`/`$version`/`$comment`/`$timescale`, resolvendo de imediato a forma de uma linha só. */
function openBlock(directive: string, line: string, state: ParserState): void {
  const tokens = line.split(/\s+/).filter((token) => token.length > 0);
  const endIndex = tokens.indexOf('$end');
  const kind: 'timescale' | 'skip' = directive === '$timescale' ? 'timescale' : 'skip';

  if (endIndex !== -1) {
    if (kind === 'timescale') applyTimescale(tokens.slice(1, endIndex), state);
    return;
  }
  state.pendingBlock = kind;
  state.pendingTokens = tokens.slice(1);
}

/** Continua um bloco aberto por `openBlock` até encontrar o `$end` que o fecha. */
function consumePendingBlock(line: string, state: ParserState): void {
  const tokens = line.split(/\s+/).filter((token) => token.length > 0);
  const endIndex = tokens.indexOf('$end');

  if (endIndex === -1) {
    state.pendingTokens.push(...tokens);
    return;
  }
  state.pendingTokens.push(...tokens.slice(0, endIndex));
  if (state.pendingBlock === 'timescale') applyTimescale(state.pendingTokens, state);
  state.pendingBlock = null;
  state.pendingTokens = [];
}

function parseScope(line: string, state: ParserState): void {
  const tokens = line.trim().split(/\s+/);
  const name = tokens[2];
  if (tokens[0] !== '$scope' || !name) {
    throw new MalformedLineError(`$scope invalido: "${line}"`);
  }
  state.scopeStack.push(name);
}

function parseUpscope(state: ParserState): void {
  state.scopeStack.pop();
}

function parseVar(line: string, state: ParserState): void {
  const tokens = line.trim().split(/\s+/);
  const [keyword, type, widthToken, id, ...rest] = tokens;
  if (keyword !== '$var' || !type || !widthToken || !id || rest.length === 0) {
    throw new MalformedLineError(`$var invalido: "${line}"`);
  }
  const nameTokens = rest.filter((token) => token !== '$end');
  if (nameTokens.length === 0) {
    throw new MalformedLineError(`$var sem nome: "${line}"`);
  }
  const width = Number(widthToken);
  if (!Number.isFinite(width) || width <= 0) {
    throw new MalformedLineError(`$var com largura invalida: "${line}"`);
  }
  const signal: WaveSignal = {
    id,
    name: nameTokens.join(' '),
    scope: currentScope(state),
    width,
    type,
  };
  state.signals.push(signal);
  if (!state.transitions.has(id)) {
    state.transitions.set(id, []);
  }
}

/** Restaura os zeros à esquerda omitidos pelo VCD, estendendo com x/z quando o bit mais significativo exige. */
function normalizeVectorValue(raw: string, width: number): string {
  const lower = raw.toLowerCase();
  if (lower.length >= width) {
    return lower.slice(lower.length - width);
  }
  const first = lower[0];
  const padChar = first === 'x' || first === 'z' ? first : '0';
  return padChar.repeat(width - lower.length) + lower;
}

function widthOf(state: ParserState, id: string): number {
  const signal = state.signals.find((candidate) => candidate.id === id);
  return signal?.width ?? 1;
}

function recordTransition(state: ParserState, id: string, value: string): void {
  const series = state.transitions.get(id);
  if (!series) {
    // Valor para um id nunca declarado em $var — VCD inválido, ignorar silenciosamente.
    return;
  }
  const last = series[series.length - 1];
  if (last && last.time === state.currentTime) {
    last.value = value;
    return;
  }
  series.push({ time: state.currentTime, value });
}

function parseScalarValue(line: string, state: ParserState): void {
  const value = line[0]?.toLowerCase();
  const id = line.slice(1);
  if (!value || !id) {
    throw new MalformedLineError(`Valor escalar invalido: "${line}"`);
  }
  recordTransition(state, id, value);
}

function parseVectorOrReal(line: string, state: ParserState): void {
  const spaceIndex = line.indexOf(' ');
  if (spaceIndex === -1) {
    throw new MalformedLineError(`Valor vetorial/real invalido: "${line}"`);
  }
  const rawValue = line.slice(1, spaceIndex);
  const id = line.slice(spaceIndex + 1).trim();
  if (!rawValue || !id) {
    throw new MalformedLineError(`Valor vetorial/real invalido: "${line}"`);
  }
  const prefix = line[0]?.toLowerCase();
  if (prefix === 'r') {
    recordTransition(state, id, rawValue);
    return;
  }
  recordTransition(state, id, normalizeVectorValue(rawValue, widthOf(state, id)));
}

function parseTimeMarker(line: string, state: ParserState): void {
  const time = Number(line.slice(1));
  if (!Number.isFinite(time)) {
    throw new MalformedLineError(`Marca de tempo invalida: "${line}"`);
  }
  state.currentTime = time;
  if (time > state.endTime) {
    state.endTime = time;
  }
}

function parseLine(line: string, state: ParserState): void {
  if (state.pendingBlock !== null) {
    consumePendingBlock(line, state);
    return;
  }
  if (line.length === 0 || line === '$end') {
    return;
  }
  const firstChar = line[0];
  if (firstChar === '#') {
    parseTimeMarker(line, state);
    return;
  }
  const directive = line.split(/\s+/)[0];
  if (directive && BLOCK_DIRECTIVES.has(directive)) {
    openBlock(directive, line, state);
    return;
  }
  if (line.startsWith('$scope')) {
    parseScope(line, state);
    return;
  }
  if (line.startsWith('$upscope')) {
    parseUpscope(state);
    return;
  }
  if (line.startsWith('$var')) {
    parseVar(line, state);
    return;
  }
  if (line.startsWith('$enddefinitions')) {
    return;
  }
  if (directive && IGNORED_DIRECTIVES.has(directive)) {
    return;
  }
  switch (firstChar?.toLowerCase()) {
    case '0':
    case '1':
    case 'x':
    case 'z':
      parseScalarValue(line, state);
      return;
    case 'b':
    case 'r':
      parseVectorOrReal(line, state);
      return;
    default:
      throw new MalformedLineError(`Linha nao reconhecida: "${line}"`);
  }
}

/**
 * Converte o texto de um arquivo VCD em um modelo consultável por tempo.
 * Nunca lança exceção: qualquer linha que não possa ser interpretada (tipicamente o
 * arquivo truncado por RF04-I02) interrompe o parsing e marca `truncated: true`.
 */
export function parseVcd(text: string): Waveform {
  const state: ParserState = {
    scopeStack: [],
    signals: [],
    transitions: new Map(),
    currentTime: 0,
    timescale: 1,
    timeUnit: '',
    endTime: 0,
    pendingBlock: null,
    pendingTokens: [],
  };

  let truncated = false;
  for (const line of iterateLines(text)) {
    try {
      parseLine(line.trim(), state);
    } catch (error) {
      if (error instanceof MalformedLineError) {
        truncated = true;
        break;
      }
      throw error;
    }
  }

  return {
    timescale: state.timescale,
    timeUnit: state.timeUnit,
    endTime: state.endTime,
    signals: state.signals,
    transitions: state.transitions,
    truncated,
  };
}

/**
 * Valor vigente de um sinal em um instante, por busca binária sobre as transições.
 * Antes da primeira transição (ou para um id sem nenhuma), devolve o estado
 * desconhecido ("x" repetido pela largura do sinal).
 */
export function valueAt(waveform: Waveform, signalId: string, time: number): string {
  const width = widthFromSignals(waveform.signals, signalId);
  const series = waveform.transitions.get(signalId);
  if (!series || series.length === 0) {
    return 'x'.repeat(width);
  }

  let low = 0;
  let high = series.length - 1;
  let result = -1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const candidate = series[mid];
    if (candidate && candidate.time <= time) {
      result = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  if (result === -1) {
    return 'x'.repeat(width);
  }
  return series[result]?.value ?? 'x'.repeat(width);
}

function widthFromSignals(signals: WaveSignal[], id: string): number {
  return signals.find((signal) => signal.id === id)?.width ?? 1;
}
