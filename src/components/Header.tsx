import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  BrainCircuit,
  ClipboardCheck,
  ClipboardList,
  FileBarChart,
  FilePlus2,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Search,
  Settings,
  Target,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import headerBrandEmad from '../assets/emad.png';
import headerBrandGobierno from '../assets/minisdef.png';

const analystPageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/objectives': 'Autoridades Objetivo',
  '/repository': 'Repositorio',
  '/interactions': 'Interacciones',
  '/analysis': 'Info Autoridad Objetivo',
  '/analyst/requests': 'Solicitudes de Autoridad',
  '/ai-chat': 'Preguntas IA',
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
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, description: 'Panel principal del analista' },
  { path: '/objectives', label: 'Autoridades Objetivo', icon: Target, description: 'Gestión de autoridades objetivo KLE' },
  { path: '/repository', label: 'Repositorio', icon: FolderOpen, description: 'Documentos y archivos' },
  { path: '/interactions', label: 'Interacciones', icon: ClipboardList, description: 'Historial de interacciones' },
  { path: '/analysis', label: 'Info Autoridad Objetivo', icon: BrainCircuit, description: 'Perfilado de personalidad y contexto operativo' },
  { path: '/analyst/requests', label: 'Solicitudes de Autoridad', icon: FilePlus2, description: 'Encargos recibidos desde la cuenta autoridad' },
  { path: '/ai-chat', label: 'Preguntas IA', icon: MessageSquareText, description: 'Asistente inteligente' },
  { path: '/reports', label: 'Informes', icon: FileBarChart, description: 'Generar y consultar informes' },
];

const authoritySearchablePages = [
  { path: '/authority', label: 'Dashboard Autoridad', icon: LayoutDashboard, description: 'Panel principal de consulta y coordinación' },
  { path: '/authority/kle', label: 'Buscador KLE', icon: Users, description: 'Dosieres, documentos y fichas por autoridad' },
  { path: '/authority/interactions', label: 'Interacciones', icon: ClipboardList, description: 'Consultas por fechas, país, lugar y organismo' },
  { path: '/authority/evaluations', label: 'Valoraciones', icon: ClipboardCheck, description: 'Valoración del dosier KLE y de cada interacción' },
  { path: '/authority/requests', label: 'Solicitud de Informes', icon: FilePlus2, description: 'Encargos y seguimiento al equipo de análisis' },
  { path: '/authority/ai', label: 'Asistente IA', icon: BrainCircuit, description: 'Asistente conversacional sobre información operativa' },
];

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
    title: 'Autoridad objetivo actualizada',
    message: 'La prioridad de Ibrahim Diouf ha sido elevada a "Alta".',
    time: 'Hace 2 h',
    read: false,
    type: 'warning',
  },
  {
    id: 'n3',
    title: 'Informe generado',
    message: 'El informe consolidado de la Dra. Benkhouya está disponible para revisión.',
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
  const pageTitles = isAnalyst ? analystPageTitles : authorityPageTitles;
  const searchablePages = isAnalyst ? analystSearchablePages : authoritySearchablePages;

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const notifBtnRef = useRef<HTMLButtonElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const settingsBtnRef = useRef<HTMLButtonElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getTitle = () => {
    const sortedTitles = Object.entries(pageTitles).sort(([pathA], [pathB]) => pathB.length - pathA.length);
    for (const [path, title] of sortedTitles) {
      if (location.pathname === path || (path !== '/' && location.pathname.startsWith(path))) {
        return title;
      }
    }
    return 'KLE Platform';
  };

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

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

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

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotificationsOpen(false);
        setSettingsOpen(false);
        setSearchQuery('');
      }
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

  useEffect(() => {
    if (searchOpen) {
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
                alt="Gobierno de España - Ministerio de Defensa"
              />
            </a>
            <img
              className="header-brand-emad-image"
              src={headerBrandEmad}
              alt="Estado Mayor de la Defensa - Integración en el multidominio"
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
                      <div className="header-dropdown-top">
                        <div>
                          <div className="header-dropdown-title">Notificaciones</div>
                          <div className="header-dropdown-subtitle">{unreadCount} sin leer</div>
                        </div>
                        <button className="header-text-btn" onClick={markAllAsRead}>
                          Marcar todas
                        </button>
                      </div>
                      <div className="header-dropdown-list">
                        {notifications.map((notification) => (
                          <button
                            key={notification.id}
                            className={`notification-item ${notification.read ? '' : 'unread'}`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <div className={`notification-dot ${notification.type}`} />
                            <div className="notification-copy">
                              <div className="notification-title-row">
                                <span className="notification-title">{notification.title}</span>
                                {!notification.read && <span className="notification-badge">Nuevo</span>}
                              </div>
                              <p className="notification-message">{notification.message}</p>
                              <span className="notification-time">{notification.time}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {!isAnalyst && (
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
                <div className="header-dropdown header-dropdown-settings" ref={settingsRef}>
                  <div className="header-dropdown-top">
                    <div>
                      <div className="header-dropdown-title">{user?.name ?? 'Usuario'}</div>
                      <div className="header-dropdown-subtitle">{user?.role === 'autoridad' ? 'Autoridad' : 'Analista'}</div>
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
        <div className="search-overlay" onClick={() => { setSearchOpen(false); setSearchQuery(''); }}>
          <div className="search-modal" onClick={(e) => e.stopPropagation()}>
            <div className="search-modal-header">
              <Search size={20} className="search-modal-icon" />
              <input
                ref={searchInputRef}
                className="search-modal-input"
                placeholder="Buscar paginas y modulos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                  const isCurrentPage = location.pathname === page.path;
                  const Icon = page.icon;
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
              <span className="search-shortcut"><kbd>Ctrl</kbd> + <kbd>K</kbd> Buscar</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
