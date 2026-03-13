<script setup>
import PacienteService from '@/service/PacienteService';
import { DatePicker } from 'primevue';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputMask from 'primevue/inputmask';
import InputText from 'primevue/inputtext';
import RadioButton from 'primevue/radiobutton';
import Tag from 'primevue/tag';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const toast = useToast();

// Estados
const paciente = ref(null);
const loading = ref(true);
const erro = ref(null);
const activeTab = ref('resumo');
const showDialogEdicao = ref(false);
const formErrors = ref({});
const loadingAtualizacao = ref(false);

// Estados do formulário de edição
const formEdicaoPaciente = ref({
    nome: '',
    apelido: '',
    data_nascimento: null,
    email: '',
    whatsapp: '',
    sexo: ''
});

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

const carregarPaciente = async () => {
    loading.value = true;
    erro.value = null;
    try {
        const id = route.params.id;
        const response = await PacienteService.obterPaciente(id);

        if (response.data.success && response.data.data) {
            const p = response.data.data;
            paciente.value = {
                id: p.id,
                nome: p.nome || 'Sem nome',
                email: p.email || '',
                telefone: p.telefone || '',
                whatsapp: p.whatsapp || '',
                data_nascimento: p.data_nascimento,
                sexo: p.sexo,
                como_prefere_ser_chamado: p.como_prefere_ser_chamado,
                foto_perfil: p.foto_perfil,
                status: p.status,
                criado_em: p.criado_em,
                atualizado_em: p.atualizado_em,
                formulario_preenchido: p.formulario_preenchido,
                token_formulario: p.token_formulario,
                idade: calcularIdade(p.data_nascimento),
                dataCriacao: formatarDataBrasileira(p.criado_em),
                dataAtualizacao: formatarDataBrasileira(p.atualizado_em)
            };
        } else {
            erro.value = response.data.message || 'Paciente não encontrado';
        }
    } catch (error) {
        console.error('Erro ao carregar paciente:', error);
        erro.value = 'Erro ao carregar os dados do paciente';
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: erro.value,
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const voltarPacientes = () => {
    router.push('/pacientes');
};

const editarPaciente = () => {
    // Preencher o formulário com os dados do paciente

    // Converter a data string para objeto Date se existir
    let dataNascimento = null;
    if (paciente.value.data_nascimento) {
        const dateParts = paciente.value.data_nascimento.split('-');
        if (dateParts.length === 3) {
            dataNascimento = new Date(dateParts[0], parseInt(dateParts[1]) - 1, dateParts[2]);
        }
    }

    formEdicaoPaciente.value = {
        nome: paciente.value.nome || '',
        apelido: paciente.value.como_prefere_ser_chamado || '',
        data_nascimento: dataNascimento,
        email: paciente.value.email || '',
        whatsapp: paciente.value.whatsapp || '',
        sexo: paciente.value.sexo || ''
    };
    formErrors.value = {};
    showDialogEdicao.value = true;
};

const atualizarPaciente = async () => {
    // Validar campos obrigatórios
    formErrors.value = {};

    if (!formEdicaoPaciente.value.nome) {
        formErrors.value.nome = 'Nome completo é obrigatório';
    }

    if (!formEdicaoPaciente.value.email) {
        formErrors.value.email = 'Email é obrigatório';
    }

    if (!formEdicaoPaciente.value.sexo) {
        formErrors.value.sexo = 'Sexo é obrigatório';
    }

    if (Object.keys(formErrors.value).length > 0) {
        return;
    }

    loadingAtualizacao.value = true;
    try {
        // Converter data para string no formato YYYY-MM-DD
        let dataNascimentoFormatada = null;
        if (formEdicaoPaciente.value.data_nascimento) {
            const date = new Date(formEdicaoPaciente.value.data_nascimento);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            dataNascimentoFormatada = `${year}-${month}-${day}`;
        }

        // Preparar dados para enviar
        const dadosPaciente = {
            nome: formEdicaoPaciente.value.nome,
            como_prefere_ser_chamado: formEdicaoPaciente.value.apelido,
            data_nascimento: dataNascimentoFormatada,
            email: formEdicaoPaciente.value.email,
            whatsapp: formEdicaoPaciente.value.whatsapp,
            sexo: formEdicaoPaciente.value.sexo
        };

        // Chamar service para atualizar
        await PacienteService.atualizarPaciente(paciente.value.id, dadosPaciente);

        toast.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Paciente atualizado com sucesso',
            life: 3000
        });

        // Fechar dialog e recarregar dados
        showDialogEdicao.value = false;
        await carregarPaciente();
    } catch (error) {
        console.error('Erro ao atualizar paciente:', error);
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Não foi possível atualizar o paciente',
            life: 3000
        });
    } finally {
        loadingAtualizacao.value = false;
    }
};

