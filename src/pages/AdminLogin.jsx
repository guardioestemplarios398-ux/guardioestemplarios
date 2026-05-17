import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockKeyhole, LogIn } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { saveAdminSession } from '../lib/localAuth.js';
import Brand from '../components/Brand.jsx';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [login, setLogin] = useState('douglas francisco');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error } = await supabase.rpc('local_admin_login', {
      p_login: login,
      p_password: password,
    });

    setLoading(false);

    if (error || !data?.length) {
      console.error(error);
      setError('Login inválido. Verifique nome de usuário e senha.');
      return;
    }

    saveAdminSession(data[0]);
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
            Nome de usuário
            <input
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              placeholder="Ex.: douglas francisco"
              autoComplete="username"
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Digite sua senha"
              autoComplete="current-password"
            />
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
