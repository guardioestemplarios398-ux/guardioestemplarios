import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import Loading from '../components/Loading.jsx';

export default function AdminGuard({ children }) {
  const [state, setState] = useState({ loading: true, allowed: false });

  useEffect(() => {
    async function verify() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setState({ loading: false, allowed: false });
        return;
      }

      const { data, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('active', true)
        .limit(1);

      setState({ loading: false, allowed: !error && Boolean(data?.length) });
    }

    verify();
  }, []);

  if (state.loading) return <Loading message="Validando acesso administrativo..." />;
  if (!state.allowed) return <Navigate to="/admin/login" replace />;
  return children;
}
