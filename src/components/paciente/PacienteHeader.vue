<script setup>
import Avatar from 'primevue/avatar';
import Tag from 'primevue/tag';
import { ref } from 'vue';

defineProps({
    paciente: {
        type: Object,
        required: true
    },
    fotoPacienteUrl: {
        type: String,
        default: ''
    },
    loadingUploadFoto: {
        type: Boolean,
        default: false
    },
    activeTab: {
        type: String,
        default: 'anamnese'
    }
});

const emit = defineEmits(['update:activeTab', 'foto-change']);
const inputFotoRef = ref(null);

const selecionarFoto = () => {
    inputFotoRef.value?.click();
};

const tabs = [
    { key: 'resumo', label: 'Resumo' },
    { key: 'anamnese', label: 'Anamnese' },
    { key: 'medidas', label: 'Medidas' },
    { key: 'planos', label: 'Planos Alimentares' },
    { key: 'adesao', label: 'Adesao' }
];
</script>

<template>
    <header class="bg-white border-b border-emerald-100 p-8">
        <div class="mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div class="flex items-center gap-6">
                <div class="relative group">
                    <input ref="inputFotoRef" type="file" accept="image/*" class="hidden" @change="emit('foto-change', $event)" />

                    <img v-if="fotoPacienteUrl" :src="fotoPacienteUrl" :alt="paciente.nome" class="w-24 h-24 rounded-2xl object-cover ring-4 ring-emerald-50 shadow-lg" />
                    <div v-else class="w-24 h-24 rounded-2xl bg-emerald-100 ring-4 ring-emerald-50 shadow-lg flex items-center justify-center">
                        <Avatar
                            :label="
                                paciente.nome
                                    ? paciente.nome
                                          .split(' ')
                                          .slice(0, 2)
                                          .map((n) => n[0])
                                          .join('')
                                    : 'XX'
                            "
                            shape="circle"
                            size="xlarge"
                            class="bg-emerald-200 text-emerald-700 font-bold text-2xl"
                        />
                    </div>

                    <div class="absolute inset-0 rounded-2xl bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-all duration-300 cursor-pointer" @click="selecionarFoto">
                        <div v-if="loadingUploadFoto" class="flex flex-col items-center justify-center">
                            <i class="pi pi-spin pi-spinner text-white text-3xl"></i>
                            <p class="text-white text-xs mt-2 font-semibold">Enviando...</p>
                        </div>

                        <div v-else class="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center gap-1">
                            <i class="pi pi-camera text-white text-2xl"></i>
                            <p class="text-white text-xs font-semibold">Alterar foto</p>
                        </div>
                    </div>
                </div>

                <div>
                    <div class="flex items-center gap-3 mb-1">
                        <h1 class="text-3xl font-bold text-slate-800">{{ paciente.nome }}</h1>
                        <Tag :value="paciente.status === 'ativo' ? 'Ativo' : 'Arquivado'" :severity="paciente.status === 'ativo' ? 'success' : 'secondary'" class="uppercase tracking-wider" />
                    </div>
                    <p class="text-slate-500 flex items-center gap-4 flex-wrap">
                        <span class="flex items-center gap-1"> <i class="pi pi-calendar text-sm"></i> {{ paciente.idade > 0 ? `${paciente.idade} anos` : 'Idade nao informada' }} </span>
                        <span v-if="paciente.email" class="flex items-center gap-1"> <i class="pi pi-envelope text-sm"></i> {{ paciente.email }} </span>
                        <span v-if="paciente.telefone" class="flex items-center gap-1"> <i class="pi pi-phone text-sm"></i> {{ paciente.telefone }} </span>
                    </p>
                </div>
            </div>
        </div>

        <nav class="mx-auto mt-8 flex border-b border-slate-100 gap-2 overflow-x-auto">
            <button
                v-for="tab in tabs"
                :key="tab.key"
                @click="emit('update:activeTab', tab.key)"
                :class="[
                    'px-6 py-3 border-b-2 transition-all whitespace-nowrap',
                    tab.key === 'resumo' ? 'font-bold' : 'font-medium',
                    activeTab === tab.key ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-emerald-500'
                ]"
            >
                {{ tab.label }}
            </button>
        </nav>
    </header>
</template>
