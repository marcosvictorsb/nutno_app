<script setup>
import ModalAdicionarMedida from '@/components/ModalAdicionarMedida.vue';
import ModalEdicaoAnamnese from '@/components/ModalEdicaoAnamnese.vue';
import ModalEdicaoPaciente from '@/components/ModalEdicaoPaciente.vue';
import { useMedidas } from '@/composables/useMedidas';
import { usePlanosAlimentares } from '@/composables/usePlanosAlimentares';
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

// ===== Composable usePlanosAlimentares =====
const { inicializarRefeicoes } = usePlanosAlimentares();

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

// Estados do gráfico de evolução
const periodoEvoucao = ref('6meses');

// ===== COMPUTED PROPERTIES (estados do composable removidos) =====
const fotoPacienteUrl = computed(() => {
    return construirUrlFotoPaciente(paciente.value?.foto_perfil);
});

// ===== COMPUTED PROPERTIES PARA ABA RESUMO =====

// Plano alimentar ativo
const planoAtivo = computed(() => {
    return planos.value.find((p) => p.status === 'ativo') || null;
});

// Última medida registrada
const ultimaMedida = computed(() => {
    return medidas.value && medidas.value.length > 0 ? medidas.value[0] : null;
});

// Diferença de peso entre última e segunda última medida
const diferencaPeso = computed(() => {
    if (!ultimaMedida.value || medidas.value.length < 2) {
        return null;
    }
    const ultima = parseFloat(ultimaMedida.value.peso);
    const anterior = parseFloat(medidas.value[1].peso);
    return ultima - anterior;
});

// Percentual de variação de peso
const percentualVariacaoPeso = computed(() => {
    if (!diferencaPeso.value || !medidas.value || medidas.value.length < 2) {
        return null;
    }
    const anterior = parseFloat(medidas.value[1].peso);
    if (anterior === 0) return null;
    return ((diferencaPeso.value / anterior) * 100).toFixed(1);
});

// Melhor resultado (menor peso no histórico)
const melhorPeso = computed(() => {
    if (!medidas.value || medidas.value.length === 0) return null;
    let melhor = parseFloat(medidas.value[0].peso);
    let data = medidas.value[0].data_avaliacao;

    medidas.value.forEach((m) => {
        const peso = parseFloat(m.peso);
        if (peso < melhor) {
            melhor = peso;
            data = m.data_avaliacao;
        }
    });

    return { peso: melhor, data };
});

// Diferença total (primeira até hoje)
const diferenceTotal = computed(() => {
    if (!medidas.value || medidas.value.length < 2) return null;
    const primeira = parseFloat(medidas.value[medidas.value.length - 1].peso);
    const ultima = parseFloat(medidas.value[0].peso);
    return ultima - primeira;
});

// Percentual de variação total
const percentualVariacaoTotal = computed(() => {
    if (!diferenceTotal.value || !medidas.value || medidas.value.length < 2) return null;
    const primeira = parseFloat(medidas.value[medidas.value.length - 1].peso);
    if (primeira === 0) return null;
    return ((diferenceTotal.value / primeira) * 100).toFixed(1);
});

// Tendência de peso (baseado nas últimas 3 medidas)
const tendenciaPeso = computed(() => {
    if (!medidas.value || medidas.value.length < 3) {
        return { tipo: 'insuficiente', label: 'Registre mais medidas' };
    }

    const ultima = parseFloat(medidas.value[0].peso);
    const penultima = parseFloat(medidas.value[1].peso);
    const antepenultima = parseFloat(medidas.value[2].peso);

    const tendendo = antepenultima > penultima && penultima > ultima;
    const subindo = antepenultima < penultima && penultima < ultima;

    if (tendendo) {
        return { tipo: 'descendo', label: 'Em queda', emoji: '↘', cor: 'success' };
    } else if (subindo) {
        return { tipo: 'subindo', label: 'Em alta', emoji: '↗', cor: 'danger' };
    } else {
        return { tipo: 'estavel', label: 'Estável', emoji: '→', cor: 'secondary' };
    }
});

// Medidas filtradas por período de evolução
const medidasPorPeriodo = computed(() => {
    if (!medidas.value || medidas.value.length === 0) return [];

    const hoje = new Date();
    const dias = periodoEvoucao.value === '1ano' ? 365 : 180;
    const dataLimite = new Date(hoje.getTime() - dias * 24 * 60 * 60 * 1000);

    return medidas.value
        .filter((m) => {
            const dataMedida = new Date(m.data_avaliacao);
            return dataMedida >= dataLimite;
        })
        .reverse();
});

