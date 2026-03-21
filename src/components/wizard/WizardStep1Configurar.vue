<script setup>
import {
    calcularDeficitSuperavitCalorico,
    calcularSugestaoCaloriaPorObjetivo,
    calcularVariacaoPesoPeriodos,
    formatarCaloria,
    formatarIMC,
    formatarPeso,
    obterClassificacaoIMCPlano,
    traduzirNivelAtividadePlano,
    verificarAvisosSeguranca
} from '@/utils/nutricionais';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Slider from 'primevue/slider';
import Tag from 'primevue/tag';
import { defineExpose, ref } from 'vue';

// Props
const props = defineProps({
    formularioPlano: { type: Object, required: true },
    medidaMaisRecente: { type: Object, default: null },
    anamnese: { type: Object, default: null },
    paciente: { type: Object, default: null },
    errosPlano: { type: Object, default: () => ({}) }
});

// Emits
const emit = defineEmits(['update:formularioPlano', 'update:errosPlano']);

// Local refs for sliders
const proteinaPerc = ref(props.formularioPlano.proteina_perc);
const carboidratoPerc = ref(props.formularioPlano.carboidrato_perc);
const gorduraPerc = ref(props.formularioPlano.gordura_perc);

const validar = () => {
    const erros = {};
    if (!props.formularioPlano.nome?.trim()) erros.nome = 'Nome obrigatório';
    if (!props.formularioPlano.calorias_meta || props.formularioPlano.calorias_meta <= 0) erros.calorias_meta = 'Calorias obrigatórias';

    emit('update:errosPlano', erros);
    return Object.keys(erros).length === 0;
};

defineExpose({ validar });
</script>

