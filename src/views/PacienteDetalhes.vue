<script setup>
import AnamneseService from '@/service/AnamneseService';
import MedidaService from '@/service/MedidaService';
import PacienteService from '@/service/PacienteService';
import { DatePicker } from 'primevue';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputMask from 'primevue/inputmask';
import InputNumber from 'primevue/inputnumber';
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

// Estados das medidas
const medidas = ref([]);
const loadingMedidas = ref(false);
const erroMedidas = ref(null);
const medidasCarregada = ref(false);
const medidaSelecionada = ref(null);

// Estados para adição de medidas
const showDialogCriacaoMedida = ref(false);
const loadingCriacaoMedida = ref(false);
const formularioMedida = ref({
    data_avaliacao: null,
    peso: null,
    altura: null,
    imc: null,
    perc_gordura_corporal: null,
    perc_massa_magra: null,
    idade_metabolica: null,
    circunferencia_cintura: null,
    circunferencia_quadril: null,
    relacao_cintura_quadril: null,
    circunferencia_abdominal: null,
    circunferencia_braco: null,
    circunferencia_coxa_direita: null,
    circunferencia_coxa_esquerda: null,
    circunferencia_panturrilha: null,
    circunferencia_torax: null,
    dobra_subescapular: null,
    dobra_tricipital: null,
    dobra_bicipital: null,
    dobra_suprailíaca: null,
    dobra_abdominal: null,
    dobra_coxal: null,
    dobra_peitoral: null,
    pressao_arterial_sistolica: null,
    pressao_arterial_diastolica: null,
    frequencia_cardiaca: null,
    tmb: null,
    gasto_energetico_total: null,
    nivel_atividade: 'leve',
    observacoes: ''
});

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
    // Criar uma cópia profunda da anamnese para edição
    if (anamnese.value) {
        anamneseEditando.value = JSON.parse(JSON.stringify(anamnese.value));
        modoEdicao.value = true;
        showDialogEdicaoAnamnese.value = true;
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

// Funções de Medidas
const carregarMedidas = async () => {
    loadingMedidas.value = true;
    erroMedidas.value = null;

    try {
        const idPaciente = route.params.id;
        console.log('📊 Carregando medidas do paciente:', idPaciente);

        const response = await MedidaService.listarMedidasPaciente(idPaciente);
        console.log('✅ Resposta de medidas:', response.data);

        if (response.data.success) {
            if (response.data.data && Array.isArray(response.data.data)) {
                medidas.value = response.data.data.sort((a, b) => new Date(b.data_avaliacao) - new Date(a.data_avaliacao));
                if (medidas.value.length > 0) {
                    medidaSelecionada.value = medidas.value[0];
                }
                erroMedidas.value = null;
            } else {
                medidas.value = [];
                erroMedidas.value = null;
            }
        } else {
            erroMedidas.value = response.data.message || 'Erro ao listar medidas';
            medidas.value = [];
        }
    } catch (error) {
        console.error('❌ Erro ao carregar medidas:', error);
        erroMedidas.value = 'Erro ao carregar medidas. Tente novamente.';
        medidas.value = [];
    } finally {
        loadingMedidas.value = false;
        medidasCarregada.value = true;
    }
};

watch(
    () => activeTab.value,
    (novaTab) => {
        if (novaTab === 'medidas' && !medidasCarregada.value) {
            carregarMedidas();
        }
    }
);

const abrirCriacaoMedida = () => {
    formularioMedida.value = {
        data_avaliacao: new Date(),
        peso: null,
        altura: null,
        imc: null,
        perc_gordura_corporal: null,
        perc_massa_magra: null,
        idade_metabolica: null,
        circunferencia_cintura: null,
        circunferencia_quadril: null,
        relacao_cintura_quadril: null,
        circunferencia_abdominal: null,
        circunferencia_braco: null,
        circunferencia_coxa_direita: null,
        circunferencia_coxa_esquerda: null,
        circunferencia_panturrilha: null,
        circunferencia_torax: null,
        dobra_subescapular: null,
        dobra_tricipital: null,
        dobra_bicipital: null,
        dobra_suprailíaca: null,
        dobra_abdominal: null,
        dobra_coxal: null,
        dobra_peitoral: null,
        pressao_arterial_sistolica: null,
        pressao_arterial_diastolica: null,
        frequencia_cardiaca: null,
        tmb: null,
        gasto_energetico_total: null,
        nivel_atividade: 'leve',
        observacoes: ''
    };
    showDialogCriacaoMedida.value = true;
};

const fecharCriacaoMedida = () => {
    showDialogCriacaoMedida.value = false;
    formularioMedida.value = {};
};

const salvarMedida = async () => {
    loadingCriacaoMedida.value = true;

    try {
        const idPaciente = route.params.id;
        console.log('📝 Salvando medida para paciente:', idPaciente);

        // Converter a data para o formato YYYY-MM-DD
        let dataFormatada = null;
        if (formularioMedida.value.data_avaliacao) {
            const date = new Date(formularioMedida.value.data_avaliacao);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            dataFormatada = `${year}-${month}-${day}`;
        }

        // Preparar dados para enviar (apenas campos preenchidos e com valores)
        const dadosMedida = {};

        if (dataFormatada) dadosMedida.data_avaliacao = dataFormatada;
        if (formularioMedida.value.peso !== null && formularioMedida.value.peso !== '') {
            dadosMedida.peso = formularioMedida.value.peso.toString();
        }
        if (formularioMedida.value.altura !== null && formularioMedida.value.altura !== '') {
            dadosMedida.altura = formularioMedida.value.altura.toString();
        }
        if (formularioMedida.value.imc !== null && formularioMedida.value.imc !== '') {
            dadosMedida.imc = formularioMedida.value.imc.toString();
        }
        if (formularioMedida.value.perc_gordura_corporal !== null && formularioMedida.value.perc_gordura_corporal !== '') {
            dadosMedida.perc_gordura_corporal = formularioMedida.value.perc_gordura_corporal.toString();
        }
        if (formularioMedida.value.perc_massa_magra !== null && formularioMedida.value.perc_massa_magra !== '') {
            dadosMedida.perc_massa_magra = formularioMedida.value.perc_massa_magra.toString();
        }
        if (formularioMedida.value.idade_metabolica !== null && formularioMedida.value.idade_metabolica !== '') {
            dadosMedida.idade_metabolica = formularioMedida.value.idade_metabolica;
        }
        if (formularioMedida.value.circunferencia_cintura !== null && formularioMedida.value.circunferencia_cintura !== '') {
            dadosMedida.circunferencia_cintura = formularioMedida.value.circunferencia_cintura.toString();
        }
        if (formularioMedida.value.circunferencia_quadril !== null && formularioMedida.value.circunferencia_quadril !== '') {
            dadosMedida.circunferencia_quadril = formularioMedida.value.circunferencia_quadril.toString();
        }
        if (formularioMedida.value.relacao_cintura_quadril !== null && formularioMedida.value.relacao_cintura_quadril !== '') {
            dadosMedida.relacao_cintura_quadril = formularioMedida.value.relacao_cintura_quadril.toString();
        }
        if (formularioMedida.value.circunferencia_abdominal !== null && formularioMedida.value.circunferencia_abdominal !== '') {
            dadosMedida.circunferencia_abdominal = formularioMedida.value.circunferencia_abdominal.toString();
        }
        if (formularioMedida.value.circunferencia_braco !== null && formularioMedida.value.circunferencia_braco !== '') {
            dadosMedida.circunferencia_braco = formularioMedida.value.circunferencia_braco.toString();
        }
        if (formularioMedida.value.circunferencia_coxa_direita !== null && formularioMedida.value.circunferencia_coxa_direita !== '') {
            dadosMedida.circunferencia_coxa_direita = formularioMedida.value.circunferencia_coxa_direita.toString();
        }
        if (formularioMedida.value.circunferencia_coxa_esquerda !== null && formularioMedida.value.circunferencia_coxa_esquerda !== '') {
            dadosMedida.circunferencia_coxa_esquerda = formularioMedida.value.circunferencia_coxa_esquerda.toString();
        }
        if (formularioMedida.value.circunferencia_panturrilha !== null && formularioMedida.value.circunferencia_panturrilha !== '') {
            dadosMedida.circunferencia_panturrilha = formularioMedida.value.circunferencia_panturrilha.toString();
        }
        if (formularioMedida.value.circunferencia_torax !== null && formularioMedida.value.circunferencia_torax !== '') {
            dadosMedida.circunferencia_torax = formularioMedida.value.circunferencia_torax.toString();
        }
        if (formularioMedida.value.dobra_subescapular !== null && formularioMedida.value.dobra_subescapular !== '') {
            dadosMedida.dobra_subescapular = formularioMedida.value.dobra_subescapular.toString();
        }
        if (formularioMedida.value.dobra_tricipital !== null && formularioMedida.value.dobra_tricipital !== '') {
            dadosMedida.dobra_tricipital = formularioMedida.value.dobra_tricipital.toString();
        }
        if (formularioMedida.value.dobra_bicipital !== null && formularioMedida.value.dobra_bicipital !== '') {
            dadosMedida.dobra_bicipital = formularioMedida.value.dobra_bicipital.toString();
        }
        if (formularioMedida.value.dobra_suprailíaca !== null && formularioMedida.value.dobra_suprailíaca !== '') {
            dadosMedida.dobra_suprailíaca = formularioMedida.value.dobra_suprailíaca.toString();
        }
        if (formularioMedida.value.dobra_abdominal !== null && formularioMedida.value.dobra_abdominal !== '') {
            dadosMedida.dobra_abdominal = formularioMedida.value.dobra_abdominal.toString();
        }
        if (formularioMedida.value.dobra_coxal !== null && formularioMedida.value.dobra_coxal !== '') {
            dadosMedida.dobra_coxal = formularioMedida.value.dobra_coxal.toString();
        }
        if (formularioMedida.value.dobra_peitoral !== null && formularioMedida.value.dobra_peitoral !== '') {
            dadosMedida.dobra_peitoral = formularioMedida.value.dobra_peitoral.toString();
        }
        if (formularioMedida.value.pressao_arterial_sistolica !== null && formularioMedida.value.pressao_arterial_sistolica !== '') {
            dadosMedida.pressao_arterial_sistolica = formularioMedida.value.pressao_arterial_sistolica;
        }
        if (formularioMedida.value.pressao_arterial_diastolica !== null && formularioMedida.value.pressao_arterial_diastolica !== '') {
            dadosMedida.pressao_arterial_diastolica = formularioMedida.value.pressao_arterial_diastolica;
        }
        if (formularioMedida.value.frequencia_cardiaca !== null && formularioMedida.value.frequencia_cardiaca !== '') {
            dadosMedida.frequencia_cardiaca = formularioMedida.value.frequencia_cardiaca;
        }
        if (formularioMedida.value.tmb !== null && formularioMedida.value.tmb !== '') {
            dadosMedida.tmb = formularioMedida.value.tmb.toString();
        }
        if (formularioMedida.value.gasto_energetico_total !== null && formularioMedida.value.gasto_energetico_total !== '') {
            dadosMedida.gasto_energetico_total = formularioMedida.value.gasto_energetico_total.toString();
        }
        if (formularioMedida.value.nivel_atividade) {
            dadosMedida.nivel_atividade = formularioMedida.value.nivel_atividade;
        }
        if (formularioMedida.value.observacoes) {
            dadosMedida.observacoes = formularioMedida.value.observacoes;
        }

        const response = await MedidaService.criarMedida(idPaciente, dadosMedida);

        console.log('✅ Medida criada:', response.data);

        if (response.data.success) {
            fecharCriacaoMedida();
            await carregarMedidas();

            toast.add({
                severity: 'success',
                summary: 'Sucesso!',
                detail: 'Medida criada com sucesso',
                life: 3000
            });
        } else {
            throw new Error(response.data.message || 'Erro ao criar medida');
        }
    } catch (error) {
        console.error('❌ Erro ao salvar medida:', error);
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: error.response?.data?.message || 'Erro ao salvar a medida',
            life: 3000
        });
    } finally {
        loadingCriacaoMedida.value = false;
    }
};

