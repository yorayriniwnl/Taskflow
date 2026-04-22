import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

const Layout = lazy(() => import('./components/Layout'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));

const RouteLoader = () => <div className="loading"><div className="spinner" /> Loading...</div>;
const withSuspense = (element) => <Suspense fallback={<RouteLoader />}>{element}</Suspense>;

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) return <RouteLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <RouteLoader />;
  if (user) return <Navigate to="/dashboard" replace />;

  return children;
};

const CatchAllRoute = () => {
  const { user } = useAuth();
  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute>{withSuspense(<LoginPage />)}</PublicRoute>} />
          <Route path="/register" element={<PublicRoute>{withSuspense(<RegisterPage />)}</PublicRoute>} />

          <Route path="/" element={<ProtectedRoute>{withSuspense(<Layout />)}</ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={withSuspense(<DashboardPage />)} />
            <Route path="tasks" element={withSuspense(<TasksPage />)} />
            <Route path="profile" element={withSuspense(<ProfilePage />)} />
            <Route path="admin" element={<ProtectedRoute adminOnly>{withSuspense(<AdminPage />)}</ProtectedRoute>} />
          </Route>

          <Route path="*" element={<CatchAllRoute />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
