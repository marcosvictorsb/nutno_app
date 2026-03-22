<template>
    <Dialog :visible="visible" :modal="true" :style="{ width: '90vw', maxWidth: '600px' }" :breakpoints="{ '575px': '95vw' }" @update:visible="emit('update:visible', $event)" :header="false" class="overflow-hidden">
        <!-- Header -->
        <template #header>
            <div class="flex items-center justify-between w-full">
                <h2 class="text-2xl font-bold text-slate-800">Enviar Plano</h2>
                <button @click="handleFechar" class="text-slate-400 hover:text-slate-600">
                    <i class="pi pi-times text-2xl"></i>
                </button>
            </div>
        </template>

        <!-- Content -->
        <div class="space-y-6 py-4">
            <!-- Seção 1: Resumo do Plano -->
            <div class="bg-linear-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-100 p-6">
                <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <i class="pi pi-list text-emerald-600"></i>
                    Resumo do Plano
                </h3>
                <div class="space-y-3">
                    <div class="flex justify-between items-start">
                        <span class="text-sm font-semibold text-slate-600">Nome do Plano:</span>
                        <span class="text-sm font-bold text-slate-800">{{ plano?.nome }}</span>
                    </div>
                    <div class="flex justify-between items-start">
                        <span class="text-sm font-semibold text-slate-600">Objetivo:</span>
                        <span class="text-sm font-bold text-slate-800">{{ traduzirObjetivo(plano?.objetivo) }}</span>
                    </div>
                    <div class="bg-white rounded-xl p-3 border border-emerald-200">
                        <span class="text-xs font-semibold text-slate-600 block mb-1">Meta Calórica</span>
                        <span class="text-2xl font-bold text-emerald-600">{{ plano?.calorias_objetivo }} <span class="text-xs font-normal text-slate-500">kcal/dia</span></span>
                    </div>
                    <div class="flex justify-between items-start">
                        <span class="text-sm font-semibold text-slate-600">Refeições do Plano:</span>
                        <span v-if="plano?.refeicoes && plano.refeicoes.length > 0" class="text-sm font-bold text-slate-800">{{ plano.refeicoes.length }}</span>
                        <span v-else class="text-sm font-bold text-slate-800">-</span>
                    </div>
                </div>
            </div>

            <!-- Seção 2: Link do Plano -->
            <div class="bg-slate-50 rounded-2xl border border-slate-200 p-6">
                <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <i class="pi pi-link text-slate-600"></i>
                    Link de Acesso
                </h3>
                <div class="flex gap-2">
                    <InputText v-model="linkCompleto" :readonly="true" class="flex-1 text-sm" @click="selecionarLink" />
                    <Button :label="labelBotaoCopiar" :icon="iconBotaoCopiar" @click="copiarLink" :severity="statusBotaoCopiar" class="text-sm font-medium" />
                </div>
                <p class="text-xs text-slate-500 mt-2">Clique em "Copiar" para copiar o link para a área de transferência</p>
            </div>

            <!-- Seção 3: Mensagem Personalizada -->
            <div class="bg-slate-50 rounded-2xl border border-slate-200 p-6">
                <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <i class="pi pi-comments text-slate-600"></i>
                    Mensagem Personalizada
                </h3>
                <Textarea v-model="mensagemPersonalizada" :auto-resize="true" class="w-full text-sm" placeholder="Digite uma mensagem personalizada (opcional)" rows="3" />
                <p class="text-xs text-slate-500 mt-2">Se deixar vazio, usaremos a mensagem padrão</p>
            </div>

            <!-- Seção 4: Botões de Envio -->
            <div class="space-y-3">
                <!-- Aviso de WhatsApp não disponível -->
                <div v-if="!paciente?.whatsapp" class="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                    <i class="pi pi-exclamation-circle text-yellow-600 text-lg mt-0.5"></i>
                    <div>
                        <p class="text-sm font-semibold text-yellow-800">WhatsApp não disponível</p>
                        <p class="text-xs text-yellow-700">Este paciente não possui WhatsApp cadastrado</p>
                    </div>
                </div>

                <!-- Botão WhatsApp -->
                <Button label="Enviar via WhatsApp" icon="pi pi-phone" class="w-full text-base font-semibold text-white" :style="{ backgroundColor: '#25d366' }" @click="enviarViaWhatsApp" :disabled="!paciente?.whatsapp" />

                <!-- Aviso de Email não disponível -->
                <div v-if="!paciente?.email" class="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                    <i class="pi pi-exclamation-circle text-yellow-600 text-lg mt-0.5"></i>
                    <div>
                        <p class="text-sm font-semibold text-yellow-800">Email não disponível</p>
                        <p class="text-xs text-yellow-700">Este paciente não possui email cadastrado</p>
                    </div>
                </div>

                <!-- Botão Email -->
                <Button label="Enviar via Email" icon="pi pi-envelope" class="w-full text-base font-semibold text-white bg-blue-600 hover:bg-blue-700" @click="enviarViaEmail" :disabled="!paciente?.email" />
            </div>
        </div>

        <!-- Footer -->
        <template #footer>
            <div class="flex gap-3 justify-end">
                <Button label="Fechar" severity="secondary" @click="handleFechar" />
            </div>
        </template>
    </Dialog>
