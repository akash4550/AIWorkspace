import axios from 'axios';

// In a real app, baseURL would come from import.meta.env.VITE_API_URL
export const api = axios.create({
  baseURL: 'http://localhost:4000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Since Phase 4 was skipped, we will mock the auth token 
// with the seeded admin ID to simulate the backend receiving it.
// Replace with real JWT logic when Phase 4 is implemented.
api.interceptors.request.use((config) => {
  const mockAdminId = localStorage.getItem('mock_admin_id'); 
  if (mockAdminId) {
    config.headers.Authorization = `Bearer ${mockAdminId}`;
  }
  return config;
});
