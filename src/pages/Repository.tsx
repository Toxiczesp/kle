import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, FileText, File, ClipboardCheck, ScrollText, Paperclip, Upload } from 'lucide-react';
import { mockDocuments } from '../data/misc';
import BackButton from '../components/BackButton';
import { useObjectives } from '../context/ObjectivesContext';

const typeIcons: Record<string, React.ReactNode> = {
  document: <FileText size={18} />,
  note: <ScrollText size={18} />,
  report: <File size={18} />,
  questionnaire: <ClipboardCheck size={18} />,
  evaluation: <ClipboardCheck size={18} />,
  file: <Paperclip size={18} />,
};

const typeLabels: Record<string, string> = {
  document: 'Documento',
  note: 'Nota',
  report: 'Informe',
  questionnaire: 'Cuestionario',
  evaluation: 'Evaluacion',
  file: 'Archivo',
};

const areaLabels: Record<string, string> = {
  personality: 'Info Autoridad Objetivo',
  'psychological-profile': 'Perfilado Personalidad',
  sociocultural: 'Area Sociocultural',
};

export default function Repository() {
  const { objectives } = useObjectives();
  const [searchParams] = useSearchParams();
  const activeArea = searchParams.get('area') || 'personality';
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [objectiveFilter, setObjectiveFilter] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const filtered = mockDocuments.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || doc.type === typeFilter;
    const matchesObjective = objectiveFilter === 'all' || doc.objectiveId === objectiveFilter;
    return matchesSearch && matchesType && matchesObjective;
  });

  return (
    <div>
      <BackButton />
      <div className="section-header">
        <div>
          <h2 className="section-title">Repositorio de Informacion</h2>
        </div>
        <div className="section-header-side">
          <div className={`area-context-badge ${activeArea}`}>
            <span className="area-context-dot" />
            <span className="area-context-label">Area actual</span>
            <strong>{areaLabels[activeArea] ?? areaLabels.personality}</strong>
          </div>
          <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
            <Upload size={16} /> Subir Documento
          </button>
        </div>
      </div>

      <div className="search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder="Buscar documentos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label className="form-label">Tipo de documento</label>
          <select
            className="form-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">Todos los tipos</option>
            {Object.entries(typeLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label className="form-label">Autoridad objetivo asociada</label>
          <select
            className="form-select"
            value={objectiveFilter}
            onChange={(e) => setObjectiveFilter(e.target.value)}
          >
            <option value="all">Todas las autoridades objetivo</option>
            {objectives.map((obj) => (
              <option key={obj.id} value={obj.id}>{obj.fullName}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.map((doc) => {
        const obj = objectives.find((o) => o.id === doc.objectiveId);
        return (
          <div className="doc-item" key={doc.id}>
            <div className="doc-icon">{typeIcons[doc.type]}</div>
            <div className="doc-info">
              <div className="doc-name">{doc.name}</div>
              <div className="doc-desc">{doc.description}</div>
            </div>
            <div className="doc-meta" style={{ gap: 'var(--space-6)' }}>
              <span className="doc-meta-item" style={{ minWidth: 120 }}>{obj?.fullName ?? '-'}</span>
              <span className="badge badge-medium" style={{ fontSize: '0.65rem' }}>{typeLabels[doc.type]}</span>
              <span className="doc-meta-item">{doc.size}</span>
              <span className="doc-meta-item">{doc.dateUploaded}</span>
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon"><Search size={28} /></div>
          <h3 className="empty-state-title">Sin resultados</h3>
          <p className="empty-state-text">No se encontraron documentos con los criterios seleccionados.</p>
        </div>
      )}

      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Subir Documento</h3>
              <button className="modal-close" onClick={() => setShowUploadModal(false)}>x</button>
            </div>
            <div className="form-group">
              <label className="form-label">Nombre del documento</label>
              <input className="form-input" type="text" placeholder="Nombre descriptivo..." />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tipo</label>
                <select className="form-select">
                  {Object.entries(typeLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Autoridad objetivo asociada</label>
                <select className="form-select">
                  {objectives.map((obj) => (
                    <option key={obj.id} value={obj.id}>{obj.fullName}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Descripcion</label>
              <textarea className="form-textarea" placeholder="Descripcion del documento..." />
            </div>
            <div className="form-group">
              <label className="form-label">Archivo</label>
              <div
                style={{
                  border: '2px dashed var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-8)',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'border-color var(--transition-fast)',
                }}
              >
                <Upload size={32} style={{ color: 'var(--color-text-muted)', marginBottom: 8 }} />
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  Arrastra un archivo aqui o haz clic para seleccionar
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                  PDF, DOC, XLS, PPT, IMG - Max. 50 MB
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              <button className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={() => { setShowUploadModal(false); alert('Documento subido (simulacion)'); }}>Subir Documento</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
