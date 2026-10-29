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

// Community stats across all readers: { novelId, readers, ratingCount, score }.
// score is a Bayesian average, null until a novel has enough ratings.
export const getNovelStats = async () => {
    const API_URL = import.meta.env.VITE_API_BASE_URL;
    try {
        const response = await axios.get(`${API_URL}/api/novels/stats`);
        return response.data.stats || [];
    }
    catch(error) {
        console.error(error.response?.data || error.message);
        return [];
    }
};
