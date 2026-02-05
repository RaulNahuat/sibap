import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { register as registerApi } from '../../api/auth';
import {
  GraduationCap,
  User,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...payload } = formData;
      const response = await registerApi(payload);
      login(response);
      window.location.href = '/dashboard';
    } catch {
      setError('Error al crear la cuenta');
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
        Plataforma docente
      </span>
    </div>
  </div>
</header>


      {/* LEFT PANEL */}
      <section className="hidden lg:flex w-[58%] bg-gradient-to-br from-[#1a5276] to-[#154360] px-16 py-16 text-white relative overflow-hidden">
        {/* Decorative circles */}
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
            <div className="mt-20 max-w-[520px]">
              <h1 className="text-[40px] leading-tight font-bold mb-6">
                Únete a la plataforma de evaluación académica
              </h1>
              <p className="text-base leading-relaxed text-white/90">
                Solicita acceso para comenzar a crear bancos de preguntas
                profesionales con asistencia de IA y validación pedagógica.
              </p>

              <ul className="mt-12 space-y-5">
                <li className="flex gap-4">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    ✓
                  </div>
                  Registro rápido y seguro
                </li>
                <li className="flex gap-4">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    ✓
                  </div>
                  Acceso exclusivo para personal docente
                </li>
                <li className="flex gap-4">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    ✓
                  </div>
                  Soporte y acompañamiento académico
                </li>
              </ul>
            </div>
          </div>

          <p className="text-xs text-white/70">
            © 2026 SIBAP. Plataforma exclusiva para personal docente.
          </p>
        </div>
      </section>

      {/* RIGHT PANEL */}
      <section className="w-full lg:w-[42%] flex items-center justify-center px-8">
        <div className="w-full max-w-[420px]">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-[#e9f5f8] rounded-xl flex items-center justify-center mx-auto mb-4">
              <User className="w-6 h-6 text-[#1a5276]" />
            </div>
            <h2 className="text-2xl font-bold text-[#1a5276]">
              Crear cuenta
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Completa el formulario para solicitar acceso al sistema.
            </p>
          </div>

          {error && (
            <div className="mb-5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#e9f5f8] focus:border-[#1a5276]"
                  placeholder="Juan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Apellido
                </label>
                <input
                  type="text"
                  name="last_name"
                  required
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#e9f5f8] focus:border-[#1a5276]"
                  placeholder="Pérez"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Correo institucional
              </label>
              <input
                type="email"
                name="email"
                required
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#e9f5f8] focus:border-[#1a5276]"
                placeholder="docente@universidad.edu.mx"
              />
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

            {/* Confirm */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Confirmar contraseña
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#e9f5f8] focus:border-[#1a5276]"
                placeholder="••••••••"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a5276] text-white py-3 rounded-md font-semibold flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 mt-6"
            >
              {loading ? 'Creando cuenta…' : 'Crear cuenta'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿Ya tienes cuenta?{' '}
            <a href="/login" className="text-[#1a5276] font-medium">
              Inicia sesión
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
