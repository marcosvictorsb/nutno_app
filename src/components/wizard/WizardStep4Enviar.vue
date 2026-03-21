<script setup>
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';

const props = defineProps({
    formularioPlano: { type: Object, required: true },
    paciente: { type: Object, required: true },
    linkPlano: { type: String, required: true }
});

const emit = defineEmits(['enviar-depois', 'fechar']);
const toast = useToast();

// Estado local
const mensagemPersonalizada = ref('');
const copiadoRecentemente = ref(false);

// Gerar mensagem padrão para WhatsApp
const gerarMensagemWhatsApp = () => {
    const mensagem =
        mensagemPersonalizada.value ||
        `Olá ${props.paciente.nome}!\n\nSeu plano alimentar "${props.formularioPlano.nome}" está pronto!\n\nMeta calórica: ${props.formularioPlano.calorias_meta} kcal/dia\n\nAcesse o link para visualizar: ${props.linkPlano}`;
    return mensagem;
};

// Enviar via WhatsApp
const enviarPorWhatsApp = () => {
    try {
        const mensagem = gerarMensagemWhatsApp();
        const phoneNumber = props.paciente.whatsapp ? props.paciente.whatsapp.replace(/\D/g, '') : '';

        if (!phoneNumber) {
            toast.add({
                severity: 'warn',
                summary: 'Aviso',
                detail: 'Paciente não possui WhatsApp cadastrado',
                life: 3000
            });
            return;
        }

        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(mensagem)}`;
        window.open(url, '_blank');

        toast.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Abrindo WhatsApp...',
            life: 2000
        });
    } catch (error) {
        console.error('Erro ao enviar WhatsApp:', error);
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao gerar link do WhatsApp',
            life: 3000
        });
    }
};

// Enviar via Email
const enviarPorEmail = () => {
    try {
        const mensagem = gerarMensagemWhatsApp();
        const assunto = `Plano Alimentar: ${props.formularioPlano.nome}`;
        const emailBody = `${mensagem}\n\n---\n\nEste é um plano personalizado criado especialmente para você pelo seu nutricionista.`;

        const mailto = `mailto:${props.paciente.email}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(emailBody)}`;
        window.location.href = mailto;

        toast.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Abrindo cliente de email...',
            life: 2000
        });
    } catch (error) {
        console.error('Erro ao enviar email:', error);
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao gerar link do email',
            life: 3000
        });
    }
};

// Copiar link para clipboard
const copiarLink = async () => {
    try {
        await navigator.clipboard.writeText(props.linkPlano);
        copiadoRecentemente.value = true;

        toast.add({
            severity: 'success',
            summary: 'Copiado',
            detail: 'Link do plano copiado para a área de transferência',
            life: 2000
        });

        setTimeout(() => {
            copiadoRecentemente.value = false;
        }, 2000);
    } catch (error) {
        console.error('Erro ao copiar link:', error);
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao copiar o link',
            life: 3000
        });
    }
};

// Enviar depois (fechar wizard)
const enviarDepois = () => {
    emit('enviar-depois');
};

// Fechar após envio
const fechar = () => {
    emit('fechar');
};
</script>

<template>
    <div class="space-y-6">
        <!-- Success Message -->
        <div class="bg-green-50 border border-green-200 rounded-lg p-6">
            <div class="flex items-start gap-4">
                <i class="pi pi-check-circle text-green-600 text-3xl mt-1"></i>
                <div>
                    <h3 class="text-lg font-bold text-green-900 mb-1">Plano criado com sucesso!</h3>
                    <p class="text-green-800">Compartilhe o plano alimentar com {{ paciente.nome }} através dos canais abaixo.</p>
                </div>
            </div>
        </div>

        <!-- Plan Summary -->
        <div class="bg-white border border-slate-200 rounded-lg p-6">
            <h3 class="text-lg font-bold text-slate-800 mb-4">Resumo do Plano</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="text-center p-3 bg-slate-50 rounded-lg">
                    <p class="text-xs text-slate-500 font-bold uppercase mb-1">Plano</p>
                    <p class="text-sm font-bold text-slate-800">{{ formularioPlano.nome }}</p>
                </div>
                <div class="text-center p-3 bg-slate-50 rounded-lg">
                    <p class="text-xs text-slate-500 font-bold uppercase mb-1">Objetivo</p>
                    <p class="text-sm font-bold text-slate-800">{{ formularioPlano.objetivo }}</p>
                </div>
                <div class="text-center p-3 bg-emerald-50 rounded-lg">
                    <p class="text-xs text-slate-500 font-bold uppercase mb-1">Meta Calórica</p>
                    <p class="text-lg font-bold text-emerald-600">{{ formularioPlano.calorias_meta }}</p>
                    <p class="text-xs text-slate-600">kcal/dia</p>
                </div>
                <div class="text-center p-3 bg-slate-50 rounded-lg">
                    <p class="text-xs text-slate-500 font-bold uppercase mb-1">Refeições</p>
                    <p class="text-sm font-bold text-slate-800">{{ formularioPlano.refeicoes ? formularioPlano.refeicoes.length : 0 }}</p>
                </div>
            </div>
        </div>

        <!-- Link Section -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 class="text-lg font-bold text-blue-900 mb-4">Link do Plano</h3>
            <div class="flex items-center gap-2 bg-white border border-blue-200 rounded-lg p-3 mb-3">
                <i class="pi pi-link text-blue-600"></i>
                <span class="text-sm font-mono text-slate-700 flex-1 truncate">{{ linkPlano }}</span>
                <Button :label="copiadoRecentemente ? 'Copiado!' : 'Copiar'" :icon="copiadoRecentemente ? 'pi pi-check' : 'pi pi-copy'" size="small" :severity="copiadoRecentemente ? 'success' : 'secondary'" text @click="copiarLink" />
            </div>
            <p class="text-xs text-blue-700">Este link permite que o paciente acesse o plano de qualquer dispositivo</p>
        </div>

        <!-- Message Section -->
        <div class="bg-white border border-slate-200 rounded-lg p-6">
            <h3 class="text-lg font-bold text-slate-800 mb-4">Mensagem Personalizada (Opcional)</h3>
            <p class="text-sm text-slate-600 mb-3">Adicione uma mensagem personalizada para o seu paciente:</p>
            <textarea
                v-model="mensagemPersonalizada"
                placeholder="Escreva uma mensagem personalizada ou deixe em branco para usar a mensagem padrão..."
                class="w-full px-4 py-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                rows="4"
            ></textarea>
            <p class="text-xs text-slate-500 mt-2">Se deixado em branco, será usada a mensagem padrão com informações do plano</p>
        </div>

        <!-- Sharing Options -->
        <div class="bg-white border border-slate-200 rounded-lg p-6">
            <h3 class="text-lg font-bold text-slate-800 mb-4">Enviar Plano</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button label="Enviar via WhatsApp" icon="pi pi-send" severity="success" @click="enviarPorWhatsApp" class="justify-center" :disabled="!paciente.whatsapp" />
                <Button label="Enviar via Email" icon="pi pi-envelope" severity="info" @click="enviarPorEmail" class="justify-center" :disabled="!paciente.email" />
            </div>
            <div v-if="!paciente.whatsapp" class="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                <i class="pi pi-exclamation-triangle mr-2"></i>
                WhatsApp não cadastrado para este paciente
            </div>
            <div v-if="!paciente.email" class="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                <i class="pi pi-exclamation-triangle mr-2"></i>
                Email não cadastrado para este paciente
            </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 pt-4 border-t border-slate-200">
            <Button label="Enviar Depois" severity="secondary" outlined @click="enviarDepois" class="flex-1" />
            <Button label="Concluir" severity="success" @click="fechar" class="flex-1" />
        </div>
    </div>
</template>
