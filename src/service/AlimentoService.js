import apiClient from './ApiClient';

export default {
    // Buscar alimentos com filtros
    buscarAlimentos(filtros) {
        const params = {
            busca: filtros.busca || '',
            grupo: filtros.grupo || '',
            fonte: filtros.fonte || '',
            pagina: filtros.pagina || 1,
            limite: filtros.limite || 20
        };

        // Remover parâmetros vazios
        Object.keys(params).forEach((key) => {
            if (params[key] === '') {
                delete params[key];
            }
        });

        return apiClient.get('/alimentos', { params });
    },

    // Obter um alimento específico
    obterAlimento(id) {
        return apiClient.get(`/alimentos/${id}`);
    },

    // Criar novo alimento
    criarAlimento(dados) {
        return apiClient.post('/alimentos', dados);
    },

    // Atualizar alimento
    atualizarAlimento(id, dados) {
        return apiClient.put(`/alimentos/${id}`, dados);
    },

    // Deletar alimento
    deletarAlimento(id) {
        return apiClient.delete(`/alimentos/${id}`);
    },

    // Formatar valor numérico
    formatarValor(valor) {
        if (valor === null || valor === undefined) {
            return null;
        }
        if (valor === 0.001) {
            return 'tr';
        }
        return parseFloat(valor).toFixed(1);
    },

    // Formatar múltiplos valores
    formatarValores(obj) {
        const formatted = { ...obj };
        const campos = [
            'energiaKcal',
            'energiaKj',
            'proteina',
            'lipidios',
            'carboidrato',
            'fibra',
            'sodio',
            'umidade',
            'cinzas',
            'colesterol',
            'calcio',
            'magnesio',
            'manganes',
            'fosforo',
            'ferro',
            'potassio',
            'cobre',
            'zinco',
            'selenio',
            'vitaminaC',
            'tiamina',
            'riboflavina',
            'piridoxina',
            'niacina',
            'vitaminaA_re',
            'vitaminaA_rae',
            'vitaminaD',
            'vitaminaE',
            'vitaminaB12',
            'folato',
            'gorduraSaturada',
            'gorduraMonoinsaturada',
            'gorduraPoliinsaturada',
            'gordurasTrans'
        ];

        campos.forEach((campo) => {
            if (formatted[campo] !== null && formatted[campo] !== undefined) {
                formatted[campo] = this.formatarValor(formatted[campo]);
            }
        });

        return formatted;
    },

    // Validar campo obrigatório
    isValorValido(valor) {
        return valor !== null && valor !== undefined && valor !== '';
    }
};
