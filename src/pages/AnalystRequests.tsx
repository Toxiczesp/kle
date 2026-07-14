import { useEffect, useMemo, useState } from 'react';
import { useAuthorityData } from '../context/AuthorityDataContext';
import {
  authorityRequestStatusLabels,
  authorityRequestTypeLabels,
  priorityLabels,
} from '../data/authorityPortal';
import { useObjectives } from '../context/ObjectivesContext';
import { useAuth } from '../context/AuthContext';
import type { AuthorityRequest, AuthorityRequestStatus } from '../types';

const statusGroups: Array<{
  id: 'new' | 'in-progress' | 'done';
  title: string;
  statuses: AuthorityRequestStatus[];
}> = [
  { id: 'new', title: 'Nuevas', statuses: ['pending'] },
  { id: 'in-progress', title: 'En proceso', statuses: ['drafting', 'review'] },
  { id: 'done', title: 'Finalizadas', statuses: ['done'] },
];

export default function AnalystRequests() {
  const { user } = useAuth();
  const { objectives } = useObjectives();
  const { requests, saveRequests } = useAuthorityData();
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [activeGroup, setActiveGroup] = useState<'all' | 'new' | 'in-progress' | 'done'>('all');
  const [draft, setDraft] = useState({
    status: 'pending' as AuthorityRequestStatus,
    analystResponse: '',
  });

  const sortedRequests = useMemo(
    () =>
      [...requests].sort(
        (a, b) =>
          new Date(b.updatedAt ?? b.createdAt).getTime() -
          new Date(a.updatedAt ?? a.createdAt).getTime()
      ),
    [requests]
  );

  useEffect(() => {
    if (!selectedRequestId && sortedRequests[0]?.id) {
      setSelectedRequestId(sortedRequests[0].id);
    }
  }, [selectedRequestId, sortedRequests]);

  const groupedRequests = useMemo(() => {
    return statusGroups.map((group) => ({
      ...group,
      items: sortedRequests.filter((request) => group.statuses.includes(request.status)),
    }));
  }, [sortedRequests]);

  const visibleGroups =
    activeGroup === 'all'
      ? groupedRequests
      : groupedRequests.filter((group) => group.id === activeGroup);

  const selectedRequest = useMemo(
    () => sortedRequests.find((request) => request.id === selectedRequestId),
    [sortedRequests, selectedRequestId]
  );
  const selectedObjective = useMemo(
    () =>
      objectives.find((item) => item.id === selectedRequest?.objectiveId),
    [objectives, selectedRequest]
  );

  useEffect(() => {
    if (!selectedRequest) return;
    setDraft({
      status: selectedRequest.status,
      analystResponse: selectedRequest.analystResponse ?? '',
    });
  }, [selectedRequest]);

  const handleSave = async (nextStatus?: AuthorityRequestStatus) => {
    if (!selectedRequest || !user) return;

    const resolvedStatus = nextStatus ?? draft.status;
    const now = new Date().toISOString();
    const updatedRequest: AuthorityRequest = {
      ...selectedRequest,
      status: resolvedStatus,
      analystName: user.name,
      analystResponse: draft.analystResponse.trim(),
      updatedAt: now,
      completedAt: resolvedStatus === 'done' ? now : selectedRequest.completedAt,
    };

    const nextRequests = sortedRequests.map((request) =>
      request.id === selectedRequest.id ? updatedRequest : request
    );

    await saveRequests(nextRequests);
  };

  return (
    <div className="analyst-requests-page">
      <div className="section-header">
        <div>
          <h2 className="section-title">Solicitudes</h2>
          <p className="section-subtitle">
            Organiza el trabajo del analista por solicitudes nuevas, en proceso y finalizadas.
          </p>
        </div>
      </div>

      <div className="analyst-request-summary">
        <button
          type="button"
          className={`analyst-summary-card ${activeGroup === 'all' ? 'active' : ''}`}
          onClick={() => setActiveGroup('all')}
        >
          <span>Total</span>
          <strong>{sortedRequests.length}</strong>
        </button>
        {groupedRequests.map((group) => (
          <button
            key={group.id}
            type="button"
            className={`analyst-summary-card ${activeGroup === group.id ? 'active' : ''}`}
            onClick={() => setActiveGroup(group.id)}
          >
            <span>{group.title}</span>
            <strong>{group.items.length}</strong>
          </button>
        ))}
      </div>

      <div className="grid-2 analyst-requests-layout">
        <section className="card analyst-requests-board">
          <div className="analyst-requests-panel-head">
            <div>
              <h3 className="section-title" style={{ marginBottom: 4 }}>Bandeja</h3>
              <p className="section-subtitle">
                Seleccione una solicitud para ver su ficha y continuar el trabajo.
              </p>
            </div>
          </div>

          <div className="analyst-request-groups">
            {visibleGroups.map((group) => (
              <div className="analyst-request-group" key={group.id}>
                <div className="analyst-request-group-header">
                  <h3>{group.title}</h3>
                  <span>{group.items.length}</span>
                </div>

                <div className="authority-status-stack">
                  {group.items.map((request) => {
                    const objective = objectives.find(
                      (item) => item.id === request.objectiveId
                    );
                    return (
                      <button
                        key={request.id}
                        type="button"
                        className={`authority-request-card analyst-request-list-card${
                          selectedRequestId === request.id ? ' selected' : ''
                        }`}
                        onClick={() => setSelectedRequestId(request.id)}
                      >
                        <div className="authority-request-top">
                          <strong className="analyst-request-list-title">{request.title}</strong>
                          <span className="authority-status-pill">
                            {authorityRequestStatusLabels[request.status]}
                          </span>
                        </div>
                        <p className="analyst-request-list-description">{request.description}</p>
                        <div className="authority-request-meta analyst-request-list-meta">
                          <span>{objective?.fullName ?? '-'}</span>
                          <span>{request.requesterName ?? 'Solicitante no indicado'}</span>
                          <span>{priorityLabels[request.priority]}</span>
                        </div>
                      </button>
                    );
                  })}

                  {group.items.length === 0 && (
                    <div className="analyst-repository-empty">
                      No hay solicitudes en este estado.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card analyst-request-detail-panel">
          {selectedRequest ? (
            <>
              <div className="analyst-request-detail-hero">
                <div className="analyst-request-detail-copy">
                  <span className="analyst-empty-pill" style={{ margin: 0 }}>
                    {authorityRequestStatusLabels[selectedRequest.status]}
                  </span>
                  <h3 className="analyst-request-detail-title">{selectedRequest.title}</h3>
                  <p className="section-subtitle">
                    Los cambios guardados aqui quedan visibles para la cuenta de autoridad.
                  </p>
                </div>
                <div className="analyst-request-detail-side">
                  <div className="analyst-request-detail-key">Prioridad</div>
                  <strong>{priorityLabels[selectedRequest.priority]}</strong>
                </div>
              </div>

              <div className="analyst-request-detail-meta">
                <div className="analyst-request-detail-meta-card">
                  <span>Tipo</span>
                  <strong>{authorityRequestTypeLabels[selectedRequest.type]}</strong>
                </div>
                <div className="analyst-request-detail-meta-card">
                  <span>Autoridad objetivo</span>
                  <strong>{selectedObjective?.fullName ?? '-'}</strong>
                </div>
                <div className="analyst-request-detail-meta-card">
                  <span>Fecha limite</span>
                  <strong>{selectedRequest.dueDate}</strong>
                </div>
                <div className="analyst-request-detail-meta-card">
                  <span>Solicitante</span>
                  <strong>{selectedRequest.requesterName ?? 'No indicado'}</strong>
                </div>
              </div>

              <div className="analyst-request-detail-block">
                <div className="analyst-request-detail-block-head">
                  <h4>Contexto de la solicitud</h4>
                  <span>Lectura rapida</span>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Autoridad solicitante</label>
                    <input
                      className="form-input"
                      value={selectedRequest.requesterName ?? ''}
                      readOnly
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cargo o puesto</label>
                    <input
                      className="form-input"
                      value={selectedRequest.requesterRole ?? ''}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="analyst-request-detail-block">
                <div className="analyst-request-detail-block-head">
                  <h4>Descripcion del encargo</h4>
                  <span>Base de trabajo</span>
                </div>
                <div className="analyst-request-readonly">
                  {selectedRequest.description}
                </div>
              </div>

              <div className="analyst-request-detail-block">
                <div className="analyst-request-detail-block-head">
                  <h4>Gestion del analista</h4>
                  <span>Actualiza estado y respuesta</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Estado de trabajo</label>
                  <select
                    className="form-select"
                    value={draft.status}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        status: event.target.value as AuthorityRequestStatus,
                      }))
                    }
                  >
                    {Object.entries(authorityRequestStatusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Respuesta del analista</label>
                  <textarea
                    className="form-textarea analyst-request-response"
                    rows={8}
                    value={draft.analystResponse}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        analystResponse: event.target.value,
                      }))
                    }
                    placeholder="Explica el avance, los cambios realizados o el resultado final."
                  />
                </div>

                <div className="analyst-request-actions">
                  <button className="btn btn-secondary" type="button" onClick={() => void handleSave()}>
                    Guardar progreso
                  </button>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => void handleSave('review')}
                  >
                    Enviar a revision
                  </button>
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => void handleSave('done')}
                  >
                    Marcar como finalizada
                  </button>
                </div>
              </div>

              <div className="analyst-request-updated-at">
                {selectedRequest.updatedAt
                  ? `Ultima actualizacion visible para autoridad: ${new Date(
                      selectedRequest.updatedAt
                    ).toLocaleString('es-ES')}`
                  : 'Esta solicitud todavia no ha sido actualizada por el analista.'}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-title">No hay solicitudes seleccionadas</div>
              <p className="empty-state-text">
                Cuando la autoridad registre encargos, podrá gestionarlos desde aquí.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
