import axios from 'axios';

const api = axios.create({
  baseURL: '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorData = error.response ? error.response.data : null;
    const message = (errorData && (errorData.error || errorData.message)) || error.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

export default api;
