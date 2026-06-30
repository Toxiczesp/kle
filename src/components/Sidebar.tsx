import { NavLink, useLocation } from 'react-router-dom';
import {
  BrainCircuit,
  ClipboardCheck,
  ClipboardList,
  FileBarChart,
  FilePlus2,
  FolderOpen,
  LayoutDashboard,
  MessageSquareText,
  Shield,
  Target,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const analystNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/objectives', icon: Target, label: 'Autoridades Objetivo' },
  { to: '/repository', icon: FolderOpen, label: 'Repositorio' },
  { to: '/interactions', icon: ClipboardList, label: 'Interacciones' },
  { to: '/analysis', icon: BrainCircuit, label: 'Info Autoridad Objetivo' },
  { to: '/analyst/requests', icon: FilePlus2, label: 'Solicitudes' },
  { to: '/ai-chat', icon: MessageSquareText, label: 'Preguntas IA' },
  { to: '/reports', icon: FileBarChart, label: 'Informes' },
];

const authorityNavItems = [
  { to: '/authority', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/authority/kle', icon: Users, label: 'Buscador KLE' },
  { to: '/authority/interactions', icon: ClipboardList, label: 'Interacciones' },
  { to: '/authority/evaluations', icon: ClipboardCheck, label: 'Valoraciones' },
  { to: '/authority/requests', icon: FilePlus2, label: 'Solicitud de Informes' },
  { to: '/authority/ai', icon: MessageSquareText, label: 'Asistente IA' },
];

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const isAnalyst = user?.role === 'analista';
  const visibleItems = isAnalyst ? analystNavItems : authorityNavItems;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Shield size={20} />
        </div>
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-title">KLE Platform</div>
          <div className="sidebar-brand-subtitle">Key Leader Engagement</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {isAnalyst ? (
          <>
            <div className="sidebar-section-label">Principal</div>
            {visibleItems.slice(0, 4).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `sidebar-link${isActive && (item.to === '/' ? location.pathname === '/' : true) ? ' active' : ''}`
                }
                end={item.to === '/'}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            ))}

            <div className="sidebar-section-label">Análisis</div>
            {visibleItems.slice(4).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </>
        ) : (
          <>
            <div className="sidebar-section-label">Portal Autoridad</div>
            {visibleItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-info">
          <div className="sidebar-avatar">
            {(user?.name ?? 'U')
              .split(' ')
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase() ?? '')
              .join('')}
          </div>
          <div>
            <div className="sidebar-user-name">{user?.name ?? 'Usuario'}</div>
            <div className="sidebar-user-role">{user?.role === 'autoridad' ? 'Autoridad' : 'Analista'}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