// Dados formatados para o Chart.js da evolução de peso
const chartDataEvolucaoPeso = computed(() => {
    if (!medidasPorPeriodo.value || medidasPorPeriodo.value.length === 0) {
        return {
            labels: [],
            datasets: []
        };
    }

    // Extrair labels (datas formatadas) e dados (pesos)
    const labels = medidasPorPeriodo.value.map((m) => {
        const data = new Date(m.data_avaliacao);
        return data.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
    });

    const pesos = medidasPorPeriodo.value.map((m) => parseFloat(m.peso) || 0);

    return {
        labels: labels,
        datasets: [
            {
                label: 'Peso (kg)',
                data: pesos,
                borderColor: 'rgb(22, 163, 74)', // green-600
                backgroundColor: 'rgba(22, 163, 74, 0.1)', // green com transparência
                fill: true,
                tension: 0.4, // smooth line
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: 'rgb(22, 163, 74)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                borderWidth: 2
            }
        ]
    };
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

const novoPlano = () => {
    abrirCriacaoPlano();
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
                <!-- <button
                    @click="activeTab = 'resumo'"
                    :class="['px-6 py-3 border-b-2 font-bold transition-all whitespace-nowrap', activeTab === 'resumo' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-emerald-500']"
                >
                    Resumo
                </button> -->
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
            <!-- <div v-if="activeTab === 'resumo'" class="mx-auto max-w-7xl px-4 space-y-6">

                <div v-if="!anamnese || medidas.length === 0 || !planoAtivo || (planoAtivo && !planoAtivo.enviado_em)" class="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">

                    <div v-if="!anamnese" class="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-100">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-amber-600 text-xl">warning</span>
                            <span class="text-slate-700 font-medium">Anamnese não preenchida</span>
                        </div>
                        <Button label="Enviar formulário" severity="warning" text size="small" @click="activeTab = 'anamnese'" />
                    </div>


                    <div v-if="medidas.length === 0" class="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-100">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-amber-600 text-xl">warning</span>
                            <span class="text-slate-700 font-medium">Nenhuma medida registrada</span>
                        </div>
                        <Button label="Adicionar medida" severity="warning" text size="small" @click="abrirCriacaoMedida" />
                    </div>


                    <div v-if="!planoAtivo" class="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-100">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-amber-600 text-xl">warning</span>
                            <span class="text-slate-700 font-medium">Paciente sem plano alimentar ativo</span>
                        </div>
                        <Button label="Criar plano" severity="warning" text size="small" @click="novoPlano" />
                    </div>


                    <div v-if="planoAtivo && !planoAtivo.enviado_em" class="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-100">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-amber-600 text-xl">warning</span>
                            <span class="text-slate-700 font-medium">Plano criado mas não enviado ao paciente</span>
                        </div>
                        <Button label="Enviar agora" severity="warning" text size="small" @click="toast.add({ severity: 'info', summary: 'Funcionalidade', detail: 'Enviar plano alimentar - a implementar' })" />
                    </div>
                </div>


                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div class="lg:col-span-8 flex flex-col gap-6">

                        <div class="bg-white shadow-sm border border-emerald-50 rounded-xl p-6">
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

                                <div v-if="anamnese" class="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-3">
                                    <span class="material-symbols-outlined text-emerald-600">target</span>
                                    <div>
                                        <p class="text-sm font-semibold text-emerald-900">Objetivo: {{ traduzirObjetivo(anamnese.objetivo) }}</p>
                                    </div>
                                </div>

                                <div v-if="anamnese && anamnese.restricao_alimentar && anamnese.restricao_alimentar !== 'nenhuma'" class="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-3">
                                    <span class="material-symbols-outlined text-amber-600">warning</span>
                                    <div>
                                        <p class="text-sm font-semibold text-amber-900">Restrição: {{ traduzirRestricao(anamnese.restricao_alimentar) }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-if="loadingMedidas" class="bg-white shadow-sm border border-emerald-50 rounded-xl p-6">
                            <div class="h-40 flex items-center justify-center">
                                <div class="text-center">
                                    <i class="pi pi-spin pi-spinner text-3xl text-emerald-600 mb-2"></i>
                                    <p class="text-slate-600">Carregando medidas...</p>
                                </div>
                            </div>
                        </div>
                        <div v-else-if="medidas.length === 0" class="bg-white shadow-sm border border-emerald-50 rounded-xl p-8 text-center">
                            <span class="material-symbols-outlined text-5xl text-slate-300 block mb-3">scale</span>
                            <p class="text-slate-600 mb-4">Nenhuma avaliação registrada</p>
                            <Button label="Registrar primeira medida" @click="abrirCriacaoMedida" />
                        </div>
                        <div v-else class="bg-white shadow-sm border border-emerald-50 rounded-xl p-6">
                            <div class="flex items-center justify-between mb-6">
                                <div>
                                    <h3 class="text-lg font-bold text-slate-800">Última Avaliação</h3>
                                    <p class="text-sm text-slate-500">Realizada em {{ formatarDataBrasileira(ultimaMedida.data_avaliacao) }}</p>
                                </div>
                                <span class="material-symbols-outlined text-3xl text-emerald-500">trending_up</span>
                            </div>

                            <div class="grid grid-cols-2 md:grid-cols-2 gap-4 mb-6">

                                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <p class="text-xs text-slate-500 font-bold uppercase mb-2">Peso</p>
                                    <p class="text-2xl font-bold text-slate-900 mb-1">{{ ultimaMedida.peso }} kg</p>
                                    <p v-if="diferencaPeso !== null" :class="['text-sm font-semibold', diferencaPeso < 0 ? 'text-green-600' : 'text-red-600']">
                                        <span v-if="diferencaPeso < 0">▼ {{ Math.abs(diferencaPeso).toFixed(2) }} kg</span>
                                        <span v-else>▲ +{{ diferencaPeso.toFixed(2) }} kg</span>
                                    </p>
                                </div>


                                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <p class="text-xs text-slate-500 font-bold uppercase mb-2">IMC</p>
                                    <p class="text-2xl font-bold text-slate-900 mb-1">{{ parseFloat(ultimaMedida.imc).toFixed(1) }}</p>
                                    <Tag v-if="ultimaMedida.imc" :value="obterClassificacaoIMC(parseFloat(ultimaMedida.imc)).label" :severity="obterClassificacaoIMC(parseFloat(ultimaMedida.imc)).severity" class="text-xs" />
                                </div>


                                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <p class="text-xs text-slate-500 font-bold uppercase mb-2">% Gordura</p>
                                    <p class="text-2xl font-bold text-slate-900">{{ ultimaMedida.perc_gordura_corporal || '—' }}%</p>
                                </div>


                                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <p class="text-xs text-slate-500 font-bold uppercase mb-2">Cintura</p>
                                    <p class="text-2xl font-bold text-slate-900 mb-1">{{ ultimaMedida.circunferencia_cintura || '—' }} cm</p>
                                    <p v-if="ultimaMedida.relacao_cintura_quadril" class="text-xs text-slate-500">RCQ {{ ultimaMedida.relacao_cintura_quadril }}</p>
                                </div>
                            </div>


                            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-4 border-t border-slate-100">
                                <div class="text-center pt-3">
                                    <p class="text-xs text-slate-500 font-bold uppercase mb-1">TMB</p>
                                    <p class="text-lg font-bold text-slate-800">{{ ultimaMedida.tmb || '—' }}</p>
                                    <p class="text-xs text-slate-500">kcal</p>
                                </div>
                                <div class="text-center pt-3">
                                    <p class="text-xs text-slate-500 font-bold uppercase mb-1">GET</p>
                                    <p class="text-lg font-bold text-slate-800">{{ ultimaMedida.gasto_energetico_total || '—' }}</p>
                                    <p class="text-xs text-slate-500">kcal</p>
                                </div>
                                <div class="text-center pt-3">
                                    <p class="text-xs text-slate-500 font-bold uppercase mb-1">Nível</p>
                                    <p class="text-sm font-bold text-slate-800">{{ traduzirNivelAtividade(ultimaMedida.nivel_atividade || '') }}</p>
                                </div>
                                <div class="text-center pt-3">
                                    <p class="text-xs text-slate-500 font-bold uppercase mb-1">Pressão</p>
                                    <p class="text-lg font-bold text-slate-800">{{ ultimaMedida.pressao_arterial_sistolica }}/{{ ultimaMedida.pressao_arterial_diastolica || '—' }}</p>
                                </div>
                                <div class="text-center pt-3">
                                    <p class="text-xs text-slate-500 font-bold uppercase mb-1">Músculo</p>
                                    <p class="text-lg font-bold text-slate-800">{{ ultimaMedida.perc_massa_magra || '—' }}%</p>
                                </div>
                            </div>
                        </div>
                    </div>


                    <div class="lg:col-span-4 flex flex-col gap-6">

                        <div v-if="loadingPlanos" class="bg-white shadow-sm border border-emerald-50 rounded-xl p-6">
                            <div class="h-40 flex items-center justify-center">
                                <div class="text-center">
                                    <i class="pi pi-spin pi-spinner text-3xl text-emerald-600 mb-2"></i>
                                    <p class="text-slate-600">Carregando planos...</p>
                                </div>
                            </div>
                        </div>
                        <div v-else-if="!planoAtivo" class="bg-white shadow-sm border border-emerald-50 rounded-xl p-6 text-center">
                            <span class="material-symbols-outlined text-5xl text-slate-300 block mb-3">menu_book</span>
                            <p class="text-slate-600 mb-4 font-medium">Sem plano alimentar ativo</p>
                            <Button label="+ Criar plano" @click="novoPlano" icon="pi pi-plus" class="w-full" />
                        </div>
                        <div v-else class="bg-white shadow-sm border border-emerald-50 rounded-xl p-6">
                            <div class="flex items-center gap-2 mb-3">
                                <span class="text-xs font-bold uppercase text-slate-500">Plano Alimentar</span>
                                <Tag value="ATIVO" severity="success" class="text-xs" />
                            </div>
                            <h3 class="text-lg font-bold text-slate-900 mb-3">{{ planoAtivo.nome }}</h3>

                            <div v-if="planoAtivo.enviado_em" class="text-xs text-slate-500 mb-3">Enviado em {{ formatarDataBrasileira(planoAtivo.enviado_em) }}</div>
                            <div v-else class="text-xs text-amber-600 font-semibold mb-3">⚠️ Não enviado ao paciente</div>

                            <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4 text-center">
                                <p class="text-xs text-emerald-600 font-semibold uppercase mb-1">Meta Calórica</p>
                                <p class="text-3xl font-bold text-emerald-700">{{ planoAtivo.calorias_objetivo }}</p>
                                <p class="text-xs text-emerald-600">kcal/dia</p>
                            </div>


                            <div class="space-y-3 mb-4">

                                <div>
                                    <div class="flex justify-between items-center mb-1">
                                        <span class="text-xs font-bold text-slate-600 uppercase">Proteína</span>
                                        <span class="text-xs font-bold text-slate-700">{{ planoAtivo.proteinas_objetivo_pct }}%</span>
                                    </div>
                                    <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                        <div class="bg-blue-500 h-full" style="width: 100%"></div>
                                    </div>
                                </div>


                                <div>
                                    <div class="flex justify-between items-center mb-1">
                                        <span class="text-xs font-bold text-slate-600 uppercase">Carboidrato</span>
                                        <span class="text-xs font-bold text-slate-700">{{ planoAtivo.carboidratos_objetivo_pct }}%</span>
                                    </div>
                                    <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                        <div class="bg-amber-500 h-full" style="width: 100%"></div>
                                    </div>
                                </div>


                                <div>
                                    <div class="flex justify-between items-center mb-1">
                                        <span class="text-xs font-bold text-slate-600 uppercase">Gordura</span>
                                        <span class="text-xs font-bold text-slate-700">{{ planoAtivo.gorduras_objetivo_pct }}%</span>
                                    </div>
                                    <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                        <div class="bg-red-500 h-full" style="width: 100%"></div>
                                    </div>
                                </div>
                            </div>

                            <Button label="Ver plano completo →" @click="activeTab = 'planos'" text class="w-full justify-center text-emerald-600 font-semibold" />
                        </div>


                        <div v-if="loadingAnamnese" class="bg-white shadow-sm border border-emerald-50 rounded-xl p-6">
                            <div class="h-40 flex items-center justify-center">
                                <div class="text-center">
                                    <i class="pi pi-spin pi-spinner text-3xl text-emerald-600 mb-2"></i>
                                    <p class="text-slate-600">Carregando saúde...</p>
                                </div>
                            </div>
                        </div>
                        <div v-else-if="!anamnese" class="bg-white shadow-sm border border-emerald-50 rounded-xl p-6 text-center">
                            <p class="text-slate-600 text-sm">Preencha a anamnese para ver informações de saúde</p>
                        </div>
                        <div v-else class="bg-white shadow-sm border border-emerald-50 rounded-xl p-6">
                            <h3 class="text-lg font-bold text-slate-800 mb-4">Saúde & Bem-estar</h3>
                            <div class="space-y-3">

                                <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div class="flex items-center gap-2">
                                        <span class="material-symbols-outlined text-slate-600">dark_mode</span>
                                        <span class="text-slate-700 font-medium">Sono</span>
                                    </div>
                                    <Tag :value="traduzirQualidadeSono(anamnese.qualidade_sono)" :severity="obterCorSono(anamnese.qualidade_sono)" class="text-xs" />
                                </div>


                                <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div class="flex items-center gap-2">
                                        <span class="material-symbols-outlined text-slate-600">directions_run</span>
                                        <span class="text-slate-700 font-medium">Exercícios</span>
                                    </div>
                                    <span class="text-sm font-semibold text-slate-700">
                                        {{ anamnese.faz_exercicios ? `Sim, ${anamnese.frequencia_exercicio_semana}x/sem` : 'Não pratica' }}
                                    </span>
                                </div>


                                <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div class="flex items-center gap-2">
                                        <span class="material-symbols-outlined text-slate-600">water_drop</span>
                                        <span class="text-slate-700 font-medium">Água</span>
                                    </div>
                                    <span class="text-sm font-semibold text-slate-700">{{ anamnese.copos_agua_por_dia || 0 }} copos/dia</span>
                                </div>


                                <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg mb-3">
                                    <div class="flex items-center gap-2">
                                        <span class="material-symbols-outlined text-slate-600">local_bar</span>
                                        <span class="text-slate-700 font-medium">Álcool</span>
                                    </div>
                                    <span class="text-sm font-semibold text-slate-700">{{ traduzirConsumoAlcool(anamnese.consumo_alcool) }}</span>
                                </div>

                                <div class="border-t border-slate-200 pt-3"></div>


                                <div class="mt-3">
                                    <div class="flex items-center justify-between mb-2">
                                        <div class="flex items-center gap-2">
                                            <span class="material-symbols-outlined text-slate-600">sentiment_stress</span>
                                            <span class="text-slate-700 font-medium">Stress</span>
                                        </div>
                                        <span :class="['text-sm font-bold', obterCorEstresse(anamnese.nivel_estresse) === 'success' ? 'text-green-600' : obterCorEstresse(anamnese.nivel_estresse) === 'warning' ? 'text-amber-600' : 'text-red-600']">
                                            {{ anamnese.nivel_estresse }}/5
                                        </span>
                                    </div>
                                    <div class="flex gap-1">
                                        <div
                                            v-for="n in 5"
                                            :key="n"
                                            :class="[
                                                'flex-1 h-2 rounded',
                                                n <= anamnese.nivel_estresse
                                                    ? obterCorEstresse(anamnese.nivel_estresse) === 'success'
                                                        ? 'bg-green-500'
                                                        : obterCorEstresse(anamnese.nivel_estresse) === 'warning'
                                                          ? 'bg-amber-500'
                                                          : 'bg-red-500'
                                                    : 'bg-slate-200'
                                            ]"
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                <div v-if="medidas.length < 2" class="bg-white shadow-sm border border-emerald-50 rounded-xl p-8 text-center">
                    <p class="text-slate-600">Registre mais avaliações para visualizar a evolução do peso ao longo do tempo.</p>
                </div>
                <div v-else class="bg-white shadow-sm border border-emerald-50 rounded-xl p-6">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-lg font-bold text-slate-800 uppercase">Evolução do Peso</h3>
                        <div class="flex gap-2">
                            <button
                                @click="periodoEvoucao = '6meses'"
                                :class="['px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all', periodoEvoucao === '6meses' ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-300 text-slate-600 hover:border-slate-400']"
                            >
                                6 Meses
                            </button>
                            <button
                                @click="periodoEvoucao = '1ano'"
                                :class="['px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all', periodoEvoucao === '1ano' ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-300 text-slate-600 hover:border-slate-400']"
                            >
                                1 Ano
                            </button>
                        </div>
                    </div>


                    <div class="bg-slate-50 rounded-lg p-4 mb-6">
                        <Chart
                            type="line"
                            :data="chartDataEvolucaoPeso"
                            :options="{
                                responsive: true,
                                maintainAspectRatio: true,
                                plugins: {
                                    legend: {
                                        display: true,
                                        labels: {
                                            color: '#64748b',
                                            font: { weight: 'bold', size: 12 }
                                        }
                                    },
                                    tooltip: {
                                        backgroundColor: '#1e293b',
                                        titleColor: '#fff',
                                        bodyColor: '#fff',
                                        padding: 12,
                                        displayColors: true,
                                        callbacks: {
                                            label: function (context) {
                                                return context.parsed.y.toFixed(2) + ' kg';
                                            }
                                        }
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: false,
                                        ticks: { color: '#64748b' },
                                        grid: { color: '#e2e8f0' },
                                        title: { display: true, text: 'Peso (kg)', color: '#64748b' }
                                    },
                                    x: {
                                        ticks: { color: '#64748b' },
                                        grid: { color: '#e2e8f0' }
                                    }
                                }
                            }"
                            class="w-full"
                            style="height: 300px"
                        />
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="bg-slate-50 rounded-xl p-4 text-center">
                            <p class="text-xs text-slate-500 font-bold uppercase mb-2">Início vs Agora</p>
                            <p :class="['text-2xl font-bold', diferenceTotal && diferenceTotal < 0 ? 'text-green-600' : 'text-red-600']">{{ diferenceTotal ? (diferenceTotal < 0 ? '-' : '+') + Math.abs(diferenceTotal).toFixed(2) : '—' }} kg</p>
                            <p v-if="percentualVariacaoTotal" :class="['text-sm', diferenceTotal && diferenceTotal < 0 ? 'text-green-600' : 'text-red-600']">({{ diferenceTotal && diferenceTotal < 0 ? '-' : '+' }}{{ percentualVariacaoTotal }}%)</p>
                        </div>

                        <div class="bg-slate-50 rounded-xl p-4 text-center">
                            <p class="text-xs text-slate-500 font-bold uppercase mb-2">Melhor Resultado</p>
                            <p class="text-2xl font-bold text-slate-900">{{ melhorPeso ? melhorPeso.peso : '—' }} kg</p>
                            <p v-if="melhorPeso" class="text-sm text-slate-600">
                                {{ new Date(melhorPeso.data).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) }}
                            </p>
                        </div>

                        <div class="bg-slate-50 rounded-xl p-4 text-center">
                            <p class="text-xs text-slate-500 font-bold uppercase mb-2">Tendência</p>
                            <p :class="['text-2xl font-bold', tendenciaPeso.cor === 'success' ? 'text-green-600' : tendenciaPeso.cor === 'danger' ? 'text-red-600' : 'text-slate-600']">{{ tendenciaPeso.emoji }} {{ tendenciaPeso.label }}</p>
                        </div>
                    </div>
                </div>
            </div>
            -->

            <!-- Tab: Anamnese -->
            <div v-if="activeTab === 'anamnese'" class="mx-auto">
                <!-- Loading State -->
                <div v-if="loadingAnamnese" class="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-emerald-50">
                    <i class="pi pi-spin pi-spinner text-5xl text-emerald-600 mb-4"></i>
                    <p class="text-gray-600 font-medium">Carregando anamnese...</p>
                </div>

                <!-- Anamnese Not Found / Error State -->
                <div v-else-if="erroAnamnese && !anamnese" class="bg-white rounded-2xl shadow-sm border border-emerald-50 p-8">
                    <div class="flex items-start gap-4 mb-6">
                        <div class="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
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
                <div v-else-if="!loadingMedidas && medidas.length === 0" class="bg-white rounded-2xl shadow-sm border border-emerald-50 p-6 mx-auto">
                    <div class="text-center space-y-4">
                        <div class="flex justify-center">
                            <div class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                                <i class="pi pi-chart-bar text-3xl text-blue-500"></i>
                            </div>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-gray-900 mb-1">Nenhuma Medida Registrada</h3>
                            <p class="text-gray-500 text-base leading-relaxed">
                                Este paciente ainda não possui medidas corporais registradas. <br />
                                Clique no botão abaixo para registrar a primeira medida e começar a monitorar a evolução.
                            </p>
                        </div>
                        <Button label="Registrar Primeira Medida" icon="pi pi-plus" @click="abrirCriacaoMedida" class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold w-full sm:w-auto justify-center" size="large" />
                    </div>
                </div>

                <!-- Medidas Found - Display Data -->
                <div v-else-if="!loadingMedidas && medidas.length > 0" class="space-y-4">
                    <!-- Header com botão Adicionar -->
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-2xl font-bold text-slate-800">Dados das Medidas</h2>
                        <Button label="Adicionar Medida" icon="pi pi-plus" @click="abrirCriacaoMedida" class="bg-emerald-600 hover:bg-emerald-700" />
                    </div>

                    <!-- Quick Stats - Cards with Latest Measurements -->
                    <div v-if="medidaSelecionada" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <!-- Weight Card -->
                        <div class="bg-white p-4 rounded-2xl shadow-sm border border-emerald-50 hover:shadow-md transition-shadow">
                            <p class="text-xs font-bold text-slate-400 tracking-widest uppercase mb-3">PESO ATUAL</p>
                            <div class="flex items-end justify-between">
                                <div>
                                    <span class="text-3xl font-bold text-emerald-600">{{ medidaSelecionada.peso }}</span>
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
                        <div class="bg-white p-4 rounded-2xl shadow-sm border border-blue-50 hover:shadow-md transition-shadow">
                            <p class="text-xs font-bold text-slate-400 tracking-widest uppercase mb-3">IMC</p>
                            <div class="flex items-end justify-between">
                                <div>
                                    <span class="text-3xl font-bold text-blue-600">{{ medidaSelecionada.imc || '-' }}</span>
                                </div>
                                <span class="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">{{ medidaSelecionada.imc >= 30 ? 'ACIMA' : medidaSelecionada.imc >= 25 ? 'SOBRE' : 'NORMAL' }}</span>
                            </div>
                        </div>

                        <!-- Fat % Card -->
                        <div class="bg-white p-4 rounded-2xl shadow-sm border border-orange-50 hover:shadow-md transition-shadow">
                            <p class="text-xs font-bold text-slate-400 tracking-widest uppercase mb-3">% GORDURA</p>
                            <div class="flex items-end justify-between">
                                <div>
                                    <span class="text-3xl font-bold text-orange-600">{{ medidaSelecionada.perc_gordura_corporal || '-' }}</span>
                                    <span class="text-lg text-slate-400 ml-1 font-medium">%</span>
                                </div>
                            </div>
                        </div>

                        <!-- Lean Mass Card -->
                        <div class="bg-white p-4 rounded-2xl shadow-sm border border-purple-50 hover:shadow-md transition-shadow">
                            <p class="text-xs font-bold text-slate-400 tracking-widest uppercase mb-3">% MASSA MAGRA</p>
                            <div class="flex items-end justify-between">
                                <div>
                                    <span class="text-3xl font-bold text-purple-600">{{ medidaSelecionada.perc_massa_magra || '-' }}</span>
                                    <span class="text-lg text-slate-400 ml-1 font-medium">%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Historical Table -->
                    <div class="bg-white rounded-2xl shadow-sm border border-emerald-50 overflow-hidden">
                        <div class="px-4 py-3 border-b border-emerald-100">
                            <h4 class="font-bold text-sm text-slate-800">Histórico de Avaliações</h4>
                        </div>
                        <table class="w-full text-left text-sm">
                            <thead>
                                <tr class="bg-slate-50 text-slate-400 font-bold uppercase tracking-widest text-[10px] border-b border-emerald-100">
                                    <th class="px-4 py-2">Data</th>
                                    <th class="px-4 py-2">Peso</th>
                                    <th class="px-4 py-2">Altura</th>
                                    <th class="px-4 py-2">IMC</th>
                                    <th class="px-4 py-2">% Gordura</th>
                                    <th class="px-4 py-2">Cintura</th>
                                    <th class="px-4 py-2 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                <tr v-for="medida in medidas" :key="medida.id" class="hover:bg-slate-50 transition-colors">
                                    <td class="px-4 py-2 text-sm font-semibold text-slate-800">{{ MedidaService.formatarData(medida.data_avaliacao) }}</td>
                                    <td class="px-4 py-2 text-sm text-slate-600">{{ medida.peso }} kg</td>
                                    <td class="px-4 py-2 text-sm text-slate-600">{{ medida.altura }} cm</td>
                                    <td class="px-4 py-2 text-sm font-bold text-emerald-600">{{ medida.imc }}</td>
                                    <td class="px-4 py-2 text-sm text-slate-600">{{ medida.perc_gordura_corporal || '-' }}%</td>
                                    <td class="px-4 py-2 text-sm text-slate-600">{{ medida.circunferencia_cintura || '-' }} cm</td>
                                    <td class="px-4 py-2 text-right">
                                        <div class="flex items-center justify-end gap-2">
                                            <Button icon="pi pi-eye" text severity="info" size="small" @click="visualizarMedida(medida)" class="hover:text-emerald-600" title="Visualizar detalhes" />
                                            <Button icon="pi pi-trash" text severity="danger" size="small" @click="deletarMedida($event, medida.id)" class="hover:text-red-600" />
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Detailed Evaluation - if medida is selected -->
                    <div v-if="medidaSelecionada" class="space-y-4" data-detalhes-medida>
                        <div class="flex items-center gap-3 mb-4">
                            <h4 class="text-xl font-bold">Avaliação — {{ MedidaService.formatarData(medidaSelecionada.data_avaliacao) }}</h4>
                            <span v-if="medidaSelecionada.id === medidas[0].id" class="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">MAIS RECENTE</span>
                        </div>

                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <!-- Section 1: Antropométricos -->
                            <div class="bg-white p-4 rounded-2xl shadow-sm border border-emerald-50">
                                <h5 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Dados Antropométricos</h5>
                                <div class="grid grid-cols-2 gap-y-4 gap-x-3">
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
                            <div class="bg-white p-4 rounded-2xl shadow-sm border border-emerald-50">
                                <h5 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Circunferências (cm)</h5>
                                <div class="grid grid-cols-3 gap-y-4 gap-x-3">
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
                            <div class="bg-white p-4 rounded-2xl shadow-sm border border-emerald-50">
                                <h5 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Dobras Cutâneas (mm)</h5>
                                <div class="grid grid-cols-4 gap-y-4 gap-x-3">
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
                            <div class="bg-white p-4 rounded-2xl shadow-sm border border-emerald-50">
                                <h5 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Dados Complementares</h5>
                                <div class="space-y-4">
                                    <div class="grid grid-cols-2 gap-y-4 gap-x-3">
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
                                    <div v-if="medidaSelecionada.observacoes" class="bg-slate-50 p-3 rounded-lg">
                                        <p class="text-[10px] font-bold text-slate-400 uppercase mb-1">OBSERVAÇÕES</p>
                                        <p class="text-sm text-slate-600 leading-relaxed">{{ medidaSelecionada.observacoes }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tab: Planos Alimentares -->
            <div v-else-if="activeTab === 'planos'" class="mx-auto">
                <!-- Loading State -->
                <div v-if="loadingPlanos" class="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-emerald-50">
                    <i class="pi pi-spin pi-spinner text-5xl text-emerald-600 mb-4"></i>
                    <p class="text-gray-600 font-medium">Carregando planos alimentares...</p>
                </div>

                <!-- Planos Not Found / Empty State -->
                <div v-else-if="!loadingPlanos && planos.length === 0" class="bg-white rounded-2xl shadow-sm border border-emerald-50 p-8 mx-auto">
                    <div class="text-center space-y-6">
                        <div class="flex justify-center">
                            <div class="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center">
                                <i class="pi pi-list text-5xl text-orange-500"></i>
                            </div>
                        </div>
                        <div>
                            <h3 class="text-2xl font-bold text-gray-900 mb-2">Nenhum Plano Alimentar Cadastrado</h3>
                            <p class="text-gray-500 text-base leading-relaxed">
                                Este paciente ainda não possui um plano alimentar. <br />
                                Clique no botão abaixo para criar o primeiro plano alimentar personalizado.
                            </p>
                        </div>
                        <Button label="Criar Plano Alimentar" icon="pi pi-plus" @click="abrirCriacaoPlano" class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold w-full sm:w-auto justify-center" size="large" />
                    </div>
                </div>

                <!-- Planos Found - Display Data -->
                <div v-else-if="!loadingPlanos && planos.length > 0" class="space-y-3">
                    <!-- Header com botão Adicionar -->
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-xl font-bold text-slate-800">Planos Alimentares</h2>
                        <Button label="Novo Plano" icon="pi pi-plus" @click="abrirCriacaoPlano" class="bg-emerald-600 hover:bg-emerald-700" />
                    </div>

                    <!-- Planos List - Space-between layout -->
                    <div class="space-y-3">
                        <!-- Plano Ativo/Detalhado -->
                        <template v-for="plano in planos" :key="plano.id">
                            <!-- ATIVO ou PRINCIPAL -->
                            <div v-if="plano.status === 'ativo'" class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <!-- Left: Content -->
                                    <div class="flex-1">
                                        <div class="flex items-center gap-3 mb-3">
                                            <Tag value="ATIVO" severity="success" class="text-xs font-bold uppercase" />
                                            <h4 class="text-xl font-semibold text-slate-800">{{ plano.nome }}</h4>
                                        </div>

                                        <!-- Nutrients Grid -->
                                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                                            <div class="bg-slate-50 p-3 rounded-xl">
                                                <p class="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-tight">Energia</p>
                                                <p class="text-lg font-bold text-slate-800">{{ plano.calorias_objetivo }}<span class="text-xs font-normal text-slate-500">kcal</span></p>
                                            </div>
                                            <div class="bg-slate-50 p-3 rounded-xl">
                                                <p class="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-tight">Proteína</p>
                                                <p class="text-lg font-bold text-emerald-600">{{ plano.proteinas_objetivo_pct }}<span class="text-xs font-normal">%</span></p>
                                            </div>
                                            <div class="bg-slate-50 p-3 rounded-xl">
                                                <p class="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-tight">Carboidrato</p>
                                                <p class="text-lg font-bold text-slate-600">{{ plano.carboidratos_objetivo_pct }}<span class="text-xs font-normal">%</span></p>
                                            </div>
                                            <div class="bg-slate-50 p-3 rounded-xl">
                                                <p class="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-tight">Gordura</p>
                                                <p class="text-lg font-bold text-slate-500">{{ plano.gorduras_objetivo_pct }}<span class="text-xs font-normal">%</span></p>
                                            </div>
                                        </div>

                                        <!-- Metadata -->
                                        <div class="flex items-center gap-2 text-sm text-slate-500">
                                            <i class="pi pi-calendar text-base"></i>
                                            <span v-if="plano.enviado_em">Enviado em {{ formatarDataBrasileira(plano.enviado_em) }}</span>
                                            <span v-else>Criado em {{ formatarDataBrasileira(plano.criado_em) }}</span>
                                        </div>
                                    </div>

                                    <!-- Right: Actions -->
                                    <div class="flex flex-row md:flex-col gap-2 justify-end">
                                        <Button icon="pi pi-send" label="Enviar" class="bg-slate-100 text-slate-800 hover:bg-slate-200 font-medium text-sm" />
                                        <Button icon="pi pi-pencil" label="Editar" class="bg-slate-100 text-slate-800 hover:bg-slate-200 font-medium text-sm" @click="router.push(`/pacientes/${paciente.id}/planos/${plano.id}`)" />
                                        <Button icon="pi pi-inbox" label="Arquivar" class="bg-slate-100 text-slate-800 hover:bg-slate-200 font-medium text-sm" />
                                    </div>
                                </div>
                            </div>

                            <!-- RASCUNHO -->
                            <div v-else-if="plano.status === 'rascunho'" class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <!-- Left: Icon + Content -->
                                    <div class="flex items-center gap-4">
                                        <div class="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
                                            <span class="material-symbols-outlined text-2xl" data-icon="edit_note">edit_note</span>
                                        </div>
                                        <div>
                                            <div class="flex items-baseline gap-2 mb-0.5">
                                                <Tag value="RASCUNHO" severity="warning" class="text-xs font-bold uppercase" />
                                                <h4 class="text-sm font-semibold text-slate-800">{{ plano.nome }}</h4>
                                            </div>
                                            <p class="text-xs text-slate-500">Última edição {{ formatarDataBrasileira(plano.atualizado_em) }}</p>
                                        </div>
                                    </div>

                                    <!-- Right: Actions -->
                                    <div class="flex items-center gap-2">
                                        <Button label="Deletar" text severity="danger" @click="deletarPlano(plano.id)" />
                                        <Button label="Continuar" class="bg-emerald-600 hover:bg-emerald-700 text-white font-medium" @click="abrirEdicaoPlano(plano.id)" />
                                    </div>
                                </div>
                            </div>

                            <!-- ARQUIVADO -->
                            <div v-else-if="plano.status === 'arquivado'" class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 opacity-60">
                                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <!-- Left: Icon + Content -->
                                    <div class="flex items-center gap-4">
                                        <div class="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
                                            <span class="material-symbols-outlined text-2xl" data-icon="inventory_2">inventory_2</span>
                                        </div>
                                        <div>
                                            <div class="flex items-center gap-2 mb-0.5">
                                                <Tag value="ARQUIVADO" severity="secondary" class="text-xs font-bold uppercase" />
                                                <h4 class="text-sm font-semibold text-slate-800">{{ plano.nome }}</h4>
                                            </div>
                                            <p class="text-xs text-slate-500">Finalizado em {{ formatarDataBrasileira(plano.atualizado_em) }}</p>
                                        </div>
                                    </div>

                                    <!-- Right: Menu -->
                                    <Button icon="pi pi-ellipsis-v" class="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 p-2" />
                                </div>
                            </div>
                        </template>
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
