import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BrainCircuit,
  ClipboardCheck,
  ClipboardList,
  FilePlus2,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useMemo } from 'react';
import { useObjectives } from '../context/ObjectivesContext';
import { useAuthorityData } from '../context/AuthorityDataContext';
import { mockInteractions } from '../data/interactions';

const quickLinks = [
  {
    title: 'Buscador KLE',
    description: 'Consulta dosieres, documentos y fichas completas de otras autoridades.',
    icon: Users,
    to: '/authority/kle',
  },
  {
    title: 'Interacciones',
    description: 'Filtra reuniones por rango de fechas, país, lugar y organismo.',
    icon: ClipboardList,
    to: '/authority/interactions',
  },
  {
    title: 'Valoraciones',
    description: 'Valora el dosier KLE y registra el resultado de cada interacción.',
    icon: ClipboardCheck,
    to: '/authority/evaluations',
  },
  {
    title: 'Solicitud de informes',
    description: 'Encarga nuevos trabajos al equipo de análisis y sigue su estado.',
    icon: FilePlus2,
    to: '/authority/requests',
  },
  {
    title: 'Asistente IA',
    description: 'Consulta informes, históricos y valoraciones desde una única interfaz conversacional.',
    icon: BrainCircuit,
    to: '/authority/ai',
  },
];

export default function AuthorityDashboard() {
  const navigate = useNavigate();
  const { objectives } = useObjectives();
  const { requests, evaluations } = useAuthorityData();

  const highlightedInteractions = useMemo(() => mockInteractions.slice(0, 4), []);

  return (
    <div className="authority-shell">
      <section className="authority-hero">
        <div>
          <div className="authority-kicker">
            <ShieldCheck size={16} /> Portal Autoridad
          </div>
          <h2 className="authority-hero-title">Panel de consulta, solicitud y explotación de información KLE</h2>
          <p className="authority-hero-text">
            Acceda a dosieres KLE, revise interacciones, solicite nuevos informes y apoye sus decisiones con IA.
          </p>
        </div>
        <div className="authority-hero-metrics">
          <div className="authority-metric-card">
            <span>Autoridades activas</span>
            <strong>{objectives.filter((objective) => objective.status !== 'closed').length}</strong>
          </div>
          <div className="authority-metric-card">
            <span>Solicitudes abiertas</span>
            <strong>{requests.filter((request) => request.status !== 'done').length}</strong>
          </div>
          <div className="authority-metric-card">
            <span>Valoraciones registradas</span>
            <strong>{evaluations.length}</strong>
          </div>
        </div>
      </section>

      <section className="authority-grid authority-grid-5">
        {quickLinks.map((item) => (
          <Link key={item.to} className="authority-module-card" to={item.to}>
            <div className="authority-module-icon">
              <item.icon size={22} />
            </div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <span>Entrar <ArrowRight size={14} /></span>
          </Link>
        ))}
      </section>

      <section className="authority-grid authority-grid-2">
        <div className="authority-panel">
          <div className="authority-panel-header">
            <div>
              <h3>Solicitudes en seguimiento</h3>
              <p>Trabajos pendientes del equipo de análisis.</p>
            </div>
          </div>
          <div className="authority-status-stack">
            {requests.slice(0, 3).map((request) => {
              const objective = objectives.find((item) => item.id === request.objectiveId);
              return (
                <div key={request.id} className="authority-status-card">
                  <div className={`badge badge-${request.priority}`}>
                    <span className="badge-dot" />
                    {request.priority}
                  </div>
                  <strong>{request.title}</strong>
                  <span>{objective?.fullName ?? 'Sin autoridad asociada'}</span>
                  <small>{request.dueDate}</small>
                </div>
              );
            })}
          </div>
        </div>

        <div className="authority-panel">
          <div className="authority-panel-header">
            <div>
              <h3>Actividad reciente</h3>
              <p>Últimas reuniones registradas en el sistema.</p>
            </div>
            <Link className="authority-inline-link" to="/authority/interactions">
              Ver interacciones <ArrowRight size={15} />
            </Link>
          </div>
          <div className="authority-timeline">
            {highlightedInteractions.map((interaction) => {
              const objective = objectives.find((item) => item.id === interaction.objectiveId);
              return (
                <button
                  key={interaction.id}
                  className="authority-compact-card"
                  onClick={() => navigate('/authority/interactions')}
                >
                  <div>
                    <strong>{objective?.fullName ?? 'Autoridad'}</strong>
                    <span>{objective?.country ?? '-'} · {interaction.location}</span>
                  </div>
                  <small>{interaction.date}</small>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
