import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Briefcase,
  User,
  Calendar,
  FileText,
  MessageSquareText,
  ClipboardList,
  BrainCircuit,
  Heart,
  Lightbulb,
  AlertTriangle,
} from 'lucide-react';
import { mockInteractions } from '../data/interactions';
import { mockDocuments } from '../data/misc';
import type { PriorityLevel, ObjectiveStatus, InteractionType } from '../types';
import BackButton from '../components/BackButton';
import { useObjectives } from '../context/ObjectivesContext';

const priorityLabels: Record<PriorityLevel, string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Medio',
  low: 'Bajo',
};

const statusLabels: Record<ObjectiveStatus, string> = {
  active: 'Activo',
  monitoring: 'En seguimiento',
  closed: 'Cerrado',
};

const interactionTypeLabels: Record<InteractionType, string> = {
  meeting: 'Reunión',
  call: 'Llamada',
  event: 'Evento',
  interview: 'Entrevista',
  informal: 'Contacto informal',
};

export default function ObjectiveDetail() {
  const { id } = useParams<{ id: string }>();
  const { objectives } = useObjectives();
  const objective = objectives.find((o) => o.id === id);

  if (!objective) {
    return (
      <div className="empty-state">
        <h3 className="empty-state-title">Objetivo no encontrado</h3>
        <Link to="/objectives" className="btn btn-secondary" style={{ marginTop: 16 }}>
          Volver a objetivos
        </Link>
      </div>
    );
  }

  const interactions = mockInteractions.filter((i) => i.objectiveId === id);
  const documents = mockDocuments.filter((d) => d.objectiveId === id);
  const initials = objective.fullName
    .split(' ')
    .filter((_, i, arr) => i === 0 || i === arr.length - 1)
    .map((n) => n[0])
    .join('');

  return (
    <div>
      <BackButton fallbackTo="/objectives" label="Volver a objetivos" />

      {/* Header */}
      <div className="detail-header">
        <div className="avatar avatar-xl">{initials}</div>
        <div className="detail-info">
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: 4 }}>
            <span className={`badge badge-${objective.priority}`}>
              <span className="badge-dot" />
              {priorityLabels[objective.priority]}
            </span>
            <span className={`badge badge-${objective.status}`}>
              {statusLabels[objective.status]}
            </span>
          </div>
          <h2 className="detail-name">{objective.fullName}</h2>
          <p className="detail-role">{objective.title} — {objective.organization}</p>
          <div className="detail-meta">
            <span className="detail-meta-item">
              <MapPin size={14} /> {objective.country}
            </span>
            <span className="detail-meta-item">
              <Briefcase size={14} /> {objective.project}
            </span>
            <span className="detail-meta-item">
              <Calendar size={14} /> Registrado: {new Date(objective.createdAt).toLocaleDateString('es-ES')}
            </span>
          </div>
        </div>
        <div className="btn-group" style={{ flexShrink: 0 }}>
          <Link to={`/analysis?obj=${id}`} className="btn btn-secondary btn-sm">
            <BrainCircuit size={16} /> Análisis
          </Link>
          <Link to={`/ai-chat?obj=${id}`} className="btn btn-primary btn-sm">
            <MessageSquareText size={16} /> Preguntar IA
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="grid-2">
        {/* Left column */}
        <div>
          {/* Biography */}
          <div className="detail-section">
            <h3 className="detail-section-title">
              <User size={18} /> Biografía
            </h3>
            <p className="detail-text">{objective.biography}</p>
          </div>

          {/* Interests */}
          <div className="detail-section">
            <h3 className="detail-section-title">
              <Heart size={18} /> Intereses Personales
            </h3>
            <div className="tag-list">
              {objective.personalInterests.map((interest) => (
                <span className="tag" key={interest}>{interest}</span>
              ))}
            </div>
          </div>

          <div className="detail-section">
            <h3 className="detail-section-title">
              <Lightbulb size={18} /> Intereses Profesionales
            </h3>
            <div className="tag-list">
              {objective.professionalInterests.map((interest) => (
                <span className="tag" key={interest}>{interest}</span>
              ))}
            </div>
          </div>

          {/* Analyst Notes */}
          <div className="detail-section">
            <h3 className="detail-section-title">
              <AlertTriangle size={18} /> Observaciones del Analista
            </h3>
            <div className="analysis-block">
              <p className="analysis-block-content">{objective.analystNotes}</p>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div>
          {/* Interactions */}
          <div className="detail-section">
            <div className="section-header" style={{ marginBottom: 'var(--space-4)' }}>
              <h3 className="detail-section-title" style={{ margin: 0 }}>
                <ClipboardList size={18} /> Interacciones ({interactions.length})
              </h3>
              <Link to="/interactions" className="btn btn-ghost btn-sm">Ver todas</Link>
            </div>
            {interactions.length === 0 ? (
              <p className="text-muted text-sm">No hay interacciones registradas.</p>
            ) : (
              interactions.map((interaction) => (
                <div className="card" key={interaction.id} style={{ marginBottom: 'var(--space-3)', padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                        {interactionTypeLabels[interaction.type]}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {interaction.location} — {interaction.analyst}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                      {interaction.date}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    {interaction.observations.substring(0, 150)}...
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Documents */}
          <div className="detail-section">
            <div className="section-header" style={{ marginBottom: 'var(--space-4)' }}>
              <h3 className="detail-section-title" style={{ margin: 0 }}>
                <FileText size={18} /> Documentos ({documents.length})
              </h3>
              <Link to="/repository" className="btn btn-ghost btn-sm">Ver todos</Link>
            </div>
            {documents.map((doc) => (
              <div className="doc-item" key={doc.id}>
                <div className="doc-icon">
                  <FileText size={16} />
                </div>
                <div className="doc-info">
                  <div className="doc-name">{doc.name}</div>
                  <div className="doc-desc">{doc.category} — {doc.size}</div>
                </div>
                <div className="doc-meta">
                  <span className="doc-meta-item">{doc.dateUploaded}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
