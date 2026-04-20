<template>
    <Dialog :visible="visible" header="Adicionar Medida" :modal="true" :style="{ width: '90vw', maxHeight: '90vh' }" :breakpoints="{ '1199px': '95vw', '575px': '100vw' }" @hide="handleClose" @update:visible="handleVisibilityUpdate">
        <div class="space-y-4 max-h-[calc(90vh-250px)] overflow-y-auto pr-4">
            <!-- Data da Avaliação e Data de Nascimento (se necessário) -->
            <section class="bg-white rounded-xl border-2 border-emerald-100 p-4">
                <div class="flex items-center gap-2 mb-3">
                    <div class="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-base">📅</div>
                    <h3 class="text-base font-bold text-gray-900">Data da Avaliação</h3>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Data</label>
                        <DatePicker v-model="formularioLocal.data_avaliacao" dateFormat="dd/mm/yy" placeholder="dd/mm/yyyy" :showIcon="true" class="w-full" />
                    </div>
                    <!-- Data de Nascimento (aparece apenas se paciente não tiver) -->
                    <div v-if="!paciente?.data_nascimento" class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <label class="block text-xs font-semibold text-yellow-800 uppercase tracking-wider mb-2">Data de Nascimento <span class="text-red-500">*</span></label>
                        <DatePicker v-model="formularioLocal.data_nascimento_temporaria" dateFormat="dd/mm/yy" placeholder="dd/mm/yyyy" :showIcon="true" class="w-full" />
                        <p class="text-xs text-yellow-700 italic mt-2">Obrigatória para calcular TMB quando não registrada no cadastro do paciente</p>
                    </div>
                </div>
            </section>

            <!-- Seção 1: Dados Antropométricos (expandida) -->
            <section class="bg-white rounded-xl border-2 border-blue-100 p-4">
                <div class="flex items-center gap-2 mb-3">
                    <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-base">⚖️</div>
                    <h3 class="text-base font-bold text-gray-900">Dados Antropométricos</h3>
                </div>
                <div class="space-y-4">
                    <!-- Primeira linha: Peso, Altura, IMC -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <!-- Peso (editável) -->
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Peso (kg)</label>
                            <InputNumber v-model="formularioLocal.peso" :maxFractionDigits="2" placeholder="00.00" />
                        </div>

                        <!-- Altura (editável) -->
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Altura (cm)</label>
                            <InputNumber v-model="formularioLocal.altura" :min="30" :max="400" :maxFractionDigits="0" placeholder="173"  />
                        </div>

                        <!-- IMC (calculado) -->
                        <div>
                            <div class="flex items-center justify-between mb-1">
                                <label class="text-xs font-semibold text-gray-600 uppercase tracking-wider">IMC <span class="text-gray-400 font-normal">(calculado)</span></label>
                            </div>
                            <div class="bg-blue-50 border border-blue-200 rounded-lg p-2 flex items-center justify-between">
                                <span class="text-sm font-semibold text-gray-800">{{ imcExibicao.valor }}</span>
                                <Tag v-if="imcExibicao.classificacao" :value="imcExibicao.classificacao" :severity="imcExibicao.cor" class="text-xs" />
                            </div>
                            <p class="text-xs text-gray-400 italic mt-1">Calculado automaticamente a partir do peso e altura.</p>
                        </div>
                    </div>

                    <!-- Segunda linha: % Gordura, % Massa Magra, Idade Metabólica -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <!-- % Gordura Corporal (editável) -->
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">% Gordura Corporal</label>
                            <InputNumber v-model="formularioLocal.perc_gordura_corporal" :maxFractionDigits="2" placeholder="00.00" />
                        </div>

                        <!-- % Massa Magra (calculada) -->
                        <div>
                            <div class="flex items-center justify-between mb-1">
                                <label class="text-xs font-semibold text-gray-600 uppercase tracking-wider">% Massa Magra <span class="text-gray-400 font-normal">(calculada)</span></label>
                            </div>
                            <div class="bg-green-50 border border-green-200 rounded-lg p-2">
                                <span class="text-sm font-semibold text-gray-800">{{ massaMagraExibicao }}</span>
                            </div>
                            <p class="text-xs text-gray-400 italic mt-1">100% − % Gordura Corporal</p>
                        </div>

                        <!-- Idade Metabólica (editável) -->
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Idade Metabólica (anos)</label>
                            <InputNumber v-model="formularioLocal.idade_metabolica" :maxFractionDigits="0" placeholder="00" />
                        </div>
                    </div>

                    <!-- Separador visual: Gasto Energético -->
                    <div class="flex items-center gap-3 my-4">
                        <div class="flex-1 h-px bg-blue-100"></div>
                        <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Gasto Energético</span>
                        <div class="flex-1 h-px bg-blue-100"></div>
                    </div>

                    <!-- Nível de Atividade (largura total) -->
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Nível de Atividade</label>
                        <div class="flex gap-1 flex-wrap">
                            <button
                                v-for="nivel in ['sedentario', 'leve', 'moderado', 'intenso']"
                                :key="nivel"
                                @click="formularioLocal.nivel_atividade = nivel"
                                :class="['px-3 py-1 rounded-full text-xs font-medium transition-all', formularioLocal.nivel_atividade === nivel ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200']"
                            >
                                {{ MedidaService.formatarValor('nivel_atividade', nivel) }}
                            </button>
                        </div>
                        <p class="text-xs text-gray-400 italic mt-2">Sedentário: sem exercício ou trabalho sentado · Leve: 1 a 3x por semana · Moderado: 3 a 5x por semana · Intenso: 6 a 7x por semana</p>
                    </div>

                    <!-- TMB e GET -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <!-- TMB com botão Calcular -->
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">TMB (kcal/dia)</label>
                            <div class="flex gap-2">
                                <InputNumber v-model="formularioLocal.tmb" :maxFractionDigits="0" placeholder="0000" class="flex-1" />
                                <Button icon="pi pi-calculator" @click="calcularTMBLocal" severity="secondary" class="px-3" title="Calcular usando Harris-Benedict" />
                            </div>
                            <p class="text-xs text-gray-400 italic mt-1">Taxa Metabólica Basal — energia mínima em repouso. Clique em 🧮 para calcular automaticamente usando Harris-Benedict.</p>
                        </div>

                        <!-- GET (calculado, readonly) -->
                        <div>
                            <div class="flex items-center justify-between mb-1">
                                <label class="text-xs font-semibold text-gray-600 uppercase tracking-wider">GET <span class="text-gray-400 font-normal">(calculada)</span></label>
                            </div>
                            <div class="bg-blue-50 border border-blue-200 rounded-lg p-2">
                                <span class="text-sm font-semibold text-gray-800">{{ getExibicao }}<span v-if="getExibicao !== '—'"> kcal/dia</span></span>
                            </div>
                            <p class="text-xs text-gray-400 italic mt-1">Gasto Energético Total — energia diária estimada com base na TMB e nível de atividade selecionado.</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Seção 2: Circunferências -->
            <section class="bg-white rounded-xl border-2 border-purple-100 p-4">
                <div class="flex items-center gap-2 mb-3">
                    <div class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-base">📏</div>
                    <h3 class="text-base font-bold text-gray-900">Circunferências (cm)</h3>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Cintura</label>
                        <InputNumber v-model="formularioLocal.circunferencia_cintura" :maxFractionDigits="2" placeholder="00.00" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Quadril</label>
                        <InputNumber v-model="formularioLocal.circunferencia_quadril" :maxFractionDigits="2" placeholder="00.00" />
                    </div>
                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <label class="text-xs font-semibold text-gray-600 uppercase tracking-wider">RCQ <span class="text-gray-400 font-normal">(calculada)</span></label>
                        </div>
                        <div class="bg-purple-50 border border-purple-200 rounded-lg p-2 flex items-center justify-between">
                            <span class="text-sm font-semibold text-gray-800">{{ rcqExibicao.valor }}</span>
                            <Tag v-if="rcqExibicao.classificacao" :value="rcqExibicao.classificacao" :severity="rcqExibicao.cor" class="text-xs" />
                        </div>
                        <p class="text-xs text-gray-400 italic mt-1">Cintura ÷ Quadril. Risco cardiovascular baseado no sexo do paciente.</p>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Abdominal</label>
                        <InputNumber v-model="formularioLocal.circunferencia_abdominal" :maxFractionDigits="2" placeholder="00.00" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Braço</label>
                        <InputNumber v-model="formularioLocal.circunferencia_braco" :maxFractionDigits="2" placeholder="00.00" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Tórax</label>
                        <InputNumber v-model="formularioLocal.circunferencia_torax" :maxFractionDigits="2" placeholder="00.00" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Coxa Direita</label>
                        <InputNumber v-model="formularioLocal.circunferencia_coxa_direita" :maxFractionDigits="2" placeholder="00.00" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Coxa Esquerda</label>
                        <InputNumber v-model="formularioLocal.circunferencia_coxa_esquerda" :maxFractionDigits="2" placeholder="00.00" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Panturrilha</label>
                        <InputNumber v-model="formularioLocal.circunferencia_panturrilha" :maxFractionDigits="2" placeholder="00.00" />
                    </div>
                </div>
            </section>

            <!-- Seção 3: Dobras Cutâneas -->
            <section class="bg-white rounded-xl border-2 border-orange-100 p-4">
                <div class="flex items-center gap-2 mb-3">
                    <div class="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-base">📐</div>
                    <h3 class="text-base font-bold text-gray-900">Dobras Cutâneas (mm)</h3>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Subscapular</label>
                        <InputNumber v-model="formularioLocal.dobra_subescapular" :maxFractionDigits="2" placeholder="00.00" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Tríceps</label>
                        <InputNumber v-model="formularioLocal.dobra_tricipital" :maxFractionDigits="2" placeholder="00.00" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Bíceps</label>
                        <InputNumber v-model="formularioLocal.dobra_bicipital" :maxFractionDigits="2" placeholder="00.00" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Suprailíaca</label>
                        <InputNumber v-model="formularioLocal.dobra_suprailíaca" :maxFractionDigits="2" placeholder="00.00" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Abdominal</label>
                        <InputNumber v-model="formularioLocal.dobra_abdominal" :maxFractionDigits="2" placeholder="00.00" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Coxal</label>
                        <InputNumber v-model="formularioLocal.dobra_coxal" :maxFractionDigits="2" placeholder="00.00" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Peitoral</label>
                        <InputNumber v-model="formularioLocal.dobra_peitoral" :maxFractionDigits="2" placeholder="00.00" />
                    </div>
                </div>
            </section>

            <!-- Seção 4: Dados Cardiovasculares e Observações -->
            <section class="bg-white rounded-xl border-2 border-red-100 p-4">
                <div class="flex items-center gap-2 mb-3">
                    <div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-base">❤️</div>
                    <h3 class="text-base font-bold text-gray-900">Dados Cardiovasculares e Observações</h3>
                </div>
                <div class="space-y-4">
                    <!-- Pressão Arterial e Frequência Cardíaca -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <!-- Pressão Arterial (merged: 120/80) -->
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Pressão Arterial (mmHg)</label>
                            <InputMask v-model="pressaoLocal" mask="999/99" placeholder="120/80" class="w-full" slotChar=" " />
                            <p class="text-xs text-gray-400 italic mt-1">Formato: sistólica/diastólica. Ex: 120/80</p>
                        </div>

                        <!-- Frequência Cardíaca -->
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Frequência Cardíaca (bpm)</label>
                            <InputNumber v-model="formularioLocal.frequencia_cardiaca" :maxFractionDigits="0" placeholder="72" />
                        </div>
                    </div>

                    <!-- Observações (largura total) -->
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Observações</label>
                        <textarea
                            v-model="formularioLocal.observacoes"
                            placeholder="Adicione observações importantes"
                            rows="2"
                            class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                        ></textarea>
                    </div>
                </div>
            </section>
        </div>

        <template #footer>
            <Button label="Cancelar" severity="secondary" @click="handleClose" />
            <Button label="Adicionar Medida" severity="success" icon="pi pi-check" :loading="loading" @click="handleSave" />
        </template>
    </Dialog>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';

