import { useEffect, useState } from 'react';
import { CalendarPlus, Link as LinkIcon, Save } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { getAdminToken } from '../lib/localAuth.js';
import { formatDateOnly } from '../lib/dateFilters.js';

function slugify(value) {
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const blankEvent = {
  name: '',
  slug: '',
  description: '',
  location: '',
  event_date: '',
  active: true,
};

export default function Events() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(blankEvent);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function loadEvents() {
    const { data, error } = await supabase.rpc('admin_list_events', {
      p_token: getAdminToken(),
    });
    if (error) console.error(error);
    setEvents(data || []);
  }

  useEffect(() => { loadEvents(); }, []);

  function update(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'name' && !current.slug ? { slug: slugify(value) } : {}),
    }));
  }

  async function createEvent(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const payload = {
      ...form,
      slug: slugify(form.slug || form.name),
      event_date: form.event_date || null,
    };
    const { error } = await supabase.rpc('admin_create_event', {
      p_token: getAdminToken(),
      p_name: payload.name,
      p_slug: payload.slug,
      p_description: payload.description || null,
      p_location: payload.location || null,
      p_event_date: payload.event_date || null,
      p_active: payload.active,
    });
    setLoading(false);
    if (error) {
      console.error(error);
      setMessage('Erro ao criar evento. Verifique se o slug já existe ou se sua sessão expirou.');
      return;
    }
    setForm(blankEvent);
    setMessage('Evento criado com sucesso.');
    loadEvents();
  }

  async function toggleActive(event) {
    await supabase.rpc('admin_set_event_active', {
      p_token: getAdminToken(),
      p_event_id: event.id,
      p_active: !event.active,
    });
    loadEvents();
  }

  const publicBase = window.location.origin.replace(/\/$/, '');

  return (
    <div className="page-stack">
      <header className="page-header">
        <span>Eventos</span>
        <h1>Gerenciar eventos e QR Codes</h1>
        <p>Crie eventos específicos ou mantenha o check-in da Loja.</p>
      </header>

      <section className="admin-split">
        <form className="panel event-form" onSubmit={createEvent}>
          <div className="panel-header">
            <h2><CalendarPlus size={20} /> Novo evento</h2>
          </div>
          <label>
            Nome do evento
            <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Ex.: Cerimônia Especial" required />
          </label>
          <label>
            Slug do link
            <input value={form.slug} onChange={(e) => update('slug', e.target.value)} placeholder="cerimonia-especial" required />
          </label>
          <label>
            Descrição
            <textarea rows="3" value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Descrição curta para aparecer no formulário" />
          </label>
          <div className="form-grid">
            <label>
              Local
              <input value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="Guardiões Templários 33 N° 4637" />
            </label>
            <label>
              Data
              <input type="date" value={form.event_date} onChange={(e) => update('event_date', e.target.value)} />
            </label>
          </div>
          <label className="check-row">
            <input type="checkbox" checked={form.active} onChange={(e) => update('active', e.target.checked)} />
            Evento ativo
          </label>
          {message && <div className="alert info">{message}</div>}
          <button className="primary-btn full" disabled={loading}>{loading ? 'Criando...' : 'Criar evento'} <Save size={18} /></button>
        </form>

        <section className="panel">
          <div className="panel-header">
            <h2>Eventos cadastrados</h2>
            <span>{events.length} eventos</span>
          </div>
          <div className="event-list">
            {events.map((event) => {
              const url = `${publicBase}/checkin/${event.slug}`;
              return (
                <div className="event-item" key={event.id}>
                  <div>
                    <strong>{event.name}</strong>
                    <span>{event.location || 'Sem local'} · {event.event_date ? formatDateOnly(event.event_date) : 'Sem data'}</span>
                    <small>{url}</small>
                  </div>
                  <div className="event-actions">
                    <button className="ghost-btn" onClick={() => navigator.clipboard.writeText(url)}><LinkIcon size={16} /> Copiar</button>
                    <button className={event.active ? 'status-btn on' : 'status-btn'} onClick={() => toggleActive(event)}>{event.active ? 'Ativo' : 'Inativo'}</button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </section>
    </div>
  );
}
