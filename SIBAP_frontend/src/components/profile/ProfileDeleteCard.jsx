import { AlertTriangle } from 'lucide-react';

export default function ProfileDeleteCard({
    showDeleteModal,
    setShowDeleteModal,
    deletePassword,
    setDeletePassword,
    confirmDeleteAccount,
    handleDeleteAccount
}) {
    return (
        <>
            {/* Zona de peligro */}
            <div className="bg-[#fef2f2] border border-[#fecaca] rounded-lg p-6">
                {/* Encabezado de la tarjeta */}
                <div className="flex justify-between items-start mb-6 pb-4 border-b border-[#fecaca]">
                    <h3 className="text-base font-semibold text-[#991b1b]">
                        Eliminar Cuenta
                    </h3>
                    <AlertTriangle className="w-5 h-5 text-[#dc2626]" />
                </div>

                {/* Contenido */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
                    <div>
                        <p className="text-sm text-[#7f1d1d] font-medium mb-1">
                            Solicitar eliminación permanente de la cuenta
                        </p>
                        <p className="text-[13px] text-[#991b1b]">
                            Esta acción no se puede deshacer. Se borrarán todos tus bancos de
                            preguntas y el historial de exámenes generados.
                        </p>
                    </div>
                    <button
                        onClick={confirmDeleteAccount}
                        className="px-4 h-10 bg-[#fee2e2] text-[#dc2626] rounded-md text-sm font-medium whitespace-nowrap shrink-0 hover:bg-[#fecaca] transition-colors"
                    >
                        Solicitar Eliminación
                    </button>
                </div>
            </div>

            {/* Modal de confirmación de eliminación de cuenta */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        {/* Encabezado del modal */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-[#102129]">
                                Confirmar eliminación de cuenta
                            </h3>
                        </div>

                        {/* Contenido del modal */}
                        <div className="mb-6">
                            <p className="text-sm text-[#475569] mb-4">
                                Esta acción es <strong>permanente</strong> y no se puede deshacer.
                                Se borrarán todos tus bancos de preguntas y el historial de exámenes generados.
                            </p>
                            <p className="text-sm text-[#475569] mb-4">
                                Por favor, ingresa tu contraseña para confirmar:
                            </p>
                            <input
                                type="password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                placeholder="Tu contraseña actual"
                                className="w-full h-10 border border-[#e2e8f0] rounded-md px-3 text-sm text-[#102129] bg-white focus:outline-none focus:border-red-500 focus:ring-3 focus:ring-red-100 transition-all"
                                autoFocus
                            />
                        </div>

                        {/* Acciones del modal */}
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeletePassword('');
                                }}
                                className="px-5 py-2.5 rounded-md border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#102129] hover:border-[#cbd5e1] transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                className="px-5 py-2.5 rounded-md text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-all shadow-sm hover:shadow"
                            >
                                Sí, eliminar mi cuenta
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
