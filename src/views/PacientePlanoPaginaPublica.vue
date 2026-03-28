<template>
    <!-- Toast Notification -->
    <Toast position="top-right" />

    <!-- Loading State -->
    <div v-if="loading" class="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-emerald-50 to-teal-50">
        <i class="pi pi-spin pi-spinner text-5xl text-emerald-600 mb-4"></i>
        <p class="text-gray-600 font-medium">Carregando plano alimentar...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="erro" class="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-emerald-50 to-teal-50 p-6">
        <div class="bg-white rounded-2xl shadow-lg border border-red-100 p-8 max-w-md text-center">
            <i class="pi pi-exclamation-circle text-5xl text-red-400 mb-4"></i>
            <h2 class="text-2xl font-bold text-gray-900 mb-2">Erro</h2>
            <p class="text-red-700 font-medium mb-6">{{ erro }}</p>
            <Button label="Voltar" severity="secondary" @click="voltar" />
        </div>
    </div>

    <!-- Main Content -->
    <main v-else-if="plano && refeicoes" class="min-h-screen bg-linear-to-br from-emerald-50 to-teal-50 p-6">
        <!-- Header -->
        <div class="max-w-4xl mx-auto mb-8">
            <div class="bg-white rounded-2xl shadow-lg border border-emerald-100 p-8">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <span class="text-2xl">🥗</span>
                        </div>
                        <div>
                            <h1 class="text-3xl font-bold text-emerald-900 -mb-1">{{ plano.nome }}</h1>
                            <p class="text-emerald-700">Seu plano alimentar personalizado</p>
                        </div>
                    </div>
                </div>

                <!-- Informações do Plano -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
                    <div>
                        <p class="text-sm text-gray-500 mb-1">Paciente</p>
                        <p class="text-lg font-semibold text-gray-900">{{ pacienteNome }}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 mb-1">Data Atual</p>
                        <p class="text-lg font-semibold text-emerald-700">{{ dataAtual ? new Date(dataAtual + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '-' }}</p>
                    </div>
                    <!-- <div>
                        <p class="text-sm text-gray-500 mb-1">Status do Plano</p>
                        <Tag :value="plano.status === 'ativo' ? 'Ativo' : 'Inativo'" :severity="plano.status === 'ativo' ? 'success' : 'secondary'" />
                    </div> -->
                </div>
            </div>
        </div>

        <!-- Data Selector Section -->
        <div class="max-w-4xl mx-auto mb-10">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-bold text-gray-800">Data para consulta</h2>
                <div class="flex gap-2">
                    <button
                        @click="semanaAnterior"
                        :disabled="!podeVoltarSemana"
                        :class="['p-2 rounded-full transition-colors border border-gray-200', podeVoltarSemana ? 'hover:bg-gray-200 text-gray-600 bg-white' : 'text-gray-300 bg-gray-50 cursor-not-allowed']"
                        title="Semana Anterior"
                    >
                        <i class="pi pi-chevron-left text-lg"></i>
                    </button>
                    <button @click="irParaHoje" class="px-3 py-2 rounded-full hover:bg-emerald-100 transition-colors text-emerald-600 border border-emerald-200 bg-white font-medium text-sm" title="Ir para hoje">Hoje</button>
                    <button
                        @click="proximaSemana"
                        :disabled="!podeAvancarSemana"
                        :class="['p-2 rounded-full transition-colors border border-gray-200', podeAvancarSemana ? 'hover:bg-gray-200 text-gray-600 bg-white' : 'text-gray-300 bg-gray-50 cursor-not-allowed']"
                        title="Próxima Semana"
                    >
                        <i class="pi pi-chevron-right text-lg"></i>
                    </button>
                </div>
            </div>

            <!-- Horizontal Date Picker -->
            <div class="flex justify-between items-center gap-2 overflow-x-auto pb-2">
                <button
                    v-for="dia in diasDaSemana"
                    :key="dia.data"
                    @click="selecionarData(dia.data)"
                    :disabled="!podeSelecionar(dia.data)"
                    :class="[
                        'flex-1 min-w-[80px] flex flex-col items-center py-3 px-2 rounded-xl transition-all',
                        !podeSelecionar(dia.data)
                            ? 'bg-gray-100 border border-gray-200 text-gray-300 cursor-not-allowed'
                            : dataSelecionada === dia.data
                              ? 'bg-emerald-600 border border-emerald-600 text-white shadow-lg shadow-emerald-100'
                              : 'bg-white border border-gray-200 hover:border-emerald-600 text-gray-700'
                    ]"
                >
                    <span :class="['text-xs font-medium uppercase', !podeSelecionar(dia.data) ? 'text-gray-300' : dataSelecionada === dia.data ? 'text-emerald-50' : 'text-gray-400']">
                        {{ dia.dia }}
                    </span>
                    <span :class="['text-lg font-bold mt-1', !podeSelecionar(dia.data) ? 'text-gray-300' : dataSelecionada === dia.data ? 'text-white' : 'text-gray-700']">
                        {{ dia.dia_numero }}
                    </span>
                </button>
            </div>
        </div>

        <!-- Refeições -->
        <div class="max-w-4xl mx-auto">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Registre sua adesão ao plano</h2>

            <div class="space-y-4">
                <div v-for="refeicao in refeicoes" :key="refeicao.id" class="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <h3 class="text-xl font-bold text-gray-900 mb-1">{{ refeicao.nome }}</h3>
                            <p class="text-sm text-gray-500 flex items-center gap-2">
                                <i class="pi pi-clock text-sm"></i>
                                {{ refeicao.horario_sugerido || 'Horário não definido' }}
                            </p>

                            <!-- Adesão registrada -->
                            <div v-if="refeicao.adesao" class="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                <div class="flex items-start justify-between">
                                    <div class="flex-1">
                                        <p class="text-xs text-emerald-600 font-medium mb-2">
                                            <i class="pi pi-check-circle mr-1"></i>
                                            Adesão Registrada
                                        </p>
                                        <div class="space-y-2">
                                            <div>
                                                <span class="text-xs font-semibold text-gray-700">Status: </span>
                                                <Tag :value="formatarStatusAdesao(refeicao.adesao.status)" :severity="getCorStatusAdesao(refeicao.adesao.status)" class="text-xs" />
                                            </div>
                                            <div v-if="refeicao.adesao.observacao && refeicao.adesao.observacao.trim()">
                                                <p class="text-xs text-gray-700">
                                                    <span class="font-semibold">Observação:</span>
                                                    <br />
                                                    {{ refeicao.adesao.observacao.trim() }}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Button v-if="!refeicao.adesao" label="Registrar" icon="pi pi-plus" severity="success" @click="abrirFormulario(refeicao)" class="ml-4" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal de registro -->
        <ModalRegistroAdesao ref="modalRegistro" :refeicao="refeicaoSelecionada" :token="token" @adesao-registrada="handleAdesaoRegistrada" />
    </main>
