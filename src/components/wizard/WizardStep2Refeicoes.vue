<template>
    <div class="space-y-3 overflow-y-auto pr-4">
        <!-- Barra Sticky de Progresso -->
        <div class="sticky top-0 z-30 bg-white rounded-lg border border-slate-200 p-3 shadow-md">
            <div class="grid grid-cols-4 gap-2 md:grid-cols-4 lg:grid-cols-4">
                <!-- Total Calorias -->
                <div class="text-center">
                    <div class="flex items-center justify-center w-8 h-8 mx-auto mb-1 rounded-full bg-emerald-100">
                        <i class="pi pi-fire text-emerald-600 text-xs"></i>
                    </div>
                    <p class="text-xs font-bold text-slate-800">{{ Math.round(calcularTotaisDia().total_calorias) }}</p>
                    <p class="text-xs text-slate-600">kcal</p>
                </div>

                <!-- Proteína -->
                <div class="text-center">
                    <div class="w-full h-1 rounded-full bg-slate-200 mb-1">
                        <div class="h-full bg-emerald-600 rounded-full transition-all" :style="{ width: Math.min((calcularTotaisDia().total_proteinas / (formularioPlano.proteina_g || 1)) * 100, 100) + '%' }"></div>
                    </div>
                    <p class="text-xs font-bold text-emerald-700">{{ Math.round(calcularTotaisDia().total_proteinas) }}g</p>
                    <p class="text-xs text-slate-600">Proteína</p>
                </div>

                <!-- Carboidrato -->
                <div class="text-center">
                    <div class="w-full h-1 rounded-full bg-slate-200 mb-1">
                        <div class="h-full bg-blue-600 rounded-full transition-all" :style="{ width: Math.min((calcularTotaisDia().total_carboidrato / (formularioPlano.carboidrato_g || 1)) * 100, 100) + '%' }"></div>
                    </div>
                    <p class="text-xs font-bold text-blue-700">{{ Math.round(calcularTotaisDia().total_carboidrato) }}g</p>
                    <p class="text-xs text-slate-600">Carbo</p>
                </div>

                <!-- Gordura -->
                <div class="text-center">
                    <div class="w-full h-1 rounded-full bg-slate-200 mb-1">
                        <div class="h-full bg-red-600 rounded-full transition-all" :style="{ width: Math.min((calcularTotaisDia().total_gordura / (formularioPlano.gordura_g || 1)) * 100, 100) + '%' }"></div>
                    </div>
                    <p class="text-xs font-bold text-red-700">{{ Math.round(calcularTotaisDia().total_gordura) }}g</p>
                    <p class="text-xs text-slate-600">Gordura</p>
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
                            <p class="text-xs font-bold text-slate-700">{{ refeicao.itens?.length || 0 }} items</p>
                            <p class="text-xs text-slate-600">{{ Math.round(refeicao.total_calorias || 0) }} kcal</p>
                        </div>
                        <i :class="['pi', 'transition-transform', refeicaoExpandida === refeicaoIndex ? 'pi-chevron-up' : 'pi-chevron-down']"></i>
                    </div>
                </button>

                <!-- Mini Progress Bar -->
                <div v-if="refeicao.itens && refeicao.itens.length > 0" class="px-3 h-1 bg-slate-100">
                    <div class="h-full flex rounded-full overflow-hidden">
                        <div class="bg-emerald-500 transition-all" :style="{ width: Math.min((refeicao.total_proteinas_g / (formularioPlano.proteina_g / formularioPlano.refeicoes_dia || 1)) * 100, 100) + '%' }"></div>
                        <div class="bg-blue-500 transition-all" :style="{ width: Math.min((refeicao.total_carboidrato_g / (formularioPlano.carboidrato_g / formularioPlano.refeicoes_dia || 1)) * 100, 100) + '%' }"></div>
                        <div class="bg-red-500 transition-all" :style="{ width: Math.min((refeicao.total_gordura_g / (formularioPlano.gordura_g / formularioPlano.refeicoes_dia || 1)) * 100, 100) + '%' }"></div>
                    </div>
                </div>

                <!-- Corpo da Refeição (Expandido) -->
                <div v-if="refeicaoExpandida === refeicaoIndex" class="border-t border-slate-200">
                    <!-- Tabela de Alimentos -->
                    <div v-if="refeicao.itens && refeicao.itens.length > 0" class="p-3 bg-slate-50">
                        <table class="w-full text-xs">
                            <thead>
                                <tr class="text-slate-700 font-bold border-b border-slate-200">
                                    <th class="text-left py-1.5 px-1">Nome</th>
                                    <th class="text-center py-1.5 px-1">Qtd</th>
                                    <th class="text-right py-1.5 px-1">Kcal</th>
                                    <th class="text-center py-1.5 px-1 w-8">—</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(item, idx) in refeicao.itens" :key="idx" class="border-b border-slate-200 hover:bg-white transition-colors">
                                    <td class="py-1.5 px-1 font-medium text-slate-800">{{ item.nome_alimento }}</td>
                                    <td class="py-1.5 px-1 text-center text-slate-700">{{ item.quantidade }} {{ item.unidade }}</td>
                                    <td class="py-1.5 px-1 text-right font-bold text-slate-800">{{ Math.round(item.calorias_calculadas || 0) }}</td>
                                    <td class="py-1.5 px-1 text-center">
                                        <button @click="deletarItem(refeicaoIndex, idx)" class="text-red-600 hover:text-red-700 transition-colors">
                                            <i class="pi pi-trash text-xs"></i>
                                        </button>
                                    </td>
                                </tr>
                                <tr class="bg-white font-bold text-slate-800 border-t-2 border-slate-400">
                                    <td class="py-2 px-1">Subtotal</td>
                                    <td></td>
                                    <td class="text-right py-2 px-1">{{ Math.round(refeicao.total_calorias || 0) }} kcal</td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Busca de Alimentos -->
                    <div class="p-3 space-y-2">
                        <!-- Input e Dropdown -->
                        <div class="relative">
                            <div class="flex gap-2">
                                <div class="relative flex-1">
                                    <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                                    <input
                                        v-model="buscarAlimentoText"
                                        @input="buscarAlimentosDebounce(buscarAlimentoText)"
                                        placeholder="Busque por alimento..."
                                        class="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    />
                                </div>
                                <input
                                    v-model="formQuantidade.quantidade"
                                    type="number"
                                    placeholder="Qtd"
                                    class="w-20 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center"
                                />
                                <select v-model="formQuantidade.unidade" class="w-28 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                                    <option>g</option>
                                    <option>ml</option>
                                    <option>colher de sopa</option>
                                    <option>colher de chá</option>
                                    <option>xícara</option>
                                    <option>unidade</option>
                                </select>
                            </div>

                            <!-- Dropdown de Resultados -->
                            <div v-if="resultadosBusca.length > 0" class="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden max-h-64 overflow-y-auto">
                                <button
                                    v-for="alimento in resultadosBusca"
                                    :key="alimento.id"
                                    @click="selecionarAlimento(alimento)"
                                    type="button"
                                    class="w-full px-4 py-3 flex justify-between items-center hover:bg-slate-50 border-b border-slate-100 text-left transition-colors group"
                                >
                                    <div>
                                        <p class="text-sm font-medium text-slate-800 group-hover:text-emerald-600">{{ alimento.nome }}</p>
                                        <p class="text-xs text-slate-600">{{ Math.round(alimento.energiaKcal || 0) }} kcal / 100g</p>
                                    </div>
                                    <i class="pi pi-plus-circle text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Formulário de Quantidade (após seleção) -->
                        <div v-if="formQuantidade.alimento_id" class="space-y-2 bg-blue-50 p-2 rounded-lg border border-blue-200">
                            <div class="flex gap-2 pt-2">
                                <button @click="adicionarItem(refeicaoIndex)" class="flex-1 py-1 px-2 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold">
                                    <i class="pi pi-plus mr-1"></i> Adicionar
                                </button>
                                <button
                                    @click="
                                        () => {
                                            buscarAlimentoText = '';
                                            resultadosBusca = [];
                                            formQuantidade = { alimento_id: null, nome_alimento: '', alimento: null, quantidade: 1, unidade: 'g' };
                                        }
                                    "
                                    class="flex-1 py-1 px-2 text-xs bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition-colors font-semibold"
                                >
                                    Cancelar
                                </button>
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

