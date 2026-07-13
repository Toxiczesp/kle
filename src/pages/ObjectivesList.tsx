import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarRange, MessageSquareMore, Search, UserRoundSearch } from 'lucide-react';
import { useObjectives } from '../context/ObjectivesContext';
import { useAuthorityData } from '../context/AuthorityDataContext';
import { mockInteractions } from '../data/interactions';

const requestStatusOptions = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'new', label: 'Nuevas' },
  { value: 'in-progress', label: 'En proceso' },
  { value: 'done', label: 'Finalizadas' },
];

const interactionOptions = [
  { value: 'all', label: 'Todas las interacciones' },
  { value: 'none', label: 'Sin interacciones' },
  { value: '1-2', label: '1 a 2 interacciones' },
  { value: '3+', label: '3 o mas interacciones' },
];

function resolveRequestStatus(status: string) {
  if (status === 'done') return 'done';
  if (status === 'pending') return 'new';
  return 'in-progress';
}

export default function ObjectivesList() {
  const { objectives } = useObjectives();
  const { requests } = useAuthorityData();
  const [authorityQuery, setAuthorityQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [requestStatusFilter, setRequestStatusFilter] = useState('all');
  const [requesterFilter, setRequesterFilter] = useState('');
  const [interactionFilter, setInteractionFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const countries = useMemo(
    () => Array.from(new Set(objectives.map((objective) => objective.country))).sort(),
    [objectives]
  );

  const objectiveCards = useMemo(() => {
    return objectives
      .map((objective) => {
        const relatedRequests = requests
          .filter((request) => request.objectiveId === objective.id)
          .sort(
            (a, b) =>
              new Date(b.updatedAt ?? b.createdAt).getTime() -
              new Date(a.updatedAt ?? a.createdAt).getTime()
          );
        const relatedInteractions = mockInteractions.filter(
          (interaction) => interaction.objectiveId === objective.id
        );
        const latestActivityDates = [
          ...relatedRequests.map((request) => request.updatedAt ?? request.createdAt),
          ...relatedInteractions.map((interaction) => interaction.date),
          objective.updatedAt,
        ]
          .filter(Boolean)
          .map((value) => new Date(value))
          .filter((value) => !Number.isNaN(value.getTime()))
          .sort((a, b) => b.getTime() - a.getTime());

        return {
          objective,
          relatedRequests,
          relatedInteractions,
          latestActivity: latestActivityDates[0] ?? null,
          lastRequester: relatedRequests[0]?.requesterName?.trim() ?? '',
        };
      })
      .filter(({ objective, relatedRequests, relatedInteractions, latestActivity, lastRequester }) => {
        const matchesAuthority =
          authorityQuery.trim() === '' ||
          objective.fullName.toLowerCase().includes(authorityQuery.toLowerCase()) ||
          objective.organization.toLowerCase().includes(authorityQuery.toLowerCase());

        const matchesCountry =
          countryFilter === 'all' || objective.country === countryFilter;

        const matchesStatus =
          requestStatusFilter === 'all' ||
          relatedRequests.some(
            (request) => resolveRequestStatus(request.status) === requestStatusFilter
          );

        const matchesRequester =
          requesterFilter.trim() === '' ||
          lastRequester.toLowerCase().includes(requesterFilter.toLowerCase()) ||
          relatedRequests.some((request) =>
            (request.requesterName ?? '')
              .toLowerCase()
              .includes(requesterFilter.toLowerCase())
          );

        const interactionCount = relatedInteractions.length;
        const matchesInteractions =
          interactionFilter === 'all' ||
          (interactionFilter === 'none' && interactionCount === 0) ||
          (interactionFilter === '1-2' && interactionCount >= 1 && interactionCount <= 2) ||
          (interactionFilter === '3+' && interactionCount >= 3);

        const matchesDateFrom =
          !dateFrom ||
          (latestActivity !== null &&
            latestActivity.getTime() >= new Date(dateFrom).getTime());

        const matchesDateTo =
          !dateTo ||
          (latestActivity !== null &&
            latestActivity.getTime() <= new Date(dateTo).getTime() + 86400000 - 1);

        return (
          matchesAuthority &&
          matchesCountry &&
          matchesStatus &&
          matchesRequester &&
          matchesInteractions &&
          matchesDateFrom &&
          matchesDateTo
        );
      })
      .sort((a, b) => {
        const aTime = a.latestActivity?.getTime() ?? 0;
        const bTime = b.latestActivity?.getTime() ?? 0;
        return bTime - aTime;
      });
  }, [
    authorityQuery,
    countryFilter,
    dateFrom,
    dateTo,
    interactionFilter,
    objectives,
    requesterFilter,
    requestStatusFilter,
    requests,
  ]);

  return (
    <div className="analyst-search-page">
      <div className="section-header">
        <div>
          <h2 className="section-title">Buscador</h2>
          <p className="section-subtitle">
            Localiza autoridades y solicitudes por autoridad objetivo, pais, estado, autoridad
            solicitante, interacciones o rango de fecha.
          </p>
        </div>
        <Link to="/objectives/new" className="btn btn-primary">
          + Nueva autoridad objetivo
        </Link>
      </div>

      <section className="analyst-filter-panel">
        <div className="analyst-filter-grid">
          <div className="form-group">
            <label className="form-label">Autoridad objetivo</label>
            <div className="search-bar">
              <Search size={18} />
              <input
                type="text"
                placeholder="Nombre u organismo"
                value={authorityQuery}
                onChange={(event) => setAuthorityQuery(event.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Pais</label>
            <select
              className="form-select"
              value={countryFilter}
              onChange={(event) => setCountryFilter(event.target.value)}
            >
              <option value="all">Todos los paises</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Estado solicitud</label>
            <select
              className="form-select"
              value={requestStatusFilter}
              onChange={(event) => setRequestStatusFilter(event.target.value)}
            >
              {requestStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Autoridad solicitante</label>
            <div className="search-bar">
              <UserRoundSearch size={18} />
              <input
                type="text"
                placeholder="Nombre de quien lo solicita"
                value={requesterFilter}
                onChange={(event) => setRequesterFilter(event.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Interacciones</label>
            <select
              className="form-select"
              value={interactionFilter}
              onChange={(event) => setInteractionFilter(event.target.value)}
            >
              {interactionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Rango de fecha</label>
            <div className="analyst-date-range">
              <input
                className="form-input"
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
              <input
                className="form-input"
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="analyst-search-results-header">
        <div>
          <h3 className="section-title">Resultados</h3>
          <p className="section-subtitle">
            {objectiveCards.length} autoridad(es) coinciden con los filtros actuales.
          </p>
        </div>
      </div>

      <div className="analyst-search-results">
        {objectiveCards.map(({ objective, relatedRequests, relatedInteractions, latestActivity, lastRequester }) => (
          <Link to={`/objectives/${objective.id}`} className="analyst-search-card" key={objective.id}>
            <div className="analyst-search-card-top">
              <div>
                <div className="analyst-search-card-title">{objective.fullName}</div>
                <div className="analyst-search-card-subtitle">
                  {objective.title} · {objective.organization}
                </div>
              </div>
              <span className="badge badge-medium">{objective.country}</span>
            </div>

            <div className="analyst-search-card-grid">
              <div className="analyst-search-metric">
                <span>Estado principal</span>
                <strong>
                  {relatedRequests[0]
                    ? requestStatusOptions.find(
                        (option) =>
                          option.value === resolveRequestStatus(relatedRequests[0].status)
                      )?.label ?? 'Sin estado'
                    : 'Sin solicitudes'}
                </strong>
              </div>
              <div className="analyst-search-metric">
                <span>Solicitante</span>
                <strong>{lastRequester || 'No disponible'}</strong>
              </div>
              <div className="analyst-search-metric">
                <span>Interacciones</span>
                <strong>{relatedInteractions.length}</strong>
              </div>
              <div className="analyst-search-metric">
                <span>Ultima actividad</span>
                <strong>
                  {latestActivity ? latestActivity.toLocaleDateString('es-ES') : 'Sin registro'}
                </strong>
              </div>
            </div>

            <div className="analyst-search-card-footer">
              <span className="analyst-search-chip">
                <MessageSquareMore size={14} />
                {relatedRequests.length} solicitudes
              </span>
              <span className="analyst-search-chip">
                <CalendarRange size={14} />
                {objective.project}
              </span>
            </div>
          </Link>
        ))}

        {objectiveCards.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Search size={28} />
            </div>
            <h3 className="empty-state-title">Sin resultados</h3>
            <p className="empty-state-text">
              No se encontraron autoridades o solicitudes con los filtros seleccionados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
