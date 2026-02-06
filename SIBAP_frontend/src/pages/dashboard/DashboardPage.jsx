import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useNavigate } from 'react-router-dom';
import { logout as logoutApi } from '../../api/auth';
import NewBankPage from './newBank';
import ValidateQuestionsPage from './ValidateQuestionsPage';
import MyBanksPage from './MyBanksPage';

import {
  LayoutDashboard,
  PlusCircle,
  FolderOpen,
  Settings,
  LifeBuoy,
  LogOut,
  FileStack,
  ListChecks,
  Clock,
  Sparkles,
  Download,
  Edit3,
  Play,
  Trash2,
  TrendingUp,
  CheckCircle,
  GraduationCap,
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [validationData, setValidationData] = useState(null);

  const handleNavigateToValidation = (bankData) => {
    setValidationData(bankData);
    setActiveNav('validateQuestions');
  };

  const handleBackFromValidation = () => {
    setValidationData(null);
    setActiveNav('banks');
  };

  const handleOpenBankFromList = (bank) => {
    // Reconstruct bank data from saved questions
    const bankData = {
      name: bank.name,
      subject: bank.subject,
      difficulty: bank.difficulty,
      questions: bank.questions,
    };
    setValidationData(bankData);
    setActiveNav('validateQuestions');
  };

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
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, title: 'Dashboard General' },
    { id: 'newBank', label: 'Nuevo Banco', icon: PlusCircle, title: 'Nuevo Banco de Preguntas' },
    { id: 'banks', label: 'Mis Bancos', icon: FolderOpen, title: 'Mis Bancos' },
    { id: 'documents', label: 'Mis documentos', icon: FolderOpen, title: 'Mis Documentos' },
    { id: 'settings', label: 'Configuración', icon: Settings, title: 'Configuración' },
  ];

  const getPageTitle = () => {
    if (activeNav === 'validateQuestions') {
      return 'Validación de Reactivos';
    }
    const currentNav = navItems.find(item => item.id === activeNav);
    return currentNav ? currentNav.title : 'Dashboard General';
  };

  const stats = [
    {
      label: 'Bancos Generados',
      value: '12',
      icon: FileStack,
      trend: '+2 esta semana',
      trendIcon: TrendingUp,
    },
    {
      label: 'Reactivos Totales',
      value: '458',
      icon: ListChecks,
      trend: '98% validados',
      trendIcon: CheckCircle,
    },
    {
      label: 'Tiempo Ahorrado',
      value: '24h',
      icon: Clock,
      trend: 'Estimado por IA',
      trendIcon: null,
    },
  ];

  const recentActivity = [
    {
      name: 'Examen Parcial Unidad 1',
      subject: 'Historia Universal',
      date: 'Hace 2 horas',
      reactives: '25',
      status: 'completed',
      statusLabel: 'Completado',
    },
    {
      name: 'Quiz Rápido: Fotosíntesis',
      subject: 'Biología Avanzada',
      date: 'Ayer, 14:30',
      reactives: '10',
      status: 'completed',
      statusLabel: 'Completado',
    },
    {
      name: 'Borrador: Ecuaciones Lineales',
      subject: 'Matemáticas I',
      date: '10 Oct 2023',
      reactives: '--',
      status: 'draft',
      statusLabel: 'Borrador',
    },
  ];

  return (
    <div className="flex w-full h-screen bg-[#f4f7f6]">
      {/* Sidebar */}
      <aside className="w-[260px] bg-white border-r border-[#e2e8f0] flex flex-col py-6 px-4 flex-shrink-0">
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
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-all ${isActive
                  ? 'bg-[#e9f5f8] text-[#1a5276]'
                  : 'text-[#475569] hover:bg-[#f1f5f9] hover:text-[#102129]'
                  }`}
              >
                <Icon className="w-[18px] h-[18px]" />
                {item.label}
              </button>
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
        <header className="h-16 bg-white border-b border-[#e2e8f0] flex items-center justify-between px-8 flex-shrink-0">
          <div className="text-base font-semibold text-[#102129]">
            {getPageTitle()}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-semibold text-[#102129]">
                {user.name + ' ' + user.last_name}
              </div>
              <div
                className={`text-xs font-medium ${user.isActive ? 'text-red-500' : 'text-green-500'
                  }`}
              >
                Estado: {user.isActive ? 'Inactivo' : 'Activo'}
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
        <div className="flex-1 overflow-y-auto px-8 py-8">
          {activeNav === 'validateQuestions' ? (
            <ValidateQuestionsPage
              bankData={validationData}
              onBack={handleBackFromValidation}
            />
          ) : activeNav === 'newBank' ? (
            <NewBankPage onNavigateToValidation={handleNavigateToValidation} />
          ) : activeNav === 'banks' ? (
            <MyBanksPage onOpenBank={handleOpenBankFromList} />
          ) : (
            <>
              {/* Welcome Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#102129] mb-2">
                  Hola, {user.name} 👋
                </h1>
                <p className="text-[15px] text-[#64748b]">
                  Aquí tienes un resumen de tu actividad reciente y bancos de
                  preguntas.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-6 mb-10">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  const TrendIcon = stat.trendIcon;
                  return (
                    <div
                      key={index}
                      className="bg-white p-6 rounded-lg border border-[#e2e8f0] flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between text-sm font-medium text-[#64748b]">
                        <span>{stat.label}</span>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-[32px] font-bold text-[#102129]">
                        {stat.value}
                      </div>
                      <div
                        className={`text-[13px] flex items-center gap-1 ${TrendIcon ? 'text-[#27ae60]' : 'text-[#64748b]'
                          }`}
                      >
                        {TrendIcon && <TrendIcon className="w-4 h-4" />}
                        {stat.trend}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CTA Banner */}
              <div className="bg-gradient-to-br from-[#1a5276] to-[#154360] rounded-lg p-8 flex items-center justify-between mb-10 shadow-[0_4px_12px_rgba(26,82,118,0.15)]">
                <div className="text-white">
                  <h3 className="text-xl font-bold mb-2">
                    Crear un Nuevo Banco de Preguntas
                  </h3>
                  <p className="text-[15px] opacity-90">
                    Sube tus materiales (PDF, DOCX) y deja que la IA genere
                    reactivos personalizados.
                  </p>
                </div>
                <button
                  onClick={() => setActiveNav('newBank')}
                  className="bg-white text-[#1a5276] px-6 py-3 rounded-md font-semibold text-sm flex items-center gap-2 hover:-translate-y-0.5 transition-transform"
                >
                  <Sparkles className="w-[18px] h-[18px]" />
                  Comenzar ahora
                </button>
              </div>

              {/* Recent Activity */}
              <div className="mb-4 flex items-center justify-between">
                <div className="text-lg font-semibold text-[#102129]">
                  Actividad Reciente
                </div>
                <button className="text-[13px] text-[#64748b] hover:text-[#102129] px-3 py-2 rounded-md hover:bg-[#f1f5f9] transition-colors">
                  Ver todo
                </button>
              </div>

              <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#e9f5f8]">
                      <th className="text-left px-6 py-4 text-[13px] font-semibold text-[#1a5276] border-b border-[#e2e8f0]">
                        Nombre del Banco
                      </th>
                      <th className="text-left px-6 py-4 text-[13px] font-semibold text-[#1a5276] border-b border-[#e2e8f0]">
                        Materia
                      </th>
                      <th className="text-left px-6 py-4 text-[13px] font-semibold text-[#1a5276] border-b border-[#e2e8f0]">
                        Fecha de Creación
                      </th>
                      <th className="text-left px-6 py-4 text-[13px] font-semibold text-[#1a5276] border-b border-[#e2e8f0]">
                        Reactivos
                      </th>
                      <th className="text-left px-6 py-4 text-[13px] font-semibold text-[#1a5276] border-b border-[#e2e8f0]">
                        Estado
                      </th>
                      <th className="text-left px-6 py-4 text-[13px] font-semibold text-[#1a5276] border-b border-[#e2e8f0]">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 text-sm text-[#102129] border-b border-[#e2e8f0] last:border-b-0">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#102129] border-b border-[#e2e8f0] last:border-b-0">
                          {item.subject}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#102129] border-b border-[#e2e8f0] last:border-b-0">
                          {item.date}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#102129] border-b border-[#e2e8f0] last:border-b-0">
                          {item.reactives}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#102129] border-b border-[#e2e8f0] last:border-b-0">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${item.status === 'completed'
                              ? 'bg-[#dcfce7] text-[#166534]'
                              : 'bg-[#f1f5f9] text-[#475569]'
                              }`}
                          >
                            {item.statusLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#102129] border-b border-[#e2e8f0] last:border-b-0">
                          <div className="flex gap-2">
                            {item.status === 'completed' ? (
                              <>
                                <button className="w-8 h-8 border border-[#e2e8f0] bg-white rounded-md flex items-center justify-center text-[#64748b] hover:border-[#1a5276] hover:text-[#1a5276] transition-all">
                                  <Download className="w-4 h-4" />
                                </button>
                                <button className="w-8 h-8 border border-[#e2e8f0] bg-white rounded-md flex items-center justify-center text-[#64748b] hover:border-[#1a5276] hover:text-[#1a5276] transition-all">
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button className="w-8 h-8 border border-[#e2e8f0] bg-white rounded-md flex items-center justify-center text-[#64748b] hover:border-[#1a5276] hover:text-[#1a5276] transition-all">
                                  <Play className="w-4 h-4" />
                                </button>
                                <button className="w-8 h-8 border border-[#e2e8f0] bg-white rounded-md flex items-center justify-center text-[#64748b] hover:border-red-600 hover:text-red-600 transition-all">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
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
