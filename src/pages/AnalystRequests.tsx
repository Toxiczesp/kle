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

export default function AnalystRequests() {
  const { user } = useAuth();
  const { objectives } = useObjectives();
  const { requests, saveRequests } = useAuthorityData();
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [draft, setDraft] = useState({
    status: 'pending' as AuthorityRequestStatus,
    analystResponse: '',
  });

  const sortedRequests = useMemo(
    () => [...requests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [requests]
  );

  useEffect(() => {
    if (!selectedRequestId && sortedRequests[0]?.id) {
      setSelectedRequestId(sortedRequests[0].id);
    }
  }, [selectedRequestId, sortedRequests]);

  const selectedRequest = useMemo(
    () => sortedRequests.find((request) => request.id === selectedRequestId),
    [sortedRequests, selectedRequestId]
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
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">Solicitudes de autoridad</h2>
          <p className="section-subtitle">
            Gestiona los encargos recibidos desde la cuenta autoridad y devuelve el resultado al seguimiento.
          </p>
        </div>
      </div>

      <div className="grid-2">
        <section className="card">
          <div className="section-header" style={{ marginBottom: 'var(--space-4)' }}>
            <div>
              <h3 className="section-title" style={{ marginBottom: 4 }}>Bandeja de entrada</h3>
              <p className="section-subtitle">{sortedRequests.length} solicitud(es) compartidas con el analista.</p>
            </div>
          </div>

          <div className="authority-status-stack">
            {sortedRequests.map((request) => {
              const objective = objectives.find((item) => item.id === request.objectiveId);
              return (
                <button
                  key={request.id}
                  type="button"
                  className={`authority-request-card${selectedRequestId === request.id ? ' selected' : ''}`}
                  onClick={() => setSelectedRequestId(request.id)}
                >
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
                </button>
              );
            })}
          </div>
        </section>

        <section className="card">
          {selectedRequest ? (
            <>
              <div className="section-header" style={{ marginBottom: 'var(--space-4)' }}>
                <div>
                  <h3 className="section-title" style={{ marginBottom: 4 }}>{selectedRequest.title}</h3>
                  <p className="section-subtitle">
                    Lo que actualices aquí quedará visible para la autoridad en su seguimiento.
                  </p>
                </div>
              </div>

              <div className="authority-request-meta" style={{ marginBottom: 'var(--space-5)' }}>
                <span>{authorityRequestTypeLabels[selectedRequest.type]}</span>
                <span>{priorityLabels[selectedRequest.priority]}</span>
                <span>{objectives.find((item) => item.id === selectedRequest.objectiveId)?.fullName ?? '-'}</span>
                <span>Limite {selectedRequest.dueDate}</span>
              </div>

              {selectedRequest.type === 'full-dossier' && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Persona que lo solicita</label>
                      <input className="form-input" value={selectedRequest.requesterName ?? ''} readOnly />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Empleo / puesto</label>
                      <input className="form-input" value={selectedRequest.requesterRole ?? ''} readOnly />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Interacción: fecha</label>
                      <input className="form-input" value={selectedRequest.interactionDate ?? ''} readOnly />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Lugar</label>
                      <input className="form-input" value={selectedRequest.interactionLocation ?? ''} readOnly />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Duración prevista</label>
                    <input className="form-input" value={selectedRequest.interactionDuration ?? ''} readOnly />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Objetivos de la interacción</label>
                    <textarea className="form-textarea" value={selectedRequest.interactionObjectives ?? ''} readOnly rows={4} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Otra información relevante</label>
                    <textarea className="form-textarea" value={selectedRequest.relevantInformation ?? ''} readOnly rows={4} />
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">Descripción del encargo</label>
                <textarea className="form-textarea" value={selectedRequest.description} readOnly rows={4} />
              </div>

              <div className="form-group">
                <label className="form-label">Estado de trabajo</label>
                <select
                  className="form-select"
                  value={draft.status}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      status: e.target.value as AuthorityRequestStatus,
                    }))
                  }
                >
                  {Object.entries(authorityRequestStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Respuesta del analista</label>
                <textarea
                  className="form-textarea"
                  rows={8}
                  value={draft.analystResponse}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      analystResponse: e.target.value,
                    }))
                  }
                  placeholder="Explica a la autoridad el avance, los cambios realizados o el resultado final..."
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary" type="button" onClick={() => void handleSave()}>
                  Guardar progreso
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => void handleSave('review')}>
                  Enviar a revisión
                </button>
                <button className="btn btn-primary" type="button" onClick={() => void handleSave('done')}>
                  Marcar como finalizado
                </button>
              </div>

              <div style={{ marginTop: 'var(--space-4)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                {selectedRequest.updatedAt
                  ? `Última actualización visible para autoridad: ${new Date(selectedRequest.updatedAt).toLocaleString('es-ES')}`
                  : 'Esta solicitud todavía no ha sido actualizada por el analista.'}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-title">No hay solicitudes seleccionadas</div>
              <p className="empty-state-text">Cuando la autoridad registre encargos, podrá gestionarlos desde aquí.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
