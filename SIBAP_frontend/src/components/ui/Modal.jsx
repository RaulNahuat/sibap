import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) {
    if (!isOpen) return null;

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            {/* Capa de superposición */}
            <div
                className='absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity'
                onClick={onClose}
            />

            {/* Ventana Modal */}
            <div className={`relative bg-white rounded-xl shadow-2xl w-full ${maxWidth} transform transition-all scale-100 animate-fadeIn`}>
                {/* Header */}
                <div className='flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]'>
                    <h3 className='text-lg font-semibold text-[#1a5276]'>
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className='text-[#64748b] hover:text-[#1a5276] hover:bg-[#f1f5f9] rounded-md p-1 transition-colors'
                    >
                        <X className='w-5 h-5' />
                    </button>
                </div>

                {/* Contenido */}
                <div className='px-6 py-5 overflow-y-auto max-h-[80vh]'>
                    {children}
                </div>
            </div>
        </div>
    );
}