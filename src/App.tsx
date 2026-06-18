import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import ObjectivesList from './pages/ObjectivesList';
import ObjectiveDetail from './pages/ObjectiveDetail';
import ObjectiveCreate from './pages/ObjectiveCreate';
import Repository from './pages/Repository';
import Interactions from './pages/Interactions';
import Analysis from './pages/Analysis';
import AIChat from './pages/AIChat';
import Reports from './pages/Reports';
import AuthPage from './pages/Auth';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ObjectivesProvider } from './context/ObjectivesContext';
import type { UserRole } from './types';

function AppShell() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Header />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function RequireAuth() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/auth" replace />;
}

function RequireRole({ allowedRoles, children }: { allowedRoles: UserRole[]; children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;

  return allowedRoles.includes(user.role) ? <>{children}</> : <Navigate to="/reports" replace />;
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();
  const defaultPrivateRoute = user?.role === 'autoridad' ? '/reports' : '/';

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route
              path="/"
              element={
                <RequireRole allowedRoles={['analista']}>
                  <Dashboard />
                </RequireRole>
              }
            />
            <Route
              path="/objectives"
              element={
                <RequireRole allowedRoles={['analista']}>
                  <ObjectivesList />
                </RequireRole>
              }
            />
            <Route
              path="/objectives/new"
              element={
                <RequireRole allowedRoles={['analista']}>
                  <ObjectiveCreate />
                </RequireRole>
              }
            />
            <Route
              path="/objectives/:id"
              element={
                <RequireRole allowedRoles={['analista']}>
                  <ObjectiveDetail />
                </RequireRole>
              }
            />
            <Route
              path="/repository"
              element={
                <RequireRole allowedRoles={['analista']}>
                  <Repository />
                </RequireRole>
              }
            />
            <Route
              path="/interactions"
              element={
                <RequireRole allowedRoles={['analista']}>
                  <Interactions />
                </RequireRole>
              }
            />
            <Route
              path="/analysis"
              element={
                <RequireRole allowedRoles={['analista']}>
                  <Analysis />
                </RequireRole>
              }
            />
            <Route
              path="/ai-chat"
              element={
                <RequireRole allowedRoles={['analista']}>
                  <AIChat />
                </RequireRole>
              }
            />
            <Route path="/reports" element={<Reports />} />
          </Route>
        </Route>
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? defaultPrivateRoute : '/auth'} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ObjectivesProvider>
        <AppRoutes />
      </ObjectivesProvider>
    </AuthProvider>
  );
}
