import { Navigate, Route, Routes } from 'react-router-dom';
import CheckinPage from './pages/CheckinPage.jsx';
import SuccessPage from './pages/SuccessPage.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminGuard from './pages/AdminGuard.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Checkins from './pages/Checkins.jsx';
import Events from './pages/Events.jsx';
import QrCodePage from './pages/QrCodePage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/checkin/checkin-diario-templo" replace />} />
      <Route path="/checkin/:slug" element={<CheckinPage />} />
      <Route path="/success" element={<SuccessPage />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <AdminGuard>
            <AdminLayout />
          </AdminGuard>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="checkins" element={<Checkins />} />
        <Route path="events" element={<Events />} />
        <Route path="qrcode" element={<QrCodePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/checkin/checkin-diario-templo" replace />} />
    </Routes>
  );
}
