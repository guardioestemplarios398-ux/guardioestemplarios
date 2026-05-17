import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LockKeyhole, LogIn } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { saveAdminSession } from '../lib/localAuth.js';
import Brand from '../components/Brand.jsx';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [login, setLogin] = useState('douglas francisco');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const normalizedLogin = login.trim().replace(/\s+/g, ' ').toLowerCase();

    const { data, error } = await supabase.rpc('local_admin_login', {
      p_login: normalizedLogin,
      p_password: password,
    });

    setLoading(false);

    if (error) {
      console.error(error);
      setError(error.message || 'Login inválido. Verifique nome de usuário e senha.');
      return;
    }

    if (!data?.length) {
      setError('Login inválido. Use "douglas francisco" ou "cristian valente" e senha 123456.');
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
            <div className="password-input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Digite sua senha"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Ocultar senha' : 'Visualizar senha'}
                title={showPassword ? 'Ocultar senha' : 'Visualizar senha'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <div className="login-help">
            Digite seu usuário e senha cadastrados para acessar o painel.
          </div>

          {error && <div className="alert error">{error}</div>}
          <button className="primary-btn full" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar no painel'} <LogIn size={18} />
          </button>
        </form>
      </main>
    </div>
  );
}
