import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  BrainCircuit,
  ClipboardCheck,
  ClipboardList,
  FilePlus2,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Search,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAuthorityData } from '../context/AuthorityDataContext';
import { authorityRequestStatusLabels, priorityLabels } from '../data/authorityPortal';
import headerBrandEmad from '../assets/emad.png';
import headerBrandGobierno from '../assets/minisdef.png';

const analystPageTitles: Record<string, string> = {
  '/': 'Portal Analista',
  '/objectives': 'Buscador',
  '/repository': 'Repositorio',
  '/interactions': 'Interacciones',
  '/analysis': 'Info Autoridad Objetivo',
  '/analyst/requests': 'Solicitudes',
  '/ai-chat': 'Asistente IA',
  '/reports': 'Informes',
};

const authorityPageTitles: Record<string, string> = {
  '/authority': 'Dashboard Autoridad',
  '/authority/kle': 'Buscador KLE',
  '/authority/interactions': 'Interacciones',
  '/authority/evaluations': 'Valoraciones',
  '/authority/requests': 'Solicitud de Informes',
  '/authority/ai': 'Asistente IA',
};

const analystSearchablePages = [
  {
    path: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Vista principal del portal analista preparada para nuevo contenido',
  },
  {
    path: '/objectives',
    label: 'Buscador',
    icon: Users,
    description: 'Busqueda por autoridad, pais, estado, solicitante, interacciones y fecha',
  },
  {
    path: '/repository',
    label: 'Repositorio',
    icon: FolderOpen,
    description: 'Informes KLE, valoraciones, resumen ejecutivo y cuestionarios',
  },
  {
    path: '/analyst/requests',
    label: 'Solicitudes',
    icon: FilePlus2,
    description: 'Solicitudes nuevas, en proceso y finalizadas',
  },
  {
    path: '/ai-chat',
    label: 'Asistente IA',
    icon: MessageSquareText,
    description: 'Asistente conversacional integrado en el flujo del analista',
  },
  {
    path: '/interactions',
    label: 'Interacciones',
    icon: ClipboardList,
    description: 'Historial operativo y contexto complementario',
  },
  {
    path: '/analysis',
    label: 'Info Autoridad Objetivo',
    icon: BrainCircuit,
    description: 'Perfilado ampliado de la autoridad objetivo',
  },
];

