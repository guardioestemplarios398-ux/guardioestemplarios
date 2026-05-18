import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Legend } from 'recharts';
import { CalendarCheck2, Crown, TrendingUp, Users } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { getAdminToken } from '../lib/localAuth.js';
import MetricCard from '../components/MetricCard.jsx';
import PeriodFilter from '../components/PeriodFilter.jsx';
import { formatDateTime, getDateRange, toSupabaseDate } from '../lib/dateFilters.js';

export default function Dashboard() {
  const [filter, setFilter] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [rows, setRows] = useState([]);
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

  const stats = useMemo(() => {
    const total = rows.length;
    const guardioes = rows.filter((row) => row.is_guardioes).length;
    const visitantes = total - guardioes;
    const days = Math.max(1, Math.ceil((range.end - range.start) / (1000 * 60 * 60 * 24)) + 1);
    const avg = total ? Math.round(total / days) : 0;
    return { total, guardioes, visitantes, avg };
  }, [rows, range]);

  const chartData = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => {
      const d = new Date(row.created_at);
      const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!map.has(key)) map.set(key, { dia: key, total: 0, guardioes: 0, visitantes: 0 });
      const item = map.get(key);
      item.total += 1;
      if (row.is_guardioes) item.guardioes += 1;
      else item.visitantes += 1;
    });
    return Array.from(map.values()).reverse();
  }, [rows]);

  const pieData = [
    { name: 'Guardiões', value: stats.guardioes },
    { name: 'Visitantes', value: stats.visitantes },
  ];

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <span>Painel Administrativo</span>
          <h1>Dashboard de Presença</h1>
          <p>Controle de quantas pessoas passaram pela Loja no período selecionado.</p>
        </div>
      </header>

      <PeriodFilter
        filter={filter}
        setFilter={setFilter}
        customStart={customStart}
        setCustomStart={setCustomStart}
        customEnd={customEnd}
        setCustomEnd={setCustomEnd}
      />

      <div className="period-label">Período analisado: <strong>{range.label}</strong></div>

      <section className="metrics-grid">
        <MetricCard title="Pessoas no período" value={stats.total} hint={loading ? 'Atualizando...' : 'Check-ins confirmados'} icon={Users} />
        <MetricCard title="Guardiões Templários" value={stats.guardioes} hint="Membros do templo" icon={Crown} />
        <MetricCard title="Visitantes" value={stats.visitantes} hint="Não vinculados ao grupo" icon={CalendarCheck2} />
        <MetricCard title="Média por dia" value={stats.avg} hint="Movimento médio" icon={TrendingUp} />
      </section>

      <section className="dashboard-grid">
        <div className="panel large-panel">
          <div className="panel-header">
            <h2>Movimento por dia</h2>
            <span>{chartData.length} dias com registro</span>
          </div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={290}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d5ae62" stopOpacity={0.55}/>
                    <stop offset="95%" stopColor="#d5ae62" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="dia" stroke="#aeb4c0" />
                <YAxis stroke="#aeb4c0" allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#151922', border: '1px solid rgba(213,174,98,.25)', color: '#fff' }} />
                <Area type="monotone" dataKey="total" name="Total" stroke="#d5ae62" fill="url(#totalGradient)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Guardiões x Visitantes</h2>
          </div>
          <div className="chart-box small">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={index === 0 ? '#d5ae62' : '#61708f'} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip contentStyle={{ background: '#151922', border: '1px solid rgba(213,174,98,.25)', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Últimos check-ins</h2>
          <span>{rows.slice(0, 8).length} registros recentes</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>CIM</th>
                <th>Grau</th>
                <th>Evento</th>
                <th>Data/Hora</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 8).map((row) => (
                <tr key={row.id}>
                  <td>{row.full_name}</td>
                  <td><span className={row.is_guardioes ? 'tag gold' : 'tag'}>{row.is_guardioes ? 'Guardião' : 'Visitante'}</span></td>
                  <td>{row.cim || '-'}</td>
                  <td>{row.grau || '-'}</td>
                  <td>{row.event_name || '-'}</td>
                  <td>{formatDateTime(row.created_at)}</td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan="6" className="empty-table">Nenhum check-in no período.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
