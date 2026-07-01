import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Lock, Shield, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

type AuthMode = 'login' | 'register';

const roleDescriptions: Record<UserRole, string> = {
  analista: 'Acceso completo a objetivos, interacciones, análisis y generación de informes.',
  autoridad: 'Acceso al portal de consulta KLE, interacciones, solicitudes, IA y valoraciones.',
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
    return user.role === 'autoridad' ? '/authority' : '/';
  }, [user]);

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = await login(loginData.email, loginData.password);
    if (!result.ok) {
      setError(result.error);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (registerData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    const result = await register({
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
          <h1>Acceso seguro a la plataforma de seguimiento e informes.</h1>
          <p>
            Los analistas gestionan objetivos, interacciones y análisis. Las autoridades acceden
            a un portal propio para consultar KLE, revisar interacciones, solicitar informes y registrar valoraciones.
          </p>
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
              <h2 className="auth-form-title">Iniciar sesión</h2>
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
              <label className="form-label">Contraseña</label>
              <input
                className="form-input"
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Introduce tu contraseña"
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
                <label className="form-label">Contraseña</label>
                <input
                  className="form-input"
                  type="password"
                  value={registerData.password}
                  onChange={(e) =>
                    setRegisterData((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirmar contraseña</label>
                <input
                  className="form-input"
                  type="password"
                  value={registerData.confirmPassword}
                  onChange={(e) =>
                    setRegisterData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  placeholder="Repite la contraseña"
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
  );
}
