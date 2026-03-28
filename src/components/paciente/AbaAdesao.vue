<template>
    <div class="space-y-6 p-6">
        <!-- Estado Vazio -->
        <div v-if="!temPlanoAtivo" class="flex flex-col items-center justify-center py-20">
            <i class="pi pi-chart-bar text-6xl text-gray-300 mb-4"></i>
            <h3 class="text-xl font-semibold text-gray-600 mb-2">Nenhum plano ativo</h3>
            <p class="text-gray-500 text-center mb-6 max-w-md">O paciente precisa ter um plano alimentar ativo para registrar adesão.</p>
            <Button label="Ver planos alimentares" icon="pi pi-arrow-right" severity="success" @click="irParaPlanos" />
        </div>

        <!-- Estado com dados -->
        <div v-else class="space-y-6">
            <!-- SEÇÃO 1: Filtros e Header -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 class="text-2xl font-bold text-gray-900">Adesão ao Plano Alimentar</h2>
                <div class="flex flex-col sm:flex-row gap-3">
                    <!-- Filtro de período -->
                    <Dropdown v-model="periodoSelecionado" :options="periodos" optionLabel="label" optionValue="value" @change="carregarDados" class="w-full sm:w-48" />

                    <!-- Filtro de plano -->
                    <Dropdown
                        v-if="planosDisponiveis.length >= 1"
                        v-model="planoSelecionado"
                        :options="[{ id: null, nome: 'Todos os planos' }, ...planosDisponiveis]"
                        optionLabel="nome"
                        optionValue="id"
                        @change="carregarDados"
                        class="w-full sm:w-48"
                    />
                </div>
            </div>

            <!-- Estado de loading -->
            <div v-if="loading" class="space-y-6">
                <Skeleton height="100px" />
                <Skeleton height="200px" />
                <Skeleton height="150px" />
            </div>

            <!-- Estado de erro -->
            <div v-else-if="erro" class="bg-red-50 border border-red-200 rounded-lg p-4">
                <div class="flex gap-3">
                    <span class="text-red-600 font-bold text-xl">!</span>
                    <div class="flex-1">
                        <p class="text-sm font-semibold text-red-900">Erro ao carregar adesão</p>
                        <p class="text-sm text-red-700 mt-1">{{ erro }}</p>
                    </div>
                    <Button icon="pi pi-refresh" severity="danger" text @click="carregarDados" class="px-4" />
                </div>
            </div>

            <!-- Estado vazio - Sem adesões cadastradas -->
            <div v-else-if="!loading && !resumo && !erro" class="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-lg border border-gray-200">
                <i class="pi pi-inbox text-6xl text-gray-300 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-600 mb-2">Nenhuma adesão registrada</h3>
                <p class="text-gray-500 text-center mb-6 max-w-md">O paciente ainda não possui registros de adesão para este período e plano.</p>
                <p class="text-sm text-gray-400">Os registros aparecerão aqui quando o paciente começar a registrar sua adesão ao plano.</p>
            </div>

            <!-- SEÇÃO 2: Cards de resumo -->
            <div v-else-if="resumo && resumo.geral" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Card 1: Adesão Geral -->
                <div class="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
                    <div class="flex items-center justify-between mb-4">
                        <p class="text-gray-600 text-sm">ADESÃO GERAL</p>
                        <i class="pi pi-chart-pie text-emerald-600 text-lg"></i>
                    </div>
                    <div class="mb-4">
                        <p class="text-4xl font-bold text-emerald-600">{{ resumo.geral.percentual_adesao }}%</p>
                        <p class="text-gray-500 text-sm mt-1">de adesão no período</p>
                    </div>
                    <ProgressBar :value="resumo.geral.percentual_adesao" :class="`h-2 ${getCorProgressoGeral}`" />
                </div>

                <!-- Card 2: Seguiu o plano -->
                <div class="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
                    <div class="flex items-center justify-between mb-4">
                        <p class="text-gray-600 text-sm">SEGUIU O PLANO</p>
                        <i class="pi pi-check-circle text-emerald-600 text-lg"></i>
                    </div>
                    <p class="text-4xl font-bold text-emerald-600">{{ resumo.geral.seguiu }}</p>
                    <p class="text-gray-500 text-sm mt-1">refeições seguidas</p>
                </div>

                <!-- Card 3: Parcial -->
                <div class="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
                    <div class="flex items-center justify-between mb-4">
                        <p class="text-gray-600 text-sm">PARCIAL</p>
                        <i class="pi pi-circle-fill text-yellow-600 text-lg"></i>
                    </div>
                    <p class="text-4xl font-bold text-yellow-600">{{ resumo.geral.parcial }}</p>
                    <p class="text-gray-500 text-sm mt-1">refeições parciais</p>
                </div>

                <!-- Card 4: Pulou -->
                <div class="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
                    <div class="flex items-center justify-between mb-4">
                        <p class="text-gray-600 text-sm">PULOU</p>
                        <i class="pi pi-times-circle text-red-600 text-lg"></i>
                    </div>
                    <p class="text-4xl font-bold text-red-600">{{ resumo.geral.pulou }}</p>
                    <p class="text-gray-500 text-sm mt-1">refeições puladas</p>
                </div>
            </div>

            <!-- SEÇÃO 3: Adesão por refeição -->
            <div v-if="resumo && resumo.por_refeicao && resumo.por_refeicao.length > 0" class="space-y-4 bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
                <h3 class="text-lg font-bold text-gray-900">Desempenho por refeição</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div v-for="refeicao in refeicoesOrdenadas" :key="refeicao.nome" class="p-4 border border-gray-100 rounded-lg">
                        <div class="flex items-center justify-between mb-3">
                            <p class="font-semibold text-gray-900">{{ refeicao.nome }}</p>
                            <p class="text-sm font-bold text-gray-600">{{ refeicao.percentual }}%</p>
                        </div>
                        <ProgressBar :value="refeicao.percentual" class="mb-3 h-2" />
                        <div class="flex gap-2">
                            <Badge :value="`${refeicao.seguiu} seguiu`" severity="success" />
                            <Badge :value="`${refeicao.parcial} parcial`" severity="warning" />
                            <Badge :value="`${refeicao.pulou} pulou`" severity="danger" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- SEÇÃO 4: Calendário de adesão -->
            <div v-if="adesoes && adesoes.length > 0" class="space-y-4 bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
                <h3 class="text-lg font-bold text-gray-900 mb-2">Histórico por dia</h3>
                <p class="text-gray-500 text-sm mb-4">
                    <i class="pi pi-info-circle text-sm mr-2"></i>
                    Verde = seguiu todas, Amarelo = parcial, Vermelho = pulou alguma, Cinza = sem registro
                </p>

                <div class="flex flex-wrap gap-2 bg-gray-50 p-4 rounded-lg">
                    <button
                        v-for="dia in diasDoMes"
                        :key="dia.data"
                        @click="selecionarDia(dia)"
                        :style="{
                            backgroundColor: getCorDia(dia),
                            width: '32px',
                            height: '32px',
                            borderRadius: '4px',
                            border: dia.data === diaSelecionado ? '2px solid #16a34a' : '1px solid #e5e7eb',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }"
                        class="hover:shadow-md hover:scale-110"
                        :title="formatarDataPT(dia.data)"
                    />
                </div>

                <!-- Detalhe do dia selecionado -->
                <div v-if="diaSelecionado && detalheDia" class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div class="flex items-center gap-2 mb-3">
                        <i class="pi pi-calendar text-blue-600"></i>
                        <p class="font-semibold text-gray-900">{{ formatarData(diaSelecionado) }}</p>
                    </div>
                    <div class="space-y-2">
                        <div v-for="refeicao in detalheDia" :key="refeicao.refeicao_id" class="flex items-start gap-3 p-2 bg-white rounded border border-blue-100">
                            <i :class="['pi text-lg pt-1', refeicao.status === 'seguiu' ? 'pi-check-circle text-emerald-600' : refeicao.status === 'parcial' ? 'pi-circle-fill text-yellow-600' : 'pi-times-circle text-red-600']"></i>
                            <div class="flex-1">
                                <p class="font-medium text-gray-900">{{ refeicao.refeicao_nome }}</p>
                                <p class="text-xs text-gray-500">{{ getStatusLabel(refeicao.status) }}</p>
                                <p v-if="refeicao.observacao" class="text-sm text-gray-600 mt-1">
                                    {{ refeicao.observacao }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- SEÇÃO 5: Tabela de registros recentes -->
            <div v-if="adesoes && adesoes.length > 0" class="space-y-4 bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
                <h3 class="text-lg font-bold text-gray-900">Registros recentes</h3>
                <DataTable :value="registrosRecentes" paginator :rows="20" class="text-sm">
                    <Column field="data" header="Data">
                        <template #body="{ data }">
                            {{ formatarData(data.data) }}
                        </template>
                    </Column>
                    <Column field="refeicao_nome" header="Refeição" />
                    <Column field="status" header="Status">
                        <template #body="{ data }">
                            <Badge :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" />
                        </template>
                    </Column>
                    <Column field="observacao" header="Observação">
                        <template #body="{ data }">
                            <p v-if="data.observacao" class="text-gray-600">{{ data.observacao }}</p>
                            <p v-else class="text-gray-400">—</p>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </div>
</template>

<script setup>
import AdesaoService from '@/service/AdesaoService';
import Badge from 'primevue/badge';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dropdown from 'primevue/dropdown';
import ProgressBar from 'primevue/progressbar';
import Skeleton from 'primevue/skeleton';
import { computed, onMounted, ref, watch } from 'vue';

const props = defineProps({
    paciente: {
        type: Object,
        required: true
    },
    planos: {
        type: Array,
        default: () => []
    }
});

const emit = defineEmits(['update:activeTab']);

// Estados
const adesoes = ref([]);
const resumo = ref(null);
const loading = ref(false);
const erro = ref(null);
const periodoSelecionado = ref('30d');
const planoSelecionado = ref(null);
const diaSelecionado = ref(null);
const contadorChamadas = ref(0);

// Opções de período
const periodos = [
    { label: 'Últimos 7 dias', value: '7d' },
    { label: 'Últimos 30 dias', value: '30d' },
    { label: 'Últimos 90 dias', value: '90d' }
];

// Computed: Planos disponíveis ativos
const planosDisponiveis = computed(() => {
    return (props.planos || []).filter((p) => p.status === 'ativo' || p.status === 'enviado');
});

// Computed: Tem plano ativo
const temPlanoAtivo = computed(() => {
    return planosDisponiveis.value.length > 0;
});

// Computed: Data início baseado no período
const dataInicio = computed(() => {
    const hoje = new Date();
    const dias = periodoSelecionado.value === '7d' ? 7 : periodoSelecionado.value === '90d' ? 90 : 30;
    const data = new Date(hoje);
    data.setDate(data.getDate() - dias);
    return data.toISOString().split('T')[0];
});

// Computed: Data fim = hoje
const dataFim = computed(() => {
    return new Date().toISOString().split('T')[0];
});

// Computed: Refeições ordenadas por percentual (menor primeiro)
const refeicoesOrdenadas = computed(() => {
    if (!resumo.value || !resumo.value.por_refeicao) return [];
    return [...resumo.value.por_refeicao].sort((a, b) => a.percentual - b.percentual);
});

// Computed: Dias do mês para o calendário
const diasDoMes = computed(() => {
    if (!adesoes.value || adesoes.value.length === 0) return [];

    const mapa = new Map();
    adesoes.value.forEach((adesao) => {
        const dia = adesao.data;
        if (!mapa.has(dia)) {
            mapa.set(dia, []);
        }
        mapa.get(dia).push(adesao);
    });

    const dias = Array.from(mapa).map(([data, registros]) => ({
        data,
        registros
    }));

    return dias.sort((a, b) => new Date(a.data) - new Date(b.data));
});

// Computed: Detalhe do dia selecionado
const detalheDia = computed(() => {
    if (!diaSelecionado.value) return null;
    const dia = diasDoMes.value.find((d) => d.data === diaSelecionado.value);
    return dia ? dia.registros : null;
});

// Computed: Registros recentes (últimos 20, ordenado por data DESC)
const registrosRecentes = computed(() => {
    if (!adesoes.value) return [];
    return [...adesoes.value].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 20);
});

