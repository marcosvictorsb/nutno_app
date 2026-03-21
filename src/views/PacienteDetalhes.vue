<script setup>
import ModalAdicionarMedida from '@/components/ModalAdicionarMedida.vue';
import ModalEdicaoAnamnese from '@/components/ModalEdicaoAnamnese.vue';
import ModalEdicaoPaciente from '@/components/ModalEdicaoPaciente.vue';
import AbaAdesao from '@/components/paciente/AbaAdesao.vue';
import AbaAnamnese from '@/components/paciente/AbaAnamnese.vue';
import AbaMedidas from '@/components/paciente/AbaMedidas.vue';
import AbaPlanos from '@/components/paciente/AbaPlanos.vue';
import AbaResumo from '@/components/paciente/AbaResumo.vue';
import WizardPlano from '@/components/wizard/WizardPlano.vue';
import { useMedidas } from '@/composables/useMedidas';
import AnamneseService from '@/service/AnamneseService';
import MedidaService from '@/service/MedidaService';
import PacienteService from '@/service/PacienteService';
import PlanoAlimentarService from '@/service/PlanoAlimentarService';
import { calcularGET, calcularTMB, parsePressoArterial } from '@/utils/nutricionais';
import { construirUrlFotoPaciente } from '@/utils/urlHelper';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import ConfirmPopup from 'primevue/confirmpopup';
import Tag from 'primevue/tag';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
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
    pressaoArterialCombinada,
    imcComClassificacao,
    massaMagraCalculada,
    rcqComClassificacao,
    getCalculado,
    carregarMedidas,
    abrirCriacaoMedida,
    fecharCriacaoMedida,
    calcularTMBParam,
    salvarMedida,
    deletarMedida
} = useMedidas(null, paciente, activeTab);

// Estados
const loading = ref(true);
const erro = ref(null);
const showDialogEdicao = ref(false);
const formErrors = ref({});
const loadingAtualizacao = ref(false);
const loadingUploadFoto = ref(false);
const inputFotoRef = ref(null);

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
const linkPlano = ref('nutno.com.br/plano/token-aqui');
const formularioPlano = ref({
    nome: '',
    objetivo: '',
    calorias_meta: 2000,
    refeicoes_dia: 5,
    proteina_g: 150,
    proteina_perc: 30,
    carboidrato_g: 250,
    carboidrato_perc: 45,
    gordura_g: 66,
    gordura_perc: 25,
    refeicoes: [],
    notas: ''
});

// Wizard state variables
const stepAtualPlano = ref(1);
const errosPlano = ref({});
const loadingCriacaoPlano = ref(false);
const calorias_metaEditada = ref(false);
const calorias_metaSugeridaPor = ref(null);
const formularioPlanoCalorias_metaOriginal = ref(2000);
const objetivoPreSelecionadoCom = ref(null);
const macrosForamEditadosManualmente = ref(false);
const macrosSugeridosPor = ref(null);
const atualizandoMacrosProgramaticamente = ref(false);

// ===== COMPUTED PROPERTIES (estados do composable removidos) =====
const fotoPacienteUrl = computed(() => {
    return construirUrlFotoPaciente(paciente.value?.foto_perfil);
});

// ===== WATCHERS PARA RECÁLCULOS AUTOMÁTICOS =====

// Recalcular IMC quando peso ou altura mudam
watch(
    () => [formularioMedida.value.peso, formularioMedida.value.altura],
    () => {
        // Sincronizar IMC com o valor calculado
        if (formularioMedida.value.peso && formularioMedida.value.altura) {
            const peso = parseFloat(formularioMedida.value.peso);
            const altura = parseFloat(formularioMedida.value.altura);
            if (peso > 0 && altura > 0) {
                const alturaMetros = altura / 100;
                const imc = peso / (alturaMetros * alturaMetros);
                formularioMedida.value.imc = parseFloat(imc.toFixed(2));
                console.log('🔄 IMC recalculado:', imc);
            }
        }
    }
);

// Recalcular TMB quando peso, altura ou nível de atividade mudam
watch(
    () => [formularioMedida.value.peso, formularioMedida.value.altura],
    () => {
        if (paciente.value?.data_nascimento && formularioMedida.value.peso && formularioMedida.value.altura) {
            const idade = calcularIdade(paciente.value.data_nascimento);
            const tmb = calcularTMB(formularioMedida.value.peso, formularioMedida.value.altura, idade, paciente.value.sexo);
            if (tmb) {
                formularioMedida.value.tmb = tmb;
                console.log('🔄 TMB recalculado:', tmb, 'kcal/dia');
            }
        }
    }
);

