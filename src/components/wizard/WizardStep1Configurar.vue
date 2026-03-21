<script setup>
import { calcularSugestaoCaloriaPorObjetivo, obterDistribuicaoMacrosPorObjetivo } from '@/utils/nutricionais';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import { computed, defineExpose, nextTick, ref, watch } from 'vue';

// Props
const props = defineProps({
    formularioPlano: { type: Object, required: true },
    medidaMaisRecente: { type: Object, default: null },
    anamnese: { type: Object, default: null },
    paciente: { type: Object, default: null }
});

// Emits
const emit = defineEmits(['update:formularioPlano', 'avancar']);

// State flags
const calorias_metaEditada = ref(false);
const macrosForamEditadosManualmente = ref(false);
const calorias_metaSugeridaPor = ref(null);
const macrosSugeridosPor = ref(null);
const atualizandoMacrosProgramaticamente = ref(false);

// Opções
const opcoesObjetivo = [
    { label: 'Emagrecimento', value: 'peso_perder', icon: 'trending_down' },
    { label: 'Ganho de massa', value: 'peso_ganhar', icon: 'trending_up' },
    { label: 'Manutenção', value: 'peso_manter', icon: 'trending_flat' },
    { label: 'Performance', value: 'performance', icon: 'bolt' }
];

// Cores para os macros
const macroColors = {
    proteina: '#006b2c', // primary
    carboidrato: '#585f6c', // secondary
    gordura: '#ba1a1a' // error
};

// ===== WATCHERS =====

watch(
    () => props.formularioPlano.objetivo,
    (novoObjetivo) => {
        macrosForamEditadosManualmente.value = false;

        if (!calorias_metaEditada.value && props.medidaMaisRecente?.gasto_energetico_total) {
            const get = Math.round(parseFloat(props.medidaMaisRecente.gasto_energetico_total));
            const sugestao = calcularSugestaoCaloriaPorObjetivo(novoObjetivo, get);

            if (sugestao && sugestao > 0) {
                emit('update:formularioPlano', { ...props.formularioPlano, calorias_meta: sugestao });
                calorias_metaSugeridaPor.value = novoObjetivo;
            }
        }

        if (!macrosForamEditadosManualmente.value && novoObjetivo) {
            const distrib = obterDistribuicaoMacrosPorObjetivo(novoObjetivo);

            atualizandoMacrosProgramaticamente.value = true;

            const proteina_g = Math.round((props.formularioPlano.calorias_meta * distrib.proteina_perc) / 100 / 4);
            const carboidrato_g = Math.round((props.formularioPlano.calorias_meta * distrib.carboidrato_perc) / 100 / 4);
            const gordura_g = Math.round((props.formularioPlano.calorias_meta * distrib.gordura_perc) / 100 / 9);

            const planoAtualizado = {
                ...props.formularioPlano,
                proteina_perc: distrib.proteina_perc,
                carboidrato_perc: distrib.carboidrato_perc,
                gordura_perc: distrib.gordura_perc,
                proteina_g,
                carboidrato_g,
                gordura_g
            };

            emit('update:formularioPlano', planoAtualizado);
            macrosSugeridosPor.value = novoObjetivo;

            nextTick(() => {
                atualizandoMacrosProgramaticamente.value = false;
            });
        }
    }
);

watch(
    () => props.formularioPlano.calorias_meta,
    (novoValor) => {
        if (novoValor && novoValor > 0) {
            calorias_metaEditada.value = true;
        }
    }
);

watch(
    () => [props.formularioPlano.proteina_perc, props.formularioPlano.carboidrato_perc, props.formularioPlano.gordura_perc, props.formularioPlano.calorias_meta],
    () => {
        if (atualizandoMacrosProgramaticamente.value) return;

        const calorias = props.formularioPlano.calorias_meta;
        if (calorias && calorias > 0) {
            const proteina_g = Math.round((calorias * props.formularioPlano.proteina_perc) / 100 / 4);
            const carboidrato_g = Math.round((calorias * props.formularioPlano.carboidrato_perc) / 100 / 4);
            const gordura_g = Math.round((calorias * props.formularioPlano.gordura_perc) / 100 / 9);

            if (proteina_g !== props.formularioPlano.proteina_g || carboidrato_g !== props.formularioPlano.carboidrato_g || gordura_g !== props.formularioPlano.gordura_g) {
                emit('update:formularioPlano', {
                    ...props.formularioPlano,
                    proteina_g,
                    carboidrato_g,
                    gordura_g
                });
            }
        }
    },
    { deep: true }
);

