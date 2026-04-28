import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen"><div className="loader" /></div>;
  }

  const canAccessAdmin = Boolean(user?.role === 'admin' || user?.isAdmin || user?.permissions?.includes?.('admin'));

  if (!user) return <Navigate to="/login" replace />;
  if (!canAccessAdmin) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
