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
  const requestTypeOptions = Object.entries(authorityRequestTypeLabels).filter(([value]) => value !== 'full-dossier');
  const [form, setForm] = useState({
    title: '',
    description: '',
    objectiveId: objectives[0]?.id ?? '',
    priority: 'medium' as PriorityLevel,
    dueDate: '',
    type: 'new-report' as AuthorityRequestType,
  });
  const [dossierForm, setDossierForm] = useState({
    objectiveId: objectives[0]?.id ?? '',
    priority: 'medium' as PriorityLevel,
    dueDate: '',
    requesterName: '',
    requesterRole: '',
    interactionDate: '',
    interactionLocation: '',
    interactionDuration: '',
    interactionObjectives: '',
    relevantInformation: '',
    description: '',
    title: '',
  });

  useEffect(() => {
    setRequests(readAuthorityRequests());
  }, []);

  useEffect(() => {
    if (!form.objectiveId && objectives[0]?.id) {
      setForm((prev) => ({ ...prev, objectiveId: objectives[0].id }));
    }
    if (!dossierForm.objectiveId && objectives[0]?.id) {
      setDossierForm((prev) => ({ ...prev, objectiveId: objectives[0].id }));
    }
  }, [dossierForm.objectiveId, form.objectiveId, objectives]);

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

  const handleDossierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created: AuthorityRequest = {
      id: `req-${Date.now()}`,
      title: dossierForm.title.trim() || `Solicitud dosier KLE - ${objectives.find((objective) => objective.id === dossierForm.objectiveId)?.fullName ?? 'autoridad'}`,
      description: dossierForm.description.trim() || 'Solicitud especifica de elaboracion de dosier KLE.',
      objectiveId: dossierForm.objectiveId,
      priority: dossierForm.priority,
      dueDate: dossierForm.dueDate,
      type: 'full-dossier',
      status: 'pending',
      createdAt: new Date().toISOString(),
      requesterName: dossierForm.requesterName,
      requesterRole: dossierForm.requesterRole,
      interactionDate: dossierForm.interactionDate,
      interactionLocation: dossierForm.interactionLocation,
      interactionDuration: dossierForm.interactionDuration,
      interactionObjectives: dossierForm.interactionObjectives,
      relevantInformation: dossierForm.relevantInformation,
    };

    const next = [created, ...requests];
    setRequests(next);
    writeAuthorityRequests(next);
    setDossierForm({
      objectiveId: objectives[0]?.id ?? '',
      priority: 'medium',
      dueDate: '',
      requesterName: '',
      requesterRole: '',
      interactionDate: '',
      interactionLocation: '',
      interactionDuration: '',
      interactionObjectives: '',
      relevantInformation: '',
      description: '',
      title: '',
    });
  };

  return (
    <div className="authority-shell">
      <section className="authority-grid authority-grid-2">
        <div className="authority-status-stack">
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
                  {requestTypeOptions.map(([value, label]) => (
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

          <form className="authority-panel" onSubmit={handleDossierSubmit}>
            <div className="authority-panel-header">
              <div>
                <h2>Solicitud Dosier KLE</h2>
                <p>Encarga un dosier completo con los datos necesarios para preparar la interaccion.</p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Autoridad objetivo del KLE</label>
              <select
                className="form-select"
                value={dossierForm.objectiveId}
                onChange={(e) => setDossierForm((prev) => ({ ...prev, objectiveId: e.target.value }))}
                required
              >
                {objectives.map((objective) => (
                  <option key={objective.id} value={objective.id}>{objective.fullName}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Persona que lo solicita</label>
                <input
                  className="form-input"
                  value={dossierForm.requesterName}
                  onChange={(e) => setDossierForm((prev) => ({ ...prev, requesterName: e.target.value }))}
                  placeholder="Nombre y apellidos"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Empleo / puesto</label>
                <input
                  className="form-input"
                  value={dossierForm.requesterRole}
                  onChange={(e) => setDossierForm((prev) => ({ ...prev, requesterRole: e.target.value }))}
                  placeholder="Cargo o puesto"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Interaccion: fecha</label>
                <input
                  className="form-input"
                  type="date"
                  value={dossierForm.interactionDate}
                  onChange={(e) => setDossierForm((prev) => ({ ...prev, interactionDate: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Lugar</label>
                <input
                  className="form-input"
                  value={dossierForm.interactionLocation}
                  onChange={(e) => setDossierForm((prev) => ({ ...prev, interactionLocation: e.target.value }))}
                  placeholder="Lugar previsto"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Prioridad</label>
                <select
                  className="form-select"
                  value={dossierForm.priority}
                  onChange={(e) => setDossierForm((prev) => ({ ...prev, priority: e.target.value as PriorityLevel }))}
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
                  value={dossierForm.dueDate}
                  onChange={(e) => setDossierForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Duracion prevista (horas / dias)</label>
              <input
                className="form-input"
                value={dossierForm.interactionDuration}
                onChange={(e) => setDossierForm((prev) => ({ ...prev, interactionDuration: e.target.value }))}
                placeholder="Ej. 2 horas, 3 dias..."
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Titulo interno de la solicitud</label>
              <input
                className="form-input"
                value={dossierForm.title}
                onChange={(e) => setDossierForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Opcional"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Descripcion breve para el analista</label>
              <textarea
                className="form-textarea"
                value={dossierForm.description}
                onChange={(e) => setDossierForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Opcional"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Objetivos de la interaccion</label>
              <textarea
                className="form-textarea"
                value={dossierForm.interactionObjectives}
                onChange={(e) => setDossierForm((prev) => ({ ...prev, interactionObjectives: e.target.value }))}
                placeholder="Objetivos previstos para la interaccion"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Otra informacion relevante para la elaboracion del Dosier KLE</label>
              <textarea
                className="form-textarea"
                value={dossierForm.relevantInformation}
                onChange={(e) => setDossierForm((prev) => ({ ...prev, relevantInformation: e.target.value }))}
                placeholder="Contexto adicional, sensibilidades, enfoque deseado..."
                required
              />
            </div>

            <button className="btn btn-primary" type="submit">Registrar solicitud dosier</button>
          </form>
        </div>

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
                  {request.analystResponse && (
                    <p><strong>Respuesta del analista:</strong> {request.analystResponse}</p>
                  )}
                  {request.type === 'full-dossier' && (
                    <>
                      <p><strong>Solicitante:</strong> {request.requesterName ?? '-'} · {request.requesterRole ?? '-'}</p>
                      <p><strong>Interaccion:</strong> {request.interactionDate ?? '-'} · {request.interactionLocation ?? '-'} · {request.interactionDuration ?? '-'}</p>
                      <p><strong>Objetivos:</strong> {request.interactionObjectives ?? '-'}</p>
                      <p><strong>Informacion relevante:</strong> {request.relevantInformation ?? '-'}</p>
                    </>
                  )}
                  <div className="authority-request-meta">
                    <span>{objective?.fullName ?? '-'}</span>
                    <span>{authorityRequestTypeLabels[request.type]}</span>
                    <span>{priorityLabels[request.priority]}</span>
                    <span>Limite {request.dueDate}</span>
                  </div>
                  {request.updatedAt && (
                    <div style={{ marginTop: 'var(--space-2)', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      {request.analystName ? `Actualizado por ${request.analystName}` : 'Actualizado por analista'} · {new Date(request.updatedAt).toLocaleString('es-ES')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
