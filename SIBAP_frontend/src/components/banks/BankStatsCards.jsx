import { FolderOpen, CheckCircle, Clock } from 'lucide-react';

export default function BankStatsCards({ stats }) {
    return (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
            <div className="bg-white border border-[#e2e8f0]/60 rounded-xl p-2 sm:p-4 shadow-sm flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1 sm:gap-3 hover:shadow-md transition-all">
                <div className="w-7 h-7 sm:w-10 sm:h-10 bg-[#e9f5f8] rounded-full sm:rounded-lg flex items-center justify-center shrink-0 mb-1 sm:mb-0">
                    <FolderOpen className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-[#1a5276]" />
                </div>
                <div className="flex flex-col items-center sm:items-start w-full">
                    <div className="text-[10px] sm:text-sm font-medium text-[#64748b] leading-tight order-2 sm:order-1 mt-1 sm:mt-0 mb-1 sm:mb-2">Total</div>
                    <div className="text-xl sm:text-[32px] font-bold text-[#102129] leading-none order-1 sm:order-2">{stats.total}</div>
                </div>
            </div>
            <div className="bg-white border border-[#e2e8f0]/60 rounded-xl p-2 sm:p-4 shadow-sm flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1 sm:gap-3 hover:shadow-md transition-all">
                <div className="w-7 h-7 sm:w-10 sm:h-10 bg-green-50 rounded-full sm:rounded-lg flex items-center justify-center shrink-0 mb-1 sm:mb-0">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <div className="flex flex-col items-center sm:items-start w-full">
                    <div className="text-[10px] sm:text-sm font-medium text-[#64748b] leading-tight order-2 sm:order-1 mt-1 sm:mt-0 mb-1 sm:mb-2">Validados</div>
                    <div className="text-xl sm:text-[32px] font-bold text-[#102129] leading-none order-1 sm:order-2">{stats.completed}</div>
                </div>
            </div>
            <div className="bg-white border border-[#e2e8f0]/60 rounded-xl p-2 sm:p-4 shadow-sm flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1 sm:gap-3 hover:shadow-md transition-all">
                <div className="w-7 h-7 sm:w-10 sm:h-10 bg-amber-50 rounded-full sm:rounded-lg flex items-center justify-center shrink-0 mb-1 sm:mb-0">
                    <Clock className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-amber-600" />
                </div>
                <div className="flex flex-col items-center sm:items-start w-full">
                    <div className="text-[10px] sm:text-sm font-medium text-[#64748b] leading-tight order-2 sm:order-1 mt-1 sm:mt-0 mb-1 sm:mb-2">Pendientes</div>
                    <div className="text-xl sm:text-[32px] font-bold text-[#102129] leading-none order-1 sm:order-2">{stats.pending}</div>
                </div>
            </div>
        </div>
    );
}
