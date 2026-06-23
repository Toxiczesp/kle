import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BrainCircuit,
  ClipboardCheck,
  ClipboardList,
  FilePlus2,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useObjectives } from '../context/ObjectivesContext';
import { mockInteractions } from '../data/interactions';
import { readAuthorityRequests, readAuthorityEvaluations } from '../data/authorityPortal';

const quickLinks = [
  {
    title: 'Buscador KLE',
    description: 'Consulta fichas completas, informes e historicos de otras autoridades.',
    icon: Users,
    to: '/authority/kle',
  },
  {
    title: 'Buscador de interacciones',
    description: 'Filtra reuniones por fecha, lugar, pais, autoridad u organizacion.',
    icon: ClipboardList,
    to: '/authority/interactions',
  },
  {
    title: 'Solicitud de informes',
    description: 'Encarga nuevos trabajos al equipo de analisis y sigue su estado.',
    icon: FilePlus2,
    to: '/authority/requests',
  },
  {
    title: 'Asistente IA',
    description: 'Explota informes, historicos y valoraciones desde una interfaz conversacional.',
    icon: BrainCircuit,
    to: '/authority/ai',
  },
  {
    title: 'Valoracion de interacciones',
    description: 'Registra objetivos previstos, resultados reales y lecciones de cada reunion.',
    icon: ClipboardCheck,
    to: '/authority/evaluations',
  },
];

export default function AuthorityDashboard() {
  const navigate = useNavigate();
  const { objectives } = useObjectives();
  const [kleQuery, setKleQuery] = useState('');
  const [interactionQuery, setInteractionQuery] = useState('');

  const requests = readAuthorityRequests();
  const evaluations = readAuthorityEvaluations();

  const highlightedObjectives = useMemo(
    () =>
      objectives
        .filter((objective) =>
          objective.fullName.toLowerCase().includes(kleQuery.toLowerCase()) ||
          objective.organization.toLowerCase().includes(kleQuery.toLowerCase()) ||
          objective.country.toLowerCase().includes(kleQuery.toLowerCase())
        )
        .slice(0, 4),
    [kleQuery, objectives]
  );

  const highlightedInteractions = useMemo(
    () =>
      mockInteractions
        .filter((interaction) => {
          const objective = objectives.find((item) => item.id === interaction.objectiveId);
          const haystack = [
            interaction.location,
            interaction.date,
            objective?.fullName ?? '',
            objective?.organization ?? '',
            objective?.country ?? '',
          ]
            .join(' ')
            .toLowerCase();
          return haystack.includes(interactionQuery.toLowerCase());
        })
        .slice(0, 4),
    [interactionQuery, objectives]
  );

  return (
    <div className="authority-shell">
      <section className="authority-hero">
        <div>
          <div className="authority-kicker">
            <ShieldCheck size={16} /> Portal Autoridad
          </div>
          <h2 className="authority-hero-title">Panel de consulta, solicitud y explotacion de informacion KLE</h2>
          <p className="authority-hero-text">
            Accede a fichas KLE, revisa interacciones, solicita nuevos informes y apoya tus decisiones con IA.
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

      <section className="authority-grid authority-grid-2">
        <div className="authority-panel">
          <div className="authority-panel-header">
            <div>
              <h3>Buscador KLE</h3>
              <p>Busca una autoridad por nombre, pais u organizacion.</p>
            </div>
            <Link className="authority-inline-link" to="/authority/kle">
              Abrir modulo <ArrowRight size={15} />
            </Link>
          </div>
          <div className="authority-search-input">
            <Search size={16} />
            <input
              type="text"
              value={kleQuery}
              onChange={(e) => setKleQuery(e.target.value)}
              placeholder="Ej. Ahmed Al-Rashidi, Maravia, Ministerio..."
            />
          </div>
          <div className="authority-compact-list">
            {highlightedObjectives.map((objective) => (
              <button
                key={objective.id}
                className="authority-compact-card"
                onClick={() => navigate(`/authority/kle/${objective.id}`)}
              >
                <div>
                  <strong>{objective.fullName}</strong>
                  <span>{objective.title}</span>
                </div>
                <small>{objective.country}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="authority-panel">
          <div className="authority-panel-header">
            <div>
              <h3>Buscador de interacciones</h3>
              <p>Localiza rapidamente reuniones por lugar, fecha o autoridad.</p>
            </div>
            <Link className="authority-inline-link" to="/authority/interactions">
              Abrir modulo <ArrowRight size={15} />
            </Link>
          </div>
          <div className="authority-search-input">
            <Search size={16} />
            <input
              type="text"
              value={interactionQuery}
              onChange={(e) => setInteractionQuery(e.target.value)}
              placeholder="Ej. Madrid, 2026-05, Ibrahim..."
            />
          </div>
          <div className="authority-compact-list">
            {highlightedInteractions.map((interaction) => {
              const objective = objectives.find((item) => item.id === interaction.objectiveId);
              return (
                <button key={interaction.id} className="authority-compact-card" onClick={() => navigate('/authority/interactions')}>
                  <div>
                    <strong>{objective?.fullName ?? 'Autoridad sin identificar'}</strong>
                    <span>{interaction.location}</span>
                  </div>
                  <small>{interaction.date}</small>
                </button>
              );
            })}
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

      <section className="authority-grid authority-grid-3">
        <div className="authority-panel">
          <div className="authority-panel-header">
            <div>
              <h3>Solicitudes en seguimiento</h3>
              <p>Trabajos pendientes del equipo de analisis.</p>
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
              <p>Ultimas reuniones registradas en el sistema.</p>
            </div>
          </div>
          <div className="authority-timeline">
            {mockInteractions.slice(0, 3).map((interaction) => {
              const objective = objectives.find((item) => item.id === interaction.objectiveId);
              return (
                <div key={interaction.id} className="authority-timeline-item">
                  <div className="authority-timeline-dot" />
                  <div>
                    <strong>{objective?.fullName ?? 'Autoridad'}</strong>
                    <p>{interaction.location}</p>
                    <small>{interaction.date}</small>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="authority-panel authority-panel-accent">
          <div className="authority-panel-header">
            <div>
              <h3>Acceso IA</h3>
              <p>Consulta patrones, riesgos y recomendaciones.</p>
            </div>
          </div>
          <div className="authority-ai-callout">
            <Sparkles size={18} />
            <p>
              Resume toda la informacion disponible sobre una autoridad, compara interacciones y prepara una proxima reunion.
            </p>
            <Link className="btn btn-primary" to="/authority/ai">
              Abrir Asistente IA
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
