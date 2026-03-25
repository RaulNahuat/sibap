import { useState, useEffect } from 'react'; // SIBAP_frontend casing fix
import {
    FileStack,
    ListChecks,
    Clock,
    TrendingUp,
    CheckCircle,
    Sparkles,
    Download,
    Edit3,
    Play,
    Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../../api/dashboard';

export default function DashboardHome() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const dashData = await getDashboardStats();
                setDashboardData(dashData);
            } catch (error) {
                console.error("Fallo al cargar estadísticas", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const stats = [
        {
            label: 'Bancos Generados',
            value: dashboardData?.total_banks || '0',
            icon: FileStack,
            trend: 'Total',
            trendIcon: TrendingUp,
        },
        {
            label: 'Reactivos Totales',
            value: dashboardData?.total_reactivos || '0',
            icon: ListChecks,
            trend: `${Math.round(dashboardData?.validated_percentage || 0)}% validados`,
            trendIcon: CheckCircle,
        },
        {
            label: 'Bancos por validar',
            value: dashboardData?.pending_banks || '0',
            icon: Clock,
            trend: 'Pendientes',
            trendIcon: null,
        },
    ];

    const recentActivity = dashboardData?.recent_activity || [];

    return (
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    const TrendIcon = stat.trendIcon;
                    return (
                        <div
                            key={index}
                            className="bg-white p-6 rounded-lg border border-[#e2e8f0] flex flex-col gap-3 shadow-sm"
                        >
                            <div className="flex items-center justify-between text-sm font-medium text-[#64748b]">
                                <span>{stat.label}</span>
                                <Icon className="w-5 h-5 text-[#1a5276]" />
                            </div>
                            {loading ? (
                                <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
                            ) : (
                                <div className="text-[32px] font-bold text-[#102129]">
                                    {stat.value}
                                </div>
                            )}
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
            <div className="bg-gradient-to-br from-[#1a5276] to-[#154360] rounded-lg p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8 sm:mb-10 shadow-[0_4px_12px_rgba(26,82,118,0.15)]">
                <div className="text-white">
                    <h3 className="text-lg sm:text-xl font-bold mb-2">
                        Crear un Nuevo Banco de Preguntas
                    </h3>
                    <p className="text-sm sm:text-[15px] opacity-90">
                        Sube tus materiales (PDF, DOCX) y deja que la IA genere
                        reactivos personalizados.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/dashboard/new-bank')}
                    className="w-full sm:w-auto bg-white text-[#1a5276] px-6 py-3 rounded-md font-semibold text-sm flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-transform"
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
                <button
                    onClick={() => navigate('/dashboard/banks')}
                    className="text-[13px] text-[#64748b] hover:text-[#102129] px-3 py-2 rounded-md hover:bg-[#f1f5f9] transition-colors"
                >
                    Ver todo
                </button>
            </div>

            <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden shadow-sm overflow-x-auto custom-scrollbar">
                <table className="w-full border-collapse min-w-[600px]">
                    <thead>
                        <tr className="bg-[#f8fafc]">
                            <th className="text-left px-6 py-4 text-[13px] font-semibold text-[#64748b] border-b border-[#e2e8f0]">
                                NOMBRE DEL BANCO
                            </th>
                            <th className="text-left px-6 py-4 text-[13px] font-semibold text-[#64748b] border-b border-[#e2e8f0]">
                                MATERIA
                            </th>
                            <th className="text-left px-6 py-4 text-[13px] font-semibold text-[#64748b] border-b border-[#e2e8f0]">
                                FECHA
                            </th>
                            <th className="text-center px-6 py-4 text-[13px] font-semibold text-[#64748b] border-b border-[#e2e8f0]">
                                REACTIVOS
                            </th>
                            <th className="text-center px-6 py-4 text-[13px] font-semibold text-[#64748b] border-b border-[#e2e8f0]">
                                ESTADO
                            </th>
                            <th className="text-right px-6 py-4 text-[13px] font-semibold text-[#64748b] border-b border-[#e2e8f0]">
                                ACCIONES
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                    Cargando actividad reciente...
                                </td>
                            </tr>
                        ) : recentActivity.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                    No tienes bancos de preguntas recientes.
                                </td>
                            </tr>
                        ) : (
                            recentActivity.map((item, index) => (
                                <tr key={index} className="hover:bg-[#f8fafc] transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-[#102129] border-b border-[#e2e8f0] last:border-b-0">
                                        {item.name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[#475569] border-b border-[#e2e8f0] last:border-b-0">
                                        {item.subject}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[#475569] border-b border-[#e2e8f0] last:border-b-0">
                                        {new Date(item.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-center text-[#475569] border-b border-[#e2e8f0] last:border-b-0">
                                        {item.reactives_count}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-center border-b border-[#e2e8f0] last:border-b-0">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${item.status === 'completed'
                                                ? 'bg-green-100 text-green-700'
                                                : item.status === 'pending'
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            {item.status === 'completed' ? 'Validado' : item.status === 'pending' ? 'Pendiente' : 'Borrador'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm border-b border-[#e2e8f0] last:border-b-0">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => navigate('/dashboard/validate', { state: { configId: item.id, name: item.name, subject: item.subject } })}
                                                className="p-2 border border-[#e2e8f0] hover:bg-white hover:border-[#1a5276] text-[#64748b] hover:text-[#1a5276] rounded-md transition-all"
                                                title="Ver Banco"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}
