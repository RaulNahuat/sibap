import { CheckCircle } from 'lucide-react';

const BankInfoHeader = ({ bankData, progressPercentage, validatedCount, totalCount }) => {
    return (
        <div className="sticky top-0 z-10 bg-[#f4f7f6] pb-4">
            <div className="bg-white border border-[#e2e8f0] rounded-lg p-4 sm:p-6 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <div>
                        <div className="text-xs font-medium text-[#64748b] mb-1">
                            MATERIA
                        </div>
                        <div className="text-base font-semibold text-[#102129]">
                            {bankData?.subject || 'Historia Universal'}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs font-medium text-[#64748b] mb-1">
                            TAXONOMÍA DE BLOOM
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                            {(() => {
                                const levels = bankData?.cognitive_level 
                                    ? (Array.isArray(bankData.cognitive_level) ? bankData.cognitive_level : bankData.cognitive_level.split(',').map(l => l.trim()))
                                    : ['No especificado'];
                                
                                return levels.map((level, idx) => (
                                    <span key={idx} className="px-2 py-0.5 bg-[#e9f5f8] text-[#1a5276] text-xs font-medium rounded whitespace-nowrap">
                                        {level}
                                    </span>
                                ));
                            })()}
                        </div>
                    </div>
                    <div className="col-span-2">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-xs font-medium text-[#64748b]">
                                PROGRESO
                            </div>
                            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-green-600">
                                <CheckCircle className="w-3 h-3" />
                                <span>Auto-guardado</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="flex-1 h-1.5 sm:h-2 bg-[#e2e8f0] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500 transition-all duration-500"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </div>
                            <span className="text-xs sm:text-sm font-semibold text-green-600 whitespace-nowrap">
                                {validatedCount}/{totalCount}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BankInfoHeader;
