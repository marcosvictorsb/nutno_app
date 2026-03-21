<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="mb-6">
            <h3 class="text-lg font-semibold text-slate-800 mb-2">Revise o plano antes de salvar</h3>
            <p class="text-sm text-slate-500">Verifique se todos os dados estão corretos. Você poderá voltar e fazer alterações se necessário.</p>
        </div>

        <!-- Aviso se sem itens -->
        <div v-if="!temItens" class="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
            <p class="text-sm text-amber-800"><strong>⚠️ Aviso:</strong> Nenhuma refeição foi adicionada. Volte ao Step 2 e adicione alimentos.</p>
        </div>

        <!-- Card Principal: Resumo do Plano -->
        <div class="bg-linear-to-r from-emerald-50 to-emerald-100 p-6 rounded-lg border-2 border-emerald-200">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <!-- Nome do Plano -->
                <div>
                    <p class="text-xs font-semibold text-slate-600 uppercase tracking-wider">Nome do Plano</p>
                    <p class="text-lg font-bold text-slate-800 mt-1">{{ formularioPlano.nome }}</p>
                </div>

                <!-- Objetivo -->
                <div>
                    <p class="text-xs font-semibold text-slate-600 uppercase tracking-wider">Objetivo</p>
                    <p class="text-lg font-bold text-slate-800 mt-1">{{ formularioPlano.objetivo }}</p>
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
            <div class="h-px bg-emerald-200 my-4"></div>

            <!-- Meta Calórica -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <p class="text-4xl font-bold text-blue-600">{{ totaisPlano.total_calorias?.toFixed(0) || 0 }}</p>
                            <p class="text-xs text-slate-500 mt-1">kcal/dia</p>
                        </div>
                        <Tag :value="`${percentualProgresso}%`" :severity="statusComparativo.severidade" class="mb-2" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Progresso Calórico -->
        <div v-if="temItens" class="bg-white p-6 rounded-lg border border-slate-200">
            <div class="flex justify-between items-center mb-3">
                <p class="text-sm font-semibold text-slate-700">Progresso Calórico</p>
                <span class="text-sm font-bold text-slate-700">{{ percentualProgresso }}% ({{ diferencaCalorica.diferenca > 0 ? '+' : '' }}{{ diferencaCalorica.diferenca?.toFixed(0) || 0 }} kcal)</span>
            </div>
            <ProgressBar :value="percentualProgresso" class="mb-3" />
            <div class="flex justify-between text-xs text-slate-500">
                <span>Meta: {{ formularioPlano.calorias_meta }} kcal</span>
                <span>Consumo: {{ totaisPlano.total_calorias?.toFixed(0) || 0 }} kcal</span>
            </div>
        </div>

        <!-- Distribuição de Macronutrientes -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Meta de Macros -->
            <div class="bg-white p-6 rounded-lg border border-slate-200">
                <h4 class="font-semibold text-slate-800 mb-4 text-center">Meta de Macronutrientes</h4>
                <div class="space-y-4">
                    <div>
                        <div class="flex justify-between mb-2">
                            <p class="text-sm font-medium text-slate-700">Proteína</p>
                            <p class="text-sm font-semibold text-slate-800">{{ formularioPlano.proteina_g }}g ({{ formularioPlano.proteina_perc }}%)</p>
                        </div>
                        <ProgressBar :value="formularioPlano.proteina_perc" class="bg-red-100"></ProgressBar>
                    </div>
                    <div>
                        <div class="flex justify-between mb-2">
                            <p class="text-sm font-medium text-slate-700">Carboidrato</p>
                            <p class="text-sm font-semibold text-slate-800">{{ formularioPlano.carboidrato_g }}g ({{ formularioPlano.carboidrato_perc }}%)</p>
                        </div>
                        <ProgressBar :value="formularioPlano.carboidrato_perc" class="bg-yellow-100"></ProgressBar>
                    </div>
                    <div>
                        <div class="flex justify-between mb-2">
                            <p class="text-sm font-medium text-slate-700">Gordura</p>
                            <p class="text-sm font-semibold text-slate-800">{{ formularioPlano.gordura_g }}g ({{ formularioPlano.gordura_perc }}%)</p>
                        </div>
                        <ProgressBar :value="formularioPlano.gordura_perc" class="bg-green-100"></ProgressBar>
                    </div>
                </div>
            </div>

            <!-- Consumo de Macros -->
            <div v-if="temItens" class="bg-white p-6 rounded-lg border border-slate-200">
                <h4 class="font-semibold text-slate-800 mb-4 text-center">Consumo Atual</h4>
                <div class="space-y-4">
                    <div>
                        <div class="flex justify-between mb-2">
                            <p class="text-sm font-medium text-slate-700">Proteína</p>
                            <p class="text-sm font-semibold text-slate-800">{{ totaisPlano.total_proteina?.toFixed(1) || 0 }}g ({{ totaisPlano.percentual_proteina?.toFixed(1) || 0 }}%)</p>
                        </div>
                        <ProgressBar :value="totaisPlano.percentual_proteina || 0" class="bg-red-100"></ProgressBar>
                    </div>
                    <div>
                        <div class="flex justify-between mb-2">
                            <p class="text-sm font-medium text-slate-700">Carboidrato</p>
                            <p class="text-sm font-semibold text-slate-800">{{ totaisPlano.total_carboidrato?.toFixed(1) || 0 }}g ({{ totaisPlano.percentual_carboidrato?.toFixed(1) || 0 }}%)</p>
                        </div>
                        <ProgressBar :value="totaisPlano.percentual_carboidrato || 0" class="bg-yellow-100"></ProgressBar>
                    </div>
                    <div>
                        <div class="flex justify-between mb-2">
                            <p class="text-sm font-medium text-slate-700">Gordura</p>
                            <p class="text-sm font-semibold text-slate-800">{{ totaisPlano.total_gordura?.toFixed(1) || 0 }}g ({{ totaisPlano.percentual_gordura?.toFixed(1) || 0 }}%)</p>
                        </div>
                        <ProgressBar :value="totaisPlano.percentual_gordura || 0" class="bg-green-100"></ProgressBar>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tabela de Refeições -->
        <div class="bg-white p-6 rounded-lg border border-slate-200">
            <h4 class="font-semibold text-slate-800 mb-4">Refeições Adicionadas</h4>

            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-slate-100">
                        <tr>
                            <th class="px-4 py-3 text-left font-semibold text-slate-700">Refeição</th>
                            <th class="px-4 py-3 text-right font-semibold text-slate-700">Itens</th>
                            <th class="px-4 py-3 text-right font-semibold text-slate-700">Calorias</th>
                            <th class="px-4 py-3 text-right font-semibold text-slate-700">Proteína (g)</th>
                            <th class="px-4 py-3 text-right font-semibold text-slate-700">Carbo (g)</th>
                            <th class="px-4 py-3 text-right font-semibold text-slate-700">Gordura (g)</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200">
                        <tr v-for="(refeicao, index) in formularioPlano.refeicoes" :key="`refeicao-${index}`" :class="refeicao.itens?.length > 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50'">
                            <td class="px-4 py-3 font-medium text-slate-800">{{ refeicoes_nomes[index] }}</td>
                            <td class="px-4 py-3 text-right text-slate-600">{{ refeicao.itens?.length || 0 }}</td>
                            <td class="px-4 py-3 text-right font-semibold text-emerald-600">{{ refeicao.total_calorias?.toFixed(0) || 0 }}</td>
                            <td class="px-4 py-3 text-right text-slate-600">{{ refeicao.total_proteina?.toFixed(1) || 0 }}</td>
                            <td class="px-4 py-3 text-right text-slate-600">{{ refeicao.total_carboidrato?.toFixed(1) || 0 }}</td>
                            <td class="px-4 py-3 text-right text-slate-600">{{ refeicao.total_gordura?.toFixed(1) || 0 }}</td>
                        </tr>
                    </tbody>
                    <tfoot v-if="temItens" class="bg-emerald-50 border-t-2 border-emerald-200 font-bold">
                        <tr>
                            <td class="px-4 py-3 text-slate-800">TOTAL DO DIA</td>
                            <td class="px-4 py-3 text-right text-slate-600">—</td>
                            <td class="px-4 py-3 text-right text-emerald-600">{{ totaisPlano.total_calorias?.toFixed(0) || 0 }}</td>
                            <td class="px-4 py-3 text-right text-slate-800">{{ totaisPlano.total_proteina?.toFixed(1) || 0 }}</td>
                            <td class="px-4 py-3 text-right text-slate-800">{{ totaisPlano.total_carboidrato?.toFixed(1) || 0 }}</td>
                            <td class="px-4 py-3 text-right text-slate-800">{{ totaisPlano.total_gordura?.toFixed(1) || 0 }}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>

        <!-- Botões de Ação -->
        <div class="flex gap-3 pt-6 border-t border-slate-200">
            <Button label="Voltar" severity="secondary" @click="$emit('voltar')" icon="pi pi-chevron-left" class="flex-1" />
            <Button label="Salvar Plano" severity="success" @click="$emit('salvar')" icon="pi pi-check" :loading="loadingSalvar" class="flex-1" />
        </div>
    </div>
</template>

<script setup>
import { usePlanosAlimentares } from '@/composables/usePlanosAlimentares';
import Button from 'primevue/button';
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
    },
    loadingSalvar: {
        type: Boolean,
        default: false
    }
});

// Emits
defineEmits(['salvar', 'voltar']);

// Composable
const { calcularTotaisPlano, calcularDiferencaCalorica, obterStatusComparativo } = usePlanosAlimentares();

// Nomes das refeições
const refeicoes_nomes = ['Café da Manhã', 'Lanche Manhã', 'Almoço', 'Lanche Tarde', 'Jantar', 'Ceia'];

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
 * Percentual de progresso calórico
 */
const percentualProgresso = computed(() => {
    if (!temItens.value) return 0;
    return Math.min(((totaisPlano.value.total_calorias / props.formularioPlano.calorias_meta) * 100).toFixed(0), 100);
});
</script>

<style scoped>
/* Smooth transitions */
:deep(.p-progressbar) {
    height: 0.5rem;
}
</style>
