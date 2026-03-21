<script setup>
import AlimentoService from '@/service/AlimentoService';
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import { debounce } from 'primevue/utils';
import { computed, defineExpose, ref, watch } from 'vue';

// Props
const props = defineProps({
    formularioPlano: { type: Object, required: true },
    paciente: { type: Object, default: null }
});

// Emits
const emit = defineEmits(['update:formularioPlano', 'voltar', 'avancar']);

// State
const refeicaoExpandida = ref(0);
const buscaAlimento = ref('');
const alimentosEncontrados = ref([]);
const loadingBusca = ref(false);
const alimentoSelecionado = ref(null);
const quantidadeSelecionada = ref(1);
const unidadeSelecionada = ref('g');

// Configuração de refeições padrão
const refeicoesPadrao = [
    { id: 1, nome: 'Café da manhã', emoji: '🥐', horario: '07:00' },
    { id: 2, nome: 'Almoço', emoji: '🍽️', horario: '13:00' },
    { id: 3, nome: 'Lanche', emoji: '🥤', horario: '16:00' },
    { id: 4, nome: 'Jantar', emoji: '🍲', horario: '20:00' },
    { id: 5, nome: 'Ceia', emoji: '🥛', horario: '22:00' },
    { id: 6, nome: 'Extra', emoji: '⭐', horario: '—' }
];

// ===== COMPUTED =====

const refeicoes = computed(() => {
    const refeicoes = [];
    for (let i = 1; i <= props.formularioPlano.refeicoes_dia; i++) {
        const ref = refeicoesPadrao[i - 1] || { id: i, nome: `Refeição ${i}`, emoji: '🍽️', horario: '—' };
        refeicoes.push({
            ...ref,
            items: props.formularioPlano.refeicoes?.[i - 1] || [],
            get totalKcal() {
                return this.items.reduce((sum, item) => sum + (item.kcal || 0), 0);
            }
        });
    }
    return refeicoes;
});

const totaisPlano = computed(() => {
    if (!props.formularioPlano.refeicoes) return null;

    const items = props.formularioPlano.refeicoes.flat();
    if (items.length === 0) return null;

    const totalKcal = items.reduce((sum, item) => sum + (item.kcal || 0), 0);
    const proteina_g = items.reduce((sum, item) => sum + (item.proteina_g || 0), 0);
    const carboidrato_g = items.reduce((sum, item) => sum + (item.carboidrato_g || 0), 0);
    const gordura_g = items.reduce((sum, item) => sum + (item.gordura_g || 0), 0);

    return {
        totalKcal,
        proteina_g,
        carboidrato_g,
        gordura_g
    };
});

const percentualCalorias = computed(() => {
    if (!totaisPlano.value) return 0;
    return Math.round((totaisPlano.value.totalKcal / props.formularioPlano.calorias_meta) * 100);
});

// ===== WATCHERS & FUNCTIONS =====

const buscarAlimentos = debounce(async (query) => {
    if (!query || query.length < 2) {
        alimentosEncontrados.value = [];
        return;
    }

    loadingBusca.value = true;
    try {
        const response = await AlimentoService.buscar(query, 10);
        alimentosEncontrados.value = response?.data || [];
    } catch (error) {
        console.error('Erro ao buscar alimentos:', error);
        alimentosEncontrados.value = [];
    } finally {
        loadingBusca.value = false;
    }
}, 300);

watch(
    () => buscaAlimento.value,
    (novoValor) => {
        if (novoValor) {
            buscarAlimentos(novoValor);
        } else {
            alimentosEncontrados.value = [];
        }
    }
);

// Adicionar alimento à refeição
const adicionarAlimento = (refeicaoIndex) => {
    if (!alimentoSelecionado.value) return;

    const novasRefeicoes = JSON.parse(JSON.stringify(props.formularioPlano.refeicoes || []));

    if (!novasRefeicoes[refeicaoIndex]) {
        novasRefeicoes[refeicaoIndex] = [];
    }

    const alimento = alimentoSelecionado.value;
    const kcal = Math.round(alimento.kcal_100g * (quantidadeSelecionada.value / 100));
    const proteina_g = Math.round((alimento.proteina_g * quantidadeSelecionada.value) / 100);
    const carboidrato_g = Math.round((alimento.carboidrato_g * quantidadeSelecionada.value) / 100);
    const gordura_g = Math.round((alimento.gordura_g * quantidadeSelecionada.value) / 100);

    novasRefeicoes[refeicaoIndex].push({
        id: `${Date.now()}-${Math.random()}`,
        nome: alimento.nome,
        descricao: alimento.descricao,
        quantidade: quantidadeSelecionada.value,
        unidade: unidadeSelecionada.value,
        kcal,
        proteina_g,
        carboidrato_g,
        gordura_g
    });

    emit('update:formularioPlano', {
        ...props.formularioPlano,
        refeicoes: novasRefeicoes
    });

    alimentoSelecionado.value = null;
    quantidadeSelecionada.value = 1;
    unidadeSelecionada.value = 'g';
    buscaAlimento.value = '';
};

