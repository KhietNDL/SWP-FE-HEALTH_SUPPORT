import { getAuthAxios, handleApiError } from "./ApiConfig";

export const DashboardApiService = {
    getSubscriptionMonthly: async () => {
        try {
            const response = await getAuthAxios().get("/api/Dashboard/subscriptions/monthly");
            return response.data;
        } catch (error) {
            handleApiError(error, "Failed to fetch subscription monthly data");
        }
    },

    getRevenueMonthly: async () => {
        try {
            const response = await getAuthAxios().get("/api/Dashboard/revenue/monthly");
            return response.data;
        } catch (error) {
            handleApiError(error, "Failed to fetch revenue monthly data");
        }
    },

    getTotalMonthly: async () => {
        try {
            const response = await getAuthAxios().get("/api/Dashboard/totalMonthly");
            return response.data;
        } catch (error) {
            handleApiError(error, "Failed to fetch total monthly data");
        }
    },

    getTotalAccount: async () => {
        try {
            const response = await getAuthAxios().get("/api/Dashboard/totalAccounts");
            return response.data;
        } catch (error) {
            handleApiError(error, "Failed to fetch total account data");
        }
    },

    getOrdersToday: async () => {
        try {
            const response = await getAuthAxios().get("/api/Dashboard/ordersToday");
            return response.data;
        } catch (error) {
            handleApiError(error, "Failed to fetch orders today data");
        }
    }
};