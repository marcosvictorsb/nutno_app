import axios from 'axios';

const isDevelopment = import.meta.env.DEV;

const apiUrl = isDevelopment ? 'http://localhost:3000' : 'https://gunno.com.br';

const apiClient = axios.create({
    baseURL: apiUrl
});

export default {
    criarContaGratis(dadosUsuario) {
        return apiClient.post('/auth/criar-conta-gratis', {
            nome: dadosUsuario.nome,
            email: dadosUsuario.email,
            senha: dadosUsuario.senha
        });
    },

    login(credenciais) {
        return apiClient.post('/auth/login', {
            email: credenciais.email,
            senha: credenciais.password
        });
    },

    // Recuperar senha
    recuperarSenha(dados) {
        return apiClient.post('/auth/recuperar-senha', {
            email: dados.email
        });
    },

    // Verificar se token de reset é válido
    checkToken(token) {
        return apiClient.get('/auth/check-token', {
            params: {
                reset_password_token: token
            }
        });
    },

    // Resetar senha com o token
    resetarSenha(dados) {
        return apiClient.post(
            '/auth/redefinir-senha',
            {
                nova_senha: dados.senha
            },
            {
                params: {
                    token: dados.token
                }
            }
        );
    },

    // Salva o token no localStorage
    setToken(token) {
        localStorage.setItem('authToken', token);
    },

    // Recupera o token do localStorage
    getToken() {
        return localStorage.getItem('authToken');
    },

    // Remove o token do localStorage
    clearToken() {
        localStorage.removeItem('authToken');
    },

    // Verifica se existe token
    isAuthenticated() {
        return !!this.getToken();
    }
};