// Recalcular % Massa Magra quando % Gordura muda
watch(
    () => formularioMedida.value.perc_gordura_corporal,
    () => {
        // Sincronizar % Massa Magra com o valor calculado
        if (formularioMedida.value.perc_gordura_corporal !== null && formularioMedida.value.perc_gordura_corporal !== '') {
            const perc_gordura = parseFloat(formularioMedida.value.perc_gordura_corporal);
            const perc_massa_magra = 100 - perc_gordura;
            formularioMedida.value.perc_massa_magra = perc_massa_magra;
            console.log('🔄 % Massa Magra recalculada:', perc_massa_magra);
        }
    }
);

// Recalcular RCQ quando cintura ou quadril mudam
watch(
    () => [formularioMedida.value.circunferencia_cintura, formularioMedida.value.circunferencia_quadril],
    () => {
        // RCQ é computed, então recalcula automaticamente
    }
);

// Recalcular GET quando TMB ou nível de atividade mudam
watch(
    () => [formularioMedida.value.tmb, formularioMedida.value.nivel_atividade],
    () => {
        // Sincronizar gasto_energetico_total com o valor calculado
        const getCalculado = calcularGET(formularioMedida.value.tmb, formularioMedida.value.nivel_atividade);
        if (getCalculado) {
            formularioMedida.value.gasto_energetico_total = getCalculado;
            console.log('🔄 GET recalculado:', getCalculado, 'kcal/dia');
        }
    }
);

// Sincronizar pressão arterial entre campo combinado e campos individuais
watch(
    () => pressaoArterialCombinada.value,
    (novoValor) => {
        const parsed = parsePressoArterial(novoValor);
        if (parsed.valido && parsed.sistolica && parsed.diastolica) {
            formularioMedida.value.pressao_arterial_sistolica = parsed.sistolica;
            formularioMedida.value.pressao_arterial_diastolica = parsed.diastolica;
        }
    }
);

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

const fecharEdicaoPaciente = () => {
    showDialogEdicao.value = false;
    formErrors.value = {};
};