// Detectar edição manual de macros
['proteina_perc', 'carboidrato_perc', 'gordura_perc'].forEach((macro) => {
    watch(
        () => props.formularioPlano[macro],
        (novoValor, valorAnterior) => {
            if (valorAnterior !== undefined && novoValor !== valorAnterior && !atualizandoMacrosProgramaticamente.value) {
                macrosForamEditadosManualmente.value = true;
            }
        }
    );
});

// ===== COMPUTED =====

const somaMacros = computed(() => {
    return (props.formularioPlano.proteina_perc || 0) + (props.formularioPlano.carboidrato_perc || 0) + (props.formularioPlano.gordura_perc || 0);
});

const somaMacrosValida = computed(() => somaMacros.value === 100);

const estimativaResultado = computed(() => {
    if (!props.medidaMaisRecente?.peso || !props.formularioPlano.calorias_meta) return null;

    const pesoAtual = parseFloat(props.medidaMaisRecente.peso);
    const get = parseFloat(props.medidaMaisRecente.gasto_energetico_total || 0);
    const metaCalorica = props.formularioPlano.calorias_meta;
    const diferenca = metaCalorica - get;

    const variacaoPorSemana = (diferenca * 7) / 7700;

    return {
        variacaoPorSemana: variacaoPorSemana.toFixed(2),
        variacaoPor4Semanas: (variacaoPorSemana * 4).toFixed(2),
        pesoEstimadoMes: (pesoAtual + variacaoPorSemana * 4).toFixed(1),
        ehDeficit: diferenca < 0,
        ehSuperavit: diferenca > 0,
        ehManutencao: Math.abs(diferenca) <= 50,
        diferenca: Math.round(Math.abs(diferenca))
    };
});

// ===== FUNÇÕES =====

const atualizarCampo = (campo, valor) => {
    emit('update:formularioPlano', { ...props.formularioPlano, [campo]: valor });
};

const selecionarObjetivo = (objetivo) => {
    atualizarCampo('objetivo', objetivo);
};

const validar = () => {
    if (!props.formularioPlano.nome?.trim()) {
        console.error('Nome do plano é obrigatório');
        return false;
    }
    if (!props.formularioPlano.objetivo) {
        console.error('Objetivo é obrigatório');
        return false;
    }
    if (!props.formularioPlano.calorias_meta || props.formularioPlano.calorias_meta <= 0) {
        console.error('Meta calórica é obrigatória e deve ser maior que 0');
        return false;
    }
    return true;
};

defineExpose({ validar });
</script>

