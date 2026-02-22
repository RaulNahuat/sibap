import apiClient from './client';

export const getDashboardStats = async () => {
    try {
        const response = await apiClient.get('/dashboard/stats');
        return response.data;
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        throw error;
    }
};


export const getUserBanks = async () => {
    try {
        const response = await apiClient.get('/dashboard/banks');
        return response.data;
    } catch (error) {
        console.error("Error fetching user banks:", error);
        throw error;
    }
};
export const deleteUserBank = async (configId) => {
    try {
        const response = await apiClient.delete(`/dashboard/banks/${configId}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting user bank:", error);
        throw error;
    }
};
