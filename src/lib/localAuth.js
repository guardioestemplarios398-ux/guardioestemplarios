const TOKEN_KEY = 'gt_admin_token';
const USER_KEY = 'gt_admin_user';

export function saveAdminSession(session) {
  if (!session?.token) return;
  localStorage.setItem(TOKEN_KEY, session.token);
  localStorage.setItem(USER_KEY, JSON.stringify({
    user_id: session.user_id,
    display_name: session.display_name,
    role: session.role,
    expires_at: session.expires_at,
  }));
}

export function getAdminToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getAdminUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function clearAdminSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
