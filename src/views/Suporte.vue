<template>
    <div class="container mx-auto px-4 py-8">
        <!-- Dados do Usuário -->
        <div class="bg-white dark:bg-slate-900 rounded-lg p-8 mb-8 border border-slate-200 dark:border-slate-800">
            <!-- Header -->
            <div class="mb-8">
                <h1 class="text-4xl font-bold text-slate-900 dark:text-white mb-2">Suporte</h1>
                <p class="text-lg text-slate-600 dark:text-slate-400">Abra um chamado para nossa equipe de suporte</p>
            </div>
            <div class="bg-slate-50 dark:bg-slate-800/30 rounded-lg p-6">
                <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-6">Suas Informações</h2>
                <div class="grid md:grid-cols-3 gap-6">
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Nome</label>
                        <p class="text-slate-900 dark:text-slate-100 font-medium">{{ userInfo.name }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email</label>
                        <p class="text-slate-900 dark:text-slate-100 font-medium">{{ userInfo.email }}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Telefone</label>
                        <p class="text-slate-900 dark:text-slate-100 font-medium">{{ userInfo.phone || 'Não informado' }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Formulário de Suporte -->
        <div class="bg-white dark:bg-slate-900 rounded-lg p-8 border border-slate-200 dark:border-slate-800">
            <form @submit.prevent="submitTicket">
                <div class="mb-6">
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"> Assunto <span class="text-red-500">*</span> </label>
                    <Dropdown v-model="formData.assunto" :options="assuntoOptions" optionLabel="label" optionValue="value" placeholder="Selecione o assunto" class="w-full" :class="{ 'ng-invalid ng-touched': submitted && !formData.assunto }" />
                    <small v-if="submitted && !formData.assunto" class="text-red-500 mt-1">Assunto é obrigatório</small>
                </div>

                <div class="mb-6">
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"> Mensagem <span class="text-red-500">*</span> </label>
                    <Textarea v-model="formData.mensagem" placeholder="Descreva seu problema em detalhes" rows="6" class="w-full" :class="{ 'ng-invalid ng-touched': submitted && !formData.mensagem }" />
                    <small v-if="submitted && !formData.mensagem" class="text-red-500 mt-1">Mensagem é obrigatória</small>
                </div>

                <button type="submit" :disabled="loading" class="w-full bg-primary text-white font-bold px-6 py-3 rounded-lg hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    <span v-if="!loading">Abrir Chamado</span>
                    <span v-else>Enviando...</span>
                </button>
            </form>
        </div>

        <!-- Lista de Tickets -->
        <div v-if="tickets.length > 0" class="bg-white dark:bg-slate-900 rounded-lg p-8 mt-8 border border-slate-200 dark:border-slate-800">
            <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-6">Meus Chamados</h2>
            <div class="space-y-4">
                <div v-for="ticket in tickets" :key="ticket.id" class="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h3 class="font-semibold text-slate-900 dark:text-white">{{ formatAssunto(ticket.assunto) }}</h3>
                            <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">{{ ticket.mensagem }}</p>
                        </div>
                        <span
                            class="ml-4 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                            :class="{
                                'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200': ticket.status === 'aberto',
                                'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200': ticket.status === 'resolvido',
                                'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200': ticket.status === 'fechado'
                            }"
                        >
                            {{ formatStatus(ticket.status) }}
                        </span>
                    </div>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-3">{{ formatDate(ticket.criadoEm) }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import NutricionistaService from '@/service/NutricionistaService';
import SupportService from '@/service/SupportService';
import Dropdown from 'primevue/dropdown';
import Textarea from 'primevue/textarea';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();

const userInfo = ref({
    name: '',
    email: '',
    phone: ''
});

const formData = ref({
    assunto: '',
    mensagem: ''
});

const tickets = ref([]);
const loading = ref(false);
const submitted = ref(false);

const assuntoOptions = [
    { label: 'Cadastro', value: 'registro' },
    { label: 'Assinatura', value: 'inscricao' },
    { label: 'Relatar erro', value: 'bug' },
    { label: 'Dúvida sobre funcionalidades', value: 'duvida' },
    { label: 'Sugestão de melhoria', value: 'sugestao' },
    { label: 'Outro', value: 'outro' }
];

onMounted(async () => {
    // Carregar informações do usuário
    try {
        const response = await NutricionistaService.buscarDadosNutricionista();
        const user = response.data?.data;

        if (user) {
            userInfo.value = {
                name: user.nome || user.email || 'Usuário',
                email: user.email || '',
                phone: user.telefone || ''
            };
        }
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
    }

    // Carregar tickets existentes
    try {
        const data = await SupportService.getTickets();
        tickets.value = Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Erro ao carregar tickets:', error);
        tickets.value = [];
    }
});

const submitTicket = async () => {
    submitted.value = true;

    if (!formData.value.assunto || !formData.value.mensagem) {
        toast.add({
            severity: 'warn',
            summary: 'Validação',
            detail: 'Preencha todos os campos obrigatórios',
            life: 3000
        });
        return;
    }

    loading.value = true;

    try {
        const ticketData = {
            assunto: formData.value.assunto,
            mensagem: formData.value.mensagem,
            email_usuario: userInfo.value.email
        };

        const response = await SupportService.createTicket(ticketData);

        toast.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Chamado enviado com sucesso! Nossa equipe entrará em contato em breve.',
            life: 3000
        });

        // Limpar formulário
        formData.value = {
            assunto: '',
            mensagem: ''
        };
        submitted.value = false;

        // Adicionar novo ticket à lista
        if (response) {
            tickets.value.unshift(response);
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao enviar chamado. Tente novamente.',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const formatStatus = (status) => {
    const statusMap = {
        aberto: 'Aberto',
        resolvido: 'Resolvido',
        fechado: 'Fechado',
        open: 'Aberto',
        resolved: 'Resolvido',
        closed: 'Fechado'
    };
    return statusMap[status] || status;
};

const formatAssunto = (assunto) => {
    const assuntoMap = {
        registro: 'Cadastro',
        inscricao: 'Assinatura',
        bug: 'Relatar erro',
        duvida: 'Dúvida sobre funcionalidades',
        sugestao: 'Sugestão de melhoria',
        outro: 'Outro'
    };
    return assuntoMap[assunto] || assunto;
};

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};
</script>
