<script setup>
import { computed } from 'vue';

const props = defineProps({
    alimentos: {
        type: Array,
        required: true
    },
    carregando: {
        type: Boolean,
        default: false
    },
    pagina: {
        type: Number,
        default: 1
    },
    totalPaginas: {
        type: Number,
        default: 1
    },
    total: {
        type: Number,
        default: 0
    },
    limite: {
        type: Number,
        default: 20
    }
});

const emit = defineEmits(['abrirDetalhes', 'deletar', 'mudarPagina', 'abrirNovo', 'mudarLimite']);

// Calcular páginas para exibir
const paginasDisponiveis = computed(() => {
    const paginas = [];
    const totalPaginas = props.totalPaginas;
    const paginaAtual = props.pagina;
    const maxPaginas = 7;

    if (totalPaginas <= maxPaginas) {
        for (let i = 1; i <= totalPaginas; i++) {
            paginas.push(i);
        }
    } else {
        let inicio = Math.max(1, paginaAtual - 3);
        let fim = Math.min(totalPaginas, paginaAtual + 3);

        if (inicio > 1) {
            paginas.push(1);
            if (inicio > 2) {
                paginas.push('...');
            }
        }

        for (let i = inicio; i <= fim; i++) {
            paginas.push(i);
        }

        if (fim < totalPaginas) {
            if (fim < totalPaginas - 1) {
                paginas.push('...');
            }
            paginas.push(totalPaginas);
        }
    }

    return paginas;
});

// Calcular intervalo de itens exibidos
const intervaloItens = computed(() => {
    const inicio = (props.pagina - 1) * props.limite + 1;
    const fim = Math.min(props.pagina * props.limite, props.total);
    return { inicio, fim };
});

const formatarValor = (valor) => {
    if (valor === null || valor === undefined) {
        return '—';
    }
    if (valor === 0.001) {
        return 'tr';
    }
    if (typeof valor === 'number') {
        return valor.toFixed(1);
    }
    return valor;
};

const getBadgeClass = (fonte) => {
    switch (fonte) {
        case 'taco':
            return 'bg-[#dcfce7] text-[#16a34a]';
        case 'tbca':
            return 'bg-[#dbeafe] text-[#1d4ed8]';
        case 'personalizado':
            return 'bg-[#fef9c3] text-[#854d0e]';
        default:
            return 'bg-gray-100 text-gray-700';
    }
};

const getLabelFonte = (fonte) => {
    switch (fonte) {
        case 'taco':
            return 'TACO';
        case 'tbca':
            return 'TBCA';
        case 'personalizado':
            return 'Meu';
        default:
            return fonte;
    }
};

const podeEditarDeletar = (alimento) => {
    return alimento.fonte === 'personalizado';
};
</script>