</template>

<script setup>
import ModalRegistroAdesao from '@/components/ModalRegistroAdesao.vue';
import PlanoPublicoService from '@/service/PlanoPublicoService';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const token = ref(route.params.token);
const toast = useToast();

// Estados
const loading = ref(true);
const erro = ref(null);
const plano = ref(null);
const refeicoes = ref([]);
const ultimasAdesoes = ref({});
const refeicoesRegistradasHoje = ref(new Set());
const pacienteNome = ref('Paciente');
const dataAtual = ref(null);
const refeicaoSelecionada = ref(null);
const modalRegistro = ref(null);
const dataSelecionada = ref(null);
const semanaBase = ref(new Date());
const dataPlanoAlimentarCriadoEm = ref(null);

/**
 * Calcular os dias da semana a partir da semanaBase
 */
const diasDaSemana = computed(() => {
    const dias = [];
    const hoje = new Date(semanaBase.value);

    // Encontrar o primeiro dia (segunda-feira) da semana
    const primeiroDia = new Date(hoje);
    const dia = primeiroDia.getDay();
    const diff = primeiroDia.getDate() - dia + (dia === 0 ? -6 : 1); // Ajusta para começar na segunda
    primeiroDia.setDate(diff);

    // Gerar 7 dias da semana
    for (let i = 0; i < 7; i++) {
        const data = new Date(primeiroDia);
        data.setDate(primeiroDia.getDate() + i);

        const dataFormatada = data.toISOString().split('T')[0];
        const nomeDia = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

        dias.push({
            data: dataFormatada,
            dia: nomeDia[data.getDay()],
            dia_numero: data.getDate()
        });
    }

    return dias;
});

/**
 * Verificar se pode voltar semana (não pode voltar antes da data de criação)
 */
const podeVoltarSemana = computed(() => {
    if (!dataPlanoAlimentarCriadoEm.value) return true;

    const dataAtualBase = new Date(semanaBase.value);
    const primeiroDiaAtual = new Date(dataAtualBase);
    const dia = primeiroDiaAtual.getDay();
    const diff = primeiroDiaAtual.getDate() - dia + (dia === 0 ? -6 : 1);
    primeiroDiaAtual.setDate(diff);

    const dataCriacao = new Date(dataPlanoAlimentarCriadoEm.value + 'T00:00:00');
    const primeiroDiaCriacao = new Date(dataCriacao);
    const diaC = primeiroDiaCriacao.getDay();
    const diffC = primeiroDiaCriacao.getDate() - diaC + (diaC === 0 ? -6 : 1);
    primeiroDiaCriacao.setDate(diffC);

    // Pode voltar se o primeiro dia atual for maior que o primeiro dia de criação
    return primeiroDiaAtual > primeiroDiaCriacao;
});

/**
 * Verificar se pode avançar semana (não pode avançar depois da data atual)
 */