<script setup>
import AlimentoService from '@/service/AlimentoService';
import { defineExpose, ref } from 'vue';

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
const formQuantidade = ref({ alimento_id: null, nome_alimento: '', alimento: null, quantidade: 1, unidade: 'g' });
const paginaAtualAlimentos = ref(1);
const totalPaginasAlimentos = ref(1);
let searchTimeout = null;

// Helper function to calculate daily totals
const calcularTotaisDia = () => {
    const totais = {
        total_calorias: 0,
        total_carboidrato: 0,
        total_proteinas: 0,
        total_gordura: 0,
        perc_calorias: 0,
        perc_carboidrato: 0,
        perc_proteinas: 0,
        perc_gordura: 0
    };

    if (props.formularioPlano.refeicoes) {
        props.formularioPlano.refeicoes.forEach((refeicao) => {
            totais.total_calorias += refeicao.total_calorias || 0;
            totais.total_carboidrato += refeicao.total_carboidrato_g || 0;
            totais.total_proteinas += refeicao.total_proteinas_g || 0;
            totais.total_gordura += refeicao.total_gordura_g || 0;
        });
    }

    // Calcular percentuais
    totais.perc_calorias = props.formularioPlano.calorias_meta ? Math.round((totais.total_calorias / props.formularioPlano.calorias_meta) * 100) : 0;
    totais.perc_carboidrato = props.formularioPlano.carboidrato_g ? Math.round((totais.total_carboidrato / props.formularioPlano.carboidrato_g) * 100) : 0;
    totais.perc_proteinas = props.formularioPlano.proteina_g ? Math.round((totais.total_proteinas / props.formularioPlano.proteina_g) * 100) : 0;
    totais.perc_gordura = props.formularioPlano.gordura_g ? Math.round((totais.total_gordura / props.formularioPlano.gordura_g) * 100) : 0;

    return totais;
};

