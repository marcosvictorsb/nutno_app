import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}`;

export default {
    criarAnamnese(dados) {
        return axios.post(`${API_URL}/anamnese`, dados);
    },

    obterAnamnese(id) {
        return axios.get(`${API_URL}/anamnese/${id}`);
    },

    atualizarAnamnese(id, dados) {
        return axios.put(`${API_URL}/anamnese/${id}`, dados);
    },

    obterPorPaciente(idPaciente) {
        return axios.get(`${API_URL}/anamnese/paciente/${idPaciente}`);
    },

    validarFormulario(token) {
        return axios.get(`${API_URL}/formulario/${token}`);
    },

    salvarAnamnesePublica(token, dados) {
        return axios.post(`${API_URL}/formulario/${token}`, dados);
    }
};
