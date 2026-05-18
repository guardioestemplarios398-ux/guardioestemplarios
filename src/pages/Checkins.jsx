import { useEffect, useMemo, useState } from 'react';
import { Download, Pencil, Search, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { getAdminToken } from '../lib/localAuth.js';
import PeriodFilter from '../components/PeriodFilter.jsx';
import { formatDateTime, getDateRange, toSupabaseDate } from '../lib/dateFilters.js';
import { exportCheckinsCsv } from '../lib/exportCsv.js';

const blankEdit = {
  id: '',
  full_name: '',
  cim: '',
  grau: 'Aprendiz',
  is_guardioes: true,
  other_institution: '',
  notes: '',
};

export default function Checkins() {
  const [filter, setFilter] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editForm, setEditForm] = useState(blankEdit);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const range = useMemo(() => getDateRange(filter, customStart, customEnd), [filter, customStart, customEnd]);

  async function load() {
    if (filter === 'custom' && (!customStart || !customEnd)) return;
    setLoading(true);
    setError('');

    const { data, error } = await supabase.rpc('admin_list_checkins_v2', {
      p_token: getAdminToken(),
      p_start: toSupabaseDate(range.start),
      p_end: toSupabaseDate(range.end),
    });

    if (error) {
      console.error(error);
      setError(error.message || 'Não foi possível carregar os check-ins.');
    }

    setRows(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [filter, customStart, customEnd, range.start, range.end]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (type === 'guardioes' && !row.is_guardioes) return false;
      if (type === 'visitantes' && row.is_guardioes) return false;
      const haystack = [row.full_name, row.cim, row.grau, row.other_institution, row.event_name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [rows, search, type]);

  function openEdit(row) {
    setMessage('');
    setError('');
    setEditRow(row);
    setEditForm({
      id: row.id,
      full_name: row.full_name || '',
      cim: row.cim || '',
      grau: row.grau || 'Aprendiz',
      is_guardioes: Boolean(row.is_guardioes),
      other_institution: row.other_institution || '',
      notes: row.notes || '',
    });
  }

  function closeEdit() {
    setEditRow(null);
    setEditForm(blankEdit);
    setSaving(false);
  }

  function updateEdit(field, value) {
    setEditForm((current) => ({ ...current, [field]: value }));
  }

  async function saveEdit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    const { error } = await supabase.rpc('admin_update_checkin_v2', {
      p_token: getAdminToken(),
      p_checkin_id: editForm.id,
      p_full_name: editForm.full_name.trim(),
      p_cim: editForm.cim.trim() || null,
      p_grau: editForm.grau || null,
      p_is_guardioes: Boolean(editForm.is_guardioes),
      p_other_institution: editForm.is_guardioes ? null : editForm.other_institution.trim(),
      p_notes: editForm.notes.trim() || null,
    });

    setSaving(false);

    if (error) {
      console.error(error);
      setError(error.message || 'Não foi possível salvar a edição.');
      return;
    }

    setMessage('Check-in atualizado com sucesso.');
    closeEdit();
    load();
  }

  async function deleteCheckin(row) {
    const ok = window.confirm(`Deseja excluir o check-in de ${row.full_name}? Essa ação não pode ser desfeita.`);
    if (!ok) return;

    setMessage('');
    setError('');

    const { error } = await supabase.rpc('admin_delete_checkin_v2', {
      p_token: getAdminToken(),
      p_checkin_id: row.id,
    });

    if (error) {
      console.error(error);
      setError(error.message || 'Não foi possível excluir o check-in.');
      return;
    }

    setMessage('Check-in excluído com sucesso.');
    load();
  }

  return (
    <div className="page-stack">
      <header className="page-header row-header">
        <div>
          <span>Registros</span>
          <h1>Check-ins realizados</h1>
          <p>Consulte, edite, exclua e exporte os dados de presença da Loja.</p>
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
          <input placeholder="Buscar por nome, CIM, grau ou loja visitante" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">Todos</option>
          <option value="guardioes">Somente Guardiões</option>
          <option value="visitantes">Somente visitantes</option>
        </select>
      </div>

      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert error">{error}</div>}

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
                <th>CIM</th>
                <th>Grau</th>
                <th>Tipo</th>
                <th>Loja visitante</th>
                <th>Evento</th>
                <th>Data/Hora</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td>{row.full_name}</td>
                  <td>{row.cim || '-'}</td>
                  <td>{row.grau || '-'}</td>
                  <td><span className={row.is_guardioes ? 'tag gold' : 'tag'}>{row.is_guardioes ? 'Guardião' : 'Visitante'}</span></td>
                  <td>{row.is_guardioes ? '-' : row.other_institution}</td>
                  <td>{row.event_name || '-'}</td>
                  <td>{formatDateTime(row.created_at)}</td>
                  <td>
                    <div className="table-actions">
                      <button className="icon-action" onClick={() => openEdit(row)} title="Editar check-in">
                        <Pencil size={16} />
                      </button>
                      <button className="icon-action danger" onClick={() => deleteCheckin(row)} title="Excluir check-in">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan="8" className="empty-table">Nenhum registro encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {editRow && (
        <div className="modal-backdrop" onClick={closeEdit}>
          <form className="modal-card" onSubmit={saveEdit} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span>Editar check-in</span>
                <h2>{editRow.full_name}</h2>
              </div>
              <button type="button" className="icon-action" onClick={closeEdit} title="Fechar">
                <X size={18} />
              </button>
            </div>

            <label>
              Nome completo
              <input value={editForm.full_name} onChange={(e) => updateEdit('full_name', e.target.value)} required />
            </label>

            <div className="form-grid">
              <label>
                CIM
                <input value={editForm.cim} onChange={(e) => updateEdit('cim', e.target.value)} placeholder="Informe o CIM" />
              </label>

              <label>
                Grau
                <select value={editForm.grau} onChange={(e) => updateEdit('grau', e.target.value)}>
                  <option value="Aprendiz">Aprendiz</option>
                  <option value="Companheiro">Companheiro</option>
                  <option value="Mestre">Mestre</option>
                </select>
              </label>
            </div>

            <div className="choice-box">
              <span>É dos Guardiões Templários?</span>
              <div className="choice-actions">
                <button
                  type="button"
                  className={editForm.is_guardioes ? 'selected' : ''}
                  onClick={() => updateEdit('is_guardioes', true)}
                >
                  Sim
                </button>
                <button
                  type="button"
                  className={!editForm.is_guardioes ? 'selected' : ''}
                  onClick={() => updateEdit('is_guardioes', false)}
                >
                  Não
                </button>
              </div>
            </div>

            {!editForm.is_guardioes && (
              <label>
                Nome da loja visitante
                <input
                  value={editForm.other_institution}
                  onChange={(e) => updateEdit('other_institution', e.target.value)}
                  placeholder="Informe o nome da loja visitante"
                  required={!editForm.is_guardioes}
                />
              </label>
            )}

            <label>
              Observação
              <textarea rows="3" value={editForm.notes} onChange={(e) => updateEdit('notes', e.target.value)} placeholder="Opcional" />
            </label>

            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={closeEdit}>Cancelar</button>
              <button type="submit" className="primary-btn" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
