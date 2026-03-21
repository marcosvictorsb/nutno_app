<template>
    <div class="space-y-2">
        <!-- Aviso se sem itens -->
        <div v-if="!temItens" class="bg-amber-50 border-l-4 border-amber-400 p-3 rounded">
            <p class="text-sm text-amber-800"><strong>⚠️ Aviso:</strong> Nenhuma refeição foi adicionada. Volte ao Step 2 e adicione alimentos.</p>
        </div>

        <!-- Card Principal: Resumo do Plano -->
        <div class="bg-linear-to-r from-emerald-50 to-emerald-100 p-4 rounded-lg border-2 border-emerald-200">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                <!-- Nome do Plano -->
                <div>
                    <p class="text-xs font-semibold text-slate-600 uppercase tracking-wider">Nome do Plano</p>
                    <p class="text-lg font-bold text-slate-800 mt-1">{{ formularioPlano.nome }}</p>
                </div>

                <!-- Objetivo -->
                <div>
                    <p class="text-xs font-semibold text-slate-600 uppercase tracking-wider">Objetivo</p>
                    <p class="text-lg font-bold text-slate-800 mt-1">{{ obterObjetivoFormatado }}</p>
                </div>

                <!-- Refeições/dia -->
                <div>
                    <p class="text-xs font-semibold text-slate-600 uppercase tracking-wider">Refeições/dia</p>
                    <p class="text-lg font-bold text-slate-800 mt-1">{{ formularioPlano.refeicoes_dia }}x</p>
                </div>

                <!-- Paciente -->
                <div>
                    <p class="text-xs font-semibold text-slate-600 uppercase tracking-wider">Paciente</p>
                    <p class="text-lg font-bold text-slate-800 mt-1">{{ paciente?.nome || 'N/A' }}</p>
                </div>
            </div>

            <!-- Divider -->
            <div class="h-px bg-emerald-200 my-2"></div>

            <!-- Meta Calórica -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <p class="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">Meta Calórica Diária</p>
                    <div class="flex items-end gap-4">
                        <div>
                            <p class="text-4xl font-bold text-emerald-600">{{ formularioPlano.calorias_meta }}</p>
                            <p class="text-xs text-slate-500 mt-1">kcal/dia</p>
                        </div>
                    </div>
                </div>

                <div v-if="temItens">
                    <p class="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">Total Consumido</p>
                    <div class="flex items-end gap-4">
                        <div>
                            <p class="text-4xl font-bold text-blue-600">{{ totaisPlano.totalCalorias?.toFixed(0) || 0 }}</p>
                            <p class="text-xs text-slate-500 mt-1">kcal/dia</p>
                        </div>
                        <Tag :value="`${percentualProgressoSeguro}%`" :severity="statusComparativo.severity" class="mb-2" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Progresso Calórico -->
        <div v-if="temItens" class="bg-white p-4 rounded-lg border border-slate-200">
            <div class="flex justify-between items-center mb-2">
                <p class="text-sm font-semibold text-slate-700">Progresso Calórico</p>
                <span class="text-sm font-bold text-slate-700">{{ percentualProgressoSeguro }}% ({{ diferencaCalorica.diferenca > 0 ? '+' : '' }}{{ diferencaCalorica.diferenca?.toFixed(0) || 0 }} kcal)</span>
            </div>
            <ProgressBar :value="percentualProgressoSeguro" class="mb-2">
                <template #default>
                    <div class="text-center text-white font-bold text-sm">{{ percentualProgressoSeguro }}%</div>
                </template>
            </ProgressBar>
            <div class="flex justify-between text-xs text-slate-500">
                <span>Meta: {{ formularioPlano.calorias_meta }} kcal</span>
                <span>Consumo: {{ totaisPlano.totalCalorias?.toFixed(0) || 0 }} kcal</span>
            </div>
        </div>

        <!-- Distribuição de Macronutrientes -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <!-- Meta de Macros -->
            <div class="bg-white p-4 rounded-lg border border-slate-200">
                <h4 class="font-semibold text-slate-800 mb-2 text-center">Meta de Macronutrientes</h4>
                <div class="space-y-2">
                    <div>
                        <div class="flex justify-between mb-2">
                            <p class="text-sm font-medium text-slate-700">Proteína</p>
                            <p class="text-sm font-semibold text-slate-800">{{ formularioPlano.proteina_g }}g ({{ formularioPlano.proteina_perc }}%)</p>
                        </div>
                        <ProgressBar :value="formularioPlano.proteina_perc" class="bg-red-100">
                            <template #default>
                                <div class="text-center text-white font-bold text-sm">{{ Math.round(formularioPlano.proteina_perc) }}%</div>
                            </template>
                        </ProgressBar>
                    </div>
                    <div>
                        <div class="flex justify-between mb-2">
                            <p class="text-sm font-medium text-slate-700">Carboidrato</p>
                            <p class="text-sm font-semibold text-slate-800">{{ formularioPlano.carboidrato_g }}g ({{ formularioPlano.carboidrato_perc }}%)</p>
                        </div>
                        <ProgressBar :value="formularioPlano.carboidrato_perc" class="bg-yellow-100">
                            <template #default>
                                <div class="text-center text-white font-bold text-sm">{{ Math.round(formularioPlano.carboidrato_perc) }}%</div>
                            </template>
                        </ProgressBar>
                    </div>
                    <div>
                        <div class="flex justify-between mb-2">
                            <p class="text-sm font-medium text-slate-700">Gordura</p>
                            <p class="text-sm font-semibold text-slate-800">{{ formularioPlano.gordura_g }}g ({{ formularioPlano.gordura_perc }}%)</p>
                        </div>
                        <ProgressBar :value="formularioPlano.gordura_perc" class="bg-green-100">
                            <template #default>
                                <div class="text-center text-white font-bold text-sm">{{ Math.round(formularioPlano.gordura_perc) }}%</div>
                            </template>
                        </ProgressBar>
                    </div>
                </div>
            </div>

            <!-- Consumo de Macros -->
            <div v-if="temItens" class="bg-white p-4 rounded-lg border border-slate-200">
                <h4 class="font-semibold text-slate-800 mb-2 text-center">Consumo Atual</h4>
                <div class="space-y-2">
                    <div>
                        <div class="flex justify-between mb-2">
                            <p class="text-sm font-medium text-slate-700">Proteína</p>
                            <p class="text-sm font-semibold text-slate-800">{{ totaisPlano.totalProteinas?.toFixed(1) || 0 }}g ({{ percentualProteinaReal?.toFixed(0) || 0 }}%)</p>
                        </div>
                        <ProgressBar :value="percentualProteinaReal || 0" class="bg-red-100">
                            <template #default>
                                <div class="text-center text-white font-bold text-sm">{{ Math.round(percentualProteinaReal) }}%</div>
                            </template>
                        </ProgressBar>
                    </div>
                    <div>
                        <div class="flex justify-between mb-2">
                            <p class="text-sm font-medium text-slate-700">Carboidrato</p>
                            <p class="text-sm font-semibold text-slate-800">{{ totaisPlano.totalCarboidratos?.toFixed(1) || 0 }}g ({{ percentualCarboidratoReal?.toFixed(0) || 0 }}%)</p>
                        </div>
                        <ProgressBar :value="percentualCarboidratoReal || 0" class="bg-yellow-100">
                            <template #default>
                                <div class="text-center text-white font-bold text-sm">{{ Math.round(percentualCarboidratoReal) }}%</div>
                            </template>
                        </ProgressBar>
                    </div>
                    <div>
                        <div class="flex justify-between mb-2">
                            <p class="text-sm font-medium text-slate-700">Gordura</p>
                            <p class="text-sm font-semibold text-slate-800">{{ totaisPlano.totalGorduras?.toFixed(1) || 0 }}g ({{ percentualGorduraReal?.toFixed(0) || 0 }}%)</p>
                        </div>
                        <ProgressBar :value="percentualGorduraReal || 0" class="bg-green-100">
                            <template #default>
                                <div class="text-center text-white font-bold text-sm">{{ Math.round(percentualGorduraReal) }}%</div>
                            </template>
                        </ProgressBar>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tabela de Refeições -->
        <div class="bg-white p-4 rounded-lg border border-slate-200">
            <h4 class="font-semibold text-slate-800 mb-2">Refeições Adicionadas</h4>

            <div class="overflow-x-auto">
                <table class="w-full text-xs">
                    <thead class="bg-slate-100">
                        <tr>
                            <th class="px-3 py-2 text-left font-semibold text-slate-700">Refeição</th>
                            <th class="px-3 py-2 text-right font-semibold text-slate-700">Itens</th>
                            <th class="px-3 py-2 text-right font-semibold text-slate-700">Calorias</th>
                            <th class="px-3 py-2 text-right font-semibold text-slate-700">Proteína (g)</th>
                            <th class="px-3 py-2 text-right font-semibold text-slate-700">Carbo (g)</th>
                            <th class="px-3 py-2 text-right font-semibold text-slate-700">Gordura (g)</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200">
                        <tr v-for="(refeicao, index) in formularioPlano.refeicoes" :key="`refeicao-${index}`" :class="refeicao.itens?.length > 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50'">
                            <td class="px-3 py-2 font-medium text-slate-800">{{ refeicao.nome }}</td>
                            <td class="px-3 py-2 text-right text-slate-600">{{ refeicao.itens?.length || 0 }}</td>
                            <td class="px-3 py-2 text-right font-semibold text-emerald-600">{{ refeicao.total_calorias?.toFixed(0) || 0 }}</td>
                            <td class="px-3 py-2 text-right text-slate-600">{{ refeicao.total_proteinas_g?.toFixed(1) || 0 }}</td>
                            <td class="px-3 py-2 text-right text-slate-600">{{ refeicao.total_carboidrato_g?.toFixed(1) || 0 }}</td>
                            <td class="px-3 py-2 text-right text-slate-600">{{ refeicao.total_gordura_g?.toFixed(1) || 0 }}</td>
                        </tr>
                    </tbody>
                    <tfoot v-if="temItens" class="bg-emerald-50 border-t border-emerald-200 font-bold text-xs">
                        <tr>
                            <td class="px-3 py-2 text-slate-800">TOTAL DO DIA</td>
                            <td class="px-3 py-2 text-right text-slate-600">—</td>
                            <td class="px-3 py-2 text-right text-emerald-600">{{ totaisPlano.totalCalorias?.toFixed(0) || 0 }}</td>
                            <td class="px-3 py-2 text-right text-slate-800">{{ totaisPlano.totalProteinas?.toFixed(1) || 0 }}</td>
                            <td class="px-3 py-2 text-right text-slate-800">{{ totaisPlano.totalCarboidratos?.toFixed(1) || 0 }}</td>
                            <td class="px-3 py-2 text-right text-slate-800">{{ totaisPlano.totalGorduras?.toFixed(1) || 0 }}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup>