// Funções helper
const formatarData = (dataStr) => {
    const data = new Date(dataStr + 'T00:00:00');
    return data.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
    });
};

const formatarDataPT = (dataStr) => {
    const data = new Date(dataStr + 'T00:00:00');
    return data.toLocaleDateString('pt-BR');
};

const getCorDia = (dia) => {
    const registros = dia.registros;
    if (!registros || registros.length === 0) return '#e5e7eb'; // cinza

    const temPulou = registros.some((r) => r.status === 'pulou');
    const temParcial = registros.some((r) => r.status === 'parcial');
    const todosSeguiu = registros.every((r) => r.status === 'seguiu');

    if (todosSeguiu) return '#16a34a'; // verde
    if (temPulou) return '#dc2626'; // vermelho
    if (temParcial) return '#ca8a04'; // amarelo
    return '#e5e7eb'; // cinza
};

const getCorProgressoGeral = () => {
    if (!resumo.value || !resumo.value.geral) return 'from-gray-500 to-gray-600';
    const valor = resumo.value.geral.percentual_adesao;
    if (valor >= 80) return 'from-emerald-500 to-emerald-600';
    if (valor >= 50) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
};

const getStatusLabel = (status) => {
    const labels = {
        seguiu: 'Seguiu',
        parcial: 'Parcial',
        pulou: 'Pulou'
    };
    return labels[status] || status;
};

