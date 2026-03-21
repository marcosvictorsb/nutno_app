/**
 * Utilidades para manipulação de datas
 */

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
