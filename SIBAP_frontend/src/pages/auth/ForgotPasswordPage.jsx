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
  ShieldCheck,
  Clock,
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

  return (
    <>
      <style>{`
        @keyframes orb1 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(24px,-32px) scale(1.08); }
        }
        @keyframes orb2 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(-20px,24px) scale(1.05); }
        }
        @keyframes orb3 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%      { transform: translate(14px,18px) scale(1.1); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-6px); }
          40%      { transform: translateX(6px); }
          60%      { transform: translateX(-4px); }
          80%      { transform: translateX(4px); }
        }

        .orb-1 { animation: orb1 10s ease-in-out infinite; }
        .orb-2 { animation: orb2 13s ease-in-out infinite; }
        .orb-3 { animation: orb3 8s ease-in-out infinite 1.2s; }

        .field-input {
          width: 100%; border: 1.5px solid #dde3ec; border-radius: 12px;
          padding: 11px 42px 11px 14px; font-size: 14px; color: #102129;
          background: #fff; outline: none; transition: all 0.18s ease;
        }
        .field-input:focus {
          border-color: #1a5276; box-shadow: 0 0 0 3px rgba(26,82,118,0.10); background: #fafcff;
        }
        .field-icon {
          position: absolute; right: 13px; top: 50%; transform: translateY(-50%);
          color: #b8c4cc; transition: color 0.18s ease;
        }
        .field-wrap:focus-within .field-icon { color: #1a5276; }

        .btn-submit {
          width: 100%; background: #1a5276; color: #fff; border-radius: 12px;
          padding: 13px 20px; font-size: 15px; font-weight: 600; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 4px 16px rgba(26,82,118,0.32); transition: all 0.18s ease;
        }
        .btn-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(26,82,118,0.38); }
        .btn-submit:disabled { opacity: 0.58; cursor: not-allowed; }

        .btn-ghost {
          width: 100%; background: none; color: #1a5276; border: 1.5px solid #dde3ec;
          border-radius: 12px; padding: 12px 20px; font-size: 14px; font-weight: 600;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          gap: 8px; transition: all 0.15s ease;
        }
        .btn-ghost:hover { background: #f0f7fb; border-color: #b8c8d8; }

        .spinner {
          width: 17px; height: 17px; border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite;
        }

        .feature-icon { transition: all 0.2s ease; }
        .feature-li:hover .feature-icon { background-color: rgba(255,255,255,0.28); transform: scale(1.1); }
      `}</style>

      <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <header className="lg:hidden fixed top-0 inset-x-0 z-50 bg-white/85 backdrop-blur-md border-b border-gray-200/60">
          <div className="flex items-center gap-3 h-14 px-5">
            <div className="w-9 h-9 bg-[#1a5276] rounded-xl flex items-center justify-center shadow-sm">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-semibold text-[#1a5276]">SIBAP</span>
              <span className="text-[11px] text-gray-400">Transforma tus materiales en evaluaciones inteligentes</span>
            </div>
          </div>
        </header>

        <section
          className="w-full lg:w-[42%] flex items-center justify-center px-6 sm:px-10 pt-24 pb-10 lg:pt-0 lg:pb-0"
          style={{ background: 'linear-gradient(160deg, #f4f7fa 0%, #eef2f7 100%)' }}
        >
          <div
            className="w-full max-w-[400px]"
            style={{
              background: '#fff', borderRadius: 20, padding: '36px 32px 32px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06), 0 20px 48px -8px rgba(26,82,118,0.12)',
              border: '1px solid rgba(26,82,118,0.07)',
            }}
          >
            {success ? (
              <div>
                <div style={{
                  width: 60, height: 60, background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                  borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px', boxShadow: '0 2px 12px rgba(22,163,74,0.18)',
                }}>
                  <CheckCircle2 style={{ width: 28, height: 28, color: '#16a34a' }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a5276', margin: '0 0 8px' }}>Correo enviado</h2>
                  <p style={{ fontSize: 13.5, color: '#7a8b9a', lineHeight: 1.5, marginBottom: 20 }}>Si el correo está registrado, recibirás un enlace de recuperación.</p>
                  <button onClick={() => navigate('/login')} className="btn-ghost">
                    <ArrowLeft style={{ width: 16, height: 16 }} />
                    Volver al inicio
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div style={{
                    width: 52, height: 52, background: 'linear-gradient(135deg, #e9f5f8 0%, #d4ecf4 100%)',
                    borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 14px', boxShadow: '0 2px 8px rgba(26,82,118,0.12)',
                  }}>
                    <KeyRound style={{ width: 22, height: 22, color: '#1a5276' }} />
                  </div>
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a5276', margin: 0 }}>¿Olvidaste tu contraseña?</h2>
                  <p style={{ fontSize: 13.5, color: '#7a8b9a', marginTop: 6 }}>Ingresa tu correo para enviarte un enlace.</p>
                </div>

                {error && (
                  <div style={{
                    marginBottom: 18, padding: '10px 12px', fontSize: 13, color: '#b91c1c',
                    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
                    display: 'flex', gap: 8, animation: 'shake 0.4s ease',
                  }}>
                    <svg style={{ width: 15, height: 15, flexShrink: 0, marginTop: 2 }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-9V7a1 1 0 10-2 0v2H7a1 1 0 000 2h2v2a1 1 0 102 0v-2h2a1 1 0 000-2h-2z" clipRule="evenodd"/>
                    </svg>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 7 }}>Correo electrónico</label>
                    <div className="field-wrap" style={{ position: 'relative' }}>
                      <input
                        type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        required className="field-input" placeholder="correo@dominio.com"
                      />
                      <Mail style={{ width: 15, height: 15 }} className="field-icon" />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="btn-submit" style={{ marginTop: 4 }}>
                    {loading ? <><span className="spinner" /><span>Enviando...</span></> : <>Enviar enlace<ArrowRight style={{ width: 16, height: 16 }} /></>}
                  </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
                  <div style={{ flex: 1, height: 1, background: '#edf0f4' }} />
                  <span style={{ fontSize: 11, color: '#b8c4cc', fontWeight: 500 }}>O</span>
                  <div style={{ flex: 1, height: 1, background: '#edf0f4' }} />
                </div>

                <button onClick={() => navigate('/login')} className="btn-ghost">
                  <ArrowLeft style={{ width: 15, height: 15 }} />
                  Volver al inicio de sesión
                </button>
              </>
            )}
          </div>
        </section>

        <section
          className="hidden lg:flex w-[58%] px-16 py-16 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(145deg, #1a5276 0%, #154360 60%, #0d2d42 100%)' }}
        >
          <div className="orb-1 pointer-events-none" style={{ position: 'absolute', width: 620, height: 620, background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)', borderRadius: '50%', top: -120, right: -100 }} />
          <div className="orb-2 pointer-events-none" style={{ position: 'absolute', width: 320, height: 320, background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)', borderRadius: '50%', bottom: 60, left: -80 }} />
          <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,1) 40px, rgba(255,255,255,1) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,1) 40px, rgba(255,255,255,1) 41px)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 22, fontWeight: 700 }}>
                <div style={{ width: 42, height: 42, background: 'rgba(255,255,255,0.14)', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <GraduationCap style={{ width: 22, height: 22 }} />
                </div>
                SIBAP
              </div>
              <div style={{ marginTop: 80, maxWidth: 500 }}>
                <h1 style={{ fontSize: 38, lineHeight: 1.15, fontWeight: 800, margin: '0 0 18px' }}>Recupera tu acceso</h1>
                <p style={{ fontSize: 15, lineHeight: 1.65, color: 'rgba(255,255,255,0.78)' }}>Te enviaremos un enlace seguro para restablecer tu cuenta.</p>
                <ul style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 16, padding: 0, listStyle: 'none' }}>
                  <li className="feature-li" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div className="feature-icon" style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldCheck style={{ width: 16, height: 16 }} /></div>
                    <span style={{ fontSize: 14.5, fontWeight: 500 }}>Enlace cifrado y de un solo uso</span>
                  </li>
                  <li className="feature-li" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div className="feature-icon" style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock style={{ width: 16, height: 16 }} /></div>
                    <span style={{ fontSize: 14.5, fontWeight: 500 }}>Expira en 15 minutos</span>
                  </li>
                </ul>
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>© 2026 SIBAP · Plataforma exclusiva para personal docente.</p>
          </div>
        </section>
      </div>
    </>
  );
}
