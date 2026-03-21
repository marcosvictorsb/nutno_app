<template>
    <ModalCriacaoPlano
        :visible="props.visible"
        :step="stepAtualPlano"
        :paciente="paciente"
        :editandoPlanoId="editandoPlanoId"
        :loading="loadingCriacaoPlano"
        @update:visible="emit('update:visible', $event)"
        @update:step="stepAtualPlano = $event"
        @fechar="handleFechar"
        @avancar-step="avancarStep"
        @voltar-step="() => stepAtualPlano--"
        @salvar-plano="salvarPlano"
    >
        <!-- STEP 1: Configuração do Plano -->
        <template #step-1>
            <WizardStep1Configurar :formularioPlano="formularioPlano" :medidaMaisRecente="medidaMaisRecente" :anamnese="anamnese" @update:formularioPlano="(atualizado) => (formularioPlano = atualizado)" />
        </template>

        <!-- STEP 2: Refeições -->
        <template #step-2>
            <WizardStep2Refeicoes :formularioPlano="formularioPlano" @update:formularioPlano="(atualizado) => (formularioPlano = atualizado)" />
        </template>

        <!-- STEP 3: Revisão -->
        <template #step-3>
            <WizardStep3Revisao :formularioPlano="formularioPlano" :paciente="paciente" />
        </template>

        <!-- STEP 4: Enviar -->
        <template #step-4>
            <WizardStep4Enviar :formularioPlano="formularioPlano" :paciente="paciente" :linkPlano="linkPlanoGerado" @enviar-depois="fecharCriacaoPlano" @fechar="fecharCriacaoPlano" />
        </template>

        <!-- Footer Buttons -->
        <template #footer-buttons>
            <Button v-if="stepAtualPlano === 1" label="Próximo" severity="success" @click="avancarStep" icon="pi pi-chevron-right" icon-pos="right" />
            <Button v-else-if="stepAtualPlano === 2" label="Próximo" severity="success" @click="avancarStep" icon="pi pi-chevron-right" icon-pos="right" />
            <Button v-else-if="stepAtualPlano === 3" label="Salvar Plano" severity="success" @click="salvarPlano" :loading="loadingCriacaoPlano" icon="pi pi-check" />
        </template>
    </ModalCriacaoPlano>
</template>

<script setup>
import ModalCriacaoPlano from '@/components/ModalCriacaoPlano.vue';
import WizardStep1Configurar from '@/components/wizard/WizardStep1Configurar.vue';
import WizardStep2Refeicoes from '@/components/wizard/WizardStep2Refeicoes.vue';
import WizardStep3Revisao from '@/components/wizard/WizardStep3Revisao.vue';
import WizardStep4Enviar from '@/components/wizard/WizardStep4Enviar.vue';
import { usePlanosAlimentares } from '@/composables/usePlanosAlimentares';
import PlanoAlimentarService from '@/service/PlanoAlimentarService';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const toast = useToast();
const route = useRoute();
const { inicializarRefeicoes } = usePlanosAlimentares();

// ========== PROPS & EMITS ==========
const props = defineProps({
    paciente: {
        type: Object,
        required: true
    },
    editandoPlanoId: [String, Number],
    visible: Boolean,
    loading: Boolean,
    medidaMaisRecente: Object,
    anamnese: Object,
    linkPlano: String
});

const emit = defineEmits(['update:visible', 'fechar', 'concluido']);

// ========== STATE ==========
const stepAtualPlano = ref(1);
const loadingCriacaoPlano = ref(false);
const errosPlano = ref({});
const linkPlanoGerado = ref('');

// Macro tracking flags
const macrosForamEditadosManualmente = ref(false);
const macrosSugeridosPor = ref(null);
const atualizandoMacrosProgramaticamente = ref(false);
const objetivoPreSelecionadoCom = ref(null);

// Tracking flags for calories
const calorias_metaEditada = ref(false);
const calorias_metaSugeridaPor = ref(null);
const formularioPlanoCalorias_metaOriginal = ref(2000);

// Formulário padrão
const formularioPlano = ref({
    nome: '',
    objetivo: '',
    calorias_meta: 2000,
    refeicoes_dia: 5,
    proteina_g: 150,
    proteina_perc: 30,
    carboidrato_g: 250,
    carboidrato_perc: 45,
    gordura_g: 66,
    gordura_perc: 25,
    refeicoes: [],
    notas: ''
});

// ========== COMPUTED ==========
// Removed modalVisible - now using props.visible directly

