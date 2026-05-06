import { ShieldCheck } from 'lucide-react';

export default function ProfileSecurityCard({ formData, handleInputChange, confirmUpdatePassword }) {
    return (
        <div className="bg-white border border-[#e2e8f0] rounded-lg p-6 mb-6">
            {/* Encabezado de la tarjeta */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-[#e2e8f0]">
                <h3 className="text-base font-semibold text-[#102129]">
                    Seguridad y Contraseña
                </h3>
                <ShieldCheck className="w-5 h-5 text-[#64748b]" />
            </div>

            {/* Rejilla de formularios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Contraseña actual */}
                <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-[#102129]">
                        Contraseña Actual
                    </label>
                    <input
                        type="password"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        placeholder="••••••••"
                        className="h-10 border border-[#e2e8f0] rounded-md px-3 text-sm text-[#102129] bg-white focus:outline-none focus:border-[#1a5276] focus:ring-3 focus:ring-[#e9f5f8] transition-all"
                    />
                </div>

                {/* Espacio - Oculto en móvil */}
                <div className="hidden sm:block"></div>

                {/* Nueva Contraseña */}
                <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-[#102129]">
                        Nueva Contraseña
                    </label>
                    <input
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        placeholder="Mínimo 8 caracteres"
                        className="h-10 border border-[#e2e8f0] rounded-md px-3 text-sm text-[#102129] bg-white focus:outline-none focus:border-[#1a5276] focus:ring-3 focus:ring-[#e9f5f8] transition-all"
                    />
                </div>

                {/* Confirmar Nueva Contraseña */}
                <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-[#102129]">
                        Confirmar Nueva Contraseña
                    </label>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Mínimo 8 caracteres"
                        className="h-10 border border-[#e2e8f0] rounded-md px-3 text-sm text-[#102129] bg-white focus:outline-none focus:border-[#1a5276] focus:ring-3 focus:ring-[#e9f5f8] transition-all"
                    />
                </div>
            </div>

            {/* Acciones de la tarjeta */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-[#e2e8f0]">
                <button
                    onClick={confirmUpdatePassword}
                    className="px-4 h-10 bg-[#1a5276] text-white rounded-md text-sm font-medium hover:opacity-95 transition-opacity"
                >
                    Actualizar Contraseña
                </button>
            </div>
        </div>
    );
}
