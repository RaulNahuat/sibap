import { useState } from 'react';
import { Mail, FileText, Send, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SupportPage() {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');

    const contactEmail = import.meta.env.VITE_EMAIL_ADRESS_CONTACT || 'soporte@sibap.edu.mx';

    const handleEmailSubmit = (e) => {
        e.preventDefault();
        
        if (!subject.trim() || !message.trim()) {
            toast.error('Por favor completa todos los campos.');
            return;
        }

        const mailtoLink = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        window.location.href = mailtoLink;
        
        toast.success('Se ha abierto tu cliente de correo.');
        setSubject('');
        setMessage('');
    };

    return (
        <div className="max-w-[1000px] w-full mx-auto pb-24">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#1a5276] mb-2">
                    Centro de Soporte
                </h1>
                <p className="text-base text-[#64748b]">
                    ¿Tienes dudas o necesitas ayuda con SIBAP? Estamos aquí para ayudarte.
                </p>
            </div>

            <div className="flex justify-center">
                {/* Formulario de Contacto */}
                <div className="bg-white rounded-xl shadow-xs border border-[#e2e8f0] p-8 w-full max-w-[600px]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-[#e9f5f8] flex items-center justify-center text-[#1a5276]">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#102129]">Contacto Directo</h2>
                            <p className="text-sm text-[#64748b]">Envíanos un mensaje a {contactEmail}</p>
                        </div>
                    </div>

                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[#102129] mb-1">
                                Asunto
                            </label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Ej. Problema con inicio de sesión"
                                className="w-full px-4 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-sm text-[#102129] focus:outline-hidden focus:border-[#1a5276] focus:ring-1 focus:ring-[#1a5276] transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#102129] mb-1">
                                Mensaje
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Describe tu problema o duda en detalle..."
                                rows={5}
                                className="w-full px-4 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-sm text-[#102129] focus:outline-hidden focus:border-[#1a5276] focus:ring-1 focus:ring-[#1a5276] transition-all resize-none"
                            ></textarea>
                        </div>
                        <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a5276] text-white text-sm font-medium rounded-lg hover:bg-[#154360] transition-colors"
                        >
                            <Send className="w-4 h-4" />
                            Enviar Correo
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
