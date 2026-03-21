<script setup>
import AlimentoService from '@/service/AlimentoService';
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import { computed, defineExpose, ref } from 'vue';

// Props
const props = defineProps({
    formularioPlano: { type: Object, required: true },
    medidaMaisRecente: { type: Object, default: null },
    anamnese: { type: Object, default: null },
    paciente: { type: Object, default: null }
});

// Emits
const emit = defineEmits(['update:formularioPlano', 'salvar', 'voltar']);

// Local state
const buscarAlimentoText = ref('');
const resultadosBusca = ref([]);
const refeicaoExpandida = ref(null);
const formQuantidade = ref({ quantidade: 1, unidade: 'g', kcal: 0 });
const searchTimeout = ref(null);

// Computed
const calcularTotaisDia = computed(() => {
    const totais = {
        carboidrato: 0,
        proteina: 0,
        gordura: 0,
        kcal: 0
    };

    if (props.formularioPlano.refeicoes) {
        props.formularioPlano.refeicoes.forEach((refeicao) => {
            refeicao.alimentos?.forEach((alimento) => {
                totais.carboidrato += alimento.carboidrato || 0;
                totais.proteina += alimento.proteina || 0;
                totais.gordura += alimento.gordura || 0;
                totais.kcal += alimento.kcal || 0;
            });
        });
    }

    return totais;
});

const calcularTotaisRefeicao = (alimentos) => {
    return {
        carboidrato: alimentos.reduce((acc, a) => acc + (a.carboidrato || 0), 0),
        proteina: alimentos.reduce((acc, a) => acc + (a.proteina || 0), 0),
        gordura: alimentos.reduce((acc, a) => acc + (a.gordura || 0), 0),
        kcal: alimentos.reduce((acc, a) => acc + (a.kcal || 0), 0)
    };
};

// Methods
const buscarAlimentos = (texto) => {
    if (texto.length < 2) {
        resultadosBusca.value = [];
        return;
    }

    // Clear previous timeout
    if (searchTimeout.value) {
        clearTimeout(searchTimeout.value);
    }

    // Debounce search - 300ms delay
    searchTimeout.value = setTimeout(async () => {
        try {
            const response = await AlimentoService.buscarAlimentos({
                busca: texto,
                limite: 10
            });
            resultadosBusca.value = Array.isArray(response.data) ? response.data : response.data?.alimentos || [];
        } catch (error) {
            console.error('Erro ao buscar alimentos:', error);
            resultadosBusca.value = [];
        }
    }, 300);
};

const adicionarItem = (refeicaoIndex, alimento) => {
    const novas_refeicoes = [...props.formularioPlano.refeicoes];
    if (!novas_refeicoes[refeicaoIndex].alimentos) {
        novas_refeicoes[refeicaoIndex].alimentos = [];
    }

    // Calcula KCal se não foi preenchido
    let kcal = formQuantidade.value.kcal || alimento.kcal_padrao || 0;
    if (!formQuantidade.value.kcal && alimento.kcal_padrao) {
        kcal = (alimento.kcal_padrao / 100) * formQuantidade.value.quantidade;
    }

    novas_refeicoes[refeicaoIndex].alimentos.push({
        id: alimento.id,
        nome: alimento.nome,
        quantidade: formQuantidade.value.quantidade,
        unidade: formQuantidade.value.unidade,
        kcal,
        carboidrato: (alimento.carboidratos || 0) * (formQuantidade.value.quantidade / 100),
        proteina: (alimento.proteinas || 0) * (formQuantidade.value.quantidade / 100),
        gordura: (alimento.lipidios || 0) * (formQuantidade.value.quantidade / 100)
    });

    emit('update:formularioPlano', { ...props.formularioPlano, refeicoes: novas_refeicoes });
    buscarAlimentoText.value = '';
    resultadosBusca.value = [];
    formQuantidade.value = { quantidade: 1, unidade: 'g', kcal: 0 };
};

