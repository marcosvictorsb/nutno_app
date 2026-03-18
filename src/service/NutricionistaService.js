import apiClient from './ApiClient';

export default {
    // Atualizar paciente
    atualizarPaciente(id, dados) {
        return apiClient.put(`/pacientes/${id}`, dados);
    },

    // Buscar dados do nutricionista
    buscarDadosNutricionista() {
        return apiClient.get('/nutricionistas');
    },

    // Salvar dados pessoais do nutricionista
    salvarDadosPessoais(dados) {
        return apiClient.put('/nutricionistas/dados-pessoais', dados);
    },

    // Alterar senha do nutricionista
    alterarSenha(dados) {
        return apiClient.put('/nutricionistas/seguranca', dados);
    }
};
