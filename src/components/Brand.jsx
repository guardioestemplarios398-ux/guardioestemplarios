export default function Brand({ compact = false }) {
  return (
    <div className={`brand ${compact ? 'brand-compact' : ''}`}>
      <div className="brand-mark">
        <img src="/logo-guardioes-templarios.png" alt="Logo Guardiões Templários" />
      </div>
      <div>
        <strong>Guardiões Templários 33 N° 4637</strong>
        {!compact && <span>Check-in e Controle de Presença da Loja</span>}
      </div>
    </div>
  );
}
