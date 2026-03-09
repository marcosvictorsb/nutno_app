const getLeadsUrl = () => {
    if (import.meta.env.MODE === 'production') {
        return 'https://nutno.com.br/leads';
    }
    return 'http://localhost:3000/leads';
};

const getLeadUrl = () => {
    if (import.meta.env.MODE === 'production') {
        return 'https://nutno.com.br/leads';
    }
    return 'http://localhost:3000/leads';
};

export const LeadsService = {
    async sendLead(leadData) {
        try {
            const url = getLeadsUrl();
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(leadData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao enviar lead:', error);
            throw error;
        }
    },

    async getLeads() {
        try {
            const url = getLeadUrl();
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar leads:', error);
            throw error;
        }
    }
};
