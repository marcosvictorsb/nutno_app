import axios from 'axios';
import AuthService from './AuthService';

const isDevelopment = import.meta.env.DEV;

const apiUrl = isDevelopment ? 'http://localhost:3000' : 'https://nutno.com.br';

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

// Mapa de traduções para valores com underscores
const TRADUCOES = {
    tempo_nesse_peso: {
        menos_6_meses: 'Menos de 6 meses',
        '6_meses_1_ano': '6 meses a 1 ano',
        mais_1_ano: 'Mais de 1 ano'
    },
    trabalha_casa_ou_fora: {
        casa: 'Casa',
        fora: 'Fora',
        hibrido: 'Híbrido'
    },
    tempo_parar_cozinhar: {
        sempre: 'Sempre',
        as_vezes: 'Às vezes',
        raramente: 'Raramente'
    },
    objetivo: {
        emagrecer: 'Emagrecer',
        ganhar_massa: 'Ganhar Massa',
        melhorar_saude: 'Saúde',
        controlar_doenca: 'Controlar Doença',
        melhorar_performance: 'Performance',
        outro: 'Outro'
    },
    restricao_alimentar: {
        nenhuma: 'Nenhuma',
        lactose: 'Lactose',
        gluten: 'Glúten',
        vegetariano: 'Vegetariano',
        vegano: 'Vegano',
        religiao: 'Religiosa',
        outra: 'Outra'
    },
    qualidade_sono: {
        otimo: 'Ótimo',
        bom: 'Bom',
        ruim: 'Ruim',
        pessimo: 'Péssimo'
    },
    consumo_alcool: {
        nao: 'Não consome',
        socialmente: 'Socialmente',
        frequentemente: 'Frequentemente'
    }
};

// Função para formatar valores de anamnese
const formatarValorAnamnese = (campo, valor) => {
    if (!valor) return valor;

    if (TRADUCOES[campo] && TRADUCOES[campo][valor]) {
        return TRADUCOES[campo][valor];
    }

    return valor;
};

export default {
    criarAnamnese(dados) {
        return apiClient.post(`/anamnese`, dados);
    },

    obterAnamnese(id) {
        return apiClient.get(`/anamnese/${id}`);
    },

    atualizarAnamnese(id, dados) {
        return apiClient.put(`/anamnese/${id}`, dados);
    },

    obterPorPaciente(idPaciente) {
        return apiClient.get(`/anamnese/paciente/${idPaciente}`);
    },

    validarFormulario(token) {
        return axios.get(`${apiUrl}/formulario/${token}`);
    },

    salvarAnamnesePublica(token, dados) {
        return axios.post(`${apiUrl}/formulario/${token}`, dados);
    },

    obterAnamnesePaciente(idPaciente) {
        return apiClient.get(`/pacientes/${idPaciente}/anamnese`);
    },

    criarAnamnesePaciente(idPaciente, dados) {
        return apiClient.post(`/pacientes/${idPaciente}/anamnese`, dados);
    },

    atualizarAnamnesePaciente(idPaciente, dados) {
        return apiClient.put(`/pacientes/${idPaciente}/anamnese`, dados);
    },

    formatarValor(campo, valor) {
        return formatarValorAnamnese(campo, valor);
    }
};
