import { GraduationCap } from 'lucide-react';

const CreditsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-black/40 backdrop-blur-sm
        px-4
        animate-in fade-in duration-200
      "
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          w-full max-w-sm
          overflow-hidden
          rounded-2xl
          bg-white
          shadow-2xl
          animate-in zoom-in-95 duration-200
        "
      >
        {/* Header */}
        <div className="bg-linear-to-r from-[#1a5276] to-[#174461] px-6 py-5 text-white">
          <div className="flex items-start gap-4">
            {/* Ícono */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
              <GraduationCap className="h-6 w-6 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h2 id="modal-title" className="text-xl font-semibold">
                Créditos
              </h2>
              <p className="mt-1 text-sm text-white/80">
                Información del desarrollo del sistema.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 bg-[#fafcfe] px-6 py-5">
          {/* Desarrollador */}
          <div className="group rounded-xl bg-white p-4 transition-all hover:shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b99a6]">
              Desarrollado por:
            </p>
            <p className="mt-1 text-sm font-medium text-[#243746]">
              Br. Raúl I. Batun Nahuat
            </p>
          </div>

          {/* Asesores */}
          <div className="group rounded-xl bg-white p-4 transition-all hover:shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b99a6]">
              Asesores académicos:
            </p>
            <div className="mt-2 space-y-2">
              <p className="flex items-center gap-2 text-sm text-[#243746]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1a5276]/60" />
                Dra. Cinthia M. González Segura
              </p>
              <p className="flex items-center gap-2 text-sm text-[#243746]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1a5276]/60" />
                M.C.M. Neyfis V. Solís Baas
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between bg-white px-6 py-4">
          <span className="text-xs font-medium text-[#8b99a6]">SIBAP v1.0</span>
          <button
            onClick={onClose}
            className="
              rounded-xl bg-[#1a5276] px-5 py-2 
              text-sm font-medium text-white 
              transition-all duration-200 
              hover:bg-[#154360] hover:shadow-md 
              focus:outline-none focus:ring-2 focus:ring-[#1a5276] focus:ring-offset-2
              active:scale-95
            "
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreditsModal;