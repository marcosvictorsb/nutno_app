/**
 * Composable para funções utilitárias de planos alimentares
 * Contém lógica de cálculos, conversões e manipulações de dados do plano
 */

export const usePlanosAlimentares = () => {
    /**
     * Distribuição de calorias por refeição baseado em quantidade
     */
    const distribuirCalorias = (refeicoes_dia) => {
        const distribuicoes = {
            3: [
                { nome: 'Café da manhã', horario: '07:00', perc: 0.25 },
                { nome: 'Almoço', horario: '13:00', perc: 0.4 },
                { nome: 'Jantar', horario: '19:30', perc: 0.35 }
            ],
            4: [
                { nome: 'Café da manhã', horario: '07:00', perc: 0.25 },
                { nome: 'Almoço', horario: '13:00', perc: 0.35 },
                { nome: 'Lanche tarde', horario: '16:00', perc: 0.1 },
                { nome: 'Jantar', horario: '19:30', perc: 0.3 }
            ],
            5: [
                { nome: 'Café da manhã', horario: '07:00', perc: 0.25 },
                { nome: 'Lanche manhã', horario: '10:00', perc: 0.1 },
                { nome: 'Almoço', horario: '13:00', perc: 0.35 },
                { nome: 'Lanche tarde', horario: '16:00', perc: 0.1 },
                { nome: 'Jantar', horario: '19:30', perc: 0.2 }
            ],
            6: [
                { nome: 'Café da manhã', horario: '07:00', perc: 0.25 },
                { nome: 'Lanche manhã', horario: '10:00', perc: 0.1 },
                { nome: 'Almoço', horario: '13:00', perc: 0.3 },
                { nome: 'Lanche tarde', horario: '16:00', perc: 0.1 },
                { nome: 'Jantar', horario: '19:30', perc: 0.2 },
                { nome: 'Ceia', horario: '22:00', perc: 0.05 }
            ]
        };
        return distribuicoes[refeicoes_dia] || distribuicoes[5];
    };

    /**
     * Converter unidades para gramas
     */
    const converterParaGramas = (quantidade, unidade) => {
        const conversoes = {
            g: quantidade,
            ml: quantidade,
            'colher de sopa': quantidade * 15,
            'colher de chá': quantidade * 5,
            xícara: quantidade * 200,
            unidade: 100
        };
        return conversoes[unidade] || 100;
    };

    /**
     * Calcular nutrientes de um item baseado em quantidade
     */
    const calcularNutrienteItem = (alimento, quantidade, unidade) => {
        const gramasTotal = converterParaGramas(quantidade, unidade);
        const fator = gramasTotal / 100;

        // Converter strings para números (API retorna como string)
        const energiaKcal = typeof alimento.energiaKcal === 'string' ? parseFloat(alimento.energiaKcal) : alimento.energiaKcal;
        const proteina = typeof alimento.proteina === 'string' ? parseFloat(alimento.proteina) : alimento.proteina;
        const carboidrato = typeof alimento.carboidrato === 'string' ? parseFloat(alimento.carboidrato) : alimento.carboidrato;
        const lipidios = typeof alimento.lipidios === 'string' ? parseFloat(alimento.lipidios) : alimento.lipidios;

        return {
            calorias: Math.round(energiaKcal * fator * 10) / 10,
            proteinas: Math.round(proteina * fator * 10) / 10,
            carboidrato: Math.round(carboidrato * fator * 10) / 10,
            gordura: Math.round(lipidios * fator * 10) / 10
        };
    };

    /**
     * Recalcular totais de uma refeição
     */
    const calcularTotalRefeicao = (refeicao) => {
        refeicao.total_calorias = 0;
        refeicao.total_proteinas_g = 0;
        refeicao.total_carboidrato_g = 0;
        refeicao.total_gordura_g = 0;

        refeicao.itens.forEach((item) => {
            refeicao.total_calorias += item.calorias_calculadas;
            refeicao.total_proteinas_g += item.proteinas_calculadas;
            refeicao.total_carboidrato_g += item.carboidrato_calculado;
            refeicao.total_gordura_g += item.gordura_calculada;
        });

        refeicao.total_calorias = Math.round(refeicao.total_calorias * 10) / 10;
        refeicao.total_proteinas_g = Math.round(refeicao.total_proteinas_g * 10) / 10;
        refeicao.total_carboidrato_g = Math.round(refeicao.total_carboidrato_g * 10) / 10;
        refeicao.total_gordura_g = Math.round(refeicao.total_gordura_g * 10) / 10;
    };

    /**
     * Calcular totais do dia (para barra sticky)
     */
    const calcularTotaisDia = (formularioPlano) => {
        let total_calorias = 0;
        let total_proteinas = 0;
        let total_carboidrato = 0;
        let total_gordura = 0;

        formularioPlano.refeicoes.forEach((refeicao) => {
            total_calorias += refeicao.total_calorias;
            total_proteinas += refeicao.total_proteinas_g;
            total_carboidrato += refeicao.total_carboidrato_g;
            total_gordura += refeicao.total_gordura_g;
        });

        return {
            total_calorias: Math.round(total_calorias * 10) / 10,
            total_proteinas: Math.round(total_proteinas * 10) / 10,
            total_carboidrato: Math.round(total_carboidrato * 10) / 10,
            total_gordura: Math.round(total_gordura * 10) / 10,
            perc_calorias: Math.round((total_calorias / formularioPlano.calorias_meta) * 100),
            perc_proteinas: Math.round((total_proteinas / formularioPlano.proteina_g) * 100),
            perc_carboidrato: Math.round((total_carboidrato / formularioPlano.carboidrato_g) * 100),
            perc_gordura: Math.round((total_gordura / formularioPlano.gordura_g) * 100)
        };
    };

    /**
     * Calcular totais nutricionais do plano
     */
    const calcularTotaisPlano = (formularioPlano) => {
        let totalCalorias = 0;
        let totalProteinas = 0;
        let totalCarboidratos = 0;
        let totalGorduras = 0;

        formularioPlano.refeicoes.forEach((refeicao) => {
            if (refeicao.itens && refeicao.itens.length > 0) {
                refeicao.itens.forEach((item) => {
                    totalCalorias += item.calorias_calculadas || 0;
                    totalProteinas += item.proteinas_calculadas || 0;
                    totalCarboidratos += item.carboidratos_calculados || 0;
                    totalGorduras += item.gorduras_calculadas || 0;
                });
            }
        });

        return {
            totalCalorias: Math.round(totalCalorias),
            totalProteinas: Math.round(totalProteinas * 10) / 10,
            totalCarboidratos: Math.round(totalCarboidratos * 10) / 10,
            totalGorduras: Math.round(totalGorduras * 10) / 10
        };
    };

    /**
     * Calcular diferença entre realizado e meta calórica
     */
    const calcularDiferencaCalorica = (formularioPlano) => {
        const totais = calcularTotaisDia(formularioPlano);
        return {
            diferenca: totais.total_calorias - formularioPlano.calorias_meta,
            realizado: totais.total_calorias,
            meta: formularioPlano.calorias_meta
        };
    };

    /**
     * Obter status comparativo com a meta
     */
    const obterStatusComparativo = (formularioPlano) => {
        const { diferenca } = calcularDiferencaCalorica(formularioPlano);

        if (diferenca >= -200 && diferenca <= 200) {
            return {
                status: 'dentro',
                titulo: 'Dentro da meta calórica',
                icone: 'pi-check-circle',
                classe: 'bg-emerald-50 border-emerald-200',
                textoClasse: 'text-emerald-700',
                descricao: 'O plano atual atende a recomendação basal + atividade física.'
            };
        } else if (diferenca < -200) {
            return {
                status: 'abaixo',
                titulo: 'Abaixo da meta calórica',
                icone: 'pi-arrow-down-circle',
                classe: 'bg-amber-50 border-amber-200',
                textoClasse: 'text-amber-700',
                descricao: `O plano está ${Math.abs(Math.round(diferenca))} kcal abaixo da meta.`
            };
        } else {
            return {
                status: 'acima',
                titulo: 'Acima da meta calórica',
                icone: 'pi-exclamation-circle',
                classe: 'bg-red-50 border-red-200',
                textoClasse: 'text-red-700',
                descricao: `O plano está ${Math.round(diferenca)} kcal acima da meta.`
            };
        }
    };

    /**
     * Formatar valor numérico sem casas decimais
     */
    const formatarValor = (valor) => {
        return Math.round(valor);
    };

    /**
     * Inicializar array de refeições com metas calculadas
     */
    const inicializarRefeicoes = (formularioPlano) => {
        const refeicoesDia = parseInt(formularioPlano.refeicoes_dia);
        const distribuicao = distribuirCalorias(refeicoesDia);

        return distribuicao.map((ref, idx) => ({
            nome: ref.nome,
            horario: ref.horario,
            ordem: idx + 1,
            notas: '',
            itens: [],
            meta_calorias: Math.round(formularioPlano.calorias_meta * ref.perc),
            meta_proteinas_g: Math.round(formularioPlano.proteina_g * ref.perc),
            meta_carboidrato_g: Math.round(formularioPlano.carboidrato_g * ref.perc),
            meta_gordura_g: Math.round(formularioPlano.gordura_g * ref.perc),
            total_calorias: 0,
            total_proteinas_g: 0,
            total_carboidrato_g: 0,
            total_gordura_g: 0
        }));
    };

    /**
     * Gerar mensagem personalizada padrão para envio do plano
     */
    const gerarMensagemPadrao = (nomePaciente) => {
        return `Olá ${nomePaciente}! \n\nFinalizei seu novo plano alimentar. Ele foi montado com base nas suas medidas e objetivo definidos em consulta. \n\nAcesse pelo link para ver suas refeições e registre sua adesão diária. Qualquer dúvida, estou por aqui! 💚`;
    };

    return {
        distribuirCalorias,
        converterParaGramas,
        calcularNutrienteItem,
        calcularTotalRefeicao,
        calcularTotaisDia,
        calcularTotaisPlano,
        calcularDiferencaCalorica,
        obterStatusComparativo,
        formatarValor,
        inicializarRefeicoes,
        gerarMensagemPadrao
    };
};
