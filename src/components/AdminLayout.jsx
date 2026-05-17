import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BarChart3, CalendarDays, LogOut, QrCode, Table2, UserCircle } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import Brand from './Brand.jsx';

export default function AdminLayout() {
  const navigate = useNavigate();

  async function logout() {
    await supabase.auth.signOut();
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
        </nav>
        <button className="ghost-btn sidebar-user" onClick={logout}>
          <UserCircle size={18} /> Admin <LogOut size={16} />
        </button>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
