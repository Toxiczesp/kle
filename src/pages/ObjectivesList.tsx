import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, MapPin, Building2 } from 'lucide-react';
import type { PriorityLevel, ObjectiveStatus } from '../types';
import BackButton from '../components/BackButton';
import { useObjectives } from '../context/ObjectivesContext';

const priorityLabels: Record<PriorityLevel, string> = {
  critical: 'Critico',
  high: 'Alto',
  medium: 'Medio',
  low: 'Bajo',
};

const statusLabels: Record<ObjectiveStatus, string> = {
  active: 'Activo',
  monitoring: 'En seguimiento',
  closed: 'Cerrado',
};

export default function ObjectivesList() {
  const { objectives } = useObjectives();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filtered = objectives.filter((obj) => {
    const matchesSearch =
      obj.fullName.toLowerCase().includes(search.toLowerCase()) ||
      obj.organization.toLowerCase().includes(search.toLowerCase()) ||
      obj.country.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || obj.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || obj.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div>
      <BackButton />
      <div className="section-header">
        <div>
          <h2 className="section-title">Autoridades Objetivo</h2>
          <p className="section-subtitle">{objectives.length} personas registradas</p>
        </div>
        <Link to="/objectives/new" className="btn btn-primary">
          + Nueva Autoridad Objetivo
        </Link>
      </div>

      <div className="search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder="Buscar por nombre, organizacion o pais..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="filters">
        <Filter size={16} style={{ color: 'var(--color-text-muted)', marginRight: 4, alignSelf: 'center' }} />
        {['all', 'active', 'monitoring', 'closed'].map((s) => (
          <button
            key={s}
            className={`filter-btn${statusFilter === s ? ' active' : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'all' ? 'Todos' : statusLabels[s as ObjectiveStatus]}
          </button>
        ))}
        <span style={{ width: 1, background: 'var(--color-border)', margin: '0 4px' }} />
        {['all', 'critical', 'high', 'medium', 'low'].map((p) => (
          <button
            key={p}
            className={`filter-btn${priorityFilter === p ? ' active' : ''}`}
            onClick={() => setPriorityFilter(p)}
          >
            {p === 'all' ? 'Todas prioridades' : priorityLabels[p as PriorityLevel]}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {filtered.map((obj) => (
          <Link to={`/objectives/${obj.id}`} className="obj-card" key={obj.id}>
            <div className="avatar avatar-lg">
              {obj.fullName
                .split(' ')
                .filter((_, i) => i === 0 || i === obj.fullName.split(' ').length - 1)
                .map((n) => n[0])
                .join('')}
            </div>
            <div className="obj-card-info">
              <div className="obj-card-name">{obj.fullName}</div>
              <div className="obj-card-role">{obj.title} - {obj.organization}</div>
              <div className="obj-card-meta">
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  <MapPin size={12} /> {obj.country}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  <Building2 size={12} /> {obj.project}
                </span>
              </div>
            </div>
            <div className="obj-card-badges">
              <span className={`badge badge-${obj.priority}`}>
                <span className="badge-dot" />
                {priorityLabels[obj.priority]}
              </span>
              <span className={`badge badge-${obj.status}`}>
                {statusLabels[obj.status]}
              </span>
            </div>
          </Link>
        ))}

        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Search size={28} />
            </div>
            <h3 className="empty-state-title">Sin resultados</h3>
            <p className="empty-state-text">No se encontraron autoridades objetivo con los filtros seleccionados.</p>
          </div>
        )}
      </div>
    </div>
  );
}