// ========== WATCH & LIFECYCLE ==========
// Load plan data or measures when wizard opens
watch(
    () => props.visible,
    async (isVisible) => {
        if (isVisible) {
            try {
                const idPaciente = route.params.id;

                if (props.editandoPlanoId) {
                    // Modo edição - carregar dados do plano
                    const responsePlano = await PlanoAlimentarService.buscar(idPaciente, props.editandoPlanoId);
                    const planoData = responsePlano.dados;

                    if (!planoData) {
                        throw new Error(`Plano com ID ${props.editandoPlanoId} não encontrado`);
                    }

                    formularioPlano.value = {
                        nome: planoData.nome || '',
                        objetivo: planoData.objetivo || '',
                        calorias_meta: parseFloat(planoData.calorias_objetivo) || 2000,
                        refeicoes_dia: (planoData.refeicoes && planoData.refeicoes.length) || 5,
                        proteina_g: 150,
                        proteina_perc: parseFloat(planoData.proteinas_objetivo_pct) || 30,
                        carboidrato_g: 250,
                        carboidrato_perc: parseFloat(planoData.carboidratos_objetivo_pct) || 45,
                        gordura_g: 66,
                        gordura_perc: parseFloat(planoData.gorduras_objetivo_pct) || 25,
                        refeicoes: [],
                        notas: planoData.observacoes || ''
                    };

                    // Recalcular gramas
                    formularioPlano.value.proteina_g = Math.round((formularioPlano.value.calorias_meta * formularioPlano.value.proteina_perc) / 100 / 4);
                    formularioPlano.value.carboidrato_g = Math.round((formularioPlano.value.calorias_meta * formularioPlano.value.carboidrato_perc) / 100 / 4);
                    formularioPlano.value.gordura_g = Math.round((formularioPlano.value.calorias_meta * formularioPlano.value.gordura_perc) / 100 / 9);

                    // Mapear refeições se existirem
                    if (planoData.refeicoes && Array.isArray(planoData.refeicoes) && planoData.refeicoes.length > 0) {
                        formularioPlano.value.refeicoes = planoData.refeicoes.map((refeicaoApi) => {
                            const distribuicoes = {
                                'Café da manhã': 0.25,
                                'Lanche manhã': 0.1,
                                Almoço: 0.35,
                                'Lanche tarde': 0.1,
                                Jantar: 0.2
                            };
                            const percDistribuicao = distribuicoes[refeicaoApi.nome] || 0.2;

                            const itensMap = (refeicaoApi.itens || []).map((item) => ({
                                id: item.id,
                                alimento_id: item.alimento_id,
                                nome_alimento: item.alimento ? item.alimento.nome : '',
                                grupo_alimento: item.alimento ? item.alimento.grupo : '',
                                quantidade: parseFloat(item.quantidade),
                                unidade: item.unidade,
                                calorias_calculadas: parseFloat(item.calorias_calculadas),
                                proteinas_calculadas: parseFloat(item.proteinas_calculadas),
                                carboidratos_calculados: parseFloat(item.carboidratos_calculados),
                                gorduras_calculadas: parseFloat(item.gorduras_calculadas)
                            }));

                            let total_calorias = 0;
                            let total_proteinas_g = 0;
                            let total_carboidrato_g = 0;
                            let total_gordura_g = 0;
                            itensMap.forEach((item) => {
                                total_calorias += item.calorias_calculadas;
                                total_proteinas_g += item.proteinas_calculadas;
                                total_carboidrato_g += item.carboidratos_calculados;
                                total_gordura_g += item.gorduras_calculadas;
                            });

                            return {
                                id: refeicaoApi.id,
                                nome: refeicaoApi.nome || '',
                                horario: refeicaoApi.horario_sugerido ? refeicaoApi.horario_sugerido.substring(0, 5) : '',
                                ordem: refeicaoApi.ordem || 0,
                                notas: refeicaoApi.observacoes || '',
                                itens: itensMap,
                                meta_calorias: Math.round(formularioPlano.value.calorias_meta * percDistribuicao),
                                meta_proteinas_g: Math.round(formularioPlano.value.proteina_g * percDistribuicao),
                                meta_carboidrato_g: Math.round(formularioPlano.value.carboidrato_g * percDistribuicao),
                                meta_gordura_g: Math.round(formularioPlano.value.gordura_g * percDistribuicao),
                                total_calorias: Math.round(total_calorias * 10) / 10,
                                total_proteinas_g: Math.round(total_proteinas_g * 10) / 10,
                                total_carboidrato_g: Math.round(total_carboidrato_g * 10) / 10,
                                total_gordura_g: Math.round(total_gordura_g * 10) / 10
                            };
                        });
                    }

                    formularioPlanoCalorias_metaOriginal.value = formularioPlano.value.calorias_meta;
                    objetivoPreSelecionadoCom.value = null;
                    macrosSugeridosPor.value = null;
                } else {
                    // Modo criação - inicializar com dados da medida mais recente
                    if (props.medidaMaisRecente && props.medidaMaisRecente.gasto_energetico_total) {
                        const getValor = Math.round(parseFloat(props.medidaMaisRecente.gasto_energetico_total));
                        formularioPlano.value.calorias_meta = getValor;
                        formularioPlanoCalorias_metaOriginal.value = getValor;

                        // Recalcular gramas baseado no novo valor de calorias
                        formularioPlano.value.proteina_g = Math.round((getValor * formularioPlano.value.proteina_perc) / 100 / 4);
                        formularioPlano.value.carboidrato_g = Math.round((getValor * formularioPlano.value.carboidrato_perc) / 100 / 4);
                        formularioPlano.value.gordura_g = Math.round((getValor * formularioPlano.value.gordura_perc) / 100 / 9);
                    }

                    objetivoPreSelecionadoCom.value = null;
                    macrosSugeridosPor.value = null;
                }
            } catch (error) {
                toast.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: error.message || 'Erro ao carregar dados',
                    life: 3000
                });
            }
        } else {
            // Reset state when closing
            stepAtualPlano.value = 1;
            errosPlano.value = {};
            calorias_metaEditada.value = false;
            calorias_metaSugeridaPor.value = null;
            macrosForamEditadosManualmente.value = false;
            macrosSugeridosPor.value = null;
            atualizandoMacrosProgramaticamente.value = false;
        }
    }
);

