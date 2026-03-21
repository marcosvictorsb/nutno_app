<template>
    <template>
        <Dialog :visible="aberto" header="Novo alimento personalizado" :modal="true" :style="{ width: '100%', maxWidth: '900px' }" :breakpoints="{ '1199px': '85vw', '575px': '100vw' }" @update:visible="(val) => !val && fechar()">
            <template #header>
                <div class="w-full">
                    <h3 class="text-lg font-bold text-gray-800 mb-1">Novo alimento personalizado</h3>
                    <p class="text-sm text-gray-600">Visível apenas para você. Não altera as tabelas oficiais.</p>
                </div>
            </template>

            <div class="space-y-8 -mt-4">
                <!-- Seção 1: Identificação -->
                <div class="space-y-4">
                    <h4 class="text-sm font-bold text-gray-800 uppercase tracking-wider">Identificação</h4>

                    <div>
                        <label class="block text-xs font-semibold text-gray-700 mb-2">Nome do alimento <span class="text-red-500">*</span></label>
                        <input
                            v-model="formulario.nome"
                            type="text"
                            placeholder="Ex: Whey Protein Concentrado"
                            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] transition"
                            :class="{ 'border-red-500 ring-red-200': errosLocais.nome }"
                        />
                        <p v-if="errosLocais.nome" class="text-xs text-red-600 mt-1">{{ errosLocais.nome }}</p>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-gray-700 mb-2">Grupo <span class="text-red-500">*</span></label>
                        <select
                            v-model="formulario.grupo"
                            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] transition"
                            :class="{ 'border-red-500 ring-red-200': errosLocais.grupo }"
                        >
                            <option value="">Selecione um grupo</option>
                            <option v-for="grupo in grupos" :key="grupo" :value="grupo">{{ grupo }}</option>
                        </select>
                        <p v-if="errosLocais.grupo" class="text-xs text-red-600 mt-1">{{ errosLocais.grupo }}</p>
                    </div>
                </div>

                <!-- Seção 2: Macronutrientes -->
                <div class="space-y-4">
                    <h4 class="text-sm font-bold text-gray-800 uppercase tracking-wider">Macronutrientes (por 100g)</h4>

                    <div class="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
                        <span class="material-symbols-outlined text-green-600 flex-shrink-0">info</span>
                        <p class="text-xs text-gray-700">Todos os valores devem ser informados por 100g do alimento</p>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-semibold text-gray-700 mb-2">Energia (kcal) <span class="text-red-500">*</span></label>
                            <input
                                v-model.number="formulario.energiaKcal"
                                type="number"
                                min="0"
                                step="0.01"
                                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] transition"
                                :class="{ 'border-red-500 ring-red-200': errosLocais.energiaKcal }"
                            />
                            <p v-if="errosLocais.energiaKcal" class="text-xs text-red-600 mt-1">{{ errosLocais.energiaKcal }}</p>
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-gray-700 mb-2">Energia (kJ)</label>
                            <input v-model.number="formulario.energiaKj" type="number" min="0" step="0.01" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] transition" />
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-gray-700 mb-2">Proteínas (g) <span class="text-red-500">*</span></label>
                            <input
                                v-model.number="formulario.proteina"
                                type="number"
                                min="0"
                                step="0.01"
                                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] transition"
                                :class="{ 'border-red-500 ring-red-200': errosLocais.proteina }"
                            />
                            <p v-if="errosLocais.proteina" class="text-xs text-red-600 mt-1">{{ errosLocais.proteina }}</p>
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-gray-700 mb-2">Gorduras totais (g) <span class="text-red-500">*</span></label>
                            <input
                                v-model.number="formulario.lipidios"
                                type="number"
                                min="0"
                                step="0.01"
                                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] transition"
                                :class="{ 'border-red-500 ring-red-200': errosLocais.lipidios }"
                            />
                            <p v-if="errosLocais.lipidios" class="text-xs text-red-600 mt-1">{{ errosLocais.lipidios }}</p>
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-gray-700 mb-2">Carboidratos (g) <span class="text-red-500">*</span></label>
                            <input
                                v-model.number="formulario.carboidrato"
                                type="number"
                                min="0"
                                step="0.01"
                                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] transition"
                                :class="{ 'border-red-500 ring-red-200': errosLocais.carboidrato }"
                            />
                            <p v-if="errosLocais.carboidrato" class="text-xs text-red-600 mt-1">{{ errosLocais.carboidrato }}</p>
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-gray-700 mb-2">Fibras (g)</label>
                            <input v-model.number="formulario.fibra" type="number" min="0" step="0.01" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] transition" />
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-gray-700 mb-2">Sódio (mg)</label>
                            <input v-model.number="formulario.sodio" type="number" min="0" step="0.01" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] transition" />
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-gray-700 mb-2">Umidade (%)</label>
                            <input v-model.number="formulario.umidade" type="number" min="0" step="0.01" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] transition" />
                        </div>
                    </div>
                </div>

                <!-- Seção 3: Micronutrientes -->
                <div class="space-y-4">
                    <div class="flex items-center gap-2">
                        <h4 class="text-sm font-bold text-gray-800 uppercase tracking-wider">Micronutrientes (por 100g)</h4>
                        <span class="px-2 py-0.5 bg-gray-200 text-gray-700 text-[10px] font-bold rounded-full">OPCIONAL</span>
                    </div>
                    <p class="text-xs text-gray-600">Preencha se disponível na embalagem ou tabela nutricional</p>

                    <div class="grid grid-cols-3 gap-4">
                        <div>
                            <label class="block text-xs font-semibold text-gray-700 mb-2">Cálcio (mg)</label>
                            <input v-model.number="formulario.calcio" type="number" min="0" step="0.01" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] transition" />
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-gray-700 mb-2">Ferro (mg)</label>
                            <input v-model.number="formulario.ferro" type="number" min="0" step="0.01" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] transition" />
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-gray-700 mb-2">Potássio (mg)</label>
                            <input v-model.number="formulario.potassio" type="number" min="0" step="0.01" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] transition" />
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-gray-700 mb-2">Magnésio (mg)</label>
                            <input v-model.number="formulario.magnesio" type="number" min="0" step="0.01" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] transition" />
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-gray-700 mb-2">Fósforo (mg)</label>
                            <input v-model.number="formulario.fosforo" type="number" min="0" step="0.01" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] transition" />
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-gray-700 mb-2">Zinco (mg)</label>
                            <input v-model.number="formulario.zinco" type="number" min="0" step="0.01" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] transition" />
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-gray-700 mb-2">Vitamina C (mg)</label>
                            <input v-model.number="formulario.vitaminaC" type="number" min="0" step="0.01" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] transition" />
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-gray-700 mb-2">Vitamina A (mcg)</label>
                            <input v-model.number="formulario.vitaminaA_re" type="number" min="0" step="0.01" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] transition" />
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-gray-700 mb-2">Colesterol (mg)</label>
                            <input v-model.number="formulario.colesterol" type="number" min="0" step="0.01" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] transition" />
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-gray-700 mb-2">Gord. Saturada (g)</label>
                            <input v-model.number="formulario.gorduraSaturada" type="number" min="0" step="0.01" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] transition" />
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-gray-700 mb-2">Gord. Trans (g)</label>
                            <input v-model.number="formulario.gordurasTrans" type="number" min="0" step="0.01" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] transition" />
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-3 w-full">
                    <button @click="fechar" class="px-6 py-2 border border-gray-300 rounded-lg font-semibold text-sm text-gray-700 hover:bg-gray-50 transition">Cancelar</button>
                    <button @click="salvar" :disabled="salvando" class="px-6 py-2 bg-[#16a34a] text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                        <span v-if="!salvando">Salvar alimento</span>
                        <span v-else>
                            <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Salvando...
                        </span>
                    </button>
                </div>
            </template>
        </Dialog>
    </template>
</template>

<script setup>
import Dialog from 'primevue/dialog';
import { ref, watch } from 'vue';

const props = defineProps({
    aberto: {
        type: Boolean,
        default: false
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

const errosLocais = ref({});

const resetarFormulario = () => {
    formulario.value = {
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
    };
    errosLocais.value = {};
};

const fechar = () => {
    emit('fechar');
    resetarFormulario();
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

    emit('salvar', formulario.value);
};

watch(
    () => props.aberto,
    (novoValor) => {
        if (novoValor) {
            resetarFormulario();
        }
    }
);

watch(
    () => props.erros,
    (novoErros) => {
        errosLocais.value = { ...errosLocais.value, ...novoErros };
    }
);
</script>
