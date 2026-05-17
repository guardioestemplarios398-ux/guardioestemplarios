import { useState } from 'react';
import { Eye, EyeOff, KeyRound, Save } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { getAdminUser, getAdminToken } from '../lib/localAuth.js';

function PasswordField({ label, value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = useState(false);

  return (
    <label>
      {label}
      <div className="password-input-wrap">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setShow((current) => !current)}
          aria-label={show ? 'Ocultar senha' : 'Visualizar senha'}
          title={show ? 'Ocultar senha' : 'Visualizar senha'}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
  );
}

export default function ChangePassword() {
  const adminUser = getAdminUser();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword.length < 6) {
      setError('A nova senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('A confirmação da senha não confere.');
      return;
    }

    setSaving(true);

    const { data, error } = await supabase.rpc('local_admin_change_password', {
      p_token: getAdminToken(),
      p_current_password: currentPassword,
      p_new_password: newPassword,
    });

    setSaving(false);

    if (error) {
      console.error(error);
      setError(error.message || 'Não foi possível alterar a senha.');
      return;
    }

    if (data !== true) {
      setError('Senha atual incorreta.');
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setMessage('Senha alterada com sucesso.');
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <span>Segurança</span>
        <h1>Alterar senha</h1>
        <p>Atualize a senha do usuário administrativo conectado.</p>
      </header>

      <section className="admin-split narrow">
        <form className="panel event-form" onSubmit={handleSubmit}>
          <div className="panel-header">
            <h2><KeyRound size={20} /> Senha do painel</h2>
            <span>{adminUser?.display_name || 'Administrador'}</span>
          </div>

          <PasswordField
            label="Senha atual"
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="Digite sua senha atual"
            autoComplete="current-password"
          />

          <PasswordField
            label="Nova senha"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="Digite a nova senha"
            autoComplete="new-password"
          />

          <PasswordField
            label="Confirmar nova senha"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Confirme a nova senha"
            autoComplete="new-password"
          />

          {message && <div className="alert success">{message}</div>}
          {error && <div className="alert error">{error}</div>}

          <button className="primary-btn full" type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar nova senha'} <Save size={18} />
          </button>

          <div className="login-help">
            Por segurança, escolha uma senha diferente da senha inicial usada no primeiro acesso.
          </div>
        </form>
      </section>
    </div>
  );
}
