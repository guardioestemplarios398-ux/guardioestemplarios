import { ShieldCheck } from 'lucide-react';

export default function Brand({ compact = false }) {
  return (
    <div className={`brand ${compact ? 'brand-compact' : ''}`}>
      <div className="brand-mark">
        <ShieldCheck size={compact ? 24 : 32} />
      </div>
      <div>
        <strong>Guardiões Templários Check-in</strong>
        {!compact && <span>Controle de Presença e Acesso ao Templo</span>}
      </div>
    </div>
  );
}
