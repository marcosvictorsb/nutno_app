/**
 * Utilitários para cálculos nutricionais e métricas de saúde
 * Funções puras sem dependência de estado reativo
 */

/**
 * Calcular IMC e retornar { valor, classificacao, cor }
 */
export const calcularIMCComClassificacao = (peso, altura) => {
    const pesoNorm = peso ? parseFloat(String(peso).replace(',', '.')) : 0;
    const alturaNorm = altura ? parseFloat(String(altura).replace(',', '.')) : 0;

    if (!pesoNorm || pesoNorm <= 0 || !alturaNorm || alturaNorm <= 0) {
        return { valor: '—', classificacao: null, cor: null };
    }
    const alturaMetros = alturaNorm / 100;
    const imc = pesoNorm / (alturaMetros * alturaMetros);

    let classificacao = '';
    let cor = '';

    if (imc < 18.5) {
        classificacao = 'Abaixo do peso';
        cor = 'info'; // azul
    } else if (imc < 25) {
        classificacao = 'Normal';
        cor = 'success'; // verde
    } else if (imc < 30) {
        classificacao = 'Sobrepeso';
        cor = 'warning'; // amarelo
    } else if (imc < 35) {
        classificacao = 'Obesidade I';
        cor = 'warning'; // laranja (usando warning)
    } else if (imc < 40) {
        classificacao = 'Obesidade II';
        cor = 'danger'; // vermelho
    } else {
        classificacao = 'Obesidade III';
        cor = 'danger'; // vermelho escuro
    }

    return {
        valor: imc.toFixed(1),
        classificacao,
        cor
    };
};

/**
 * Calcular RCQ (Razão Cintura/Quadril) e retornar { valor, classificacao, cor }
 */
export const calcularRCQComClassificacao = (cintura, quadril, sexo) => {
    const cinturaNorm = cintura ? parseFloat(String(cintura).replace(',', '.')) : 0;
    const quadrilNorm = quadril ? parseFloat(String(quadril).replace(',', '.')) : 0;

    if (!cinturaNorm || cinturaNorm <= 0 || !quadrilNorm || quadrilNorm <= 0) {
        return { valor: '—', classificacao: null, cor: null };
    }

    const rcq = cinturaNorm / quadrilNorm;
    let classificacao = '';
    let cor = '';

    if (!sexo) {
        // Sem sexo definido, apenas retorna o valor
        return { valor: rcq.toFixed(2), classificacao: null, cor: null };
    }

    if (sexo === 'M' || sexo === 'masculino') {
        if (rcq < 0.9) {
            classificacao = 'Baixo risco';
            cor = 'success';
        } else if (rcq < 0.95) {
            classificacao = 'Risco moderado';
            cor = 'warning';
        } else {
            classificacao = 'Alto risco';
            cor = 'danger';
        }
    } else if (sexo === 'F' || sexo === 'feminino') {
        if (rcq < 0.8) {
            classificacao = 'Baixo risco';
            cor = 'success';
        } else if (rcq < 0.85) {
            classificacao = 'Risco moderado';
            cor = 'warning';
        } else {
            classificacao = 'Alto risco';
            cor = 'danger';
        }
    }

    return {
        valor: rcq.toFixed(2),
        classificacao,
        cor
    };
};

/**
 * Calcular TMB (Taxa Metabólica Basal) usando Harris-Benedict revisado
 */
export const calcularTMB = (peso, altura, idade, sexo) => {
    const pesoNorm = peso ? parseFloat(String(peso).replace(',', '.')) : 0;
    const alturaNorm = altura ? parseFloat(String(altura).replace(',', '.')) : 0;
    const idadeNorm = idade ? parseFloat(String(idade).replace(',', '.')) : 0;

    if (!pesoNorm || pesoNorm <= 0 || !alturaNorm || alturaNorm <= 0 || !idadeNorm || idadeNorm <= 0) {
        return null;
    }

    let tmb = 0;
    const usarMasculino = !sexo || sexo === 'M' || sexo === 'masculino';

    if (usarMasculino) {
        // Harris-Benedict para homens
        tmb = 88.36 + 13.4 * pesoNorm + 4.8 * alturaNorm - 5.7 * idadeNorm;
    } else {
        // Harris-Benedict para mulheres
        tmb = 447.6 + 9.2 * pesoNorm + 3.1 * alturaNorm - 4.3 * idadeNorm;
    }

    return Math.round(tmb);
};

/**
 * Obter fator de atividade baseado no nível de atividade
 */
