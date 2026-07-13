import { Clock3, LayoutDashboard } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="analyst-dashboard-page">
      <div className="section-header">
        <div>
          <h2 className="section-title">Portal Analista</h2>
          <p className="section-subtitle">
            Espacio principal del analista preparado para futuras capacidades y cuadros de seguimiento.
          </p>
        </div>
      </div>

      <section className="analyst-empty-hero">
        <div className="analyst-empty-icon">
          <LayoutDashboard size={28} />
        </div>
        <span className="analyst-empty-pill">
          <Clock3 size={14} />
          Esperando informacion
        </span>
        <h3 className="analyst-empty-title">Dashboard en preparacion</h3>
        <p className="analyst-empty-text">
          Esta seccion queda reservada para indicadores, actividad reciente y vistas ejecutivas del
          portal del analista. Por ahora se mantiene vacia para no mostrar datos inventados.
        </p>
      </section>
    </div>
  );
}
