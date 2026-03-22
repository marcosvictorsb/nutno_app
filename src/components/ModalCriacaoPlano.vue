<template>
    <Dialog
        :visible="visible"
        :modal="true"
        :style="{ width: '95vw', maxHeight: '95vh' }"
        :breakpoints="{ '1199px': '95vw', '575px': '100vw' }"
        @update:visible="emit('update:visible', $event)"
        :header="false"
        :pt="{ header: 'hidden' }"
        class="overflow-hidden"
    >
        <!-- Header com Progresso -->
        <div class="bg-white border-b border-slate-200 p-6 -m-6 mb-6">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-2xl font-bold text-slate-800">{{ editandoPlanoId ? '✏️ Editar plano' : 'Novo plano' }} — {{ paciente?.nome }}</h2>
                    <p class="text-xs text-slate-500 uppercase tracking-wider mt-1">Passo {{ step }} de 3</p>
                </div>
                <button @click="handleFechar" class="text-slate-400 hover:text-slate-600">
                    <i class="pi pi-times text-2xl"></i>
                </button>
            </div>
            <!-- Tabs de Progresso -->
            <div class="hidden md:flex items-center gap-8">
                <div class="flex items-center gap-3">
                    <span class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" :class="step >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'"> 1 </span>
                    <span :class="['font-medium', step >= 1 ? 'text-emerald-600' : 'text-slate-400']">Configure</span>
                </div>
                <div class="w-12 h-px bg-slate-200"></div>
                <div class="flex items-center gap-3">
                    <span class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" :class="step >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'"> 2 </span>
                    <span :class="['font-medium', step >= 2 ? 'text-emerald-600' : 'text-slate-400']">Refeições</span>
                </div>
                <div class="w-12 h-px bg-slate-200"></div>
                <div class="flex items-center gap-3">
                    <span class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" :class="step >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'"> 3 </span>
                    <span :class="['font-medium', step >= 3 ? 'text-emerald-600' : 'text-slate-400']">Revisão</span>
                </div>
            </div>
        </div>

        <!-- Step Content Slots -->
        <div class="overflow-y-auto pr-4 min-h-96">
            <slot v-if="step === 1" name="step-1"></slot>
            <slot v-else-if="step === 2" name="step-2"></slot>
            <slot v-else-if="step === 3" name="step-3"></slot>
        </div>

        <!-- Footer -->
        <template #footer>
            <div class="flex items-center justify-between">
                <!-- Botão Voltar (exceto Step 1) -->
                <Button v-if="step > 1" label="Voltar" severity="secondary" @click="voltarStep" icon="pi pi-chevron-left" />

                <!-- Botões Direita -->
                <div class="flex gap-3 ml-auto">
                    <!-- Cancelar (sempre) -->
                    <Button label="Cancelar" severity="secondary" @click="handleFechar" />

                    <!-- Botões por Step via Slot -->
                    <slot name="footer-buttons"></slot>
                </div>
            </div>
        </template>
    </Dialog>
</template>

<script setup>
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import { ref } from 'vue';

// Props: Wizard state and parent functions
defineProps({
    visible: Boolean,
    step: Number,
    paciente: Object,
    editandoPlanoId: [String, Number],
    loading: Boolean
});

// Emits: Wizard navigation and actions
const emit = defineEmits(['update:visible', 'update:step', 'fechar', 'avancar-step', 'voltar-step', 'salvar-plano']);

// Refs para componentes do wizard
const step2Ref = ref(null);

const handleFechar = () => {
    emit('update:visible', false);
    emit('fechar');
};

const voltarStep = () => {
    emit('voltar-step');
};

// Expor método para validar Step 2
const validarStep2 = () => {
    return step2Ref.value?.validar() || false;
};

defineExpose({
    validarStep2
});
</script>