export const obterFatorAtividade = (nivelAtividade) => {
    const fatores = {
        sedentario: 1.2,
        leve: 1.375,
        moderado: 1.55,
        intenso: 1.725
    };
    return fatores[nivelAtividade] || 1.375;
};

/**
 * Calcular GET (Gasto Energético Total) = TMB × Fator de Atividade
 */
export const calcularGET = (tmb, nivelAtividade) => {
    if (!tmb || tmb <= 0) {
        return '—';
    }
    const fator = obterFatorAtividade(nivelAtividade);
    return Math.round(tmb * fator);
};

/**
 * Formatar valor calórico para exibição (sem casas decimais com separador de milhar)
 */
export const formatarCaloria = (valor) => {
    if (!valor) return '—';
    const normalizado = String(valor).replace(',', '.');
    const numero = Math.round(parseFloat(normalizado));
    return numero.toLocaleString('pt-BR');
};

/**
 * Formatar IMC com 2 casas decimais
 */
export const formatarIMC = (valor) => {
    if (!valor) return '—';
    const normalizado = String(valor).replace(',', '.');
    return parseFloat(normalizado).toFixed(2).replace('.', ',');
};

/**
 * Formatar peso com 1 casa decimal
 */
export const formatarPeso = (valor) => {
    if (!valor) return '—';
    const normalizado = String(valor).replace(',', '.');
    return parseFloat(normalizado).toFixed(1).replace('.', ',');
};

/**
 * Formatar data para DD/MM/AAAA
 */
export const formatarDataAvaliacao = (data) => {
    if (!data) return '—';
    try {
        const d = new Date(data);
        const dia = String(d.getDate()).padStart(2, '0');
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const ano = d.getFullYear();
        return `${dia}/${mes}/${ano}`;
    } catch {
        return '—';
    }
};

/**
 * Traduzir nível de atividade para exibição legível
 */
export const traduzirNivelAtividadePlano = (nivel) => {
    const traducoes = {
        sedentario: 'Sedentário',
        leve: 'Leve',
        moderado: 'Moderado',
        intenso: 'Intenso',
        muito_intenso: 'Muito Intenso'
    };
    return traducoes[nivel] || nivel;
};

/**
 * Obter classificação IMC com label e severity para UI
 */
