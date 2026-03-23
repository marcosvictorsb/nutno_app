import axios from 'axios';
import AuthService from './AuthService';

const isDevelopment = import.meta.env.DEV;

const apiUrl = isDevelopment ? 'http://localhost:3000/api' : 'https://www.nutno.com.br/api';

let router = null;
let toast = null;

// Função para configurar o router (chamada no main.js)
export const setRouter = (r) => {
    router = r;
};

// Função para configurar o toast (chamada no main.js)
export const setToast = (t) => {
    toast = t;
};

// Criar instância do axios
const apiClient = axios.create({
    baseURL: apiUrl
});

// Interceptor de REQUEST - Adiciona token
apiClient.interceptors.request.use(
    (config) => {
        const token = AuthService.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor de RESPONSE - Trata erros de token inválido
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Verificar se é erro 401 ou mensagem de token inválido
        const isTokenError = error.response?.status === 401 || error.response?.data?.message?.includes('Token inválido') || error.response?.data?.message?.includes('Token expirado');

        if (isTokenError) {
            console.warn('⚠️ Token inválido ou expirado');

            // Limpar token
            AuthService.clearToken();

            // Mostrar notificação
            if (toast) {
                toast.add({
                    severity: 'warn',
                    summary: 'Sessão Expirada',
                    detail: 'Sua sessão expirou. Por favor, faça login novamente.',
                    life: 3000
                });
            } else {
                console.warn('⚠️ Sessão expirada - Token inválido ou expirado');
            }

            // Redirecionar para login
            if (router) {
                router.push('/auth/login');
            }
        }

        return Promise.reject(error);
    }
);

export { apiUrl };
export default apiClient;
