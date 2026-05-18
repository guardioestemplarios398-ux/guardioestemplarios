import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Send, ShieldCheck, KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import Brand from '../components/Brand.jsx';
import Loading from '../components/Loading.jsx';

const initialForm = {
  full_name: '',
  cim: '',
  grau: 'Aprendiz',
  is_guardioes: true,
  other_institution: '',
  notes: '',
};

export default function CheckinPage() {
  const { slug = 'checkin-diario-templo' } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadEvent() {
      setLoading(true);
      setError('');
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .eq('active', true)
        .maybeSingle();

      if (error) setError('Não foi possível carregar o evento. Verifique o Supabase e as permissões RLS.');
      else if (!data) setError('Evento não encontrado ou inativo.');
      else setEvent(data);
      setLoading(false);
    }

    loadEvent();
  }, [slug]);

  const canSubmit = useMemo(() => {
    if (!form.full_name.trim() || form.full_name.trim().length < 3) return false;
    if (!form.is_guardioes && !form.other_institution.trim()) return false;
    return true;
  }, [form]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit || !event) return;

    setSaving(true);
    setError('');

    const payload = {
      event_id: event.id,
      full_name: form.full_name.trim(),
      cim: form.cim.trim() || null,
      grau: form.grau || null,
      is_guardioes: Boolean(form.is_guardioes),
      other_institution: form.is_guardioes ? null : form.other_institution.trim(),
      notes: form.notes.trim() || null,
    };

    const { error } = await supabase.from('checkins').insert(payload);

    setSaving(false);
    if (error) {
      console.error(error);
      setError('Não foi possível confirmar o check-in. Verifique se os campos obrigatórios foram preenchidos.');
      return;
    }

    navigate('/success', { state: { name: payload.full_name, eventName: event.name } });
  }

  if (loading) return <Loading message="Carregando check-in..." />;

  return (
    <div className="public-page">
      <div className="public-bg" />
      <Link to="/admin/login" className="admin-mini-login" aria-label="Acessar login administrativo">
        <KeyRound size={14} />
        <span>Admin</span>
      </Link>
      <main className="checkin-card">
        <Brand />

        {error && !event ? (
          <div className="empty-state">
            <ShieldCheck size={44} />
            <h1>Check-in indisponível</h1>
            <p>{error}</p>
            <Link to="/admin/login" className="secondary-link">Acessar painel administrativo</Link>
          </div>
        ) : (
          <>
            <div className="event-header">
              <span>Evento ativo</span>
              <h1>{event?.name}</h1>
              <p>{event?.description || 'Preencha seus dados para confirmar sua presença na Loja.'}</p>
            </div>

            <form className="checkin-form" onSubmit={handleSubmit}>
              <label>
                Nome completo <b>*</b>
                <input
                  placeholder="Digite seu nome completo"
                  value={form.full_name}
                  onChange={(e) => updateField('full_name', e.target.value)}
                  required
                />
              </label>

              <div className="form-grid">
                <label>
                  CIM
                  <input
                    placeholder="Informe seu CIM"
                    value={form.cim}
                    onChange={(e) => updateField('cim', e.target.value)}
                  />
                </label>
                <label>
                  Grau
                  <select
                    value={form.grau}
                    onChange={(e) => updateField('grau', e.target.value)}
                  >
                    <option value="Aprendiz">Aprendiz</option>
                    <option value="Companheiro">Companheiro</option>
                    <option value="Mestre">Mestre</option>
                  </select>
                </label>
              </div>

              <div className="choice-box">
                <span>Você é dos Guardiões Templários?</span>
                <div className="choice-actions">
                  <button
                    type="button"
                    className={form.is_guardioes ? 'selected' : ''}
                    onClick={() => updateField('is_guardioes', true)}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    className={!form.is_guardioes ? 'selected' : ''}
                    onClick={() => updateField('is_guardioes', false)}
                  >
                    Não
                  </button>
                </div>
              </div>

              {!form.is_guardioes && (
                <label className="fade-in">
                  Nome da loja visitante <b>*</b>
                  <input
                    placeholder="Informe o nome da loja visitante"
                    value={form.other_institution}
                    onChange={(e) => updateField('other_institution', e.target.value)}
                    required={!form.is_guardioes}
                  />
                </label>
              )}

              <label>
                Observação
                <textarea
                  placeholder="Opcional"
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  rows="3"
                />
              </label>

              {error && <div className="alert error">{error}</div>}

              <button className="primary-btn full" type="submit" disabled={!canSubmit || saving}>
                {saving ? 'Confirmando...' : 'Confirmar check-in'}
                {saving ? null : <Send size={18} />}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
