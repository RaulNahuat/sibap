import { Search, Filter } from 'lucide-react';

export default function BankFilters({ searchTerm, setSearchTerm, filterStatus, setFilterStatus }) {
    return (
        <div className="bg-white border border-[#e2e8f0]/60 rounded-2xl p-4 mb-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {/* Barra de busqueda */}
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o materia..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#1a5276]/10 focus:border-[#1a5276] transition-all"
                    />
                </div>

                {/* Filtro de estado */}
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[#64748b]" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full sm:w-auto px-4 py-2.5 border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#1a5276]/10 focus:border-[#1a5276] transition-all bg-white"
                    >
                        <option value="all">Todos</option>
                        <option value="completed">Completados</option>
                        <option value="inProgress">En progreso</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
