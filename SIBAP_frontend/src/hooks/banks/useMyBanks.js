import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserBanks, deleteUserBank } from '../../api/dashboard';
import { toast } from 'react-hot-toast';
import apiClient from '../../api/client';

export function useMyBanks() {
    const navigate = useNavigate();
    const [banks, setBanks] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, completed, inProgress
    const [deletingBank, setDeletingBank] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedBanks, setSelectedBanks] = useState([]);

    useEffect(() => {
        loadBanks();
    }, []);

    // cargar bancos
    const loadBanks = async () => {
        setLoading(true);
        try {
            const data = await getUserBanks();
            if (data) {
                const mappedBanks = data.map(b => ({
                    ...b,
                    isCompleted: b.isCompleted !== undefined ? b.isCompleted : b.is_completed,
                    lastModified: new Date(b.created_at)
                }));
                setBanks(mappedBanks);
            }
        } catch (error) {
            console.error("Error al cargar bancos:", error);
            toast.error("No se pudieron cargar los bancos.");
        } finally {
            setLoading(false);
        }
    };

    // abrir banco
    const handleOpenBank = (bank) => {
        navigate('/dashboard/validate', { state: { configId: bank.id, name: bank.name, subject: bank.subject, cognitive_level: bank.cognitive_level } });
    };

    // eliminar banco
    const handleDeleteBank = (bank) => {
        setDeletingBank(bank);
    };

    // exportar banco
    const handleExport = async (bank) => {
        try {
            const format = 'xml';
            const endpoint = `/api/questions/bank/${bank.id}/export/${format}`;
            const response = await apiClient.get(endpoint, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `banco_${bank.id}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success(`Exportación a XML completada.`);
        } catch (error) {
            console.error('Error en la exportación:', error);
            toast.error('No se pudo exportar el banco de preguntas.');
        }
    };

    // seleccionar banco
    const toggleSelectBank = (id) => {
        setSelectedBanks(prev => 
            prev.includes(id) ? prev.filter(bankId => bankId !== id) : [...prev, id]
        );
    };

    // eliminar bancos seleccionados
    const handleDeleteSelected = () => {
        if (selectedBanks.length === 0) return;
        setDeletingBank({ id: 'multiple', name: `${selectedBanks.length} bancos seleccionados`, count: selectedBanks.length });
    };

    // confirmar eliminación
    const confirmDelete = async () => {
        if (!deletingBank) return;

        try {
            if (deletingBank.id === 'multiple') {
                for (const id of selectedBanks) {
                    await deleteUserBank(id);
                }
                setBanks(banks.filter(b => !selectedBanks.includes(b.id)));
                setSelectedBanks([]);
                toast.success(`${deletingBank.count} bancos eliminados`);
            } else {
                await deleteUserBank(deletingBank.id);
                setBanks(banks.filter(b => b.id !== deletingBank.id));
                toast.success('Banco eliminado correctamente');
            }
        } catch (error) {
            console.error("Error al eliminar:", error);
            toast.error('Ocurrió un error al eliminar');
        } finally {
            setDeletingBank(null);
        }
    };

    // filtrar bancos
    const filteredBanks = banks.filter(bank => {
        const matchesSearch = (bank.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (bank.subject?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        const matchesFilter = filterStatus === 'all' ||
            (filterStatus === 'completed' && bank.isCompleted) ||
            (filterStatus === 'inProgress' && !bank.isCompleted);

        return matchesSearch && matchesFilter;
    });

    // estadísticas de los bancos
    const stats = {
        total: banks.length,
        completed: banks.filter(b => b.isCompleted).length,
        pending: banks.filter(b => !b.isCompleted).length
    };

    return {
        banks,
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        deletingBank,
        setDeletingBank,
        loading,
        selectedBanks,
        filteredBanks,
        stats,
        handleOpenBank,
        handleDeleteBank,
        handleExport,
        toggleSelectBank,
        handleDeleteSelected,
        confirmDelete
    };
}
