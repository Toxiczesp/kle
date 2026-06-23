import { useMemo, useState } from 'react';
import { useObjectives } from '../context/ObjectivesContext';
import { mockInteractions } from '../data/interactions';
import { getAuthorityCountries } from '../data/authorityPortal';

export default function AuthorityInteractions() {
  const { objectives } = useObjectives();
  const countries = getAuthorityCountries(objectives);
  const [filters, setFilters] = useState({
    date: '',
    location: '',
    country: 'all',
    objectiveId: 'all',
    organization: '',
  });

  const results = useMemo(
    () =>
      mockInteractions
        .filter((interaction) => {
          const objective = objectives.find((item) => item.id === interaction.objectiveId);
          if (!objective) return false;

          const matchesDate = !filters.date || interaction.date.includes(filters.date);
          const matchesLocation = interaction.location.toLowerCase().includes(filters.location.toLowerCase());
          const matchesCountry = filters.country === 'all' || objective.country === filters.country;
          const matchesObjective = filters.objectiveId === 'all' || interaction.objectiveId === filters.objectiveId;
          const matchesOrganization = objective.organization.toLowerCase().includes(filters.organization.toLowerCase());
          return matchesDate && matchesLocation && matchesCountry && matchesObjective && matchesOrganization;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [filters, objectives]
  );

  const latest = results[0];

  return (
    <div className="authority-shell">
      <section className="authority-panel">
        <div className="authority-panel-header">
          <div>
            <h2>Buscador de interacciones</h2>
            <p>Consulta reuniones e interacciones registradas por fecha, lugar, autoridad o pais.</p>
          </div>
        </div>

        <div className="authority-grid authority-grid-5 authority-filter-grid">
          <div className="form-group">
            <label className="form-label">Fecha</label>
            <input
              className="form-input"
              type="text"
              value={filters.date}
              onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))}
              placeholder="2026-05 o 2026-05-15"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Lugar</label>
            <input
              className="form-input"
              type="text"
              value={filters.location}
              onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="Madrid, videoconferencia..."
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
              {countries.map((country) => <option key={country} value={country}>{country}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Autoridad</label>
            <select
              className="form-select"
              value={filters.objectiveId}
              onChange={(e) => setFilters((prev) => ({ ...prev, objectiveId: e.target.value }))}
            >
              <option value="all">Todas las autoridades</option>
              {objectives.map((objective) => (
                <option key={objective.id} value={objective.id}>{objective.fullName}</option>
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
              placeholder="Ministerio, embajada..."
            />
          </div>
        </div>
      </section>

      <section className="authority-grid authority-grid-3">
        <div className="authority-info-card">
          <span>Total de interacciones</span>
          <strong>{results.length}</strong>
        </div>
        <div className="authority-info-card">
          <span>Ultima interaccion</span>
          <strong>{latest ? latest.date : 'Sin resultados'}</strong>
        </div>
        <div className="authority-info-card">
          <span>Ultimo lugar registrado</span>
          <strong>{latest ? latest.location : 'Sin resultados'}</strong>
        </div>
      </section>

      <section className="authority-panel">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Autoridad</th>
                <th>Pais</th>
                <th>Lugar</th>
                <th>Objetivo / resultado</th>
              </tr>
            </thead>
            <tbody>
              {results.map((interaction) => {
                const objective = objectives.find((item) => item.id === interaction.objectiveId);
                return (
                  <tr key={interaction.id}>
                    <td>{interaction.date}</td>
                    <td>{objective?.fullName ?? '-'}</td>
                    <td>{objective?.country ?? '-'}</td>
                    <td>{interaction.location}</td>
                    <td>{interaction.observations}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
