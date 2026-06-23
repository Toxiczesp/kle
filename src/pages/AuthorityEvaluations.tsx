import { useEffect, useState } from 'react';
import { useObjectives } from '../context/ObjectivesContext';
import { ratingLabels, readAuthorityEvaluations, writeAuthorityEvaluations } from '../data/authorityPortal';
import type { AuthorityEvaluation, InteractionRating } from '../types';

export default function AuthorityEvaluations() {
  const { objectives } = useObjectives();
  const [evaluations, setEvaluations] = useState<AuthorityEvaluation[]>([]);
  const [form, setForm] = useState({
    objectiveId: objectives[0]?.id ?? '',
    date: '',
    location: '',
    plannedObjective: '',
    actualResult: '',
    rating: 3 as InteractionRating,
    observations: '',
  });

  useEffect(() => {
    setEvaluations(readAuthorityEvaluations());
  }, []);

  useEffect(() => {
    if (!form.objectiveId && objectives[0]?.id) {
      setForm((prev) => ({ ...prev, objectiveId: objectives[0].id }));
    }
  }, [form.objectiveId, objectives]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created: AuthorityEvaluation = {
      id: `eval-${Date.now()}`,
      objectiveId: form.objectiveId,
      date: form.date,
      location: form.location,
      plannedObjective: form.plannedObjective,
      actualResult: form.actualResult,
      rating: form.rating,
      observations: form.observations,
      createdAt: new Date().toISOString(),
    };

    const next = [created, ...evaluations];
    setEvaluations(next);
    writeAuthorityEvaluations(next);
    setForm({
      objectiveId: objectives[0]?.id ?? '',
      date: '',
      location: '',
      plannedObjective: '',
      actualResult: '',
      rating: 3,
      observations: '',
    });
  };

  return (
    <div className="authority-shell">
      <section className="authority-grid authority-grid-2">
        <form className="authority-panel" onSubmit={handleSubmit}>
          <div className="authority-panel-header">
            <div>
              <h2>Valoracion de interacciones</h2>
              <p>Registra objetivo previsto, resultado obtenido y observaciones posteriores a la reunion.</p>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Autoridad</label>
              <select
                className="form-select"
                value={form.objectiveId}
                onChange={(e) => setForm((prev) => ({ ...prev, objectiveId: e.target.value }))}
              >
                {objectives.map((objective) => (
                  <option key={objective.id} value={objective.id}>{objective.fullName}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Fecha</label>
              <input
                className="form-input"
                type="date"
                value={form.date}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Lugar</label>
            <input
              className="form-input"
              value={form.location}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="Lugar de la interaccion"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Objetivo previsto</label>
            <textarea
              className="form-textarea"
              value={form.plannedObjective}
              onChange={(e) => setForm((prev) => ({ ...prev, plannedObjective: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Resultado obtenido</label>
            <textarea
              className="form-textarea"
              value={form.actualResult}
              onChange={(e) => setForm((prev) => ({ ...prev, actualResult: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Valoracion</label>
            <select
              className="form-select"
              value={form.rating}
              onChange={(e) => setForm((prev) => ({ ...prev, rating: Number(e.target.value) as InteractionRating }))}
            >
              {Object.entries(ratingLabels).map(([value, label]) => (
                <option key={value} value={value}>{value} - {label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Observaciones</label>
            <textarea
              className="form-textarea"
              value={form.observations}
              onChange={(e) => setForm((prev) => ({ ...prev, observations: e.target.value }))}
              placeholder="Informacion obtenida, riesgos detectados, oportunidades..."
            />
          </div>

          <button className="btn btn-primary" type="submit">Guardar valoracion</button>
        </form>

        <div className="authority-panel">
          <div className="authority-panel-header">
            <div>
              <h2>Historico de valoraciones</h2>
              <p>Consulta el seguimiento de reuniones ya evaluadas por la autoridad.</p>
            </div>
          </div>
          <div className="authority-status-stack">
            {evaluations.map((evaluation) => {
              const objective = objectives.find((item) => item.id === evaluation.objectiveId);
              return (
                <div key={evaluation.id} className="authority-history-card">
                  <div className="authority-request-top">
                    <strong>{objective?.fullName ?? '-'}</strong>
                    <span className="authority-status-pill">{evaluation.rating} - {ratingLabels[evaluation.rating]}</span>
                  </div>
                  <p><strong>Fecha:</strong> {evaluation.date} · <strong>Lugar:</strong> {evaluation.location}</p>
                  <p><strong>Objetivo previsto:</strong> {evaluation.plannedObjective}</p>
                  <p><strong>Resultado:</strong> {evaluation.actualResult}</p>
                  <p><strong>Observaciones:</strong> {evaluation.observations}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
