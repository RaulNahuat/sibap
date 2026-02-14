import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestPasswordReset } from '../../api/auth';
import { getErrorMessage } from '../../utils/errorHandler';
import {
    Mail,
    ArrowRight,
    GraduationCap,
    KeyRound,
    ArrowLeft,
    CheckCircle2,
} from 'lucide-react';

export default function ForgotPasswordPage() {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await requestPasswordReset(email);
            setSuccess(true);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    if (success) {
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

                {/* SUCCESS MESSAGE */}
                <section className="w-full lg:w-[42%] flex items-center justify-center px-6 sm:px-8 pt-24 pb-8 lg:pt-0 lg:pb-0">
                    <div className="w-full max-w-[420px] text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>

                        <h2 className="text-2xl font-bold text-[#1a5276] mb-3">
                            Correo Enviado
                        </h2>

                        <p className="text-gray-600 mb-6">
                            Si el correo <strong>{email}</strong> está registrado en nuestro
                            sistema, recibirás un enlace para restablecer tu contraseña.
                        </p>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                            <p className="text-sm text-blue-900">
                                <strong>📧 Revisa tu bandeja de entrada</strong>
                            </p>
                            <p className="text-sm text-blue-800 mt-2">
                                El enlace expirará en 15 minutos. Si no ves el correo, revisa tu
                                carpeta de spam.
                            </p>
                        </div>

                        <button
                            onClick={() => navigate('/login')}
                            className="w-full bg-[#1a5276] text-white py-3 rounded-md font-semibold flex items-center justify-center gap-2 hover:opacity-95"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Volver al inicio de sesión
                        </button>
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

                        <h1 className="text-4xl font-bold mb-4">Recupera tu acceso</h1>
                        <p className="text-white/90 text-lg max-w-md">
                            Te enviaremos un enlace seguro para que puedas crear una nueva
                            contraseña y volver a acceder a tu cuenta.
                        </p>
                    </div>
                </section>
            </div>
        );
    }

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
                            ¿Olvidaste tu contraseña?
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Ingresa tu correo y te enviaremos un enlace para recuperarla.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Correo Electrónico
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#e9f5f8] focus:border-[#1a5276]"
                                    placeholder="correo@dominio.com"
                                />
                                <Mail className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#1a5276] text-white py-3 rounded-md font-semibold flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50"
                        >
                            {loading ? 'Enviando…' : 'Enviar enlace de recuperación'}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                    <div className="flex items-center my-6 text-gray-400 text-xs">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="px-3">O</span>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    <button
                        onClick={() => navigate('/login')}
                        className="w-full text-[#1a5276] py-3 rounded-md font-medium flex items-center justify-center gap-2 hover:bg-gray-50"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver al inicio de sesión
                    </button>
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

                    <h1 className="text-4xl font-bold mb-4">Recupera tu acceso</h1>
                    <p className="text-white/90 text-lg max-w-md">
                        Te enviaremos un enlace seguro para que puedas crear una nueva
                        contraseña y volver a acceder a tu cuenta.
                    </p>
                </div>
            </section>
        </div>
    );
}
