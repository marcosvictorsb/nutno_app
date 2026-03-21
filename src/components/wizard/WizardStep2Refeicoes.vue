<script setup>
import { usePlanosAlimentares } from '@/composables/usePlanosAlimentares';
import AlimentoService from '@/service/AlimentoService';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import ProgressBar from 'primevue/progressbar';
import Skeleton from 'primevue/skeleton';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

// Props
const props = defineProps({
    formularioPlano: {
        type: Object,
        required: true
    }
});

// Emits
const emit = defineEmits(['update:formularioPlano']);

// Composables
const { calcularNutrienteItem, calcularTotalRefeicao, calcularTotaisDia } = usePlanosAlimentares();

// Estados do Step 2
const buscarAlimentoText = ref('');
const resultadosBusca = ref([]);
const loadingBusca = ref(false);
const carregandoMaisAlimentos = ref(false);
const paginaAtualAlimentos = ref(1);
const totalPaginasAlimentos = ref(1);
const refeicaoExpandida = ref(0); // Qual refeição está expandida
const seindoEditado = ref(null); // { refeicaoIndex, itemIndex }
const dropdownObserver = ref(null);
const formQuantidade = ref({
    alimento_id: null,
    nome_alimento: '',
    grupo_alimento: '',
    quantidade: 100,
    unidade: 'g',
    calorias_por_100: 0
});
let debounceTimer = null;

// Nomes das refeições
const refeicoes_nomes = ['Café da Manhã', 'Lanche Manhã', 'Almoço', 'Lanche Tarde', 'Jantar', 'Ceia'];

// ===== FUNÇÕES DE BUSCA INTELIGENTE =====

/**
 * Busca de alimentos com debounce
 */
const buscarAlimentosDebounce = () => {
    clearTimeout(debounceTimer);

    if (buscarAlimentoText.value.length < 2) {
        resultadosBusca.value = [];
        return;
    }

    debounceTimer = setTimeout(async () => {
        await buscarAlimentos();
    }, 300);
};

/**
 * Busca alimentos na API
 */
const buscarAlimentos = async () => {
    if (buscarAlimentoText.value.length < 2) return;

    loadingBusca.value = true;
    paginaAtualAlimentos.value = 1;

    try {
        const { alimentos, totalPaginas } = await AlimentoService.buscarAlimentos({
            query: buscarAlimentoText.value,
            pagina: 1,
            limite: 20
        });

        resultadosBusca.value = alimentos || [];
        totalPaginasAlimentos.value = totalPaginas || 1;
    } catch (erro) {
        console.error('❌ Erro ao buscar alimentos:', erro);
        resultadosBusca.value = [];
    } finally {
        loadingBusca.value = false;
    }
};

/**
 * Carrega mais alimentos (paginação)
 */
const carregarMaisAlimentos = async () => {
    if (carregandoMaisAlimentos.value || paginaAtualAlimentos.value >= totalPaginasAlimentos.value) {
        return;
    }

    carregandoMaisAlimentos.value = true;
    paginaAtualAlimentos.value++;

    try {
        const { alimentos } = await AlimentoService.buscarAlimentos({
            query: buscarAlimentoText.value,
            pagina: paginaAtualAlimentos.value,
            limite: 20
        });

        resultadosBusca.value.push(...(alimentos || []));
    } catch (erro) {
        console.error('❌ Erro ao carregar mais alimentos:', erro);
        paginaAtualAlimentos.value--;
    } finally {
        carregandoMaisAlimentos.value = false;
    }
};

// ===== FUNÇÕES DE SELEÇÃO E CONFIRMAÇÃO =====

/**
 * Seleciona um alimento e prepara para adicionar
 */
const selecionarAlimento = (alimento, refeicaoIndex) => {
    formQuantidade.value = {
        alimento_id: alimento.id,
        nome_alimento: alimento.nome,
        grupo_alimento: alimento.grupo,
        quantidade: 100,
        unidade: 'g',
        calorias_por_100: alimento.calorias_por_100 || 0
    };
    refeicaoExpandida.value = refeicaoIndex;
};

/**
 * Confirma adição de alimento e calcula nutrientes
 */
