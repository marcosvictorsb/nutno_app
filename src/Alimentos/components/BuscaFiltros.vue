<template>
    <div class="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <!-- Busca -->
        <div class="relative flex items-center">
            <span class="material-symbols-outlined absolute left-4 text-gray-500 pointer-events-none"> search </span>
            <input
                :value="filtros.busca"
                @input="atualizarBusca($event.target.value)"
                type="text"
                placeholder="Buscar alimento... ex: arroz, frango, abacate"
                class="w-full pl-12 pr-4 py-3 bg-gray-50 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-transparent transition"
            />
        </div>

        <!-- Filtros -->
        <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex flex-wrap items-center gap-6">
                <!-- Filtro Fonte -->
                <div class="flex items-center gap-3">
                    <span class="text-xs font-bold text-gray-500 tracking-wider uppercase"> Fonte: </span>
                    <div class="flex gap-2 bg-gray-50 p-1 rounded-lg">
                        <button
                            v-for="fonte in fontes"
                            :key="fonte.value"
                            @click="atualizarFonte(fonte.value)"
                            :class="['px-3 py-1.5 text-xs font-semibold rounded-md transition-colors', filtros.fonte === fonte.value ? 'bg-[#16a34a] text-white' : 'bg-white border border-[#e2e8f0] text-gray-700 hover:bg-gray-50']"
                        >
                            {{ fonte.label }}
                        </button>
                    </div>
                </div>

                <!-- Filtro Grupo -->
                <div class="flex items-center gap-3">
                    <span class="text-xs font-bold text-gray-500 tracking-wider uppercase"> Grupo: </span>
                    <select :value="filtros.grupo" @change="atualizarGrupo($event.target.value)" class="text-xs font-semibold bg-gray-50 border border-[#e2e8f0] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#16a34a] transition">
                        <option value="">Todos os grupos</option>
                        <option v-for="grupo in grupos" :key="grupo" :value="grupo">
                            {{ grupo }}
                        </option>
                    </select>
                </div>
            </div>

            <!-- Total Ativos -->
            <span class="text-xs text-gray-600">
                {{ totalAtivos }}
            </span>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    filtros: {
        type: Object,
        required: true
    },
    totalAtivos: {
        type: String,
        required: true
    }
});

const emit = defineEmits(['update:filtros']);

const grupos = [
    'Cereais e derivados',
    'Frutas e derivados',
    'Hortaliças e derivados',
    'Leguminosas e derivados',
    'Carnes e derivados',
    'Pescados e frutos do mar',
    'Laticínios e derivados',
    'Ovos e derivados',
    'Óleos e gorduras',
    'Açúcares e doces',
    'Bebidas',
    'Suplementos',
    'Outros'
];

const fontes = [
    { label: 'Todos', value: '' },
    { label: 'TACO', value: 'taco' },
    { label: 'TBCA', value: 'tbca' },
    { label: 'Meus alimentos', value: 'personalizado' }
];

const atualizarBusca = (valor) => {
    emit('update:filtros', { busca: valor });
};

const atualizarFonte = (valor) => {
    emit('update:filtros', { fonte: valor });
};

const atualizarGrupo = (valor) => {
    emit('update:filtros', { grupo: valor });
};
</script>
