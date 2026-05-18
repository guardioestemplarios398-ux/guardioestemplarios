import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, ExternalLink, QrCode } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { supabase } from '../lib/supabase.js';

export default function QrCodePage() {
  const [events, setEvents] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState('checkin-diario-templo');
  const qrRef = useRef(null);
  const publicBase = window.location.origin.replace(/\/$/, '');

  useEffect(() => {
    async function loadEvents() {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });
      setEvents(data || []);
      if (data?.length) setSelectedSlug(data[0].slug);
    }
    loadEvents();
  }, []);

  const selectedEvent = useMemo(() => events.find((event) => event.slug === selectedSlug), [events, selectedSlug]);
  const url = `${publicBase}/checkin/${selectedSlug}`;

  function downloadQr() {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `qr-code-${selectedSlug}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <span>QR Code</span>
        <h1>Gerador de QR Code</h1>
        <p>Baixe o QR Code para imprimir, colocar em banner, telão ou enviar pelo WhatsApp.</p>
      </header>

      <section className="qr-layout">
        <div className="panel qr-options">
          <div className="panel-header"><h2><QrCode size={20} /> Configuração</h2></div>
          <label>
            Evento
            <select value={selectedSlug} onChange={(e) => setSelectedSlug(e.target.value)}>
              {events.map((event) => <option key={event.id} value={event.slug}>{event.name}</option>)}
            </select>
          </label>
          <label>
            Link público
            <input readOnly value={url} onFocus={(e) => e.target.select()} />
          </label>
          <button className="primary-btn full" onClick={downloadQr}><Download size={18} /> Baixar QR Code PNG</button>
          <button className="ghost-btn full" onClick={() => navigator.clipboard.writeText(url)}>Copiar link</button>
          <button className="ghost-btn full" onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}>
            <ExternalLink size={18} /> Abrir link de teste
          </button>
        </div>

        <div className="panel qr-preview">
          <div className="qr-card-print" ref={qrRef}>
            <div className="qr-brand">Guardiões Templários 33 N° 4637</div>
            <QRCodeCanvas value={url} size={260} bgColor="#ffffff" fgColor="#111111" includeMargin />
            <strong>{selectedEvent?.name || 'Check-in'}</strong>
            <span>Escaneie para confirmar sua presença</span>
          </div>
        </div>
      </section>
    </div>
  );
}
