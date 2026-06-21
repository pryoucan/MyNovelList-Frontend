import axios from "axios";

export const getAllNovels = async () => {
    const API_URL = import.meta.env.VITE_API_BASE_URL;
    try {
        const response = await axios.get(`${API_URL}/api/novels`);
        return response.data.novels || [];
    }
    catch(error) {
        console.error(error.response?.data || error.message);
        // BUG 13 FIX: Return empty array so callers never receive undefined
        return [];
    }
};
