const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const API = {
  base: API_BASE_URL,
  endpoints: {
    admin: `${API_BASE_URL}/api/admin`,
  },
};

export default API;
