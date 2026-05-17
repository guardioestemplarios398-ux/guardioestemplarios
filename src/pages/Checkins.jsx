import { useEffect, useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { getAdminToken } from '../lib/localAuth.js';
import PeriodFilter from '../components/PeriodFilter.jsx';
import { formatDateTime, getDateRange, toSupabaseDate } from '../lib/dateFilters.js';
import { exportCheckinsCsv } from '../lib/exportCsv.js';

export default function Checkins() {
  const [filter, setFilter] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [loading, setLoading] = useState(false);
  const range = useMemo(() => getDateRange(filter, customStart, customEnd), [filter, customStart, customEnd]);

  useEffect(() => {
    async function load() {
      if (filter === 'custom' && (!customStart || !customEnd)) return;
      setLoading(true);
      const { data, error } = await supabase.rpc('admin_list_checkins', {
        p_token: getAdminToken(),
        p_start: toSupabaseDate(range.start),
        p_end: toSupabaseDate(range.end),
      });

      if (error) console.error(error);
      setRows(data || []);
      setLoading(false);
    }
    load();
  }, [filter, customStart, customEnd, range.start, range.end]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (type === 'guardioes' && !row.is_guardioes) return false;
      if (type === 'visitantes' && row.is_guardioes) return false;
      const haystack = [row.full_name, row.phone, row.email, row.city, row.other_institution, row.event_name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [rows, search, type]);

  return (
    <div className="page-stack">
      <header className="page-header row-header">
        <div>
          <span>Registros</span>
          <h1>Check-ins realizados</h1>
          <p>Consulte, filtre e exporte os dados de presença.</p>
        </div>
        <button className="primary-btn" onClick={() => exportCheckinsCsv(filtered, `checkins-guardioes-${new Date().toISOString().slice(0,10)}.csv`)}>
          <Download size={18} /> Exportar CSV
        </button>
      </header>

      <PeriodFilter
        filter={filter}
        setFilter={setFilter}
        customStart={customStart}
        setCustomStart={setCustomStart}
        customEnd={customEnd}
        setCustomEnd={setCustomEnd}
      />

      <div className="filters-row">
        <div className="search-box">
          <Search size={18} />
          <input placeholder="Buscar por nome, telefone, cidade ou instituição" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">Todos</option>
          <option value="guardioes">Somente Guardiões</option>
          <option value="visitantes">Somente visitantes</option>
        </select>
      </div>

      <section className="panel">
        <div className="panel-header">
          <h2>Lista completa</h2>
          <span>{loading ? 'Atualizando...' : `${filtered.length} registros`}</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>Cidade</th>
                <th>Tipo</th>
                <th>Instituição</th>
                <th>Evento</th>
                <th>Data/Hora</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td>{row.full_name}</td>
                  <td>{row.phone || '-'}</td>
                  <td>{row.email || '-'}</td>
                  <td>{row.city || '-'}</td>
                  <td><span className={row.is_guardioes ? 'tag gold' : 'tag'}>{row.is_guardioes ? 'Guardião' : 'Visitante'}</span></td>
                  <td>{row.is_guardioes ? '-' : row.other_institution}</td>
                  <td>{row.event_name || '-'}</td>
                  <td>{formatDateTime(row.created_at)}</td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan="8" className="empty-table">Nenhum registro encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
