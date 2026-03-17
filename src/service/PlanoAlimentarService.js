import ApiClient from './ApiClient';

class PlanoAlimentarService {
    /**
     * Criar novo plano alimentar
     * @param {number} pacienteId - ID do paciente
     * @param {object} dados - Dados do plano (nome, objetivo, caloriasObjetivo, etc)
     * @returns {Promise<object>} Plano criado
     */
    static async criar(pacienteId, dados) {
        try {
            const response = await ApiClient.post(`/pacientes/${pacienteId}/planos-alimentar`, dados);
            return response.data;
        } catch (error) {
            console.error('Erro ao criar plano:', error);
            throw error;
        }
    }

    /**
     * Listar todos os planos alimentares de um paciente
     * @param {number} pacienteId - ID do paciente
     * @param {object} filtros - Filtros opcionais (status, etc)
     * @returns {Promise<array>} Lista de planos
     */
    static async listar(pacienteId, filtros = {}) {
        try {
            const response = await ApiClient.get(`/pacientes/${pacienteId}/planos-alimentar`, { params: filtros });
            return response.data;
        } catch (error) {
            console.error('Erro ao listar planos:', error);
            throw error;
        }
    }

    /**
     * Buscar plano alimentar específico
     * @param {number} pacienteId - ID do paciente
     * @param {number} planoId - ID do plano
     * @returns {Promise<object>} Dados do plano
     */
    static async buscar(pacienteId, planoId) {
        try {
            const response = await ApiClient.get(`/pacientes/${pacienteId}/planos-alimentar/${planoId}`);
            return response.data;
        } catch (error) {
            console.error('Erro ao buscar plano:', error);
            throw error;
        }
    }

    /**
     * Atualizar plano alimentar
     * @param {number} pacienteId - ID do paciente
     * @param {number} planoId - ID do plano
     * @param {object} dados - Dados a atualizar
     * @returns {Promise<object>} Plano atualizado
     */
    static async atualizar(pacienteId, planoId, dados) {
        try {
            const response = await ApiClient.put(`/pacientes/${pacienteId}/planos-alimentar/${planoId}`, dados);
            return response.data;
        } catch (error) {
            console.error('Erro ao atualizar plano:', error);
            throw error;
        }
    }

    /**
     * Ativar plano alimentar (mudar status para ATIVO)
     * @param {number} pacienteId - ID do paciente
     * @param {number} planoId - ID do plano
     * @returns {Promise<object>} Plano ativado
     */
    static async ativar(pacienteId, planoId) {
        try {
            const response = await ApiClient.patch(`/pacientes/${pacienteId}/planos-alimentar/${planoId}/ativar`);
            return response.data;
        } catch (error) {
            console.error('Erro ao ativar plano:', error);
            throw error;
        }
    }

    /**
     * Arquivar plano alimentar (mudar status para ARQUIVADO)
     * @param {number} pacienteId - ID do paciente
     * @param {number} planoId - ID do plano
     * @returns {Promise<object>} Plano arquivado
     */
    static async arquivar(pacienteId, planoId) {
        try {
            const response = await ApiClient.patch(`/pacientes/${pacienteId}/planos-alimentar/${planoId}/arquivar`);
            return response.data;
        } catch (error) {
            console.error('Erro ao arquivar plano:', error);
            throw error;
        }
    }

    /**
     * Enviar plano alimentar para o paciente
     * @param {number} pacienteId - ID do paciente
     * @param {number} planoId - ID do plano
     * @param {object} dados - Dados do envio (email, whatsapp, etc)
     * @returns {Promise<object>} Resultado do envio
     */
    static async enviar(pacienteId, planoId, dados = {}) {
        try {
            const response = await ApiClient.post(`/pacientes/${pacienteId}/planos-alimentar/${planoId}/enviar`, dados);
            return response.data;
        } catch (error) {
            console.error('Erro ao enviar plano:', error);
            throw error;
        }
    }

    /**
     * Visualizar plano alimentar público (sem autenticação)
     * @param {string} token - Token de acesso público do plano
     * @returns {Promise<object>} Dados do plano
     */
    static async visualizarPublico(token) {
        try {
            const response = await ApiClient.get(`/planos/visualizar/${token}`);
            return response.data;
        } catch (error) {
            console.error('Erro ao visualizar plano público:', error);
            throw error;
        }
    }

    /**
     * Deletar plano alimentar
     * @param {number} pacienteId - ID do paciente
     * @param {number} planoId - ID do plano
     * @returns {Promise<object>} Resultado da deleção
     */
    static async deletar(pacienteId, planoId) {
        try {
            const response = await ApiClient.delete(`/pacientes/${pacienteId}/planos-alimentar/${planoId}`);
            return response.data;
        } catch (error) {
            console.error('Erro ao deletar plano:', error);
            throw error;
        }
    }
}

export default PlanoAlimentarService;
