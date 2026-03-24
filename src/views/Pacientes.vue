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
                    <InputText v-model="searchValue" type="text" placeholder="Buscar por nome, email ou telefone..." class="w-full border-gray-200" />
                </InputGroup>
            </div>

            <!-- Filtros Pills -->
            <div class="flex flex-wrap gap-3 pt-2">
                <Button :label="`Todos (${paginacao.total})`" :severity="filtroStatus === 'todos' ? 'success' : 'secondary'" :outlined="filtroStatus !== 'todos'" @click="filtroStatus = 'todos'" size="small" class="rounded-full" />
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

        <div v-else class="space-y-6">
            <!-- Grid com VirtualScroller -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div v-for="paciente in pacientesPaginados" :key="paciente.id" class="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-100 flex flex-col">
                    <!-- Card Header with Gradient -->
                    <div class="bg-linear-to-r from-emerald-500 to-teal-500 p-6">
                        <div class="flex items-center gap-4">
                            <Avatar v-if="paciente.foto_perfil" :image="obterUrlFotoPaciente(paciente.foto_perfil)" shape="circle" size="large" class="ring-4 ring-white" />
                            <Avatar v-else :label="paciente.iniciais" shape="circle" size="large" :class="`${getAvatarBgColor(paciente.iniciais)} font-bold text-lg ring-4 ring-white`" />
                            <div class="flex-1 leading-tight">
                                <h3 class="font-bold text-lg -mb-1">{{ paciente.nome }}</h3>
                                <p class="font-semibold text-sm">{{ paciente.data_nascimento ? `${paciente.idade} anos` : 'Idade não informada' }}</p>
                            </div>
                            <Tag :value="getStatusLabel(paciente.status)" :severity="getStatusSeverity(paciente.status)" class="ml-auto" />
                        </div>
                    </div>

                    <!-- Card Body -->
                    <div class="flex-1 p-6 space-y-4">
                        <!-- Informações -->
                        <div class="space-y-3 border-b border-gray-100 pb-4">
                            <div class="flex items-center gap-3 text-sm">
                                <i class="pi pi-envelope text-emerald-600 text-lg shrink-0"></i>
                                <span class="text-gray-500 font-semibold uppercase text-xs tracking-wide w-20">Email:</span>
                                <span class="text-gray-800 font-medium truncate">{{ paciente.email }}</span>
                            </div>
                            <div class="flex items-center gap-3 text-sm">
                                <i class="pi pi-calendar text-emerald-600 text-lg shrink-0"></i>
                                <span class="text-gray-500 font-semibold uppercase text-xs tracking-wide w-20">Última:</span>
                                <span class="text-gray-800 font-medium">{{ paciente.ultimaConsulta }}</span>
                            </div>
                        </div>

                        <!-- Telefone -->
                        <div class="flex items-center gap-3">
                            <i class="pi pi-phone text-emerald-600"></i>
                            <p class="text-gray-700 text-sm">{{ paciente.telefone || paciente.whatsapp || 'Telefone não informado' }}</p>
                        </div>
                    </div>

                    <!-- Card Footer with Buttons -->
                    <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                        <Button label="Ver perfil" icon="pi pi-eye" severity="success" text @click="verPerfil(paciente)" class="flex-1 text-xs font-medium" />
                        <Button v-if="paciente.status === 'ativo'" label="Arquivar" icon="pi pi-lock" severity="warning" text @click="novoPlano(paciente)" class="flex-1 text-xs font-medium" />
                        <Button v-else label="Reativar" icon="pi pi-check" severity="warning" text @click="criarPlano(paciente)" class="flex-1 text-xs font-medium" />
                    </div>
                </div>
            </div>

            <!-- Pagination Controls -->
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 p-6 bg-linear-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <!-- Previous Button -->
                <Button icon="pi pi-chevron-left" @click="irParaPagina(paginaAtual - 1)" :disabled="paginaAtual === 1" rounded text severity="secondary" class="w-full sm:w-auto" />

                <!-- Page Numbers -->
                <div class="flex items-center gap-2 flex-wrap justify-center">
                    <!-- First page button if not on first page -->
                    <Button v-if="paginaAtual > 2" label="1" @click="irParaPagina(1)" rounded :severity="paginaAtual === 1 ? 'success' : 'secondary'" :outlined="paginaAtual !== 1" size="small" />

                    <!-- Ellipsis if gap exists -->
                    <span v-if="paginaAtual > 3" class="text-gray-400 px-2">...</span>

                    <!-- Pages around current page -->
                    <Button v-for="page in pageNumbers" :key="page" :label="String(page)" @click="irParaPagina(page)" rounded :severity="paginaAtual === page ? 'success' : 'secondary'" :outlined="paginaAtual !== page" size="small" />

                    <!-- Ellipsis if gap exists -->
                    <span v-if="paginaAtual < totalPaginas - 2" class="text-gray-400 px-2">...</span>

                    <!-- Last page button if not on last page -->
                    <Button
                        v-if="paginaAtual < totalPaginas - 1"
                        :label="String(totalPaginas)"
                        @click="irParaPagina(totalPaginas)"
                        rounded
                        :severity="paginaAtual === totalPaginas ? 'success' : 'secondary'"
                        :outlined="paginaAtual !== totalPaginas"
                        size="small"
                    />
                </div>

                <!-- Page Info and Next Button -->
                <div class="flex items-center gap-4">
                    <span class="text-sm text-gray-600 font-medium whitespace-nowrap">
                        Página <strong class="text-emerald-600">{{ paginaAtual }}</strong> de <strong class="text-emerald-600">{{ totalPaginas }}</strong>
                    </span>
                    <Button icon="pi pi-chevron-right" @click="irParaPagina(paginaAtual + 1)" :disabled="paginaAtual === totalPaginas" rounded text severity="secondary" class="w-full sm:w-auto" />
                </div>
            </div>
        </div>
    </div>

    <!-- Dialog Novo Paciente -->
    <Dialog v-model:visible="showDialog" header="Novo Paciente" :modal="true" :style="{ width: '60vw' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }" @hide="showDialog = false">
        <div class="space-y-6">
            <!-- Seção: Dados Pessoais -->
            <div>
                <h3 class="text-lg font-bold text-gray-900 mb-4">Dados pessoais</h3>

                <!-- Foto de Perfil - Em desenvolvimento -->
                <!-- <div class="mb-8 flex flex-col items-center">
                    <input ref="inputFotoRef" type="file" accept="image/*" @change="carregarImagem" class="hidden" />
                    <div class="relative group mb-4">
                        <div v-if="imagemPreview" class="relative w-40 h-40 rounded-full overflow-hidden bg-gray-100 border-4 border-emerald-200 shadow-lg flex items-center justify-center">
                            <img :src="imagemPreview" :style="{ transform: `scale(${zoomImagem / 100})` }" class="w-full h-full object-cover" />
                            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-all duration-300 cursor-pointer" @click="selecionarFoto">
                                <i class="pi pi-cloud-upload text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></i>
                            </div>
                        </div>
                        <div
                            v-else
                            class="w-40 h-40 rounded-full bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-dashed border-emerald-300 flex items-center justify-center cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all duration-300 group"
                            @click="selecionarFoto"
                        >
                            <div class="text-center">
                                <i class="pi pi-camera text-emerald-400 text-4xl block mb-2"></i>
                                <p class="text-xs font-semibold text-emerald-600">Clique para enviar</p>
                            </div>
                        </div>
                    </div>
                    <div v-if="imagemPreview" class="w-full max-w-xs mb-4">
                        <input v-model.number="zoomImagem" type="range" min="50" max="200" step="10" class="w-full h-2 bg-emerald-100 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                        <p class="text-xs text-center text-gray-500 mt-2">Tamanho: {{ zoomImagem }}%</p>
                    </div>
                    <div v-if="imagemPreview" class="flex gap-2 justify-center">
                        <Button label="Alterar" icon="pi pi-upload" severity="success" size="small" outlined @click="selecionarFoto" />
                        <Button label="Remover" icon="pi pi-trash" severity="danger" size="small" text @click="removerImagem" />
                    </div>
                    <p class="text-sm font-semibold text-gray-700 mt-4">Foto de perfil</p>
                </div> -->

                <!-- Nome Completo -->
                <div class="mb-4">
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Nome completo</label>
                    <InputText v-model="formNovoPaciente.nome" type="text" placeholder="Ex.: João da Silva" class="w-full" autocomplete="off" :invalid="!!formErrors.nome" />
                    <small v-if="formErrors.nome" class="block text-red-500 text-xs font-semibold mt-1">{{ formErrors.nome }}</small>
                </div>

                <!-- Apelido e Data de Nascimento -->
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Apelido</label>
                        <InputText v-model="formNovoPaciente.apelido" type="text" placeholder="Como ele prefere ser chamado" class="w-full" autocomplete="off" />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Data de nascimento</label>
                        <DatePicker v-model="formNovoPaciente.data_nascimento" dateFormat="dd/mm/yy" placeholder="dd/mm/yyyy" :showIcon="true" />
                    </div>
                </div>

                <!-- E-mail -->
                <div class="mb-4">
                    <label class="block text-sm font-semibold text-gray-700 mb-2">E-mail</label>
                    <InputText v-model="formNovoPaciente.email" type="email" placeholder="email@exemplo.com" class="w-full" autocomplete="off" :invalid="!!formErrors.email" />
                    <small v-if="formErrors.email" class="block text-red-500 text-xs font-semibold mt-1">{{ formErrors.email }}</small>
                </div>

                <!-- WhatsApp e Sexo -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">WhatsApp</label>
                        <InputMask v-model="formNovoPaciente.whatsapp" mask="(99) 99999-9999" placeholder="(00) 00000-0000" class="w-full" />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Sexo</label>
                        <div class="flex items-center gap-4 mb-2">
                            <div class="flex items-center">
                                <RadioButton v-model="formNovoPaciente.sexo" value="M" inputId="masculino" :invalid="!!formErrors.sexo" />
                                <label for="masculino" class="ml-2 text-sm cursor-pointer">Masculino</label>
                            </div>
                            <div class="flex items-center">
                                <RadioButton v-model="formNovoPaciente.sexo" value="F" inputId="feminino" :invalid="!!formErrors.sexo" />
                                <label for="feminino" class="ml-2 text-sm cursor-pointer">Feminino</label>
                            </div>
                            <div class="flex items-center">
                                <RadioButton v-model="formNovoPaciente.sexo" value="Outro" inputId="outro" :invalid="!!formErrors.sexo" />
                                <label for="outro" class="ml-2 text-sm cursor-pointer">Outro</label>
                            </div>
                        </div>
                        <small v-if="formErrors.sexo" class="block text-red-500 text-xs font-semibold mt-1">{{ formErrors.sexo }}</small>
                    </div>
                </div>
            </div>

            <!-- Seção: Boas-vindas -->
            <!-- <div class="border-t border-gray-200 pt-6">
                <h3 class="text-lg font-bold text-gray-900 mb-4">Boas-vindas</h3> -->

            <!-- Link de Acesso -->
            <!-- <div class="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded mb-4 flex items-start gap-3">
                    <i class="pi pi-link text-emerald-600 text-xl flex-shrink-0 mt-1"></i>
                    <div class="flex-1">
                        <h4 class="font-semibold text-emerald-900 mb-1">Link de acesso</h4>
                        <p class="text-sm text-emerald-800">O paciente receberá automaticamente um link para acessar o portal do paciente e preencher a anamnese prévia.</p>
                        <div class="mt-3 flex gap-2">
                            <Button
                                label="WHATSAPP"
                                icon="pi pi-send"
                                :severity="formNovoPaciente.canal === 'whatsapp' ? 'success' : 'secondary'"
                                size="small"
                                :text="formNovoPaciente.canal !== 'whatsapp'"
                                @click="formNovoPaciente.canal = 'whatsapp'"
                            />
                            <Button label="E-MAIL" icon="pi pi-envelope" :severity="formNovoPaciente.canal === 'email' ? 'success' : 'secondary'" size="small" :text="formNovoPaciente.canal !== 'email'" @click="formNovoPaciente.canal = 'email'" />
                        </div>
                    </div>
                    <Toggle v-model="formNovoPaciente.enviar_automatico" onLabel="Sim" offLabel="Não" class="flex-shrink-0" />
                </div>
            </div> -->
        </div>

        <template #footer>
            <Button label="Cancelar" severity="secondary" @click="showDialog = false" />
            <Button label="Salvar paciente" severity="success" icon="pi pi-check" @click="salvarNovoPaciente" />
            <Button label="Salvar e Enviar Anamnese" severity="info" icon="pi pi-send" @click="salvarPacienteEEnviarFormulario" :loading="loadingSalvarComAnamnese" :disabled="loadingSalvarComAnamnese" />
        </template>
    </Dialog>
