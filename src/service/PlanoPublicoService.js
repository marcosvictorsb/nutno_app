import apiClient from './ApiClient';

export default {
    // Buscar plano pelo token de visualização (pública)
    obterPorToken(token) {
        return apiClient.get(`/adesao/${token}`);
    }
};
