import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileBadge2, FileText, FolderOpen, ScrollText } from 'lucide-react';
import { useObjectives } from '../context/ObjectivesContext';
import { mockDocuments } from '../data/misc';
import { mockInteractions } from '../data/interactions';
import {
  getLastInteractionForObjective,
  getPublishedProfileForObjective,
  getSharedDocumentsForObjective,
  readAuthorityEvaluations,
} from '../data/authorityPortal';

const tabs = [
  { id: 'dossier', label: 'Dosier KLE', icon: FileText },
  { id: 'documents', label: 'Documentos del analista', icon: FolderOpen },
  { id: 'full-report', label: 'Documento integral', icon: ScrollText },
  { id: 'history', label: 'Historial de interacciones', icon: FileText },
  { id: 'feedback', label: 'Valoraciones', icon: FileBadge2 },
] as const;

export default function AuthorityProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { objectives } = useObjectives();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('dossier');

  const objective = objectives.find((item) => item.id === id);
  const publishedProfile = id ? getPublishedProfileForObjective(id) : undefined;
  const sharedDocuments = id ? getSharedDocumentsForObjective(id) : [];
  const lastInteraction = id ? getLastInteractionForObjective(id) : undefined;
  const documents = mockDocuments.filter((document) => document.objectiveId === id);
  const interactions = useMemo(
    () =>
      mockInteractions
        .filter((interaction) => interaction.objectiveId === id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [id]
  );
  const evaluations = readAuthorityEvaluations().filter((evaluation) => evaluation.objectiveId === id);

  const averageEvaluation = (evaluation: (typeof evaluations)[number]) => {
    const values = [
      evaluation.strategyFit,
      evaluation.trustAndCommunication,
      evaluation.objectiveProgress,
      evaluation.objectionHandling,
      evaluation.nextStepsClarity,
    ];

    return (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1);
  };

  if (!objective) {
    return (
      <div className="authority-shell">
        <div className="empty-state">
          <div className="empty-state-title">Autoridad no encontrada</div>
          <p className="empty-state-text">No hemos localizado la ficha solicitada en el sistema.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="authority-shell">
      <button className="back-link" onClick={() => navigate('/authority/kle')}>
        <ArrowLeft size={16} /> Volver al buscador KLE
      </button>

      <section className="authority-profile-hero">
        <div className="authority-profile-main">
          <div className="avatar avatar-xl">
            {objective.fullName
              .split(' ')
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase() ?? '')
              .join('')}
          </div>
          <div>
            <h2>{objective.fullName}</h2>
            <p>{objective.title}</p>
            <div className="authority-profile-tags">
              <span>{objective.organization}</span>
              <span>{objective.country}</span>
              <span>{lastInteraction ? `Ultima interaccion: ${lastInteraction.date}` : 'Sin interacciones registradas'}</span>
            </div>
          </div>
        </div>
        <div className="authority-profile-side">
          <div className={`badge badge-${objective.priority}`}>{objective.priority}</div>
          <div className={`badge badge-${objective.status}`}>{objective.status}</div>
        </div>
      </section>

      <section className="authority-grid authority-grid-4">
        <div className="authority-info-card">
          <span>Nombre</span>
          <strong>{objective.fullName}</strong>
        </div>
        <div className="authority-info-card">
          <span>Cargo</span>
          <strong>{objective.title}</strong>
        </div>
        <div className="authority-info-card">
          <span>Organizacion</span>
          <strong>{objective.organization}</strong>
        </div>
        <div className="authority-info-card">
          <span>Pais</span>
          <strong>{objective.country}</strong>
        </div>
      </section>

      <section className="authority-panel">
        <div className="authority-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`authority-tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'dossier' && (
          <div className="authority-rich-content">
            <h3>Dosier publicado por el analista</h3>
            <p>{publishedProfile?.generalInfo ?? 'Pendiente de publicacion por el analista.'}</p>
            <h3>Resumen ejecutivo</h3>
            <p>{publishedProfile?.executiveSummary ?? 'Pendiente de publicacion por el analista.'}</p>
            <h3>Analisis de comportamiento</h3>
            <p>{publishedProfile?.behaviorAnalysis ?? 'Pendiente de publicacion por el analista.'}</p>
            <h3>Analisis sociocultural</h3>
            <p>{publishedProfile?.socioculturalAnalysis ?? 'Pendiente de publicacion por el analista.'}</p>
            <h3>Aspectos mas relevantes</h3>
            <ul>
              {objective.professionalInterests.map((interest) => <li key={interest}>{interest}</li>)}
            </ul>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="authority-rich-content">
            <h3>Documentacion sincronizada entre analista y autoridad</h3>
            <div className="authority-doc-list">
              {sharedDocuments.length > 0 ? (
                sharedDocuments.map((document) => (
                  <div key={document.id} className="authority-doc-card">
                    <strong>{document.name}</strong>
                    <span>{document.description}</span>
                    <small>
                      {document.category} · {new Date(document.uploadedAt).toLocaleString('es-ES')} · {document.analystName}
                    </small>
                    <a
                      className="authority-inline-link"
                      href={document.fileDataUrl}
                      download={document.name}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Abrir documento
                    </a>
                  </div>
                ))
              ) : (
                <p>Pendiente de subida de documentos por el analista.</p>
              )}
            </div>

            <h3>Documentos asociados del expediente</h3>
            <div className="authority-doc-list">
              {documents.map((document) => (
                <div key={document.id} className="authority-doc-card">
                  <strong>{document.name}</strong>
                  <span>{document.description}</span>
                  <small>{document.dateUploaded} · {document.size}</small>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'full-report' && (
          <div className="authority-rich-content">
            <h3>Documento integral elaborado por analistas</h3>
            <p style={{ whiteSpace: 'pre-line' }}>
              {publishedProfile?.fullReport ?? 'Pendiente de publicacion por el analista.'}
            </p>
            {publishedProfile && (
              <small style={{ color: 'var(--color-text-muted)' }}>
                Publicado por {publishedProfile.analystName}.
              </small>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="authority-rich-content">
            <h3>Historial cronologico</h3>
            <div className="authority-history-list">
              {interactions.map((interaction) => {
                const evaluation = evaluations.find((item) => item.date === interaction.date && item.location === interaction.location);
                return (
                  <div key={interaction.id} className="authority-history-card">
                    <div className="authority-history-card-head">
                      <strong>{interaction.date}</strong>
                      <span>{interaction.location}</span>
                    </div>
                    <p><strong>Objetivo:</strong> {interaction.nextSteps[0] ?? 'Seguimiento relacional y operativo.'}</p>
                    <p><strong>Resultado:</strong> {interaction.observations}</p>
                    <p><strong>Valoracion:</strong> {evaluation ? `Media ${averageEvaluation(evaluation)}/10` : 'Sin valoracion registrada'}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="authority-rich-content">
            <h3>Valoraciones de interacciones</h3>
            <div className="authority-history-list">
              {evaluations.length > 0 ? (
                evaluations.map((evaluation) => (
                  <div key={evaluation.id} className="authority-history-card">
                    <div className="authority-history-card-head">
                      <strong>{evaluation.date}</strong>
                      <span>Media {averageEvaluation(evaluation)}/10</span>
                    </div>
                    <p><strong>Lugar:</strong> {evaluation.location}</p>
                    <p><strong>Dificultades:</strong> {evaluation.difficulties}</p>
                    <p><strong>Oportunidades:</strong> {evaluation.opportunities}</p>
                    <p><strong>Cambios futuros:</strong> {evaluation.futureChanges}</p>
                  </div>
                ))
              ) : (
                <p>No hay valoraciones de interacciones registradas.</p>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
