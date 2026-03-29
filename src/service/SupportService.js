import apiClient from './ApiClient';

const SupportService = {
    async createTicket(ticketData) {
        try {
            const response = await apiClient.post('/suporte/tickets', ticketData);
            // Backend retorna { success, message, data: {...} }
            return response.data?.data || response.data;
        } catch (error) {
            console.error('Erro ao criar ticket de suporte:', error);
            throw error;
        }
    },

    async getTickets() {
        try {
            const response = await apiClient.get('/suporte/tickets');
            // Backend retorna { success, message, data: [...] }
            return response.data?.data || [];
        } catch (error) {
            console.error('Erro ao listar tickets:', error);
            throw error;
        }
    },

    async getTicketById(id) {
        try {
            const response = await apiClient.get(`/suporte/tickets/${id}`);
            return response.data?.data || response.data;
        } catch (error) {
            console.error('Erro ao buscar ticket:', error);
            throw error;
        }
    }
};

export default SupportService;
