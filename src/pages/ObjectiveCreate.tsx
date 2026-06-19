import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { useObjectives } from '../context/ObjectivesContext';

export default function ObjectiveCreate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addObjective } = useObjectives();
  const initialName = searchParams.get('name') ?? '';
  const [form, setForm] = useState({
    fullName: initialName,
    title: '',
    organization: '',
    country: '',
    project: '',
    biography: '',
    analystNotes: '',
  });

  const pageTitle = useMemo(
    () => (initialName ? `Nuevo objetivo para ${initialName}` : 'Nuevo objetivo'),
    [initialName]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created = addObjective(form);
    navigate(`/reports?obj=${created.id}`);
  };

  return (
    <div>
      <BackButton fallbackTo="/" />
      <div className="section-header">
        <div>
          <h2 className="section-title">{pageTitle}</h2>
          <p className="section-subtitle">
            Completa los datos minimos, guarda el objetivo en la plataforma y abre su informe inicial.
          </p>
        </div>
      </div>

      <form className="card" onSubmit={handleSubmit} style={{ maxWidth: 860 }}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Nombre completo</label>
            <input
              className="form-input"
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              placeholder="Nombre de la persona"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Cargo</label>
            <input
              className="form-input"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Cargo o funcion"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Organizacion</label>
            <input
              className="form-input"
              value={form.organization}
              onChange={(e) => setForm((prev) => ({ ...prev, organization: e.target.value }))}
              placeholder="Institucion u organismo"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Pais</label>
            <input
              className="form-input"
              value={form.country}
              onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
              placeholder="Pais de referencia"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Proyecto</label>
          <input
            className="form-input"
            value={form.project}
            onChange={(e) => setForm((prev) => ({ ...prev, project: e.target.value }))}
            placeholder="Proyecto asociado"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Biografia inicial</label>
          <textarea
            className="form-textarea"
            value={form.biography}
            onChange={(e) => setForm((prev) => ({ ...prev, biography: e.target.value }))}
            placeholder="Informacion biografica inicial"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Notas del analista</label>
          <textarea
            className="form-textarea"
            value={form.analystNotes}
            onChange={(e) => setForm((prev) => ({ ...prev, analystNotes: e.target.value }))}
            placeholder="Primeras observaciones"
          />
        </div>

        <div className="btn-group">
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: 0 }}>
            Al crear el objetivo, se guarda en la base local de la aplicacion y se abre directamente
            la vista de informes de esa persona.
          </p>
          <button className="btn btn-primary" type="submit">
            Crear y generar informe
          </button>
        </div>
      </form>
    </div>
  );
}
