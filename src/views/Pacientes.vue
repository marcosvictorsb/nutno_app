<script setup>
import PacienteService from '@/service/PacienteService';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const toast = useToast();

// Estados
const pacientes = ref([]);
const filtroStatus = ref('todos');
const searchValue = ref('');
const showDialog = ref(false);
const loading = ref(true);

// Função para extrair iniciais do nome
const getIniciaisDo = (nome) => {
    if (!nome) return 'XX';
    return nome
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase();
};

// Função para calcular idade a partir da data de nascimento
const calcularIdade = (data_nascimento) => {
    if (!data_nascimento) return 0;
    const nascimento = new Date(data_nascimento);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }
    return idade;
};

// Função para formatar data para exibição
const formatarDataBrasileira = (data) => {
    if (!data) return 'N/A';
    try {
        return new Date(data).toLocaleDateString('pt-BR');
    } catch {
        return 'N/A';
    }
};

const getStatusLabel = (status) => {
    const labels = {
        ativo: 'Ativo',
        arquivado: 'Arquivado'
    };
    return labels[status] || status;
};

const getStatusSeverity = (status) => {
    const severity = {
        ativo: 'success',
        arquivado: 'secondary'
    };
    return severity[status] || 'secondary';
};

// Função para gerar cor do avatar baseada nas iniciais
const getAvatarBgColor = (iniciais) => {
    const colors = {
        AM: 'bg-emerald-100 text-emerald-700',
        JP: 'bg-blue-100 text-blue-700',
        MC: 'bg-purple-100 text-purple-700'
    };

    // Se não temos cor específica, gera baseado no hash das iniciais
    if (colors[iniciais]) {
        return colors[iniciais];
    }

    const colorOptions = ['bg-emerald-100 text-emerald-700', 'bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-pink-100 text-pink-700', 'bg-orange-100 text-orange-700', 'bg-cyan-100 text-cyan-700'];

    const hash = iniciais.charCodeAt(0) + iniciais.charCodeAt(1);
    return colorOptions[hash % colorOptions.length];
};

const carregarPacientes = async () => {
    loading.value = true;
    try {
        const response = await PacienteService.listarPacientes();
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
            pacientes.value = response.data.data.map((paciente) => ({
                id: paciente.id,
                nome: paciente.nome || 'Sem nome',
                email: paciente.email || '',
                telefone: paciente.telefone || '',
                whatsapp: paciente.whatsapp || '',
                data_nascimento: paciente.data_nascimento,
                sexo: paciente.sexo,
                como_prefere_ser_chamado: paciente.como_prefere_ser_chamado,
                foto_perfil: paciente.foto_perfil,
                status: paciente.status,
                criado_em: paciente.criado_em,
                iniciais: getIniciaisDo(paciente.nome),
                idade: calcularIdade(paciente.data_nascimento),
                ultimaConsulta: formatarDataBrasileira(paciente.criado_em)
            }));
        }
    } catch (error) {
        console.error('Erro ao carregar pacientes:', error);
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Não foi possível carregar os pacientes',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const pacientesFiltrados = () => {
    let resultado = pacientes.value || [];

    // Filtro por status
    if (filtroStatus.value !== 'todos') {
        resultado = resultado.filter((p) => p.status === filtroStatus.value);
    }

    // Filtro por busca
    if (searchValue.value) {
        const busca = searchValue.value.toLowerCase();
        resultado = resultado.filter((p) => (p.nome && p.nome.toLowerCase().includes(busca)) || (p.email && p.email.toLowerCase().includes(busca)) || (p.telefone && p.telefone.toLowerCase().includes(busca)));
    }

    return resultado;
};

const abrirNovoPaciente = () => {
    showDialog.value = true;
};

const verPerfil = (paciente) => {
    router.push(`/pacientes/${paciente.id}`);
};

const criarPlano = (paciente) => {
    console.log('Criar plano para:', paciente.nome);
};

const novoPlano = (paciente) => {
    console.log('Novo plano para:', paciente.nome);
};

onMounted(() => {
    carregarPacientes();
});
</script>