// Debounce search function
const buscarAlimentosDebounce = (texto) => {
    if (texto.length < 2) {
        resultadosBusca.value = [];
        return;
    }

    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    searchTimeout = setTimeout(async () => {
        try {
            const response = await AlimentoService.buscarAlimentos({
                busca: texto,
                limite: 20,
                pagina: 1
            });
            console.log('🔍 Resposta API AlimentoService:', response);
            console.log('🔍 response.data:', response.data);

            // Tentar múltiplos caminhos de dados
            let alimentos = [];
            if (Array.isArray(response.data)) {
                alimentos = response.data;
            } else if (response.data?.alimentos && Array.isArray(response.data.alimentos)) {
                alimentos = response.data.alimentos;
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                alimentos = response.data.data;
            }

            console.log('🔍 Alimentos extraídos:', alimentos);
            resultadosBusca.value = alimentos;
            paginaAtualAlimentos.value = 1;
            totalPaginasAlimentos.value = response.data?.total_paginas || response.data?.totalPages || 1;
        } catch (error) {
            console.error('❌ Erro ao buscar alimentos:', error);
            console.error('❌ Error details:', error.response?.data || error.message);
            resultadosBusca.value = [];
        }
    }, 300);
};

// Calculate nutrient item
const calcularNutrienteItem = (alimento, quantidade, unidade) => {
    if (!alimento) return { calorias: 0 };

    const conversoes = {
        g: quantidade,
        ml: quantidade,
        'colher de sopa': quantidade * 15,
        'colher de chá': quantidade * 5,
        xícara: quantidade * 200,
        unidade: quantidade * 100
    };

    const gramasTotal = conversoes[unidade] || quantidade;
    const fator = gramasTotal / 100;

    const energiaKcal = typeof alimento.energiaKcal === 'string' ? parseFloat(alimento.energiaKcal) : alimento.energiaKcal;

    return {
        calorias: Math.round(energiaKcal * fator * 10) / 10
    };
};

