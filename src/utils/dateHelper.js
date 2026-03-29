/**
 * Utilidades para manipulação de datas
 */

/**
 * Formatar data com timezone de São Paulo (America/Sao_Paulo)
 * A data recebida está em UTC do servidor e precisa ser convertida para São Paulo
 * @param {string} dataStr - Data em formato YYYY-MM-DD (UTC do servidor)
 * @param {Object} opcoes - Opções de formatação para toLocaleDateString
 * @returns {string} Data formatada em timezone -3
 */
export function formatarDataSaoPaulo(dataStr, opcoes = {}) {
    if (!dataStr) return '-';

    // A data vem em UTC do servidor (YYYY-MM-DD)
    // Criar um Date explicitamente em UTC
    const dataUTC = new Date(`${dataStr}T00:00:00Z`);

    // Aplicar formatação padrão ou customizada
    const opsFormatacao = {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        timeZone: 'America/Sao_Paulo',
        ...opcoes
    };

    // Usar Intl.DateTimeFormat para formatação correta em São Paulo
    const formatter = new Intl.DateTimeFormat('pt-BR', opsFormatacao);
    return formatter.format(dataUTC);
}

/**
 * Calcula a idade em anos a partir de uma data de nascimento
 * @param {string|Date} data_nascimento - Data de nascimento (YYYY-MM-DD ou objeto Date)
 * @returns {number} Idade em anos
 */
export function calcularIdade(data_nascimento) {
    if (!data_nascimento) return 0;
    const nascimento = new Date(data_nascimento);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }
    return idade;
}
