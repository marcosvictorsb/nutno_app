<script setup>
import { Button } from 'primevue/button';
import { DatePicker } from 'primevue/datepicker';
import { Dialog } from 'primevue/dialog';
import { InputMask } from 'primevue/inputmask';
import { InputNumber } from 'primevue/inputnumber';
import { Tag } from 'primevue/tag';

import MedidaService from '@/service/MedidaService';

const props = defineProps({
    visible: {
        type: Boolean,
        required: true
    },
    formularioMedida: {
        type: Object,
        required: true
    },
    imcComClassificacao: {
        type: Object,
        default: () => ({ valor: '—', classificacao: '', cor: 'secondary' })
    },
    massaMagraCalculada: {
        type: [String, Number],
        default: '—'
    },
    rcqComClassificacao: {
        type: Object,
        default: () => ({ valor: '—', classificacao: '', cor: 'secondary' })
    },
    getCalculado: {
        type: String,
        default: '0 kcal/dia'
    },
    pressaoArterialCombinada: {
        type: String,
        default: ''
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

const emit = defineEmits(['update:visible', 'update:formularioMedida', 'update:pressaoArterialCombinada', 'fechar', 'salvar-medida']);

// Update handlers for v-model
const handleVisibilityUpdate = (value) => {
    emit('update:visible', value);
};

const handleFormularioUpdate = (path, value) => {
    // Clone o objeto da prop
    const updated = JSON.parse(JSON.stringify(props.formularioMedida));
    const keys = path.split('.');
    let obj = updated;
    for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    emit('update:formularioMedida', updated);
};

const handlePressaoUpdate = (value) => {
    emit('update:pressaoArterialCombinada', value);
};

const handleClose = () => {
    emit('fechar');
};

const handleSave = () => {
    emit('salvar-medida');
};
</script>

<template>
    <Dialog :visible="visible" header="Adicionar Medida" :modal="true" :style="{ width: '90vw', maxHeight: '90vh' }" :breakpoints="{ '1199px': '95vw', '575px': '100vw' }" @hide="handleClose" @update:visible="handleVisibilityUpdate">
        <div class="space-y-4 max-h-[calc(90vh-250px)] overflow-y-auto pr-4">
            <!-- Data da Avaliação -->
            <section class="bg-white rounded-xl border-2 border-emerald-100 p-4">
                <div class="flex items-center gap-2 mb-3">
                    <div class="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-base">📅</div>
                    <h3 class="text-base font-bold text-gray-900">Data da Avaliação</h3>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Data</label>
                    <DatePicker :model-value="formularioMedida.data_avaliacao" @update:model-value="handleFormularioUpdate('data_avaliacao', $event)" dateFormat="dd/mm/yy" placeholder="dd/mm/yyyy" :showIcon="true" class="w-full" />
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
                            <InputNumber :model-value="formularioMedida.peso" @update:model-value="handleFormularioUpdate('peso', $event)" :maxFractionDigits="2" placeholder="00.00" />
                        </div>

                        <!-- Altura (editável) -->
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Altura (cm)</label>
                            <InputNumber :model-value="formularioMedida.altura" @update:model-value="handleFormularioUpdate('altura', $event)" :maxFractionDigits="2" placeholder="00.00" />
                        </div>

                        <!-- IMC (calculado) -->
                        <div>
                            <div class="flex items-center justify-between mb-1">
                                <label class="text-xs font-semibold text-gray-600 uppercase tracking-wider">IMC <span class="text-gray-400 font-normal">(calculado)</span></label>
                            </div>
                            <div class="bg-blue-50 border border-blue-200 rounded-lg p-2 flex items-center justify-between">
                                <span class="text-sm font-semibold text-gray-800">{{ imcComClassificacao.valor }}</span>
                                <Tag v-if="imcComClassificacao.classificacao" :value="imcComClassificacao.classificacao" :severity="imcComClassificacao.cor" class="text-xs" />
                            </div>
                            <p class="text-xs text-gray-400 italic mt-1">Calculado automaticamente a partir do peso e altura.</p>
                        </div>
                    </div>

                    <!-- Segunda linha: % Gordura, % Massa Magra, Idade Metabólica -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <!-- % Gordura Corporal (editável) -->
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">% Gordura Corporal</label>
                            <InputNumber :model-value="formularioMedida.perc_gordura_corporal" @update:model-value="handleFormularioUpdate('perc_gordura_corporal', $event)" :maxFractionDigits="2" placeholder="00.00" />
                        </div>

                        <!-- % Massa Magra (calculada) -->
                        <div>
                            <div class="flex items-center justify-between mb-1">
                                <label class="text-xs font-semibold text-gray-600 uppercase tracking-wider">% Massa Magra <span class="text-gray-400 font-normal">(calculada)</span></label>
                            </div>
                            <div class="bg-green-50 border border-green-200 rounded-lg p-2">
                                <span class="text-sm font-semibold text-gray-800">{{ massaMagraCalculada }}</span>
                            </div>
                            <p class="text-xs text-gray-400 italic mt-1">100% − % Gordura Corporal</p>
                        </div>

                        <!-- Idade Metabólica (editável) -->
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Idade Metabólica (anos)</label>
                            <InputNumber :model-value="formularioMedida.idade_metabolica" @update:model-value="handleFormularioUpdate('idade_metabolica', $event)" :maxFractionDigits="0" placeholder="00" />
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
                                @click="handleFormularioUpdate('nivel_atividade', nivel)"
                                :class="['px-3 py-1 rounded-full text-xs font-medium transition-all', formularioMedida.nivel_atividade === nivel ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200']"
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
                                <InputNumber :model-value="formularioMedida.tmb" @update:model-value="handleFormularioUpdate('tmb', $event)" :maxFractionDigits="0" placeholder="0000" class="flex-1" />
                                <Button icon="pi pi-calculator" @click="calcularTMBParam" severity="secondary" class="px-3" title="Calcular usando Harris-Benedict" />
                            </div>
                            <p class="text-xs text-gray-400 italic mt-1">Taxa Metabólica Basal — energia mínima em repouso. Clique em 🧮 para calcular automaticamente usando Harris-Benedict.</p>
                        </div>

                        <!-- GET (calculado, readonly) -->
                        <div>
                            <div class="flex items-center justify-between mb-1">
                                <label class="text-xs font-semibold text-gray-600 uppercase tracking-wider">GET <span class="text-gray-400 font-normal">(calculada)</span></label>
                            </div>
                            <div class="bg-blue-50 border border-blue-200 rounded-lg p-2">
                                <span class="text-sm font-semibold text-gray-800">{{ getCalculado }} kcal/dia</span>
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
                        <InputNumber :model-value="formularioMedida.circunferencia_cintura" @update:model-value="handleFormularioUpdate('circunferencia_cintura', $event)" :maxFractionDigits="2" placeholder="00.00" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Quadril</label>
                        <InputNumber :model-value="formularioMedida.circunferencia_quadril" @update:model-value="handleFormularioUpdate('circunferencia_quadril', $event)" :maxFractionDigits="2" placeholder="00.00" />
                    </div>
                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <label class="text-xs font-semibold text-gray-600 uppercase tracking-wider">RCQ <span class="text-gray-400 font-normal">(calculada)</span></label>
                        </div>
                        <div class="bg-purple-50 border border-purple-200 rounded-lg p-2 flex items-center justify-between">
                            <span class="text-sm font-semibold text-gray-800">{{ rcqComClassificacao.valor }}</span>
                            <Tag v-if="rcqComClassificacao.classificacao" :value="rcqComClassificacao.classificacao" :severity="rcqComClassificacao.cor" class="text-xs" />
                        </div>
                        <p class="text-xs text-gray-400 italic mt-1">Cintura ÷ Quadril. Risco cardiovascular baseado no sexo do paciente.</p>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Abdominal</label>
                        <InputNumber :model-value="formularioMedida.circunferencia_abdominal" @update:model-value="handleFormularioUpdate('circunferencia_abdominal', $event)" :maxFractionDigits="2" placeholder="00.00" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Braço</label>
                        <InputNumber :model-value="formularioMedida.circunferencia_braco" @update:model-value="handleFormularioUpdate('circunferencia_braco', $event)" :maxFractionDigits="2" placeholder="00.00" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Tórax</label>
                        <InputNumber :model-value="formularioMedida.circunferencia_torax" @update:model-value="handleFormularioUpdate('circunferencia_torax', $event)" :maxFractionDigits="2" placeholder="00.00" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Coxa Direita</label>
                        <InputNumber :model-value="formularioMedida.circunferencia_coxa_direita" @update:model-value="handleFormularioUpdate('circunferencia_coxa_direita', $event)" :maxFractionDigits="2" placeholder="00.00" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Coxa Esquerda</label>
                        <InputNumber :model-value="formularioMedida.circunferencia_coxa_esquerda" @update:model-value="handleFormularioUpdate('circunferencia_coxa_esquerda', $event)" :maxFractionDigits="2" placeholder="00.00" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Panturrilha</label>
                        <InputNumber :model-value="formularioMedida.circunferencia_panturrilha" @update:model-value="handleFormularioUpdate('circunferencia_panturrilha', $event)" :maxFractionDigits="2" placeholder="00.00" />
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
                        <InputNumber :model-value="formularioMedida.dobra_subescapular" @update:model-value="handleFormularioUpdate('dobra_subescapular', $event)" :maxFractionDigits="2" placeholder="00.00" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Tríceps</label>
                        <InputNumber :model-value="formularioMedida.dobra_tricipital" @update:model-value="handleFormularioUpdate('dobra_tricipital', $event)" :maxFractionDigits="2" placeholder="00.00" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Bíceps</label>
                        <InputNumber :model-value="formularioMedida.dobra_bicipital" @update:model-value="handleFormularioUpdate('dobra_bicipital', $event)" :maxFractionDigits="2" placeholder="00.00" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Suprailíaca</label>
                        <InputNumber :model-value="formularioMedida.dobra_suprailíaca" @update:model-value="handleFormularioUpdate('dobra_suprailíaca', $event)" :maxFractionDigits="2" placeholder="00.00" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Abdominal</label>
                        <InputNumber :model-value="formularioMedida.dobra_abdominal" @update:model-value="handleFormularioUpdate('dobra_abdominal', $event)" :maxFractionDigits="2" placeholder="00.00" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Coxal</label>
                        <InputNumber :model-value="formularioMedida.dobra_coxal" @update:model-value="handleFormularioUpdate('dobra_coxal', $event)" :maxFractionDigits="2" placeholder="00.00" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Peitoral</label>
                        <InputNumber :model-value="formularioMedida.dobra_peitoral" @update:model-value="handleFormularioUpdate('dobra_peitoral', $event)" :maxFractionDigits="2" placeholder="00.00" />
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
                            <InputMask :model-value="pressaoArterialCombinada" @update:model-value="handlePressaoUpdate" mask="999/99" placeholder="120/80" class="w-full" slotChar=" " />
                            <p class="text-xs text-gray-400 italic mt-1">Formato: sistólica/diastólica. Ex: 120/80</p>
                        </div>

                        <!-- Frequência Cardíaca -->
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Frequência Cardíaca (bpm)</label>
                            <InputNumber :model-value="formularioMedida.frequencia_cardiaca" @update:model-value="handleFormularioUpdate('frequencia_cardiaca', $event)" :maxFractionDigits="0" placeholder="72" />
                        </div>
                    </div>

                    <!-- Observações (largura total) -->
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Observações</label>
                        <textarea
                            :model-value="formularioMedida.observacoes"
                            @update:model-value="handleFormularioUpdate('observacoes', $event)"
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