const authoritySearchablePages = [
  {
    path: '/authority',
    label: 'Dashboard Autoridad',
    icon: LayoutDashboard,
    description: 'Panel principal de consulta y coordinacion',
  },
  {
    path: '/authority/kle',
    label: 'Buscador KLE',
    icon: Users,
    description: 'Dosieres, documentos y fichas por autoridad',
  },
  {
    path: '/authority/interactions',
    label: 'Interacciones',
    icon: ClipboardList,
    description: 'Consultas por fechas, pais, lugar y organismo',
  },
  {
    path: '/authority/evaluations',
    label: 'Valoraciones',
    icon: ClipboardCheck,
    description: 'Valoracion del dosier KLE y de cada interaccion',
  },
  {
    path: '/authority/requests',
    label: 'Solicitud de Informes',
    icon: FilePlus2,
    description: 'Encargos y seguimiento al equipo de analisis',
  },
  {
    path: '/authority/ai',
    label: 'Asistente IA',
    icon: BrainCircuit,
    description: 'Asistente conversacional sobre informacion operativa',
  },
];

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'warning' | 'success';
}

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return 'Ahora';
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Hace un momento';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `Hace ${diffHr} h`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays === 1) return 'Ayer';
    return `Hace ${diffDays} días`;
  } catch (e) {
    return 'Hace poco';
  }
}

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAnalyst = user?.role === 'analista';
  const pageTitles = isAnalyst ? analystPageTitles : authorityPageTitles;
  const searchablePages = isAnalyst ? analystSearchablePages : authoritySearchablePages;

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { requests } = useAuthorityData();
  const localStorageKey = user ? `kle_read_requests_user_${user.id}` : '';
  const [readRequestIds, setReadRequestIds] = useState<string[]>([]);

  useEffect(() => {
    if (!localStorageKey) return;
    try {
      const stored = localStorage.getItem(localStorageKey);
      if (stored) {
        setReadRequestIds(JSON.parse(stored));
      } else {
        setReadRequestIds([]);
      }
    } catch (e) {
      console.error(e);
    }
  }, [localStorageKey]);

  const saveReadRequestIds = (ids: string[]) => {
    setReadRequestIds(ids);
    if (localStorageKey) {
      try {
        localStorage.setItem(localStorageKey, JSON.stringify(ids));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const notifications: Notification[] = useMemo(() => {
    if (!user) return [];
    
    // Sort requests by newest first
    const sorted = [...requests].sort(
      (a, b) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime()
    );

    return sorted.map((request) => {
      const isRead = readRequestIds.includes(request.id);
      const timeStr = formatRelativeTime(request.updatedAt ?? request.createdAt);

      if (user.role === 'analista') {
        // Notifications for Analyst: new requests from Authority
        return {
          id: request.id,
          title: `Nueva solicitud: ${request.title}`,
          message: `Prioridad: ${priorityLabels[request.priority] || request.priority}. Plazo: ${request.dueDate || 'Sin fecha'}. ${request.description}`,
          time: timeStr,
          read: isRead,
          type: (request.priority === 'critical' || request.priority === 'high' ? 'warning' : 'info') as 'info' | 'warning' | 'success',
        };
      } else {
        // Notifications for Authority: updates on requests
        const statusLabel = authorityRequestStatusLabels[request.status] || request.status;
        return {
          id: request.id,
          title: `Actualización de solicitud: ${request.title}`,
          message: `Estado actual: ${statusLabel}. ${request.analystResponse ? `Respuesta: ${request.analystResponse}` : ''}`,
          time: timeStr,
          read: isRead,
          type: (request.status === 'done' ? 'success' : 'info') as 'info' | 'warning' | 'success',
        };
      }
    });
  }, [requests, user, readRequestIds]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const notifBtnRef = useRef<HTMLButtonElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const settingsBtnRef = useRef<HTMLButtonElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getTitle = () => {
    const sortedTitles = Object.entries(pageTitles).sort(
      ([pathA], [pathB]) => pathB.length - pathA.length
    );
    for (const [path, title] of sortedTitles) {
      if (
        location.pathname === path ||
        (path !== '/' && location.pathname.startsWith(path))
      ) {
        return title;
      }
    }
    return 'KLE Platform';
  };

  const filteredPages = searchQuery.trim()
    ? searchablePages.filter(
        (page) =>
          page.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          page.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : searchablePages;

  const handleSearchSelect = (path: string) => {
    navigate(path);
    setSearchOpen(false);
    setSearchQuery('');
  };

  const markAsRead = (id: string) => {
    if (!readRequestIds.includes(id)) {
      saveReadRequestIds([...readRequestIds, id]);
    }
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    saveReadRequestIds(allIds);
  };

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
    setNotificationsOpen(false);
    navigate(user?.role === 'analista' ? '/analyst/requests' : '/authority/requests');
  };

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        notificationsOpen &&
        notifRef.current &&
        !notifRef.current.contains(event.target as Node) &&
        notifBtnRef.current &&
        !notifBtnRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }

      if (
        settingsOpen &&
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node) &&
        settingsBtnRef.current &&
        !settingsBtnRef.current.contains(event.target as Node)
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

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSearchOpen(false);
        setNotificationsOpen(false);
        setSettingsOpen(false);
        setSearchQuery('');
      }

      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setSearchOpen(true);
        setNotificationsOpen(false);
        setSettingsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const timer = setTimeout(() => searchInputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
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

            {user && (
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
                  {unreadCount > 0 && (
                    <span className="header-badge">{unreadCount}</span>
                  )}
                </button>

                {notificationsOpen && (
                  <div
                    className="header-dropdown header-dropdown-notifications"
                    ref={notifRef}
                  >
                    <div className="header-dropdown-top">
                      <div>
                        <div className="header-dropdown-title">Notificaciones</div>
                        <div className="header-dropdown-subtitle">
                          {unreadCount} sin leer
                        </div>
                      </div>
                      {notifications.length > 0 && (
                        <button className="header-text-btn" onClick={markAllAsRead}>
                          Marcar todas
                        </button>
                      )}
                    </div>
                    <div className="header-dropdown-list">
                      {notifications.length === 0 ? (
                        <div className="header-dropdown-empty">
                          <Bell size={24} />
                          <div className="header-dropdown-empty-title">De momento no hay notificaciones</div>
                          <div className="header-dropdown-empty-subtitle">
                            A la espera de novedades...
                          </div>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <button
                            key={notification.id}
                            className={`notification-item ${
                              notification.read ? '' : 'unread'
                            }`}
                            onClick={() => handleNotificationClick(notification.id)}
                          >
                            <div className={`notification-dot ${notification.type}`} />
                            <div className="notification-copy">
                              <div className="notification-title-row">
                                <span className="notification-title">
                                  {notification.title}
                                </span>
                                {!notification.read && (
                                  <span className="notification-badge">Nuevo</span>
                                )}
                              </div>
                              <p className="notification-message">
                                {notification.message}
                              </p>
                              <span className="notification-time">
                                {notification.time}
                              </span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ position: 'relative' }}>
              <button
                ref={settingsBtnRef}
                className={`header-icon-btn ${settingsOpen ? 'active' : ''}`}
                title="Opciones"
                onClick={() => {
                  setSettingsOpen(!settingsOpen);
                  setNotificationsOpen(false);
                  setSearchOpen(false);
                }}
              >
                <Settings size={18} />
              </button>

              {settingsOpen && (
                <div
                  className="header-dropdown header-dropdown-settings"
                  ref={settingsRef}
                >
                  <div className="header-dropdown-top">
                    <div>
                      <div className="header-dropdown-title">
                        {user?.name ?? 'Usuario'}
                      </div>
                      <div className="header-dropdown-subtitle">
                        {user?.role === 'autoridad' ? 'Autoridad' : 'Analista'}
                      </div>
                    </div>
                  </div>
                  <button
                    className="settings-item danger"
                    onClick={() => {
                      logout();
                      setSettingsOpen(false);
                    }}
                  >
                    <LogOut size={16} />
                    Cerrar sesion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {searchOpen && (
        <div
          className="search-overlay"
          onClick={() => {
            setSearchOpen(false);
            setSearchQuery('');
          }}
        >
          <div className="search-modal" onClick={(event) => event.stopPropagation()}>
            <div className="search-modal-header">
              <Search size={20} className="search-modal-icon" />
              <input
                ref={searchInputRef}
                className="search-modal-input"
                placeholder="Buscar paginas y modulos..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              <button
                className="search-modal-close"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="search-modal-results">
              {filteredPages.length === 0 ? (
                <div className="search-modal-empty">
                  No se encontraron resultados para "{searchQuery}"
                </div>
              ) : (
                filteredPages.map((page) => {
                  const isCurrentPage = location.pathname === page.path;
                  const Icon = page.icon;
                  return (
                    <button
                      key={page.path}
                      className={`search-result-item ${
                        isCurrentPage ? 'current' : ''
                      }`}
                      onClick={() => handleSearchSelect(page.path)}
                    >
                      <div className="search-result-icon">
                        <Icon size={18} />
                      </div>
                      <div className="search-result-text">
                        <div className="search-result-label">{page.label}</div>
                        <div className="search-result-desc">{page.description}</div>
                      </div>
                      {isCurrentPage && (
                        <span className="search-result-badge">Actual</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div className="search-modal-footer">
              <span className="search-shortcut">
                <kbd>Enter</kbd> Seleccionar
              </span>
              <span className="search-shortcut">
                <kbd>Esc</kbd> Cerrar
              </span>
              <span className="search-shortcut">
                <kbd>Ctrl</kbd> + <kbd>K</kbd> Buscar
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
