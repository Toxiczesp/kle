import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Globe2, Radar, ScrollText } from 'lucide-react';
import { useObjectives } from '../context/ObjectivesContext';
import { mockAnalyses, mockDocuments } from '../data/misc';
import { mockInteractions } from '../data/interactions';
import { getLastInteractionForObjective, ratingLabels, readAuthorityEvaluations } from '../data/authorityPortal';

const tabs = [
  { id: 'executive', label: 'Resumen ejecutivo', icon: FileText },
  { id: 'behavior', label: 'Analisis de comportamiento', icon: Radar },
  { id: 'sociocultural', label: 'Analisis sociocultural', icon: Globe2 },
  { id: 'full-report', label: 'Documento completo', icon: ScrollText },
  { id: 'history', label: 'Historial de interacciones', icon: FileText },
] as const;

export default function AuthorityProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { objectives } = useObjectives();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('executive');

  const objective = objectives.find((item) => item.id === id);
  const analysis = id ? mockAnalyses[id] : undefined;
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

        {activeTab === 'executive' && (
          <div className="authority-rich-content">
            <h3>Informacion general</h3>
            <p>{objective.biography}</p>
            <h3>Resumen ejecutivo</h3>
            <p>{analysis?.executiveSummary ?? 'No hay resumen ejecutivo disponible todavia.'}</p>
            <h3>Aspectos mas relevantes</h3>
            <ul>
              {objective.professionalInterests.map((interest) => <li key={interest}>{interest}</li>)}
            </ul>
          </div>
        )}

        {activeTab === 'behavior' && (
          <div className="authority-rich-content">
            <h3>Forma de comunicacion</h3>
            <p>{analysis?.personalityProfile ?? objective.analystNotes}</p>
            <h3>Patrones observados</h3>
            <ul>
              {interactions.slice(0, 3).map((interaction) => (
                <li key={interaction.id}>
                  {interaction.date}: {interaction.topicsDiscussed.join(', ')}.
                </li>
              ))}
            </ul>
            <h3>Intereses detectados</h3>
            <ul>
              {objective.personalInterests.concat(objective.professionalInterests).slice(0, 6).map((interest) => (
                <li key={interest}>{interest}</li>
              ))}
            </ul>
            <h3>Riesgos y oportunidades</h3>
            <p>{analysis?.communicationRisks ?? 'Sin riesgos documentados.'}</p>
            <p>{analysis?.recommendations ?? 'Sin oportunidades registradas.'}</p>
          </div>
        )}

        {activeTab === 'sociocultural' && (
          <div className="authority-rich-content">
            <h3>Contexto cultural</h3>
            <p>{analysis?.socioculturalInterests ?? 'No hay analisis sociocultural disponible.'}</p>
            <h3>Consideraciones protocolarias</h3>
            <p>{objective.analystNotes}</p>
            <h3>Sensibilidades identificadas</h3>
            <ul>
              {interactions.flatMap((interaction) => interaction.risksAlerts).slice(0, 5).map((risk, index) => (
                <li key={`${risk}-${index}`}>{risk}</li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'full-report' && (
          <div className="authority-rich-content">
            <h3>Documento completo elaborado por analistas</h3>
            <p>{analysis?.executiveSummary ?? objective.biography}</p>
            <p>{analysis?.personalityProfile ?? objective.analystNotes}</p>
            <p>{analysis?.socioculturalInterests ?? ''}</p>
            <h3>Documentos asociados</h3>
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
                    <p><strong>Valoracion:</strong> {evaluation ? `${evaluation.rating} - ${ratingLabels[evaluation.rating]}` : 'Sin valoracion registrada'}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
