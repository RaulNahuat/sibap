import { User, CheckCircle, Save } from 'lucide-react';

export default function ProfileInfoCard({ user, formData, handleInputChange, confirmSaveProfile }) {
    return (
        <div className="bg-white border border-[#e2e8f0] rounded-lg p-6 mb-6">
            {/* Encabezado de la tarjeta */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-[#e2e8f0]">
                <h3 className="text-base font-semibold text-[#102129]">
                    Datos del Docente
                </h3>
                <User className="w-5 h-5 text-[#64748b]" />
            </div>

            {/* Sección de avatar */}
            <div className="flex items-center gap-5 mb-6">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#e2e8f0]">
                    <div className="w-full h-full bg-linear-to-br from-[#1a5276] to-[#154360] flex items-center justify-center text-white font-semibold text-2xl">
                        {user?.name?.[0]?.toUpperCase()}{user?.last_name?.[0]?.toUpperCase()}
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <button className="px-4 h-8 border border-[#e2e8f0] bg-white rounded-md text-[#102129] text-[13px] font-medium hover:bg-[#f1f5f9] transition-colors">
                        Cambiar Foto (No disponible aún)
                    </button>
                    <span className="text-xs text-[#64748b]">
                        JPG, PNG o GIF. Máx 1MB.
                    </span>
                </div>
            </div>

            {/* Rejilla de formularios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Primer Nombre */}
                <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-[#102129]">
                        Nombre(s)
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="h-10 border border-[#e2e8f0] rounded-md px-3 text-sm text-[#102129] bg-white focus:outline-none focus:border-[#1a5276] focus:ring-3 focus:ring-[#e9f5f8] transition-all"
                    />
                </div>

                {/* Apellido */}
                <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-[#102129]">
                        Apellidos
                    </label>
                    <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="h-10 border border-[#e2e8f0] rounded-md px-3 text-sm text-[#102129] bg-white focus:outline-none focus:border-[#1a5276] focus:ring-3 focus:ring-[#e9f5f8] transition-all"
                    />
                </div>

                {/* Correo - Ancho completo */}
                <div className="sm:col-span-2 flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-[#102129]">
                        Correo
                    </label>
                    <div className="relative flex items-center">
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            readOnly
                            className="h-10 w-full border border-[#e2e8f0] rounded-md px-3 pr-10 text-sm text-[#64748b] bg-[#f1f5f9] cursor-not-allowed"
                        />
                        <div className="absolute right-3 text-[#27ae60]">
                            <CheckCircle className="w-4 h-4" />
                        </div>
                    </div>
                    <span className="text-xs text-[#64748b] mt-1">
                        El correo no se puede modificar.
                    </span>
                </div>

                {/* Rol */}
                <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-[#102129]">
                        Rol en el Sistema
                    </label>
                    <input
                        type="text"
                        name="role"
                        value={formData.role}
                        readOnly
                        className="h-10 border border-[#e2e8f0] rounded-md px-3 text-sm text-[#64748b] bg-[#f1f5f9] cursor-not-allowed"
                    />
                </div>
            </div>

            {/* Acciones de la tarjeta */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-[#e2e8f0]">
                <button className="px-4 h-10 border border-[#e2e8f0] bg-white rounded-md text-[#102129] text-sm font-medium hover:bg-[#f1f5f9] transition-colors">
                    Cancelar
                </button>
                <button
                    onClick={confirmSaveProfile}
                    className="px-4 h-10 bg-[#1a5276] text-white rounded-md text-sm font-medium flex items-center gap-2 hover:opacity-95 transition-opacity"
                >
                    <Save className="w-4 h-4" />
                    Guardar Cambios
                </button>
            </div>
        </div>
    );
}
