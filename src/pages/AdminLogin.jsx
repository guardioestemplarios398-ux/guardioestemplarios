import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockKeyhole, LogIn } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import Brand from '../components/Brand.jsx';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('douglasnoticias@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      setError('Login inválido. Verifique e-mail, senha e usuário no Supabase Auth.');
      return;
    }

    const { data: adminRows, error: adminError } = await supabase
      .from('admin_users')
      .select('id, active, role')
      .eq('active', true)
      .limit(1);

    setLoading(false);

    if (adminError || !adminRows?.length) {
      await supabase.auth.signOut();
      setError('Usuário autenticado, mas sem permissão administrativa. Verifique a tabela admin_users.');
      return;
    }

    navigate('/admin/dashboard', { replace: true });
  }

  return (
    <div className="login-page">
      <div className="public-bg" />
      <main className="login-card">
        <Brand />
        <div className="login-title">
          <LockKeyhole size={32} />
          <div>
            <h1>Painel Administrativo</h1>
            <p>Acesse para acompanhar check-ins, eventos e relatórios.</p>
          </div>
        </div>
        <form onSubmit={handleLogin} className="login-form">
          <label>
            E-mail
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Senha
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Digite sua senha" />
          </label>
          {error && <div className="alert error">{error}</div>}
          <button className="primary-btn full" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar no painel'} <LogIn size={18} />
          </button>
        </form>
      </main>
    </div>
  );
}
