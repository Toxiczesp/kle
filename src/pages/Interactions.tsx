import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Calendar,
  MapPin,
  User,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from 'lucide-react';
import { mockInteractions } from '../data/interactions';
import type { InteractionType, AttitudeType, ReceptivityLevel } from '../types';
import BackButton from '../components/BackButton';
import { useObjectives } from '../context/ObjectivesContext';

const interactionTypeLabels: Record<InteractionType, string> = {
  meeting: 'Reunión',
  call: 'Llamada',
  event: 'Evento',
  interview: 'Entrevista',
  informal: 'Contacto informal',
};

const attitudeLabels: Record<AttitudeType, string> = {
  cooperative: 'Cooperativo',
  neutral: 'Neutral',
  reserved: 'Reservado',
  defensive: 'Defensivo',
  hostile: 'Hostil',
};

const receptivityLabels: Record<ReceptivityLevel, string> = {
  very_high: 'Muy alta',
  high: 'Alta',
  moderate: 'Moderada',
  low: 'Baja',
  hostile: 'Hostil',
};

const receptivityColors: Record<ReceptivityLevel, string> = {
  very_high: 'var(--color-success)',
  high: '#22c55e',
  moderate: 'var(--color-warning)',
  low: 'var(--color-danger)',
  hostile: '#dc2626',
};

export default function Interactions() {
  const { objectives } = useObjectives();
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState(false);

  const sorted = [...mockInteractions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowForm(false);
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  return (
    <div>
      <BackButton />
      <div className="section-header">
        <div>
          <h2 className="section-title">Registro de Interacciones</h2>
          <p className="section-subtitle">{mockInteractions.length} interacciones registradas</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Nueva Interacción
        </button>
      </div>

      {/* Interaction List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {sorted.map((interaction) => {
          const obj = objectives.find((o) => o.id === interaction.objectiveId);
          const isExpanded = expandedId === interaction.id;

          return (
            <div className="card" key={interaction.id} style={{ padding: 0, overflow: 'hidden' }}>
              {/* Collapsed header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-4)',
                  padding: 'var(--space-4) var(--space-5)',
                  cursor: 'pointer',
                }}
                onClick={() => setExpandedId(isExpanded ? null : interaction.id)}
              >
                <div className="avatar">
                  {obj?.fullName.split(' ').slice(0, 2).map((n) => n[0]).join('') ?? '??'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    {obj?.fullName ?? 'Desconocido'}
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginTop: 2 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      <Clock size={12} /> {interactionTypeLabels[interaction.type]}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      <MapPin size={12} /> {interaction.location}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      <User size={12} /> {interaction.analyst}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: receptivityColors[interaction.receptivity],
                    }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {interaction.date}
                  </span>
                  {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--color-text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--color-text-muted)' }} />}
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div style={{ padding: '0 var(--space-5) var(--space-5)', borderTop: '1px solid var(--color-border)' }}>
                  <div className="grid-2" style={{ marginTop: 'var(--space-4)' }}>
                    <div>
                      <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-accent-400)', marginBottom: 8 }}>
                        Temas Tratados
                      </h4>
                      <ul style={{ paddingLeft: 'var(--space-5)', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                        {interaction.topicsDiscussed.map((t, i) => <li key={i} style={{ marginBottom: 4 }}>{t}</li>)}
                      </ul>

                      <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-accent-400)', marginBottom: 8, marginTop: 16 }}>
                        Evaluación
                      </h4>
                      <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block' }}>Actitud</span>
                          <span className="badge badge-active" style={{ marginTop: 4 }}>{attitudeLabels[interaction.attitude]}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block' }}>Receptividad</span>
                          <span className="badge badge-medium" style={{ marginTop: 4 }}>{receptivityLabels[interaction.receptivity]}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-accent-400)', marginBottom: 8 }}>
                        Intereses Detectados
                      </h4>
                      <div className="tag-list" style={{ marginBottom: 16 }}>
                        {interaction.detectedInterests.map((interest) => (
                          <span className="tag" key={interest}>{interest}</span>
                        ))}
                      </div>

                      <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-danger)', marginBottom: 8 }}>
                        Riesgos / Alertas
                      </h4>
                      <ul style={{ paddingLeft: 'var(--space-5)', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                        {interaction.risksAlerts.map((r, i) => <li key={i} style={{ marginBottom: 4 }}>{r}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div style={{ marginTop: 'var(--space-4)' }}>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-accent-400)', marginBottom: 8 }}>
                      Observaciones
                    </h4>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                      {interaction.observations}
                    </p>
                  </div>

                  <div style={{ marginTop: 'var(--space-4)' }}>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-accent-400)', marginBottom: 8 }}>
                      Próximos Pasos
                    </h4>
                    <ul style={{ paddingLeft: 'var(--space-5)', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                      {interaction.nextSteps.map((s, i) => <li key={i} style={{ marginBottom: 4 }}>{s}</li>)}
                    </ul>
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
                    <Link to={`/objectives/${interaction.objectiveId}`} className="btn btn-secondary btn-sm">
                      Ver objetivo
                    </Link>
                    <Link to={`/reports?obj=${interaction.objectiveId}`} className="btn btn-ghost btn-sm">
                      Generar informe
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* New Interaction Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <h3 className="modal-title">Nueva Interacción</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Objetivo</label>
                  <select className="form-select" required>
                    <option value="">Seleccionar objetivo...</option>
                    {objectives.map((o) => (
                      <option key={o.id} value={o.id}>{o.fullName}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo de interacción</label>
                  <select className="form-select" required>
                    {Object.entries(interactionTypeLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">Fecha</label>
                  <input className="form-input" type="date" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Lugar</label>
                  <input className="form-input" type="text" placeholder="Ubicación..." required />
                </div>
                <div className="form-group">
                  <label className="form-label">Analista responsable</label>
                  <input className="form-input" type="text" placeholder="Nombre del analista..." required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Temas tratados</label>
                <textarea className="form-textarea" placeholder="Separar temas con saltos de línea..." rows={3} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Actitud del objetivo</label>
                  <select className="form-select">
                    {Object.entries(attitudeLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Nivel de receptividad</label>
                  <select className="form-select">
                    {Object.entries(receptivityLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Intereses detectados</label>
                <input className="form-input" type="text" placeholder="Separar con comas..." />
              </div>
              <div className="form-group">
                <label className="form-label">Riesgos o alertas</label>
                <textarea className="form-textarea" placeholder="Identificar posibles riesgos..." rows={2} />
              </div>
              <div className="form-group">
                <label className="form-label">Próximos pasos recomendados</label>
                <textarea className="form-textarea" placeholder="Acciones a seguir..." rows={2} />
              </div>
              <div className="form-group">
                <label className="form-label">Observaciones libres</label>
                <textarea className="form-textarea" placeholder="Notas adicionales del analista..." rows={3} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  <Calendar size={16} /> Registrar Interacción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="toast">
          <CheckCircle2 size={18} />
          Interacción registrada correctamente (simulación)
        </div>
      )}
    </div>
  );
}