</template>

<script setup>
import AnamneseService from '@/service/AnamneseService';
import PacienteService from '@/service/PacienteService';
import { construirUrlFotoPaciente } from '@/utils/urlHelper';
import { DatePicker } from 'primevue';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import InputMask from 'primevue/inputmask';
import InputText from 'primevue/inputtext';
import RadioButton from 'primevue/radiobutton';
import Tag from 'primevue/tag';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const toast = useToast();

// Estados
const pacientes = ref([]);
const filtroStatus = ref('todos');
const searchValue = ref('');
const showDialog = ref(false);
const loading = ref(true);
const loadingSalvarComAnamnese = ref(false);
const formErrors = ref({});
const paginaAtual = ref(1);
const limiteItens = ref(10);
const paginacao = ref({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
});
const pacienteSalvo = ref(null);
let debounceTimer = null;

// Estados da foto de perfil
// const imagemPreview = ref(null);
// const zoomImagem = ref(100);
// const inputFotoRef = ref(null);

// Estados do formulário
const formNovoPaciente = ref({
    nome: '',
    apelido: '',
    data_nascimento: null,
    email: '',
    whatsapp: '',
    sexo: ''
    // enviar_automatico: false,
    // canal: 'whatsapp'
});

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

// Função para construir URL da foto do paciente com base no ambiente
const obterUrlFotoPaciente = (fotoPerfil) => {
    return construirUrlFotoPaciente(fotoPerfil);
};

const carregarPacientes = async () => {
    loading.value = true;
    try {
        const params = {
            page: paginaAtual.value,
            limit: limiteItens.value
        };

        // Adicionar busca se houver valor
        if (searchValue.value?.trim()) {
            params.busca = searchValue.value.trim();
        }

        const response = await PacienteService.listarPacientes(params);
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

            // Armazenar dados de paginação do backend
            if (response.data.pagination) {
                paginacao.value = response.data.pagination;
            }
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

// Função para carregar imagem de perfil
// const carregarImagem = (event) => {
//     const arquivo = event.target.files[0];
//     if (arquivo) {
//         const leitor = new FileReader();
//         leitor.onload = (e) => {
//             imagemPreview.value = e.target.result;
//             formNovoPaciente.value.foto_perfil = e.target.result;
//             zoomImagem.value = 100;
//         };
//         leitor.readAsDataURL(arquivo);
//     }
// };

// Função para remover a imagem
// const removerImagem = () => {
//     imagemPreview.value = null;
//     formNovoPaciente.value.foto_perfil = null;
//     zoomImagem.value = 100;
//     if (inputFotoRef.value) {
//         inputFotoRef.value.value = '';
//     }
// };

// Função para abrir seletor de arquivo
// const selecionarFoto = () => {
//     inputFotoRef.value?.click();
// };

const pacientesFiltrados = () => {
    // Com paginação no backend, retornamos os pacientes já filtrados/paginados
    return pacientes.value || [];
};

// Computed para pacientes - agora já vêm filtrados/paginados do backend
const pacientesPaginados = computed(() => {
    return pacientes.value || [];
});

// Computed para total de páginas (vem do backend)
const totalPaginas = computed(() => {
    return paginacao.value.totalPages || 1;
});

// Computed para números das páginas a exibir (página atual ±1)
const pageNumbers = computed(() => {
    const total = totalPaginas.value;
    const current = paginaAtual.value;
    const pages = [];

    // Sempre mostra até 3 números de página
    const start = Math.max(1, current - 1);
    const end = Math.min(total, current + 1);

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    return pages;
});

// Função para ir para página
const irParaPagina = (pagina) => {
    if (pagina < 1 || pagina > totalPaginas.value) return;
    paginaAtual.value = pagina;
    carregarPacientes();
};

// Reset de página quando status filtra - mas mantém busca
watch(filtroStatus, () => {
    paginaAtual.value = 1;
    carregarPacientes();
});

// Busca com debounce
watch(searchValue, () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    paginaAtual.value = 1;
    debounceTimer = setTimeout(() => {
        carregarPacientes();
    }, 500);
});

const abrirNovoPaciente = () => {
    formNovoPaciente.value = {
        nome: '',
        apelido: '',
        data_nascimento: null,
        email: '',
        whatsapp: '',
        sexo: ''
    };
    formErrors.value = {};
    // imagemPreview.value = null;
    // zoomImagem.value = 100;
    // if (inputFotoRef.value) {
    //     inputFotoRef.value.value = '';
    // }
    showDialog.value = true;
};

const validarFormulario = () => {
    formErrors.value = {};

    if (!formNovoPaciente.value.nome) {
        formErrors.value.nome = 'Nome completo é obrigatório';
    }

    if (!formNovoPaciente.value.email) {
        formErrors.value.email = 'Email é obrigatório';
    }

    if (!formNovoPaciente.value.sexo) {
        formErrors.value.sexo = 'Sexo é obrigatório';
    }

    return Object.keys(formErrors.value).length === 0;
};

const prepararDadosPaciente = () => {
    return {
        nome: formNovoPaciente.value.nome,
        como_prefere_ser_chamado: formNovoPaciente.value.apelido,
        data_nascimento: formNovoPaciente.value.data_nascimento,
        email: formNovoPaciente.value.email,
        whatsapp: formNovoPaciente.value.whatsapp,
        sexo: formNovoPaciente.value.sexo
    };
};

const extrairMensagemErro = (error) => {
    if (error.response?.data?.message) {
        return error.response.data.message;
    }
    if (error.response?.data?.error) {
        return error.response.data.error;
    }
    if (error.message) {
        return error.message;
    }
    return 'Não foi possível completar a operação';
};

const salvarNovoPaciente = async () => {
    if (!validarFormulario()) {
        return;
    }

    try {
        const dadosPaciente = prepararDadosPaciente();
        await PacienteService.criarPaciente(dadosPaciente);

        toast.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Paciente cadastrado com sucesso',
            life: 3000
        });

        showDialog.value = false;
        await carregarPacientes();
    } catch (error) {
        console.error('Erro ao salvar paciente:', error);
        const mensagemErro = extrairMensagemErro(error);
        toast.add({
            severity: 'error',
            summary: 'Erro ao cadastrar paciente',
            detail: mensagemErro,
            life: 5000
        });
    }
};

const salvarPacienteEEnviarFormulario = async () => {
    if (!validarFormulario()) {
        return;
    }

    try {
        loadingSalvarComAnamnese.value = true;
        const dadosPaciente = prepararDadosPaciente();

        // 1️⃣ Salvar o paciente
        const responsePaciente = await PacienteService.criarPaciente(dadosPaciente);
        pacienteSalvo.value = responsePaciente.data.data;
        console.log('Paciente salvo com ID:', pacienteSalvo.value?.id);

        // 2️⃣ Agora enviar o formulário de anamnese
        if (pacienteSalvo.value?.id) {
            await AnamneseService.enviarFormulario({ email: pacienteSalvo.value.email, nome: pacienteSalvo.value.nome, paciente_id: pacienteSalvo.value.id });
            console.log('Anamnese criada para o paciente');

            toast.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'Paciente cadastrado e formulário de anamnese enviado',
                life: 3000
            });
        }

        showDialog.value = false;
        await carregarPacientes();
    } catch (error) {
        console.error('Erro ao salvar paciente e enviar anamnese:', error);
        const mensagemErro = extrairMensagemErro(error);
        toast.add({
            severity: 'error',
            summary: 'Erro ao processar operação',
            detail: mensagemErro,
            life: 5000
        });
        showDialog.value = false;
    } finally {
        loadingSalvarComAnamnese.value = false;
    }
};

