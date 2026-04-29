import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar.jsx';
import Topbar from '../components/Topbar.jsx';
import SiteFooter from '../components/SiteFooter.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import './AppLayout.css';

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const hideFooter =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/agent');

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/', { replace: true });
  };

  return (
    <div className="app-layout">
      <Sidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onLogout={handleLogout}
      />

      <div className="app-main">
        <Topbar onMenuClick={() => setMenuOpen(true)} />

        <main className="main-content">
          <Outlet />
          {!hideFooter && <SiteFooter />}
        </main>
      </div>
    </div>
  );
}