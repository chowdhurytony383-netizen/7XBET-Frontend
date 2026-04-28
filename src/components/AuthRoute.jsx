import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthRoute() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div className="loading-screen"><div className="loader" /></div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
