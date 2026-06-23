import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useObjectives } from '../context/ObjectivesContext';
import { getAuthorityCountries, getLastInteractionForObjective } from '../data/authorityPortal';

export default function AuthorityKLE() {
  const navigate = useNavigate();
  const { objectives } = useObjectives();
  const countries = getAuthorityCountries(objectives);

  const [filters, setFilters] = useState({
    name: '',
    title: '',
    country: 'all',
    organization: '',
  });

  const results = useMemo(
    () =>
      objectives.filter((objective) => {
        const matchesName = objective.fullName.toLowerCase().includes(filters.name.toLowerCase());
        const matchesTitle = objective.title.toLowerCase().includes(filters.title.toLowerCase());
        const matchesCountry = filters.country === 'all' || objective.country === filters.country;
        const matchesOrganization = objective.organization.toLowerCase().includes(filters.organization.toLowerCase());
        return matchesName && matchesTitle && matchesCountry && matchesOrganization;
      }),
    [filters, objectives]
  );

  return (
    <div className="authority-shell">
      <section className="authority-panel">
        <div className="authority-panel-header">
          <div>
            <h2>Buscador KLE</h2>
            <p>Localiza otras autoridades registradas y accede a su ficha completa.</p>
          </div>
          <div className="authority-results-chip">{results.length} resultados</div>
        </div>

        <div className="authority-grid authority-grid-4 authority-filter-grid">
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <div className="authority-search-input">
              <Search size={16} />
              <input
                type="text"
                value={filters.name}
                onChange={(e) => setFilters((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre de la autoridad"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Cargo</label>
            <input
              className="form-input"
              type="text"
              value={filters.title}
              onChange={(e) => setFilters((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Cargo o funcion"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Pais</label>
            <select
              className="form-select"
              value={filters.country}
              onChange={(e) => setFilters((prev) => ({ ...prev, country: e.target.value }))}
            >
              <option value="all">Todos los paises</option>
              {countries.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Organizacion</label>
            <input
              className="form-input"
              type="text"
              value={filters.organization}
              onChange={(e) => setFilters((prev) => ({ ...prev, organization: e.target.value }))}
              placeholder="Ministerio, embajada, consejo..."
            />
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
                <span>{lastInteraction ? `Ultima interaccion: ${lastInteraction.date}` : 'Sin interacciones registradas'}</span>
              </div>
              <div className="authority-objective-footer">
                <span className={`badge badge-${objective.priority}`}>{objective.priority}</span>
                <strong>Ver ficha completa</strong>
              </div>
            </button>
          );
        })}
      </section>
    </div>
  );
}
