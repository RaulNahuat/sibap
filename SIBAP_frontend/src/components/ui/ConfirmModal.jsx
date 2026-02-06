import Modal from "./Modal";
import { AlertTriangle, AlertCircle } from "lucide-react";

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirmar acción',
    message = '¿Estás seguro?',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    danger = false,
}) {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="flex gap-4 mb-6">
                <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${danger
                            ? 'bg-red-50 text-red-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}
                >
                    {danger ? (
                        <AlertCircle className="w-6 h-6" />
                    ) : (
                        <AlertTriangle className="w-6 h-6" />
                    )}
                </div>

                <p className="text-[15px] text-[#475569] leading-relaxed pt-2">
                    {message}
                </p>
            </div>

            <div className="flex justify-end gap-3">
                <button
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-md border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#102129] hover:border-[#cbd5e1] transition-all"
                >
                    {cancelText}
                </button>

                <button
                    onClick={handleConfirm}
                    className={`px-5 py-2.5 rounded-md text-sm font-semibold text-white transition-all shadow-sm hover:shadow ${danger
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-[#1a5276] hover:bg-[#154360]'
                        }`}
                >
                    {confirmText}
                </button>
            </div>
        </Modal>
    );
}