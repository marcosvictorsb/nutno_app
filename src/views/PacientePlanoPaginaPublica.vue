<template>
    <!-- Toast Notification -->
    <Toast position="top-right" />

    <!-- Loading State -->
    <div v-if="loading" class="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-emerald-50 to-teal-50">
        <i class="pi pi-spin pi-spinner text-5xl text-emerald-600 mb-4"></i>
        <p class="text-gray-600 font-medium">Carregando plano alimentar...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="erro" class="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-emerald-50 to-teal-50 p-6">
        <div class="bg-white rounded-2xl shadow-lg border border-red-100 p-8 max-w-md text-center">
            <i class="pi pi-exclamation-circle text-5xl text-red-400 mb-4"></i>
            <h2 class="text-2xl font-bold text-gray-900 mb-2">Erro</h2>
            <p class="text-red-700 font-medium mb-6">{{ erro }}</p>
            <Button label="Voltar" severity="secondary" @click="voltar" />
        </div>
    </div>

    <!-- Main Content -->
    <main v-else-if="plano && refeicoes" class="min-h-screen bg-linear-to-br from-emerald-50 to-teal-50 p-6">
        <!-- Header -->
        <div class="max-w-4xl mx-auto mb-8">
            <div class="bg-white rounded-2xl shadow-lg border border-emerald-100 p-8">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <span class="text-2xl">🥗</span>
                        </div>
                        <div>
                            <h1 class="text-3xl font-bold text-emerald-900 -mb-1">{{ plano.nome }}</h1>
                            <p class="text-emerald-700">Seu plano alimentar personalizado</p>
                        </div>
                    </div>
                </div>

                <!-- Informações do Plano -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
                    <div>
                        <p class="text-sm text-gray-500 mb-1">Paciente</p>
                        <p class="text-lg font-semibold text-gray-900">{{ pacienteNome }}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 mb-1">Data Atual</p>
                        <p class="text-lg font-semibold text-emerald-700">{{ dataAtual ? new Date(dataAtual + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '-' }}</p>
                    </div>
                    <!-- <div>
                        <p class="text-sm text-gray-500 mb-1">Status do Plano</p>
                        <Tag :value="plano.status === 'ativo' ? 'Ativo' : 'Inativo'" :severity="plano.status === 'ativo' ? 'success' : 'secondary'" />
                    </div> -->
                </div>
            </div>
        </div>

        <!-- Refeições -->
        <div class="max-w-4xl mx-auto">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Registre sua adesão ao plano</h2>

            <div class="space-y-4">
                <div v-for="refeicao in refeicoes" :key="refeicao.id" class="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <h3 class="text-xl font-bold text-gray-900 mb-1">{{ refeicao.nome }}</h3>
                            <p class="text-sm text-gray-500 flex items-center gap-2">
                                <i class="pi pi-clock text-sm"></i>
                                {{ refeicao.horario_sugerido || 'Horário não definido' }}
                            </p>

                            <!-- Última adesão registrada -->
                            <div v-if="ultimasAdesoes[refeicao.id]" class="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <p class="text-xs text-blue-600 font-medium">
                                    Último registro: {{ formatarData(ultimasAdesoes[refeicao.id].data) }}
                                    -
                                    <span
                                        :class="{
                                            'text-emerald-600': ultimasAdesoes[refeicao.id].status === 'seguiu',
                                            'text-yellow-600': ultimasAdesoes[refeicao.id].status === 'parcial',
                                            'text-red-600': ultimasAdesoes[refeicao.id].status === 'pulou'
                                        }"
                                    >
                                        {{ getStatusLabel(ultimasAdesoes[refeicao.id].status) }}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <Button label="Registrar" icon="pi pi-plus" severity="success" @click="abrirFormulario(refeicao)" class="ml-4" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal de registro -->
        <ModalRegistroAdesao ref="modalRegistro" :refeicao="refeicaoSelecionada" :token="token" @adesao-registrada="handleAdesaoRegistrada" />
    </main>
</template>

<script setup>
import ModalRegistroAdesao from '@/components/ModalRegistroAdesao.vue';
import AdesaoService from '@/service/AdesaoService';
import PlanoPublicoService from '@/service/PlanoPublicoService';
import Button from 'primevue/button';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const token = ref(route.params.token);
const toast = useToast();

// Estados
const loading = ref(true);
const erro = ref(null);
const plano = ref(null);
const refeicoes = ref([]);
const ultimasAdesoes = ref({});
const pacienteNome = ref('Paciente');
const dataAtual = ref(null);
const refeicaoSelecionada = ref(null);
const modalRegistro = ref(null);

// Funções helper
const formatarData = (dataStr) => {
    const data = new Date(dataStr + 'T00:00:00');
    return data.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
    });
};

const getStatusLabel = (status) => {
    const labels = {
        seguiu: 'Seguiu',
        parcial: 'Parcial',
        pulou: 'Pulou'
    };
    return labels[status] || status;
};

const voltar = () => {
    router.push('/');
};

const abrirFormulario = (refeicao) => {
    refeicaoSelecionada.value = refeicao;
    modalRegistro.value?.abrir();
};

const handleAdesaoRegistrada = async (dados) => {
    // Atualizar última adesão da refeição
    ultimasAdesoes.value[dados.refeicao_id] = dados;

    // Mostrar notificação com Toast
    toast.add({
        severity: 'success',
        summary: 'Sucesso!',
        detail: `Adesão registrada com sucesso para ${refeicaoSelecionada.value.nome}`,
        life: 3000
    });

    // Fechar modal
    modalRegistro.value?.fechar();
};

// Carregar dados
const carregarDados = async () => {
    loading.value = true;
    erro.value = null;

    try {
        // Buscar plano pelo token
        const resPlano = await PlanoPublicoService.obterPorToken(token.value);
        plano.value = resPlano.data.data;
        pacienteNome.value = plano.value.paciente_nome || 'Paciente';
        dataAtual.value = plano.value.data_atual;
        refeicoes.value = plano.value.refeicoes || [];

        // Buscar últimas adesões
        try {
            const resAdesoes = await AdesaoService.listar(plano.value.id_paciente, {
                plano_id: plano.value.id,
                data_inicio: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
                data_fim: new Date().toISOString().split('T')[0]
            });

            if (resAdesoes.data.data) {
                resAdesoes.data.data.forEach((adesao) => {
                    ultimasAdesoes.value[adesao.refeicao_id] = adesao;
                });
            }
        } catch (e) {
            // Adesões não carregadas, mas não é erro fatal
            console.log('Adesões não encontradas');
        }
    } catch (error) {
        console.error('Erro ao carregar plano:', error);
        erro.value = error.response?.data?.message || 'Erro ao carregar plano. Link pode estar expirado ou inválido.';
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    carregarDados();
});
</script>

<style scoped>
:deep(.p-tag) {
    font-size: 0.85rem;
}
</style>
