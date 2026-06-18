import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BrainCircuit,
  FileText,
  Heart,
  Lightbulb,
  Link2,
  AlertTriangle,
  CheckCircle,
  Target,
} from 'lucide-react';
import { mockAnalyses } from '../data/misc';
import BackButton from '../components/BackButton';
import { useObjectives } from '../context/ObjectivesContext';

const analysisIcons: Record<string, React.ReactNode> = {
  executiveSummary: <FileText size={18} />,
  personalityProfile: <BrainCircuit size={18} />,
  socioculturalInterests: <Heart size={18} />,
  motivations: <Lightbulb size={18} />,
  connectionPoints: <Link2 size={18} />,
  communicationRisks: <AlertTriangle size={18} />,
  recommendations: <CheckCircle size={18} />,
};

const analysisTitles: Record<string, string> = {
  executiveSummary: 'Resumen Ejecutivo',
  personalityProfile: 'Perfil de Personalidad',
  socioculturalInterests: 'Intereses Socioculturales',
  motivations: 'Motivaciones',
  connectionPoints: 'Puntos de Conexión',
  communicationRisks: 'Riesgos de Comunicación',
  recommendations: 'Recomendaciones',
};

export default function Analysis() {
  const { objectives } = useObjectives();
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get('obj') || '';
  const [selectedObjective, setSelectedObjective] = useState(preselected || '');

  const analysis = mockAnalyses[selectedObjective];
  const objective = objectives.find((o) => o.id === selectedObjective);

  useEffect(() => {
    if (!selectedObjective && objectives[0]?.id) {
      setSelectedObjective(preselected || objectives[0].id);
    }
  }, [objectives, preselected, selectedObjective]);

  return (
    <div>
      <BackButton />
      <div className="section-header">
        <div>
          <h2 className="section-title">Análisis de Personalidad e Intereses</h2>
          <p className="section-subtitle">
            Perfil analítico completo del objetivo seleccionado
          </p>
        </div>
      </div>

      {/* Objective selector */}
      <div className="form-group" style={{ maxWidth: 400 }}>
        <label className="form-label">Seleccionar Objetivo</label>
        <select
          className="form-select"
          value={selectedObjective}
          onChange={(e) => setSelectedObjective(e.target.value)}
        >
          {objectives
            .filter((o) => o.status !== 'closed')
            .map((o) => (
              <option key={o.id} value={o.id}>
                {o.fullName} — {o.organization}
              </option>
            ))}
        </select>
      </div>

      {/* Objective header */}
      {objective && (
        <div
          className="card"
          style={{
            marginBottom: 'var(--space-6)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-4)',
            background: 'linear-gradient(135deg, rgba(0,212,255,0.04), rgba(36,66,127,0.08))',
            borderColor: 'rgba(0,212,255,0.15)',
          }}
        >
          <div className="avatar avatar-lg" style={{ background: 'linear-gradient(135deg, var(--color-accent-500), var(--color-primary-400))' }}>
            <Target size={28} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 2 }}>{objective.fullName}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              {objective.title} — {objective.organization}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
              {objective.country} • {objective.project}
            </div>
          </div>
        </div>
      )}

      {/* Analysis Content */}
      {analysis ? (
        <div>
          {(Object.keys(analysisTitles) as Array<keyof typeof analysisTitles>).map((key) => {
            const content = analysis[key as keyof typeof analysis];
            if (!content || key === 'objectiveId') return null;
            return (
              <div className="analysis-block" key={key}>
                <div className="analysis-block-title">
                  {analysisIcons[key]}
                  {analysisTitles[key]}
                </div>
                <div className="analysis-block-content">{content as string}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <BrainCircuit size={28} />
          </div>
          <h3 className="empty-state-title">Análisis no disponible</h3>
          <p className="empty-state-text">
            No se ha generado un análisis de personalidad para este objetivo.
            En un entorno real, este análisis sería generado por IA a partir de la información recopilada.
          </p>
        </div>
      )}
    </div>
  );
}