const verPerfil = (paciente) => {
    router.push(`/pacientes/${paciente.id}`);
};

const criarPlano = (paciente) => {
    console.log('Criar plano para:', paciente.nome);
};

const novoPlano = async (paciente) => {
    try {
        await PacienteService.arquivarPaciente(paciente.id);

        toast.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: `Paciente "${paciente.nome}" foi arquivado com sucesso`,
            life: 3000
        });

        await carregarPacientes();
    } catch (error) {
        console.error('Erro ao arquivar paciente:', error);
        const mensagemErro = extrairMensagemErro(error);
        toast.add({
            severity: 'error',
            summary: 'Erro ao arquivar paciente',
            detail: mensagemErro,
            life: 5000
        });
    }
};

// Watchers para remover erros quando o usuário edita os campos
watch(
    () => formNovoPaciente.value.nome,
    () => {
        if (formErrors.value.nome) {
            delete formErrors.value.nome;
        }
    }
);

watch(
    () => formNovoPaciente.value.email,
    () => {
        if (formErrors.value.email) {
            delete formErrors.value.email;
        }
    }
);

watch(
    () => formNovoPaciente.value.sexo,
    () => {
        if (formErrors.value.sexo) {
            delete formErrors.value.sexo;
        }
    }
);

onMounted(() => {
    carregarPacientes();
});
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
