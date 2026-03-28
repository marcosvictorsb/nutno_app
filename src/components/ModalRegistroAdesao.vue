<template>
    <!-- Toast Notification -->
    <Toast position="top-right" />

    <Dialog v-model:visible="isVisible" :header="`Registrar adesão - ${refeicao?.nome || 'Refeição'}`" :modal="true" :style="{ width: '90vw', maxWidth: '1200px' }" @hide="fechar">
        <div class="space-y-6">
            <!-- Informações da refeição -->
            <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <p class="text-sm text-emerald-600 font-medium">Refeição</p>
                <p class="text-lg font-bold text-emerald-900">{{ refeicao?.nome }}</p>
                <p v-if="refeicao?.horario_sugerido" class="text-sm text-emerald-700 mt-1">⏰ {{ refeicao.horario_sugerido }}</p>
            </div>

            <!-- Data -->
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Data</label>
                <Calendar v-model="formulario.data" dateFormat="dd/mm/yy" placeholder="dd/mm/yyyy" :showIcon="true" :disabledDateRanges="diasDesabilitados" @date-select="validarData" class="w-full" disabled />
                <p v-if="erroData" class="text-xs text-red-600 mt-1">{{ erroData }}</p>
                <!-- <p class="text-xs text-gray-500 mt-1">Máximo 7 dias atrás</p> -->
            </div>

            <!-- Status -->
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-3">Como foi sua adesão?</label>
                <div class="grid grid-cols-3 gap-3">
                    <!-- Seguiu -->
                    <button
                        @click="formulario.status = 'seguiu'"
                        :class="['p-4 rounded-lg border-2 transition-all cursor-pointer', formulario.status === 'seguiu' ? 'bg-emerald-100 border-emerald-500 text-emerald-900' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-emerald-300']"
                    >
                        <i class="pi pi-check-circle text-2xl mb-2 block"></i>
                        <p class="font-semibold text-sm">Seguiu</p>
                        <p class="text-xs mt-1">Tudo conforme o plano</p>
                    </button>

                    <!-- Parcial -->
                    <button
                        @click="formulario.status = 'parcial'"
                        :class="['p-4 rounded-lg border-2 transition-all cursor-pointer', formulario.status === 'parcial' ? 'bg-yellow-100 border-yellow-500 text-yellow-900' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-yellow-300']"
                    >
                        <i class="pi pi-circle-fill text-2xl mb-2 block"></i>
                        <p class="font-semibold text-sm">Parcial</p>
                        <p class="text-xs mt-1">Seguiu em parte</p>
                    </button>

                    <!-- Pulou -->
                    <button
                        @click="formulario.status = 'pulou'"
                        :class="['p-4 rounded-lg border-2 transition-all cursor-pointer', formulario.status === 'pulou' ? 'bg-red-100 border-red-500 text-red-900' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-red-300']"
                    >
                        <i class="pi pi-times-circle text-2xl mb-2 block"></i>
                        <p class="font-semibold text-sm">Pulou</p>
                        <p class="text-xs mt-1">Não fez a refeição</p>
                    </button>
                </div>
            </div>

            <!-- Observação -->
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Observação (opcional)</label>
                <Textarea v-model="formulario.observacao" placeholder="Ex: Não tive tempo, mudei para X alimento, etc." rows="3" class="w-full" />
                <p class="text-xs text-gray-500 mt-1">{{ formulario.observacao?.length || 0 }} / 500 caracteres</p>
            </div>

            <!-- Status do formulário -->
            <div v-if="erroGeral" class="bg-red-50 border border-red-200 rounded-lg p-4">
                <p class="text-sm font-semibold text-red-900">{{ erroGeral }}</p>
            </div>
        </div>

        <template #footer>
            <Button label="Cancelar" severity="secondary" @click="fechar" />
            <Button label="Registrar adesão" severity="success" icon="pi pi-check" @click="salvar" :loading="salvando" :disabled="!formulario.status || salvando" />
        </template>
    </Dialog>
</template>

<script setup>
import AdesaoService from '@/service/AdesaoService';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { computed, ref } from 'vue';

const toast = useToast();

