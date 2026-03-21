/**
 * Composable useMedidas
 * Gerencia todo o estado, computed e funções relacionadas às medidas do paciente
 */

import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, nextTick, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import AnamneseService from '@/service/AnamneseService';
import MedidaService from '@/service/MedidaService';

import { calcularGET, calcularIMCComClassificacao, calcularRCQComClassificacao, calcularTMB } from '@/utils/nutricionais';

import { calcularIdade } from '@/utils/dateHelper';

export function useMedidas(pacienteId, paciente, activeTab) {
    const route = useRoute();
    const toast = useToast();
    const confirm = useConfirm();

    // ===== ESTADOS =====

    // Lista e loading de medidas
    const medidas = ref([]);
    const loadingMedidas = ref(false);
    const erroMedidas = ref(null);
    const medidasCarregada = ref(false);
    const medidaSelecionada = ref(null);
    const medidaMaisRecente = ref(null);

    // Dialog para criar/editar medida
    const showDialogCriacaoMedida = ref(false);
    const loadingCriacaoMedida = ref(false);

    // Formulário de medida
    const formularioMedida = ref({
        data_avaliacao: null,
        peso: null,
        altura: null,
        imc: null,
        perc_gordura_corporal: null,
        perc_massa_magra: null,
        idade_metabolica: null,
        circunferencia_cintura: null,
        circunferencia_quadril: null,
        relacao_cintura_quadril: null,
        circunferencia_abdominal: null,
        circunferencia_braco: null,
        circunferencia_coxa_direita: null,
        circunferencia_coxa_esquerda: null,
        circunferencia_panturrilha: null,
        circunferencia_torax: null,
        dobra_subescapular: null,
        dobra_tricipital: null,
        dobra_bicipital: null,
        dobra_suprailíaca: null,
        dobra_abdominal: null,
        dobra_coxal: null,
        dobra_peitoral: null,
        pressao_arterial_sistolica: null,
        pressao_arterial_diastolica: null,
        frequencia_cardiaca: null,
        tmb: null,
        gasto_energetico_total: null,
        nivel_atividade: 'leve',
        observacoes: ''
    });

    // Campo combinado para pressão arterial (formato 120/80)
    const pressaoArterialCombinada = ref('');

    // ===== COMPUTED =====

    /**
     * Calcular IMC com classificação
     */
    const imcComClassificacao = computed(() => {
        return calcularIMCComClassificacao(formularioMedida.value.peso, formularioMedida.value.altura);
    });

    /**
     * Calcular % Massa Magra automaticamente
     */
    const massaMagraCalculada = computed(() => {
        const perc_gordura = formularioMedida.value.perc_gordura_corporal;
        if (!perc_gordura || perc_gordura <= 0) {
            return '—';
        }
        return (100 - perc_gordura).toFixed(1);
    });

    /**
     * Calcular RCQ (Razão Cintura/Quadril) com classificação
     */
    const rcqComClassificacao = computed(() => {
        return calcularRCQComClassificacao(formularioMedida.value.circunferencia_cintura, formularioMedida.value.circunferencia_quadril, paciente.value?.sexo);
    });

    /**
     * Calcular GET (Gasto Energético Total)
     */
    const getCalculado = computed(() => {
        return calcularGET(formularioMedida.value.tmb, formularioMedida.value.nivel_atividade);
    });

    // ===== FUNÇÕES =====

    /**
     * Carregar medidas do paciente
     */
    const carregarMedidas = async () => {
        loadingMedidas.value = true;
        erroMedidas.value = null;

        try {
            const idPaciente = route.params.id;
            console.log('📊 Carregando medidas do paciente:', idPaciente);

            const response = await MedidaService.listarMedidasPaciente(idPaciente);
            console.log('✅ Resposta de medidas:', response.data);

            if (response.data.success && response.data.data) {
                if (Array.isArray(response.data.data) && response.data.data.length > 0) {
                    // A API retorna os dados já ordenados por ID DESC (mais recente primeiro)
                    medidas.value = response.data.data;

                    // A primeira medida é sempre a mais recente - preencher a seleção
                    medidaSelecionada.value = medidas.value[0];
                    console.log('📊 Medida selecionada definida para a mais recente:', medidaSelecionada.value);
                    console.log('📍 Medida selecionada:', medidaSelecionada.value.id, '- Peso:', medidaSelecionada.value.peso, 'kg');
                    medidaSelecionada.value.imc = medidaSelecionada.value.imc ? parseFloat(medidaSelecionada.value.imc) : null;

                    erroMedidas.value = null;
                } else {
                    // API retornou sucesso mas sem dados
                    medidas.value = [];
                    medidaSelecionada.value = null;
                    erroMedidas.value = null;
                    console.log('ℹ️ Nenhuma medida registrada para este paciente');
                }
            } else {
                // API retornou erro
                erroMedidas.value = response.data.message || 'Erro ao listar medidas';
                medidas.value = [];
                medidaSelecionada.value = null;
                console.error('❌ Erro na resposta da API:', erroMedidas.value);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar medidas:', error);
            erroMedidas.value = 'Erro ao carregar medidas. Tente novamente.';
            medidas.value = [];
            medidaSelecionada.value = null;
        } finally {
            loadingMedidas.value = false;
            medidasCarregada.value = true;
        }
    };

    /**
     * Abrir dialog de criação de medida
     */
    const abrirCriacaoMedida = async () => {
        // Inicializar formulário com valores padrão
        formularioMedida.value = {
            data_avaliacao: new Date(),
            peso: null,
            altura: null,
            imc: null,
            perc_gordura_corporal: null,
            perc_massa_magra: null,
            idade_metabolica: null,
            circunferencia_cintura: null,
            circunferencia_quadril: null,
            relacao_cintura_quadril: null,
            circunferencia_abdominal: null,
            circunferencia_braco: null,
            circunferencia_coxa_direita: null,
            circunferencia_coxa_esquerda: null,
            circunferencia_panturrilha: null,
            circunferencia_torax: null,
            dobra_subescapular: null,
            dobra_tricipital: null,
            dobra_bicipital: null,
            dobra_suprailíaca: null,
            dobra_abdominal: null,
            dobra_coxal: null,
            dobra_peitoral: null,
            pressao_arterial_sistolica: null,
            pressao_arterial_diastolica: null,
            frequencia_cardiaca: null,
            tmb: null,
            gasto_energetico_total: null,
            nivel_atividade: 'leve',
            observacoes: ''
        };
        pressaoArterialCombinada.value = '';
        showDialogCriacaoMedida.value = true;

        // Buscar dados da última anamnese para preencher campos
        try {
            const response = await AnamneseService.obterAnamnesePaciente(paciente.value.id);
            if (response.data.success && response.data.data) {
                const anamneseData = response.data.data;

                // Preencher peso
                if (anamneseData.peso_atual) {
                    formularioMedida.value.peso = parseFloat(anamneseData.peso_atual);
                }

                // Preencher altura
                if (anamneseData.altura) {
                    formularioMedida.value.altura = parseFloat(anamneseData.altura);
                }

                // Definir nível de atividade baseado nos dados da anamnese
                if (anamneseData.faz_exercicios && anamneseData.frequencia_exercicio_semana) {
                    const frequencia = parseInt(anamneseData.frequencia_exercicio_semana);
                    if (frequencia >= 5) {
                        formularioMedida.value.nivel_atividade = 'intenso';
                    } else if (frequencia >= 3) {
                        formularioMedida.value.nivel_atividade = 'moderado';
                    } else if (frequencia > 0) {
                        formularioMedida.value.nivel_atividade = 'leve';
                    } else {
                        formularioMedida.value.nivel_atividade = 'sedentario';
                    }
                } else {
                    formularioMedida.value.nivel_atividade = 'sedentario';
                }

                // Calcular TMB automaticamente se temos todos os dados necessários
                if (paciente.value?.data_nascimento && formularioMedida.value.peso && formularioMedida.value.altura) {
                    await nextTick();
                    const idade = calcularIdade(paciente.value.data_nascimento);
                    const tmb = calcularTMB(formularioMedida.value.peso, formularioMedida.value.altura, idade, paciente.value.sexo);
                    if (tmb) {
                        formularioMedida.value.tmb = tmb;
                    }
                }
            }
        } catch (error) {
            console.warn('Erro ao buscar anamnese para preencher medida:', error);
            // Continuar mesmo se não conseguir buscar a anamnese
        }
    };

    /**
     * Fechar dialog de criação de medida
     */
    const fecharCriacaoMedida = () => {
        showDialogCriacaoMedida.value = false;
        formularioMedida.value = {};
        pressaoArterialCombinada.value = '';
    };

    /**
     * Calcular TMB usando Harris-Benedict e preencher o campo
     */
    const calcularTMBParam = () => {
        if (!paciente.value?.data_nascimento || !formularioMedida.value.peso || !formularioMedida.value.altura) {
            toast.add({
                severity: 'warn',
                summary: 'Dados incompletos',
                detail: 'Preencha peso, altura e verifique se a data de nascimento do paciente está registrada',
                life: 3000
            });
            return;
        }

        const idade = calcularIdade(paciente.value.data_nascimento);
        const tmb = calcularTMB(formularioMedida.value.peso, formularioMedida.value.altura, idade, paciente.value.sexo);

        if (tmb) {
            formularioMedida.value.tmb = tmb;
            toast.add({
                severity: 'success',
                summary: 'TMB calculado',
                detail: `TMB: ${tmb} kcal/dia${!paciente.value.sexo ? ' (referência masculina)' : ''}`,
                life: 3000
            });
        }
    };

    /**
     * Salvar medida do paciente
     */
    const salvarMedida = async () => {
        loadingCriacaoMedida.value = true;

        try {
            const idPaciente = route.params.id;
            console.log('📝 Salvando medida para paciente:', idPaciente);

            // Converter a data para o formato YYYY-MM-DD
            let dataFormatada = null;
            if (formularioMedida.value.data_avaliacao) {
                const date = new Date(formularioMedida.value.data_avaliacao);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                dataFormatada = `${year}-${month}-${day}`;
            }

            // Preparar dados para enviar (todos os campos, apenas se preenchidos)
            const dadosMedida = {};

            // Data
            if (dataFormatada) dadosMedida.data_avaliacao = dataFormatada;

            // Dados Antropométricos Básicos
            if (formularioMedida.value.peso !== null && formularioMedida.value.peso !== '') {
                dadosMedida.peso = formularioMedida.value.peso.toString();
            }
            if (formularioMedida.value.altura !== null && formularioMedida.value.altura !== '') {
                dadosMedida.altura = formularioMedida.value.altura.toString();
            }

            // IMC (enviar mesmo sendo calculado no backend, para consistência)
            if (formularioMedida.value.imc !== null && formularioMedida.value.imc !== '') {
                dadosMedida.imc = formularioMedida.value.imc.toString();
            }

            // Percentuais e Composição Corporal
            if (formularioMedida.value.perc_gordura_corporal !== null && formularioMedida.value.perc_gordura_corporal !== '') {
                dadosMedida.perc_gordura_corporal = formularioMedida.value.perc_gordura_corporal.toString();
            }
            if (formularioMedida.value.perc_massa_magra !== null && formularioMedida.value.perc_massa_magra !== '') {
                dadosMedida.perc_massa_magra = formularioMedida.value.perc_massa_magra.toString();
            }
            if (formularioMedida.value.idade_metabolica !== null && formularioMedida.value.idade_metabolica !== '') {
                dadosMedida.idade_metabolica = formularioMedida.value.idade_metabolica;
            }

            // Circunferências
            if (formularioMedida.value.circunferencia_cintura !== null && formularioMedida.value.circunferencia_cintura !== '') {
                dadosMedida.circunferencia_cintura = formularioMedida.value.circunferencia_cintura.toString();
            }
            if (formularioMedida.value.circunferencia_quadril !== null && formularioMedida.value.circunferencia_quadril !== '') {
                dadosMedida.circunferencia_quadril = formularioMedida.value.circunferencia_quadril.toString();
            }
            if (formularioMedida.value.circunferencia_abdominal !== null && formularioMedida.value.circunferencia_abdominal !== '') {
                dadosMedida.circunferencia_abdominal = formularioMedida.value.circunferencia_abdominal.toString();
            }
            if (formularioMedida.value.circunferencia_braco !== null && formularioMedida.value.circunferencia_braco !== '') {
                dadosMedida.circunferencia_braco = formularioMedida.value.circunferencia_braco.toString();
            }
            if (formularioMedida.value.circunferencia_coxa_direita !== null && formularioMedida.value.circunferencia_coxa_direita !== '') {
                dadosMedida.circunferencia_coxa_direita = formularioMedida.value.circunferencia_coxa_direita.toString();
            }
            if (formularioMedida.value.circunferencia_coxa_esquerda !== null && formularioMedida.value.circunferencia_coxa_esquerda !== '') {
                dadosMedida.circunferencia_coxa_esquerda = formularioMedida.value.circunferencia_coxa_esquerda.toString();
            }
            if (formularioMedida.value.circunferencia_panturrilha !== null && formularioMedida.value.circunferencia_panturrilha !== '') {
                dadosMedida.circunferencia_panturrilha = formularioMedida.value.circunferencia_panturrilha.toString();
            }
            if (formularioMedida.value.circunferencia_torax !== null && formularioMedida.value.circunferencia_torax !== '') {
                dadosMedida.circunferencia_torax = formularioMedida.value.circunferencia_torax.toString();
            }

            // Dobras Cutâneas
            if (formularioMedida.value.dobra_subescapular !== null && formularioMedida.value.dobra_subescapular !== '') {
                dadosMedida.dobra_subescapular = formularioMedida.value.dobra_subescapular.toString();
            }
            if (formularioMedida.value.dobra_tricipital !== null && formularioMedida.value.dobra_tricipital !== '') {
                dadosMedida.dobra_tricipital = formularioMedida.value.dobra_tricipital.toString();
            }
            if (formularioMedida.value.dobra_bicipital !== null && formularioMedida.value.dobra_bicipital !== '') {
                dadosMedida.dobra_bicipital = formularioMedida.value.dobra_bicipital.toString();
            }
            if (formularioMedida.value.dobra_suprailíaca !== null && formularioMedida.value.dobra_suprailíaca !== '') {
                dadosMedida.dobra_suprailíaca = formularioMedida.value.dobra_suprailíaca.toString();
            }
            if (formularioMedida.value.dobra_abdominal !== null && formularioMedida.value.dobra_abdominal !== '') {
                dadosMedida.dobra_abdominal = formularioMedida.value.dobra_abdominal.toString();
            }
            if (formularioMedida.value.dobra_coxal !== null && formularioMedida.value.dobra_coxal !== '') {
                dadosMedida.dobra_coxal = formularioMedida.value.dobra_coxal.toString();
            }
            if (formularioMedida.value.dobra_peitoral !== null && formularioMedida.value.dobra_peitoral !== '') {
                dadosMedida.dobra_peitoral = formularioMedida.value.dobra_peitoral.toString();
            }

            // Dados Cardiovasculares
            if (formularioMedida.value.pressao_arterial_sistolica !== null && formularioMedida.value.pressao_arterial_sistolica !== '') {
                dadosMedida.pressao_arterial_sistolica = formularioMedida.value.pressao_arterial_sistolica;
            }
            if (formularioMedida.value.pressao_arterial_diastolica !== null && formularioMedida.value.pressao_arterial_diastolica !== '') {
                dadosMedida.pressao_arterial_diastolica = formularioMedida.value.pressao_arterial_diastolica;
            }
            if (formularioMedida.value.frequencia_cardiaca !== null && formularioMedida.value.frequencia_cardiaca !== '') {
                dadosMedida.frequencia_cardiaca = formularioMedida.value.frequencia_cardiaca;
            }

            // Gasto Energético
            if (formularioMedida.value.nivel_atividade) {
                dadosMedida.nivel_atividade = formularioMedida.value.nivel_atividade;
            }
            if (formularioMedida.value.tmb !== null && formularioMedida.value.tmb !== '') {
                dadosMedida.tmb = formularioMedida.value.tmb.toString();
            }
            if (formularioMedida.value.gasto_energetico_total !== null && formularioMedida.value.gasto_energetico_total !== '') {
                dadosMedida.gasto_energetico_total = formularioMedida.value.gasto_energetico_total.toString();
            }

            // Observações
            if (formularioMedida.value.observacoes) {
                dadosMedida.observacoes = formularioMedida.value.observacoes;
            }

            console.log('📤 Dados da medida a serem enviados:', dadosMedida);

            const response = await MedidaService.criarMedida(idPaciente, dadosMedida);

            console.log('✅ Medida criada:', response.data);

            if (response.data.success) {
                fecharCriacaoMedida();
                await carregarMedidas();

                toast.add({
                    severity: 'success',
                    summary: 'Sucesso!',
                    detail: 'Medida criada com sucesso',
                    life: 3000
                });
            } else {
                throw new Error(response.data.message || 'Erro ao criar medida');
            }
        } catch (error) {
            console.error('❌ Erro ao salvar medida:', error);
            toast.add({
                severity: 'error',
                summary: 'Erro',
                detail: error.response?.data?.message || 'Erro ao salvar a medida',
                life: 3000
            });
        } finally {
            loadingCriacaoMedida.value = false;
        }
    };

    /**
     * Deletar medida
     */
    const deletarMedida = (event, idMedida) => {
        confirm.require({
            target: event.currentTarget,
            message: 'Tem certeza que deseja deletar esta medida?',
            icon: 'pi pi-exclamation-triangle',
            defaultFocus: 'reject',
            rejectButtonProps: {
                label: 'Cancelar',
                severity: 'secondary',
                outlined: true
            },
            acceptButtonProps: {
                label: 'Deletar',
                severity: 'danger'
            },
            accept: async () => {
                try {
                    const idPaciente = route.params.id;
                    await MedidaService.deletarMedida(idPaciente, idMedida);

                    toast.add({
                        severity: 'success',
                        summary: 'Sucesso',
                        detail: 'Medida deletada com sucesso',
                        life: 3000
                    });

                    await carregarMedidas();
                } catch (error) {
                    console.error('❌ Erro ao deletar medida:', error);
                    toast.add({
                        severity: 'error',
                        summary: 'Erro',
                        detail: 'Erro ao deletar a medida',
                        life: 3000
                    });
                }
            }
        });
    };

    // ===== WATCHERS =====

    /**
     * Carregar medidas quando a aba é ativada
     */
    watch(
        () => activeTab?.value,
        (novaTab) => {
            if (novaTab === 'medidas' && !medidasCarregada.value) {
                carregarMedidas();
            }
        }
    );

    // ===== RETORNO DO COMPOSABLE =====

    return {
        // Refs (estado)
        medidas,
        loadingMedidas,
        erroMedidas,
        medidasCarregada,
        medidaSelecionada,
        medidaMaisRecente,
        showDialogCriacaoMedida,
        loadingCriacaoMedida,
        formularioMedida,
        pressaoArterialCombinada,

        // Computed
        imcComClassificacao,
        massaMagraCalculada,
        rcqComClassificacao,
        getCalculado,

        // Funções
        carregarMedidas,
        abrirCriacaoMedida,
        fecharCriacaoMedida,
        calcularTMBParam,
        salvarMedida,
        deletarMedida
    };
}