const getStatusSeverity = (status) => {
    const severity = {
        seguiu: 'success',
        parcial: 'warning',
        pulou: 'danger'
    };
    return severity[status] || 'secondary';
};

const getTooltipDia = (dia) => {
    const registros = dia.registros;
    if (!registros || registros.length === 0) return 'Sem registro';

    const linhas = [`<strong>${formatarDataPT(dia.data)}</strong>`];
    registros.forEach((r) => {
        const emoji = r.status === 'seguiu' ? '✅' : r.status === 'parcial' ? '⚡' : '❌';
        linhas.push(`${emoji} ${r.refeicao_nome}`);
    });
    return linhas.join('<br>');
};

const selecionarDia = (dia) => {
    diaSelecionado.value = diaSelecionado.value === dia.data ? null : dia.data;
};

const irParaPlanos = () => {
    emit('update:activeTab', 'planos');
};

// Carregar dados
const carregarDados = async () => {
    // Evita chamadas simultâneas
    if (loading.value) {
        return;
    }

    loading.value = true;
    erro.value = null;

    try {
        const params = {
            data_inicio: dataInicio.value,
            data_fim: dataFim.value
        };

        if (planoSelecionado.value) {
            params.plano_id = planoSelecionado.value;
        }

        const [resAdesoes, resResumo] = await Promise.all([AdesaoService.listar(props.paciente.id, params), AdesaoService.resumo(props.paciente.id, params)]);

        // Transformar adesões: aplacar o array de adesões por dia
        const adesoesFlatted = [];
        (resAdesoes.data.data || []).forEach((dia) => {
            (dia.adesoes || []).forEach((adesao) => {
                adesoesFlatted.push({
                    data: dia.data,
                    refeicao_id: adesao.refeicao_id,
                    refeicao_nome: adesao.refeicao_nome,
                    status: adesao.status,
                    observacao: adesao.observacao
                });
            });
        });
        adesoes.value = adesoesFlatted;

        // Transformar resumo - acessa resResumo.data.data
        const resumoData = resResumo.data.data || {};

        // Garantir que tem a estrutura esperada
        if (!resumoData.geral) {
            resumoData.geral = {
                total_registros: 0,
                seguiu: 0,
                parcial: 0,
                pulou: 0,
                percentual_adesao: 0
            };
        }

        if (resumoData.por_refeicao && Array.isArray(resumoData.por_refeicao)) {
            resumoData.por_refeicao = resumoData.por_refeicao.map((r) => ({
                nome: r.nome_refeicao,
                percentual: r.percentual_adesao,
                seguiu: r.seguiu,
                parcial: r.parcial,
                pulou: r.pulou
            }));
        } else {
            resumoData.por_refeicao = [];
        }

        resumo.value = resumoData;
    } catch (error) {
        console.error('Erro ao carregar adesão:', error);
        erro.value = error.response?.data?.message || 'Erro ao carregar dados de adesão';
        // Limpar dados em caso de erro
        adesoes.value = [];
        resumo.value = null;
    } finally {
        loading.value = false;
    }
};

// Watchers
watch(
    () => [periodoSelecionado.value, planoSelecionado.value],
    () => {
        diaSelecionado.value = null;
        carregarDados();
    }
);

// Watcher: Detecta quando os planos ficam disponíveis (para primeira renderização)
watch(
    () => temPlanoAtivo.value,
    (temPlano) => {
        if (temPlano && !loading.value && !resumo.value && !adesoes.value.length) {
            carregarDados();
        }
    }
);

// Lifecycle
onMounted(() => {
    console.log('------------------------------------------------------>');
    console.log('abriu AbaAdesao, temPlanoAtivo:', temPlanoAtivo.value);
    console.log('------------------------------------------------------>');
    if (temPlanoAtivo.value) {
        carregarDados();
    } else {
        console.log('Paciente sem plano ativo, pulando carregamento de adesão');
    }
});

// const init = () => {
//     console.log('AbaAdesao inicializada');
//     carregarDados();
// };

// init();
</script>

<style scoped>
:deep(.p-progressbar) {
    background-color: #f3f4f6;
}

:deep(.p-progressbar .p-progressbar-value) {
    background: linear-gradient(to right, #10b981, #059669);
}
</style>