export const obterClassificacaoIMCPlano = (imc) => {
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

/**
 * Calcular sugestão de caloria por objetivo baseado no GET
 */
export const calcularSugestaoCaloriaPorObjetivo = (objetivo, get) => {
    if (!get || !objetivo) return null;
    const normalizado = String(get).replace(',', '.');
    const getNum = Math.round(parseFloat(normalizado));

    const sugestoes = {
        emagrecer: getNum - 500,
        ganhar_massa: getNum + 300,
        melhorar_saude: getNum,
        controlar_doenca: getNum,
        melhorar_performance: getNum + 200,
        outro: getNum
    };

    return sugestoes[objetivo] || null;
};

/**
 * Obter fórmula legível para exibição da sugestão calórica
 */
export const obterFormulaCaloria = (objetivo, get) => {
    if (!get || !objetivo) return '';
    const normalizado = String(get).replace(',', '.');
    const getNum = Math.round(parseFloat(normalizado));

    const formulas = {
        emagrecer: `GET (${formatarCaloria(getNum)}) − 500 = ${formatarCaloria(getNum - 500)} kcal`,
        ganhar_massa: `GET (${formatarCaloria(getNum)}) + 300 = ${formatarCaloria(getNum + 300)} kcal`,
        melhorar_saude: `GET = ${formatarCaloria(getNum)} kcal (manutenção)`,
        controlar_doenca: `GET = ${formatarCaloria(getNum)} kcal (base neutra)`,
        melhorar_performance: `GET (${formatarCaloria(getNum)}) + 200 = ${formatarCaloria(getNum + 200)} kcal`,
        outro: 'Defina a meta conforme avaliação clínica'
    };

    return formulas[objetivo] || '';
};

/**
 * Obter distribuição de macronutrientes por objetivo
 */
export const obterDistribuicaoMacrosPorObjetivo = (objetivo) => {
    console.log(objetivo, '=> obtendo distribuição de macros');
    const distribuicoes = {
        emagrecer: {
            proteina_perc: 35,
            carboidrato_perc: 40,
            gordura_perc: 25,
            justificativa: 'Maior proteína para preservar massa magra durante déficit calórico'
        },
        ganhar_massa: {
            proteina_perc: 30,
            carboidrato_perc: 50,
            gordura_perc: 20,
            justificativa: 'Mais carboidrato para energia nos treinos e síntese muscular'
        },
        melhorar_saude: {
            proteina_perc: 25,
            carboidrato_perc: 50,
            gordura_perc: 25,
            justificativa: 'Distribuição equilibrada seguindo diretrizes da OMS'
        },
        controlar_doenca: {
            proteina_perc: 25,
            carboidrato_perc: 45,
            gordura_perc: 30,
            justificativa: 'Mais gordura para condições como diabetes tipo 2 onde controle glicêmico é importante'
        },
        melhorar_performance: {
            proteina_perc: 25,
            carboidrato_perc: 55,
            gordura_perc: 20,
            justificativa: 'Alto carboidrato para maximizar energia e recuperação em atletas'
        },
        outro: {
            proteina_perc: 30,
            carboidrato_perc: 45,
            gordura_perc: 25,
            justificativa: 'Distribuição padrão neutra como ponto de partida'
        }
    };

    return distribuicoes[objetivo] || distribuicoes.outro;
};

/**
 * Calcular defícit ou superávit calórico
 */
export const calcularDeficitSuperavitCalorico = (calorias_meta, get) => {
    if (!calorias_meta || !get) return 0;
    const normalizado = String(get).replace(',', '.');
    return calorias_meta - parseFloat(normalizado);
};

/**
 * Calcular variação de peso por semana (1 kg gordura = 7700 kcal)
 */
export const calcularVariacaoPesoPorSemana = (diferenca_calorica) => {
    const KCAL_POR_KG = 7700;
    return (diferenca_calorica * 7) / KCAL_POR_KG;
};

/**
 * Calcular variação de peso em diferentes períodos
 */
export const calcularVariacaoPesoPeriodos = (calorias_meta, get) => {
    const diferenca = calcularDeficitSuperavitCalorico(calorias_meta, get);

    // Se diferença está entre -50 e +50: manutenção
    if (Math.abs(diferenca) <= 50) {
        return { tipo: 'manutencao', variacao_semanal: 0 };
    }

    const variacao_semanal = calcularVariacaoPesoPorSemana(diferenca);

    return {
        tipo: Math.abs(diferenca) > 50 ? (diferenca < 0 ? 'perda' : 'ganho') : 'manutencao',
        variacao_semanal: parseFloat(variacao_semanal.toFixed(1)),
        variacao_4_semanas: parseFloat((variacao_semanal * 4).toFixed(1)),
        variacao_8_semanas: parseFloat((variacao_semanal * 8).toFixed(1)),
        variacao_12_semanas: parseFloat((variacao_semanal * 12).toFixed(1))
    };
};

/**
 * Verificar avisos de segurança clínica baseado em calorias
 */
export const verificarAvisosSeguranca = (calorias_meta, get) => {
    const diferenca = calcularDeficitSuperavitCalorico(calorias_meta, get);
    const avisos = { deficit_alto: false, superavit_alto: false };

    // Se perda > 1 kg/semana (déficit > 1100 kcal/dia)
    if (diferenca < -1100) {
        avisos.deficit_alto = true;
    }

    // Se ganho > 0,5 kg/semana (superávit > 550 kcal/dia)
    if (diferenca > 550) {
        avisos.superavit_alto = true;
    }

    return avisos;
};

/**
 * Validar e parsear pressão arterial (formato 120/80)
 */
export const parsePressoArterial = (valor) => {
    if (!valor || valor.trim() === '') {
        return { sistolica: null, diastolica: null, valido: true };
    }

    const partes = valor.split('/');
    if (partes.length !== 2) {
        return { sistolica: null, diastolica: null, valido: false, erro: 'Formato deve ser: 120/80' };
    }

    const sistolica = parseInt(partes[0].trim(), 10);
    const diastolica = parseInt(partes[1].trim(), 10);

    if (isNaN(sistolica) || isNaN(diastolica)) {
        return { sistolica: null, diastolica: null, valido: false, erro: 'Valores devem ser números' };
    }

    if (sistolica <= diastolica) {
        return { sistolica, diastolica, valido: false, erro: 'Sistólica deve ser maior que diastólica' };
    }

    return { sistolica, diastolica, valido: true };
};

/**
 * Formatar valor de peso com prefixo e cor
 */
export const formatarPesoComPrefixo = (valor) => {
    const absValor = Math.abs(valor).toFixed(1).replace('.', ',');
    if (valor < 0) {
        return { texto: `− ${absValor}`, cor: 'text-emerald-700' };
    } else if (valor > 0) {
        return { texto: `+ ${absValor}`, cor: 'text-blue-700' };
    }
    return { texto: `${absValor}`, cor: 'text-slate-700' };
};
