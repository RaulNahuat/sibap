import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const icons = {
        success: <CheckCircle className="w-5 h-5" />,
        error: <XCircle className="w-5 h-5" />,
        warning: <AlertCircle className="w-5 h-5" />,
        info: <AlertCircle className="w-5 h-5" />
    };

    const styles = {
        success: 'bg-green-50 text-green-800 border-green-200',
        error: 'bg-red-50 text-red-800 border-red-200',
        warning: 'bg-amber-50 text-amber-800 border-amber-200',
        info: 'bg-blue-50 text-blue-800 border-blue-200'
    };

    const iconStyles = {
        success: 'text-green-600',
        error: 'text-red-600',
        warning: 'text-amber-600',
        info: 'text-blue-600'
    };

    return (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg min-w-[300px] max-w-md animate-slideInRight ${styles[type]}`}>
            <div className={iconStyles[type]}>
                {icons[type]}
            </div>
            <p className="flex-1 text-sm font-medium">
                {message}
            </p>
            <button
                onClick={onClose}
                className="text-current opacity-70 hover:opacity-100 transition-opacity"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