const confirmarQuantidade = (refeicaoIndex) => {
    if (!formQuantidade.value.alimento_id || formQuantidade.value.quantidade <= 0) {
        return;
    }

    // Calcula nutrientes do item
    const nutriente = calcularNutrienteItem(
        {
            id: formQuantidade.value.alimento_id,
            nome: formQuantidade.value.nome_alimento,
            grupo: formQuantidade.value.grupo_alimento,
            calorias_por_100: formQuantidade.value.calorias_por_100
        },
        formQuantidade.value.quantidade,
        formQuantidade.value.unidade
    );

    // Adiciona outro item à refeição
    const novoItem = {
        alimento_id: formQuantidade.value.alimento_id,
        nome: formQuantidade.value.nome_alimento,
        grupo: formQuantidade.value.grupo_alimento,
        quantidade: formQuantidade.value.quantidade,
        unidade: formQuantidade.value.unidade,
        calorias: nutriente.calorias,
        proteina: nutriente.proteina,
        carboidrato: nutriente.carboidrato,
        gordura: nutriente.gordura,
        fibra: nutriente.fibra
    };

    // Faz uma cópia do formulário para evitar mutação direta
    const formularioAtualizado = JSON.parse(JSON.stringify(props.formularioPlano));
    formularioAtualizado.refeicoes[refeicaoIndex].itens.push(novoItem);

    // Calcula totais da refeição
    calcularTotalRefeicao(formularioAtualizado.refeicoes[refeicaoIndex]);

    // Notifica parent
    emit('update:formularioPlano', formularioAtualizado);

    // Reseta formulário
    formQuantidade.value = {
        alimento_id: null,
        nome_alimento: '',
        grupo_alimento: '',
        quantidade: 100,
        unidade: 'g',
        calorias_por_100: 0
    };

    buscarAlimentoText.value = '';
    resultadosBusca.value = [];
};

// ===== FUNÇÕES DE EDIÇÃO E REMOÇÃO =====

/**
 * Deleta um item de uma refeição
 */
const deletarItem = (refeicaoIndex, itemIndex) => {
    const formularioAtualizado = JSON.parse(JSON.stringify(props.formularioPlano));
    formularioAtualizado.refeicoes[refeicaoIndex].itens.splice(itemIndex, 1);
    calcularTotalRefeicao(formularioAtualizado.refeicoes[refeicaoIndex]);
    emit('update:formularioPlano', formularioAtualizado);
};

/**
 * Inicia edição de um item
 */
const iniciarEdicao = (refeicaoIndex, itemIndex) => {
    const item = props.formularioPlano.refeicoes[refeicaoIndex].itens[itemIndex];
    formQuantidade.value = {
        alimento_id: item.alimento_id,
        nome_alimento: item.nome,
        grupo_alimento: item.grupo,
        quantidade: item.quantidade,
        unidade: item.unidade,
        calorias_por_100: item.calorias / (item.quantidade / 100)
    };
    seindoEditado.value = { refeicaoIndex, itemIndex };
    refeicaoExpandida.value = refeicaoIndex;
};

/**
 * Confirma edição de um item
 */
const confirmarEdicao = (refeicaoIndex, itemIndex) => {
    const formularioAtualizado = JSON.parse(JSON.stringify(props.formularioPlano));
    const item = formularioAtualizado.refeicoes[refeicaoIndex].itens[itemIndex];
    const nutriente = calcularNutrienteItem(
        {
            id: item.alimento_id,
            nome: item.nome,
            grupo: item.grupo,
            calorias_por_100: formQuantidade.value.calorias_por_100
        },
        formQuantidade.value.quantidade,
        formQuantidade.value.unidade
    );

    // Atualiza item
    item.quantidade = formQuantidade.value.quantidade;
    item.unidade = formQuantidade.value.unidade;
    item.calorias = nutriente.calorias;
    item.proteina = nutriente.proteina;
    item.carboidrato = nutriente.carboidrato;
    item.gordura = nutriente.gordura;
    item.fibra = nutriente.fibra;

    calcularTotalRefeicao(formularioAtualizado.refeicoes[refeicaoIndex]);
    emit('update:formularioPlano', formularioAtualizado);

    seindoEditado.value = null;
    formQuantidade.value = {
        alimento_id: null,
        nome_alimento: '',
        grupo_alimento: '',
        quantidade: 100,
        unidade: 'g',
        calorias_por_100: 0
    };
};

