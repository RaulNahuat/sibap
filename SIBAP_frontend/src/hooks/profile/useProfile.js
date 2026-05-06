import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import {
    getProfile as getCurrentUserApi,
    updateProfile as updateProfileApi,
    updatePassword as updatePasswordApi,
    requestAccountDeletion as requestAccountDeletionApi
} from '../../api/user';
import { getErrorMessage } from '../../utils/errorHandler';

export function useProfile() {
    const navigate = useNavigate();
    const { user, update, logout } = useAuth();
    
    const [formData, setFormData] = useState({
        name: user?.name || '',
        lastName: user?.last_name || '',
        email: user?.email || '',
        role: 'Usuario común',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    
    const [loading, setLoading] = useState(true);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');

    // Cargar perfil
    useEffect(() => {
        const loadFreshProfile = async () => {
            try {
                const freshData = await getCurrentUserApi();
                update(freshData);

                setFormData({
                    name: freshData.name || '',
                    lastName: freshData.last_name || '',
                    email: freshData.email || '',
                    role: 'Usuario común',
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                });
            } catch (error) {
                console.error('Error al cargar perfil:', error);
            } finally {
                setLoading(false);
            }
        };

        loadFreshProfile();
    }, []);

    // Manejar cambio en el formulario
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Guardar perfil
    const handleSaveProfile = async () => {
        try {
            const payload = {
                name: formData.name,
                last_name: formData.lastName
            };

            const response = await updateProfileApi(payload);
            console.log('Perfil actualizado:', response);

            update(response);

            setShowProfileModal(false);
            toast.success('Perfil actualizado correctamente');
        } catch (error) {
            console.error('Error al actualizar el perfil:', error);
            const errorMessage = getErrorMessage(error);
            toast.error(errorMessage);
        }
    };

    // Confirmar guardado de perfil
    const confirmSaveProfile = () => {
        setShowProfileModal(true);
    };

    // Actualizar contraseña
    const handleUpdatePassword = async () => {
        try {
            const payload = {
                password: formData.currentPassword,
                new_password: formData.newPassword
            };

            await updatePasswordApi(payload);

            setFormData(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            }));

            setShowPasswordModal(false);
            toast.success('Contraseña actualizada correctamente');
        } catch (error) {
            console.error('Error al actualizar la contraseña:', error);
            const errorMessage = getErrorMessage(error);
            toast.error(errorMessage);
        }
    };

    // Confirmar actualización de contraseña
    const confirmUpdatePassword = () => {
        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('Las contraseñas no coinciden', { icon: '⚠️' });
            return;
        }

        if (!formData.currentPassword || !formData.newPassword) {
            toast.error('Por favor completa todos los campos de contraseña', { icon: '⚠️' });
            return;
        }

        setShowPasswordModal(true);
    };

    // Eliminar cuenta
    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            toast.error('Por favor ingresa tu contraseña para confirmar', { icon: '⚠️' });
            return;
        }

        try {
            const payload = {
                password: deletePassword
            };

            await requestAccountDeletionApi(payload);

            toast.success('Tu cuenta ha sido marcada para eliminación', { icon: 'ℹ️' });

            logout();
            navigate('/login', { replace: true });
        } catch (error) {
            console.error('Error al eliminar la cuenta:', error);
            const errorMessage = getErrorMessage(error);
            toast.error(errorMessage);
        } finally {
            setDeletePassword('');
            setShowDeleteModal(false);
        }
    };

    // Confirmar eliminación de cuenta
    const confirmDeleteAccount = () => {
        setShowDeleteModal(true);
    };

    return {
        user,
        formData,
        setFormData,
        loading,
        showProfileModal,
        setShowProfileModal,
        showPasswordModal,
        setShowPasswordModal,
        showDeleteModal,
        setShowDeleteModal,
        deletePassword,
        setDeletePassword,
        handleInputChange,
        handleSaveProfile,
        confirmSaveProfile,
        handleUpdatePassword,
        confirmUpdatePassword,
        handleDeleteAccount,
        confirmDeleteAccount
    };
}
