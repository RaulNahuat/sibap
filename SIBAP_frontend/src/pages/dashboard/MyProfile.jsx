import ConfirmModal from '../../components/ui/ConfirmModal';
import { useProfile } from '../../hooks/profile/useProfile';
import ProfileInfoCard from '../../components/profile/ProfileInfoCard';
import ProfileSecurityCard from '../../components/profile/ProfileSecurityCard';
import ProfileDeleteCard from '../../components/profile/ProfileDeleteCard';

export default function MyProfile() {
    const {
        user,
        formData,
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
    } = useProfile();

    return (
        <div className="max-w-[1000px] w-full mx-auto pb-24">
            {/* Estado de carga */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-[#1a5276] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-sm text-[#64748b]">Cargando perfil...</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Encabezado de la sección */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-[#1a5276] mb-2">
                            Información Personal
                        </h2>
                        <p className="text-sm text-[#64748b]">
                            Gestiona tu información de contacto y detalles académicos.
                        </p>
                    </div>

                    {/* Tarjeta de edición de perfil */}
                    <ProfileInfoCard
                        user={user}
                        formData={formData}
                        handleInputChange={handleInputChange}
                        confirmSaveProfile={confirmSaveProfile}
                    />

                    {/* Tarjeta de seguridad */}
                    <ProfileSecurityCard
                        formData={formData}
                        handleInputChange={handleInputChange}
                        confirmUpdatePassword={confirmUpdatePassword}
                    />

                    {/* Zona de peligro */}
                    <ProfileDeleteCard
                        showDeleteModal={showDeleteModal}
                        setShowDeleteModal={setShowDeleteModal}
                        deletePassword={deletePassword}
                        setDeletePassword={setDeletePassword}
                        confirmDeleteAccount={confirmDeleteAccount}
                        handleDeleteAccount={handleDeleteAccount}
                    />

                    {/* Modal de confirmación de edición de perfil */}
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

                    {/* Modal de confirmación de cambio de contraseña */}
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
                </>
            )}
        </div>
    );
}
