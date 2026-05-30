import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://lab-aoc.vercel.app',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@AcmeAuth:token');
  
  if (token) {
    // ATUALIZADO: O backend exige o prefixo "Token" conforme o schema
    config.headers.Authorization = `Token ${token}`;
  }
  
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('@AcmeAuth:token');
        toast.error('Sua sessão expirou. Faça login novamente.');
        window.location.href = '/login';
      } else {
        toast.error(error.response.data.message || 'Erro na requisição.');
      }
    } else {
      toast.error('Erro de conexão com o servidor.');
    }
    return Promise.reject(error);
  }
);

export default api;