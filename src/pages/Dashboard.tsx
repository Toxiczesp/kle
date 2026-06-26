import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpenText,
  BrainCircuit,
  Camera,
  Search,
  FileImage,
  FileSearch,
  FileStack,
  FileText,
  Globe2,
  Plus,
  PlaySquare,
} from 'lucide-react';
import { useObjectives } from '../context/ObjectivesContext';
import { authorityRequestStatusLabels, readAuthorityRequests } from '../data/authorityPortal';

const analystAreas = [
  {
    id: 'personality',
    title: 'Info Autoridad Objetivo',
    description:
      'Espacio de trabajo para consolidar rasgos de personalidad, evaluacion individual y soporte documental de la autoridad objetivo.',
    icon: BrainCircuit,
    accentClass: 'personality',
    cta: { label: 'Ir a analisis', to: '/analysis' },
    items: [
      { label: 'Documentacion / Doc', description: 'Base documental inicial del perfil.', icon: FileSearch, to: '/repository' },
      { label: 'Resumen Doc', description: 'Version sintetica para consulta rapida.', icon: FileText, to: '/analysis' },
      { label: 'Completo Doc', description: 'Analisis integral extendido de la autoridad objetivo.', icon: FileStack, to: '/analysis' },
    ],
  },
  {
    id: 'psychological-profile',
    title: 'Perfilado Personalidad',
    description:
      'Seccion especifica para soporte visual y desarrollo completo del perfil psicologico de la autoridad objetivo.',
    icon: Camera,
    accentClass: 'psychological',
    cta: { label: 'Ir a repositorio', to: '/repository' },
    items: [
      { label: 'Doc Imagenes', description: 'Material visual asociado a la autoridad objetivo.', icon: FileImage, to: '/repository' },
      { label: 'Doc Videos', description: 'Clips, entrevistas y contenido audiovisual.', icon: PlaySquare, to: '/repository' },
      { label: 'Doc Completo', description: 'Documento psicologico extendido y estructurado.', icon: FileStack, to: '/analysis' },
    ],
  },
  {
    id: 'sociocultural',
    title: 'Area Sociocultural',
    description:
      'Zona dedicada a contexto social, afinidades, intereses culturales y puntos de conexion operativos.',
    icon: Globe2,
    accentClass: 'sociocultural',
    cta: { label: 'Ver informes', to: '/reports' },
    items: [
      { label: 'Documentacion / Doc', description: 'Base documental de contexto social y cultural.', icon: FileSearch, to: '/repository' },
      { label: 'Doc Resumen', description: 'Resumen sociocultural de acceso inmediato.', icon: BookOpenText, to: '/reports' },
      { label: 'Doc Completo', description: 'Documento ampliado con contexto y recomendaciones.', icon: FileStack, to: '/reports' },
    ],
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { objectives, findObjectiveByName } = useObjectives();
  const [selectedAreaId, setSelectedAreaId] = useState(analystAreas[0].id);
  const [personName, setPersonName] = useState('');
  const selectedArea = analystAreas.find((area) => area.id === selectedAreaId) ?? analystAreas[0];
  const SelectedAreaIcon = selectedArea.icon;
  const normalizedName = personName.trim().toLowerCase();
  const exactObjective = normalizedName ? findObjectiveByName(personName) : undefined;
  const analystRequests = readAuthorityRequests();
  const pendingRequests = analystRequests.filter((request) => request.status !== 'done').slice(0, 3);
  const matchingObjectives = normalizedName
    ? objectives
        .filter((objective) => objective.fullName.toLowerCase().includes(normalizedName))
        .slice(0, 4)
    : [];

  const handleGenerateReport = () => {
    if (!exactObjective) return;
    navigate(`/reports?obj=${exactObjective.id}&area=${selectedArea.id}`);
  };

  const handleCreateObjective = () => {
    navigate(`/objectives/new?name=${encodeURIComponent(personName.trim())}`);
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">Centro de trabajo del analista</h2>
          <p className="section-subtitle">
            Estructura operativa por areas de info, perfilado y sociocultural.
          </p>
        </div>
      </div>

      <div className="person-search-card">
        <div className="person-search-copy">
          <h3 className="person-search-title">Buscar persona o crear autoridad objetivo</h3>
          <p className="person-search-text">
            Escribe el nombre de la persona. Si ya existe, te llevamos a su informe. Si no existe,
            puedes crear la autoridad objetivo y generar el informe inicial.
          </p>
        </div>

        <div className="person-search-controls">
          <div className="person-search-input-wrap">
            <Search size={18} />
            <input
              className="person-search-input"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="Nombre de la persona a buscar"
            />
          </div>
          <div className="btn-group">
            <button
              className="btn btn-primary"
              type="button"
              onClick={handleGenerateReport}
              disabled={!exactObjective}
            >
              Generar informe
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={handleCreateObjective}
              disabled={!personName.trim() || Boolean(exactObjective)}
            >
              <Plus size={16} /> Anadir autoridad
            </button>
          </div>
        </div>

        {normalizedName && (
          <div className="person-search-results">
            {exactObjective ? (
              <div className="person-search-status success">
                Coincidencia encontrada: <strong>{exactObjective.fullName}</strong>
              </div>
            ) : (
              <div className="person-search-status">
                No existe una coincidencia exacta. Puedes crear la autoridad objetivo con ese nombre.
              </div>
            )}

            {matchingObjectives.length > 0 && (
              <div className="person-search-matches">
                {matchingObjectives.map((objective) => (
                  <button
                    key={objective.id}
                    type="button"
                    className="person-match-chip"
                    onClick={() => setPersonName(objective.fullName)}
                  >
                    {objective.fullName}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="section-header" style={{ marginBottom: 'var(--space-4)' }}>
          <div>
            <h3 className="section-title" style={{ marginBottom: 4 }}>Solicitudes recibidas de autoridad</h3>
            <p className="section-subtitle">
              Las peticiones registradas por la autoridad aparecen aqui para que el analista las gestione y las devuelva.
            </p>
          </div>
          <Link to="/analyst/requests" className="btn btn-secondary btn-sm">
            Abrir bandeja
          </Link>
        </div>

        <div className="authority-status-stack">
          {pendingRequests.map((request) => {
            const objective = objectives.find((item) => item.id === request.objectiveId);
            return (
              <Link key={request.id} to="/analyst/requests" className="authority-request-card">
                <div className="authority-request-top">
                  <strong>{request.title}</strong>
                  <span className="authority-status-pill">{authorityRequestStatusLabels[request.status]}</span>
                </div>
                <p>{request.description}</p>
                <div className="authority-request-meta">
                  <span>{objective?.fullName ?? '-'}</span>
                  <span>Limite {request.dueDate}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="analyst-tabs-shell">
        <div className="analyst-tabs" role="tablist" aria-label="Areas del analista">
          {analystAreas.map((area) => {
            const TabIcon = area.icon;
            const isActive = area.id === selectedArea.id;

            return (
              <button
                key={area.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`analyst-tab ${isActive ? 'active' : ''} ${area.accentClass}`}
                onClick={() => setSelectedAreaId(area.id)}
              >
                <span className="analyst-tab-icon">
                  <TabIcon size={16} />
                </span>
                <span className="analyst-tab-label">{area.title}</span>
              </button>
            );
          })}
        </div>

        <section className={`analyst-area-card ${selectedArea.accentClass}`}>
          <div className="analyst-area-header">
            <div className="analyst-area-title-wrap">
              <div className="analyst-area-icon">
                <SelectedAreaIcon size={22} />
              </div>
              <div>
                <h3 className="analyst-area-title">{selectedArea.title}</h3>
                <p className="analyst-area-description">{selectedArea.description}</p>
              </div>
            </div>
            <Link to={`${selectedArea.cta.to}?area=${selectedArea.id}`} className="btn btn-secondary btn-sm">
              {selectedArea.cta.label}
            </Link>
          </div>

          <div className="analyst-module-grid">
            {selectedArea.items.map((item) => {
              const ItemIcon = item.icon;

              return (
                <Link to={`${item.to}?area=${selectedArea.id}`} className="analyst-module-card" key={item.label}>
                  <div className="analyst-module-icon">
                    <ItemIcon size={18} />
                  </div>
                  <div className="analyst-module-title">{item.label}</div>
                  <div className="analyst-module-description">{item.description}</div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
