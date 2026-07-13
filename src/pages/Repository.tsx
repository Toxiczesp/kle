import { useMemo, useState } from 'react';
import {
  BookOpenText,
  ClipboardCheck,
  FileText,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { mockDocuments } from '../data/misc';
import { useObjectives } from '../context/ObjectivesContext';
import { useAuthorityData } from '../context/AuthorityDataContext';

const repositorySections = [
  {
    key: 'reports',
    title: 'Informes KLE',
    description: 'Todos los informes y materiales documentales disponibles sobre la autoridad.',
    icon: FileText,
  },
  {
    key: 'evaluations',
    title: 'Valoracion de la autoridad',
    description: 'Valoraciones creadas desde la cuenta autoridad y reflejadas aqui.',
    icon: ShieldCheck,
  },
  {
    key: 'summary',
    title: 'Resumen ejecutivo',
    description: 'Resumenes publicados por el analista para consulta rapida.',
    icon: BookOpenText,
  },
  {
    key: 'questionnaires',
    title: 'Cuestionarios del observador',
    description: 'Cuestionarios y observaciones registrados tras las interacciones.',
    icon: ClipboardCheck,
  },
];

export default function Repository() {
  const { objectives } = useObjectives();
  const {
    dossierEvaluations,
    evaluations,
    observationQuestionnaires,
    publishedProfiles,
  } = useAuthorityData();
  const [search, setSearch] = useState('');
  const [objectiveFilter, setObjectiveFilter] = useState('all');
  const ReportsIcon = repositorySections[0].icon;
  const EvaluationsIcon = repositorySections[1].icon;
  const SummaryIcon = repositorySections[2].icon;
  const QuestionnairesIcon = repositorySections[3].icon;

  const filteredDocuments = useMemo(() => {
    return mockDocuments.filter((document) => {
      const matchesSearch =
        search.trim() === '' ||
        document.name.toLowerCase().includes(search.toLowerCase()) ||
        document.description.toLowerCase().includes(search.toLowerCase());
      const matchesObjective =
        objectiveFilter === 'all' || document.objectiveId === objectiveFilter;
      return matchesSearch && matchesObjective;
    });
  }, [objectiveFilter, search]);

  const filteredPublishedProfiles = useMemo(() => {
    return publishedProfiles.filter((profile) => {
      const matchesSearch =
        search.trim() === '' ||
        profile.executiveSummary.toLowerCase().includes(search.toLowerCase()) ||
        profile.generalInfo.toLowerCase().includes(search.toLowerCase());
      const matchesObjective =
        objectiveFilter === 'all' || profile.objectiveId === objectiveFilter;
      return matchesSearch && matchesObjective;
    });
  }, [objectiveFilter, publishedProfiles, search]);

  const filteredEvaluations = useMemo(() => {
    const allEvaluations = [
      ...evaluations.map((evaluation) => ({
        id: `eval-${evaluation.id}`,
        objectiveId: evaluation.objectiveId,
        title: 'Valoracion de interaccion',
        date: evaluation.date,
        summary: evaluation.opportunities || evaluation.otherRelevantAspects || 'Sin comentarios ampliados.',
      })),
      ...dossierEvaluations.map((evaluation) => ({
        id: `dossier-${evaluation.id}`,
        objectiveId: evaluation.objectiveId,
        title: 'Valoracion de dosier',
        date: evaluation.date,
        summary:
          evaluation.contentChanges ||
          evaluation.additionalInformationNeeded ||
          'Sin comentarios ampliados.',
      })),
    ];

    return allEvaluations.filter((evaluation) => {
      const objective = objectives.find((item) => item.id === evaluation.objectiveId);
      const matchesSearch =
        search.trim() === '' ||
        evaluation.title.toLowerCase().includes(search.toLowerCase()) ||
        evaluation.summary.toLowerCase().includes(search.toLowerCase()) ||
        (objective?.fullName ?? '').toLowerCase().includes(search.toLowerCase());
      const matchesObjective =
        objectiveFilter === 'all' || evaluation.objectiveId === objectiveFilter;
      return matchesSearch && matchesObjective;
    });
  }, [dossierEvaluations, evaluations, objectiveFilter, objectives, search]);

  const filteredQuestionnaires = useMemo(() => {
    return observationQuestionnaires.filter((questionnaire) => {
      const matchesSearch =
        search.trim() === '' ||
        questionnaire.context.toLowerCase().includes(search.toLowerCase()) ||
        questionnaire.recommendations.toLowerCase().includes(search.toLowerCase());
      const matchesObjective =
        objectiveFilter === 'all' || questionnaire.objectiveId === objectiveFilter;
      return matchesSearch && matchesObjective;
    });
  }, [objectiveFilter, observationQuestionnaires, search]);

  return (
    <div className="analyst-repository-page">
      <div className="section-header">
        <div>
          <h2 className="section-title">Repositorio</h2>
          <p className="section-subtitle">
            Consulta el contenido documental existente organizado en cuatro bloques de trabajo.
          </p>
        </div>
      </div>

      <section className="analyst-filter-panel">
        <div className="analyst-filter-grid analyst-filter-grid-compact">
          <div className="form-group">
            <label className="form-label">Buscar contenido</label>
            <div className="search-bar">
              <Search size={18} />
              <input
                type="text"
                placeholder="Informes, valoraciones o cuestionarios"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Autoridad objetivo</label>
            <select
              className="form-select"
              value={objectiveFilter}
              onChange={(event) => setObjectiveFilter(event.target.value)}
            >
              <option value="all">Todas las autoridades objetivo</option>
              {objectives.map((objective) => (
                <option key={objective.id} value={objective.id}>
                  {objective.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div className="analyst-repository-grid">
        <section className="analyst-repository-section">
          <div className="analyst-repository-section-header">
            <div className="analyst-repository-section-title-wrap">
              <div className="analyst-repository-icon">
                <ReportsIcon size={18} />
              </div>
              <div>
                <h3>{repositorySections[0].title}</h3>
                <p>{repositorySections[0].description}</p>
              </div>
            </div>
            <span className="badge badge-medium">{filteredDocuments.length}</span>
          </div>

          <div className="analyst-repository-list">
            {filteredDocuments.map((document) => {
              const objective = objectives.find((item) => item.id === document.objectiveId);
              return (
                <article className="analyst-repository-item" key={document.id}>
                  <strong>{document.name}</strong>
                  <p>{document.description}</p>
                  <div className="analyst-repository-meta">
                    <span>{objective?.fullName ?? 'Sin autoridad'}</span>
                    <span>{document.category}</span>
                    <span>{document.dateUploaded}</span>
                  </div>
                </article>
              );
            })}
            {filteredDocuments.length === 0 && (
              <p className="analyst-repository-empty">No hay informes KLE con los filtros actuales.</p>
            )}
          </div>
        </section>

        <section className="analyst-repository-section">
          <div className="analyst-repository-section-header">
            <div className="analyst-repository-section-title-wrap">
              <div className="analyst-repository-icon">
                <EvaluationsIcon size={18} />
              </div>
              <div>
                <h3>{repositorySections[1].title}</h3>
                <p>{repositorySections[1].description}</p>
              </div>
            </div>
            <span className="badge badge-medium">{filteredEvaluations.length}</span>
          </div>

          <div className="analyst-repository-list">
            {filteredEvaluations.map((evaluation) => {
              const objective = objectives.find((item) => item.id === evaluation.objectiveId);
              return (
                <article className="analyst-repository-item" key={evaluation.id}>
                  <strong>{evaluation.title}</strong>
                  <p>{evaluation.summary}</p>
                  <div className="analyst-repository-meta">
                    <span>{objective?.fullName ?? 'Sin autoridad'}</span>
                    <span>{evaluation.date}</span>
                  </div>
                </article>
              );
            })}
            {filteredEvaluations.length === 0 && (
              <p className="analyst-repository-empty">Aun no hay valoraciones disponibles.</p>
            )}
          </div>
        </section>

        <section className="analyst-repository-section">
          <div className="analyst-repository-section-header">
            <div className="analyst-repository-section-title-wrap">
              <div className="analyst-repository-icon">
                <SummaryIcon size={18} />
              </div>
              <div>
                <h3>{repositorySections[2].title}</h3>
                <p>{repositorySections[2].description}</p>
              </div>
            </div>
            <span className="badge badge-medium">{filteredPublishedProfiles.length}</span>
          </div>

          <div className="analyst-repository-list">
            {filteredPublishedProfiles.map((profile) => {
              const objective = objectives.find((item) => item.id === profile.objectiveId);
              return (
                <article className="analyst-repository-item" key={profile.objectiveId}>
                  <strong>{objective?.fullName ?? 'Sin autoridad'}</strong>
                  <p>{profile.executiveSummary || 'Resumen pendiente de contenido.'}</p>
                  <div className="analyst-repository-meta">
                    <span>{profile.analystName}</span>
                    <span>{new Date(profile.updatedAt).toLocaleDateString('es-ES')}</span>
                  </div>
                </article>
              );
            })}
            {filteredPublishedProfiles.length === 0 && (
              <p className="analyst-repository-empty">
                Todavia no hay resumenes ejecutivos publicados.
              </p>
            )}
          </div>
        </section>

        <section className="analyst-repository-section">
          <div className="analyst-repository-section-header">
            <div className="analyst-repository-section-title-wrap">
              <div className="analyst-repository-icon">
                <QuestionnairesIcon size={18} />
              </div>
              <div>
                <h3>{repositorySections[3].title}</h3>
                <p>{repositorySections[3].description}</p>
              </div>
            </div>
            <span className="badge badge-medium">{filteredQuestionnaires.length}</span>
          </div>

          <div className="analyst-repository-list">
            {filteredQuestionnaires.map((questionnaire) => {
              const objective = objectives.find((item) => item.id === questionnaire.objectiveId);
              return (
                <article className="analyst-repository-item" key={questionnaire.id}>
                  <strong>{objective?.fullName ?? 'Sin autoridad'}</strong>
                  <p>{questionnaire.context || questionnaire.recommendations || 'Cuestionario sin resumen.'}</p>
                  <div className="analyst-repository-meta">
                    <span>{questionnaire.observerName || 'Observador no indicado'}</span>
                    <span>{questionnaire.date}</span>
                  </div>
                </article>
              );
            })}
            {filteredQuestionnaires.length === 0 && (
              <p className="analyst-repository-empty">
                Aun no hay cuestionarios del observador disponibles.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
