import { useState } from 'react'; // SIBAP_frontend casing fix
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useNavigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { logout as logoutApi } from '../../api/auth';
import {
  LayoutDashboard,
  PlusCircle,
  FolderOpen,
  Settings,
  LifeBuoy,
  LogOut,
  User,
  GraduationCap,
  FileText,
  Menu,
  X,
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.warn('Error al cerrar sesión:', error);
    } finally {
      logout();
      navigate('/login', { replace: true });
    }
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, title: 'Dashboard General', end: true },
    { path: '/dashboard/new-bank', label: 'Nuevo Banco', icon: PlusCircle, title: 'Nuevo Banco de Preguntas' },
    { path: '/dashboard/banks', label: 'Mis Bancos', icon: FolderOpen, title: 'Mis Bancos' },
    { path: '/dashboard/documents', label: 'Mis documentos', icon: FileText, title: 'Mis Documentos' },
    { path: '/dashboard/settings', label: 'Configuración', icon: Settings, title: 'Configuración' },
    { path: '/dashboard/profile', label: 'Mi perfil', icon: User, title: 'Mi perfil' },
  ];

  const getPageTitle = () => {
    if (location.pathname.includes('/dashboard/validate')) {
      return 'Validación de Reactivos';
    }
    const currentNav = navItems.find(item => {
      if (item.end) {
        return location.pathname === item.path;
      }
      return location.pathname.startsWith(item.path);
    });
    return currentNav ? currentNav.title : 'Dashboard General';
  };

  return (
    <div className="flex w-full h-screen bg-[#f4f7f6] overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-[#e2e8f0] flex flex-col py-6 px-4 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 text-xl font-bold text-[#1a5276] mb-10 px-3">
          <div className="w-8 h-8 bg-[#1a5276] rounded-md flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          SIBAP
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={closeSidebar}
                className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-all ${isActive
                  ? 'bg-[#e9f5f8] text-[#1a5276]'
                  : 'text-[#475569] hover:bg-[#f1f5f9] hover:text-[#102129]'
                  }`}
              >
                <Icon className="w-[18px] h-[18px]" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="pt-5 border-t border-[#e2e8f0] mt-auto">
          <button className="flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#102129] w-full transition-all">
            <LifeBuoy className="w-[18px] h-[18px]" />
            Soporte
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-[#e2e8f0] flex items-center justify-between px-4 sm:px-8 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-md text-[#475569] hover:bg-[#f1f5f9] transition-colors"
              aria-label="Toggle Menu"
            >
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="text-base font-semibold text-[#102129]">
              {getPageTitle()}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-semibold text-[#102129]">
                {user.name + ' ' + user.last_name}
              </div>
              <div
                className={`text-xs font-medium ${user.is_active ? 'text-green-500' : 'text-red-500'
                  }`}
              >
                Estado: {user.is_active ? 'Activo' : 'Inactivo'}
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1a5276] to-[#154360] flex items-center justify-center border-2 border-[#e2e8f0] text-white font-semibold text-sm">
              {user.name?.[0]?.toUpperCase()}{user.last_name?.[0]?.toUpperCase()}
            </div>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="p-2 rounded-md text-[#64748b] hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          </div>
        </header>

        {/* Content Scroll */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
          <Outlet />
        </div>
      </main>
      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Cerrar sesión"
        message="¿Estás seguro de que deseas cerrar sesión?"
        confirmText="Sí, cerrar sesión"
        cancelText="Cancelar"
        danger
      />
    </div>
  );
}
