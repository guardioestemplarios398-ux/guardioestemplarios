import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { clearAdminSession, getAdminToken, saveAdminSession } from '../lib/localAuth.js';
import Loading from '../components/Loading.jsx';

export default function AdminGuard({ children }) {
  const [state, setState] = useState({ loading: true, allowed: false });

  useEffect(() => {
    async function verify() {
      const token = getAdminToken();

      if (!token) {
        setState({ loading: false, allowed: false });
        return;
      }

      const { data, error } = await supabase.rpc('local_admin_validate', {
        p_token: token,
      });

      if (error || !data?.length) {
        clearAdminSession();
        setState({ loading: false, allowed: false });
        return;
      }

      saveAdminSession({ token, ...data[0] });
      setState({ loading: false, allowed: true });
    }

    verify();
  }, []);

  if (state.loading) return <Loading message="Validando acesso administrativo..." />;
  if (!state.allowed) return <Navigate to="/admin/login" replace />;
  return children;
}
