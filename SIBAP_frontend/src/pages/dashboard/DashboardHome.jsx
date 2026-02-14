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

export default function DashboardHome() {
    const { user } = useAuth();
    const navigate = useNavigate();

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
            label: 'Bancos por validar',
            value: '2',
            icon: Clock,
            trend: 'Pendientes',
            trendIcon: null,
        },
    ];

    const recentActivity = [
        {
            name: 'Examen Parcial Unidad 1',
            subject: 'Matematicas discretas',
            date: 'Hace 2 horas',
            reactives: '25',
            status: 'completed',
            statusLabel: 'Completado',
        },
        {
            name: 'Examen final',
            subject: 'Administración de proyectos 1',
            date: 'Ayer, 14:30',
            reactives: '10',
            status: 'completed',
            statusLabel: 'Completado',
        },
        {
            name: 'Borrador: Examen POO U1',
            subject: 'Programación Orientada a Objetos',
            date: '10 Oct 2023',
            reactives: '--',
            status: 'draft',
            statusLabel: 'Borrador',
        },
    ];

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
                    onClick={() => navigate('/dashboard/new-bank')}
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
    );
}