const deletarItem = (refeicaoIndex, alimentoIndex) => {
    const novas_refeicoes = [...props.formularioPlano.refeicoes];
    novas_refeicoes[refeicaoIndex].alimentos.splice(alimentoIndex, 1);
    emit('update:formularioPlano', { ...props.formularioPlano, refeicoes: novas_refeicoes });
};

const adicionarRefeicaoExtra = () => {
    const novas_refeicoes = [...props.formularioPlano.refeicoes];

    novas_refeicoes.push({
        nome: `Refeição Extra ${novas_refeicoes.length + 1}`,
        emoji: '🍽️',
        horario: '20:00',
        alimentos: []
    });

    emit('update:formularioPlano', { ...props.formularioPlano, refeicoes: novas_refeicoes });
};

const validar = () => {
    if (!props.formularioPlano.refeicoes || props.formularioPlano.refeicoes.length === 0) {
        return false;
    }

    return props.formularioPlano.refeicoes.some((ref) => ref.alimentos && ref.alimentos.length > 0);
};

defineExpose({ validar });
</script>

<template>
    <div class="space-y-3 overflow-y-auto pr-4">
        <!-- Barra Sticky de Progresso -->
        <div class="sticky top-0 z-30 bg-white rounded-lg border border-slate-200 p-3 shadow-md">
            <div class="grid grid-cols-5 gap-2">
                <div class="text-center">
                    <div class="flex items-center justify-center w-8 h-8 mx-auto mb-1 rounded-full bg-emerald-100">
                        <i class="pi pi-fire text-emerald-600 text-xs"></i>
                    </div>
                    <p class="text-xs font-bold text-slate-800">{{ Math.round(calcularTotaisDia.kcal) }}</p>
                    <p class="text-xs text-slate-600">kcal</p>
                </div>

                <div class="text-center">
                    <div class="w-full h-1 rounded-full bg-slate-200 mb-1">
                        <div class="h-full bg-emerald-600 rounded-full transition-all" :style="{ width: (calcularTotaisDia.proteina / (formularioPlano.proteina_g || 1)) * 100 + '%' }"></div>
                    </div>
                    <p class="text-xs font-bold text-emerald-700">{{ Math.round(calcularTotaisDia.proteina) }}g</p>
                    <p class="text-xs text-slate-600">Proteína</p>
                </div>

                <div class="text-center">
                    <div class="w-full h-1 rounded-full bg-slate-200 mb-1">
                        <div class="h-full bg-blue-600 rounded-full transition-all" :style="{ width: (calcularTotaisDia.carboidrato / (formularioPlano.carboidrato_g || 1)) * 100 + '%' }"></div>
                    </div>
                    <p class="text-xs font-bold text-blue-700">{{ Math.round(calcularTotaisDia.carboidrato) }}g</p>
                    <p class="text-xs text-slate-600">Carbo</p>
                </div>

                <div class="text-center">
                    <div class="w-full h-1 rounded-full bg-slate-200 mb-1">
                        <div class="h-full bg-red-600 rounded-full transition-all" :style="{ width: (calcularTotaisDia.gordura / (formularioPlano.gordura_g || 1)) * 100 + '%' }"></div>
                    </div>
                    <p class="text-xs font-bold text-red-700">{{ Math.round(calcularTotaisDia.gordura) }}g</p>
                    <p class="text-xs text-slate-600">Gordura</p>
                </div>

                <div class="text-center">
                    <div class="w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-1" :class="calcularTotaisDia.kcal <= formularioPlano.calorias_meta ? 'bg-emerald-100' : 'bg-red-100'">
                        <i
                            :class="[
                                calcularTotaisDia.kcal <= formularioPlano.calorias_meta ? 'text-emerald-600' : 'text-red-600',
                                'pi',
                                calcularTotaisDia.kcal <= formularioPlano.calorias_meta ? 'pi-check-circle' : 'pi-exclamation-circle',
                                'text-xs'
                            ]"
                        ></i>
                    </div>
                    <p class="text-xs font-bold text-slate-700">{{ Math.round(formularioPlano.calorias_meta - calcularTotaisDia.kcal) }}</p>
                    <p class="text-xs text-slate-600">Restante</p>
                </div>
            </div>
        </div>

        <!-- Refeições Cards -->
        <div class="space-y-2">
            <div v-for="(refeicao, refeicaoIndex) in formularioPlano.refeicoes" :key="refeicaoIndex" class="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <!-- Header da Refeição -->
                <button class="w-full p-3 flex items-center justify-between hover:bg-slate-50 transition-colors" @click="refeicaoExpandida = refeicaoExpandida === refeicaoIndex ? null : refeicaoIndex">
                    <div class="flex items-center gap-3 flex-1 text-left">
                        <span class="text-xl">{{ refeicao.emoji || '🍽️' }}</span>
                        <div>
                            <p class="font-bold text-sm text-slate-800">{{ refeicao.nome }}</p>
                            <p class="text-xs text-slate-600">{{ refeicao.horario || '—' }}</p>
                        </div>
                    </div>

                    <div class="flex items-center gap-2">
                        <div class="text-right">
                            <p class="text-xs font-bold text-slate-700">{{ refeicao.alimentos?.length || 0 }} items</p>
                            <p class="text-xs text-slate-600">{{ Math.round(calcularTotaisRefeicao(refeicao.alimentos || []).kcal) }} kcal</p>
                        </div>
                        <i :class="['pi', 'transition-transform', refeicaoExpandida === refeicaoIndex ? 'pi-chevron-up' : 'pi-chevron-down']"></i>
                    </div>
                </button>

                <!-- Mini Progress Bar -->
                <div v-if="refeicao.alimentos && refeicao.alimentos.length > 0" class="px-3 h-1 bg-slate-100">
                    <div class="h-full flex rounded-full overflow-hidden">
                        <div class="bg-emerald-500 transition-all" :style="{ width: (calcularTotaisRefeicao(refeicao.alimentos).proteina / (formularioPlano.proteina_g / formularioPlano.refeicoes_dia || 1)) * 100 + '%' }"></div>
                        <div class="bg-blue-500 transition-all" :style="{ width: (calcularTotaisRefeicao(refeicao.alimentos).carboidrato / (formularioPlano.carboidrato_g / formularioPlano.refeicoes_dia || 1)) * 100 + '%' }"></div>
                        <div class="bg-red-500 transition-all" :style="{ width: (calcularTotaisRefeicao(refeicao.alimentos).gordura / (formularioPlano.gordura_g / formularioPlano.refeicoes_dia || 1)) * 100 + '%' }"></div>
                    </div>
                </div>

                <!-- Corpo da Refeição (Expandido) -->
                <div v-if="refeicaoExpandida === refeicaoIndex" class="border-t border-slate-200">
                    <!-- Tabela de Alimentos -->
                    <div v-if="refeicao.alimentos && refeicao.alimentos.length > 0" class="p-3 bg-slate-50">
                        <table class="w-full text-xs">
                            <thead>
                                <tr class="text-slate-700 font-bold border-b border-slate-200">
                                    <th class="text-left py-1.5 px-1">Nome</th>
                                    <th class="text-center py-1.5 px-1">Qtd</th>
                                    <th class="text-right py-1.5 px-1">Kcal</th>
                                    <th class="text-center py-1.5 px-1">—</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(alimento, idx) in refeicao.alimentos" :key="idx" class="border-b border-slate-200 hover:bg-white transition-colors">
                                    <td class="py-1.5 px-1 font-medium text-slate-800">{{ alimento.nome }}</td>
                                    <td class="py-1.5 px-1 text-center text-slate-700">{{ alimento.quantidade }} {{ alimento.unidade }}</td>
                                    <td class="py-1.5 px-1 text-right font-bold text-slate-800">{{ Math.round(alimento.kcal) }}</td>
                                    <td class="py-1.5 px-1 text-center">
                                        <button @click="deletarItem(refeicaoIndex, idx)" class="text-red-600 hover:text-red-700 transition-colors">
                                            <i class="pi pi-trash text-xs"></i>
                                        </button>
                                    </td>
                                </tr>
                                <tr class="bg-white font-bold text-slate-800 border-t-2 border-slate-400">
                                    <td class="py-2 px-1">Subtotal</td>
                                    <td></td>
                                    <td class="text-right py-2 px-1">{{ Math.round(calcularTotaisRefeicao(refeicao.alimentos).kcal) }} kcal</td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Busca de Alimentos -->
                    <div class="p-3 space-y-2">
                        <InputText
                            v-model="buscarAlimentoText"
                            @update:model-value="buscarAlimentos"
                            placeholder="Buscar alimento..."
                            class="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />

                        <!-- Dropdown de Resultados -->
                        <div v-if="resultadosBusca.length > 0" class="border border-slate-200 rounded-lg bg-white max-h-40 overflow-y-auto">
                            <button
                                v-for="alimento in resultadosBusca"
                                :key="alimento.id"
                                @click="
                                    () => {
                                        buscarAlimentoText = alimento.nome;
                                        resultadosBusca = [];
                                    }
                                "
                                class="w-full text-left px-3 py-2 hover:bg-slate-100 transition-colors border-b border-slate-100 text-xs"
                            >
                                <p class="font-medium text-slate-800">{{ alimento.nome }}</p>
                                <p class="text-slate-600">{{ alimento.kcal_padrao }} kcal / 100g</p>
                            </button>
                        </div>

                        <!-- Formulário de Quantidade -->
                        <div v-if="buscarAlimentoText" class="space-y-2 bg-blue-50 p-2 rounded-lg border border-blue-200">
                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <label class="text-xs font-semibold text-slate-700 block mb-1">Quantidade</label>
                                    <InputNumber v-model="formQuantidade.quantidade" :use-grouping="false" class="w-full px-2 py-1 text-sm" placeholder="100" />
                                </div>
                                <div>
                                    <label class="text-xs font-semibold text-slate-700 block mb-1">Unidade</label>
                                    <select v-model="formQuantidade.unidade" class="w-full px-2 py-1 text-sm border border-slate-200 rounded-lg bg-white">
                                        <option>g</option>
                                        <option>ml</option>
                                        <option>un</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label class="text-xs font-semibold text-slate-700 block mb-1">KCal (opcional)</label>
                                <InputNumber v-model="formQuantidade.kcal" :use-grouping="false" class="w-full px-2 py-1 text-sm" placeholder="Auto-calcular" />
                            </div>

                            <div class="flex gap-2 pt-2">
                                <Button
                                    @click="
                                        () => {
                                            const alimento = resultadosBusca.find((a) => a.nome === buscarAlimentoText);
                                            if (alimento) adicionarItem(refeicaoIndex, alimento);
                                        }
                                    "
                                    label="Adicionar"
                                    class="flex-1 py-1 text-xs"
                                    icon="pi pi-plus"
                                />
                                <Button
                                    @click="
                                        () => {
                                            buscarAlimentoText = '';
                                            resultadosBusca = [];
                                            formQuantidade = { quantidade: 1, unidade: 'g', kcal: 0 };
                                        }
                                    "
                                    label="Cancelar"
                                    severity="secondary"
                                    class="flex-1 py-1 text-xs"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Adicionar Refeição Extra -->
        <button @click="adicionarRefeicaoExtra" class="w-full py-3 rounded-lg border-2 border-dashed border-slate-300 text-center text-sm font-bold text-slate-600 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
            <i class="pi pi-plus mr-2"></i>
            Adicionar refeição extra
        </button>
    </div>
</template>
