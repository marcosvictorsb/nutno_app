import apiClient from './ApiClient';

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