import Button from 'primevue/button';
import DatePicker from 'primevue/datepicker';
import Dialog from 'primevue/dialog';
import InputMask from 'primevue/inputmask';
import InputNumber from 'primevue/inputnumber';
import Tag from 'primevue/tag';
import { useToast } from 'primevue/usetoast';

import MedidaService from '@/service/MedidaService';
import { calcularIdade } from '@/utils/dateHelper';
import { calcularGET, calcularIMCComClassificacao, calcularRCQComClassificacao, calcularTMB } from '@/utils/nutricionais';

const props = defineProps({
    visible: {
        type: Boolean,
        required: true
    },
    formularioMedida: {
        type: Object,
        required: true
    },
    paciente: {
        type: Object,
        default: null
    },
    loading: {
        type: Boolean,
        default: false
    },
    calcularTMBParam: {
        type: Function,
        required: true
    }
});

const emit = defineEmits(['update:visible', 'fechar', 'salvar-medida']);
const toast = useToast();

const formularioLocal = ref({});
const pressaoLocal = ref('');

// Normalizar número para lidar com vírgulas
const normalizarNumero = (valor) => {
    if (valor === null || valor === undefined || valor === '') {
        return null;
    }

    const numero = parseFloat(String(valor).replace(',', '.'));
    return Number.isFinite(numero) ? numero : null;
};

