import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, Home } from 'lucide-react';
import Brand from '../components/Brand.jsx';

export default function SuccessPage() {
  const location = useLocation();
  const name = location.state?.name || 'Visitante';
  const eventName = location.state?.eventName || 'Check-in';

  return (
    <div className="public-page success-page">
      <div className="public-bg" />
      <main className="checkin-card success-card">
        <Brand />
        <div className="success-icon"><CheckCircle2 size={58} /></div>
        <h1>Check-in confirmado</h1>
        <p><strong>{name}</strong>, sua presença foi registrada com sucesso.</p>
        <span>{eventName}</span>
        <Link to="/checkin/checkin-diario-templo" className="secondary-link"><Home size={16} /> Voltar ao check-in</Link>
      </main>
    </div>
  );
}
