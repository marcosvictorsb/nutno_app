/**
 * Funções de tradução e classificação para dados de anamnese e planos
 */

export const traduzirObjetivo = (valor) => {
    const mapa = {
        emagrecer: 'Emagrecimento',
        ganhar_massa: 'Ganho de Massa',
        melhorar_saude: 'Saúde',
        controlar_doenca: 'Controlar Doença',
        melhorar_performance: 'Performance',
        outro: 'Outro'
    };
    return mapa[valor] || valor;
};

export const traduzirRestricao = (valor) => {
    const mapa = {
        lactose: 'Intolerância à lactose',
        gluten: 'Doença celíaca (glúten)',
        vegetariano: 'Vegetariano',
        vegano: 'Vegano',
        religiao: 'Restrição religiosa',
        outra: 'Outra restrição',
        nenhuma: 'Nenhuma'
    };
    return mapa[valor] || valor;
};

export const traduzirNivelAtividade = (valor) => {
    const mapa = {
        sedentario: 'Sedentário',
        leve: 'Leve',
        moderado: 'Moderado',
        intenso: 'Intenso',
        muito_intenso: 'Muito Intenso'
    };
    return mapa[valor] || valor;
};

export const traduzirQualidadeSono = (valor) => {
    const mapa = {
        otimo: 'Ótimo',
        bom: 'Bom',
        ruim: 'Ruim',
        pessimo: 'Péssimo'
    };
    return mapa[valor] || valor;
};

export const traduzirConsumoAlcool = (valor) => {
    const mapa = {
        nao: 'Não consome',
        socialmente: 'Socialmente',
        frequentemente: 'Frequentemente'
    };
    return mapa[valor] || valor;
};

export const obterCorSono = (valor) => {
    const cores = {
        otimo: 'success',
        bom: 'info',
        ruim: 'warning',
        pessimo: 'danger'
    };
    return cores[valor] || 'secondary';
};

export const obterCorEstresse = (nivel) => {
    if (nivel <= 2) return 'success';
    if (nivel === 3) return 'warning';
    return 'danger';
};

export const obterClassificacaoIMC = (imc) => {
    if (imc < 18.5) {
        return { label: 'Abaixo do peso', severity: 'info' };
    } else if (imc < 25) {
        return { label: 'Normal', severity: 'success' };
    } else if (imc < 30) {
        return { label: 'Sobrepeso', severity: 'warning' };
    } else if (imc < 35) {
        return { label: 'Obesidade I', severity: 'warning' };
    } else if (imc < 40) {
        return { label: 'Obesidade II', severity: 'danger' };
    } else {
        return { label: 'Obesidade III', severity: 'danger' };
    }
};
