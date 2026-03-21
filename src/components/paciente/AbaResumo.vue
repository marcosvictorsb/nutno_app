<script setup>
import Button from 'primevue/button';

defineEmits(['ir-para-anamnese', 'ir-para-medidas', 'ir-para-planos']);
</script>

<template>
    <div class="mx-auto max-w-7xl px-4 space-y-6">
        <div class="bg-white rounded-2xl shadow-sm border border-emerald-50 p-8">
            <div class="text-center space-y-4">
                <h2 class="text-2xl font-bold text-slate-800">Resumo do Paciente</h2>
                <p class="text-slate-500">Esta aba foi extraida para componente proprio e pode receber os cards resumidos na TASK 12.</p>
                <div class="flex flex-wrap items-center justify-center gap-2">
                    <Button label="Ver Anamnese" severity="secondary" text @click="$emit('ir-para-anamnese')" />
                    <Button label="Ver Medidas" severity="secondary" text @click="$emit('ir-para-medidas')" />
                    <Button label="Ver Planos" severity="secondary" text @click="$emit('ir-para-planos')" />
                </div>
            </div>
        </div>
    </div>
</template>
