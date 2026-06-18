import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  FileStack,
  Globe,
  MessageSquare,
  BookOpen,
  Printer,
  Download,
  Mail,
  ArrowLeft,
  CheckCircle2,
  Target,
} from 'lucide-react';
import { mockInteractions } from '../data/interactions';
import { mockAnalyses, mockReportTemplates } from '../data/misc';
import type { InteractionType } from '../types';
import BackButton from '../components/BackButton';
import { useObjectives } from '../context/ObjectivesContext';

const templateIcons: Record<string, React.ReactNode> = {
  FileText: <FileText size={22} />,
  FileStack: <FileStack size={22} />,
  Globe: <Globe size={22} />,
  MessageSquare: <MessageSquare size={22} />,
  BookOpen: <BookOpen size={22} />,
};

const interactionTypeLabels: Record<InteractionType, string> = {
  meeting: 'Reunión',
  call: 'Llamada',
  event: 'Evento',
  interview: 'Entrevista',
  informal: 'Contacto informal',
};

export default function Reports() {
  const { objectives } = useObjectives();
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get('obj') || '';
  const [selectedObjective, setSelectedObjective] = useState(
    preselected || ''
  );
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const objective = objectives.find((o) => o.id === selectedObjective);
  const analysis = mockAnalyses[selectedObjective];
  const interactions = mockInteractions.filter((i) => i.objectiveId === selectedObjective);

  useEffect(() => {
    if (!selectedObjective && objectives[0]?.id) {
      setSelectedObjective(preselected || objectives[0].id);
    }
  }, [objectives, preselected, selectedObjective]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const renderReport = () => {
    if (!objective || !selectedTemplate) return null;
    const template = mockReportTemplates.find((t) => t.id === selectedTemplate);
    if (!template) return null;

    const now = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return (
      <div>
        <button
          className="back-link"
          onClick={() => setSelectedTemplate(null)}
        >
          <ArrowLeft size={16} /> Volver a plantillas
        </button>

        <div className="report-preview" id="report-content">
          {/* Report Header */}
          <div className="report-meta">
            <div>
              <div className="report-meta-label">Clasificación</div>
              <div style={{ fontWeight: 700, color: 'var(--color-warning)' }}>
                CONFIDENCIAL — USO INTERNO
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="report-meta-label">Fecha de generación</div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{now}</div>
            </div>
          </div>

          <h1>{template.name}</h1>
          <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
            Objetivo: {objective.fullName} — {objective.organization}
          </p>

          {/* Summary report */}
          {(selectedTemplate === 'rpt-summary' || selectedTemplate === 'rpt-consolidated') && (
            <>
              <h2>1. Datos Básicos</h2>
              <table className="table" style={{ marginBottom: 'var(--space-4)' }}>
                <tbody>
                  <tr><td style={{ fontWeight: 600, width: 200 }}>Nombre completo</td><td>{objective.fullName}</td></tr>
                  <tr><td style={{ fontWeight: 600 }}>Cargo</td><td>{objective.title}</td></tr>
                  <tr><td style={{ fontWeight: 600 }}>Organización</td><td>{objective.organization}</td></tr>
                  <tr><td style={{ fontWeight: 600 }}>País</td><td>{objective.country}</td></tr>
                  <tr><td style={{ fontWeight: 600 }}>Proyecto</td><td>{objective.project}</td></tr>
                  <tr><td style={{ fontWeight: 600 }}>Prioridad</td><td style={{ textTransform: 'uppercase' }}>{objective.priority}</td></tr>
                  <tr><td style={{ fontWeight: 600 }}>Estado</td><td style={{ textTransform: 'uppercase' }}>{objective.status}</td></tr>
                </tbody>
              </table>

              {analysis && (
                <>
                  <h2>2. Resumen Ejecutivo</h2>
                  <p>{analysis.executiveSummary}</p>
                </>
              )}

              <h2>{analysis ? '3' : '2'}. Estado de la Relación</h2>
              <p>
                Se han registrado <strong>{interactions.length}</strong> interacciones con este objetivo.
                {interactions.length > 0 && (
                  <> La última interacción fue el {interactions[0]?.date} en {interactions[0]?.location}.</>
                )}
              </p>

              {analysis && (
                <>
                  <h2>4. Recomendaciones</h2>
                  <p>{analysis.recommendations}</p>
                </>
              )}
            </>
          )}

          {/* Complete report */}
          {selectedTemplate === 'rpt-complete' && (
            <>
              <h2>1. Datos Biográficos</h2>
              <p>{objective.biography}</p>

              {analysis && (
                <>
                  <h2>2. Perfil de Personalidad</h2>
                  <p>{analysis.personalityProfile}</p>

                  <h2>3. Motivaciones</h2>
                  <p>{analysis.motivations}</p>

                  <h2>4. Puntos de Conexión</h2>
                  <p>{analysis.connectionPoints}</p>

                  <h2>5. Riesgos de Comunicación</h2>
                  <p>{analysis.communicationRisks}</p>

                  <h2>6. Recomendaciones</h2>
                  <p>{analysis.recommendations}</p>
                </>
              )}

              <h2>{analysis ? '7' : '2'}. Historial de Interacciones</h2>
              {interactions.length > 0 ? (
                interactions.map((inter, idx) => (
                  <div key={inter.id} style={{ marginBottom: 'var(--space-4)' }}>
                    <h3>{idx + 1}. {interactionTypeLabels[inter.type]} — {inter.date}</h3>
                    <p><strong>Lugar:</strong> {inter.location}</p>
                    <p><strong>Analista:</strong> {inter.analyst}</p>
                    <p><strong>Observaciones:</strong> {inter.observations}</p>
                  </div>
                ))
              ) : (
                <p>No hay interacciones registradas.</p>
              )}
            </>
          )}

          {/* Sociocultural report */}
          {selectedTemplate === 'rpt-sociocultural' && (
            <>
              <h2>1. Intereses Personales</h2>
              <ul>
                {objective.personalInterests.map((i) => <li key={i}>{i}</li>)}
              </ul>

              <h2>2. Intereses Profesionales</h2>
              <ul>
                {objective.professionalInterests.map((i) => <li key={i}>{i}</li>)}
              </ul>

              {analysis && (
                <>
                  <h2>3. Contexto Sociocultural</h2>
                  <p>{analysis.socioculturalInterests}</p>

                  <h2>4. Puntos de Conexión</h2>
                  <p>{analysis.connectionPoints}</p>

                  <h2>5. Recomendaciones Culturales</h2>
                  <p>{analysis.recommendations}</p>
                </>
              )}
            </>
          )}

          {/* Interaction evaluation report */}
          {selectedTemplate === 'rpt-interaction' && (
            <>
              {interactions.length > 0 ? (
                interactions.map((inter, idx) => (
                  <div key={inter.id}>
                    <h2>{idx + 1}. {interactionTypeLabels[inter.type]} — {inter.date}</h2>
                    <h3>Datos de la Interacción</h3>
                    <p><strong>Fecha:</strong> {inter.date}</p>
                    <p><strong>Lugar:</strong> {inter.location}</p>
                    <p><strong>Analista:</strong> {inter.analyst}</p>
                    <p><strong>Tipo:</strong> {interactionTypeLabels[inter.type]}</p>

                    <h3>Temas Tratados</h3>
                    <ul>
                      {inter.topicsDiscussed.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>

                    <h3>Evaluación</h3>
                    <p><strong>Actitud:</strong> {inter.attitude}</p>
                    <p><strong>Receptividad:</strong> {inter.receptivity}</p>

                    <h3>Intereses Detectados</h3>
                    <ul>
                      {inter.detectedInterests.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>

                    <h3>Riesgos</h3>
                    <ul>
                      {inter.risksAlerts.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>

                    <h3>Próximos Pasos</h3>
                    <ul>
                      {inter.nextSteps.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>

                    <h3>Observaciones</h3>
                    <p>{inter.observations}</p>

                    {idx < interactions.length - 1 && <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-6) 0' }} />}
                  </div>
                ))
              ) : (
                <p>No hay interacciones registradas para este objetivo.</p>
              )}
            </>
          )}

          {/* Consolidated */}
          {selectedTemplate === 'rpt-consolidated' && analysis && (
            <>
              <h2>5. Perfil de Personalidad</h2>
              <p>{analysis.personalityProfile}</p>

              <h2>6. Intereses Socioculturales</h2>
              <p>{analysis.socioculturalInterests}</p>

              <h2>7. Motivaciones</h2>
              <p>{analysis.motivations}</p>

              <h2>8. Evaluación de Riesgos</h2>
              <p>{analysis.communicationRisks}</p>

              <h2>9. Historial de Interacciones</h2>
              {interactions.map((inter, idx) => (
                <div key={inter.id} style={{ marginBottom: 'var(--space-3)' }}>
                  <p><strong>{idx + 1}. {interactionTypeLabels[inter.type]}</strong> — {inter.date}, {inter.location}</p>
                  <p style={{ fontSize: '0.8rem' }}>{inter.observations}</p>
                </div>
              ))}

              <h2>10. Recomendaciones Finales</h2>
              <p>{analysis.recommendations}</p>
            </>
          )}

          {/* Report footer */}
          <div style={{ marginTop: 'var(--space-8)', paddingTop: 'var(--space-4)', borderTop: '2px solid var(--color-border)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Documento generado automáticamente por KLE Platform — {now}
            </p>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
              Este documento contiene información clasificada. Distribución restringida.
            </p>
          </div>
        </div>

        {/* Report Actions */}
        <div className="report-actions" style={{ maxWidth: 800, margin: '0 auto' }}>
          <button
            className="btn btn-primary"
            onClick={() => showToast('PDF generado correctamente (simulación)')}
          >
            <Download size={16} /> Exportar PDF
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => window.print()}
          >
            <Printer size={16} /> Imprimir
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => showToast('Email enviado correctamente (simulación)')}
          >
            <Mail size={16} /> Enviar por Email
          </button>
        </div>
      </div>
    );
  };

  if (selectedTemplate) {
    return <div>{renderReport()}</div>;
  }

  return (
    <div>
      <BackButton />
      <div className="section-header">
        <div>
          <h2 className="section-title">Generación de Informes</h2>
          <p className="section-subtitle">Selecciona una plantilla y un objetivo para generar el informe</p>
        </div>
      </div>

      {/* Objective Selector */}
      <div
        className="card"
        style={{
          marginBottom: 'var(--space-6)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-4)',
        }}
      >
        <div
          className="avatar"
          style={{
            background: 'linear-gradient(135deg, var(--color-accent-500), var(--color-primary-400))',
          }}
        >
          <Target size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <label className="form-label" style={{ margin: 0 }}>Objetivo para el informe</label>
          <select
            className="form-select"
            value={selectedObjective}
            onChange={(e) => setSelectedObjective(e.target.value)}
            style={{ marginTop: 4 }}
          >
            {objectives.map((o) => (
              <option key={o.id} value={o.id}>
                {o.fullName} — {o.organization}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid-3" style={{ marginBottom: 'var(--space-6)' }}>
        {mockReportTemplates.map((template) => (
          <div
            key={template.id}
            className="report-card"
            onClick={() => setSelectedTemplate(template.id)}
          >
            <div className="report-card-icon">
              {templateIcons[template.icon]}
            </div>
            <div className="report-card-title">{template.name}</div>
            <div className="report-card-desc">{template.description}</div>
            <div>
              <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                Secciones incluidas
              </p>
              <div className="tag-list">
                {template.sections.map((s) => (
                  <span className="tag" key={s} style={{ fontSize: '0.65rem' }}>{s}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}
