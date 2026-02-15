import { useState, useEffect } from 'react';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
    getProfile as getCurrentUserApi,
    updateProfile as updateProfileApi,
    updatePassword as updatePasswordApi,
    requestAccountDeletion as requestAccountDeletionApi
} from '../../api/user';
import { getErrorMessage } from '../../utils/errorHandler';

import {
    User,
    ShieldCheck,
    AlertTriangle,
    CheckCircle,
    Save,
} from 'lucide-react';

export default function MyProfile() {
    const navigate = useNavigate();
    const { user, update, logout } = useAuth();
    const { showToast } = useToast();
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSaveProfile = async () => {
        try {
            const payload = {
                name: formData.name,
                last_name: formData.lastName
            };

            const response = await updateProfileApi(payload);
            console.log('Perfil actualizado:', response);

            update(response);

            showToast('Perfil actualizado correctamente', 'success');
        } catch (error) {
            console.error('Error al actualizar el perfil:', error);
            const errorMessage = getErrorMessage(error);
            showToast(errorMessage, 'error');
        }
    };

    const confirmSaveProfile = () => {
        setShowProfileModal(true);
    };

    const handleUpdatePassword = async () => {
        try {
            const payload = {
                password: formData.currentPassword,
                new_password: formData.newPassword
            };

            await updatePasswordApi(payload);

            // Solo limpiar si fue exitoso
            setFormData(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            }));

            setShowPasswordModal(false);
            showToast('Contraseña actualizada correctamente', 'success');
        } catch (error) {
            console.error('Error al actualizar la contraseña:', error);
            const errorMessage = getErrorMessage(error);
            showToast(errorMessage, 'error');
        }
    };

    const confirmUpdatePassword = () => {
        if (formData.newPassword !== formData.confirmPassword) {
            showToast('Las contraseñas no coinciden', 'warning');
            return;
        }

        if (!formData.currentPassword || !formData.newPassword) {
            showToast('Por favor completa todos los campos de contraseña', 'warning');
            return;
        }

        console.log('Abriendo modal de contraseña...');
        setShowPasswordModal(true);
        console.log('showPasswordModal debería ser true ahora');
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            showToast('Por favor ingresa tu contraseña para confirmar', 'warning');
            return;
        }

        try {
            const payload = {
                password: deletePassword
            };

            const response = await requestAccountDeletionApi(payload);


            showToast('Tu cuenta ha sido marcada para eliminación', 'info');

            logout();
            navigate('/login', { replace: true });
        } catch (error) {
            console.error('Error al eliminar la cuenta:', error);
            const errorMessage = getErrorMessage(error);
            showToast(errorMessage, 'error');
        } finally {
            setDeletePassword('');
            setShowDeleteModal(false);
        }
    };

    const confirmDeleteAccount = () => {
        setShowDeleteModal(true);
    };

    return (
        <div className="max-w-[1000px] w-full mx-auto">
            {/* Loading State */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-[#1a5276] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-sm text-[#64748b]">Cargando perfil...</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Section Header */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-[#1a5276] mb-2">
                            Información Personal
                        </h2>
                        <p className="text-sm text-[#64748b]">
                            Gestiona tu información de contacto y detalles académicos.
                        </p>
                    </div>

                    {/* Profile Edit Card */}
                    <div className="bg-white border border-[#e2e8f0] rounded-lg p-6 mb-6">
                        {/* Card Header */}
                        <div className="flex justify-between items-start mb-6 pb-4 border-b border-[#e2e8f0]">
                            <h3 className="text-base font-semibold text-[#102129]">
                                Datos del Docente
                            </h3>
                            <User className="w-5 h-5 text-[#64748b]" />
                        </div>

                        {/* Avatar Section */}
                        <div className="flex items-center gap-5 mb-6">
                            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#e2e8f0]">
                                <div className="w-full h-full bg-gradient-to-br from-[#1a5276] to-[#154360] flex items-center justify-center text-white font-semibold text-2xl">
                                    {user?.name?.[0]?.toUpperCase()}{user?.last_name?.[0]?.toUpperCase()}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button className="px-4 h-8 border border-[#e2e8f0] bg-white rounded-md text-[#102129] text-[13px] font-medium hover:bg-[#f1f5f9] transition-colors">
                                    Cambiar Foto (No disponible aún)
                                </button>
                                <span className="text-xs text-[#64748b]">
                                    JPG, PNG o GIF. Máx 1MB.
                                </span>
                            </div>
                        </div>

                        {/* Form Grid */}
                        <div className="grid grid-cols-2 gap-6">
                            {/* First Name */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[13px] font-medium text-[#102129]">
                                    Nombre(s)
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="h-10 border border-[#e2e8f0] rounded-md px-3 text-sm text-[#102129] bg-white focus:outline-none focus:border-[#1a5276] focus:ring-3 focus:ring-[#e9f5f8] transition-all"
                                />
                            </div>

                            {/* Last Name */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[13px] font-medium text-[#102129]">
                                    Apellidos
                                </label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    className="h-10 border border-[#e2e8f0] rounded-md px-3 text-sm text-[#102129] bg-white focus:outline-none focus:border-[#1a5276] focus:ring-3 focus:ring-[#e9f5f8] transition-all"
                                />
                            </div>

                            {/* Email - Full Width */}
                            <div className="col-span-2 flex flex-col gap-2">
                                <label className="text-[13px] font-medium text-[#102129]">
                                    Correo
                                </label>
                                <div className="relative flex items-center">
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        readOnly
                                        className="h-10 w-full border border-[#e2e8f0] rounded-md px-3 pr-10 text-sm text-[#64748b] bg-[#f1f5f9] cursor-not-allowed"
                                    />
                                    <div className="absolute right-3 text-[#27ae60]">
                                        <CheckCircle className="w-4 h-4" />
                                    </div>
                                </div>
                                <span className="text-xs text-[#64748b] mt-1">
                                    El correo no se puede modificar.
                                </span>
                            </div>

                            {/* Role */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[13px] font-medium text-[#102129]">
                                    Rol en el Sistema
                                </label>
                                <input
                                    type="text"
                                    name="role"
                                    value={formData.role}
                                    readOnly
                                    className="h-10 border border-[#e2e8f0] rounded-md px-3 text-sm text-[#64748b] bg-[#f1f5f9] cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Card Actions */}
                        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-[#e2e8f0]">
                            <button className="px-4 h-10 border border-[#e2e8f0] bg-white rounded-md text-[#102129] text-sm font-medium hover:bg-[#f1f5f9] transition-colors">
                                Cancelar
                            </button>
                            <button
                                onClick={confirmSaveProfile}
                                className="px-4 h-10 bg-[#1a5276] text-white rounded-md text-sm font-medium flex items-center gap-2 hover:opacity-95 transition-opacity"
                            >
                                <Save className="w-4 h-4" />
                                Guardar Cambios
                            </button>
                        </div>
                    </div>

                    {/* Security Card */}
                    <div className="bg-white border border-[#e2e8f0] rounded-lg p-6 mb-6">
                        {/* Card Header */}
                        <div className="flex justify-between items-start mb-6 pb-4 border-b border-[#e2e8f0]">
                            <h3 className="text-base font-semibold text-[#102129]">
                                Seguridad y Contraseña
                            </h3>
                            <ShieldCheck className="w-5 h-5 text-[#64748b]" />
                        </div>

                        {/* Form Grid */}
                        <div className="grid grid-cols-2 gap-6">
                            {/* Current Password */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[13px] font-medium text-[#102129]">
                                    Contraseña Actual
                                </label>
                                <input
                                    type="password"
                                    name="currentPassword"
                                    value={formData.currentPassword}
                                    onChange={handleInputChange}
                                    placeholder="••••••••"
                                    className="h-10 border border-[#e2e8f0] rounded-md px-3 text-sm text-[#102129] bg-white focus:outline-none focus:border-[#1a5276] focus:ring-3 focus:ring-[#e9f5f8] transition-all"
                                />
                            </div>

                            {/* Spacer */}
                            <div></div>

                            {/* New Password */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[13px] font-medium text-[#102129]">
                                    Nueva Contraseña
                                </label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleInputChange}
                                    placeholder="Mínimo 8 caracteres"
                                    className="h-10 border border-[#e2e8f0] rounded-md px-3 text-sm text-[#102129] bg-white focus:outline-none focus:border-[#1a5276] focus:ring-3 focus:ring-[#e9f5f8] transition-all"
                                />
                            </div>

                            {/* Confirm Password */}
                            <div className="flex flex-col gap-2">
                                <label className="text-[13px] font-medium text-[#102129]">
                                    Confirmar Nueva Contraseña
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    placeholder="Mínimo 8 caracteres"
                                    className="h-10 border border-[#e2e8f0] rounded-md px-3 text-sm text-[#102129] bg-white focus:outline-none focus:border-[#1a5276] focus:ring-3 focus:ring-[#e9f5f8] transition-all"
                                />
                            </div>
                        </div>

                        {/* Card Actions */}
                        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-[#e2e8f0]">
                            <button
                                onClick={confirmUpdatePassword}
                                className="px-4 h-10 bg-[#1a5276] text-white rounded-md text-sm font-medium hover:opacity-95 transition-opacity"
                            >
                                Actualizar Contraseña
                            </button>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-[#fef2f2] border border-[#fecaca] rounded-lg p-6">
                        {/* Card Header */}
                        <div className="flex justify-between items-start mb-6 pb-4 border-b border-[#fecaca]">
                            <h3 className="text-base font-semibold text-[#991b1b]">
                                Eliminar Cuenta
                            </h3>
                            <AlertTriangle className="w-5 h-5 text-[#dc2626]" />
                        </div>

                        {/* Content */}
                        <div className="flex justify-between items-center gap-6">
                            <div>
                                <p className="text-sm text-[#7f1d1d] font-medium mb-1">
                                    Solicitar eliminación permanente de la cuenta
                                </p>
                                <p className="text-[13px] text-[#991b1b]">
                                    Esta acción no se puede deshacer. Se borrarán todos tus bancos de
                                    preguntas y el historial de exámenes generados.
                                </p>
                            </div>
                            <button
                                onClick={confirmDeleteAccount}
                                className="px-4 h-10 bg-[#fee2e2] text-[#dc2626] rounded-md text-sm font-medium whitespace-nowrap flex-shrink-0 hover:bg-[#fecaca] transition-colors"
                            >
                                Solicitar Eliminación
                            </button>
                        </div>
                    </div>

                    {/* Profile Edit Confirmation Modal */}
                    <ConfirmModal
                        isOpen={showProfileModal}
                        onClose={() => setShowProfileModal(false)}
                        onConfirm={handleSaveProfile}
                        title="Confirmar cambios de perfil"
                        message="¿Estás seguro de que deseas guardar los cambios en tu perfil?"
                        confirmText="Sí, guardar cambios"
                        cancelText="Cancelar"
                        danger={false}
                    />

                    {/* Password Change Confirmation Modal */}
                    <ConfirmModal
                        isOpen={showPasswordModal}
                        onClose={() => setShowPasswordModal(false)}
                        onConfirm={handleUpdatePassword}
                        title="Confirmar cambio de contraseña"
                        message="¿Estás seguro de que deseas actualizar tu contraseña? Deberás iniciar sesión nuevamente con la nueva contraseña."
                        confirmText="Sí, actualizar contraseña"
                        cancelText="Cancelar"
                        danger={false}
                    />

                    {/* Account Deletion Confirmation Modal */}
                    {showDeleteModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                                {/* Modal Header */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                                        <AlertTriangle className="w-6 h-6 text-red-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-[#102129]">
                                        Confirmar eliminación de cuenta
                                    </h3>
                                </div>

                                {/* Modal Content */}
                                <div className="mb-6">
                                    <p className="text-sm text-[#475569] mb-4">
                                        Esta acción es <strong>permanente</strong> y no se puede deshacer.
                                        Se borrarán todos tus bancos de preguntas y el historial de exámenes generados.
                                    </p>
                                    <p className="text-sm text-[#475569] mb-4">
                                        Por favor, ingresa tu contraseña para confirmar:
                                    </p>
                                    <input
                                        type="password"
                                        value={deletePassword}
                                        onChange={(e) => setDeletePassword(e.target.value)}
                                        placeholder="Tu contraseña actual"
                                        className="w-full h-10 border border-[#e2e8f0] rounded-md px-3 text-sm text-[#102129] bg-white focus:outline-none focus:border-red-500 focus:ring-3 focus:ring-red-100 transition-all"
                                        autoFocus
                                    />
                                </div>

                                {/* Modal Actions */}
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setDeletePassword('');
                                        }}
                                        className="px-5 py-2.5 rounded-md border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#102129] hover:border-[#cbd5e1] transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleDeleteAccount}
                                        className="px-5 py-2.5 rounded-md text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-all shadow-sm hover:shadow"
                                    >
                                        Sí, eliminar mi cuenta
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
