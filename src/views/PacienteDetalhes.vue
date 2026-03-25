<template>
    <!-- ConfirmPopup -->
    <ConfirmPopup />

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
        <PacienteHeader :paciente="paciente" :fotoPacienteUrl="fotoPacienteUrl" :loadingUploadFoto="loadingUploadFoto" :activeTab="activeTab" @update:activeTab="activeTab = $event" @foto-change="enviarFoto" />

        <!-- BEGIN: Content Area -->
        <div class="flex-1 overflow-y-auto mt-3">
            <!-- <AbaResumo v-if="activeTab === 'resumo'" @ir-para-anamnese="activeTab = 'anamnese'" @ir-para-medidas="activeTab = 'medidas'" @ir-para-planos="activeTab = 'planos'" /> -->

            <AbaAnamnese
                v-if="activeTab === 'anamnese'"
                :loadingAnamnese="loadingAnamnese"
                :erroAnamnese="erroAnamnese"
                :anamnese="anamnese"
                @criar-anamnese="abrirCriacaoAnamnese"
                @editar-anamnese="abrirEdicaoAnamnese"
                @enviar-formulario="enviarFormularioAnamnese"
            />

            <AbaMedidas
                v-else-if="activeTab === 'medidas'"
                :loadingMedidas="loadingMedidas"
                :medidas="medidas"
                :medidaSelecionada="medidaSelecionada"
                @criar-medida="abrirCriacaoMedida"
                @visualizar-medida="visualizarMedida"
                @deletar-medida="deletarMedida"
            />

            <AbaPlanos
                v-else-if="activeTab === 'planos'"
                :loadingPlanos="loadingPlanos"
                :planos="planos"
                :formatarDataBrasileira="formatarDataBrasileira"
                @criar-plano="abrirCriacaoPlano"
                @editar-plano="abrirEdicaoPlano"
                @deletar-plano="deletarPlano"
                @enviar-plano="handleEnviarPlano"
                @arquivar-plano="handleArquivarPlano"
                @ativar-plano="handleAtivarPlano"
            />

            <!-- <AbaAdesao v-else-if="activeTab === 'adesao'" /> -->

            <div v-else class="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-emerald-50 p-12 text-center">
                <i class="pi pi-home text-4xl text-slate-300 mb-4"></i>
                <p class="text-slate-500 text-lg">Conteudo da aba "{{ activeTab }}" em breve...</p>
            </div>
        </div>
        <!-- END: Content Area -->

        <!-- Modal Adicionar Medida (Componente Extraído) -->
        <ModalAdicionarMedida
            :visible="showDialogCriacaoMedida"
            :formularioMedida="formularioMedida"
            :paciente="paciente"
            :loading="loadingCriacaoMedida"
            :calcularTMBParam="calcularTMBParam"
            @update:visible="showDialogCriacaoMedida = $event"
            @fechar="fecharCriacaoMedida"
            @salvar-medida="handleSalvarMedida"
        />
        <!-- END: Modal Adicionar Medida -->

        <!-- Modal Editar Medida (Componente Extraído) -->
        <ModalEditarMedida
            :visible="showDialogEdicaoMedida"
            :medida="medidaEditando"
            :paciente="paciente"
            :loading="loadingEdicaoMedida"
            :calcularTMBParam="calcularTMBParam"
            @update:visible="showDialogEdicaoMedida = $event"
            @fechar="fecharEdicaoMedida"
            @salvar-edicao-medida="handleSalvarEdicaoMedida"
        />
        <!-- END: Modal Editar Medida -->

        <!-- BEGIN: Modal Editar Paciente (Componente Extraído) -->
        <ModalEdicaoPaciente
            :visible="showDialogEdicao"
            :formEdicaoPaciente="formEdicaoPaciente"
            :formErrors="formErrors"
            :loading="loadingAtualizacao"
            @update:visible="showDialogEdicao = $event"
            @fechar="fecharEdicaoPaciente"
            @salvar="atualizarPaciente"
        />
        <!-- END: Modal Editar Paciente -->

        <!-- BEGIN: Dialog Editar Anamnese -->
        <ModalEdicaoAnamnese
            :visible="showDialogEdicaoAnamnese"
            :anamneseEditando="anamneseEditando"
            :modoEdicao="modoEdicao"
            :loading="loadingEdicaoAnamnese"
            :opcoesTempo="opcoesTempo"
            :opcoesObjetivo="opcoesObjetivo"
            :opcoesTrabalhoCasaOuFora="opcoesTrabalhoCasaOuFora"
            :opcoesTempoCozinhar="opcoesTempoCozinhar"
            :opcoesRestricao="opcoesRestricao"
            :opcoesConsumoAlcool="opcoesConsumoAlcool"
            :opcoesQualidadeSono="opcoesQualidadeSono"
            @update:visible="showDialogEdicaoAnamnese = $event"
            @fechar="fecharEdicaoAnamnese"
            @salvar="salvarEdicaoAnamnese"
        />
        <!-- END: Dialog Editar Anamnese -->

        <!-- BEGIN: Modal Criar Plano Alimentar (4 Steps) -->
        <WizardPlano
            :visible="showDialogCriacaoPlano"
            :paciente="paciente"
            :editandoPlanoId="editandoPlanoId"
            :medidaMaisRecente="medidaMaisRecente"
            :anamnese="anamnese"
            @update:visible="showDialogCriacaoPlano = $event"
            @fechar="showDialogCriacaoPlano = false"
            @concluido="carregarPlanos"
        />
        <!-- END: Modal Criar Plano Alimentar -->

        <!-- BEGIN: Modal Enviar Plano -->
        <ModalEnviarPlano :visible="showModalEnviarPlano" :paciente="paciente" :plano="planoParaEnviar" @update:visible="showModalEnviarPlano = $event" @fechar="showModalEnviarPlano = false" />
        <!-- END: Modal Enviar Plano -->
    </main>
</template>

<script setup>
import ModalAdicionarMedida from '@/components/ModalAdicionarMedida.vue';
import ModalEdicaoAnamnese from '@/components/ModalEdicaoAnamnese.vue';
import ModalEdicaoPaciente from '@/components/ModalEdicaoPaciente.vue';
import ModalEditarMedida from '@/components/ModalEditarMedida.vue';
import ModalEnviarPlano from '@/components/ModalEnviarPlano.vue';
import AbaAnamnese from '@/components/paciente/AbaAnamnese.vue';
import AbaMedidas from '@/components/paciente/AbaMedidas.vue';
import AbaPlanos from '@/components/paciente/AbaPlanos.vue';
import PacienteHeader from '@/components/paciente/PacienteHeader.vue';
import WizardPlano from '@/components/wizard/WizardPlano.vue';
import { useMedidas } from '@/composables/useMedidas';
import AnamneseService from '@/service/AnamneseService';
import PacienteService from '@/service/PacienteService';
import PlanoAlimentarService from '@/service/PlanoAlimentarService';
import { construirUrlFotoPaciente } from '@/utils/urlHelper';
import Button from 'primevue/button';
import ConfirmPopup from 'primevue/confirmpopup';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const toast = useToast();
const confirm = useConfirm();

// ===== Composable useMedidas =====
const paciente = ref(null);
const activeTab = ref('anamnese');
const {
    medidas,
    loadingMedidas,
    medidasCarregada,
    medidaSelecionada,
    medidaMaisRecente,
    showDialogCriacaoMedida,
    loadingCriacaoMedida,
    formularioMedida,
    showDialogEdicaoMedida,
    loadingEdicaoMedida,
    medidaEditando,
    carregarMedidas,
    abrirCriacaoMedida,
    fecharCriacaoMedida,
    abrirEdicaoMedida,
    fecharEdicaoMedida,
    calcularTMBParam,
    salvarMedida,
    salvarEdicaoMedida,
    deletarMedida
} = useMedidas(null, paciente, activeTab);

// Estados
const loading = ref(true);
const erro = ref(null);
const showDialogEdicao = ref(false);
const formErrors = ref({});
const loadingAtualizacao = ref(false);
const loadingUploadFoto = ref(false);

// Estados da anamnese
const anamnese = ref(null);
const loadingAnamnese = ref(false);
const erroAnamnese = ref(null);
const anamneseCarregada = ref(false);

// Estados para edição de anamnese
const showDialogEdicaoAnamnese = ref(false);
const loadingEdicaoAnamnese = ref(false);
const anamneseEditando = ref(null);
const modoEdicao = ref(true); // true = editar, false = criar

// Estados dos planos alimentares
const planos = ref([]);
const loadingPlanos = ref(false);
const erroPlanos = ref(null);
const planosCarregada = ref(false);
const showDialogCriacaoPlano = ref(false);
const editandoPlanoId = ref(null); // ID do plano sendo editado (null = modo criação)

// Estados para o modal de envio de plano
const showModalEnviarPlano = ref(false);
const planoParaEnviar = ref(null);