import { usePlanosAlimentares } from '@/composables/usePlanosAlimentares';
import AnamneseService from '@/service/AnamneseService';
import ProgressBar from 'primevue/progressbar';
import Tag from 'primevue/tag';
import { computed } from 'vue';

// Props
const props = defineProps({
    formularioPlano: {
        type: Object,
        required: true
    },
    paciente: {
        type: Object,
        required: true
    }
});

// Composable
const { calcularTotaisPlano, calcularDiferencaCalorica, obterStatusComparativo } = usePlanosAlimentares();

// ===== COMPUTED PROPERTIES =====

/**
 * Total do plano calculado
 */
const totaisPlano = computed(() => {
    return calcularTotaisPlano(props.formularioPlano);
});

/**
 * Diferença calórica (meta vs consumo)
 */
const diferencaCalorica = computed(() => {
    return calcularDiferencaCalorica(props.formularioPlano);
});

/**
 * Status comparativo (meta vs totais)
 */
const statusComparativo = computed(() => {
    return obterStatusComparativo(props.formularioPlano);
});

/**
 * Verificar se há itens adicionados
 */
const temItens = computed(() => {
    return props.formularioPlano.refeicoes?.some((r) => r.itens && r.itens.length > 0);
});

/**
 * Percentual de progresso calórico (safe version)
 */
