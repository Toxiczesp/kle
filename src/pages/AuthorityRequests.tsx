import { useEffect, useState } from 'react';
import { useObjectives } from '../context/ObjectivesContext';
import {
  authorityRequestStatusLabels,
  authorityRequestTypeLabels,
  priorityLabels,
  readAuthorityRequests,
  writeAuthorityRequests,
} from '../data/authorityPortal';
import type { AuthorityRequest, AuthorityRequestType, PriorityLevel } from '../types';

export default function AuthorityRequests() {
  const { objectives } = useObjectives();
  const [requests, setRequests] = useState<AuthorityRequest[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    objectiveId: objectives[0]?.id ?? '',
    priority: 'medium' as PriorityLevel,
    dueDate: '',
    type: 'new-report' as AuthorityRequestType,
  });

  useEffect(() => {
    setRequests(readAuthorityRequests());
  }, []);

  useEffect(() => {
    if (!form.objectiveId && objectives[0]?.id) {
      setForm((prev) => ({ ...prev, objectiveId: objectives[0].id }));
    }
  }, [form.objectiveId, objectives]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created: AuthorityRequest = {
      id: `req-${Date.now()}`,
      title: form.title,
      description: form.description,
      objectiveId: form.objectiveId,
      priority: form.priority,
      dueDate: form.dueDate,
      type: form.type,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const next = [created, ...requests];
    setRequests(next);
    writeAuthorityRequests(next);
    setForm({
      title: '',
      description: '',
      objectiveId: objectives[0]?.id ?? '',
      priority: 'medium',
      dueDate: '',
      type: 'new-report',
    });
  };

  return (
    <div className="authority-shell">
      <section className="authority-grid authority-grid-2">
        <form className="authority-panel" onSubmit={handleSubmit}>
          <div className="authority-panel-header">
            <div>
              <h2>Crear solicitud</h2>
              <p>Encarga nuevos informes o actualizaciones al equipo de analisis.</p>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Titulo</label>
            <input
              className="form-input"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Titulo de la solicitud"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Descripcion</label>
            <textarea
              className="form-textarea"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe el encargo para el analista"
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Autoridad objetivo</label>
              <select
                className="form-select"
                value={form.objectiveId}
                onChange={(e) => setForm((prev) => ({ ...prev, objectiveId: e.target.value }))}
                required
              >
                {objectives.map((objective) => (
                  <option key={objective.id} value={objective.id}>{objective.fullName}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tipo de solicitud</label>
              <select
                className="form-select"
                value={form.type}
                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as AuthorityRequestType }))}
              >
                {Object.entries(authorityRequestTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Prioridad</label>
              <select
                className="form-select"
                value={form.priority}
                onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value as PriorityLevel }))}
              >
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Fecha limite</label>
              <input
                className="form-input"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                required
              />
            </div>
          </div>
          <button className="btn btn-primary" type="submit">Registrar solicitud</button>
        </form>

        <div className="authority-panel">
          <div className="authority-panel-header">
            <div>
              <h2>Seguimiento</h2>
              <p>Consulta el estado de los trabajos en curso.</p>
            </div>
          </div>
          <div className="authority-status-stack">
            {requests.map((request) => {
              const objective = objectives.find((item) => item.id === request.objectiveId);
              return (
                <div key={request.id} className="authority-request-card">
                  <div className="authority-request-top">
                    <strong>{request.title}</strong>
                    <span className="authority-status-pill">{authorityRequestStatusLabels[request.status]}</span>
                  </div>
                  <p>{request.description}</p>
                  <div className="authority-request-meta">
                    <span>{objective?.fullName ?? '-'}</span>
                    <span>{authorityRequestTypeLabels[request.type]}</span>
                    <span>{priorityLabels[request.priority]}</span>
                    <span>Limite {request.dueDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
