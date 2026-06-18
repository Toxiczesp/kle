import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  BrainCircuit,
  Check,
  ClipboardList,
  FileBarChart,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Search,
  Settings,
  Target,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import headerBrandEmad from '../assets/emad.png';
import headerBrandGobierno from '../assets/minisdef.png';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/objectives': 'Objetivos',
  '/repository': 'Repositorio',
  '/interactions': 'Interacciones',
  '/analysis': 'Analisis de Personalidad',
  '/ai-chat': 'Preguntas IA',
  '/reports': 'Informes',
};

/* ---- Searchable pages ---- */
const searchablePages = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, description: 'Panel principal del analista' },
  { path: '/objectives', label: 'Objetivos', icon: Target, description: 'Gestion de objetivos KLE' },
  { path: '/repository', label: 'Repositorio', icon: FolderOpen, description: 'Documentos y archivos' },
  { path: '/interactions', label: 'Interacciones', icon: ClipboardList, description: 'Historial de interacciones' },
  { path: '/analysis', label: 'Analisis de Personalidad', icon: BrainCircuit, description: 'Perfiles psicologicos' },
  { path: '/ai-chat', label: 'Preguntas IA', icon: MessageSquareText, description: 'Asistente inteligente' },
  { path: '/reports', label: 'Informes', icon: FileBarChart, description: 'Generar y consultar informes' },
];

/* ---- Mock notifications ---- */
interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'warning' | 'success';
}