// ===== COMPUTED PROPERTIES (estados do composable removidos) =====
const fotoPacienteUrl = computed(() => {
    return construirUrlFotoPaciente(paciente.value?.foto_perfil);
});

const handleSalvarMedida = (dadosFormulario) => {
    formularioMedida.value = dadosFormulario;
    salvarMedida();
};

// ===== WATCHERS PARA WIZARD DE PLANO ALIMENTAR =====

// Estados do formulário de edição
const formEdicaoPaciente = ref({
    nome: '',
    apelido: '',
    data_nascimento: null,
    email: '',
    whatsapp: '',
    sexo: ''
});

// Opções para o formulário de edição de anamnese
const opcoesTempo = [
    { value: 'menos_6_meses', label: 'Menos de 6 meses' },
    { value: '6_meses_1_ano', label: '6 meses a 1 ano' },
    { value: 'mais_1_ano', label: 'Mais de 1 ano' }
];

const opcoesObjetivo = [
    { value: 'emagrecer', label: 'Emagrecer', icon: '📉' },
    { value: 'ganhar_massa', label: 'Ganhar Massa', icon: '💪' },
    { value: 'melhorar_saude', label: 'Saúde', icon: '🌱' },
    { value: 'controlar_doenca', label: 'Controlar Doença', icon: '⚕️' },
    { value: 'melhorar_performance', label: 'Performance', icon: '⚡' },
    { value: 'outro', label: 'Outro', icon: '🎯' }
];

const opcoesTrabalhoCasaOuFora = [
    { value: 'casa', label: 'Casa' },
    { value: 'fora', label: 'Fora' },
    { value: 'hibrido', label: 'Híbrido' }
];

const opcoesTempoCozinhar = [
    { value: 'sempre', label: 'Sempre' },
    { value: 'as_vezes', label: 'Às vezes' },
    { value: 'raramente', label: 'Raramente' }
];

const opcoesRestricao = [
    { value: 'nenhuma', label: 'Nenhuma' },
    { value: 'lactose', label: 'Lactose' },
    { value: 'gluten', label: 'Glúten' },
    { value: 'vegetariano', label: 'Vegetariano' },
    { value: 'vegano', label: 'Vegano' },
    { value: 'religiao', label: 'Religiosa' },
    { value: 'outra', label: 'Outra' }
];

const opcoesQualidadeSono = [
    { value: 'otimo', label: 'Ótimo' },
    { value: 'bom', label: 'Bom' },
    { value: 'ruim', label: 'Ruim' },
    { value: 'pessimo', label: 'Péssimo' }
];

const opcoesConsumoAlcool = [
    { value: 'nao', label: 'Não consome' },
    { value: 'socialmente', label: 'Socialmente' },
    { value: 'frequentemente', label: 'Frequentemente' }
];

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

// ===== FUNÇÕES DE CÁLCULO (movidas para @/utils/nutricionais) =====
// As funções foram extraídas para um arquivo dedicado e importadas acima

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

const atualizarPaciente = async (dadosFormulario) => {
    // Atualizar formEdicaoPaciente com dados do modal
    formEdicaoPaciente.value = dadosFormulario;

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

const fecharEdicaoPaciente = () => {
    showDialogEdicao.value = false;
    formErrors.value = {};
};

// Função para fazer upload da foto
const enviarFoto = async (event) => {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;

    // Validar tipo de arquivo
    if (!arquivo.type.startsWith('image/')) {
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Por favor, selecione um arquivo de imagem válido',
            life: 3000
        });
        return;
    }

    // Validar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (arquivo.size > maxSize) {
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'A imagem não pode ser maior que 5MB',
            life: 3000
        });
        return;
    }

    loadingUploadFoto.value = true;

    try {
        const formData = new FormData();
        formData.append('foto', arquivo);

        // Chamar service para enviar foto
        const response = await PacienteService.enviarFotoPaciente(paciente.value.id, formData);

        if (response.data.success) {
            toast.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'Foto do paciente atualizada com sucesso',
                life: 3000
            });

            // Recarregar dados do paciente para atualizar a foto
            await carregarPaciente();
        } else {
            throw new Error(response.data.message || 'Erro ao enviar foto');
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: error.response?.data?.message || 'Erro ao enviar a foto',
            life: 3000
        });
    } finally {
        loadingUploadFoto.value = false;
        // Limpar input file
        if (event?.target) {
            event.target.value = '';
        }
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
            // ignore
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
            // ignore
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
            // ignore
        }
    }
);

