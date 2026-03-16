<script setup>
import Dialog from 'primevue/dialog';
import { computed, ref, watch } from 'vue';

const props = defineProps({
    aberto: {
        type: Boolean,
        default: false
    },
    alimento: {
        type: Object,
        default: null
    },
    salvando: {
        type: Boolean,
        default: false
    },
    erros: {
        type: Object,
        default: () => ({})
    }
});

const emit = defineEmits(['fechar', 'salvar']);

const expandirGorduras = ref(false);
const editando = ref(false);
const errosLocais = ref({});

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

const formulario = ref({
    nome: '',
    nomeCientifico: '',
    grupo: '',
    energiaKcal: null,
    energiaKj: null,
    proteina: null,
    lipidios: null,
    carboidrato: null,
    fibra: null,
    sodio: null,
    umidade: null,
    calcio: null,
    ferro: null,
    potassio: null,
    magnesio: null,
    fosforo: null,
    zinco: null,
    vitaminaC: null,
    vitaminaA_re: null,
    colesterol: null,
    gorduraSaturada: null,
    gordurasTrans: null
});

const podeEditar = computed(() => {
    return props.alimento && props.alimento.fonte === 'personalizado';
});

const formatarValor = (valor, unidade = '') => {
    if (valor === null || valor === undefined) {
        return '—';
    }
    if (valor === 0.001) {
        return 'tr';
    }
    if (typeof valor === 'number') {
        const formatado = valor.toFixed(1);
        return unidade ? `${formatado} ${unidade}` : formatado;
    }
    return valor;
};