// Função para abrir seletor de arquivo
const selecionarFoto = () => {
    inputFotoRef.value?.click();
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

        console.log('📸 Enviando foto para o paciente:', paciente.value.id);

        // Chamar service para enviar foto
        const response = await PacienteService.enviarFotoPaciente(paciente.value.id, formData);

        console.log('✅ Foto enviada com sucesso:', response.data);

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
        console.error('❌ Erro ao enviar foto:', error);
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: error.response?.data?.message || 'Erro ao enviar a foto',
            life: 3000
        });
    } finally {
        loadingUploadFoto.value = false;
        // Limpar input file
        if (inputFotoRef.value) {
            inputFotoRef.value.value = '';
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

const carregarAnamnese = async () => {
    loadingAnamnese.value = true;
    erroAnamnese.value = null;

    try {
        const idPaciente = route.params.id;
        console.log('📋 Carregando anamnese do paciente:', idPaciente);

        const response = await AnamneseService.obterAnamnesePaciente(idPaciente);
        console.log('-----------------------------> buscou a anamnese do paciente:', idPaciente);

        console.log('✅ Resposta da anamnese:', response.data);

        if (response.data.success && response.data.data) {
            anamnese.value = response.data.data;
            erroAnamnese.value = null;
        } else {
            erroAnamnese.value = response.data.message || 'Anamnese não encontrada para este paciente';
            anamnese.value = null;
        }
    } catch (error) {
        console.error('❌ Erro ao carregar anamnese:', error);
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

const salvarEdicaoAnamnese = async () => {
    loadingEdicaoAnamnese.value = true;

    try {
        const idPaciente = route.params.id;
        const acao = modoEdicao.value ? 'edição' : 'criação';
        console.log(`📝 Salvando ${acao} de anamnese para paciente:`, idPaciente);

        let response;
        if (modoEdicao.value) {
            // Modo edição - PUT
            response = await AnamneseService.atualizarAnamnesePaciente(idPaciente, anamneseEditando.value);
        } else {
            // Modo criação - POST
            response = await AnamneseService.criarAnamnesePaciente(idPaciente, anamneseEditando.value);
        }

        console.log(`✅ Resposta da ${acao}:`, response.data);

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
        console.error('❌ Erro ao salvar anamnese:', error);
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

// Visualizar medida com scroll para seção de detalhes
const visualizarMedida = (medida) => {
    medidaSelecionada.value = medida;
    nextTick(() => {
        const elementoDetalhes = document.querySelector('[data-detalhes-medida]');
        if (elementoDetalhes) {
            elementoDetalhes.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
};

// Funções de Planos Alimentares
const carregarPlanos = async () => {
    loadingPlanos.value = true;
    erroPlanos.value = null;

    try {
        const idPaciente = route.params.id;
        console.log('🍽️ Carregando planos alimentares do paciente:', idPaciente);

        const response = await PlanoAlimentarService.listar(idPaciente);
        console.log('✅ Resposta de planos:', response);

        if (response.dados && Array.isArray(response.dados)) {
            planos.value = response.dados;
            erroPlanos.value = null;
        } else {
            planos.value = [];
            erroPlanos.value = null;
        }
    } catch (error) {
        console.error('❌ Erro ao carregar planos:', error);
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
        if (novaTab === 'planos' && !planosCarregada.value) {
            carregarPlanos();
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

// ===== FUNÇÕES DE TRADUÇÃO (Movidas para @/utils/traducoes.js) =====
// As funções foram extraídas para um arquivo dedicado e importadas acima

const abrirEdicaoPlano = async (planoId) => {
    try {
        stepAtualPlano.value = 1;
        errosPlano.value = {};
        editandoPlanoId.value = planoId; // Rastrear que estamos em modo edição

        // Resetar flags de edição
        calorias_metaEditada.value = false;
        calorias_metaSugeridaPor.value = null;
        macrosForamEditadosManualmente.value = false;
        macrosSugeridosPor.value = null;
        atualizandoMacrosProgramaticamente.value = false;

        loadingCriacaoPlano.value = true;
        const idPaciente = route.params.id;

        // 1️⃣ Carregar medidas do paciente primeiro (importante para os cálculos)
        console.log('📊 Carregando medidas para preencher o modal...');
        await carregarMedidas();

        // Garantir que medidaMaisRecente seja preenchida (usada no template)
        if (medidas.value && medidas.value.length > 0) {
            medidaMaisRecente.value = medidas.value[0];
            console.log('📍 Medida mais recente carregada:', medidaMaisRecente.value);
        }

        // 2️⃣ Carregar plano específico diretamente
        console.log('🍽️ Buscando plano específico do paciente:', planoId);
        const responsePlano = await PlanoAlimentarService.buscar(idPaciente, planoId);
        console.log('📥 Resposta completa:', responsePlano);

        // Extrair os dados do plano (vem dentro de 'dados')
        const planoData = responsePlano.dados;

        if (!planoData) {
            throw new Error(`Plano com ID ${planoId} não encontrado`);
        }

        console.log('✏️ Plano carregado:', planoData);

        // 3️⃣ Preencher formulário com dados do plano
        console.log('📝 Tentando preencher formulário com dados:', {
            nome: planoData.nome,
            objetivo: planoData.objetivo,
            calorias_objetivo: planoData.calorias_objetivo,
            proteinas_objetivo_pct: planoData.proteinas_objetivo_pct,
            carboidratos_objetivo_pct: planoData.carboidratos_objetivo_pct,
            gorduras_objetivo_pct: planoData.gorduras_objetivo_pct,
            refeicoes_length: planoData.refeicoes ? planoData.refeicoes.length : 'NÃO ENCONTRADO',
            refeicoes: planoData.refeicoes
        });
        formularioPlano.value = {
            nome: planoData.nome || '',
            objetivo: planoData.objetivo || '',
            calorias_meta: parseFloat(planoData.calorias_objetivo) || 2000,
            refeicoes_dia: (planoData.refeicoes && planoData.refeicoes.length) || 5,
            proteina_g: 150, // Será recalculado pelos watchers
            proteina_perc: parseFloat(planoData.proteinas_objetivo_pct) || 30,
            carboidrato_g: 250, // Será recalculado pelos watchers
            carboidrato_perc: parseFloat(planoData.carboidratos_objetivo_pct) || 45,
            gordura_g: 66, // Será recalculado pelos watchers
            gordura_perc: parseFloat(planoData.gorduras_objetivo_pct) || 25,
            refeicoes: [],
            notas: planoData.observacoes || ''
        };

        // Recalcular gramas em base nos percentuais
        formularioPlano.value.proteina_g = Math.round((formularioPlano.value.calorias_meta * formularioPlano.value.proteina_perc) / 100 / 4);
        formularioPlano.value.carboidrato_g = Math.round((formularioPlano.value.calorias_meta * formularioPlano.value.carboidrato_perc) / 100 / 4);
        formularioPlano.value.gordura_g = Math.round((formularioPlano.value.calorias_meta * formularioPlano.value.gordura_perc) / 100 / 9);

        // 4️⃣ Estruturar refeições com dados da API
        console.log('🔍 Verificando refeições do plano:', {
            refeicoes: planoData.refeicoes,
            isArray: Array.isArray(planoData.refeicoes),
            length: planoData.refeicoes ? planoData.refeicoes.length : 'undefined'
        });

        if (planoData.refeicoes && Array.isArray(planoData.refeicoes) && planoData.refeicoes.length > 0) {
            console.log(`📋 Encontradas ${planoData.refeicoes.length} refeições para mapear`);

            formularioPlano.value.refeicoes = planoData.refeicoes.map((refeicaoApi) => {
                // Distribuição padrão de calorias por tipo de refeição
                const distribuicoes = {
                    'Café da manhã': 0.25,
                    'Lanche manhã': 0.1,
                    Almoço: 0.35,
                    'Lanche tarde': 0.1,
                    Jantar: 0.2
                };
                const percDistribuicao = distribuicoes[refeicaoApi.nome] || 0.2;

                // Mapear itens da refeição
                const itensMap = (refeicaoApi.itens || []).map((item) => ({
                    id: item.id,
                    alimento_id: item.alimento_id,
                    nome_alimento: item.alimento ? item.alimento.nome : '',
                    grupo_alimento: item.alimento ? item.alimento.grupo : '',
                    quantidade: parseFloat(item.quantidade),
                    unidade: item.unidade,
                    calorias_calculadas: parseFloat(item.calorias_calculadas),
                    proteinas_calculadas: parseFloat(item.proteinas_calculadas),
                    carboidratos_calculados: parseFloat(item.carboidratos_calculados),
                    gorduras_calculadas: parseFloat(item.gorduras_calculadas)
                }));

                // Calcular totais a partir dos itens
                let total_calorias = 0;
                let total_proteinas_g = 0;
                let total_carboidrato_g = 0;
                let total_gordura_g = 0;

                itensMap.forEach((item) => {
                    total_calorias += item.calorias_calculadas;
                    total_proteinas_g += item.proteinas_calculadas;
                    total_carboidrato_g += item.carboidratos_calculados;
                    total_gordura_g += item.gorduras_calculadas;
                });

                const refeicaoMapeada = {
                    id: refeicaoApi.id,
                    nome: refeicaoApi.nome || '',
                    horario: refeicaoApi.horario_sugerido ? refeicaoApi.horario_sugerido.substring(0, 5) : '',
                    ordem: refeicaoApi.ordem || 0,
                    notas: refeicaoApi.observacoes || '',
                    itens: itensMap,
                    meta_calorias: Math.round(formularioPlano.value.calorias_meta * percDistribuicao),
                    meta_proteinas_g: Math.round(formularioPlano.value.proteina_g * percDistribuicao),
                    meta_carboidrato_g: Math.round(formularioPlano.value.carboidrato_g * percDistribuicao),
                    meta_gordura_g: Math.round(formularioPlano.value.gordura_g * percDistribuicao),
                    total_calorias: Math.round(total_calorias * 10) / 10,
                    total_proteinas_g: Math.round(total_proteinas_g * 10) / 10,
                    total_carboidrato_g: Math.round(total_carboidrato_g * 10) / 10,
                    total_gordura_g: Math.round(total_gordura_g * 10) / 10
                };

                console.log(`  📌 Refeição "${refeicaoMapeada.nome}" mapeada: ${itensMap.length} itens, ${total_calorias.toFixed(2)} kcal`);
                return refeicaoMapeada;
            });

            console.log(`✅ ${formularioPlano.value.refeicoes.length} refeições com itens preenchidas com sucesso`);
        } else {
            console.warn('⚠️ Plano sem refeições. Criando refeições padrão baseado em refeicoes_dia:', formularioPlano.value.refeicoes_dia);
            // Se não tem refeições, criar baseado em refeicoes_dia
            const refeicoesDia = formularioPlano.value.refeicoes_dia || 5;
            const distribuirCal = (dias) => {
                const distribuicoes = {
                    3: [
                        { nome: 'Almoço', horario: '13:00', perc: 0.4 },
                        { nome: 'Lanches', horario: '10:00', perc: 0.3 },
                        { nome: 'Jantar', horario: '19:00', perc: 0.3 }
                    ],
                    4: [
                        { nome: 'Café da manhã', horario: '08:00', perc: 0.25 },
                        { nome: 'Almoço', horario: '13:00', perc: 0.35 },
                        { nome: 'Lanche tarde', horario: '16:00', perc: 0.15 },
                        { nome: 'Jantar', horario: '19:30', perc: 0.25 }
                    ],
                    5: [
                        { nome: 'Café da manhã', horario: '08:00', perc: 0.25 },
                        { nome: 'Lanche manhã', horario: '10:00', perc: 0.1 },
                        { nome: 'Almoço', horario: '13:00', perc: 0.35 },
                        { nome: 'Lanche tarde', horario: '16:00', perc: 0.1 },
                        { nome: 'Jantar', horario: '19:30', perc: 0.2 }
                    ],
                    6: [
                        { nome: 'Café da manhã', horario: '08:00', perc: 0.25 },
                        { nome: 'Lanche manhã', horario: '10:00', perc: 0.1 },
                        { nome: 'Almoço', horario: '13:00', perc: 0.3 },
                        { nome: 'Lanche tarde', horario: '16:00', perc: 0.1 },
                        { nome: 'Café da tarde', horario: '17:30', perc: 0.05 },
                        { nome: 'Jantar', horario: '19:30', perc: 0.2 }
                    ]
                };
                return distribuicoes[dias] || distribuicoes[5];
            };

            formularioPlano.value.refeicoes = distribuirCal(refeicoesDia).map((ref, idx) => ({
                nome: ref.nome,
                horario: ref.horario,
                ordem: idx + 1,
                notas: '',
                itens: [],
                meta_calorias: Math.round(formularioPlano.value.calorias_meta * ref.perc),
                meta_proteinas_g: Math.round(formularioPlano.value.proteina_g * ref.perc),
                meta_carboidrato_g: Math.round(formularioPlano.value.carboidrato_g * ref.perc),
                meta_gordura_g: Math.round(formularioPlano.value.gordura_g * ref.perc),
                total_calorias: 0,
                total_proteinas_g: 0,
                total_carboidrato_g: 0,
                total_gordura_g: 0
            }));
            console.log(`✅ ${formularioPlano.value.refeicoes.length} refeições padrão criadas`);
        }

        formularioPlanoCalorias_metaOriginal.value = formularioPlano.value.calorias_meta;
        objetivoPreSelecionadoCom.value = null;
        macrosSugeridosPor.value = null;

        console.log('✅ Plano carregado com sucesso para edição:', formularioPlano.value);
        console.log('📊 Estado das refeições após carregamento:', {
            quantidadeRefeicoes: formularioPlano.value.refeicoes.length,
            refeicoes: formularioPlano.value.refeicoes
        });
        console.log('✅ Medidas carregadas:', medidaMaisRecente.value);
        showDialogCriacaoPlano.value = true;
        console.log('🎯 Modal aberto e showDialogCriacaoPlano.value =', showDialogCriacaoPlano.value);
    } catch (error) {
        console.error('❌ Erro ao carregar plano para edição:', error);
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: error.message || 'Erro ao carregar plano para edição',
            life: 3000
        });
    } finally {
        loadingCriacaoPlano.value = false;
    }
};

const abrirCriacaoPlano = async () => {
    editandoPlanoId.value = null; // Modo criação

    // **REGRA 1**: Carregar medidas se não estiverem carregadas
    if (!medidas.value || medidas.value.length === 0) {
        loadingMedidas.value = true;
        try {
            const idPaciente = route.params.id;
            const response = await MedidaService.listarMedidasPaciente(idPaciente);

            if (response.data.success && response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
                medidas.value = response.data.data;
                medidaMaisRecente.value = medidas.value[0]; // Primeiro item = mais recente
            } else {
                medidaMaisRecente.value = null;
            }
        } catch (error) {
            console.error('❌ Erro ao carregar medidas para wizard:', error);
            medidaMaisRecente.value = null;
        } finally {
            loadingMedidas.value = false;
        }
    } else {
        // Medidas já carregadas, usar a mais recente
        medidaMaisRecente.value = medidas.value[0];
    }

    console.log('📋 Wizard de plano aberto - medida mais recente:', medidaMaisRecente.value);

    showDialogCriacaoPlano.value = true;
};

const deletarPlano = async (idPlano) => {
    if (!confirm('Tem certeza que deseja deletar este plano alimentar?')) {
        return;
    }

    try {
        const idPaciente = route.params.id;
        console.log('🗑️ Deletando plano:', idPlano);

        await PlanoAlimentarService.deletar(idPaciente, idPlano);

        toast.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Plano deletado com sucesso',
            life: 3000
        });

        await carregarPlanos();
    } catch (error) {
        console.error('❌ Erro ao deletar plano:', error);
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao deletar o plano',
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
        <!-- BEGIN: Profile Header -->
        <header class="bg-white border-b border-emerald-100 p-8">
            <div class="mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div class="flex items-center gap-6">
                    <!-- Avatar with Photo Upload -->
                    <div class="relative group">
                        <!-- Input File Hidden -->
                        <input ref="inputFotoRef" type="file" accept="image/*" class="hidden" @change="enviarFoto" />

                        <!-- Foto ou Avatar -->
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

                        <!-- Overlay com Ícone de Camera -->
                        <div class="absolute inset-0 rounded-2xl bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-all duration-300 cursor-pointer" @click="selecionarFoto">
                            <!-- Loading Spinner -->
                            <div v-if="loadingUploadFoto" class="flex flex-col items-center justify-center">
                                <i class="pi pi-spin pi-spinner text-white text-3xl"></i>
                                <p class="text-white text-xs mt-2 font-semibold">Enviando...</p>
                            </div>

                            <!-- Camera Icon (hidden no hover quando loading) -->
                            <div v-else class="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center gap-1">
                                <i class="pi pi-camera text-white text-2xl"></i>
                                <p class="text-white text-xs font-semibold">Alterar foto</p>
                            </div>
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
                <!-- <div class="flex gap-3">
                    <Button label="Nova medida" icon="pi pi-plus" severity="secondary" @click="novaMedida" class="whitespace-nowrap" />
                    <Button label="Novo plano" icon="pi pi-plus" severity="success" @click="novoPlano" class="whitespace-nowrap" />
                </div> -->
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
                    Planos Alimentares
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
            <AbaResumo v-if="activeTab === 'resumo'" @ir-para-anamnese="activeTab = 'anamnese'" @ir-para-medidas="activeTab = 'medidas'" @ir-para-planos="activeTab = 'planos'" />

            <AbaAnamnese
                v-else-if="activeTab === 'anamnese'"
                :loadingAnamnese="loadingAnamnese"
                :erroAnamnese="erroAnamnese"
                :anamnese="anamnese"
                @criar-anamnese="abrirCriacaoAnamnese"
                @editar-anamnese="abrirEdicaoAnamnese"
                @enviar-formulario="() => toast.add({ severity: 'info', summary: 'Email sera enviado', detail: 'Funcionalidade em desenvolvimento' })"
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
                @enviar-plano="() => toast.add({ severity: 'info', summary: 'Funcionalidade', detail: 'Enviar plano alimentar - a implementar' })"
                @arquivar-plano="() => toast.add({ severity: 'info', summary: 'Funcionalidade', detail: 'Arquivar plano - a implementar' })"
            />

            <AbaAdesao v-else-if="activeTab === 'adesao'" />

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
            :imcComClassificacao="imcComClassificacao"
            :massaMagraCalculada="massaMagraCalculada"
            :rcqComClassificacao="rcqComClassificacao"
            :getCalculado="getCalculado"
            :pressaoArterialCombinada="pressaoArterialCombinada"
            :loading="loadingCriacaoMedida"
            :calcularTMBParam="calcularTMBParam"
            @update:visible="showDialogCriacaoMedida = $event"
            @update:formularioMedida="formularioMedida = $event"
            @update:pressaoArterialCombinada="pressaoArterialCombinada = $event"
            @fechar="fecharCriacaoMedida"
            @salvar-medida="salvarMedida"
        />
        <!-- END: Modal Adicionar Medida -->

        <!-- BEGIN: Modal Editar Paciente (Componente Extraído) -->
        <ModalEdicaoPaciente
            :visible="showDialogEdicao"
            :formEdicaoPaciente="formEdicaoPaciente"
            :formErrors="formErrors"
            :loading="loadingAtualizacao"
            @update:visible="showDialogEdicao = $event"
            @update:formEdicaoPaciente="formEdicaoPaciente = $event"
            @update:formErrors="formErrors = $event"
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
            @update:anamneseEditando="anamneseEditando = $event"
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
            :linkPlano="linkPlano"
            @update:visible="showDialogCriacaoPlano = $event"
            @fechar="showDialogCriacaoPlano = false"
            @concluido="carregarPlanos"
        />
        <!-- END: Modal Criar Plano Alimentar -->
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