<template>
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 py-8">
        <!-- LEFT COLUMN: Form -->
        <div class="lg:col-span-7 space-y-10">
            <!-- Configurações Básicas -->
            <section>
                <h2 class="text-2xl font-semibold text-on-surface mb-6">Configurações Básicas</h2>
                <div class="space-y-6">
                    <!-- Nome do Plano -->
                    <div>
                        <label class="block text-sm font-medium text-secondary mb-2">Nome do plano</label>
                        <InputText
                            :model-value="formularioPlano.nome"
                            @update:model-value="atualizarCampo('nome', $event)"
                            placeholder="Ex: Protocolo Cutting 2024"
                            class="w-full px-4 py-3 border-outline-variant rounded-xl focus:ring-4 focus:ring-primary/10"
                        />
                    </div>

                    <!-- Objetivo do Plano -->
                    <div>
                        <label class="block text-sm font-medium text-secondary mb-3">Objetivo do plano</label>
                        <div class="flex flex-wrap gap-2">
                            <button
                                v-for="obj in opcoesObjetivo"
                                :key="obj.value"
                                @click="selecionarObjetivo(obj.value)"
                                :class="[
                                    'px-5 py-2.5 rounded-full font-medium text-sm transition-all border',
                                    formularioPlano.objetivo === obj.value ? 'bg-primary-fixed text-on-primary-fixed border-primary/20' : 'bg-surface-container-lowest text-secondary border-outline-variant hover:bg-surface-container-low'
                                ]"
                            >
                                {{ obj.label }}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Metas Diárias -->
            <section>
                <h2 class="text-2xl font-semibold text-on-surface mb-6">Metas Diárias</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Meta Calórica -->
                    <div class="p-6 bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm">
                        <div class="flex items-center gap-3 mb-4">
                            <i class="pi pi-bolt text-primary text-lg"></i>
                            <span class="text-sm font-medium text-secondary">Meta calórica</span>
                        </div>
                        <div class="flex items-baseline gap-2">
                            <InputNumber
                                :model-value="formularioPlano.calorias_meta"
                                @update:model-value="atualizarCampo('calorias_meta', $event)"
                                :use-grouping="false"
                                class="text-3xl font-bold"
                                input-class="text-3xl font-bold bg-transparent border-none p-0 focus:ring-0"
                            />
                            <span class="text-lg font-medium text-on-surface-variant">kcal</span>
                        </div>
                    </div>

                    <!-- Refeições -->
                    <div class="p-6 bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm">
                        <div class="flex items-center gap-3 mb-4">
                            <i class="pi pi-utensils text-tertiary text-lg"></i>
                            <span class="text-sm font-medium text-secondary">Refeições</span>
                        </div>
                        <div class="flex items-baseline gap-2">
                            <InputNumber
                                :model-value="formularioPlano.refeicoes_dia"
                                @update:model-value="atualizarCampo('refeicoes_dia', $event)"
                                :use-grouping="false"
                                class="text-3xl font-bold"
                                input-class="text-3xl font-bold bg-transparent border-none p-0 focus:ring-0"
                            />
                            <span class="text-lg font-medium text-on-surface-variant">por dia</span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Distribuição de Macros -->
            <section>
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-2xl font-semibold text-on-surface">Distribuição de Macros</h2>
                    <span :class="['px-3 py-1 rounded-full text-xs font-bold', somaMacrosValida ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error']"> {{ somaMacros }}% {{ somaMacrosValida ? 'DISTRIBUÍDO' : 'INVÁLIDO' }} </span>
                </div>

                <!-- Visual Bar -->
                <div class="w-full h-4 rounded-full overflow-hidden flex mb-8 bg-surface-container-highest">
                    <div class="h-full transition-all" :style="{ width: formularioPlano.proteina_perc + '%', backgroundColor: macroColors.proteina }"></div>
                    <div class="h-full transition-all" :style="{ width: formularioPlano.carboidrato_perc + '%', backgroundColor: macroColors.carboidrato }"></div>
                    <div class="h-full transition-all" :style="{ width: formularioPlano.gordura_perc + '%', backgroundColor: macroColors.gordura }"></div>
                </div>

                <!-- Sliders -->
                <div class="space-y-8">
                    <!-- Proteína -->
                    <div class="space-y-4">
                        <div class="flex justify-between items-center">
                            <div class="flex items-center gap-2">
                                <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: macroColors.proteina }"></div>
                                <span class="font-medium">Proteínas</span>
                            </div>
                            <div class="text-right">
                                <span class="text-lg font-bold">{{ formularioPlano.proteina_g }}g</span>
                                <span class="text-sm text-secondary ml-1">({{ formularioPlano.proteina_perc }}%)</span>
                            </div>
                        </div>
                        <input
                            :model-value="formularioPlano.proteina_perc"
                            @input="atualizarCampo('proteina_perc', parseInt($event.target.value))"
                            type="range"
                            min="0"
                            max="100"
                            class="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer"
                            :style="{
                                accentColor: macroColors.proteina
                            }"
                        />
                    </div>

                    <!-- Carboidrato -->
                    <div class="space-y-4">
                        <div class="flex justify-between items-center">
                            <div class="flex items-center gap-2">
                                <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: macroColors.carboidrato }"></div>
                                <span class="font-medium">Carboidratos</span>
                            </div>
                            <div class="text-right">
                                <span class="text-lg font-bold">{{ formularioPlano.carboidrato_g }}g</span>
                                <span class="text-sm text-secondary ml-1">({{ formularioPlano.carboidrato_perc }}%)</span>
                            </div>
                        </div>
                        <input
                            :model-value="formularioPlano.carboidrato_perc"
                            @input="atualizarCampo('carboidrato_perc', parseInt($event.target.value))"
                            type="range"
                            min="0"
                            max="100"
                            class="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer"
                            :style="{
                                accentColor: macroColors.carboidrato
                            }"
                        />
                    </div>

                    <!-- Gordura -->
                    <div class="space-y-4">
                        <div class="flex justify-between items-center">
                            <div class="flex items-center gap-2">
                                <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: macroColors.gordura }"></div>
                                <span class="font-medium">Gorduras</span>
                            </div>
                            <div class="text-right">
                                <span class="text-lg font-bold">{{ formularioPlano.gordura_g }}g</span>
                                <span class="text-sm text-secondary ml-1">({{ formularioPlano.gordura_perc }}%)</span>
                            </div>
                        </div>
                        <input
                            :model-value="formularioPlano.gordura_perc"
                            @input="atualizarCampo('gordura_perc', parseInt($event.target.value))"
                            type="range"
                            min="0"
                            max="100"
                            class="w-full h-1.5 bg-surface-container-highest rounded-lg appearance-none cursor-pointer"
                            :style="{
                                accentColor: macroColors.gordura
                            }"
                        />
                    </div>
                </div>
            </section>
        </div>

        <!-- RIGHT COLUMN: Summary Card (Sticky) -->
        <div class="lg:col-span-5">
            <div class="sticky top-32 p-8 bg-surface-container-lowest rounded-2xl shadow-md border border-outline-variant/10">
                <h3 class="text-lg font-bold mb-6 flex items-center gap-2">
                    <i class="pi pi-chart-bar text-primary"></i>
                    Resumo do Perfil
                </h3>

                <div class="space-y-6">
                    <!-- Paciente Info -->
                    <div class="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl">
                        <img v-if="paciente?.foto" :src="paciente.foto" :alt="paciente.nome" class="w-12 h-12 rounded-full object-cover" />
                        <div v-else class="w-12 h-12 rounded-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                            {{ paciente?.nome?.charAt(0) || 'P' }}
                        </div>
                        <div>
                            <p class="font-bold text-on-surface">{{ paciente?.nome || 'Paciente' }}</p>
                            <p class="text-xs text-secondary">{{ paciente?.idade || '—' }} anos • {{ medidaMaisRecente?.peso || '—' }}kg • {{ medidaMaisRecente?.altura || '—' }}m</p>
                        </div>
                    </div>

                    <!-- TMB e GET -->
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <p class="text-xs font-medium text-secondary uppercase tracking-wider">TMB</p>
                            <p class="text-lg font-semibold">{{ medidaMaisRecente?.tmb ? Math.round(medidaMaisRecente.tmb) + ' kcal' : '—' }}</p>
                        </div>
                        <div class="space-y-1">
                            <p class="text-xs font-medium text-secondary uppercase tracking-wider">GET</p>
                            <p class="text-lg font-semibold">{{ medidaMaisRecente?.gasto_energetico_total ? Math.round(medidaMaisRecente.gasto_energetico_total) + ' kcal' : '—' }}</p>
                        </div>
                    </div>

                    <!-- Déficit Planejado -->
                    <div v-if="estimativaResultado" class="pt-6 border-t border-outline-variant/20">
                        <div class="flex justify-between items-center mb-4">
                            <p class="text-sm font-medium text-secondary">Déficit planejado</p>
                            <p :class="['text-sm font-bold', estimativaResultado.ehDeficit ? 'text-error' : estimativaResultado.ehSuperavit ? 'text-primary' : 'text-secondary']">
                                {{ estimativaResultado.ehDeficit ? '-' : estimativaResultado.ehSuperavit ? '+' : '±' }}{{ estimativaResultado.diferenca }}
                                kcal/dia
                            </p>
                        </div>
                        <div class="p-4 bg-primary/5 rounded-xl border border-primary/10">
                            <p class="text-xs leading-relaxed text-on-primary-fixed-variant"><span class="font-bold">Nota clínica:</span> Este plano foca em preservar massa magra enquanto reduz gordura corporal de forma gradual e sustentável.</p>
                        </div>
                    </div>

                    <!-- Button -->
                    <button
                        @click="$emit('avancar')"
                        class="w-full mt-10 py-4 px-6 rounded-xl bg-linear-to-br from-primary to-primary-container text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        Próximo: Montar refeições
                        <i class="pi pi-chevron-right"></i>
                    </button>
                    <p class="text-center text-xs text-secondary font-medium">Você poderá editar essas metas posteriormente.</p>
                </div>
            </div>
        </div>
    </div>
</template>
