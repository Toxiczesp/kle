import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Lock, Radar, Shield, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';
import headerBrandEmad from '../assets/emad.png';
import headerBrandGobierno from '../assets/minisdef.png';

type AuthMode = 'login' | 'register';

const roleDescriptions: Record<UserRole, string> = {
  analista: 'Acceso completo a objetivos, interacciones, analisis y generacion de informes.',
  autoridad: 'Acceso limitado a consulta y lectura de informes disponibles.',
};

export default function AuthPage() {
  const { isAuthenticated, login, register, user } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [error, setError] = useState('');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'analista' as UserRole,
  });

  const redirectTo = useMemo(() => {
    if (!user) return '/';
    return user.role === 'autoridad' ? '/reports' : '/';
  }, [user]);

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = login(loginData.email, loginData.password);
    if (!result.ok) {
      setError(result.error);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (registerData.password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres.');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError('Las contrasenas no coinciden.');
      return;
    }

    const result = register({
      name: registerData.name,
      email: registerData.email,
      password: registerData.password,
      role: registerData.role,
    });

    if (!result.ok) {
      setError(result.error);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-panel auth-panel-brand">
        <div className="auth-brand-strip">
          <img
            className="auth-brand-strip-gobierno"
            src={headerBrandGobierno}
            alt="Gobierno de Espana - Ministerio de Defensa"
          />
          <img
            className="auth-brand-strip-emad"
            src={headerBrandEmad}
            alt="Estado Mayor de la Defensa - Integracion en el multidominio"
          />
        </div>

        <div className="auth-brand">
          <div className="auth-brand-badge">
            <Shield size={28} />
          </div>
          <div>
            <div className="auth-brand-title">KLE Platform</div>
            <div className="auth-brand-subtitle">Key Leader Engagement</div>
          </div>
        </div>

        <div className="auth-hero-copy">
          <span className="auth-kicker">Estado Mayor | Entorno operativo KLE</span>
          <h1>Centro de acceso para seguimiento estrategico, analisis e informes.</h1>
          <p>
            Una entrada con identidad institucional para coordinar objetivos, consolidar
            interacciones y consultar inteligencia operativa desde un unico puesto de mando.
          </p>
        </div>

        <div className="auth-briefing-panel" aria-hidden="true">
          <div className="auth-briefing-grid" />
          <div className="auth-briefing-overlay" />
          <div className="auth-briefing-header">
            <div className="auth-briefing-chip">
              <Radar size={14} />
              Vigilancia activa
            </div>
            <div className="auth-briefing-status">EMAD LIVE</div>
          </div>
          <div className="auth-briefing-rings">
            <span />
            <span />
            <span />
          </div>
          <div className="auth-briefing-card auth-briefing-card-primary">
            <div className="auth-briefing-label">Teatro de operaciones</div>
            <strong>Integracion multidominio</strong>
            <span>Supervision centralizada de actividad, perfiles e informes.</span>
          </div>
          <div className="auth-briefing-card auth-briefing-card-secondary">
            <div className="auth-briefing-label">Canales seguros</div>
            <strong>Acceso autenticado</strong>
            <span>Flujo protegido para analistas y autoridades.</span>
          </div>
        </div>

        <div className="auth-feature-row">
          <div className="auth-feature-pill">Seguimiento de objetivos</div>
          <div className="auth-feature-pill">Analisis de personalidad</div>
          <div className="auth-feature-pill">Informes clasificados</div>
        </div>

        <div className="auth-demo-box">
          <div className="auth-demo-title">Credenciales demo</div>
          <div className="auth-demo-row">
            <span>Analista</span>
            <strong>analista@kle.local / demo1234</strong>
          </div>
          <div className="auth-demo-row">
            <span>Autoridad</span>
            <strong>autoridad@kle.local / demo1234</strong>
          </div>
        </div>
      </div>

      <div className="auth-panel auth-panel-form">
        <div className="auth-form-shell">
          <div className="auth-form-intro">
            <span className="auth-form-eyebrow">Acceso controlado</span>
            <p>Portal de autenticacion con perfil institucional y operativa segura.</p>
          </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab${mode === 'login' ? ' active' : ''}`}
            onClick={() => {
              setMode('login');
              setError('');
            }}
            type="button"
          >
            <Lock size={16} /> Acceder
          </button>
          <button
            className={`auth-tab${mode === 'register' ? ' active' : ''}`}
            onClick={() => {
              setMode('register');
              setError('');
            }}
            type="button"
          >
            <UserPlus size={16} /> Registro
          </button>
        </div>

        {mode === 'login' ? (
          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <div>
              <h2 className="auth-form-title">Iniciar sesion</h2>
              <p className="auth-form-text">Introduce tus credenciales para acceder.</p>
            </div>

            <div className="form-group">
              <label className="form-label">Correo</label>
              <input
                className="form-input"
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="usuario@dominio.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contrasena</label>
              <input
                className="form-input"
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Introduce tu contrasena"
                required
              />
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button className="btn btn-primary auth-submit" type="submit">
              Acceder
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegisterSubmit}>
            <div>
              <h2 className="auth-form-title">Crear cuenta</h2>
              <p className="auth-form-text">Registra un perfil y asigna el rol operativo.</p>
            </div>

            <div className="form-group">
              <label className="form-label">Nombre completo</label>
              <input
                className="form-input"
                type="text"
                value={registerData.name}
                onChange={(e) => setRegisterData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre y apellidos"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Correo</label>
              <input
                className="form-input"
                type="email"
                value={registerData.email}
                onChange={(e) => setRegisterData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="usuario@dominio.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Rol</label>
              <select
                className="form-select"
                value={registerData.role}
                onChange={(e) =>
                  setRegisterData((prev) => ({ ...prev, role: e.target.value as UserRole }))
                }
              >
                <option value="analista">Analista</option>
                <option value="autoridad">Autoridad</option>
              </select>
              <div className="auth-role-help">{roleDescriptions[registerData.role]}</div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Contrasena</label>
                <input
                  className="form-input"
                  type="password"
                  value={registerData.password}
                  onChange={(e) =>
                    setRegisterData((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Minimo 6 caracteres"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirmar contrasena</label>
                <input
                  className="form-input"
                  type="password"
                  value={registerData.confirmPassword}
                  onChange={(e) =>
                    setRegisterData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  placeholder="Repite la contrasena"
                  required
                />
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button className="btn btn-primary auth-submit" type="submit">
              Crear cuenta
            </button>
          </form>
        )}
        </div>
      </div>
    </div>
  );
}
