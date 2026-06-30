import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthorityDateRangeField from '../components/AuthorityDateRangeField';
import { useObjectives } from '../context/ObjectivesContext';
import { getAuthorityCountries, getLastInteractionForObjective } from '../data/authorityPortal';

export default function AuthorityKLE() {
  const navigate = useNavigate();
  const { objectives } = useObjectives();
  const countries = getAuthorityCountries(objectives);
  const defaultFilters = {
    name: '',
    roleOrOrganization: '',
    exactDate: '',
    startDate: '',
    endDate: '',
    country: 'all',
  };

  const [filters, setFilters] = useState(defaultFilters);

  const results = useMemo(
    () =>
      objectives.filter((objective) => {
        const lastInteraction = getLastInteractionForObjective(objective.id);
        const lastInteractionDate = lastInteraction ? new Date(lastInteraction.date).getTime() : null;
        const matchesName = objective.fullName.toLowerCase().includes(filters.name.toLowerCase());
        const matchesRoleOrOrganization =
          objective.title.toLowerCase().includes(filters.roleOrOrganization.toLowerCase()) ||
          objective.organization.toLowerCase().includes(filters.roleOrOrganization.toLowerCase());
        const matchesExactDate = !filters.exactDate || lastInteraction?.date === filters.exactDate;
        const matchesStartDate =
          !filters.startDate || (lastInteractionDate !== null && lastInteractionDate >= new Date(filters.startDate).getTime());
        const matchesEndDate =
          !filters.endDate || (lastInteractionDate !== null && lastInteractionDate <= new Date(filters.endDate).getTime());
        const matchesCountry = filters.country === 'all' || objective.country === filters.country;
        return (
          matchesName &&
          matchesRoleOrOrganization &&
          matchesExactDate &&
          matchesStartDate &&
          matchesEndDate &&
          matchesCountry
        );
      }),
    [filters, objectives]
  );

  return (
    <div className="authority-shell">
      <section className="authority-panel">
        <div className="authority-panel-header">
          <div>
            <h2>Buscador KLE</h2>
            <p>Localiza autoridades por nombre, cargo u organismo y filtra por un rango de fechas.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {(
              filters.name ||
              filters.roleOrOrganization ||
              filters.exactDate ||
              filters.startDate ||
              filters.endDate ||
              filters.country !== 'all'
            ) && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setFilters(defaultFilters)}
              >
                Limpiar filtros
              </button>
            )}
            <div className="authority-results-chip">{results.length} resultados</div>
          </div>
        </div>

        <div className="authority-grid authority-grid-5 authority-filter-grid">
          <div className="form-group">
            <label className="form-label">Autoridad</label>
            <div className="authority-search-input">
              <Search size={16} />
              <input
                type="text"
                list="authority-kle-names"
                value={filters.name}
                onChange={(e) => setFilters((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre de la autoridad"
              />
              <datalist id="authority-kle-names">
                {objectives.map((objective) => (
                  <option key={objective.id} value={objective.fullName} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Cargo / organismo</label>
            <input
              className="form-input"
              type="text"
              value={filters.roleOrOrganization}
              onChange={(e) => setFilters((prev) => ({ ...prev, roleOrOrganization: e.target.value }))}
              placeholder="Cargo, ministerio, embajada..."
            />
          </div>
          <AuthorityDateRangeField
            className="authority-date-range-field-single authority-date-range-field-right"
            startDate={filters.startDate}
            endDate={filters.endDate}
            onChange={({ startDate, endDate }) =>
              setFilters((prev) => ({ ...prev, startDate, endDate }))
            }
          />
          <div className="form-group">
            <label className="form-label">Fecha concreta</label>
            <input
              className="form-input"
              type="date"
              value={filters.exactDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, exactDate: e.target.value }))}
            />
          </div>
        </div>

        <div className="authority-grid authority-grid-3 authority-filter-grid">
          <div className="form-group">
            <label className="form-label">País</label>
            <select
              className="form-select"
              value={filters.country}
              onChange={(e) => setFilters((prev) => ({ ...prev, country: e.target.value }))}
            >
              <option value="all">Todos los países</option>
              {countries.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="authority-grid authority-grid-2">
        {results.map((objective) => {
          const lastInteraction = getLastInteractionForObjective(objective.id);
          return (
            <button
              key={objective.id}
              className="authority-objective-card"
              onClick={() => navigate(`/authority/kle/${objective.id}`)}
            >
              <div className="authority-objective-card-head">
                <div className="avatar avatar-lg">
                  {objective.fullName
                    .split(' ')
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase() ?? '')
                    .join('')}
                </div>
                <div>
                  <h3>{objective.fullName}</h3>
                  <p>{objective.title}</p>
                </div>
              </div>
              <div className="authority-objective-meta">
                <span>{objective.organization}</span>
                <span>{objective.country}</span>
                <span>{lastInteraction ? `Última interacción: ${lastInteraction.date}` : 'Sin interacciones registradas'}</span>
              </div>
              <div className="authority-objective-footer">
                <span className={`badge badge-${objective.priority}`}>{objective.priority}</span>
                <strong>Abrir dosier</strong>
              </div>
            </button>
          );
        })}
      </section>
    </div>
  );
}