const recalcularCamposDerivados = (formulario) => {
    const peso = normalizarNumero(formulario.peso);
    const altura = normalizarNumero(formulario.altura);

    if (peso && altura && altura > 0) {
        const alturaMetros = altura / 100;
        const imc = peso / (alturaMetros * alturaMetros);
        formulario.imc = parseFloat(imc.toFixed(2));
    } else {
        formulario.imc = null;
    }

    const percentualGordura = normalizarNumero(formulario.perc_gordura_corporal);
    formulario.perc_massa_magra = percentualGordura !== null ? parseFloat((100 - percentualGordura).toFixed(2)) : null;

    const tmb = normalizarNumero(formulario.tmb);
    formulario.gasto_energetico_total = tmb ? calcularGET(tmb, formulario.nivel_atividade) : null;
};

const imcExibicao = computed(() => calcularIMCComClassificacao(formularioLocal.value.peso, formularioLocal.value.altura));

const massaMagraExibicao = computed(() => {
    const gordura = normalizarNumero(formularioLocal.value.perc_gordura_corporal);
    if (gordura === null) {
        return '—';
    }

    return (100 - gordura).toFixed(1);
});

const rcqExibicao = computed(() => calcularRCQComClassificacao(formularioLocal.value.circunferencia_cintura, formularioLocal.value.circunferencia_quadril, props.paciente?.sexo));

