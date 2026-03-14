import apiClient from './ApiClient';

const TRADUCOES = {
    nivel_atividade: {
        sedentario: 'Sedentário',
        leve: 'Leve',
        moderado: 'Moderado',
        intenso: 'Intenso',
        muito_intenso: 'Muito Intenso'
    }
};

// Função para formatar valores de medidas
const formatarValor = (campo, valor) => {
    if (!valor) return valor;

    if (TRADUCOES[campo] && TRADUCOES[campo][valor]) {
        return TRADUCOES[campo][valor];
    }

    return valor;
};

export default {
    // Listar medidas de um paciente
    listarMedidasPaciente(idPaciente) {
        return apiClient.get(`/pacientes/${idPaciente}/medidas`);
    },

    // Obter evolução de medidas
    obterEvolucao(idPaciente) {
        return apiClient.get(`/pacientes/${idPaciente}/medidas/evolucao`);
    },

    // Buscar medida específica
    obterMedida(idPaciente, idMedida) {
        return apiClient.get(`/pacientes/${idPaciente}/medidas/${idMedida}`);
    },

    // Criar nova medida
    criarMedida(idPaciente, dados) {
        return apiClient.post(`/pacientes/${idPaciente}/medidas`, dados);
    },

    // Deletar medida
    deletarMedida(idPaciente, idMedida) {
        return apiClient.delete(`/pacientes/${idPaciente}/medidas/${idMedida}`);
    },

    // Funções auxiliares
    formatarValor(campo, valor) {
        return formatarValor(campo, valor);
    },

    // Função para calcular diferença entre duas medidas
    calcularDiferenca(valorAtual, valorAnterior) {
        if (!valorAnterior || valorAtual === undefined || valorAtual === null) {
            return null;
        }
        return (valorAtual - valorAnterior).toFixed(2);
    },

    // Função para formatar data para exibição
    formatarData(data) {
        if (!data) return 'N/A';
        try {
            return new Date(data).toLocaleDateString('pt-BR');
        } catch {
            return 'N/A';
        }
    }
};