const podeAvancarSemana = computed(() => {
    if (!dataAtual.value) return false;

    const proximaSemanaBase = new Date(semanaBase.value);
    proximaSemanaBase.setDate(proximaSemanaBase.getDate() + 7);

    const primeiroDiaProxima = new Date(proximaSemanaBase);
    const dia = primeiroDiaProxima.getDay();
    const diff = primeiroDiaProxima.getDate() - dia + (dia === 0 ? -6 : 1);
    primeiroDiaProxima.setDate(diff);

    const dataAtualPlano = new Date(dataAtual.value + 'T00:00:00');
    dataAtualPlano.setHours(0, 0, 0, 0);

    primeiroDiaProxima.setHours(0, 0, 0, 0);

    // Pode avançar se o primeiro dia da próxima semana for <= data atual
    return primeiroDiaProxima <= dataAtualPlano;
});

/**
 * Semana anterior
 */
const semanaAnterior = () => {
    if (!podeVoltarSemana.value) return;
    semanaBase.value.setDate(semanaBase.value.getDate() - 7);
    semanaBase.value = new Date(semanaBase.value);
};

/**
 * Próxima semana
 */
const proximaSemana = () => {
    if (!podeAvancarSemana.value) return;
    semanaBase.value.setDate(semanaBase.value.getDate() + 7);
    semanaBase.value = new Date(semanaBase.value);
};

/**
 * Verificar se pode selecionar a data
 * A data deve estar entre a data de criação e a data atual
 */
const podeSelecionar = (data) => {
    if (!dataPlanoAlimentarCriadoEm.value || !dataAtual.value) return false;

    // Converter para Date para comparação
    const dataSelecionada = new Date(data + 'T00:00:00');
    const dataCriacao = new Date(dataPlanoAlimentarCriadoEm.value + 'T00:00:00');
    const dataAtualPlano = new Date(dataAtual.value + 'T00:00:00');

    // Remover horas para comparar apenas datas
    dataSelecionada.setHours(0, 0, 0, 0);
    dataCriacao.setHours(0, 0, 0, 0);
    dataAtualPlano.setHours(0, 0, 0, 0);

    // Data deve ser >= data de criação E <= data atual
    return dataSelecionada >= dataCriacao && dataSelecionada <= dataAtualPlano;
};

/**
 * Ir para hoje
 */
const irParaHoje = () => {
    if (dataAtual.value) {
        semanaBase.value = new Date(dataAtual.value + 'T00:00:00');
        selecionarData(dataAtual.value);
    }
};

/**
 * Selecionar data
 */
const selecionarData = (data) => {
    // Validar se pode selecionar essa data
    if (!podeSelecionar(data)) {
        return;
    }
    dataSelecionada.value = data;
    // Aqui você pode adicionar lógica para filtrar refeições pela data
};

const voltar = () => {
    router.push('/');
};

const abrirFormulario = (refeicao) => {
    refeicaoSelecionada.value = refeicao;
    modalRegistro.value?.abrir();
};

const handleAdesaoRegistrada = async (dados) => {
    toast.add({
        severity: 'success',
        summary: 'Sucesso!',
        detail: `Adesão registrada com sucesso para ${refeicaoSelecionada.value.nome}`,
        life: 3000
    });

    modalRegistro.value?.fechar();

    // Recarregar dados para atualizar a UI
    await carregarDados();
};

/**
 * Formatar status da adesão para exibição
 */
const formatarStatusAdesao = (status) => {
    const mapa = {
        seguiu: 'Seguiu o plano',
        parcial: 'Seguiu parcialmente',
        pulou: 'Pulou a refeição'
    };
    return mapa[status] || status;
};

/**
 * Obter cor do badge de status
 */
const getCorStatusAdesao = (status) => {
    const cores = {
        seguiu: 'success',
        parcial: 'warn',
        pulou: 'danger'
    };
    return cores[status] || 'info';
};

// Carregar dados
const carregarDados = async () => {
    loading.value = true;
    erro.value = null;

    try {
        // Buscar plano pelo token
        const resPlano = await PlanoPublicoService.obterPorToken(token.value);
        plano.value = resPlano.data.data;
        pacienteNome.value = plano.value.paciente_nome || 'Paciente';
        dataAtual.value = plano.value.data_atual;
        dataPlanoAlimentarCriadoEm.value = plano.value.plano_alimentar_criado_em;
        refeicoes.value = plano.value.refeicoes || [];

        // Inicializar data selecionada com a data atual
        if (dataAtual.value) {
            dataSelecionada.value = dataAtual.value;
            semanaBase.value = new Date(dataAtual.value + 'T00:00:00');
        }

        // Buscar últimas adesões
    } catch (error) {
        console.error('Erro ao carregar plano:', error);
        erro.value = error.response?.data?.message || 'Erro ao carregar plano. Link pode estar expirado ou inválido.';
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    carregarDados();
});
</script>

<style scoped>
:deep(.p-tag) {
    font-size: 0.85rem;
}
</style>
