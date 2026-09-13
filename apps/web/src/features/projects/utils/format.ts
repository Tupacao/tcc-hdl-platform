const RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
const ABSOLUTE_DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' });

/**
 * "ha 2 horas" / "ontem" / "ha 3 dias" (frame 6.1 do Figma) - alem de ~30 dias
 * vira data absoluta em pt-BR, para nao acumular "ha 214 dias".
 */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  const diffSeconds = Math.round((then - now.getTime()) / 1000);
  const diffMinutes = Math.round(diffSeconds / 60);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);

  if (Math.abs(diffSeconds) < 60) return RELATIVE_TIME_FORMATTER.format(diffSeconds, 'second');
  if (Math.abs(diffMinutes) < 60) return RELATIVE_TIME_FORMATTER.format(diffMinutes, 'minute');
  if (Math.abs(diffHours) < 24) return RELATIVE_TIME_FORMATTER.format(diffHours, 'hour');
  if (Math.abs(diffDays) < 30) return RELATIVE_TIME_FORMATTER.format(diffDays, 'day');

  return ABSOLUTE_DATE_FORMATTER.format(then);
}
