import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import QuestionCard from '../../components/questions/QuestionCard';
import EditQuestionModal from '../../components/questions/EditQuestionModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { ChevronRight, Plus } from 'lucide-react';
import RegenerateDialog from '../../components/questions/RegenerateDialog';
import { useQuestionValidation } from '../../hooks/questions/useQuestionValidation';
import BankInfoHeader from '../../components/questions/BankInfoHeader';
import ExportSection from '../../components/questions/ExportSection';
import PageHeader from '../../components/ui/PageHeader';

export default function ValidateQuestionsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const bankData = location.state;

    useEffect(() => {
        if (!bankData) {
            navigate('/dashboard/banks');
        }
    }, [bankData, navigate]);

    const {
        questions,
        editingQuestion,
        setEditingQuestion,
        deletingQuestion,
        setDeletingQuestion,
        regeneratingIds,
        regenerateDialogState,
        setRegenerateDialogState,
        isAddingQuestion,
        setIsAddingQuestion,
        validatedCount,
        totalCount,
        progressPercentage,
        isValidated,
        handleValidate,
        handleEdit,
        handleSaveEdit,
        handleDelete,
        confirmDelete,
        handleRegenerateClick,
        confirmRegenerate,
        handleAddQuestion,
        handleExport
    } = useQuestionValidation(bankData);

    return (
        <div className="max-w-6xl mx-auto pb-24">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-[#64748b] mb-6">
                <button
                    onClick={() => navigate('/dashboard/banks')}
                    className="hover:text-[#1a5276] transition-colors"
                >
                    Mis Bancos
                </button>
                <ChevronRight className="w-4 h-4" />
                <span className="text-[#102129] font-medium truncate max-w-[150px] sm:max-w-none">
                    {bankData?.name || 'Historia Universal - Rev. Industrial'}
                </span>
            </div>

            {/* Header */}
            <PageHeader 
                title="Validación de Reactivos" 
                description="Revise y edite las preguntas generadas antes de exportar." 
            />

            {/* Tarjeta de información del banco */}
            <BankInfoHeader
                bankData={bankData}
                progressPercentage={progressPercentage}
                validatedCount={validatedCount}
                totalCount={totalCount}
            />

            {/* Lista de preguntas */}
            <div className="space-y-4 mb-8 mt-4">
                {questions.map((question, index) => (
                    <QuestionCard
                        key={question.id}
                        question={question}
                        questionNumber={index + 1}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onValidate={handleValidate}
                        onRegenerate={handleRegenerateClick}
                        isRegenerating={regeneratingIds.has(question.id)}
                    />
                ))}
            </div>

            {/* Botón de agregar pregunta */}
            <button
                onClick={() => setIsAddingQuestion(true)}
                className="w-full mt-2 py-3 border-2 border-dashed border-[#e2e8f0] rounded-xl text-sm font-medium text-[#64748b] hover:border-[#1a5276] hover:text-[#1a5276] hover:bg-[#f8fafc] transition-all flex items-center justify-center gap-2"
            >
                <Plus className="w-4 h-4" />
                Agregar pregunta manual
            </button>

            {/* Sección de exportación */}
            <ExportSection
                isValidated={isValidated}
                validatedCount={validatedCount}
                totalCount={totalCount}
                handleExport={handleExport}
            />

            {/* Modales */}
            <RegenerateDialog
                isOpen={regenerateDialogState.isOpen}
                onClose={() => setRegenerateDialogState({ isOpen: false, question: null })}
                onConfirm={confirmRegenerate}
                isRegenerating={false}
            />

            {/* Modal de edición */}
            {editingQuestion && (
                <EditQuestionModal
                    key={editingQuestion.id}
                    isOpen={!!editingQuestion}
                    onClose={() => setEditingQuestion(null)}
                    question={editingQuestion}
                    onSave={handleSaveEdit}
                />
            )}

            {/* Modal de agregar pregunta */}
            <EditQuestionModal
                key={isAddingQuestion ? 'adding' : 'closed'}
                isOpen={isAddingQuestion}
                onClose={() => setIsAddingQuestion(false)}
                question={null}
                onSave={handleAddQuestion}
            />

            {/* Modal de confirmación de eliminación */}
            {deletingQuestion && (
                <ConfirmModal
                    isOpen={!!deletingQuestion}
                    onClose={() => setDeletingQuestion(null)}
                    onConfirm={confirmDelete}
                    title="Eliminar Pregunta"
                    message={`¿Estás seguro de que deseas eliminar la pregunta "${deletingQuestion.questionText}"? Esta acción no se puede deshacer.`}
                    confirmText="Sí, eliminar"
                    cancelText="Cancelar"
                    danger
                />
            )}
        </div>
    );
}