// Select alimento
const selecionarAlimento = (alimento) => {
    formQuantidade.value = {
        alimento_id: alimento.id,
        nome_alimento: alimento.nome,
        alimento: alimento,
        quantidade: 1,
        unidade: 'g'
    };
    buscarAlimentoText.value = alimento.nome;
    resultadosBusca.value = [];
};

// Add item to refeição
const adicionarItem = (refeicaoIndex) => {
    if (!formQuantidade.value.alimento_id) return;

    const novas_refeicoes = [...props.formularioPlano.refeicoes];
    const refeicao = novas_refeicoes[refeicaoIndex];

    if (!refeicao.itens) {
        refeicao.itens = [];
    }

    const nutrientes = calcularNutrienteItem(formQuantidade.value.alimento, formQuantidade.value.quantidade, formQuantidade.value.unidade);

    refeicao.itens.push({
        id: formQuantidade.value.alimento_id,
        nome_alimento: formQuantidade.value.nome_alimento,
        grupo_alimento: formQuantidade.value.alimento.grupo || '—',
        quantidade: formQuantidade.value.quantidade,
        unidade: formQuantidade.value.unidade,
        calorias_calculadas: nutrientes.calorias,
        proteinas_calculadas: 0,
        carboidratos_calculados: 0,
        gorduras_calculadas: 0
    });

    // Recalculate refeição totals
    refeicao.total_calorias = refeicao.itens.reduce((acc, item) => acc + (item.calorias_calculadas || 0), 0);
    refeicao.total_proteinas_g = refeicao.itens.reduce((acc, item) => acc + (item.proteinas_calculadas || 0), 0);
    refeicao.total_carboidrato_g = refeicao.itens.reduce((acc, item) => acc + (item.carboidratos_calculados || 0), 0);
    refeicao.total_gordura_g = refeicao.itens.reduce((acc, item) => acc + (item.gorduras_calculadas || 0), 0);

    emit('update:formularioPlano', { ...props.formularioPlano, refeicoes: novas_refeicoes });

    // Reset form
    formQuantidade.value = { alimento_id: null, nome_alimento: '', alimento: null, quantidade: 1, unidade: 'g' };
    buscarAlimentoText.value = '';
    resultadosBusca.value = [];
};

// Delete item from refeição
const deletarItem = (refeicaoIndex, itemIndex) => {
    const novas_refeicoes = [...props.formularioPlano.refeicoes];
    const refeicao = novas_refeicoes[refeicaoIndex];

    refeicao.itens.splice(itemIndex, 1);

    // Recalculate totals
    refeicao.total_calorias = refeicao.itens.reduce((acc, item) => acc + (item.calorias_calculadas || 0), 0);
    refeicao.total_proteinas_g = refeicao.itens.reduce((acc, item) => acc + (item.proteinas_calculadas || 0), 0);
    refeicao.total_carboidrato_g = refeicao.itens.reduce((acc, item) => acc + (item.carboidratos_calculados || 0), 0);
    refeicao.total_gordura_g = refeicao.itens.reduce((acc, item) => acc + (item.gorduras_calculadas || 0), 0);

    emit('update:formularioPlano', { ...props.formularioPlano, refeicoes: novas_refeicoes });
};

// Add extra refeição
const adicionarRefeicaoExtra = () => {
    const novas_refeicoes = [...props.formularioPlano.refeicoes];
    novas_refeicoes.push({
        nome: `Refeição Extra ${novas_refeicoes.length + 1}`,
        horario: '20:00',
        itens: [],
        meta_calorias: 0,
        meta_proteinas_g: 0,
        meta_carboidrato_g: 0,
        meta_gordura_g: 0,
        total_calorias: 0,
        total_proteinas_g: 0,
        total_carboidrato_g: 0,
        total_gordura_g: 0
    });
    emit('update:formularioPlano', { ...props.formularioPlano, refeicoes: novas_refeicoes });
};

const validar = () => {
    if (!props.formularioPlano.refeicoes || props.formularioPlano.refeicoes.length === 0) {
        return false;
    }
    return props.formularioPlano.refeicoes.some((ref) => ref.itens && ref.itens.length > 0);
};

defineExpose({ validar, calcularTotaisDia });
</script>
