import { BookOpen, ChevronUp, ChevronDown, MessageSquare } from 'lucide-react';

export default function Step2AcademicParams({
    formData,
    setFormData,
    availablePrograms,
    availableSemesters,
    availableSubjects,
    isLoadingPrograms,
    isLoadingSemesters,
    isLoadingSubjects,
    isManualMode,
    setIsManualMode,
    isISProgram,
    selectedSemesterNum,
    setSelectedSemesterNum,
    showAdvancedAcademic,
    setShowAdvancedAcademic
}) {
    return (
        <div className="bg-white border border-[#e2e8f0]/60 rounded-2xl p-6 sm:p-8 mb-6 shadow-md">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1a5276] text-white flex items-center justify-center text-sm sm:text-base font-semibold shrink-0">
                    2
                </div>
                <h2 className="text-lg font-bold text-slate-800">
                    Parámetros Académicos
                </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-5 gap-x-6 mb-6">
                {/* Programa Educativo */}
                <div className="lg:col-span-4">
                    <label className="block text-sm font-medium text-[#102129] mb-2">
                        Programa Educativo
                    </label>
                    <div className="space-y-2">
                        <select
                            className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm text-[#64748b] focus:outline-none focus:ring-4 focus:ring-[#1a5276]/10 focus:border-[#1a5276] transition-all"
                            value={availablePrograms.some(p => p.nombre === formData.program) ? formData.program : (formData.program ? "manual" : "")}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === "manual") {
                                    setFormData({ 
                                        ...formData, 
                                        program: '', 
                                        program_id: null,
                                        subject: '',
                                        subject_id: null
                                    });
                                    setIsManualMode(true);
                                } else {
                                    const prog = availablePrograms.find(p => p.nombre === val);
                                    setFormData({ 
                                        ...formData, 
                                        program: val, 
                                        program_id: prog?.id || null,
                                        subject: '',
                                        subject_id: null
                                    });
                                    setIsManualMode(val === 'Licenciatura en Ingeniería de Software' ? false : true);
                                }
                                setSelectedSemesterNum('');
                            }}
                            disabled={isLoadingPrograms}
                        >
                            <option value="">{isLoadingPrograms ? 'Cargando programas...' : 'Seleccionar programa...'}</option>
                            {availablePrograms.map(p => (
                                <option key={p.id} value={p.nombre}>{p.nombre}</option>
                            ))}
                            <option value="manual">Otro (Especificar manualmente)</option>
                        </select>

                        {(isManualMode || (formData.program && !availablePrograms.some(p => p.nombre === formData.program) && !isISProgram)) && (
                            <input
                                type="text"
                                placeholder="Nombre del programa educativo"
                                value={formData.program}
                                onChange={(e) => setFormData({ ...formData, program: e.target.value, program_id: null })}
                                className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm placeholder:text-[#cbd5e1] focus:outline-none focus:ring-4 focus:ring-[#1a5276]/10 focus:border-[#1a5276] transition-all animate-in fade-in slide-in-from-top-1"
                            />
                        )}
                    </div>
                </div>

                {/* Semestre */}
                <div className="lg:col-span-4">
                    <label className="block text-sm font-medium text-[#102129] mb-2">
                        Semestre / Grado
                    </label>
                    <div className="relative">
                        {!isManualMode && isISProgram ? (
                            <select
                                className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm text-[#64748b] focus:outline-none focus:ring-4 focus:ring-[#1a5276]/10 focus:border-[#1a5276] transition-all"
                                value={selectedSemesterNum}
                                onChange={(e) => {
                                    const sem = e.target.value;
                                    setSelectedSemesterNum(sem);
                                    setFormData(prev => ({ ...prev, semester: sem ? `${sem}° Semestre` : '' }));
                                }}
                                disabled={isLoadingSemesters}
                            >
                                <option value="">{isLoadingSemesters ? 'Cargando...' : 'Seleccionar semestre...'}</option>
                                {availableSemesters.map(s => (
                                    <option key={s} value={s}>{s}° Semestre</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                placeholder="Ej. 5to Semestre"
                                value={formData.semester}
                                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm placeholder:text-[#cbd5e1] focus:outline-none focus:ring-4 focus:ring-[#1a5276]/10 focus:border-[#1a5276] transition-all"
                            />
                        )}
                        {isISProgram && (
                            <button 
                                onClick={() => setIsManualMode(!isManualMode)}
                                className="absolute right-0 -top-6 text-[10px] font-bold text-[#1a5276] hover:underline uppercase tracking-tighter"
                            >
                                {isManualMode ? 'Usar catálogo' : 'Ingreso manual'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Materia / Asignatura */}
                <div className="lg:col-span-4">
                    <label className="block text-sm font-medium text-[#102129] mb-2">
                        Materia / Asignatura
                    </label>
                    {!isManualMode && isISProgram ? (
                        <select
                            className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm text-[#64748b] focus:outline-none focus:ring-4 focus:ring-[#1a5276]/10 focus:border-[#1a5276] transition-all"
                            value={formData.subject}
                            onChange={(e) => {
                                const subName = e.target.value;
                                const sub = availableSubjects.find(s => s.nombre === subName);
                                setFormData({ ...formData, subject: subName, subject_id: sub?.id || null });
                            }}
                            disabled={!selectedSemesterNum || isLoadingSubjects}
                        >
                            <option value="">
                                {!selectedSemesterNum
                                    ? 'Primero selecciona un semestre'
                                    : isLoadingSubjects
                                        ? 'Cargando materias...'
                                        : 'Seleccionar materia...'}
                            </option>
                            {availableSubjects.map(s => (
                                <option key={s.id} value={s.nombre}>{s.clave} — {s.nombre}</option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type="text"
                            placeholder="Ej. Programación Orientada a Objetos"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value, subject_id: null })}
                            className="w-full px-4 py-3 border border-[#e2e8f0] rounded-md text-sm placeholder:text-[#cbd5e1] focus:outline-none focus:ring-2 focus:ring-[#1a5276] focus:border-transparent"
                        />
                    )}
                </div>

                {/* Tema Principal */}
                <div className="lg:col-span-6">
                    <label className="block text-sm font-medium text-[#102129] mb-2">
                        Tema Principal
                    </label>
                    <input
                        type="text"
                        placeholder="Ej. Herencia"
                        value={formData.topic}
                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                        className="w-full px-4 py-3 border border-[#e2e8f0] rounded-md text-sm placeholder:text-[#cbd5e1] focus:outline-none focus:ring-2 focus:ring-[#1a5276] focus:border-transparent"
                    />
                </div>

                {/* Subtema (Opcional) */}
                <div className="lg:col-span-6">
                    <label className="block text-sm font-medium text-[#102129] mb-2">
                        Subtema (Opcional)
                    </label>
                    <input
                        type="text"
                        placeholder="Ej. Herencia simple"
                        value={formData.subtopic}
                        onChange={(e) => setFormData({ ...formData, subtopic: e.target.value })}
                        className="w-full px-4 py-3 border border-[#e2e8f0] rounded-md text-sm placeholder:text-[#cbd5e1] focus:outline-none focus:ring-2 focus:ring-[#1a5276] focus:border-transparent"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-5 gap-x-6 mb-6">
                {/* Niveles cognitivos */}
                <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-[#102129] mb-3">
                        Niveles cognitivos (Selecciona uno o más)
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {['Recordar', 'Comprender', 'Aplicar', 'Analizar', 'Evaluar', 'Crear'].map(level => {
                            const cognitiveLevels = Array.isArray(formData.cognitiveLevel) ? formData.cognitiveLevel : [formData.cognitiveLevel].filter(Boolean);
                            const isSelected = cognitiveLevels.includes(level);
                            return (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => {
                                        const newLevels = isSelected 
                                            ? cognitiveLevels.filter(l => l !== level)
                                            : [...cognitiveLevels, level];
                                        
                                        setFormData({ 
                                            ...formData, 
                                            cognitiveLevel: newLevels,
                                        });
                                    }}
                                    className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all border ${
                                        isSelected 
                                            ? 'bg-[#1a5276] text-white border-[#1a5276] shadow-sm' 
                                            : 'bg-white text-[#64748b] border-[#e2e8f0] hover:bg-[#f1f5f9] hover:text-[#102129]'
                                    }`}
                                >
                                    {level}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Número de Preguntas por Tipo */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-[#102129] mb-3">
                    Número de Preguntas por Tipo
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    {/* Opción múltiple */}
                    <div className="bg-slate-50 border border-[#e2e8f0]/80 rounded-xl p-3 sm:p-5 transition-all hover:border-[#1a5276]/30 hover:bg-slate-100/50 shadow-sm">
                        <label className="block text-[10px] sm:text-xs font-bold text-[#1a5276] uppercase tracking-wider mb-2">
                            Opción Múltiple
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="50"
                            value={formData.numMCQ}
                            onChange={(e) => setFormData({ ...formData, numMCQ: parseInt(e.target.value) || 0 })}
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#1a5276]/10 focus:border-[#1a5276] text-center font-semibold text-slate-800 bg-white transition-all"
                        />
                        {formData.numMCQ > 0 ? (
                            <p className="text-[9px] sm:text-[10px] text-[#94a3b8] mt-1.5 text-center leading-tight">
                                {(parseInt(formData.wrongOptionCount) || 0) + 1} opciones totales<br/>(1 correcta, {parseInt(formData.wrongOptionCount) || 0} incorrectas)
                            </p>
                        ) : (
                            <p className="text-[9px] sm:text-[10px] text-[#94a3b8] mt-1.5 text-center leading-tight">
                                Configurable al elegir 1 o más
                            </p>
                        )}
                        {formData.numMCQ > 0 && (
                            <div className="mt-3 pt-3 border-t border-[#e2e8f0]/80">
                                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 text-center">
                                    Distractores p/pregunta
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={formData.wrongOptionCount}
                                    onChange={(e) => setFormData({ ...formData, wrongOptionCount: parseInt(e.target.value) || 1 })}
                                    className="w-full px-2 py-1 border border-[#e2e8f0] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1a5276]/10 focus:border-[#1a5276] text-center font-semibold text-slate-700 bg-white transition-all"
                                />
                            </div>
                        )}
                    </div>

                    {/* Relacionar columnas*/}
                    <div className="bg-slate-50 border border-[#e2e8f0]/80 rounded-xl p-3 sm:p-5 transition-all hover:border-[#1a5276]/30 hover:bg-slate-100/50 shadow-sm">
                        <label className="block text-[10px] sm:text-xs font-bold text-[#1a5276] uppercase tracking-wider mb-2">
                            Relacionar Columnas
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="50"
                            value={formData.numMatching}
                            onChange={(e) => setFormData({ ...formData, numMatching: parseInt(e.target.value) || 0 })}
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#1a5276]/10 focus:border-[#1a5276] text-center font-semibold text-slate-800 bg-white transition-all"
                        />
                        <p className="text-[9px] sm:text-[10px] text-[#94a3b8] mt-1.5 text-center">4–6 pares de conceptos</p>
                    </div>

                    {/* Calculadas */}
                    <div className="bg-slate-50 border border-[#e2e8f0]/80 rounded-xl p-3 sm:p-5 transition-all hover:border-[#1a5276]/30 hover:bg-slate-100/50 shadow-sm">
                        <label className="block text-[10px] sm:text-xs font-bold text-[#1a5276] uppercase tracking-wider mb-2">
                            Calculada
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="50"
                            value={formData.numCalculated}
                            onChange={(e) => setFormData({ ...formData, numCalculated: parseInt(e.target.value) || 0 })}
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#1a5276]/10 focus:border-[#1a5276] text-center font-semibold text-slate-800 bg-white transition-all"
                        />
                        <p className="text-[9px] sm:text-[10px] text-[#94a3b8] mt-1.5 text-center">Problemas numéricos</p>
                    </div>
                </div>

                {/* Total de preguntas*/}
                <p className="mt-2 text-xs text-[#64748b]">
                    Total: <span className="font-semibold text-[#102129]">
                        {(parseInt(formData.numMCQ) || 0) + (parseInt(formData.numMatching) || 0) + (parseInt(formData.numCalculated) || 0)}
                    </span> preguntas · Escribe 0 para omitir un tipo.
                </p>
            </div>

            {/* Sección de configuración avanzada pedagógicas */}
            <div className="mt-8 pt-6">
                <button
                    type="button"
                    onClick={() => setShowAdvancedAcademic(!showAdvancedAcademic)}
                    className="flex items-center justify-between w-full p-4 bg-slate-50 border border-[#e2e8f0] rounded-xl hover:bg-slate-100 transition-all font-medium text-[#102129]"
                >
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-[#1a5276]" />
                        <span>Configuración Pedagógica Avanzada (Opcional)</span>
                    </div>
                    {showAdvancedAcademic ? <ChevronUp className="w-5 h-5 text-[#64748b]" /> : <ChevronDown className="w-5 h-5 text-[#64748b]" />}
                </button>

                {showAdvancedAcademic && (
                    <div className="mt-4 p-5 sm:p-6 border border-[#e2e8f0] rounded-xl bg-white shadow-sm animate-in slide-in-from-top-2 duration-200">
                        
                        {/* Objetivos de Aprendizaje */}
                        <div className="lg:col-span-12">
                            <label className="block text-sm font-medium text-[#102129] mb-2">
                                Resultados de aprendizaje
                            </label>
                            <textarea
                                className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm placeholder:text-[#cbd5e1] focus:outline-none focus:ring-4 focus:ring-[#1a5276]/10 focus:border-[#1a5276] bg-slate-50 min-h-[90px] resize-y transition-all"
                                placeholder="Ej: El estudiante identificará las fases del ciclo de vida del software y justificará su orden lógico..."
                                value={formData.learningObjectives}
                                onChange={(e) => setFormData({ ...formData, learningObjectives: e.target.value })}
                            />
                            <p className="mt-1 text-[11px] text-[#64748b] italic">
                                Las preguntas se alinearán a estos resultados para medir exactamente lo que deseas evaluar.
                            </p>
                        </div>

                        {/* Competencia general */}
                        <div className="mt-6 lg:col-span-12">
                            <label className="block text-sm font-medium text-[#102129] mb-2">
                                Competencia general
                            </label>
                            <textarea
                                className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm placeholder:text-[#cbd5e1] focus:outline-none focus:ring-4 focus:ring-[#1a5276]/10 focus:border-[#1a5276] bg-slate-50 min-h-[90px] resize-y transition-all"
                                placeholder="Ej: Diseña y desarrolla sistemas de software de calidad internacional..."
                                value={formData.generalCompetence}
                                onChange={(e) => setFormData({ ...formData, generalCompetence: e.target.value })}
                            />
                        </div>

                        {/* Competencia específica */}
                        <div className="mt-6 lg:col-span-12">
                            <label className="block text-sm font-medium text-[#102129] mb-2">
                                Competencia específica
                            </label>
                            <textarea
                                className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm placeholder:text-[#cbd5e1] focus:outline-none focus:ring-4 focus:ring-[#1a5276]/10 focus:border-[#1a5276] bg-slate-50 min-h-[90px] resize-y transition-all"
                                placeholder="Ej: Aplica conceptos de orientación a objetos para resolver problemas complejos..."
                                value={formData.specificCompetence}
                                onChange={(e) => setFormData({ ...formData, specificCompetence: e.target.value })}
                            />
                        </div>

                        <div className="mt-6">
                            <label className="flex text-sm font-semibold text-[#102129] mb-3 items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-[#1a5276]" />
                                Instrucciones Especiales
                            </label>
                            <textarea
                                className="w-full px-4 py-3 border border-[#e2e8f0] rounded-lg text-sm placeholder:text-[#cbd5e1] focus:outline-none focus:ring-2 focus:ring-[#1a5276] focus:border-transparent bg-[#f8fafc] min-h-[100px] transition-all resize-y"
                                placeholder="Ej: 'Usa un tono formal y técnico', 'Todas las preguntas deben incluir ejemplos de la vida real'..."
                                value={formData.customInstructions}
                                onChange={(e) => setFormData({ ...formData, customInstructions: e.target.value })}
                            />
                            <p className="mt-2 text-[11px] text-[#64748b] leading-tight italic">
                                Estas reglas se sumarán a los estándares pedagógicos del sistema.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