// Remover alimento
const removerAlimento = (refeicaoIndex, itemIndex) => {
    const novasRefeicoes = JSON.parse(JSON.stringify(props.formularioPlano.refeicoes || []));

    if (novasRefeicoes[refeicaoIndex]) {
        novasRefeicoes[refeicaoIndex].splice(itemIndex, 1);
    }

    emit('update:formularioPlano', {
        ...props.formularioPlano,
        refeicoes: novasRefeicoes
    });
};

// Adicionar refeição extra
const adicionarRefeicaoExtra = () => {
    if (props.formularioPlano.refeicoes_dia >= 6) return;

    emit('update:formularioPlano', {
        ...props.formularioPlano,
        refeicoes_dia: props.formularioPlano.refeicoes_dia + 1
    });
};

// Validação
const validar = () => {
    const totalItems = props.formularioPlano.refeicoes?.flat()?.length || 0;

    if (totalItems === 0) {
        console.error('Adicione pelo menos um alimento ao plano');
        return false;
    }

    return true;
};

defineExpose({ validar });
</script>

<template>
    <div class="space-y-6 pb-20">
        <!-- Macro Dashboard (Sticky) -->
        <div class="sticky top-0 z-30 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-md mb-8">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                <!-- Total Calorias -->
                <div class="border-r border-outline-variant/20 pr-6">
                    <div class="flex items-baseline gap-1">
                        <span class="text-3xl font-bold tracking-tighter">{{ totaisPlano?.totalKcal || 0 }}</span>
                        <span class="text-on-surface-variant text-sm">/ {{ formularioPlano.calorias_meta }} kcal</span>
                    </div>
                    <div class="w-full bg-surface-container-highest h-2 rounded-full mt-2 overflow-hidden">
                        <div class="bg-primary h-full rounded-full transition-all" :style="{ width: Math.min(percentualCalorias, 100) + '%' }"></div>
                    </div>
                </div>

                <!-- Macros Mini Bars -->
                <div class="col-span-3 grid grid-cols-3 gap-8">
                    <!-- Carboidratos -->
                    <div>
                        <div class="flex justify-between text-xs font-medium text-on-surface-variant mb-1">
                            <span>Carboidratos</span>
                            <span class="text-on-surface">{{ totaisPlano?.carboidrato_g || 0 }}g / {{ formularioPlano.carboidrato_g }}g</span>
                        </div>
                        <div class="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
                            <div
                                class="bg-blue-500 h-full rounded-full transition-all"
                                :style="{
                                    width: Math.min(((totaisPlano?.carboidrato_g || 0) / (formularioPlano.carboidrato_g || 1)) * 100, 100) + '%'
                                }"
                            ></div>
                        </div>
                    </div>

                    <!-- Proteínas -->
                    <div>
                        <div class="flex justify-between text-xs font-medium text-on-surface-variant mb-1">
                            <span>Proteínas</span>
                            <span class="text-on-surface">{{ totaisPlano?.proteina_g || 0 }}g / {{ formularioPlano.proteina_g }}g</span>
                        </div>
                        <div class="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
                            <div
                                class="bg-red-400 h-full rounded-full transition-all"
                                :style="{
                                    width: Math.min(((totaisPlano?.proteina_g || 0) / (formularioPlano.proteina_g || 1)) * 100, 100) + '%'
                                }"
                            ></div>
                        </div>
                    </div>

                    <!-- Gorduras -->
                    <div>
                        <div class="flex justify-between text-xs font-medium text-on-surface-variant mb-1">
                            <span>Gorduras</span>
                            <span class="text-on-surface">{{ totaisPlano?.gordura_g || 0 }}g / {{ formularioPlano.gordura_g }}g</span>
                        </div>
                        <div class="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
                            <div
                                class="bg-yellow-500 h-full rounded-full transition-all"
                                :style="{
                                    width: Math.min(((totaisPlano?.gordura_g || 0) / (formularioPlano.gordura_g || 1)) * 100, 100) + '%'
                                }"
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Meal Cards -->
        <div class="space-y-4">
            <div v-for="(refeicao, refIndex) in refeicoes" :key="refeicao.id" class="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
                <!-- Header (Expandable) -->
                <div class="p-6 flex items-center justify-between cursor-pointer border-b border-surface-container-low hover:bg-surface-container-low transition-colors" @click="refeicaoExpandida = refeicaoExpandida === refIndex ? -1 : refIndex">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed font-bold text-lg">
                            {{ refeicao.emoji }}
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold tracking-tight">{{ refeicao.nome }}</h3>
                            <span class="text-sm text-on-surface-variant">{{ refeicao.horario }} • {{ refeicao.items.length }} alimento{{ refeicao.items.length !== 1 ? 's' : '' }}</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <span class="text-lg font-bold">
                            {{ refeicao.totalKcal }}
                            <span class="text-xs font-medium text-on-surface-variant">kcal</span>
                        </span>
                        <i :class="['pi transition-transform', refeicaoExpandida === refIndex ? 'pi-chevron-up' : 'pi-chevron-down']"></i>
                    </div>
                </div>

                <!-- Body (Expandable) -->
                <div v-show="refeicaoExpandida === refIndex" class="p-6 bg-surface-container-lowest space-y-6">
                    <!-- Food Table -->
                    <div v-if="refeicao.items.length > 0">
                        <table class="w-full text-left">
                            <thead>
                                <tr class="text-xs font-bold uppercase text-on-surface-variant tracking-wider border-b border-surface-container-high">
                                    <th class="pb-3 font-semibold">Alimento</th>
                                    <th class="pb-3 font-semibold">Qtd.</th>
                                    <th class="pb-3 font-semibold text-right">Kcal</th>
                                    <th class="pb-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-surface-container-low">
                                <tr v-for="(item, itemIndex) in refeicao.items" :key="item.id">
                                    <td class="py-4">
                                        <div class="font-medium">{{ item.nome }}</div>
                                        <div class="text-xs text-on-surface-variant">{{ item.descricao }}</div>
                                    </td>
                                    <td class="py-4 text-sm">{{ item.quantidade }}{{ item.unidade }}</td>
                                    <td class="py-4 text-sm font-medium text-right">{{ item.kcal }} kcal</td>
                                    <td class="py-4 text-right">
                                        <button @click="removerAlimento(refIndex, itemIndex)" class="text-on-surface-variant hover:text-error transition-colors">
                                            <i class="pi pi-trash text-lg"></i>
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td class="pt-4 text-sm font-bold">Subtotal</td>
                                    <td></td>
                                    <td class="pt-4 text-sm font-bold text-right text-primary">{{ refeicao.totalKcal }} kcal</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <div v-else class="text-center py-6 text-on-surface-variant">
                        <p class="text-sm">Nenhum alimento adicionado</p>
                    </div>

                    <!-- Search and Add Section -->
                    <div class="space-y-4 pt-6 border-t border-surface-container-low">
                        <label class="block text-xs font-bold text-secondary uppercase">Adicionar alimento</label>
                        <div class="flex gap-3">
                            <!-- Search -->
                            <div class="relative flex-1">
                                <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"></i>
                                <InputText v-model="buscaAlimento" placeholder="Busque por alimento..." class="w-full pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/20" />

                                <!-- Dropdown de alimentos -->
                                <div v-if="alimentosEncontrados.length > 0" class="absolute top-full left-0 right-0 mt-1 bg-surface-container-lowest shadow-md border border-outline-variant/10 rounded-lg z-10 overflow-hidden max-h-64 overflow-y-auto">
                                    <div
                                        v-for="alimento in alimentosEncontrados"
                                        :key="alimento.id"
                                        @click="alimentoSelecionado = alimento"
                                        :class="['px-4 py-3 hover:bg-surface-container-low cursor-pointer flex justify-between items-center group', alimentoSelecionado?.id === alimento.id ? 'bg-primary-fixed/10' : '']"
                                    >
                                        <div>
                                            <div class="text-sm font-medium group-hover:text-primary transition-colors">{{ alimento.nome }}</div>
                                            <div class="text-xs text-on-surface-variant">100g = {{ alimento.kcal_100g }} kcal</div>
                                        </div>
                                        <i :class="['pi transition-opacity', alimentoSelecionado?.id === alimento.id ? 'pi-check text-primary' : 'pi-plus opacity-0 group-hover:opacity-100']"></i>
                                    </div>
                                </div>
                            </div>

                            <!-- Quantidade -->
                            <InputNumber v-model="quantidadeSelecionada" :use-grouping="false" placeholder="Qtd" class="w-24" input-class="px-3 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-center" />

                            <!-- Unidade -->
                            <select v-model="unidadeSelecionada" class="w-32 px-3 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm appearance-none cursor-pointer">
                                <option value="g">gramas (g)</option>
                                <option value="unidade">unidade</option>
                                <option value="colher">colher</option>
                                <option value="xícara">xícara</option>
                            </select>

                            <!-- Add Button -->
                            <Button @click="adicionarAlimento(refIndex)" :disabled="!alimentoSelecionado" class="bg-primary text-on-primary px-6 rounded-lg font-semibold text-sm" icon="pi pi-plus" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Add Extra Meal Button -->
            <button
                v-if="formularioPlano.refeicoes_dia < 6"
                @click="adicionarRefeicaoExtra"
                class="w-full py-6 border-2 border-dashed border-outline-variant/30 rounded-xl flex items-center justify-center gap-2 text-secondary font-semibold hover:bg-surface-container-low hover:border-primary/30 transition-all"
            >
                <i class="pi pi-plus-circle"></i>
                Adicionar refeição extra
            </button>
        </div>

        <!-- Footer Navigation -->
        <div class="fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-outline-variant/20 py-4 px-6 z-40">
            <div class="max-w-4xl mx-auto flex items-center justify-between">
                <Button @click="$emit('voltar')" text class="text-secondary font-semibold" icon="pi pi-arrow-left"> Voltar </Button>
                <Button @click="() => validar() && $emit('avancar')" class="bg-primary text-on-primary font-bold rounded-lg" icon="pi pi-arrow-right" icon-pos="right"> Próximo </Button>
            </div>
        </div>
    </div>
</template>