<template>
    <div class="bg-white rounded-lg shadow-sm overflow-hidden">
        <!-- Badge informativo -->
        <div class="px-6 py-3 bg-[#f0fdf4] border-b border-[#dcfce7]">
            <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#16a34a] text-lg">info</span>
                <span class="text-xs font-semibold text-[#16a34a]">Valores nutricionais referentes a 100g</span>
            </div>
        </div>

        <!-- Tabela -->
        <div v-if="!carregando && alimentos.length === 0" class="flex flex-col items-center justify-center py-12">
            <span class="material-symbols-outlined text-5xl text-gray-300 mb-4"> search </span>
            <h3 class="text-lg font-bold text-gray-800 mb-1">Nenhum alimento encontrado</h3>
            <p class="text-sm text-gray-600 mb-6">Tente buscar por outro nome ou cadastre um alimento personalizado.</p>
            <button @click="$emit('abrirNovo')" class="px-4 py-2 border border-[#16a34a] text-[#16a34a] rounded-lg font-semibold text-sm hover:bg-green-50 transition">+ Cadastrar alimento</button>
        </div>

        <table v-else class="w-full border-collapse">
            <thead>
                <tr class="bg-gray-100 border-b border-gray-200">
                    <th class="px-6 py-4 text-left text-[11px] font-bold text-gray-600 tracking-wider uppercase">Nome</th>
                    <th class="px-4 py-4 text-left text-[11px] font-bold text-gray-600 tracking-wider uppercase">Grupo</th>
                    <th class="px-4 py-4 text-center text-[11px] font-bold text-gray-600 tracking-wider uppercase">Fonte</th>
                    <th class="px-4 py-4 text-right text-[11px] font-bold text-gray-600 tracking-wider uppercase">Kcal</th>
                    <th class="px-4 py-4 text-right text-[11px] font-bold text-gray-600 tracking-wider uppercase">Prot.</th>
                    <th class="px-4 py-4 text-right text-[11px] font-bold text-gray-600 tracking-wider uppercase">Carb.</th>
                    <th class="px-4 py-4 text-right text-[11px] font-bold text-gray-600 tracking-wider uppercase">Gord.</th>
                    <th class="px-4 py-4 text-right text-[11px] font-bold text-gray-600 tracking-wider uppercase">Fibra</th>
                    <th class="px-4 py-4 text-right text-[11px] font-bold text-gray-600 tracking-wider uppercase">Sódio</th>
                    <th class="px-6 py-4 text-center text-[11px] font-bold text-gray-600 tracking-wider uppercase">Ações</th>
                </tr>
            </thead>
            <tbody>
                <!-- Loading Skeleton -->
                <template v-if="carregando">
                    <tr v-for="i in 5" :key="`skeleton-${i}`" class="border-b border-gray-100">
                        <td colspan="10" class="px-6 py-4">
                            <div class="h-6 bg-green-50 rounded animate-pulse"></div>
                        </td>
                    </tr>
                </template>

                <!-- Dados -->
                <template v-else>
                    <tr v-for="(alimento, index) in alimentos" :key="alimento.id" :class="['border-b border-gray-100 transition-colors', index % 2 === 0 ? 'bg-white' : 'bg-gray-50', 'hover:bg-green-50']">
                        <td class="px-6 py-4">
                            <div class="font-bold text-sm text-gray-800">{{ alimento.nome }}</div>
                            <div v-if="alimento.nomeCientifico" class="text-xs text-gray-600 italic" :title="alimento.nomeCientifico">
                                {{ alimento.nomeCientifico.length > 40 ? alimento.nomeCientifico.substring(0, 40) + '...' : alimento.nomeCientifico }}
                            </div>
                        </td>
                        <td class="px-4 py-4 text-sm text-gray-700">
                            {{ alimento.grupo }}
                        </td>
                        <td class="px-4 py-4 text-center">
                            <span :class="['px-2 py-1 rounded-full text-[10px] font-bold tracking-tight', getBadgeClass(alimento.fonte)]">
                                {{ getLabelFonte(alimento.fonte) }}
                            </span>
                        </td>
                        <td class="px-4 py-4 text-sm text-gray-700 text-right font-semibold">
                            {{ formatarValor(alimento.energiaKcal) }}
                        </td>
                        <td class="px-4 py-4 text-sm text-gray-700 text-right">
                            {{ formatarValor(alimento.proteina) }}
                        </td>
                        <td class="px-4 py-4 text-sm text-gray-700 text-right">
                            {{ formatarValor(alimento.carboidrato) }}
                        </td>
                        <td class="px-4 py-4 text-sm text-gray-700 text-right">
                            {{ formatarValor(alimento.lipidios) }}
                        </td>
                        <td class="px-4 py-4 text-sm text-[#16a34a] text-right font-semibold">
                            {{ formatarValor(alimento.fibra) }}
                        </td>
                        <td class="px-4 py-4 text-sm text-gray-700 text-right">
                            {{ formatarValor(alimento.sodio) }}
                        </td>
                        <td class="px-6 py-4 text-center">
                            <div class="flex items-center justify-center gap-2">
                                <!-- Ver detalhes -->
                                <button @click="$emit('abrirDetalhes', alimento)" class="p-1.5 text-[#16a34a] hover:bg-white rounded-lg transition" title="Ver detalhes">
                                    <span class="material-symbols-outlined text-lg"> visibility </span>
                                </button>

                                <!-- Editar -->
                                <!-- <button
                                    @click="podeEditarDeletar(alimento) && $emit('abrirDetalhes', alimento)"
                                    :disabled="!podeEditarDeletar(alimento)"
                                    :class="['p-1.5 rounded-lg transition', podeEditarDeletar(alimento) ? 'text-gray-700 hover:bg-white' : 'text-gray-400 cursor-not-allowed']"
                                    :title="podeEditarDeletar(alimento) ? 'Editar' : 'Alimentos oficiais não podem ser editados'"
                                >
                                    <span class="material-symbols-outlined text-lg"> edit </span>
                                </button> -->

                                <!-- Deletar -->
                                <button
                                    @click="podeEditarDeletar(alimento) && $emit('deletar', alimento.id)"
                                    :disabled="!podeEditarDeletar(alimento)"
                                    :class="['p-1.5 rounded-lg transition', podeEditarDeletar(alimento) ? 'text-red-500 hover:bg-white' : 'text-gray-400 cursor-not-allowed']"
                                    :title="podeEditarDeletar(alimento) ? 'Deletar' : 'Alimentos oficiais não podem ser deletados'"
                                >
                                    <span class="material-symbols-outlined text-lg"> delete </span>
                                </button>
                            </div>
                        </td>
                    </tr>
                </template>
            </tbody>
        </table>

        <!-- Paginação -->
        <div v-if="!carregando && alimentos.length > 0" class="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <!-- Informações e controles superiores -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <!-- Informações de itens -->
                <div class="flex items-center gap-4">
                    <span class="text-sm text-gray-700">
                        <span class="font-semibold text-gray-900">{{ intervaloItens.inicio }}-{{ intervaloItens.fim }}</span>
                        de
                        <span class="font-semibold text-gray-900">{{ total }}</span>
                        alimentos
                    </span>

                    <!-- Seletor de itens por página -->
                    <div class="flex items-center gap-2">
                        <label for="itemsPorPagina" class="text-xs text-gray-600 font-medium">Mostrar:</label>
                        <select
                            id="itemsPorPagina"
                            :value="limite"
                            @change="(e) => $emit('mudarLimite', parseInt(e.target.value))"
                            class="px-2 py-1 text-xs border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:ring-offset-0 transition"
                        >
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </div>
                </div>

                <!-- Informação de página -->
                <div class="text-xs text-gray-600 font-medium text-center sm:text-right">
                    Página <span class="font-semibold text-gray-900">{{ pagina }}</span> de
                    <span class="font-semibold text-gray-900">{{ totalPaginas }}</span>
                </div>
            </div>

            <!-- Controles de navegação -->
            <div class="flex items-center justify-center sm:justify-between gap-2 flex-wrap">
                <!-- Botões anterior/próximo (esquerda) -->
                <div class="flex gap-1 order-2 sm:order-1">
                    <button
                        @click="$emit('mudarPagina', 1)"
                        :disabled="pagina === 1"
                        class="p-2 border border-gray-300 rounded-lg hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed hover:disabled:bg-gray-50"
                        title="Primeira página"
                    >
                        <span class="material-symbols-outlined text-base">first_page</span>
                    </button>

                    <button
                        @click="$emit('mudarPagina', pagina - 1)"
                        :disabled="pagina === 1"
                        class="p-2 border border-gray-300 rounded-lg hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed hover:disabled:bg-gray-50"
                        title="Página anterior"
                    >
                        <span class="material-symbols-outlined text-base">chevron_left</span>
                    </button>
                </div>

                <!-- Números de página (meio) -->
                <div class="flex gap-1 order-1 sm:order-2 flex-wrap justify-center">
                    <button
                        v-for="(p, index) in paginasDisponiveis"
                        :key="index"
                        @click="p !== '...' && $emit('mudarPagina', p)"
                        :disabled="p === '...'"
                        :class="[
                            'w-8 h-8 rounded-lg text-xs font-semibold transition',
                            p === pagina ? 'bg-[#16a34a] text-white shadow-sm' : p === '...' ? 'text-gray-500 cursor-default' : 'border border-gray-300 hover:bg-white hover:border-[#16a34a]'
                        ]"
                    >
                        {{ p }}
                    </button>
                </div>

                <!-- Botões próximo/última (direita) -->
                <div class="flex gap-1 order-3 sm:order-3">
                    <button
                        @click="$emit('mudarPagina', pagina + 1)"
                        :disabled="pagina === totalPaginas"
                        class="p-2 border border-gray-300 rounded-lg hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed hover:disabled:bg-gray-50"
                        title="Próxima página"
                    >
                        <span class="material-symbols-outlined text-base">chevron_right</span>
                    </button>

                    <button
                        @click="$emit('mudarPagina', totalPaginas)"
                        :disabled="pagina === totalPaginas"
                        class="p-2 border border-gray-300 rounded-lg hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed hover:disabled:bg-gray-50"
                        title="Última página"
                    >
                        <span class="material-symbols-outlined text-base">last_page</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
