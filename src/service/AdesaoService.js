import apiClient from './ApiClient';

export default {
    // Listar adesões do paciente
    listar(pacienteId, params = {}) {
        return apiClient.get(`/pacientes/${pacienteId}/adesao`, { params });
    },

    // Resumo de adesão do paciente
    resumo(pacienteId, params = {}) {
        return apiClient.get(`/pacientes/${pacienteId}/adesao/resumo`, { params });
    },

    // Registrar adesão (usado pela página pública do paciente via token)
    registrar(token, dados) {
        return apiClient.post(`/adesao/${token}`, dados);
    }
};
