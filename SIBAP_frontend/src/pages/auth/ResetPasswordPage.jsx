import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyResetToken, completePasswordReset } from '../../api/auth';
import { getErrorMessage } from '../../utils/errorHandler';
import {
    Eye,
    EyeOff,
    ArrowRight,
    GraduationCap,
    KeyRound,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [success, setSuccess] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    // Verificar token al cargar
    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setError('No se proporcionó un token de recuperación');
                setVerifying(false);
                return;
            }

            try {
                const response = await verifyResetToken(token);
                setTokenValid(true);
                setUserEmail(response.email);
            } catch (err) {
                setError(getErrorMessage(err));
                setTokenValid(false);
            } finally {
                setVerifying(false);
            }
        };

        verifyToken();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validar que las contraseñas coincidan
        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);

        try {
            await completePasswordReset(token, newPassword);
            setSuccess(true);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    // Estado de verificación
    if (verifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#1a5276] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Verificando enlace...</p>
                </div>
            </div>
        );
    }

    // Token inválido o expirado
    if (!tokenValid) {
        return (
            <div className="min-h-screen flex bg-white font-sans">
                <section className="w-full lg:w-[42%] flex items-center justify-center px-6 sm:px-8">
                    <div className="w-full max-w-[420px] text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>

                        <h2 className="text-2xl font-bold text-[#1a5276] mb-3">
                            Enlace Inválido o Expirado
                        </h2>

                        <p className="text-gray-600 mb-6">
                            {error || 'El enlace de recuperación no es válido o ha expirado.'}
                        </p>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
                            <p className="text-sm text-yellow-900">
                                <strong>⏱️ Los enlaces expiran en 15 minutos</strong>
                            </p>
                            <p className="text-sm text-yellow-800 mt-2">
                                Solicita un nuevo enlace de recuperación desde la página de
                                inicio de sesión.
                            </p>
                        </div>

                        <button
                            onClick={() => navigate('/forgot-password')}
                            className="w-full bg-[#1a5276] text-white py-3 rounded-md font-semibold hover:opacity-95"
                        >
                            Solicitar nuevo enlace
                        </button>

                        <button
                            onClick={() => navigate('/login')}
                            className="w-full text-[#1a5276] py-3 rounded-md font-medium hover:bg-gray-50 mt-3"
                        >
                            Volver al inicio de sesión
                        </button>
                    </div>
                </section>

                <section className="hidden lg:flex w-[58%] bg-gradient-to-br from-[#1a5276] to-[#154360] px-16 py-16 text-white relative overflow-hidden">
                    <div className="absolute w-[600px] h-[600px] bg-white/5 rounded-full -top-24 -right-24" />
                    <div className="absolute w-[300px] h-[300px] bg-white/5 rounded-full bottom-16 -left-16" />
                </section>
            </div>
        );
    }

    // Éxito
    if (success) {
        return (
            <div className="min-h-screen flex bg-white font-sans">
                <section className="w-full lg:w-[42%] flex items-center justify-center px-6 sm:px-8">
                    <div className="w-full max-w-[420px] text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>

                        <h2 className="text-2xl font-bold text-[#1a5276] mb-3">
                            ¡Contraseña Actualizada!
                        </h2>

                        <p className="text-gray-600 mb-6">
                            Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar
                            sesión con tu nueva contraseña.
                        </p>

                        <button
                            onClick={() => navigate('/login')}
                            className="w-full bg-[#1a5276] text-white py-3 rounded-md font-semibold flex items-center justify-center gap-2 hover:opacity-95"
                        >
                            Ir al inicio de sesión
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </section>

                <section className="hidden lg:flex w-[58%] bg-gradient-to-br from-[#1a5276] to-[#154360] px-16 py-16 text-white relative overflow-hidden">
                    <div className="absolute w-[600px] h-[600px] bg-white/5 rounded-full -top-24 -right-24" />
                    <div className="absolute w-[300px] h-[300px] bg-white/5 rounded-full bottom-16 -left-16" />

                    <div className="relative z-10 flex flex-col justify-center items-center w-full text-center">
                        <div className="w-20 h-20 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur mb-6">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>

                        <h1 className="text-4xl font-bold mb-4">¡Todo listo!</h1>
                        <p className="text-white/90 text-lg max-w-md">
                            Tu cuenta está segura nuevamente. Inicia sesión para continuar
                            trabajando.
                        </p>
                    </div>
                </section>
            </div>
        );
    }

    // Formulario de nueva contraseña
    return (
        <div className="min-h-screen flex bg-white font-sans">
            {/* MOBILE HEADER */}
            <header className="lg:hidden fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/70">
                <div className="flex items-center gap-3 h-14 px-5">
                    <div className="w-9 h-9 bg-[#1a5276] rounded-xl flex items-center justify-center shadow-sm">
                        <GraduationCap className="w-5 h-5 text-white" />
                    </div>

                    <div className="flex flex-col leading-tight">
                        <span className="text-base font-semibold text-[#1a5276]">
                            SIBAP
                        </span>
                        <span className="text-[11px] text-gray-500">
                            Transforma tus materiales en evaluaciones inteligentes
                        </span>
                    </div>
                </div>
            </header>

            {/* RIGHT PANEL */}
            <section className="w-full lg:w-[42%] flex items-center justify-center px-6 sm:px-8 pt-24 pb-8 lg:pt-0 lg:pb-0">
                <div className="w-full max-w-[420px]">
                    {/* FORM HEADER */}
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 bg-[#e9f5f8] rounded-xl flex items-center justify-center mx-auto mb-4">
                            <KeyRound className="w-6 h-6 text-[#1a5276]" />
                        </div>
                        <h2 className="text-2xl font-bold text-[#1a5276]">
                            Nueva Contraseña
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Crea una contraseña segura para {userEmail}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Nueva Contraseña */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Nueva Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#e9f5f8] focus:border-[#1a5276]"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Mínimo 8 caracteres, incluye mayúsculas, minúsculas, números y
                                caracteres especiales
                            </p>
                        </div>

                        {/* Confirmar Contraseña */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Confirmar Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#e9f5f8] focus:border-[#1a5276]"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#1a5276] text-white py-3 rounded-md font-semibold flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50"
                        >
                            {loading ? 'Actualizando…' : 'Actualizar contraseña'}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </section>

            {/* LEFT PANEL (DESKTOP) */}
            <section className="hidden lg:flex w-[58%] bg-gradient-to-br from-[#1a5276] to-[#154360] px-16 py-16 text-white relative overflow-hidden">
                <div className="absolute w-[600px] h-[600px] bg-white/5 rounded-full -top-24 -right-24" />
                <div className="absolute w-[300px] h-[300px] bg-white/5 rounded-full bottom-16 -left-16" />

                <div className="relative z-10 flex flex-col justify-center items-center w-full text-center">
                    <div className="w-20 h-20 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur mb-6">
                        <KeyRound className="w-10 h-10" />
                    </div>

                    <h1 className="text-4xl font-bold mb-4">Casi listo</h1>
                    <p className="text-white/90 text-lg max-w-md">
                        Crea una contraseña segura para proteger tu cuenta y todos tus
                        bancos de preguntas.
                    </p>
                </div>
            </section>
        </div>
    );
}