<template>
    <div class="space-y-4 overflow-y-auto pr-4">
        <!-- Seção 1: Configurações Básicas -->
        <section class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-base">⚙️</div>
                <h3 class="text-lg font-bold text-slate-800">Configurações Básicas</h3>
            </div>

            <div class="space-y-4">
                <!-- Nome do Plano -->
                <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1.5">Nome do plano <span class="text-red-500">*</span></label>
                    <InputText
                        :model-value="formularioPlano.nome"
                        @update:model-value="emit('update:formularioPlano', { ...formularioPlano, nome: $event })"
                        placeholder="Protocolo Cutting"
                        class="w-full px-3 py-2 text-sm bg-slate-50 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                        :class="props.errosPlano?.nome ? 'border-red-500' : 'border-slate-200'"
                    />
                    <small v-if="props.errosPlano?.nome" class="block text-red-500 text-xs font-semibold mt-1">{{ props.errosPlano.nome }}</small>
                </div>
            </div>
        </section>

        <!-- Seção 2: Metas Diárias -->
        <section class="bg-white rounded-2xl border border-slate-200 shadow-sm p-3">
            <div class="flex items-center gap-2 mb-2">
                <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm">🎯</div>
                <h3 class="text-base font-bold text-slate-800">Metas Diárias</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <!-- Meta Calórica -->
                <div class="p-3 bg-linear-to-br from-emerald-50 to-emerald-100 rounded-lg border-2" :class="props.errosPlano?.calorias_meta ? 'border-red-500' : 'border-emerald-200'">
                    <div class="flex items-center gap-1.5 mb-2">
                        <div class="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs">
                            <i class="pi pi-fire text-xs"></i>
                        </div>
                        <span class="text-xs font-semibold text-emerald-900 uppercase">Meta Calórica <span class="text-red-600">*</span></span>
                    </div>

                    <div class="flex items-baseline gap-1 mb-2">
                        <InputNumber
                            :model-value="formularioPlano.calorias_meta"
                            @update:model-value="emit('update:formularioPlano', { ...formularioPlano, calorias_meta: $event })"
                            :use-grouping="false"
                            class="text-xl! font-bold!"
                            :class="props.errosPlano?.calorias_meta ? 'text-red-600!' : 'text-emerald-600!'"
                            input-class="text-xl font-bold"
                        />
                        <span class="text-sm font-semibold text-emerald-700">kcal</span>
                    </div>

                    <!-- Quick selector com sugestões -->
                    <div v-if="medidaMaisRecente" class="space-y-1.5">
                        <p class="text-xs font-semibold text-emerald-700 uppercase">Rápidas:</p>
                        <div class="grid grid-cols-3 gap-1.5">
                            <button
                                @click="
                                    () => {
                                        emit('update:formularioPlano', {
                                            ...formularioPlano,
                                            objetivo: 'emagrecer',
                                            calorias_meta: Math.round(parseFloat(medidaMaisRecente.gasto_energetico_total) - 500)
                                        });
                                    }
                                "
                                :class="[
                                    'py-2 px-2 rounded border text-xs font-bold text-center transition-all',
                                    formularioPlano.objetivo === 'emagrecer' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                                ]"
                            >
                                🔥 Emagrecer<br /><span class="text-xs font-semibold">{{ formatarCaloria(calcularSugestaoCaloriaPorObjetivo('emagrecer', medidaMaisRecente.gasto_energetico_total)) }}</span>
                            </button>
                            <button
                                @click="
                                    () => {
                                        emit('update:formularioPlano', {
                                            ...formularioPlano,
                                            objetivo: 'melhorar_saude',
                                            calorias_meta: Math.round(parseFloat(medidaMaisRecente.gasto_energetico_total))
                                        });
                                    }
                                "
                                :class="[
                                    'py-2 px-2 rounded border text-xs font-bold text-center transition-all',
                                    formularioPlano.objetivo === 'melhorar_saude' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                                ]"
                            >
                                ⚖️ Manter<br /><span class="text-xs font-semibold">{{ formatarCaloria(calcularSugestaoCaloriaPorObjetivo('melhorar_saude', medidaMaisRecente.gasto_energetico_total)) }}</span>
                            </button>
                            <button
                                @click="
                                    () => {
                                        emit('update:formularioPlano', {
                                            ...formularioPlano,
                                            objetivo: 'ganhar_massa',
                                            calorias_meta: Math.round(parseFloat(medidaMaisRecente.gasto_energetico_total) + 300)
                                        });
                                    }
                                "
                                :class="[
                                    'py-2 px-2 rounded border text-xs font-bold text-center transition-all',
                                    formularioPlano.objetivo === 'ganhar_massa' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                                ]"
                            >
                                💪 Ganhar<br /><span class="text-xs font-semibold">{{ formatarCaloria(calcularSugestaoCaloriaPorObjetivo('ganhar_massa', medidaMaisRecente.gasto_energetico_total)) }}</span>
                            </button>
                            <button
                                @click="
                                    () => {
                                        emit('update:formularioPlano', {
                                            ...formularioPlano,
                                            objetivo: 'controlar_doenca',
                                            calorias_meta: Math.round(parseFloat(medidaMaisRecente.gasto_energetico_total))
                                        });
                                    }
                                "
                                :class="[
                                    'py-2 px-2 rounded border text-xs font-bold text-center transition-all',
                                    formularioPlano.objetivo === 'controlar_doenca' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                                ]"
                            >
                                🏥 Doença
                            </button>
                            <button
                                @click="
                                    () => {
                                        emit('update:formularioPlano', {
                                            ...formularioPlano,
                                            objetivo: 'melhorar_performance',
                                            calorias_meta: Math.round(parseFloat(medidaMaisRecente.gasto_energetico_total) + 200)
                                        });
                                    }
                                "
                                :class="[
                                    'py-2 px-2 rounded border text-xs font-bold text-center transition-all',
                                    formularioPlano.objetivo === 'melhorar_performance' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                                ]"
                            >
                                ⚡ Performance<br /><span class="text-xs font-semibold">{{ formatarCaloria(calcularSugestaoCaloriaPorObjetivo('melhorar_performance', medidaMaisRecente.gasto_energetico_total)) }}</span>
                            </button>
                            <button
                                @click="
                                    () => {
                                        emit('update:formularioPlano', {
                                            ...formularioPlano,
                                            objetivo: 'outro',
                                            calorias_meta: Math.round(parseFloat(medidaMaisRecente.gasto_energetico_total))
                                        });
                                    }
                                "
                                :class="[
                                    'py-2 px-2 rounded border text-xs font-bold text-center transition-all',
                                    formularioPlano.objetivo === 'outro' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                                ]"
                            >
                                ✨ Outro
                            </button>
                        </div>
                        <p class="text-xs text-emerald-600 mt-2">
                            <i class="pi pi-lightning text-xs mr-0.5"></i>
                            GET base: {{ formatarCaloria(medidaMaisRecente.gasto_energetico_total) }} kcal
                        </p>
                    </div>

                    <small v-if="props.errosPlano?.calorias_meta" class="block text-red-500 text-xs font-semibold mt-2">{{ props.errosPlano.calorias_meta }}</small>
                </div>

                <!-- Card de Referência do Paciente -->
                <div v-if="medidaMaisRecente" class="p-3 bg-linear-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200">
                    <div class="flex items-center gap-1.5 mb-2">
                        <div class="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">
                            <i class="pi pi-chart-bar text-xs"></i>
                        </div>
                        <span class="text-xs font-semibold text-blue-900 uppercase">Referência</span>
                    </div>

                    <div class="mb-2 pb-2 border-b border-blue-200">
                        <p class="text-xs text-blue-700 font-medium">TMB</p>
                        <p class="text-sm font-bold text-blue-900">{{ formatarCaloria(medidaMaisRecente.tmb) }} kcal</p>
                    </div>

                    <div class="mb-2 pb-2 border-b border-blue-200">
                        <p class="text-xs text-blue-700 font-medium">GET</p>
                        <p class="text-sm font-bold text-blue-900">{{ formatarCaloria(medidaMaisRecente.gasto_energetico_total) }} kcal</p>
                        <p class="text-xs text-blue-600">{{ traduzirNivelAtividadePlano(medidaMaisRecente.nivel_atividade) }}</p>
                    </div>

                    <div class="mb-2 pb-2 border-b border-blue-200">
                        <p class="text-xs text-blue-700 font-medium">IMC</p>
                        <div class="flex items-center gap-1.5">
                            <p class="text-sm font-bold text-blue-900">{{ formatarIMC(medidaMaisRecente.imc) }}</p>
                            <Tag :value="obterClassificacaoIMCPlano(medidaMaisRecente.imc).label" :severity="obterClassificacaoIMCPlano(medidaMaisRecente.imc).severity" class="text-xs" />
                        </div>
                    </div>

                    <div class="mb-2">
                        <p class="text-xs text-blue-700 font-medium">Peso</p>
                        <p class="text-sm font-bold text-blue-900">{{ formatarPeso(medidaMaisRecente.peso) }} kg</p>
                    </div>

                    <div class="border-t border-blue-200 pt-2 mt-2">
                        <p class="text-xs font-bold text-blue-700 mb-1.5 uppercase">Sugestões</p>
                        <div class="space-y-1 text-xs">
                            <p class="text-blue-800">🔥 Emagrecimento: {{ formatarCaloria(calcularSugestaoCaloriaPorObjetivo('emagrecer', medidaMaisRecente.gasto_energetico_total)) }} kcal</p>
                            <p class="text-blue-800">🌱 Saúde: {{ formatarCaloria(calcularSugestaoCaloriaPorObjetivo('melhorar_saude', medidaMaisRecente.gasto_energetico_total)) }} kcal</p>
                            <p class="text-blue-800">💪 Ganho de massa: {{ formatarCaloria(calcularSugestaoCaloriaPorObjetivo('ganhar_massa', medidaMaisRecente.gasto_energetico_total)) }} kcal</p>
                        </div>
                    </div>

                    <p class="text-xs text-blue-500 mt-1.5 text-center">Avaliação: {{ medidaMaisRecente.data_avaliacao ? new Date(medidaMaisRecente.data_avaliacao).toLocaleDateString('pt-BR') : '—' }}</p>
                </div>
            </div>

            <!-- Estimativa de Resultado (NOVO - Full Width) -->
            <div v-if="medidaMaisRecente && formularioPlano.objetivo && formularioPlano.calorias_meta > 0" class="p-3 bg-linear-to-br from-emerald-50 to-emerald-100 rounded-lg border-2 border-emerald-200 mt-3">
                <div class="flex items-center gap-1.5 mb-2">
                    <div class="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs">
                        <i class="pi pi-chart-line text-xs"></i>
                    </div>
                    <h3 class="text-xs font-bold text-emerald-900 uppercase">Estimativa de Resultado</h3>
                </div>

                <div v-if="Math.abs(calcularDeficitSuperavitCalorico(formularioPlano.calorias_meta, medidaMaisRecente.gasto_energetico_total)) <= 50" class="text-center">
                    <p class="text-xs font-semibold text-emerald-700 uppercase mb-2">
                        <i class="pi pi-check-circle text-sm mr-1"></i>
                        Plano de manutenção de peso
                    </p>
                    <p class="text-xs text-emerald-600">A meta está alinhada com o gasto energético do paciente.</p>
                </div>

                <div v-else>
                    <div v-if="verificarAvisosSeguranca(formularioPlano.calorias_meta, medidaMaisRecente.gasto_energetico_total).deficit_alto" class="mb-2 p-2 bg-yellow-50 border border-yellow-300 rounded-lg text-xs text-yellow-800">
                        <i class="pi pi-exclamation-triangle text-xs mr-1"></i>
                        Déficit alto. Possível perda de massa muscular.
                    </div>

                    <div v-if="verificarAvisosSeguranca(formularioPlano.calorias_meta, medidaMaisRecente.gasto_energetico_total).superavit_alto" class="mb-2 p-2 bg-yellow-50 border border-yellow-300 rounded-lg text-xs text-yellow-800">
                        <i class="pi pi-exclamation-triangle text-xs mr-1"></i>
                        Superávit elevado. Possível ganho de gordura.
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                        <div class="flex items-center justify-between text-xs p-2 bg-white rounded border border-emerald-200">
                            <div class="flex items-center gap-1.5">
                                <i class="pi pi-calendar text-xs text-emerald-700"></i>
                                <span class="text-emerald-700 font-medium">Em 4 semanas</span>
                            </div>
                            <span :class="[calcularVariacaoPesoPeriodos(formularioPlano.calorias_meta, medidaMaisRecente.gasto_energetico_total).variacao_4_semanas < 0 ? 'text-red-600' : 'text-blue-600', 'font-bold']">
                                {{ calcularVariacaoPesoPeriodos(formularioPlano.calorias_meta, medidaMaisRecente.gasto_energetico_total).variacao_4_semanas }} kg
                            </span>
                        </div>

                        <div class="flex items-center justify-between text-xs p-2 bg-white rounded border border-emerald-200">
                            <div class="flex items-center gap-1.5">
                                <i class="pi pi-calendar text-xs text-emerald-700"></i>
                                <span class="text-emerald-700 font-medium">Em 8 semanas</span>
                            </div>
                            <span :class="[calcularVariacaoPesoPeriodos(formularioPlano.calorias_meta, medidaMaisRecente.gasto_energetico_total).variacao_8_semanas < 0 ? 'text-red-600' : 'text-blue-600', 'font-bold']">
                                {{ calcularVariacaoPesoPeriodos(formularioPlano.calorias_meta, medidaMaisRecente.gasto_energetico_total).variacao_8_semanas }} kg
                            </span>
                        </div>

                        <div class="flex items-center justify-between text-xs p-2 bg-white rounded border border-emerald-200">
                            <div class="flex items-center gap-1.5">
                                <i class="pi pi-calendar text-xs text-emerald-700"></i>
                                <span class="text-emerald-700 font-medium">Em 12 semanas</span>
                            </div>
                            <span :class="[calcularVariacaoPesoPeriodos(formularioPlano.calorias_meta, medidaMaisRecente.gasto_energetico_total).variacao_12_semanas < 0 ? 'text-red-600' : 'text-blue-600', 'font-bold']">
                                {{ calcularVariacaoPesoPeriodos(formularioPlano.calorias_meta, medidaMaisRecente.gasto_energetico_total).variacao_12_semanas }} kg
                            </span>
                        </div>
                    </div>

                    <p class="text-xs text-slate-600 italic pt-3 border-t border-emerald-300">
                        <i class="pi pi-info-circle text-xs mr-1"></i>
                        Estimativa baseada em 7.700 kcal = 1 kg de gordura. Resultados variam conforme adesão e metabolismo.
                    </p>
                </div>
            </div>

            <!-- Refeições por dia -->
            <div class="p-3 bg-linear-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200 mt-2">
                <div class="flex items-center gap-1.5 mb-2">
                    <div class="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">
                        <i class="pi pi-home text-xs"></i>
                    </div>
                    <span class="text-xs font-semibold text-blue-900 uppercase">Refeições/dia <span class="text-red-600">*</span></span>
                </div>
                <div class="grid grid-cols-4 gap-1.5">
                    <button
                        v-for="num in [3, 4, 5, 6]"
                        :key="num"
                        @click="emit('update:formularioPlano', { ...formularioPlano, refeicoes_dia: num })"
                        :class="[
                            'py-1.5 rounded-lg border-2 transition-all text-center font-bold text-sm',
                            formularioPlano.refeicoes_dia === num ? 'border-blue-600 bg-blue-600 text-white shadow-lg' : 'border-blue-300 bg-white text-blue-700 hover:border-blue-500 hover:bg-blue-50'
                        ]"
                    >
                        {{ num }}
                    </button>
                </div>
                <p class="text-xs text-blue-600 mt-1.5">
                    <i class="pi pi-lightning text-xs mr-0.5"></i>
                    <span v-if="formularioPlano.refeicoes_dia">
                        Aproximadamente <strong>{{ Math.round(formularioPlano.calorias_meta / formularioPlano.refeicoes_dia) }}</strong> kcal por refeição
                    </span>
                    <span v-else>Selecione a quantidade</span>
                </p>
            </div>
        </section>

        <!-- Seção 3: Distribuição de Macros -->
        <section class="bg-white rounded-2xl border border-slate-200 shadow-sm p-3">
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-sm">📊</div>
                    <h3 class="text-base font-bold text-slate-800">Distribuição de Macros</h3>
                </div>
                <span
                    :class="[
                        'px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider',
                        formularioPlano.proteina_perc + formularioPlano.carboidrato_perc + formularioPlano.gordura_perc === 100
                            ? 'bg-emerald-100 text-emerald-700'
                            : formularioPlano.proteina_perc + formularioPlano.carboidrato_perc + formularioPlano.gordura_perc > 100
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                    ]"
                >
                    {{ formularioPlano.proteina_perc + formularioPlano.carboidrato_perc + formularioPlano.gordura_perc }}%
                </span>
            </div>

            <!-- Barra Visual de Distribuição -->
            <div class="mb-2">
                <div class="w-full h-4 rounded-full overflow-hidden flex bg-slate-100 border border-slate-200">
                    <div class="h-full bg-emerald-600 transition-all duration-300 shrink-0" :style="{ width: formularioPlano.proteina_perc + '%' }"></div>
                    <div class="h-full bg-blue-600 transition-all duration-300 shrink-0" :style="{ width: formularioPlano.carboidrato_perc + '%' }"></div>
                    <div class="h-full bg-red-600 transition-all duration-300 shrink-0" :style="{ width: formularioPlano.gordura_perc + '%' }"></div>
                </div>
            </div>

            <!-- Cards de Macros -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                <div class="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div class="flex items-center gap-1.5 mb-1.5">
                        <div class="w-2 h-2 rounded-full bg-emerald-600"></div>
                        <p class="text-xs font-bold text-emerald-700 uppercase">Proteína</p>
                    </div>
                    <p class="text-lg font-bold text-emerald-700">{{ formularioPlano.proteina_g }}<span class="text-xs text-emerald-600">g</span></p>
                    <p class="text-xs text-emerald-600 mt-0.5">{{ Math.round(formularioPlano.proteina_g * 4) }} kcal</p>
                </div>

                <div class="p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                    <div class="flex items-center gap-1.5 mb-1.5">
                        <div class="w-2 h-2 rounded-full bg-blue-600"></div>
                        <p class="text-xs font-bold text-blue-700 uppercase">Carboidrato</p>
                    </div>
                    <p class="text-lg font-bold text-blue-700">{{ formularioPlano.carboidrato_g }}<span class="text-xs text-blue-600">g</span></p>
                    <p class="text-xs text-blue-600 mt-0.5">{{ Math.round(formularioPlano.carboidrato_g * 4) }} kcal</p>
                </div>

                <div class="p-2.5 bg-red-50 border border-red-200 rounded-lg">
                    <div class="flex items-center gap-1.5 mb-1.5">
                        <div class="w-2 h-2 rounded-full bg-red-600"></div>
                        <p class="text-xs font-bold text-red-700 uppercase">Gordura</p>
                    </div>
                    <p class="text-lg font-bold text-red-700">{{ formularioPlano.gordura_g }}<span class="text-xs text-red-600">g</span></p>
                    <p class="text-xs text-red-600 mt-0.5">{{ Math.round(formularioPlano.gordura_g * 9) }} kcal</p>
                </div>
            </div>

            <!-- Sliders com Labels -->
            <div class="space-y-2 mt-3">
                <div class="space-y-1">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-1">
                            <div class="w-2 h-2 rounded-full bg-emerald-600"></div>
                            <span class="text-xs font-semibold text-slate-700">Proteínas</span>
                        </div>
                        <span class="text-xs font-bold text-emerald-600">{{ proteinaPerc }}%</span>
                    </div>
                    <Slider v-model="proteinaPerc" :min="5" :max="70" class="w-full" @update:model-value="emit('update:formularioPlano', { ...formularioPlano, proteina_perc: $event })" />
                </div>

                <div class="space-y-1">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-1">
                            <div class="w-2 h-2 rounded-full bg-blue-600"></div>
                            <span class="text-xs font-semibold text-slate-700">Carboidratos</span>
                        </div>
                        <span class="text-xs font-bold text-blue-600">{{ carboidratoPerc }}%</span>
                    </div>
                    <Slider v-model="carboidratoPerc" :min="5" :max="70" class="w-full" @update:model-value="emit('update:formularioPlano', { ...formularioPlano, carboidrato_perc: $event })" />
                </div>

                <div class="space-y-1">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-1">
                            <div class="w-2 h-2 rounded-full bg-red-600"></div>
                            <span class="text-xs font-semibold text-slate-700">Gorduras</span>
                        </div>
                        <span class="text-xs font-bold text-red-600">{{ gorduraPerc }}%</span>
                    </div>
                    <Slider v-model="gorduraPerc" :min="5" :max="70" class="w-full" @update:model-value="emit('update:formularioPlano', { ...formularioPlano, gordura_perc: $event })" />
                </div>
            </div>

            <div class="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p class="text-xs text-blue-700 flex items-start gap-1.5">
                    <i class="pi pi-info-circle text-xs shrink-0 mt-0.5"></i>
                    <span>Ajuste os sliders para distribuir as calorias.</span>
                </p>
            </div>
        </section>
    </div>
</template>
