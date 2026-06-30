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
  personalityProfile: 'Perfilado Personalidad',
  socioculturalInterests: 'Intereses Socioculturales',
  motivations: 'Motivaciones',
  connectionPoints: 'Puntos de conexión',
  communicationRisks: 'Riesgos de comunicación',
  recommendations: 'Recomendaciones',
};

const areaLabels: Record<string, string> = {
  personality: 'Info Autoridad Objetivo',
  'psychological-profile': 'Perfilado Personalidad',
  sociocultural: 'Área sociocultural',
};

export default function Analysis() {
  const { objectives } = useObjectives();
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get('obj') || '';
  const activeArea = searchParams.get('area') || 'personality';
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
          <h2 className="section-title">Info Autoridad Objetivo</h2>
        </div>
        <div className="section-header-side">
          <div className={`area-context-badge ${activeArea}`}>
            <span className="area-context-dot" />
            <span className="area-context-label">Área actual</span>
            <strong>{areaLabels[activeArea] ?? areaLabels.personality}</strong>
          </div>
        </div>
      </div>

      <div className="form-group" style={{ maxWidth: 400 }}>
        <label className="form-label">Seleccionar Autoridad Objetivo</label>
        <select
          className="form-select"
          value={selectedObjective}
          onChange={(e) => setSelectedObjective(e.target.value)}
        >
          {objectives
            .filter((o) => o.status !== 'closed')
            .map((o) => (
              <option key={o.id} value={o.id}>
                {o.fullName} - {o.organization}
              </option>
            ))}
        </select>
      </div>

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
          <div
            className="avatar avatar-lg"
            style={{
              background: 'linear-gradient(135deg, var(--color-accent-500), var(--color-primary-400))',
            }}
          >
            <Target size={28} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 2 }}>{objective.fullName}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              {objective.title} - {objective.organization}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
              {objective.country} · {objective.project}
            </div>
          </div>
        </div>
      )}

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
            No se ha generado un análisis para esta autoridad objetivo. En un entorno real, este análisis
            sería generado por IA a partir de la información recopilada.
          </p>
        </div>
      )}
    </div>
  );
}
