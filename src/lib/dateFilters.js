import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const FILTERS = [
  { key: 'today', label: 'Hoje' },
  { key: 'week', label: 'Semanal' },
  { key: 'month', label: 'Mensal' },
  { key: 'year', label: 'Anual' },
  { key: 'custom', label: 'Personalizado' },
];

export function getDateRange(filterKey, customStart, customEnd) {
  const now = new Date();

  if (filterKey === 'today') {
    return { start: startOfDay(now), end: endOfDay(now), label: 'Hoje' };
  }

  if (filterKey === 'week') {
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });
    return { start, end, label: `${format(start, 'dd/MM/yyyy')} até ${format(end, 'dd/MM/yyyy')}` };
  }

  if (filterKey === 'month') {
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    return { start, end, label: format(now, 'MMMM/yyyy', { locale: ptBR }) };
  }

  if (filterKey === 'year') {
    const start = startOfYear(now);
    const end = endOfYear(now);
    return { start, end, label: format(now, 'yyyy') };
  }

  if (filterKey === 'custom' && customStart && customEnd) {
    const start = startOfDay(new Date(`${customStart}T00:00:00`));
    const end = endOfDay(new Date(`${customEnd}T00:00:00`));
    return { start, end, label: `${format(start, 'dd/MM/yyyy')} até ${format(end, 'dd/MM/yyyy')}` };
  }

  const start = startOfDay(subDays(now, 30));
  const end = endOfDay(now);
  return { start, end, label: 'Últimos 30 dias' };
}

export function toSupabaseDate(date) {
  return date.toISOString();
}

export function formatDateTime(dateString) {
  if (!dateString) return '-';
  return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
}

export function formatDateOnly(dateString) {
  if (!dateString) return '-';
  return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
}