const getExibicao = computed(() => {
    return calcularGET(formularioLocal.value.tmb, formularioLocal.value.nivel_atividade);
});

// Função para calcular TMB considerando data de nascimento temporária
const calcularTMBLocal = () => {
    const peso = formularioLocal.value.peso;
    const altura = formularioLocal.value.altura;

    // Validar peso e altura
    if (!peso || !altura) {
        toast.add({
            severity: 'warn',
            summary: 'Dados incompletos',
            detail: 'Preencha peso e altura para calcular TMB',
            life: 3000
        });
        return;
    }

    // Usar data de nascimento do paciente ou a temporária
    let dataNascimento = props.paciente?.data_nascimento;
    if (!dataNascimento && formularioLocal.value.data_nascimento_temporaria) {
        dataNascimento = formularioLocal.value.data_nascimento_temporaria;
    }

    if (!dataNascimento) {
        toast.add({
            severity: 'warn',
            summary: 'Data de nascimento ausente',
            detail: 'Preencha a data de nascimento para calcular TMB',
            life: 3000
        });
        return;
    }

    const idade = calcularIdade(dataNascimento);
    const tmb = calcularTMB(peso, altura, idade, props.paciente?.sexo);

    if (tmb) {
        formularioLocal.value.tmb = tmb;
        toast.add({
            severity: 'success',
            summary: 'TMB calculado',
            detail: `TMB: ${tmb} kcal/dia${!props.paciente?.sexo ? ' (referência masculina)' : ''}`,
            life: 3000
        });
    }
};

// Update handlers for v-model
const handleVisibilityUpdate = (value) => {
    emit('update:visible', value);
};

watch(
    () => props.visible,
    (visible) => {
        if (visible) {
            formularioLocal.value = JSON.parse(JSON.stringify(props.formularioMedida || {}));
            // Usar nextTick para sincronizar data com segurança
            nextTick(() => {
                // Inicializar data_avaliacao com hoje se vier como null
                if (!formularioLocal.value.data_avaliacao) {
                    formularioLocal.value.data_avaliacao = new Date();
                }
                const sistolica = formularioLocal.value.pressao_arterial_sistolica;
                const diastolica = formularioLocal.value.pressao_arterial_diastolica;
                pressaoLocal.value = sistolica && diastolica ? `${sistolica}/${diastolica}` : '';
            });
        }
    }
);

const handleClose = () => {
    emit('fechar');
};

const handleSave = () => {
    const altura = formularioLocal.value.altura;
    if (altura != null && altura !== '') {
        if (altura > 0 && altura <= 3) {
            toast.add({ severity: 'warn', summary: 'Altura inválida', detail: 'Parece que você digitou a altura em metros. Informe em centímetros (ex: 173).', life: 5000 });
            return;
        }
        if (altura < 30 || altura > 400) {
            toast.add({ severity: 'warn', summary: 'Altura inválida', detail: 'A altura deve estar entre 30 e 400 cm.', life: 5000 });
            return;
        }
    }

    const payload = JSON.parse(JSON.stringify(formularioLocal.value || {}));
    recalcularCamposDerivados(payload);

    const [sistolicaRaw, diastolicaRaw] = String(pressaoLocal.value || '').split('/');
    const sistolica = parseInt(sistolicaRaw, 10);
    const diastolica = parseInt(diastolicaRaw, 10);

    payload.pressao_arterial_sistolica = Number.isFinite(sistolica) ? sistolica : null;
    payload.pressao_arterial_diastolica = Number.isFinite(diastolica) ? diastolica : null;

    emit('salvar-medida', payload);
};
</script>