const carregarAnamnese = async () => {
    loadingAnamnese.value = true;
    erroAnamnese.value = null;

    try {
        const idPaciente = route.params.id;

        const response = await AnamneseService.obterAnamnesePaciente(idPaciente);

        if (response.data.success && response.data.data) {
            anamnese.value = response.data.data;
            erroAnamnese.value = null;
        } else {
            erroAnamnese.value = response.data.message || 'Anamnese não encontrada para este paciente';
            anamnese.value = null;
        }
    } catch (error) {
        erroAnamnese.value = 'Erro ao carregar anamnese. Tente enviar o formulário novamente.';
        anamnese.value = null;
    } finally {
        loadingAnamnese.value = false;
        anamneseCarregada.value = true;
    }
};

watch(
    () => activeTab.value,
    (novaTab) => {
        if (novaTab === 'anamnese' && !anamneseCarregada.value) {
            carregarAnamnese();
        }
    }
);

const abrirEdicaoAnamnese = () => {
    if (anamnese.value) {
        anamneseEditando.value = {
            ...anamnese.value
        };
        modoEdicao.value = true;
        showDialogEdicaoAnamnese.value = true;
    } else {
        abrirCriacaoAnamnese();
    }
};

const abrirCriacaoAnamnese = () => {
    // Criar um objeto vazio para a nova anamnese
    anamneseEditando.value = {
        telefone: '',
        whatsapp: '',
        peso_atual: null,
        altura: null,
        tempo_nesse_peso: '',
        fez_acompanhamento_antes: false,
        qual_acompanhamento: '',
        objetivo: '',
        objetivo_descricao: '',
        maior_dificuldade_alimentacao: '',
        horario_acorda: '',
        horario_cafe_manha: '',
        horario_almoco: '',
        horario_jantar: '',
        horario_dorme: '',
        trabalha_casa_ou_fora: '',
        tempo_parar_cozinhar: '',
        faz_exercicios: false,
        qual_exercicio: '',
        frequencia_exercicio_semana: 0,
        alimentos_que_ama: '',
        alimentos_que_odeia: '',
        restricao_alimentar: 'nenhuma',
        restricao_descricao: '',
        copos_agua_por_dia: 8,
        alergias_alimentares: '',
        consumo_alcool: 'nao',
        doencas_diagnosticadas: '',
        medicamentos: '',
        historico_familiar: '',
        qualidade_sono: 'bom',
        nivel_estresse: 3,
        observacoes_livres: ''
    };
    modoEdicao.value = false;
    showDialogEdicaoAnamnese.value = true;
};

const fecharEdicaoAnamnese = () => {
    showDialogEdicaoAnamnese.value = false;
    anamneseEditando.value = null;
    modoEdicao.value = true;
};

const salvarEdicaoAnamnese = async (dadosAnamnese) => {
    loadingEdicaoAnamnese.value = true;

    try {
        const idPaciente = route.params.id;

        let response;
        if (modoEdicao.value) {
            // Modo edição - PUT
            response = await AnamneseService.atualizarAnamnesePaciente(idPaciente, dadosAnamnese);
        } else {
            // Modo criação - POST
            response = await AnamneseService.criarAnamnesePaciente(idPaciente, dadosAnamnese);
        }

        if (response.data.success) {
            // Fechar o dialog
            fecharEdicaoAnamnese();

            // Recarregar os dados da anamnese para atualizar a tela
            await carregarAnamnese();

            toast.add({
                severity: 'success',
                summary: 'Sucesso!',
                detail: modoEdicao.value ? 'Anamnese atualizada com sucesso' : 'Anamnese criada com sucesso',
                life: 3000
            });
        } else {
            throw new Error(response.data.message || 'Erro ao salvar anamnese');
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: error.response?.data?.message || 'Erro ao salvar as alterações',
            life: 3000
        });
    } finally {
        loadingEdicaoAnamnese.value = false;
    }
};

// Visualizar medida - abre modal para edição
const visualizarMedida = (medida) => {
    abrirEdicaoMedida(medida);
};

const handleSalvarEdicaoMedida = (dadosMedida) => {
    salvarEdicaoMedida(dadosMedida);
};

// Funções de Planos Alimentares
const carregarPlanos = async () => {
    loadingPlanos.value = true;
    erroPlanos.value = null;

    try {
        const idPaciente = route.params.id;

        const response = await PlanoAlimentarService.listar(idPaciente);

        if (response.dados && Array.isArray(response.dados)) {
            planos.value = response.dados;
            erroPlanos.value = null;
        } else {
            planos.value = [];
            erroPlanos.value = null;
        }
    } catch (error) {
        erroPlanos.value = 'Erro ao carregar planos. Tente novamente.';
        planos.value = [];
    } finally {
        loadingPlanos.value = false;
        planosCarregada.value = true;
    }
};

