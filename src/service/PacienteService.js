import axios from 'axios';
import AuthService from './AuthService';

const isDevelopment = import.meta.env.DEV;

const apiUrl = isDevelopment ? 'http://localhost:3000' : 'https://gunno.com.br';

const apiClient = axios.create({
    baseURL: apiUrl
});

// Interceptor para adicionar o token em todas as requisições
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

export default {
    // Listar todos os pacientes
    listarPacientes(params = {}) {
        return apiClient.get('/pacientes', { params });
    },

    // Buscar paciente por ID
    obterPaciente(id) {
        return apiClient.get(`/pacientes/${id}`);
    },

    // Criar novo paciente
    criarPaciente(dados) {
        const config = {};

        // Se for FormData, deixar o axios detectar automaticamente
        if (dados instanceof FormData) {
            config.headers = {
                'Content-Type': 'multipart/form-data'
            };
        }

        return apiClient.post('/pacientes', dados, config);
    },

    // Atualizar paciente
    atualizarPaciente(id, dados) {
        return apiClient.put(`/pacientes/${id}`, dados);
    },

    // Deletar paciente
    deletarPaciente(id) {
        return apiClient.delete(`/pacientes/${id}`);
    },

    // Buscar pacientes por filtro
    buscarPacientes(filtro) {
        return apiClient.get('/pacientes', {
            params: { busca: filtro }
        });
    },

    // Arquivar paciente
    arquivarPaciente(id) {
        return apiClient.patch(`/pacientes/${id}/arquivar`);
    },

    // Desarquivar paciente
    desarquivarPaciente(id) {
        return apiClient.patch(`/pacientes/${id}/desarquivar`);
    }
};