const percentualProgressoSeguro = computed(() => {
    if (!temItens.value) return 0;
    const percentual = Math.min(((totaisPlano.value.totalCalorias || 0) / (props.formularioPlano.calorias_meta || 1)) * 100, 100);
    return isNaN(percentual) ? 0 : Math.round(percentual);
});

/**
 * Percentual de proteína real baseado no consumo
 */
const percentualProteinaReal = computed(() => {
    if (!props.formularioPlano.proteina_g) return 0;
    const percentual = ((totaisPlano.value.totalProteinas || 0) / props.formularioPlano.proteina_g) * 100;
    return Math.min(percentual, 100);
});

/**
 * Percentual de carboidrato real baseado no consumo
 */
const percentualCarboidratoReal = computed(() => {
    if (!props.formularioPlano.carboidrato_g) return 0;
    const percentual = ((totaisPlano.value.totalCarboidratos || 0) / props.formularioPlano.carboidrato_g) * 100;
    return Math.min(percentual, 100);
});

/**
 * Percentual de gordura real baseado no consumo
 */
const percentualGorduraReal = computed(() => {
    if (!props.formularioPlano.gordura_g) return 0;
    const percentual = ((totaisPlano.value.totalGorduras || 0) / props.formularioPlano.gordura_g) * 100;
    return Math.min(percentual, 100);
});

/**
 * Objetivo formatado com tradução
 */
const obterObjetivoFormatado = computed(() => {
    return AnamneseService.formatarValor('objetivo', props.formularioPlano.objetivo);
});
</script>

<style scoped>
/* Smooth transitions */
:deep(.p-progressbar) {
    height: 1.5rem;
    background-color: rgba(0, 0, 0, 0.05);
}

:deep(.p-progressbar .p-progressbar-value) {
    background: linear-gradient(90deg, #059669, #10b981);
    transition: width 0.3s ease;
}
</style>