const getBadgeClassModal = (fonte) => {
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

const getFonteDescricao = (fonte) => {
    switch (fonte) {
        case 'taco':
            return 'Fonte: Tabela TACO — UNICAMP';
        case 'tbca':
            return 'Fonte: TBCA — USP/IBGE';
        case 'personalizado':
            return 'Alimento personalizado';
        default:
            return '';
    }
};

const iniciarEdicao = () => {
    if (!props.alimento) return;

    formulario.value = {
        nome: props.alimento.nome || '',
        nomeCientifico: props.alimento.nomeCientifico || '',
        grupo: props.alimento.grupo || '',
        energiaKcal: props.alimento.energiaKcal,
        energiaKj: props.alimento.energiaKj,
        proteina: props.alimento.proteina,
        lipidios: props.alimento.lipidios,
        carboidrato: props.alimento.carboidrato,
        fibra: props.alimento.fibra,
        sodio: props.alimento.sodio,
        umidade: props.alimento.umidade,
        calcio: props.alimento.calcio,
        ferro: props.alimento.ferro,
        potassio: props.alimento.potassio,
        magnesio: props.alimento.magnesio,
        fosforo: props.alimento.fosforo,
        zinco: props.alimento.zinco,
        vitaminaC: props.alimento.vitaminaC,
        vitaminaA_re: props.alimento.vitaminaA_re,
        colesterol: props.alimento.colesterol,
        gorduraSaturada: props.alimento.gorduraSaturada,
        gordurasTrans: props.alimento.gordurasTrans
    };

    errosLocais.value = {};
    editando.value = true;
};

const cancelarEdicao = () => {
    editando.value = false;
    errosLocais.value = {};
};

const validarFormulario = () => {
    const erros = {};

    if (!formulario.value.nome || formulario.value.nome.trim() === '') {
        erros.nome = 'Nome é obrigatório';
    } else if (formulario.value.nome.length < 3) {
        erros.nome = 'Mínimo 3 caracteres';
    }

    if (!formulario.value.grupo) {
        erros.grupo = 'Grupo é obrigatório';
    }

    if (formulario.value.energiaKcal === null || formulario.value.energiaKcal === '' || formulario.value.energiaKcal < 0) {
        erros.energiaKcal = 'Obrigatório';
    }

    if (formulario.value.proteina === null || formulario.value.proteina === '' || formulario.value.proteina < 0) {
        erros.proteina = 'Obrigatório';
    }

    if (formulario.value.lipidios === null || formulario.value.lipidios === '' || formulario.value.lipidios < 0) {
        erros.lipidios = 'Obrigatório';
    }

    if (formulario.value.carboidrato === null || formulario.value.carboidrato === '' || formulario.value.carboidrato < 0) {
        erros.carboidrato = 'Obrigatório';
    }

    errosLocais.value = erros;
    return Object.keys(erros).length === 0;
};

const salvar = () => {
    if (!validarFormulario()) {
        return;
    }

    emit('salvar', props.alimento.id, formulario.value);
};

watch(
    () => props.aberto,
    (novoValor) => {
        if (!novoValor) {
            editando.value = false;
            errosLocais.value = {};
        }
    }
);

watch(
    () => props.erros,
    (novoErros) => {
        errosLocais.value = { ...novoErros };
    }
);
</script>

<template>
    <Dialog :visible="aberto" :modal="true" :style="{ width: '100%', maxWidth: '800px' }" :breakpoints="{ '1199px': '85vw', '575px': '100vw' }" @update:visible="(val) => !val && $emit('fechar')">
        <template #header v-if="alimento">
            <div class="w-full">
                <div class="flex items-center gap-3 mb-2">
                    <span :class="['px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight', getBadgeClassModal(alimento.fonte)]">
                        {{ getLabelFonte(alimento.fonte) }}
                    </span>
                    <span class="text-xs font-medium text-gray-600">
                        {{ alimento.grupo }}
                    </span>
                </div>
                <h3 class="text-xl font-bold text-gray-800">
                    {{ editando ? 'Editar alimento' : alimento.nome }}
                </h3>
                <p v-if="!editando && alimento.nomeCientifico" class="text-gray-600 text-xs italic mt-1">
                    {{ alimento.nomeCientifico }}
                </p>
            </div>
        </template>

        <!-- Modo de Visualização -->
        <div v-if="alimento && !editando" class="space-y-8">
            <p class="text-gray-600 text-sm -mt-4">Valores por porção de 100g</p>

            <!-- Macronutrientes -->
            <div>
                <h4 class="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 pb-2 border-b border-gray-200">Macronutrientes</h4>
                <div class="grid grid-cols-4 gap-4 mb-6">
                    <div class="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
                        <div class="flex items-center justify-center mb-2">
                            <span class="material-symbols-outlined text-green-600">local_fire_department</span>
                        </div>
                        <span class="text-[10px] font-bold text-gray-600 uppercase tracking-widest block mb-2"> Energia </span>
                        <span class="text-2xl font-bold text-gray-800 block">
                            {{ formatarValor(alimento.energiaKcal) }}
                        </span>
                        <span class="text-[10px] font-medium text-gray-600 uppercase block mt-2"> Kcal </span>
                        <span v-if="alimento.energiaKj" class="text-[9px] text-gray-500 block mt-1"> {{ formatarValor(alimento.energiaKj) }} kJ </span>
                    </div>

                    <div class="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
                        <div class="flex items-center justify-center mb-2">
                            <span class="material-symbols-outlined text-blue-600">fitness_center</span>
                        </div>
                        <span class="text-[10px] font-bold text-gray-600 uppercase tracking-widest block mb-2"> Proteínas </span>
                        <span class="text-2xl font-bold text-blue-600 block">
                            {{ formatarValor(alimento.proteina) }}
                        </span>
                        <span class="text-[10px] font-medium text-gray-600 uppercase block mt-2"> g </span>
                    </div>

                    <div class="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-center">
                        <div class="flex items-center justify-center mb-2">
                            <span class="material-symbols-outlined text-yellow-600">grain</span>
                        </div>
                        <span class="text-[10px] font-bold text-gray-600 uppercase tracking-widest block mb-2"> Carboidratos </span>
                        <span class="text-2xl font-bold text-yellow-600 block">
                            {{ formatarValor(alimento.carboidrato) }}
                        </span>
                        <span class="text-[10px] font-medium text-gray-600 uppercase block mt-2"> g </span>
                    </div>

                    <div class="bg-red-50 border border-red-200 p-4 rounded-lg text-center">
                        <div class="flex items-center justify-center mb-2">
                            <span class="material-symbols-outlined text-red-600">water_drop</span>
                        </div>
                        <span class="text-[10px] font-bold text-gray-600 uppercase tracking-widest block mb-2"> Gorduras </span>
                        <span class="text-2xl font-bold text-red-600 block">
                            {{ formatarValor(alimento.lipidios) }}
                        </span>
                        <span class="text-[10px] font-medium text-gray-600 uppercase block mt-2"> g </span>
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-6">
                    <div>
                        <span class="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1"> Fibras </span>
                        <span class="text-sm font-semibold text-gray-800">
                            {{ formatarValor(alimento.fibra, 'g') }}
                        </span>
                    </div>
                    <div>
                        <span class="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1"> Umidade </span>
                        <span class="text-sm font-semibold text-gray-800">
                            {{ formatarValor(alimento.umidade, '%') }}
                        </span>
                    </div>
                    <div>
                        <span class="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1"> Cinzas </span>
                        <span class="text-sm font-semibold text-gray-800">
                            {{ formatarValor(alimento.cinzas, 'g') }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Micronutrientes -->
            <div>
                <h4 class="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 pb-2 border-b border-gray-200">Micronutrientes</h4>
                <div class="grid grid-cols-3 gap-6">
                    <div
                        v-for="(valor, label) in {
                            'SÓDIO (mg)': alimento.sodio,
                            'CÁLCIO (mg)': alimento.calcio,
                            'FERRO (mg)': alimento.ferro,
                            'POTÁSSIO (mg)': alimento.potassio,
                            'MAGNÉSIO (mg)': alimento.magnesio,
                            'FÓSFORO (mg)': alimento.fosforo,
                            'ZINCO (mg)': alimento.zinco,
                            'COBRE (mg)': alimento.cobre,
                            'MANGANÊS (mg)': alimento.manganes,
                            'VIT. C (mg)': alimento.vitaminaC,
                            'TIAMINA (mg)': alimento.tiamina,
                            'RIBOFLAVINA (mg)': alimento.riboflavina,
                            'VIT. A (mcg)': alimento.vitaminaA_re,
                            'VIT. B12 (mcg)': alimento.vitaminaB12,
                            'FOLATO (mcg)': alimento.folato,
                            'COLESTEROL (mg)': alimento.colesterol,
                            'VIT. D (mcg)': alimento.vitaminaD,
                            'VIT. E (mg)': alimento.vitaminaE
                        }"
                        :key="label"
                        class="flex justify-between items-end border-b border-gray-100 pb-2"
                    >
                        <span class="text-xs text-gray-600">{{ label }}</span>
                        <span class="text-sm font-semibold text-gray-800">
                            {{ formatarValor(valor) }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Gorduras Detalhadas -->
            <div>
                <button @click="expandirGorduras = !expandirGorduras" class="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition">
                    <span class="material-symbols-outlined text-lg" :class="{ 'rotate-90': expandirGorduras }"> chevron_right </span>
                    Ver gorduras detalhadas
                </button>

                <Transition name="expand">
                    <div v-if="expandirGorduras" class="grid grid-cols-2 gap-6 mt-4">
                        <div>
                            <span class="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1"> Gordura Saturada </span>
                            <span class="text-sm font-semibold text-gray-800">
                                {{ formatarValor(alimento.gorduraSaturada, 'g') }}
                            </span>
                        </div>
                        <div>
                            <span class="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1"> Monoinssaturada </span>
                            <span class="text-sm font-semibold text-gray-800">
                                {{ formatarValor(alimento.gorduraMonoinsaturada, 'g') }}
                            </span>
                        </div>
                        <div>
                            <span class="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1"> Poliinsaturada </span>
                            <span class="text-sm font-semibold text-gray-800">
                                {{ formatarValor(alimento.gorduraPoliinsaturada, 'g') }}
                            </span>
                        </div>
                        <div>
                            <span class="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1"> Trans </span>
                            <span class="text-sm font-semibold text-gray-800">
                                {{ formatarValor(alimento.gordurasTrans, 'g') }}
                            </span>
                        </div>
                    </div>
                </Transition>
            </div>
        </div>

        <!-- Modo de Edição -->
        <div v-if="alimento && editando" class="space-y-6 -mt-4">
            <!-- Nome -->
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Nome do alimento *</label>
                <input
                    v-model="formulario.nome"
                    type="text"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    :class="{ 'border-red-500': errosLocais.nome }"
                    placeholder="Nome do alimento"
                />
                <span v-if="errosLocais.nome" class="text-red-500 text-sm mt-1 block">{{ errosLocais.nome }}</span>
            </div>

            <!-- Nome Científico -->
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Nome científico</label>
                <input v-model="formulario.nomeCientifico" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Nome científico (opcional)" />
            </div>

            <!-- Grupo -->
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Grupo *</label>
                <select v-model="formulario.grupo" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" :class="{ 'border-red-500': errosLocais.grupo }">
                    <option value="">Selecione um grupo</option>
                    <option v-for="grupo in grupos" :key="grupo" :value="grupo">
                        {{ grupo }}
                    </option>
                </select>
                <span v-if="errosLocais.grupo" class="text-red-500 text-sm mt-1 block">{{ errosLocais.grupo }}</span>
            </div>

            <!-- Macronutrientes -->
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Energia (kcal) *</label>
                    <input
                        v-model.number="formulario.energiaKcal"
                        type="number"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        :class="{ 'border-red-500': errosLocais.energiaKcal }"
                        placeholder="Ex: 100"
                    />
                    <span v-if="errosLocais.energiaKcal" class="text-red-500 text-sm mt-1 block">{{ errosLocais.energiaKcal }}</span>
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Energia (kJ)</label>
                    <input v-model.number="formulario.energiaKj" type="number" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Ex: 418" />
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Proteína (g) *</label>
                    <input
                        v-model.number="formulario.proteina"
                        type="number"
                        step="0.1"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        :class="{ 'border-red-500': errosLocais.proteina }"
                        placeholder="Ex: 5"
                    />
                    <span v-if="errosLocais.proteina" class="text-red-500 text-sm mt-1 block">{{ errosLocais.proteina }}</span>
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Gorduras (g) *</label>
                    <input
                        v-model.number="formulario.lipidios"
                        type="number"
                        step="0.1"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        :class="{ 'border-red-500': errosLocais.lipidios }"
                        placeholder="Ex: 2"
                    />
                    <span v-if="errosLocais.lipidios" class="text-red-500 text-sm mt-1 block">{{ errosLocais.lipidios }}</span>
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Carboidratos (g) *</label>
                    <input
                        v-model.number="formulario.carboidrato"
                        type="number"
                        step="0.1"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        :class="{ 'border-red-500': errosLocais.carboidrato }"
                        placeholder="Ex: 20"
                    />
                    <span v-if="errosLocais.carboidrato" class="text-red-500 text-sm mt-1 block">{{ errosLocais.carboidrato }}</span>
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Fibras (g)</label>
                    <input v-model.number="formulario.fibra" type="number" step="0.1" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Ex: 3" />
                </div>
            </div>

            <!-- Micronutrientes -->
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Sódio (mg)</label>
                    <input v-model.number="formulario.sodio" type="number" step="0.1" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Cálcio (mg)</label>
                    <input v-model.number="formulario.calcio" type="number" step="0.1" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Ferro (mg)</label>
                    <input v-model.number="formulario.ferro" type="number" step="0.1" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Potássio (mg)</label>
                    <input v-model.number="formulario.potassio" type="number" step="0.1" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Magnésio (mg)</label>
                    <input v-model.number="formulario.magnesio" type="number" step="0.1" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Fósforo (mg)</label>
                    <input v-model.number="formulario.fosforo" type="number" step="0.1" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Zinco (mg)</label>
                    <input v-model.number="formulario.zinco" type="number" step="0.1" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Vitamina C (mg)</label>
                    <input v-model.number="formulario.vitaminaC" type="number" step="0.1" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Vitamina A (mcg)</label>
                    <input v-model.number="formulario.vitaminaA_re" type="number" step="0.1" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Colesterol (mg)</label>
                    <input v-model.number="formulario.colesterol" type="number" step="0.1" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Gordura Saturada (g)</label>
                    <input v-model.number="formulario.gorduraSaturada" type="number" step="0.1" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Gordura Trans (g)</label>
                    <input v-model.number="formulario.gordurasTrans" type="number" step="0.1" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
            </div>
        </div>

        <template #footer v-if="alimento">
            <div class="flex justify-between items-center w-full">
                <span class="text-xs text-gray-600">
                    {{ getFonteDescricao(alimento.fonte) }}
                </span>
                <div class="flex gap-2">
                    <button v-if="!editando && podeEditar" @click="iniciarEdicao" class="px-6 py-2 bg-blue-500 text-white rounded-lg font-semibold text-sm hover:bg-blue-600 transition flex items-center gap-2">
                        <span class="material-symbols-outlined">edit</span>
                        Editar
                    </button>
                    <button v-if="editando" @click="cancelarEdicao" class="px-6 py-2 bg-gray-400 text-white rounded-lg font-semibold text-sm hover:bg-gray-500 transition">Cancelar</button>
                    <button v-if="editando" @click="salvar" :disabled="salvando" class="px-6 py-2 bg-[#16a34a] text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2">
                        <span class="material-symbols-outlined">save</span>
                        {{ salvando ? 'Salvando...' : 'Salvar' }}
                    </button>
                    <button v-if="!editando" @click="$emit('fechar')" class="px-6 py-2 bg-[#16a34a] text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition">Fechar</button>
                </div>
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
    transition: all 0.3s ease;
}

.expand-enter-from,
.expand-leave-to {
    opacity: 0;
    max-height: 0;
    overflow: hidden;
}
</style>