<template>
    <div class="space-y-8">
        <!-- Header Section -->
        <div class="bg-linear-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-4xl font-bold text-emerald-900 mb-2">Pacientes</h1>
                    <p class="text-emerald-700">Gerencie e acompanhe todos os seus pacientes</p>
                </div>
                <Button icon="pi pi-plus" label="Novo paciente" severity="success" @click="abrirNovoPaciente" class="shadow-lg transform hover:scale-105 transition-transform" size="small" />
            </div>
        </div>

        <!-- Search and Filters Section -->
        <div class="space-y-4">
            <!-- Busca -->
            <div class="flex flex-col gap-2">
                <label class="text-sm font-semibold text-gray-700">Buscar pacientes</label>
                <InputGroup>
                    <InputGroupAddon class="bg-white border-r border-gray-200">
                        <i class="pi pi-search text-emerald-600"></i>
                    </InputGroupAddon>
                    <InputText v-model="searchValue" placeholder="Buscar por nome, email ou telefone..." class="w-full border-gray-200" />
                </InputGroup>
            </div>

            <!-- Filtros Pills -->
            <div class="flex flex-wrap gap-3 pt-2">
                <Button :label="`Todos (${pacientes.length})`" :severity="filtroStatus === 'todos' ? 'success' : 'secondary'" :outlined="filtroStatus !== 'todos'" @click="filtroStatus = 'todos'" size="small" class="rounded-full" />
                <Button label="Ativos" icon="pi pi-check-circle" :severity="filtroStatus === 'ativo' ? 'success' : 'secondary'" :outlined="filtroStatus !== 'ativo'" @click="filtroStatus = 'ativo'" size="small" class="rounded-full" />
                <Button label="Arquivados" icon="pi pi-lock" :severity="filtroStatus === 'arquivado' ? 'secondary' : 'secondary'" :outlined="filtroStatus !== 'arquivado'" @click="filtroStatus = 'arquivado'" size="small" class="rounded-full" />
            </div>
        </div>

        <!-- Pacientes Grid -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-20">
            <i class="pi pi-spin pi-spinner text-5xl text-emerald-600 mb-4"></i>
            <p class="text-gray-600 font-medium">Carregando pacientes...</p>
        </div>

        <div v-else-if="pacientesFiltrados().length === 0" class="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl">
            <i class="pi pi-inbox text-5xl text-gray-300 mb-4"></i>
            <p class="text-gray-500 font-medium text-lg">Nenhum paciente encontrado</p>
            <p class="text-gray-400 text-sm mt-1">Tente ajustar seus filtros ou buscar por outro termo</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="paciente in pacientesFiltrados()" :key="paciente.id" class="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-100 flex flex-col">
                <!-- Card Header with Gradient -->
                <div class="bg-gradient-to-r from-emerald-500 to-teal-500 p-6">
                    <div class="flex items-center gap-4">
                        <Avatar :label="paciente.iniciais" shape="circle" size="large" :class="`${getAvatarBgColor(paciente.iniciais)} font-bold text-lg ring-4 ring-white`" />
                        <div class="flex-1 leading-tight">
                            <h3 class="font-bold text-lg -mb-1">{{ paciente.nome }}</h3>
                            <p class="font-semibold text-sm">{{ paciente.idade }} anos</p>
                        </div>
                        <Tag :value="getStatusLabel(paciente.status)" :severity="getStatusSeverity(paciente.status)" class="ml-auto" severity="info" />
                    </div>
                </div>

                <!-- Card Body -->
                <div class="flex-1 p-6 space-y-4">
                    <!-- Informações -->
                    <div class="space-y-3 border-b border-gray-100 pb-4">
                        <div class="flex items-center gap-3 text-sm">
                            <i class="pi pi-envelope text-emerald-600 text-lg flex-shrink-0"></i>
                            <span class="text-gray-500 font-semibold uppercase text-xs tracking-wide w-20">Email:</span>
                            <span class="text-gray-800 font-medium truncate">{{ paciente.email }}</span>
                        </div>
                        <div class="flex items-center gap-3 text-sm">
                            <i class="pi pi-calendar text-emerald-600 text-lg flex-shrink-0"></i>
                            <span class="text-gray-500 font-semibold uppercase text-xs tracking-wide w-20">Última:</span>
                            <span class="text-gray-800 font-medium">{{ paciente.ultimaConsulta }}</span>
                        </div>
                    </div>

                    <!-- Telefone -->
                    <div v-if="paciente.telefone" class="flex items-center gap-3">
                        <i class="pi pi-phone text-emerald-600"></i>
                        <p class="text-gray-700 text-sm">{{ paciente.telefone }}</p>
                    </div>
                </div>

                <!-- Card Footer with Buttons -->
                <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                    <Button label="Ver perfil" icon="pi pi-eye" severity="success" text @click="verPerfil(paciente)" class="flex-1 text-xs font-medium" />
                    <Button v-if="paciente.status === 'ativo'" label="Novo plano" icon="pi pi-plus" severity="secondary" text @click="novoPlano(paciente)" class="flex-1 text-xs font-medium" />
                    <Button v-else label="Reativar" icon="pi pi-check" severity="warning" text @click="criarPlano(paciente)" class="flex-1 text-xs font-medium" />
                </div>
            </div>
        </div>
    </div>

    <!-- Dialog Novo Paciente -->
    <Dialog v-model:visible="showDialog" header="Novo Paciente" :modal="true" :style="{ width: '50vw' }" @hide="showDialog = false">
        <div class="space-y-4">
            <p class="text-gray-500">Formulário para adicionar novo paciente em desenvolvimento...</p>
        </div>
        <template #footer>
            <Button label="Cancelar" severity="secondary" text @click="showDialog = false" />
            <Button label="Salvar" severity="success" @click="showDialog = false" />
        </template>
    </Dialog>
</template>

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
