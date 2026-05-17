import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BarChart3, CalendarDays, KeyRound, LogOut, QrCode, Table2, UserCircle } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { clearAdminSession, getAdminToken, getAdminUser } from '../lib/localAuth.js';
import Brand from './Brand.jsx';

export default function AdminLayout() {
  const navigate = useNavigate();
  const adminUser = getAdminUser();

  async function logout() {
    const token = getAdminToken();

    if (token) {
      await supabase.rpc('local_admin_logout', {
        p_token: token,
      });
    }

    clearAdminSession();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <Brand compact />
        <nav>
          <NavLink to="/admin/dashboard"><BarChart3 size={18} /> Dashboard</NavLink>
          <NavLink to="/admin/checkins"><Table2 size={18} /> Check-ins</NavLink>
          <NavLink to="/admin/events"><CalendarDays size={18} /> Eventos</NavLink>
          <NavLink to="/admin/qrcode"><QrCode size={18} /> QR Code</NavLink>
          <NavLink to="/admin/alterar-senha"><KeyRound size={18} /> Alterar senha</NavLink>
        </nav>
        <button className="ghost-btn sidebar-user" onClick={logout}>
          <UserCircle size={18} /> {adminUser?.display_name || 'Admin'} <LogOut size={16} />
        </button>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