/**
 * Cancela edição
 */
const cancelarEdicao = () => {
    seindoEditado.value = null;
    formQuantidade.value = {
        alimento_id: null,
        nome_alimento: '',
        grupo_alimento: '',
        quantidade: 100,
        unidade: 'g',
        calorias_por_100: 0
    };
};

// ===== COMPUTED PROPERTIES =====

/**
 * Total de nutrientes do dia
 */
const totaisDia = computed(() => {
    return calcularTotaisDia(props.formularioPlano);
});

/**
 * Checar se há itens adicionados
 */
const temItens = computed(() => {
    return props.formularioPlano.refeicoes.some((r) => r.itens && r.itens.length > 0);
});

// ===== INTERSECTIONOBSERVER PARA INFINITE SCROLL =====

onMounted(() => {
    const options = {
        root: null,
        rootMargin: '100px',
        threshold: 0.1
    };

    dropdownObserver.value = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting && !loadingBusca.value && !carregandoMaisAlimentos.value) {
                carregarMaisAlimentos();
            }
        });
    }, options);
});

onBeforeUnmount(() => {
    if (dropdownObserver.value) {
        dropdownObserver.value.disconnect();
    }
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }
});

// ===== VALIDAÇÃO VIA DEFINEEXPOSE =====

/**
 * Valida se há ao menos 1 item em alguma refeição
 */
const validar = () => {
    const temAlgo = props.formularioPlano.refeicoes.some((r) => r.itens && r.itens.length > 0);
    if (!temAlgo) {
        console.warn('⚠️ Adicione alimentos em pelo menos uma refeição');
    }
    return temAlgo;
};

