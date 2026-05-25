const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const API = {
  base: API_BASE_URL,
  endpoints: {
    session: `${API_BASE_URL}/api/session`,
    triage: `${API_BASE_URL}/api/triage`,
  },
};

export default API;