const props = defineProps({
    refeicao: {
        type: Object,
        default: null
    },
    token: {
        type: String,
        required: true
    },
    dataSelecionada: {
        type: String,
        default: null
    }
});

const emit = defineEmits(['adesao-registrada']);

// Estados
const isVisible = ref(false);
const salvando = ref(false);
const erroData = ref(null);
const erroGeral = ref(null);

const formulario = ref({
    status: null,
    observacao: '',
    data: new Date()
});

// Computed: Dias desabilitados (futuro e mais de 7 dias atrás)
const diasDesabilitados = computed(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const seteDialosAtras = new Date(hoje);
    seteDialosAtras.setDate(seteDialosAtras.getDate() - 7);

    return [
        {
            start: new Date(1900, 0, 1),
            end: seteDialosAtras
        },
        {
            start: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1),
            end: new Date(2099, 11, 31)
        }
    ];
});

// Funções
const abrir = () => {
    isVisible.value = true;
    resetarFormulario();
};

const fechar = () => {
    isVisible.value = false;
    erroGeral.value = null;
};

const resetarFormulario = () => {
    // Se houver data selecionada, converter para Date
    let dataInicial = new Date();
    if (props.dataSelecionada) {
        dataInicial = new Date(props.dataSelecionada + 'T00:00:00');
    }

    formulario.value = {
        status: null,
        observacao: '',
        data: dataInicial
    };
    erroData.value = null;
    erroGeral.value = null;
};

const validarData = () => {
    erroData.value = null;
    const dataAtual = new Date();
    dataAtual.setHours(0, 0, 0, 0);

    if (formulario.value.data > dataAtual) {
        erroData.value = 'Não é possível registrar adesão para datas futuras';
        formulario.value.data = null;
        return;
    }

    const seteDialosAtras = new Date(dataAtual);
    seteDialosAtras.setDate(seteDialosAtras.getDate() - 7);

    if (formulario.value.data < seteDialosAtras) {
        erroData.value = 'Registros só são aceitos com até 7 dias de atraso';
        formulario.value.data = null;
        return;
    }
};

const salvar = async () => {
    erroGeral.value = null;

    // Validações
    if (!formulario.value.status) {
        erroGeral.value = 'Selecione o status de adesão';
        toast.add({
            severity: 'warn',
            summary: 'Atenção',
            detail: 'Selecione o status de adesão',
            life: 3000
        });
        return;
    }

    if (!formulario.value.data) {
        erroGeral.value = 'Selecione uma data válida';
        toast.add({
            severity: 'warn',
            summary: 'Atenção',
            detail: 'Selecione uma data válida',
            life: 3000
        });
        return;
    }

    if (formulario.value.observacao?.length > 500) {
        erroGeral.value = 'Observação não pode ultrapassar 500 caracteres';
        toast.add({
            severity: 'warn',
            summary: 'Atenção',
            detail: 'Observação não pode ultrapassar 500 caracteres',
            life: 3000
        });
        return;
    }

    salvando.value = true;

    try {
        const dados = {
            refeicao_id: props.refeicao.id,
            status: formulario.value.status,
            observacao: formulario.value.observacao || undefined,
            data: formulario.value.data.toISOString().split('T')[0]
        };

        const response = await AdesaoService.registrar(props.token, dados);

        if (response.data.success) {
            // Emitir evento com os dados registrados
            emit('adesao-registrada', {
                refeicao_id: props.refeicao.id,
                refeicao_nome: props.refeicao.nome,
                status: formulario.value.status,
                observacao: formulario.value.observacao,
                data: formulario.value.data.toISOString().split('T')[0]
            });

            fechar();
        }
    } catch (error) {
        console.error('Erro ao registrar adesão:', error);
        const mensagemErro = error.response?.data?.message || 'Erro ao registrar adesão. Tente novamente.';
        erroGeral.value = mensagemErro;
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: mensagemErro,
            life: 4000
        });
    } finally {
        salvando.value = false;
    }
};

defineExpose({
    abrir,
    fechar
});
</script>

<style scoped>
:deep(.p-calendar) {
    width: 100%;
}
</style>