defineExpose({
    validar
});
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="mb-6">
            <h3 class="text-lg font-semibold text-slate-800 mb-2">Liste os alimentos de cada refeição</h3>
            <p class="text-sm text-slate-500">Use a busca abaixo para encontrar e adicionar alimentos às refeições.</p>
        </div>

        <!-- Busca de Alimentos -->
        <div class="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <label class="block text-sm font-medium text-slate-700 mb-3">Buscar alimento</label>
            <div class="flex gap-2">
                <InputText v-model="buscarAlimentoText" type="text" placeholder="Digite o nome do alimento..." class="flex-1" @input="buscarAlimentosDebounce" />
                <Button icon="pi pi-search" severity="secondary" :loading="loadingBusca" />
            </div>

            <!-- Resultados da Busca -->
            <div v-if="resultadosBusca.length > 0" class="mt-4 max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
                <div class="divide-y divide-slate-200">
                    <div v-for="(alimento, index) in resultadosBusca" :key="alimento.id || index" class="p-3 hover:bg-slate-100 cursor-pointer">
                        <div class="flex justify-between items-start">
                            <div>
                                <p class="font-medium text-slate-800">{{ alimento.nome }}</p>
                                <p class="text-xs text-slate-500">{{ alimento.grupo }}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-sm font-semibold text-emerald-600">{{ alimento.calorias_por_100 || 0 }} kcal</p>
                                <p class="text-xs text-slate-500">/100g</p>
                            </div>
                        </div>
                        <div class="flex gap-2 mt-3">
                            <Button
                                v-for="refeicaoIndex in [0, 1, 2, 3, 4, 5]"
                                :key="refeicaoIndex"
                                :label="refeicoes_nomes[refeicaoIndex].split(' ')[0]"
                                size="small"
                                severity="info"
                                text
                                @click="selecionarAlimento(alimento, refeicaoIndex)"
                                class="text-xs"
                            />
                        </div>
                    </div>
                </div>

                <!-- Carregando mais -->
                <div v-if="carregandoMaisAlimentos" class="p-4 text-center">
                    <Skeleton height="2rem" />
                </div>

                <!-- Sentinel para infinite scroll -->
                <div v-if="paginaAtualAlimentos < totalPaginasAlimentos" ref="sentinel" class="h-1"></div>
            </div>

            <!-- Loading -->
            <div v-if="loadingBusca && resultadosBusca.length === 0" class="mt-4 space-y-2">
                <Skeleton height="3rem" />
                <Skeleton height="3rem" />
            </div>
        </div>

        <!-- Form Quantidade (quando alimento selecionado) -->
        <div v-if="formQuantidade.alimento_id" class="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">Quantidade</label>
                    <InputText v-model.number="formQuantidade.quantidade" type="number" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">Unidade</label>
                    <select v-model="formQuantidade.unidade" class="w-full px-3 py-2 border border-slate-300 rounded-md">
                        <option value="g">Gramas (g)</option>
                        <option value="ml">Mililitros (ml)</option>
                        <option value="un">Unidade</option>
                        <option value="xic">Xícara</option>
                        <option value="col">Colher</option>
                        <option value="fatia">Fatia</option>
                    </select>
                </div>
            </div>
            <div class="flex gap-2 mt-4">
                <Button v-if="seindoEditado" label="Confirmar Edição" severity="success" @click="confirmarEdicao(seindoEditado.refeicaoIndex, seindoEditado.itemIndex)" class="flex-1" />
                <Button v-else label="Confirmar Adição" severity="success" @click="confirmarQuantidade(refeicaoExpandida)" class="flex-1" />
                <Button label="Cancelar" severity="secondary" @click="cancelarEdicao" class="flex-1" />
            </div>
        </div>

        <!-- Cards de Refeições -->
        <div class="space-y-4">
            <div v-for="(refeicao, refeicaoIndex) in formularioPlano.refeicoes" :key="`refeicao-${refeicaoIndex}`" class="border border-slate-200 rounded-lg overflow-hidden">
                <!-- Header Refeição -->
                <div
                    class="bg-linear-to-r from-slate-100 to-slate-50 p-4 cursor-pointer hover:from-slate-200 hover:to-slate-100 transition flex justify-between items-center"
                    @click="refeicaoExpandida = refeicaoExpandida === refeicaoIndex ? -1 : refeicaoIndex"
                >
                    <div>
                        <h4 class="font-semibold text-slate-800">{{ refeicoes_nomes[refeicaoIndex] }}</h4>
                        <p class="text-xs text-slate-500">{{ refeicao.itens?.length || 0 }} item(ns)</p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm font-bold text-emerald-600">{{ refeicao.total_calorias || 0 }} kcal</p>
                        <i :class="['pi', refeicaoExpandida === refeicaoIndex ? 'pi-chevron-up' : 'pi-chevron-down']"></i>
                    </div>
                </div>

                <!-- Body Refeição -->
                <div v-show="refeicaoExpandida === refeicaoIndex" class="divide-y divide-slate-200">
                    <div v-if="!refeicao.itens || refeicao.itens.length === 0" class="p-4 text-center text-slate-500 text-sm">Nenhum alimento adicionado</div>

                    <div v-for="(item, itemIndex) in refeicao.itens" :key="`item-${itemIndex}`" class="p-3 bg-slate-50 hover:bg-slate-100 transition">
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <p class="font-medium text-slate-800">{{ item.nome }}</p>
                                <p class="text-xs text-slate-500">{{ item.quantidade }}{{ item.unidade }} • {{ item.grupo }}</p>
                            </div>
                            <span class="text-sm font-semibold text-emerald-600">{{ item.calorias || 0 }} kcal</span>
                        </div>

                        <!-- Macros Resumidas -->
                        <div class="grid grid-cols-3 gap-2 mb-3 text-xs">
                            <div class="bg-white px-2 py-1 rounded border border-slate-200">
                                <p class="text-slate-500">Proteína</p>
                                <p class="font-semibold text-slate-800">{{ item.proteina?.toFixed(1) || 0 }}g</p>
                            </div>
                            <div class="bg-white px-2 py-1 rounded border border-slate-200">
                                <p class="text-slate-500">Carbo</p>
                                <p class="font-semibold text-slate-800">{{ item.carboidrato?.toFixed(1) || 0 }}g</p>
                            </div>
                            <div class="bg-white px-2 py-1 rounded border border-slate-200">
                                <p class="text-slate-500">Gordura</p>
                                <p class="font-semibold text-slate-800">{{ item.gordura?.toFixed(1) || 0 }}g</p>
                            </div>
                        </div>

                        <!-- Botões -->
                        <div class="flex gap-2">
                            <Button icon="pi pi-pencil" severity="warning" text size="small" @click="iniciarEdicao(refeicaoIndex, itemIndex)" class="flex-1" label="Editar" />
                            <Button icon="pi pi-trash" severity="danger" text size="small" @click="deletarItem(refeicaoIndex, itemIndex)" class="flex-1" label="Remover" />
                        </div>
                    </div>

                    <!-- Totais Refeição -->
                    <div v-if="refeicao.itens && refeicao.itens.length > 0" class="p-3 bg-emerald-50">
                        <div class="grid grid-cols-4 gap-2 text-xs">
                            <div>
                                <p class="text-slate-500">Total Kcal</p>
                                <p class="font-bold text-emerald-600">{{ refeicao.total_calorias?.toFixed(0) || 0 }}</p>
                            </div>
                            <div>
                                <p class="text-slate-500">Proteína</p>
                                <p class="font-bold text-slate-800">{{ refeicao.total_proteina?.toFixed(1) || 0 }}g</p>
                            </div>
                            <div>
                                <p class="text-slate-500">Carbo</p>
                                <p class="font-bold text-slate-800">{{ refeicao.total_carboidrato?.toFixed(1) || 0 }}g</p>
                            </div>
                            <div>
                                <p class="text-slate-500">Gordura</p>
                                <p class="font-bold text-slate-800">{{ refeicao.total_gordura?.toFixed(1) || 0 }}g</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Resumo Totais Dia -->
        <div v-if="temItens" class="bg-linear-to-r from-emerald-50 to-emerald-100 p-6 rounded-lg border-2 border-emerald-200">
            <h4 class="font-semibold text-emerald-900 mb-4">Totais do Plano</h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <p class="text-sm text-emerald-700">Calorias</p>
                    <p class="text-2xl font-bold text-emerald-600">{{ totaisDia.total_calorias?.toFixed(0) || 0 }}</p>
                    <p class="text-xs text-emerald-600">Meta: {{ formularioPlano.calorias_meta }}</p>
                </div>
                <div>
                    <p class="text-sm text-emerald-700">Proteína</p>
                    <p class="text-2xl font-bold text-slate-800">{{ totaisDia.total_proteina?.toFixed(1) || 0 }}g</p>
                    <p class="text-xs text-slate-500">{{ totaisDia.percentual_proteina?.toFixed(1) || 0 }}%</p>
                </div>
                <div>
                    <p class="text-sm text-emerald-700">Carboidrato</p>
                    <p class="text-2xl font-bold text-slate-800">{{ totaisDia.total_carboidrato?.toFixed(1) || 0 }}g</p>
                    <p class="text-xs text-slate-500">{{ totaisDia.percentual_carboidrato?.toFixed(1) || 0 }}%</p>
                </div>
                <div>
                    <p class="text-sm text-emerald-700">Gordura</p>
                    <p class="text-2xl font-bold text-slate-800">{{ totaisDia.total_gordura?.toFixed(1) || 0 }}g</p>
                    <p class="text-xs text-slate-500">{{ totaisDia.percentual_gordura?.toFixed(1) || 0 }}%</p>
                </div>
            </div>
            <!-- Progress Calorias -->
            <div class="mt-4">
                <div class="flex justify-between mb-2">
                    <p class="text-xs font-medium text-slate-700">Progresso Calórico</p>
                    <p class="text-xs font-medium text-slate-700">{{ ((totaisDia.total_calorias / formularioPlano.calorias_meta) * 100).toFixed(0) }}%</p>
                </div>
                <ProgressBar :value="((totaisDia.total_calorias / formularioPlano.calorias_meta) * 100).toFixed(0)" />
            </div>
        </div>

        <!-- Aviso sem itens -->
        <div v-if="!temItens" class="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
            <p class="text-sm text-amber-800"><strong>⚠️ Aviso:</strong> Adicione alimentos a pelo menos uma refeição para continuar.</p>
        </div>
    </div>
</template>

<style scoped>
/* Smooth transitions */
.transition {
    transition: all 0.2s ease;
}

/* Custom scrollbar */
::-webkit-scrollbar {
    width: 6px;
}

::-webkit-scrollbar-track {
    background: transparent;
}

::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}
</style>
