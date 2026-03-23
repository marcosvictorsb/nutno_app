/**
 * Constrói URLs absolutas baseadas no ambiente
 */

const isDevelopment = import.meta.env.DEV;

/**
 * Obtém a URL base do servidor
 * @returns {string} URL base (ex: http://localhost:3000 ou https://nutno.com.br)
 */
export const getBaseUrl = () => {
    return isDevelopment ? 'http://localhost:3000' : 'https://www.nutno.com.br';
};

/**
 * Constrói a URL completa de uma foto de paciente
 * @param {string} fotoPath - Caminho relativo ou URL completa da foto (ex: uploads/pacientes/perfil/xxx.jpg)
 * @returns {string|null} URL completa da foto ou null se não houver caminho
 */
export const construirUrlFotoPaciente = (fotoPath) => {
    if (!fotoPath) {
        return null;
    }

    // Se já é uma URL completa, retorna como está
    if (fotoPath.startsWith('http://') || fotoPath.startsWith('https://')) {
        return fotoPath;
    }

    // Constrói a URL com base no ambiente
    const baseUrl = getBaseUrl();
    return `${baseUrl}/${fotoPath}`;
};

/**
 * Constrói a URL completa de qualquer arquivo estático
 * @param {string} filePath - Caminho relativo do arquivo (ex: uploads/xxx.jpg)
 * @returns {string|null} URL completa ou null se não houver caminho
 */
export const construirUrlArquivo = (filePath) => {
    if (!filePath) {
        return null;
    }

    // Se já é uma URL completa, retorna como está
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        return filePath;
    }

    // Constrói a URL com base no ambiente
    const baseUrl = getBaseUrl();
    return `${baseUrl}/${filePath}`;
};