const initialNotifications: Notification[] = [
  {
    id: 'n1',
    title: 'Nuevo documento añadido',
    message: 'Se ha subido "Informe de interacción - Marzo 2026" al repositorio del Gral. Al-Rashidi.',
    time: 'Hace 12 min',
    read: false,
    type: 'info',
  },
  {
    id: 'n2',
    title: 'Objetivo actualizado',
    message: 'La prioridad de Ibrahim Diouf ha sido elevada a "Alta".',
    time: 'Hace 2 h',
    read: false,
    type: 'warning',
  },
  {
    id: 'n3',
    title: 'Informe generado',
    message: 'El informe consolidado de la Dra. Benkhouya esta disponible para revision.',
    time: 'Hace 5 h',
    read: false,
    type: 'success',
  },
];

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAnalyst = user?.role === 'analista';

  /* ---- State ---- */
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [settingsOpen, setSettingsOpen] = useState(false);

  /* ---- Refs ---- */
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const notifBtnRef = useRef<HTMLButtonElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const settingsBtnRef = useRef<HTMLButtonElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  /* ---- Title ---- */
  const getTitle = () => {
    for (const [path, title] of Object.entries(pageTitles)) {
      if (location.pathname === path || (path !== '/' && location.pathname.startsWith(path))) {
        return title;
      }
    }
    return 'KLE Platform';
  };

  /* ---- Search logic ---- */
  const filteredPages = searchQuery.trim()
    ? searchablePages.filter(
        (p) =>
          p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : searchablePages;

  const handleSearchSelect = (path: string) => {
    navigate(path);
    setSearchOpen(false);
    setSearchQuery('');
  };

  /* ---- Notifications logic ---- */
  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  /* ---- Close dropdowns on outside click ---- */
  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (
        notificationsOpen &&
        notifRef.current &&
        !notifRef.current.contains(e.target as Node) &&
        notifBtnRef.current &&
        !notifBtnRef.current.contains(e.target as Node)
      ) {
        setNotificationsOpen(false);
      }
      if (
        settingsOpen &&
        settingsRef.current &&
        !settingsRef.current.contains(e.target as Node) &&
        settingsBtnRef.current &&
        !settingsBtnRef.current.contains(e.target as Node)
      ) {
        setSettingsOpen(false);
      }
    },
    [notificationsOpen, settingsOpen]
  );

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  /* ---- Keyboard shortcuts ---- */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotificationsOpen(false);
        setSettingsOpen(false);
        setSearchQuery('');
      }
      // Ctrl+K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setNotificationsOpen(false);
        setSettingsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  /* ---- Auto-focus search input ---- */
  useEffect(() => {
    if (searchOpen) {
      // Small delay for the animation
      const timer = setTimeout(() => searchInputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [searchOpen]);

  return (
    <>
      <header className="header">
        <div className="header-top">
          <div className="header-brand-strip" aria-hidden="true">
            <a
              className="header-brand-link"
              href="https://www.defensa.gob.es/"
              target="_blank"
              rel="noreferrer"
              aria-label="Abrir web oficial del Ministerio de Defensa"
            >
              <img
                className="header-brand-gobierno-image"
                src={headerBrandGobierno}
                alt="Gobierno de Espana - Ministerio de Defensa"
              />
            </a>
            <img
              className="header-brand-emad-image"
              src={headerBrandEmad}
              alt="Estado Mayor de la Defensa - Integracion en el multidominio"
            />
          </div>
        </div>

        <div className="header-bottom">
          <div className="header-right">
            <h1 className="header-title">{getTitle()}</h1>
            <span className={`role-pill ${isAnalyst ? 'analyst' : 'authority'}`}>
              {isAnalyst ? 'Analista' : 'Autoridad'}
            </span>
            {isAnalyst && (
              <>
                {/* ---- Search Button ---- */}
                <button
                  className="header-icon-btn"
                  title="Buscar (Ctrl+K)"
                  onClick={() => {
                    setSearchOpen(true);
                    setNotificationsOpen(false);
                    setSettingsOpen(false);
                  }}
                >
                  <Search size={18} />
                </button>

                {/* ---- Notifications Button ---- */}
                <div style={{ position: 'relative' }}>
                  <button
                    ref={notifBtnRef}
                    className={`header-icon-btn ${notificationsOpen ? 'active' : ''}`}
                    title="Notificaciones"
                    onClick={() => {
                      setNotificationsOpen(!notificationsOpen);
                      setSettingsOpen(false);
                      setSearchOpen(false);
                    }}
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && <span className="header-badge">{unreadCount}</span>}
                  </button>

                  {notificationsOpen && (
                    <div className="header-dropdown header-dropdown-notifications" ref={notifRef}>
                      <div className="header-dropdown-head">
                        <span className="header-dropdown-title">Notificaciones</span>
                        {unreadCount > 0 && (
                          <button className="header-dropdown-action" onClick={markAllAsRead}>
                            <Check size={14} />
                            Marcar todas
                          </button>
                        )}
                      </div>
                      <div className="header-dropdown-body">
                        {notifications.length === 0 ? (
                          <div className="header-dropdown-empty">No hay notificaciones</div>
                        ) : (
                          notifications.map((n) => (
                            <button
                              key={n.id}
                              className={`header-notif-item ${n.read ? 'read' : ''}`}
                              onClick={() => markAsRead(n.id)}
                            >
                              <div className={`header-notif-dot ${n.type}`} />
                              <div className="header-notif-content">
                                <div className="header-notif-title">{n.title}</div>
                                <div className="header-notif-msg">{n.message}</div>
                                <div className="header-notif-time">{n.time}</div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ---- Settings Button ---- */}
                <div style={{ position: 'relative' }}>
                  <button
                    ref={settingsBtnRef}
                    className={`header-icon-btn ${settingsOpen ? 'active' : ''}`}
                    title="Configuracion"
                    onClick={() => {
                      setSettingsOpen(!settingsOpen);
                      setNotificationsOpen(false);
                      setSearchOpen(false);
                    }}
                  >
                    <Settings size={18} />
                  </button>

                  {settingsOpen && (
                    <div className="header-dropdown header-dropdown-settings" ref={settingsRef}>
                      <div className="header-dropdown-head">
                        <span className="header-dropdown-title">Configuracion</span>
                      </div>
                      <div className="header-dropdown-body">
                        <div className="header-settings-section">
                          <div className="header-settings-label">Cuenta</div>
                          <div className="header-settings-row">
                            <span className="header-settings-key">Nombre</span>
                            <span className="header-settings-value">{user?.name ?? 'Usuario'}</span>
                          </div>
                          <div className="header-settings-row">
                            <span className="header-settings-key">Email</span>
                            <span className="header-settings-value">{user?.email ?? '—'}</span>
                          </div>
                          <div className="header-settings-row">
                            <span className="header-settings-key">Rol</span>
                            <span className="header-settings-value">
                              {user?.role === 'autoridad' ? 'Autoridad' : 'Analista'}
                            </span>
                          </div>
                        </div>
                        <div className="header-settings-section">
                          <div className="header-settings-label">Plataforma</div>
                          <div className="header-settings-row">
                            <span className="header-settings-key">Version</span>
                            <span className="header-settings-value">1.0.0</span>
                          </div>
                          <div className="header-settings-row">
                            <span className="header-settings-key">Entorno</span>
                            <span className="header-settings-value">Desarrollo</span>
                          </div>
                        </div>
                        <button
                          className="header-settings-logout"
                          onClick={() => {
                            setSettingsOpen(false);
                            logout();
                          }}
                        >
                          <LogOut size={16} />
                          Cerrar sesion
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
            <button className="header-icon-btn" title="Cerrar sesion" onClick={logout}>
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ---- Search Modal (Command Palette) ---- */}
      {searchOpen && (
        <div className="search-overlay" onClick={() => { setSearchOpen(false); setSearchQuery(''); }}>
          <div className="search-modal" onClick={(e) => e.stopPropagation()}>
            <div className="search-modal-header">
              <Search size={20} className="search-modal-icon" />
              <input
                ref={searchInputRef}
                className="search-modal-input"
                type="text"
                placeholder="Buscar pagina, seccion o funcionalidad..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filteredPages.length > 0) {
                    handleSearchSelect(filteredPages[0].path);
                  }
                }}
              />
              <button className="search-modal-close" onClick={() => { setSearchOpen(false); setSearchQuery(''); }}>
                <X size={18} />
              </button>
            </div>
            <div className="search-modal-results">
              {filteredPages.length === 0 ? (
                <div className="search-modal-empty">No se encontraron resultados para "{searchQuery}"</div>
              ) : (
                filteredPages.map((page) => {
                  const Icon = page.icon;
                  const isCurrentPage = location.pathname === page.path;
                  return (
                    <button
                      key={page.path}
                      className={`search-result-item ${isCurrentPage ? 'current' : ''}`}
                      onClick={() => handleSearchSelect(page.path)}
                    >
                      <div className="search-result-icon">
                        <Icon size={18} />
                      </div>
                      <div className="search-result-text">
                        <div className="search-result-label">{page.label}</div>
                        <div className="search-result-desc">{page.description}</div>
                      </div>
                      {isCurrentPage && <span className="search-result-badge">Actual</span>}
                    </button>
                  );
                })
              )}
            </div>
            <div className="search-modal-footer">
              <span className="search-shortcut"><kbd>↵</kbd> Seleccionar</span>
              <span className="search-shortcut"><kbd>Esc</kbd> Cerrar</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