// **REGRA 6**: Detectar edição manual de calorias_meta
watch(
    () => formularioPlano.value.calorias_meta,
    (novoValor) => {
        if (novoValor !== formularioPlanoCalorias_metaOriginal.value) {
            calorias_metaEditada.value = true;
        }
    }
);

// **REGRA 2**: Detectar edição manual de proteína
watch(
    () => formularioPlano.value.proteina_perc,
    (novoValor, valorAnterior) => {
        if (valorAnterior !== undefined && novoValor !== valorAnterior && !atualizandoMacrosProgramaticamente.value) {
            macrosForamEditadosManualmente.value = true;
        }
    }
);

// **REGRA 2**: Detectar edição manual de carboidrato
watch(
    () => formularioPlano.value.carboidrato_perc,
    (novoValor, valorAnterior) => {
        if (valorAnterior !== undefined && novoValor !== valorAnterior && !atualizandoMacrosProgramaticamente.value) {
            macrosForamEditadosManualmente.value = true;
        }
    }
);

// **REGRA 2**: Detectar edição manual de gordura
watch(
    () => formularioPlano.value.gordura_perc,
    (novoValor, valorAnterior) => {
        if (valorAnterior !== undefined && novoValor !== valorAnterior && !atualizandoMacrosProgramaticamente.value) {
            macrosForamEditadosManualmente.value = true;
        }
    }
);

// **REGRA 2**: Recalcular gramas quando percentuais ou calorias mudam
watch(
    () => [formularioPlano.value.proteina_perc, formularioPlano.value.carboidrato_perc, formularioPlano.value.gordura_perc, formularioPlano.value.calorias_meta],
    () => {
        const calorias = formularioPlano.value.calorias_meta;
        if (calorias && calorias > 0) {
            formularioPlano.value.proteina_g = Math.round((calorias * formularioPlano.value.proteina_perc) / 100 / 4);
            formularioPlano.value.carboidrato_g = Math.round((calorias * formularioPlano.value.carboidrato_perc) / 100 / 4);
            formularioPlano.value.gordura_g = Math.round((calorias * formularioPlano.value.gordura_perc) / 100 / 9);
        }
    }
);

// Debug watch for step changes
watch(
    () => stepAtualPlano.value,
    (novoStep, stepAnterior) => {}
);

// ========== VALIDATION FUNCTIONS ==========
const validarStep1Plano = () => {
    errosPlano.value = {};

    if (!formularioPlano.value.nome || formularioPlano.value.nome.trim() === '') {
        errosPlano.value.nome = 'Nome do plano é obrigatório';
    }

    if (!formularioPlano.value.objetivo || formularioPlano.value.objetivo.trim() === '') {
        errosPlano.value.objetivo = 'Objetivo do plano é obrigatório';
    }

    if (!formularioPlano.value.calorias_meta || formularioPlano.value.calorias_meta <= 0) {
        errosPlano.value.calorias_meta = 'Meta calórica é obrigatória e deve ser maior que 0';
    }

    return Object.keys(errosPlano.value).length === 0;
};