watch(
    () => activeTab.value,
    (novaTab) => {
        if (novaTab === 'planos') {
            if (!planosCarregada.value) {
                carregarPlanos();
            }
            // Carregar medidas também para exibir ações rápidas no wizard
            if (!medidasCarregada.value) {
                carregarMedidas();
            }
        }
        // Carregar dados para a aba resumo
        if (novaTab === 'resumo') {
            if (!anamneseCarregada.value) {
                carregarAnamnese();
            }
            if (!medidasCarregada.value) {
                carregarMedidas();
            }
            if (!planosCarregada.value) {
                carregarPlanos();
            }
        }
    }
);

// Watch para carregar medidas quando o wizard de criação for aberto
watch(
    () => showDialogCriacaoPlano.value,
    (isOpen) => {
        if (isOpen && !medidasCarregada.value) {
            carregarMedidas();
        }
    }
);

// ===== FUNÇÕES DE TRADUÇÃO (Movidas para @/utils/traducoes.js) =====
const abrirEdicaoPlano = async (planoId) => {
    editandoPlanoId.value = planoId;
    showDialogCriacaoPlano.value = true;
};

const abrirCriacaoPlano = () => {
    editandoPlanoId.value = null;
    showDialogCriacaoPlano.value = true;
};

const handleEnviarPlano = async (planoId) => {
    try {
        const idPaciente = route.params.id;
        const response = await PlanoAlimentarService.buscar(idPaciente, planoId);

        if (response && response.dados) {
            planoParaEnviar.value = response.dados;
            showModalEnviarPlano.value = true;
        } else {
            throw new Error('Plano não encontrado');
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao carregar o plano para envio',
            life: 3000
        });
    }
};

const handleArquivarPlano = (idPlano) => {
    confirm.require({
        message: 'Tem certeza que deseja arquivar este plano alimentar?',
        header: 'Confirmação de Arquivamento',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            try {
                const idPaciente = route.params.id;

                await PlanoAlimentarService.arquivar(idPaciente, idPlano);

                toast.add({
                    severity: 'success',
                    summary: 'Sucesso',
                    detail: 'Plano arquivado com sucesso',
                    life: 3000
                });

                await carregarPlanos();
            } catch (error) {
                toast.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao arquivar o plano',
                    life: 3000
                });
            }
        }
    });
};

const handleAtivarPlano = (idPlano) => {
    confirm.require({
        message: 'Tem certeza que deseja ativar este plano alimentar?',
        header: 'Confirmação de Ativação',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            try {
                const idPaciente = route.params.id;

                await PlanoAlimentarService.ativar(idPaciente, idPlano);

                toast.add({
                    severity: 'success',
                    summary: 'Sucesso',
                    detail: 'Plano ativado com sucesso',
                    life: 3000
                });

                await carregarPlanos();
            } catch (error) {
                toast.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao ativar o plano',
                    life: 3000
                });
            }
        }
    });
};

const deletarPlano = async (idPlano) => {
    if (!confirm('Tem certeza que deseja deletar este plano alimentar?')) {
        return;
    }

    try {
        const idPaciente = route.params.id;

        await PlanoAlimentarService.deletar(idPaciente, idPlano);

        toast.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Plano deletado com sucesso',
            life: 3000
        });

        await carregarPlanos();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao deletar o plano',
            life: 3000
        });
    }
};

const enviarFormularioAnamnese = async () => {
    try {
        if (paciente.value && paciente.value.email && paciente.value.nome && paciente.value.id && paciente.value.sexo) {
            await AnamneseService.enviarFormulario({ email: paciente.value.email, nome: paciente.value.nome, paciente_id: paciente.value.id });
            toast.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'Paciente cadastrado e formulário de anamnese enviado',
                life: 3000
            });
        } else {
            toast.add({
                severity: 'error',
                summary: 'Erro',
                detail: 'Paciente precisa ter nome, email, sexo para enviar o formulário de anamnese',
                life: 3000
            });
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao enviar o formulário de anamnese',
            life: 3000
        });
    }
};

onMounted(async () => {
    await carregarPaciente();
    // Carregar dados da aba padrão (anamnese)
    if (activeTab.value === 'anamnese' && !anamneseCarregada.value) {
        carregarAnamnese();
    }
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
