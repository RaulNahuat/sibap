import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { login as loginApi } from '../../api/auth';
import { getErrorMessage } from '../../utils/errorHandler';
import {
  Wand2,
  FileCheck,
  Download,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  GraduationCap,
  User,
} from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await loginApi({ ...formData, remember_me: rememberMe });

      // El login del contexto ahora se encarga de hacer fetch del usuario
      await login();
      navigate('/dashboard', { replace: true });

    } catch (err) {
      // Usa el manejador centralizado que prioriza mensajes del backend
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

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
              <User className="w-6 h-6 text-[#1a5276]" />
            </div>
            <h2 className="text-2xl font-bold text-[#1a5276]">
              Bienvenido de nuevo
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Ingresa tus credenciales para acceder al sistema.
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
              <label className="block text-sm font-medium mb-2">Correo</label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  required
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#e9f5f8] focus:border-[#1a5276]"
                  placeholder="correo@dominio.com"
                />
                <Mail className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  onChange={handleChange}
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
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center text-sm text-gray-500">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#1a5276] focus:ring-[#1a5276]"
                />
                <span className="text-gray-600">Recuérdame</span>
              </label>
              <a href="#" className="text-[#1a5276] hover:underline">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a5276] text-white py-3 rounded-md font-semibold flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50"
            >
              {loading ? 'Iniciando…' : 'Iniciar Sesión'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center my-6 text-gray-400 text-xs">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="px-3">O</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <p className="text-center text-sm text-gray-500">
            ¿Aún no tienes cuenta?{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-[#1a5276] font-medium"
            >
              Regístrate
            </button>
          </p>
        </div>
      </section>
      {/* LEFT PANEL (DESKTOP) */}
      <section className="hidden lg:flex w-[58%] bg-gradient-to-br from-[#1a5276] to-[#154360] px-16 py-16 text-white relative overflow-hidden">
        <div className="absolute w-[600px] h-[600px] bg-white/5 rounded-full -top-24 -right-24" />
        <div className="absolute w-[300px] h-[300px] bg-white/5 rounded-full bottom-16 -left-16" />

        <div className="relative z-10 flex flex-col justify-between w-full">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3 text-2xl font-bold">
              <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center backdrop-blur">
                <GraduationCap className="w-6 h-6" />
              </div>
              SIBAP
            </div>

            {/* Hero */}
            <div className="mt-24 max-w-[520px]">
              <h1 className="text-[40px] leading-tight font-bold mb-6">
                Transforma tus materiales en evaluaciones inteligentes
              </h1>
              <p className="text-base leading-relaxed text-white/90">
                Automatiza la creación de bancos de preguntas validados
                pedagógicamente. Exporta a Moodle y formatos estándar en
                segundos.
              </p>

              <ul className="mt-12 space-y-5">
                <li className="flex gap-4">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <Wand2 className="w-4 h-4" />
                  </div>
                  Generación asistida por IA contextual
                </li>
                <li className="flex gap-4">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  Validación de reactivos en tiempo real
                </li>
                <li className="flex gap-4">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <Download className="w-4 h-4" />
                  </div>
                  Formatos compatibles (XML, GIFT)
                </li>
              </ul>
            </div>
          </div>

          <p className="text-xs text-white/70">
            © 2026 SIBAP. Plataforma exclusiva para personal docente.
          </p>
        </div>
      </section>
    </div>
  );
}