</template>

<script setup>
import { traduzirObjetivo } from '@/utils/traducoes';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import { computed, ref } from 'vue';

// Props
const props = defineProps({
    visible: Boolean,
    paciente: {
        type: Object,
        default: () => ({})
    },
    plano: {
        type: Object,
        default: () => ({})
    }
});

// Emits
const emit = defineEmits(['update:visible', 'fechar']);

// State
const mensagemPersonalizada = ref('');
const copiado = ref(false);
const timeoutCopiar = ref(null);

// Computed
const linkCompleto = computed(() => {
    if (!props.plano?.token_visualizacao) return '';
    const token = props.plano.token_visualizacao;
    const isDev = import.meta.env.DEV;
    const baseUrl = isDev ? 'http://localhost:5173' : 'https://www.nutno.com.br';
    return `${baseUrl}/plano/${token}`;
});

const labelBotaoCopiar = computed(() => (copiado.value ? 'Copiado!' : 'Copiar'));
const iconBotaoCopiar = computed(() => (copiado.value ? 'pi pi-check' : 'pi pi-copy'));
const statusBotaoCopiar = computed(() => (copiado.value ? 'success' : 'secondary'));

const mensagemParaEnviar = computed(() => {
    if (mensagemPersonalizada.value.trim()) {
        return mensagemPersonalizada.value;
    }

    // Mensagem padrão
    const nomeNutricionista = props.paciente?.nutricionista?.nome || 'Seu Nutricionista';
    return `Olá ${props.paciente?.nome}! 👋

Seu plano alimentar "${props.plano?.nome}" está pronto! 🎉

Clique no link abaixo para visualizar:
${linkCompleto.value}

Qualquer dúvida, é só chamar!
Abraços,
${nomeNutricionista}`;
});

// Methods
const handleFechar = () => {
    emit('update:visible', false);
    emit('fechar');
};

const selecionarLink = () => {
    const input = document.querySelector('input[readonly]');
    if (input) {
        input.select();
    }
};

const copiarLink = async () => {
    try {
        await navigator.clipboard.writeText(linkCompleto.value);
        copiado.value = true;

        // Resetar status após 2 segundos
        if (timeoutCopiar.value) {
            clearTimeout(timeoutCopiar.value);
        }
        timeoutCopiar.value = setTimeout(() => {
            copiado.value = false;
        }, 2000);
    } catch (error) {
        console.error('Erro ao copiar link:', error);
    }
};

const enviarViaWhatsApp = () => {
    if (!props.paciente?.whatsapp) return;

    const numeroWhatsApp = props.paciente.whatsapp.replace(/\D/g, '');
    const mensagem = encodeURIComponent(mensagemParaEnviar.value);
    const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensagem}`;

    window.open(urlWhatsApp, '_blank');
};

const enviarViaEmail = () => {
    if (!props.paciente?.email) return;

    const assunto = encodeURIComponent(`Seu Plano Alimentar: ${props.plano?.nome}`);
    const corpo = encodeURIComponent(mensagemParaEnviar.value);
    const urlEmail = `mailto:${props.paciente.email}?subject=${assunto}&body=${corpo}`;

    window.location.href = urlEmail;
};
</script>

<style scoped>
::-webkit-scrollbar {
    width: 8px;
}

::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
}

::-webkit-scrollbar-thumb {
    background: #10b981;
    border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
    background: #059669;
}
</style>
