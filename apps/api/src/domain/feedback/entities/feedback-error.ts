/**
 * Limite diario de relatos por origem (RF17). Nao e erro de transporte: o plugin
 * de rate limit roda antes da validacao, entao ele sozinho deixaria uma tentativa
 * recusada por e-mail invalido consumir a cota do dia. O limite que o usuario le
 * ("voce ja enviou N mensagens hoje") conta relatos gravados, nao requisicoes.
 */
export class FeedbackDailyLimitError extends Error {
  constructor(readonly limit: number) {
    super(`Limite de ${limit} mensagens por dia atingido`);
    this.name = 'FeedbackDailyLimitError';
  }
}