const validarStep2Plano = () => {
    const temAlimento = formularioPlano.value.refeicoes.some((ref) => ref.itens.length > 0);
    if (!temAlimento) {
        toast.add({
            severity: 'warn',
            summary: 'Refeições vazias',
            detail: 'Adicione pelo menos 1 alimento em alguma refeição para continuar.',
            life: 3000
        });
    }
    return temAlimento;
};

// ========== WIZARD NAVIGATION ==========
const avancarStep = () => {
    if (stepAtualPlano.value === 1) {
        if (validarStep1Plano()) {
            stepAtualPlano.value++;

            // Só inicializar refeições se estiver em MODO CRIAÇÃO
            if (!props.editandoPlanoId) {
                formularioPlano.value.refeicoes = inicializarRefeicoes(formularioPlano.value);
            } else {
                // Modo edição - manter refeições carregadas
            }
        } else {
            toast.add({
                severity: 'warn',
                summary: 'Campos obrigatórios',
                detail: 'Preencha todos os campos obrigatórios',
                life: 3000
            });
        }
    } else if (stepAtualPlano.value === 2) {
        if (validarStep2Plano()) {
            stepAtualPlano.value++;
        }
    } else {
        stepAtualPlano.value++;
    }
};

// ========== SAVE PLAN ==========
const salvarPlano = async () => {
    try {
        loadingCriacaoPlano.value = true;

        // Construir payload no formato esperado pela API
        const payload = {
            nome: formularioPlano.value.nome,
            objetivo: formularioPlano.value.objetivo,
            observacoes: formularioPlano.value.notas || '',
            calorias_objetivo: formularioPlano.value.calorias_meta,
            proteinas_objetivo_pct: formularioPlano.value.proteina_perc,
            carboidratos_objetivo_pct: formularioPlano.value.carboidrato_perc,
            gorduras_objetivo_pct: formularioPlano.value.gordura_perc,
            refeicoes: formularioPlano.value.refeicoes.map((refeicao) => ({
                nome: refeicao.nome,
                horario_sugerido: refeicao.horario ? `${refeicao.horario}:00` : '',
                ordem: refeicao.ordem,
                observacoes: refeicao.notas || '',
                itens: refeicao.itens.map((item) => ({
                    id_alimento: item.id,
                    quantidade: item.quantidade,
                    unidade: item.unidade,
                    observacoes: item.observacoes || ''
                }))
            }))
        };

        const idPaciente = props.paciente.id;
        let response;

        // Verificar se é modo edição ou criação
        if (props.editandoPlanoId) {
            response = await PlanoAlimentarService.atualizar(idPaciente, props.editandoPlanoId, payload);
            toast.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'Plano alimentar atualizado com sucesso!',
                life: 3000
            });
        } else {
            response = await PlanoAlimentarService.criar(idPaciente, payload);
            toast.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'Plano alimentar criado com sucesso!',
                life: 3000
            });
        }

        // Extrair token_visualizacao e gerar link do plano
        const planoData = Array.isArray(response.dados) ? response.dados[0] : response.dados;
        if (planoData && planoData.token_visualizacao) {
            const token = planoData.token_visualizacao;
            const baseUrl = import.meta.env.VITE_API_BASE_URL?.includes('localhost') || import.meta.env.DEV ? 'localhost:5173' : 'www.nutno.com.br';
            linkPlanoGerado.value = `${import.meta.env.DEV ? 'http://' : 'https://'}${baseUrl}/plano/${token}`;
        }

        // Avançar para Step 4 (Enviar)
        stepAtualPlano.value = 4;
        emit('concluido', response);
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: error.response?.data?.message || 'Erro ao salvar o plano alimentar',
            life: 3000
        });
    } finally {
        loadingCriacaoPlano.value = false;
    }
};

// ========== CLOSE WIZARD ==========
const fecharCriacaoPlano = () => {
    emit('update:visible', false);
    stepAtualPlano.value = 1;
    formularioPlano.value = {
        nome: '',
        objetivo: '',
        calorias_meta: 2000,
        refeicoes_dia: 5,
        proteina_g: 150,
        proteina_perc: 30,
        carboidrato_g: 250,
        carboidrato_perc: 45,
        gordura_g: 66,
        gordura_perc: 25,
        refeicoes: [],
        notas: ''
    };
    errosPlano.value = {};
    objetivoPreSelecionadoCom.value = null;
    macrosForamEditadosManualmente.value = false;
    macrosSugeridosPor.value = null;
    atualizandoMacrosProgramaticamente.value = false;
    emit('fechar');
};

const handleFechar = () => {
    fecharCriacaoPlano();
};
</script>
