import { formatDateTime } from './dateFilters.js';

function clean(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/"/g, '""');
}

export function exportCheckinsCsv(rows, filename = 'checkins.csv') {
  const headers = [
    'Nome completo',
    'Telefone',
    'E-mail',
    'Cidade',
    'Guardião Templário',
    'Instituição / Grupo',
    'Observação',
    'Evento',
    'Data/Hora',
  ];

  const lines = rows.map((row) => [
    row.full_name,
    row.phone,
    row.email,
    row.city,
    row.is_guardioes ? 'Sim' : 'Não',
    row.other_institution,
    row.notes,
    row.event_name || row.events?.name || '',
    formatDateTime(row.created_at),
  ].map((field) => `"${clean(field)}"`).join(';'));

  const csv = [headers.map((h) => `"${h}"`).join(';'), ...lines].join('\n');
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
