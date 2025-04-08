import axios, { AxiosInstance } from "axios";

export const API_BASE_URL = "http://localhost:5199";

// Create an Axios instance with authentication
export const getAuthAxios = (): AxiosInstance => {
    const token = sessionStorage.getItem("token");
    return axios.create({
        baseURL: API_BASE_URL,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });
};

// Generic error handler
export const handleApiError = (error: any, errorMessage: string) => {
    console.error(`${errorMessage}:`, error); // Log error to console
    throw error; // Re-throw error for further handling
};