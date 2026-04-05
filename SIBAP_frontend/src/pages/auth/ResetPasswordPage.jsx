import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyResetToken, completePasswordReset } from '../../api/auth';
import { getErrorMessage } from '../../utils/errorHandler';
import {
  Eye, EyeOff, ArrowRight, GraduationCap,
  KeyRound, CheckCircle2, AlertCircle, ShieldCheck,
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

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Token no válido');
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

  const styleTag = (
    <style>{`
      @keyframes orb1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(24px,-32px) scale(1.08); } }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }

      .orb-1 { animation: orb1 10s ease-in-out infinite; }
      .rp-input { width: 100%; border: 1.5px solid #dde3ec; border-radius: 12px; padding: 11px 42px 11px 14px; font-size: 14px; outline: none; transition: all 0.18s ease; }
      .rp-input:focus { border-color: #1a5276; box-shadow: 0 0 0 3px rgba(26,82,118,0.10); }
      .rp-btn { width: 100%; background: #1a5276; color: #fff; border-radius: 12px; padding: 13px 20px; font-size: 15px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 16px rgba(26,82,118,0.32); transition: all 0.18s ease; }
      .rp-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(26,82,118,0.38); }
      .rp-btn:disabled { opacity: 0.58; }
      .spinner { width: 17px; height: 17px; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
    `}</style>
  );

  const Layout = ({ content, panelContent }) => (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter, sans-serif' }}>
      {styleTag}
      <section className="w-full lg:w-[42%] flex items-center justify-center px-6 pt-24 pb-10 lg:pt-0 lg:pb-0" style={{ background: 'linear-gradient(160deg, #f4f7fa 0%, #eef2f7 100%)' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px 32px', boxShadow: '0 20px 48px -8px rgba(26,82,118,0.12)', border: '1px solid rgba(26,82,118,0.07)', width: '100%', maxWidth: 400 }}>{content}</div>
      </section>
      <section className="hidden lg:flex w-[58%] px-16 py-16 text-white relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #1a5276 0%, #154360 60%, #0d2d42 100%)' }}>
        <div className="orb-1" style={{ position: 'absolute', width: 620, height: 620, background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)', borderRadius: '50%', top: -120, right: -100 }} />
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 22, fontWeight: 700 }}><GraduationCap />SIBAP</div>
            <div style={{ marginTop: 80, maxWidth: 500 }}>{panelContent}</div>
          </div>
          <p style={{ fontSize: 12, opacity: 0.5 }}>© 2026 SIBAP</p>
        </div>
      </section>
    </div>
  );

  if (verifying) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Verificando...</div>;

  if (!tokenValid) return (
    <Layout
      content={
        <div style={{ textAlign: 'center' }}>
          <AlertCircle style={{ color: '#dc2626', margin: '0 auto 16px', width: 56, height: 56 }} />
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a5276' }}>Enlace expirado</h2>
          <p style={{ color: '#7a8b9a', marginBottom: 20 }}>El enlace ya no es válido.</p>
          <button onClick={() => navigate('/forgot-password')} className="rp-btn">Solicitar nuevo</button>
        </div>
      }
      panelContent={<h1>Seguridad primero</h1>}
    />
  );

  if (success) return (
    <Layout
      content={
        <div style={{ textAlign: 'center' }}>
          <CheckCircle2 style={{ color: '#16a34a', margin: '0 auto 16px', width: 56, height: 56 }} />
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a5276' }}>Actualizada</h2>
          <p style={{ color: '#7a8b9a', marginBottom: 20 }}>Ya puedes iniciar sesión.</p>
          <button onClick={() => navigate('/login')} className="rp-btn">Ir al inicio de sesión</button>
        </div>
      }
      panelContent={<h1>¡Todo listo!</h1>}
    />
  );

  return (
    <Layout
      content={
        <>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <KeyRound style={{ color: '#1a5276', margin: '0 auto 14px', width: 52, height: 52 }} />
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a5276' }}>Nueva contraseña</h2>
            <p style={{ color: '#7a8b9a' }}>Crea una nueva contraseña para {userEmail}</p>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} required className="rp-input" placeholder="Contraseña" onChange={e => setNewPassword(e.target.value)} />
              <button type="button" style={{ position: 'absolute', right: 13, top: 12, background: 'none', border: 'none', color: '#b8c4cc' }} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff /> : <Eye />}</button>
            </div>
            <div style={{ position: 'relative' }}>
              <input type={showConfirmPassword ? 'text' : 'password'} required className="rp-input" placeholder="Confirmar" onChange={e => setConfirmPassword(e.target.value)} />
              <button type="button" style={{ position: 'absolute', right: 13, top: 12, background: 'none', border: 'none', color: '#b8c4cc' }} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff /> : <Eye />}</button>
            </div>
            <button type="submit" disabled={loading} className="rp-btn">{loading ? <span className="spinner" /> : 'Actualizar'}</button>
          </form>
        </>
      }
      panelContent={<h1>Casi terminamos</h1>}
    />
  );
}
