import apiClient from './ApiClient';

export default {
    // Buscar plano pelo token de visualização (pública)
    obterPorToken(token, data = null) {
        const params = data ? { data } : {};
        return apiClient.get(`/adesao/${token}`, { params });
    }
};