// Watchers para remover erros quando o usuário edita os campos
watch(
    () => formEdicaoPaciente.value.nome,
    () => {
        try {
            if (formErrors.value.nome) {
                delete formErrors.value.nome;
            }
        } catch (e) {
            console.error('Erro no watcher de nome:', e);
        }
    }
);

watch(
    () => formEdicaoPaciente.value.email,
    () => {
        try {
            if (formErrors.value.email) {
                delete formErrors.value.email;
            }
        } catch (e) {
            console.error('Erro no watcher de email:', e);
        }
    }
);

watch(
    () => formEdicaoPaciente.value.sexo,
    () => {
        try {
            if (formErrors.value.sexo) {
                delete formErrors.value.sexo;
            }
        } catch (e) {
            console.error('Erro no watcher de sexo:', e);
        }
    }
);

const novoPlano = () => {
    console.log('Novo plano para:', paciente.value.nome);
};

const novaMedida = () => {
    console.log('Nova medida para:', paciente.value.nome);
};

onMounted(() => {
    carregarPaciente();
});
</script>

<template>
    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center h-96">
        <i class="pi pi-spin pi-spinner text-5xl text-emerald-600 mb-4"></i>
        <p class="text-gray-600 font-medium">Carregando paciente...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="erro" class="p-8">
        <div class="flex flex-col items-center justify-center py-20 bg-red-50 rounded-2xl border border-red-100">
            <i class="pi pi-exclamation-circle text-5xl text-red-400 mb-4"></i>
            <p class="text-red-700 font-medium text-lg">{{ erro }}</p>
            <Button label="Voltar para Pacientes" severity="danger" @click="voltarPacientes" class="mt-4" />
        </div>
    </div>

    <!-- Main Content -->
    <main v-else-if="paciente" class="flex-1 flex flex-col overflow-hidden">
        <!-- BEGIN: Profile Header -->
        <header class="bg-white border-b border-emerald-100 p-8">
            <div class="mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div class="flex items-center gap-6">
                    <!-- Avatar -->
                    <div class="relative">
                        <img v-if="paciente.foto_perfil" :src="paciente.foto_perfil" :alt="paciente.nome" class="w-24 h-24 rounded-2xl object-cover ring-4 ring-emerald-50 shadow-lg" />
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
                    </div>

                    <!-- Patient Info -->
                    <div>
                        <div class="flex items-center gap-3 mb-1">
                            <h1 class="text-3xl font-bold text-slate-800">{{ paciente.nome }}</h1>
                            <Tag :value="paciente.status === 'ativo' ? 'Ativo' : 'Arquivado'" :severity="paciente.status === 'ativo' ? 'success' : 'secondary'" class="uppercase tracking-wider" />
                        </div>
                        <p class="text-slate-500 flex items-center gap-4 flex-wrap">
                            <span class="flex items-center gap-1"> <i class="pi pi-calendar text-sm"></i> {{ paciente.idade > 0 ? `${paciente.idade} anos` : 'Idade não informada' }} </span>
                            <span v-if="paciente.email" class="flex items-center gap-1"> <i class="pi pi-envelope text-sm"></i> {{ paciente.email }} </span>
                            <span v-if="paciente.telefone" class="flex items-center gap-1"> <i class="pi pi-phone text-sm"></i> {{ paciente.telefone }} </span>
                        </p>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex gap-3">
                    <Button label="Nova medida" icon="pi pi-plus" severity="secondary" @click="novaMedida" class="whitespace-nowrap" />
                    <Button label="Novo plano" icon="pi pi-plus" severity="success" @click="novoPlano" class="whitespace-nowrap" />
                </div>
            </div>

            <!-- Tab Menu -->
            <nav class="mx-auto mt-8 flex border-b border-slate-100 gap-2 overflow-x-auto">
                <button
                    @click="activeTab = 'resumo'"
                    :class="['px-6 py-3 border-b-2 font-bold transition-all whitespace-nowrap', activeTab === 'resumo' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-emerald-500']"
                >
                    Resumo
                </button>
                <button
                    @click="activeTab = 'anamnese'"
                    :class="['px-6 py-3 border-b-2 font-medium transition-all whitespace-nowrap', activeTab === 'anamnese' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-emerald-500']"
                >
                    Anamnese
                </button>
                <button
                    @click="activeTab = 'medidas'"
                    :class="['px-6 py-3 border-b-2 font-medium transition-all whitespace-nowrap', activeTab === 'medidas' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-emerald-500']"
                >
                    Medidas
                </button>
                <button
                    @click="activeTab = 'planos'"
                    :class="['px-6 py-3 border-b-2 font-medium transition-all whitespace-nowrap', activeTab === 'planos' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-emerald-500']"
                >
                    Planos
                </button>
                <button
                    @click="activeTab = 'adesao'"
                    :class="['px-6 py-3 border-b-2 font-medium transition-all whitespace-nowrap', activeTab === 'adesao' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-emerald-500']"
                >
                    Adesão
                </button>
            </nav>
        </header>
        <!-- END: Profile Header -->

        <!-- BEGIN: Content Area -->
        <div class="flex-1 overflow-y-auto mt-3">
            <div v-if="activeTab === 'resumo'" class="mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
                <!-- Column 1: Personal Data -->
                <section class="lg:col-span-4 flex flex-col gap-6">
                    <!-- Dados Pessoais Card -->
                    <div class="bg-white shadow-sm border border-emerald-50 p-6">
                        <div class="flex items-center justify-between mb-6">
                            <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <i class="pi pi-user text-emerald-500"></i>
                                Dados Pessoais
                            </h2>
                            <Button label="Editar" text severity="success" size="small" @click="editarPaciente" />
                        </div>
                        <div class="space-y-4">
                            <div class="p-3 bg-slate-50 rounded-xl">
                                <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">E-mail</p>
                                <p class="text-slate-700 font-medium">{{ paciente.email || 'Não informado' }}</p>
                            </div>
                            <div class="p-3 bg-slate-50 rounded-xl">
                                <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Data de Nascimento</p>
                                <p class="text-slate-700 font-medium">{{ paciente.data_nascimento ? formatarDataBrasileira(paciente.data_nascimento) : 'Não informado' }}</p>
                            </div>
                            <div class="p-3 bg-slate-50 rounded-xl">
                                <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Telefone</p>
                                <p class="text-slate-700 font-medium">{{ paciente.telefone || paciente.whatsapp || 'Não informado' }}</p>
                            </div>
                            <div class="p-3 bg-slate-50 rounded-xl">
                                <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Sexo</p>
                                <p class="text-slate-700 font-medium">
                                    <span v-if="paciente.sexo === 'M'">Masculino</span>
                                    <span v-else-if="paciente.sexo === 'F'">Feminino</span>
                                    <span v-else-if="paciente.sexo === 'O'">Outro</span>
                                    <span v-else>Não informado</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Column 2: Metrics and Plan -->
                <section class="lg:col-span-8 flex flex-col gap-6">
                    <!-- Placeholder para futuras métricas -->
                    <div class="bg-white shadow-sm border border-emerald-50 p-6">
                        <h2 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <i class="pi pi-info-circle text-emerald-500"></i>
                            Informações Adicionais
                        </h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="p-4 border border-slate-100 rounded-2xl">
                                <p class="text-xs text-slate-400 font-bold uppercase mb-2">Status</p>
                                <Tag :value="paciente.status === 'ativo' ? 'Ativo' : 'Arquivado'" :severity="paciente.status === 'ativo' ? 'success' : 'secondary'" />
                            </div>
                            <div class="p-4 border border-slate-100 rounded-2xl">
                                <p class="text-xs text-slate-400 font-bold uppercase mb-2">Formulário Preenchido</p>
                                <Tag :value="paciente.formulario_preenchido ? 'Sim' : 'Não'" :severity="paciente.formulario_preenchido ? 'success' : 'warning'" />
                            </div>
                            <div class="p-4 border border-slate-100 rounded-2xl">
                                <p class="text-xs text-slate-400 font-bold uppercase mb-2">Data de Criação</p>
                                <p class="text-slate-700 font-medium">{{ paciente.dataCriacao }}</p>
                            </div>
                            <div class="p-4 border border-slate-100 rounded-2xl">
                                <p class="text-xs text-slate-400 font-bold uppercase mb-2">Última Atualização</p>
                                <p class="text-slate-700 font-medium">{{ paciente.dataAtualizacao }}</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <!-- Other Tabs - Placeholder -->
            <div v-else class="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-emerald-50 p-12 text-center">
                <i class="pi pi-home text-4xl text-slate-300 mb-4"></i>
                <p class="text-slate-500 text-lg">Conteúdo da aba "{{ activeTab }}" em breve...</p>
            </div>
        </div>
        <!-- END: Content Area -->

        <!-- Dialog Editar Paciente -->
        <Dialog v-model:visible="showDialogEdicao" header="Editar Paciente" :modal="true" :style="{ width: '60vw' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }" @hide="showDialogEdicao = false">
            <div class="space-y-6">
                <!-- Seção: Dados Pessoais -->
                <div>
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Dados pessoais</h3>

                    <!-- Nome Completo -->
                    <div class="mb-4">
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Nome completo</label>
                        <InputText v-model="formEdicaoPaciente.nome" placeholder="Ex.: João da Silva" class="w-full" autocomplete="off" :invalid="!!formErrors.nome" />
                        <small v-if="formErrors.nome" class="block text-red-500 text-xs font-semibold mt-1">{{ formErrors.nome }}</small>
                    </div>

                    <!-- Apelido e Data de Nascimento -->
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Apelido</label>
                            <InputText v-model="formEdicaoPaciente.apelido" placeholder="Como ele prefere ser chamado" class="w-full" autocomplete="off" />
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Data de nascimento</label>
                            <DatePicker v-model="formEdicaoPaciente.data_nascimento" dateFormat="dd/mm/yy" placeholder="dd/mm/yyyy" :showIcon="true" />
                        </div>
                    </div>

                    <!-- E-mail -->
                    <div class="mb-4">
                        <label class="block text-sm font-semibold text-gray-700 mb-2">E-mail</label>
                        <InputText v-model="formEdicaoPaciente.email" type="email" placeholder="email@exemplo.com" class="w-full" autocomplete="off" :invalid="!!formErrors.email" />
                        <small v-if="formErrors.email" class="block text-red-500 text-xs font-semibold mt-1">{{ formErrors.email }}</small>
                    </div>

                    <!-- WhatsApp e Sexo -->
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">WhatsApp</label>
                            <InputMask v-model="formEdicaoPaciente.whatsapp" mask="(99) 99999-9999" placeholder="(00) 00000-0000" class="w-full" />
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Sexo</label>
                            <div class="flex items-center gap-4 mb-2">
                                <div class="flex items-center">
                                    <RadioButton v-model="formEdicaoPaciente.sexo" value="M" inputId="masculino-edicao" :invalid="!!formErrors.sexo" />
                                    <label for="masculino-edicao" class="ml-2 text-sm cursor-pointer">Masculino</label>
                                </div>
                                <div class="flex items-center">
                                    <RadioButton v-model="formEdicaoPaciente.sexo" value="F" inputId="feminino-edicao" :invalid="!!formErrors.sexo" />
                                    <label for="feminino-edicao" class="ml-2 text-sm cursor-pointer">Feminino</label>
                                </div>
                                <div class="flex items-center">
                                    <RadioButton v-model="formEdicaoPaciente.sexo" value="Outro" inputId="outro-edicao" :invalid="!!formErrors.sexo" />
                                    <label for="outro-edicao" class="ml-2 text-sm cursor-pointer">Outro</label>
                                </div>
                            </div>
                            <small v-if="formErrors.sexo" class="block text-red-500 text-xs font-semibold mt-1">{{ formErrors.sexo }}</small>
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button label="Cancelar" severity="secondary" @click="showDialogEdicao = false" />
                <Button label="Atualizar paciente" severity="success" icon="pi pi-check" :loading="loadingAtualizacao" @click="atualizarPaciente" class="w-full" />
            </template>
        </Dialog>
        <!-- END: Dialog Editar Paciente -->
    </main>
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