const deletarMedida = async (idMedida) => {
    if (!confirm('Tem certeza que deseja deletar esta medida?')) {
        return;
    }

    try {
        const idPaciente = route.params.id;
        await MedidaService.deletarMedida(idPaciente, idMedida);

        toast.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Medida deletada com sucesso',
            life: 3000
        });

        await carregarMedidas();
    } catch (error) {
        console.error('❌ Erro ao deletar medida:', error);
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao deletar a medida',
            life: 3000
        });
    }
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

            <!-- Tab: Anamnese -->
            <div v-else-if="activeTab === 'anamnese'" class="mx-auto">
                <!-- Loading State -->
                <div v-if="loadingAnamnese" class="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-emerald-50">
                    <i class="pi pi-spin pi-spinner text-5xl text-emerald-600 mb-4"></i>
                    <p class="text-gray-600 font-medium">Carregando anamnese...</p>
                </div>

                <!-- Anamnese Not Found / Error State -->
                <div v-else-if="erroAnamnese && !anamnese" class="bg-white rounded-2xl shadow-sm border border-emerald-50 p-8">
                    <div class="flex items-start gap-4 mb-6">
                        <div class="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <i class="pi pi-inbox text-2xl text-amber-500"></i>
                        </div>
                        <div class="flex-1">
                            <h3 class="text-lg font-bold text-gray-900">Formulário de Anamnese Não Preenchido</h3>
                            <p class="text-sm text-gray-500 mt-1">O paciente ainda não preencheu o formulário de anamnese</p>
                        </div>
                    </div>

                    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <Button label="Criar Anamnese" icon="pi pi-plus" @click="abrirCriacaoAnamnese" class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" size="lg" />
                        <Button label="Enviar Formulário" icon="pi pi-envelope" severity="secondary" text @click="() => toast.add({ severity: 'info', summary: 'Email será enviado', detail: 'Funcionalidade em desenvolvimento' })" size="small" />
                    </div>
                </div>

                <!-- Anamnese Found - Display Data -->
                <div v-else-if="anamnese" class="space-y-6">
                    <!-- Header com botão Editar -->
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-2xl font-bold text-slate-800">Dados da Anamnese</h2>
                        <Button label="Editar Anamnese" icon="pi pi-pencil" @click="abrirEdicaoAnamnese" class="bg-emerald-600 hover:bg-emerald-700" />
                    </div>

                    <!-- Bloco 1: Identificação -->
                    <div class="bg-white rounded-2xl shadow-sm border border-emerald-50 p-8">
                        <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                            <i class="pi pi-user text-emerald-500 text-lg"></i>
                            Identificação
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="p-4 bg-slate-50 rounded-lg">
                                <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Telefone</p>
                                <p class="text-slate-700 font-medium">{{ anamnese.telefone || 'Não informado' }}</p>
                            </div>
                            <div class="p-4 bg-slate-50 rounded-lg">
                                <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">WhatsApp</p>
                                <p class="text-slate-700 font-medium">{{ anamnese.whatsapp || 'Não informado' }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Bloco 2: Corpo Atual -->
                    <div class="bg-white rounded-2xl shadow-sm border border-emerald-50 p-8">
                        <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                            <i class="pi pi-chart-bar text-emerald-500 text-lg"></i>
                            Corpo Atual
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="p-4 bg-slate-50 rounded-lg">
                                <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Peso Atual</p>
                                <p class="text-2xl font-bold text-emerald-600">{{ anamnese.peso_atual }} <span class="text-sm text-gray-500">kg</span></p>
                            </div>
                            <div class="p-4 bg-slate-50 rounded-lg">
                                <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Altura</p>
                                <p class="text-2xl font-bold text-emerald-600">{{ anamnese.altura }} <span class="text-sm text-gray-500">cm</span></p>
                            </div>
                            <div class="p-4 bg-slate-50 rounded-lg">
                                <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Tempo Nesse Peso</p>
                                <p class="text-slate-700 font-medium">{{ AnamneseService.formatarValor('tempo_nesse_peso', anamnese.tempo_nesse_peso) }}</p>
                            </div>
                            <div class="p-4 bg-slate-50 rounded-lg">
                                <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Acompanhamento Anterior</p>
                                <Tag :value="anamnese.fez_acompanhamento_antes ? 'Sim' : 'Não'" :severity="anamnese.fez_acompanhamento_antes ? 'success' : 'secondary'" />
                            </div>
                            <div v-if="anamnese.qual_acompanhamento" class="p-4 bg-slate-50 rounded-lg md:col-span-2">
                                <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Qual Acompanhamento</p>
                                <p class="text-slate-700">{{ anamnese.qual_acompanhamento }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Bloco 3: Objetivo -->
                    <div class="bg-white rounded-2xl shadow-sm border border-emerald-50 p-8">
                        <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                            <i class="pi pi-flag text-emerald-500 text-lg"></i>
                            Objetivo
                        </h3>
                        <div class="space-y-6">
                            <div class="p-4 bg-slate-50 rounded-lg">
                                <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Objetivo Principal</p>
                                <p class="text-slate-700 font-medium">{{ AnamneseService.formatarValor('objetivo', anamnese.objetivo) }}</p>
                            </div>
                            <div class="p-4 bg-slate-50 rounded-lg">
                                <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Descrição do Objetivo</p>
                                <p class="text-slate-700">{{ anamnese.objetivo_descricao || 'Não informado' }}</p>
                            </div>
                            <div class="p-4 bg-slate-50 rounded-lg">
                                <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Maior Dificuldade com Alimentação</p>
                                <p class="text-slate-700">{{ anamnese.maior_dificuldade_alimentacao || 'Não informado' }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Bloco 4: Rotina -->
                    <div class="bg-white rounded-2xl shadow-sm border border-emerald-50 p-8">
                        <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                            <i class="pi pi-calendar text-emerald-500 text-lg"></i>
                            Cronograma / Rotina
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div class="p-4 bg-slate-50 rounded-lg">
                                <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Acorda</p>
                                <p class="text-lg font-bold text-emerald-600">{{ anamnese.horario_acorda }}</p>
                            </div>
                            <div class="p-4 bg-slate-50 rounded-lg">
                                <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Café da Manhã</p>
                                <p class="text-lg font-bold text-emerald-600">{{ anamnese.horario_cafe_manha }}</p>
                            </div>
                            <div class="p-4 bg-slate-50 rounded-lg">
                                <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Almoço</p>
                                <p class="text-lg font-bold text-emerald-600">{{ anamnese.horario_almoco }}</p>
                            </div>
                            <div class="p-4 bg-slate-50 rounded-lg">
                                <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Jantar</p>
                                <p class="text-lg font-bold text-emerald-600">{{ anamnese.horario_jantar }}</p>
                            </div>
                            <div class="p-4 bg-slate-50 rounded-lg">
                                <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Dorme</p>
                                <p class="text-lg font-bold text-emerald-600">{{ anamnese.horario_dorme }}</p>
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="p-4 bg-slate-50 rounded-lg">
                                <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Local de Trabalho</p>
                                <p class="text-slate-700 font-medium">{{ AnamneseService.formatarValor('trabalha_casa_ou_fora', anamnese.trabalha_casa_ou_fora) }}</p>
                            </div>
                            <div class="p-4 bg-slate-50 rounded-lg">
                                <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Disponibilidade para Cozinhar</p>
                                <p class="text-slate-700 font-medium">{{ AnamneseService.formatarValor('tempo_parar_cozinhar', anamnese.tempo_parar_cozinhar) }}</p>
                            </div>
                            <div class="p-4 bg-slate-50 rounded-lg">
                                <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Pratica Exercícios</p>
                                <Tag :value="anamnese.faz_exercicios ? 'Sim' : 'Não'" :severity="anamnese.faz_exercicios ? 'success' : 'secondary'" />
                            </div>
                            <div v-if="anamnese.faz_exercicios" class="p-4 bg-slate-50 rounded-lg">
                                <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Qual Exercício</p>
                                <p class="text-slate-700 font-medium">{{ anamnese.qual_exercicio }} ({{ anamnese.frequencia_exercicio_semana }}x/semana)</p>
                            </div>
                        </div>
                    </div>

                    <!-- Bloco 5: Alimentação -->
                    <div class="bg-white rounded-2xl shadow-sm border border-emerald-50 p-8">
                        <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                            <i class="pi pi-heart text-emerald-500 text-lg"></i>
                            Alimentação
                        </h3>
                        <div class="grid grid-cols-1 gap-6">
                            <div class="p-4 bg-slate-50 rounded-lg">
                                <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Alimentos que Ama</p>
                                <p class="text-slate-700">{{ anamnese.alimentos_que_ama || 'Não informado' }}</p>
                            </div>
                            <div class="p-4 bg-slate-50 rounded-lg">
                                <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Alimentos que Odeia</p>
                                <p class="text-slate-700">{{ anamnese.alimentos_que_odeia || 'Não informado' }}</p>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="p-4 bg-slate-50 rounded-lg">
                                    <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Restrição Alimentar</p>
                                    <p class="text-slate-700 font-medium">{{ AnamneseService.formatarValor('restricao_alimentar', anamnese.restricao_alimentar) }}</p>
                                    <div v-if="anamnese.restricao_alimentar && anamnese.restricao_alimentar !== 'nenhuma' && anamnese.restricao_descricao" class="mt-3 pt-3 border-t border-slate-200">
                                        <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Detalhes</p>
                                        <p class="text-slate-700 text-sm">{{ anamnese.restricao_descricao }}</p>
                                    </div>
                                </div>
                                <div class="p-4 bg-slate-50 rounded-lg">
                                    <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Copos de Água por Dia</p>
                                    <p class="text-lg font-bold text-emerald-600">{{ anamnese.copos_agua_por_dia }}</p>
                                </div>
                            </div>
                            <div class="p-4 bg-slate-50 rounded-lg">
                                <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Alergias Alimentares</p>
                                <p class="text-slate-700">{{ anamnese.alergias_alimentares || 'Nenhuma' }}</p>
                            </div>
                            <div class="p-4 bg-slate-50 rounded-lg">
                                <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Consumo de Álcool</p>
                                <p class="text-slate-700 font-medium">{{ AnamneseService.formatarValor('consumo_alcool', anamnese.consumo_alcool) }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Bloco 6: Saúde -->
                    <div class="bg-white rounded-2xl shadow-sm border border-emerald-50 p-8 mb-6">
                        <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                            <i class="pi pi-heart text-red-500 text-lg"></i>
                            Saúde
                        </h3>
                        <div class="space-y-6">
                            <div class="p-4 bg-slate-50 rounded-lg">
                                <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Doenças Diagnosticadas</p>
                                <p class="text-slate-700">{{ anamnese.doencas_diagnosticadas || 'Nenhuma' }}</p>
                            </div>
                            <div class="p-4 bg-slate-50 rounded-lg">
                                <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Medicamentos</p>
                                <p class="text-slate-700">{{ anamnese.medicamentos || 'Nenhum' }}</p>
                            </div>
                            <div class="p-4 bg-slate-50 rounded-lg">
                                <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Histórico Familiar</p>
                                <p class="text-slate-700">{{ anamnese.historico_familiar || 'Nenhum' }}</p>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="p-4 bg-slate-50 rounded-lg">
                                    <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Qualidade do Sono</p>
                                    <p class="text-slate-700 font-medium">{{ AnamneseService.formatarValor('qualidade_sono', anamnese.qualidade_sono) }}</p>
                                </div>
                                <div class="p-4 bg-slate-50 rounded-lg">
                                    <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Nível de Estresse</p>
                                    <p class="text-lg font-bold text-emerald-600">{{ anamnese.nivel_estresse }} / 5</p>
                                </div>
                            </div>
                            <div class="p-4 bg-slate-50 rounded-lg">
                                <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Observações Adicionais</p>
                                <p class="text-slate-700">{{ anamnese.observacoes_livres || 'Nenhuma' }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tab: Medidas -->
            <div v-else-if="activeTab === 'medidas'" class="mx-auto">
                <!-- Loading State -->
                <div v-if="loadingMedidas" class="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-emerald-50">
                    <i class="pi pi-spin pi-spinner text-5xl text-emerald-600 mb-4"></i>
                    <p class="text-gray-600 font-medium">Carregando medidas...</p>
                </div>

                <!-- Medidas Not Found / Empty State -->
                <div v-else-if="!loadingMedidas && medidas.length === 0" class="bg-white rounded-2xl shadow-sm border border-emerald-50 p-8 mx-auto">
                    <div class="text-center space-y-6">
                        <div class="flex justify-center">
                            <div class="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                                <i class="pi pi-chart-bar text-5xl text-blue-500"></i>
                            </div>
                        </div>
                        <div>
                            <h3 class="text-2xl font-bold text-gray-900 mb-2">Nenhuma Medida Registrada</h3>
                            <p class="text-gray-500 text-base leading-relaxed">
                                Este paciente ainda não possui medidas corporais registradas. <br />
                                Clique no botão abaixo para registrar a primeira medida e começar a monitorar a evolução.
                            </p>
                        </div>
                        <Button label="Registrar Primeira Medida" icon="pi pi-plus" @click="abrirCriacaoMedida" class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold w-full sm:w-auto justify-center" size="large" />
                    </div>
                </div>

                <!-- Medidas Found - Display Data -->
                <div v-else-if="!loadingMedidas && medidas.length > 0" class="space-y-6">
                    <!-- Header com botão Adicionar -->
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-2xl font-bold text-slate-800">Dados das Medidas</h2>
                        <Button label="Adicionar Medida" icon="pi pi-plus" @click="abrirCriacaoMedida" class="bg-emerald-600 hover:bg-emerald-700" />
                    </div>

                    <!-- Quick Stats - Cards with Latest Measurements -->
                    <div v-if="medidaSelecionada" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <!-- Weight Card -->
                        <div class="bg-white p-6 rounded-2xl shadow-sm border border-emerald-50 hover:shadow-md transition-shadow">
                            <p class="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">PESO ATUAL</p>
                            <div class="flex items-end justify-between">
                                <div>
                                    <span class="text-4xl font-bold text-emerald-600">{{ medidaSelecionada.peso }}</span>
                                    <span class="text-lg text-slate-400 ml-1 font-medium">kg</span>
                                </div>
                                <div v-if="medidas[1]" class="text-right">
                                    <div class="flex items-center" :class="medidaSelecionada.peso < medidas[1].peso ? 'text-green-600' : 'text-red-600'">
                                        <span class="material-symbols-outlined text-base">{{ medidaSelecionada.peso < medidas[1].peso ? 'arrow_downward' : 'arrow_upward' }}</span>
                                        <span class="text-xs font-bold">{{ Math.abs((medidaSelecionada.peso - medidas[1].peso).toFixed(2)) }} kg</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- BMI Card -->
                        <div class="bg-white p-6 rounded-2xl shadow-sm border border-blue-50 hover:shadow-md transition-shadow">
                            <p class="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">IMC</p>
                            <div class="flex items-end justify-between">
                                <div>
                                    <span class="text-4xl font-bold text-blue-600">{{ medidaSelecionada.imc || '-' }}</span>
                                </div>
                                <span class="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">{{ medidaSelecionada.imc >= 30 ? 'ACIMA' : medidaSelecionada.imc >= 25 ? 'SOBRE' : 'NORMAL' }}</span>
                            </div>
                        </div>

                        <!-- Fat % Card -->
                        <div class="bg-white p-6 rounded-2xl shadow-sm border border-orange-50 hover:shadow-md transition-shadow">
                            <p class="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">% GORDURA</p>
                            <div class="flex items-end justify-between">
                                <div>
                                    <span class="text-4xl font-bold text-orange-600">{{ medidaSelecionada.perc_gordura_corporal || '-' }}</span>
                                    <span class="text-lg text-slate-400 ml-1 font-medium">%</span>
                                </div>
                            </div>
                        </div>

                        <!-- Lean Mass Card -->
                        <div class="bg-white p-6 rounded-2xl shadow-sm border border-purple-50 hover:shadow-md transition-shadow">
                            <p class="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">% MASSA MAGRA</p>
                            <div class="flex items-end justify-between">
                                <div>
                                    <span class="text-4xl font-bold text-purple-600">{{ medidaSelecionada.perc_massa_magra || '-' }}</span>
                                    <span class="text-lg text-slate-400 ml-1 font-medium">%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Historical Table -->
                    <div class="bg-white rounded-2xl shadow-sm border border-emerald-50 overflow-hidden">
                        <div class="px-8 py-6 border-b border-emerald-100">
                            <h4 class="font-bold text-lg text-slate-800">Histórico de Avaliações</h4>
                        </div>
                        <table class="w-full text-left text-sm">
                            <thead>
                                <tr class="bg-slate-50 text-slate-400 font-bold uppercase tracking-widest text-[10px] border-b border-emerald-100">
                                    <th class="px-8 py-4">Data</th>
                                    <th class="px-8 py-4">Peso</th>
                                    <th class="px-8 py-4">Altura</th>
                                    <th class="px-8 py-4">IMC</th>
                                    <th class="px-8 py-4">% Gordura</th>
                                    <th class="px-8 py-4">Cintura</th>
                                    <th class="px-8 py-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                <tr v-for="medida in medidas" :key="medida.id" class="hover:bg-slate-50 transition-colors">
                                    <td class="px-8 py-4 font-semibold text-slate-800">{{ MedidaService.formatarData(medida.data_avaliacao) }}</td>
                                    <td class="px-8 py-4 text-slate-600">{{ medida.peso }} kg</td>
                                    <td class="px-8 py-4 text-slate-600">{{ medida.altura }} cm</td>
                                    <td class="px-8 py-4 font-bold text-emerald-600">{{ medida.imc }}</td>
                                    <td class="px-8 py-4 text-slate-600">{{ medida.perc_gordura_corporal || '-' }}%</td>
                                    <td class="px-8 py-4 text-slate-600">{{ medida.circunferencia_cintura || '-' }} cm</td>
                                    <td class="px-8 py-4 text-right">
                                        <div class="flex items-center justify-end gap-2">
                                            <Button icon="pi pi-eye" text severity="info" size="small" @click="medidaSelecionada = medida" class="hover:text-emerald-600" />
                                            <Button icon="pi pi-trash" text severity="danger" size="small" @click="deletarMedida(medida.id)" class="hover:text-red-600" />
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Detailed Evaluation - if medida is selected -->
                    <div v-if="medidaSelecionada" class="space-y-6">
                        <div class="flex items-center gap-3 mb-6">
                            <h4 class="text-xl font-bold">Avaliação — {{ MedidaService.formatarData(medidaSelecionada.data_avaliacao) }}</h4>
                            <span v-if="medidaSelecionada.id === medidas[0].id" class="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">MAIS RECENTE</span>
                        </div>

                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <!-- Section 1: Antropométricos -->
                            <div class="bg-white p-8 rounded-2xl shadow-sm border border-emerald-50">
                                <h5 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Dados Antropométricos</h5>
                                <div class="grid grid-cols-2 gap-y-6 gap-x-4">
                                    <div class="space-y-1">
                                        <p class="text-[10px] font-bold text-slate-400 uppercase">PESO</p>
                                        <p class="text-lg font-bold text-slate-800">{{ medidaSelecionada.peso }} kg</p>
                                    </div>
                                    <div class="space-y-1">
                                        <p class="text-[10px] font-bold text-slate-400 uppercase">ALTURA</p>
                                        <p class="text-lg font-bold text-slate-800">{{ medidaSelecionada.altura }} cm</p>
                                    </div>
                                    <div class="space-y-1">
                                        <p class="text-[10px] font-bold text-slate-400 uppercase">IMC</p>
                                        <p class="text-lg font-bold text-emerald-600">{{ medidaSelecionada.imc }}</p>
                                    </div>
                                    <div class="space-y-1">
                                        <p class="text-[10px] font-bold text-slate-400 uppercase">% GORDURA</p>
                                        <p class="text-lg font-bold text-slate-800">{{ medidaSelecionada.perc_gordura_corporal || '-' }}%</p>
                                    </div>
                                    <div class="space-y-1">
                                        <p class="text-[10px] font-bold text-slate-400 uppercase">% MASSA MAGRA</p>
                                        <p class="text-lg font-bold text-slate-800">{{ medidaSelecionada.perc_massa_magra || '-' }}%</p>
                                    </div>
                                    <div class="space-y-1">
                                        <p class="text-[10px] font-bold text-slate-400 uppercase">IDADE METABÓLICA</p>
                                        <p class="text-lg font-bold text-slate-800">{{ medidaSelecionada.idade_metabolica || '-' }} anos</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Section 2: Circunferências -->
                            <div class="bg-white p-8 rounded-2xl shadow-sm border border-emerald-50">
                                <h5 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Circunferências (cm)</h5>
                                <div class="grid grid-cols-3 gap-y-6 gap-x-4">
                                    <div class="space-y-1">
                                        <p class="text-[10px] font-bold text-slate-400 uppercase">CINTURA</p>
                                        <p class="text-lg font-bold text-slate-800">{{ medidaSelecionada.circunferencia_cintura || '-' }}</p>
                                    </div>
                                    <div class="space-y-1">
                                        <p class="text-[10px] font-bold text-slate-400 uppercase">QUADRIL</p>
                                        <p class="text-lg font-bold text-slate-800">{{ medidaSelecionada.circunferencia_quadril || '-' }}</p>
                                    </div>
                                    <div class="space-y-1">
                                        <p class="text-[10px] font-bold text-slate-400 uppercase">ABDÔMEN</p>
                                        <p class="text-lg font-bold text-slate-800">{{ medidaSelecionada.circunferencia_abdominal || '-' }}</p>
                                    </div>
                                    <div class="space-y-1">
                                        <p class="text-[10px] font-bold text-slate-400 uppercase">RCQ</p>
                                        <p class="text-lg font-bold text-emerald-600">{{ medidaSelecionada.relacao_cintura_quadril || '-' }}</p>
                                    </div>
                                    <div class="space-y-1">
                                        <p class="text-[10px] font-bold text-slate-400 uppercase">BRAÇO</p>
                                        <p class="text-lg font-bold text-slate-800">{{ medidaSelecionada.circunferencia_braco || '-' }}</p>
                                    </div>
                                    <div class="space-y-1">
                                        <p class="text-[10px] font-bold text-slate-400 uppercase">TÓRAX</p>
                                        <p class="text-lg font-bold text-slate-800">{{ medidaSelecionada.circunferencia_torax || '-' }}</p>
                                    </div>
                                    <div class="space-y-1">
                                        <p class="text-[10px] font-bold text-slate-400 uppercase">COXA D.</p>
                                        <p class="text-lg font-bold text-slate-800">{{ medidaSelecionada.circunferencia_coxa_direita || '-' }}</p>
                                    </div>
                                    <div class="space-y-1">
                                        <p class="text-[10px] font-bold text-slate-400 uppercase">COXA E.</p>
                                        <p class="text-lg font-bold text-slate-800">{{ medidaSelecionada.circunferencia_coxa_esquerda || '-' }}</p>
                                    </div>
                                    <div class="space-y-1">
                                        <p class="text-[10px] font-bold text-slate-400 uppercase">PANTURRILHA</p>
                                        <p class="text-lg font-bold text-slate-800">{{ medidaSelecionada.circunferencia_panturrilha || '-' }}</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Section 3: Dobras Cutâneas -->
                            <div class="bg-white p-8 rounded-2xl shadow-sm border border-emerald-50">
                                <h5 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Dobras Cutâneas (mm)</h5>
                                <div class="grid grid-cols-4 gap-y-6 gap-x-4">
                                    <div class="space-y-1">
                                        <p class="text-[10px] font-bold text-slate-400 uppercase">SUBSCAP.</p>
                                        <p class="text-lg font-bold text-slate-800">{{ medidaSelecionada.dobra_subescapular || '-' }}</p>
                                    </div>
                                    <div class="space-y-1">
                                        <p class="text-[10px] font-bold text-slate-400 uppercase">TRÍCEPS</p>
                                        <p class="text-lg font-bold text-slate-800">{{ medidaSelecionada.dobra_tricipital || '-' }}</p>
                                    </div>
                                    <div class="space-y-1">
                                        <p class="text-[10px] font-bold text-slate-400 uppercase">BÍCEPS</p>
                                        <p class="text-lg font-bold text-slate-800">{{ medidaSelecionada.dobra_bicipital || '-' }}</p>
                                    </div>
                                    <div class="space-y-1">
                                        <p class="text-[10px] font-bold text-slate-400 uppercase">SUPRAIL.</p>
                                        <p class="text-lg font-bold text-slate-800">{{ medidaSelecionada.dobra_suprailíaca || '-' }}</p>
                                    </div>
                                    <div class="space-y-1">
                                        <p class="text-[10px] font-bold text-slate-400 uppercase">ABDÔM.</p>
                                        <p class="text-lg font-bold text-slate-800">{{ medidaSelecionada.dobra_abdominal || '-' }}</p>
                                    </div>
                                    <div class="space-y-1">
                                        <p class="text-[10px] font-bold text-slate-400 uppercase">COXAL</p>
                                        <p class="text-lg font-bold text-slate-800">{{ medidaSelecionada.dobra_coxal || '-' }}</p>
                                    </div>
                                    <div class="space-y-1">
                                        <p class="text-[10px] font-bold text-slate-400 uppercase">PEITORAL</p>
                                        <p class="text-lg font-bold text-slate-800">{{ medidaSelecionada.dobra_peitoral || '-' }}</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Section 4: Dados Complementares -->
                            <div class="bg-white p-8 rounded-2xl shadow-sm border border-emerald-50">
                                <h5 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Dados Complementares</h5>
                                <div class="space-y-6">
                                    <div class="grid grid-cols-2 gap-y-6 gap-x-4">
                                        <div class="space-y-1">
                                            <p class="text-[10px] font-bold text-slate-400 uppercase">PRESSÃO ART.</p>
                                            <p class="text-lg font-bold text-slate-800">{{ medidaSelecionada.pressao_arterial_sistolica || '-' }}/{{ medidaSelecionada.pressao_arterial_diastolica || '-' }} mmHg</p>
                                        </div>
                                        <div class="space-y-1">
                                            <p class="text-[10px] font-bold text-slate-400 uppercase">FREQ. CARDÍACA</p>
                                            <p class="text-lg font-bold text-slate-800">{{ medidaSelecionada.frequencia_cardiaca || '-' }} bpm</p>
                                        </div>
                                        <div class="space-y-1">
                                            <p class="text-[10px] font-bold text-slate-400 uppercase">TMB (BMR)</p>
                                            <p class="text-lg font-bold text-emerald-600">{{ medidaSelecionada.tmb || '-' }} kcal</p>
                                        </div>
                                        <div class="space-y-1">
                                            <p class="text-[10px] font-bold text-slate-400 uppercase">GET (TDEE)</p>
                                            <p class="text-lg font-bold text-emerald-600">{{ medidaSelecionada.gasto_energetico_total || '-' }} kcal</p>
                                        </div>
                                    </div>
                                    <div v-if="medidaSelecionada.nivel_atividade">
                                        <p class="text-[10px] font-bold text-slate-400 uppercase mb-3">NÍVEL DE ATIVIDADE</p>
                                        <span class="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">{{ MedidaService.formatarValor('nivel_atividade', medidaSelecionada.nivel_atividade) }}</span>
                                    </div>
                                    <div v-if="medidaSelecionada.observacoes" class="bg-slate-50 p-4 rounded-lg">
                                        <p class="text-[10px] font-bold text-slate-400 uppercase mb-2">OBSERVAÇÕES</p>
                                        <p class="text-sm text-slate-600 leading-relaxed">{{ medidaSelecionada.observacoes }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Other Tabs - Placeholder -->
            <div v-else class="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-emerald-50 p-12 text-center">
                <i class="pi pi-home text-4xl text-slate-300 mb-4"></i>
                <p class="text-slate-500 text-lg">Conteúdo da aba "{{ activeTab }}" em breve...</p>
            </div>
        </div>
        <!-- END: Content Area -->

        <!-- Dialog Criar Medida -->
        <Dialog v-model:visible="showDialogCriacaoMedida" header="Adicionar Medida" :modal="true" :style="{ width: '90vw', maxHeight: '90vh' }" :breakpoints="{ '1199px': '95vw', '575px': '100vw' }" @hide="fecharCriacaoMedida">
            <div v-if="true" class="space-y-6 max-h-[calc(90vh-250px)] overflow-y-auto pr-4">
                <!-- Data da Avaliação -->
                <section class="bg-white rounded-xl border-2 border-emerald-100 p-6">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-lg">📅</div>
                        <h3 class="text-lg font-bold text-gray-900">Data da Avaliação</h3>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Data</label>
                        <DatePicker v-model="formularioMedida.data_avaliacao" dateFormat="dd/mm/yy" placeholder="dd/mm/yyyy" :showIcon="true" class="w-full" />
                    </div>
                </section>

                <!-- Seção 1: Dados Antropométricos -->
                <section class="bg-white rounded-xl border-2 border-blue-100 p-6">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-lg">⚖️</div>
                        <h3 class="text-lg font-bold text-gray-900">Dados Antropométricos</h3>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Peso (kg)</label>
                            <InputNumber v-model="formularioMedida.peso" :maxFractionDigits="2" placeholder="00.00" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Altura (cm)</label>
                            <InputNumber v-model="formularioMedida.altura" :maxFractionDigits="2" placeholder="00.00" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">IMC</label>
                            <InputNumber v-model="formularioMedida.imc" :maxFractionDigits="2" placeholder="00.00" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">% Gordura Corporal</label>
                            <InputNumber v-model="formularioMedida.perc_gordura_corporal" :maxFractionDigits="2" placeholder="00.00" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">% Massa Magra</label>
                            <InputNumber v-model="formularioMedida.perc_massa_magra" :maxFractionDigits="2" placeholder="00.00" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Idade Metabólica (anos)</label>
                            <InputNumber v-model="formularioMedida.idade_metabolica" :maxFractionDigits="0" placeholder="00" />
                        </div>
                    </div>
                </section>

                <!-- Seção 2: Circunferências -->
                <section class="bg-white rounded-xl border-2 border-purple-100 p-6">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-lg">📏</div>
                        <h3 class="text-lg font-bold text-gray-900">Circunferências (cm)</h3>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Cintura</label>
                            <InputNumber v-model="formularioMedida.circunferencia_cintura" :maxFractionDigits="2" placeholder="00.00" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Quadril</label>
                            <InputNumber v-model="formularioMedida.circunferencia_quadril" :maxFractionDigits="2" placeholder="00.00" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">RCQ</label>
                            <InputNumber v-model="formularioMedida.relacao_cintura_quadril" :maxFractionDigits="2" placeholder="00.00" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Abdominal</label>
                            <InputNumber v-model="formularioMedida.circunferencia_abdominal" :maxFractionDigits="2" placeholder="00.00" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Braço</label>
                            <InputNumber v-model="formularioMedida.circunferencia_braco" :maxFractionDigits="2" placeholder="00.00" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Tórax</label>
                            <InputNumber v-model="formularioMedida.circunferencia_torax" :maxFractionDigits="2" placeholder="00.00" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Coxa Direita</label>
                            <InputNumber v-model="formularioMedida.circunferencia_coxa_direita" :maxFractionDigits="2" placeholder="00.00" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Coxa Esquerda</label>
                            <InputNumber v-model="formularioMedida.circunferencia_coxa_esquerda" :maxFractionDigits="2" placeholder="00.00" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Panturrilha</label>
                            <InputNumber v-model="formularioMedida.circunferencia_panturrilha" :maxFractionDigits="2" placeholder="00.00" />
                        </div>
                    </div>
                </section>

                <!-- Seção 3: Dobras Cutâneas -->
                <section class="bg-white rounded-xl border-2 border-orange-100 p-6">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-lg">📐</div>
                        <h3 class="text-lg font-bold text-gray-900">Dobras Cutâneas (mm)</h3>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Subscapular</label>
                            <InputNumber v-model="formularioMedida.dobra_subescapular" :maxFractionDigits="2" placeholder="00.00" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Tríceps</label>
                            <InputNumber v-model="formularioMedida.dobra_tricipital" :maxFractionDigits="2" placeholder="00.00" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Bíceps</label>
                            <InputNumber v-model="formularioMedida.dobra_bicipital" :maxFractionDigits="2" placeholder="00.00" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Suprailíaca</label>
                            <InputNumber v-model="formularioMedida.dobra_suprailíaca" :maxFractionDigits="2" placeholder="00.00" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Abdominal</label>
                            <InputNumber v-model="formularioMedida.dobra_abdominal" :maxFractionDigits="2" placeholder="00.00" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Coxal</label>
                            <InputNumber v-model="formularioMedida.dobra_coxal" :maxFractionDigits="2" placeholder="00.00" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Peitoral</label>
                            <InputNumber v-model="formularioMedida.dobra_peitoral" :maxFractionDigits="2" placeholder="00.00" />
                        </div>
                    </div>
                </section>

                <!-- Seção 4: Dados Complementares -->
                <section class="bg-white rounded-xl border-2 border-red-100 p-6">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-lg">❤️</div>
                        <h3 class="text-lg font-bold text-gray-900">Dados Complementares</h3>
                    </div>
                    <div class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Pressão Arterial (Sistólica)</label>
                                <InputNumber v-model="formularioMedida.pressao_arterial_sistolica" :maxFractionDigits="0" placeholder="120" />
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Pressão Arterial (Diastólica)</label>
                                <InputNumber v-model="formularioMedida.pressao_arterial_diastolica" :maxFractionDigits="0" placeholder="80" />
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Frequência Cardíaca (bpm)</label>
                                <InputNumber v-model="formularioMedida.frequencia_cardiaca" :maxFractionDigits="0" placeholder="72" />
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">TMB (kcal/dia)</label>
                                <InputNumber v-model="formularioMedida.tmb" :maxFractionDigits="2" placeholder="0000.00" />
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Gasto Energético Total (kcal)</label>
                                <InputNumber v-model="formularioMedida.gasto_energetico_total" :maxFractionDigits="2" placeholder="0000.00" />
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Nível de Atividade</label>
                            <div class="flex gap-2 flex-wrap">
                                <button
                                    v-for="nivel in ['sedentario', 'leve', 'moderado', 'intenso']"
                                    :key="nivel"
                                    @click="formularioMedida.nivel_atividade = nivel"
                                    :class="['px-4 py-2 rounded-full text-xs font-medium transition-all', formularioMedida.nivel_atividade === nivel ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200']"
                                >
                                    {{ MedidaService.formatarValor('nivel_atividade', nivel) }}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Observações</label>
                            <textarea
                                v-model="formularioMedida.observacoes"
                                placeholder="Adicione observações importantes"
                                rows="3"
                                class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                            ></textarea>
                        </div>
                    </div>
                </section>
            </div>

            <template #footer>
                <Button label="Cancelar" severity="secondary" @click="fecharCriacaoMedida" />
                <Button label="Adicionar Medida" severity="success" icon="pi pi-check" :loading="loadingCriacaoMedida" @click="salvarMedida" />
            </template>
        </Dialog>
        <!-- END: Dialog Criar Medida -->

        <Dialog v-model:visible="showDialogEdicao" header="Editar Paciente" :modal="true" :style="{ width: '60vw' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }" @hide="showDialogEdicao = false">
            <div class="space-y-6">
                <!-- Seção: Dados Pessoais -->
                <div>
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Dados pessoais</h3>

                    <!-- Nome Completo -->
                    <div class="mb-4">
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Nome completo</label>
                        <InputText v-model="formEdicaoPaciente.nome" type="text" placeholder="Ex.: João da Silva" class="w-full" autocomplete="off" :invalid="!!formErrors.nome" />
                        <small v-if="formErrors.nome" class="block text-red-500 text-xs font-semibold mt-1">{{ formErrors.nome }}</small>
                    </div>

                    <!-- Apelido e Data de Nascimento -->
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Apelido</label>
                            <InputText v-model="formEdicaoPaciente.apelido" type="text" placeholder="Como ele prefere ser chamado" class="w-full" autocomplete="off" />
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

        <!-- BEGIN: Dialog Editar Anamnese -->
        <Dialog
            v-model:visible="showDialogEdicaoAnamnese"
            :header="modoEdicao ? 'Editar Anamnese' : 'Criar Anamnese'"
            :modal="true"
            :style="{ width: '90vw', maxHeight: '90vh' }"
            :breakpoints="{ '1199px': '95vw', '575px': '100vw' }"
            @hide="fecharEdicaoAnamnese"
        >
            <div v-if="anamneseEditando" class="space-y-6 max-h-[calc(90vh-250px)] overflow-y-auto pr-4">
                <!-- Bloco 1: Identificação -->
                <section class="bg-white rounded-xl border-2 border-emerald-100 p-6">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-lg">👤</div>
                        <h3 class="text-lg font-bold text-gray-900">Identificação</h3>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Telefone</label>
                            <InputText v-model="anamneseEditando.telefone" type="tel" placeholder="(11) 99999-9999" class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">WhatsApp</label>
                            <InputText v-model="anamneseEditando.whatsapp" type="tel" placeholder="(11) 99999-9999" class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                    </div>
                </section>

                <!-- Bloco 2: Corpo Atual -->
                <section class="bg-white rounded-xl border-2 border-blue-100 p-6">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-lg">⚖️</div>
                        <h3 class="text-lg font-bold text-gray-900">Corpo Atual</h3>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Peso Atual (kg)</label>
                            <InputText
                                v-model.number="anamneseEditando.peso_atual"
                                type="number"
                                step="0.1"
                                placeholder="00.0"
                                class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Altura (cm)</label>
                            <InputText v-model.number="anamneseEditando.altura" type="number" step="0.1" placeholder="170" class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div class="md:col-span-2">
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Tempo Nesse Peso</label>
                            <div class="flex flex-wrap gap-2">
                                <button
                                    v-for="opcao in opcoesTempo"
                                    :key="opcao.value"
                                    @click="anamneseEditando.tempo_nesse_peso = opcao.value"
                                    :class="['px-4 py-2 rounded-full text-xs font-medium transition-all', anamneseEditando.tempo_nesse_peso === opcao.value ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200']"
                                >
                                    {{ opcao.label }}
                                </button>
                            </div>
                        </div>
                        <div class="flex items-center pt-2">
                            <input v-model="anamneseEditando.fez_acompanhamento_antes" type="checkbox" id="acompanhamento-edit" class="w-4 h-4 rounded border-gray-300 text-emerald-600 accent-emerald-600" />
                            <label for="acompanhamento-edit" class="ml-3 text-sm font-semibold text-gray-700">Fez acompanhamento anterior</label>
                        </div>
                        <div v-if="anamneseEditando.fez_acompanhamento_antes" class="md:col-span-2">
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Qual Acompanhamento?</label>
                            <InputText
                                v-model="anamneseEditando.qual_acompanhamento"
                                placeholder="Descreva o acompanhamento"
                                class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>
                </section>

                <!-- Bloco 3: Objetivo -->
                <section class="bg-white rounded-xl border-2 border-purple-100 p-6">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-lg">🎯</div>
                        <h3 class="text-lg font-bold text-gray-900">Objetivo</h3>
                    </div>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Objetivo Principal</label>
                            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                                <button
                                    v-for="opcao in opcoesObjetivo"
                                    :key="opcao.value"
                                    @click="anamneseEditando.objetivo = opcao.value"
                                    :class="[
                                        'p-4 rounded-xl border-2 transition-all text-center flex flex-col items-center gap-2',
                                        anamneseEditando.objetivo === opcao.value ? 'border-purple-500 bg-purple-50 shadow-md' : 'border-gray-200 bg-white hover:border-purple-300'
                                    ]"
                                >
                                    <div :class="['w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all', anamneseEditando.objetivo === opcao.value ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600']">
                                        {{ opcao.icon }}
                                    </div>
                                    <span class="text-xs font-semibold text-gray-900">{{ opcao.label }}</span>
                                </button>
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Descrição do Objetivo</label>
                            <textarea
                                v-model="anamneseEditando.objetivo_descricao"
                                placeholder="Descreva seu objetivo com detalhes"
                                rows="2"
                                class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                            ></textarea>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Maior Dificuldade com Alimentação</label>
                            <textarea
                                v-model="anamneseEditando.maior_dificuldade_alimentacao"
                                placeholder="Descreva sua maior dificuldade"
                                rows="2"
                                class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                            ></textarea>
                        </div>
                    </div>
                </section>

                <!-- Bloco 4: Rotina -->
                <section class="bg-white rounded-xl border-2 border-amber-100 p-6">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-lg">🕐</div>
                        <h3 class="text-lg font-bold text-gray-900">Rotina</h3>
                    </div>
                    <div class="space-y-4">
                        <div>
                            <p class="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Horários</p>
                            <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
                                <div>
                                    <label class="block text-xs text-gray-600 font-medium mb-1">Acorda</label>
                                    <InputText v-model="anamneseEditando.horario_acorda" type="time" class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                </div>
                                <div>
                                    <label class="block text-xs text-gray-600 font-medium mb-1">Café</label>
                                    <InputText v-model="anamneseEditando.horario_cafe_manha" type="time" class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                </div>
                                <div>
                                    <label class="block text-xs text-gray-600 font-medium mb-1">Almoço</label>
                                    <InputText v-model="anamneseEditando.horario_almoco" type="time" class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                </div>
                                <div>
                                    <label class="block text-xs text-gray-600 font-medium mb-1">Jantar</label>
                                    <InputText v-model="anamneseEditando.horario_jantar" type="time" class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                </div>
                                <div>
                                    <label class="block text-xs text-gray-600 font-medium mb-1">Dorme</label>
                                    <InputText v-model="anamneseEditando.horario_dorme" type="time" class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <p class="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Trabalho e Atividades</p>
                            <div class="space-y-3">
                                <div>
                                    <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Local de Trabalho</label>
                                    <div class="flex gap-2">
                                        <button
                                            v-for="opcao in opcoesTrabalhoCasaOuFora"
                                            :key="opcao.value"
                                            @click="anamneseEditando.trabalha_casa_ou_fora = opcao.value"
                                            :class="['flex-1 py-2 rounded-lg text-xs font-medium transition-all', anamneseEditando.trabalha_casa_ou_fora === opcao.value ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200']"
                                        >
                                            {{ opcao.label }}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Tempo para Cozinhar</label>
                                    <div class="flex gap-2">
                                        <button
                                            v-for="opcao in opcoesTempoCozinhar"
                                            :key="opcao.value"
                                            @click="anamneseEditando.tempo_parar_cozinhar = opcao.value"
                                            :class="['flex-1 py-2 rounded-lg text-xs font-medium transition-all', anamneseEditando.tempo_parar_cozinhar === opcao.value ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200']"
                                        >
                                            {{ opcao.label }}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="pt-2">
                            <div class="flex items-center mb-3">
                                <input v-model="anamneseEditando.faz_exercicios" type="checkbox" id="exercicios-edit" class="w-4 h-4 rounded border-gray-300 text-emerald-600 accent-emerald-600" />
                                <label for="exercicios-edit" class="ml-3 text-sm font-semibold text-gray-700">Pratica exercícios físicos</label>
                            </div>
                            <div v-if="anamneseEditando.faz_exercicios" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                <div>
                                    <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Qual Exercício</label>
                                    <InputText
                                        v-model="anamneseEditando.qual_exercicio"
                                        type="text"
                                        placeholder="Ex: Musculação"
                                        class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Frequência (x/semana)</label>
                                    <InputText
                                        v-model.number="anamneseEditando.frequencia_exercicio_semana"
                                        type="number"
                                        min="0"
                                        max="7"
                                        placeholder="3"
                                        class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Bloco 5: Alimentação -->
                <section class="bg-white rounded-xl border-2 border-orange-100 p-6">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-lg">🍽️</div>
                        <h3 class="text-lg font-bold text-gray-900">Alimentação</h3>
                    </div>
                    <div class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Alimentos que Ama</label>
                                <textarea
                                    v-model="anamneseEditando.alimentos_que_ama"
                                    placeholder="Liste seus favoritos"
                                    rows="2"
                                    class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                                ></textarea>
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Alimentos que Odeia</label>
                                <textarea
                                    v-model="anamneseEditando.alimentos_que_odeia"
                                    placeholder="Liste os que não gosta"
                                    rows="2"
                                    class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                                ></textarea>
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="md:col-span-2">
                                <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Restrição Alimentar</label>
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                                    <button
                                        v-for="opcao in opcoesRestricao"
                                        :key="opcao.value"
                                        @click="anamneseEditando.restricao_alimentar = opcao.value"
                                        :class="[
                                            'px-3 py-2 rounded-lg text-xs font-medium transition-all text-center',
                                            anamneseEditando.restricao_alimentar === opcao.value ? 'bg-orange-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        ]"
                                    >
                                        {{ opcao.label }}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Copos de Água/Dia</label>
                                <InputText
                                    v-model.number="anamneseEditando.copos_agua_por_dia"
                                    type="number"
                                    min="0"
                                    placeholder="8"
                                    class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                        <div v-if="anamneseEditando.restricao_alimentar && anamneseEditando.restricao_alimentar !== 'nenhuma'">
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Descrição da Restrição</label>
                            <InputText
                                v-model="anamneseEditando.restricao_descricao"
                                placeholder="Descreva detalhes da restrição"
                                class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Alergias Alimentares</label>
                            <textarea
                                v-model="anamneseEditando.alergias_alimentares"
                                placeholder="Liste suas alergias"
                                rows="2"
                                class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                            ></textarea>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Consumo de Álcool</label>
                            <div class="flex gap-2">
                                <button
                                    v-for="opcao in opcoesConsumoAlcool"
                                    :key="opcao.value"
                                    @click="anamneseEditando.consumo_alcool = opcao.value"
                                    :class="['flex-1 py-2 rounded-lg text-xs font-medium transition-all', anamneseEditando.consumo_alcool === opcao.value ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200']"
                                >
                                    {{ opcao.label }}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Bloco 6: Saúde -->
                <section class="bg-white rounded-xl border-2 border-red-100 p-6">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-lg">❤️</div>
                        <h3 class="text-lg font-bold text-gray-900">Saúde</h3>
                    </div>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Doenças Diagnosticadas</label>
                            <textarea
                                v-model="anamneseEditando.doencas_diagnosticadas"
                                placeholder="Liste suas doenças"
                                rows="2"
                                class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                            ></textarea>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Medicamentos</label>
                            <textarea
                                v-model="anamneseEditando.medicamentos"
                                placeholder="Liste seus medicamentos"
                                rows="2"
                                class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                            ></textarea>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Histórico Familiar</label>
                            <textarea
                                v-model="anamneseEditando.historico_familiar"
                                placeholder="Descreva histórico familiar relevante"
                                rows="2"
                                class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                            ></textarea>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Qualidade do Sono</label>
                            <div class="flex gap-2 mb-4">
                                <button
                                    v-for="opcao in opcoesQualidadeSono"
                                    :key="opcao.value"
                                    @click="anamneseEditando.qualidade_sono = opcao.value"
                                    :class="['flex-1 py-2 rounded-lg text-xs font-medium transition-all', anamneseEditando.qualidade_sono === opcao.value ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200']"
                                >
                                    {{ opcao.label }}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Nível de Estresse (1-5)</label>
                            <div class="flex items-center gap-3">
                                <input v-model.number="anamneseEditando.nivel_estresse" type="range" min="1" max="5" class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                                <span class="text-lg font-bold text-emerald-600 min-w-[2rem]">{{ anamneseEditando.nivel_estresse }}</span>
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Observações Adicionais</label>
                            <textarea
                                v-model="anamneseEditando.observacoes_livres"
                                placeholder="Comentários adicionais importantes"
                                rows="2"
                                class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                            ></textarea>
                        </div>
                    </div>
                </section>
            </div>

            <template #footer>
                <Button label="Cancelar" severity="secondary" @click="fecharEdicaoAnamnese" />
                <Button :label="modoEdicao ? 'Atualizar Anamnese' : 'Criar Anamnese'" severity="success" icon="pi pi-check" :loading="loadingEdicaoAnamnese" @click="salvarEdicaoAnamnese" />
            </template>
        </Dialog>
        <!-- END: Dialog Editar Anamnese -->
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
