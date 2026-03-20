<script setup>
import AlimentoService from '@/service/AlimentoService';
import AnamneseService from '@/service/AnamneseService';
import MedidaService from '@/service/MedidaService';
import PacienteService from '@/service/PacienteService';
import PlanoAlimentarService from '@/service/PlanoAlimentarService';
import { construirUrlFotoPaciente } from '@/utils/urlHelper';
import { DatePicker } from 'primevue';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import Chart from 'primevue/chart';
import ConfirmPopup from 'primevue/confirmpopup';
import Dialog from 'primevue/dialog';
import InputMask from 'primevue/inputmask';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import RadioButton from 'primevue/radiobutton';
import Tag from 'primevue/tag';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const toast = useToast();
const confirm = useConfirm();

// Estados
const paciente = ref(null);
const loading = ref(true);
const erro = ref(null);
const activeTab = ref('anamnese');
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

// Estados das medidas
const medidas = ref([]);
const loadingMedidas = ref(false);
const erroMedidas = ref(null);
const medidasCarregada = ref(false);
const medidaSelecionada = ref(null);

// Estados dos planos alimentares
const planos = ref([]);
const loadingPlanos = ref(false);
const erroPlanos = ref(null);
const planosCarregada = ref(false);
const showDialogCriacaoPlano = ref(false);
const loadingCriacaoPlano = ref(false);
const stepAtualPlano = ref(1);
const errosPlano = ref({});
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

// Estados do Step 2 - Refeições
const buscarAlimentoText = ref('');
const resultadosBusca = ref([]);
const loadingBusca = ref(false);
const carregandoMaisAlimentos = ref(false);
const paginaAtualAlimentos = ref(1);
const totalPaginasAlimentos = ref(1);
const refeicaoExpandida = ref(null);
const seindoEditado = ref(null); // { refeicaoIndex: num, itemIndex: num }
const dropdownObserver = ref(null); // Intersection Observer para detecção de scroll
const formQuantidade = ref({
    alimento_id: null,
    nome_alimento: '',
    grupo_alimento: '',
    quantidade: 100,
    unidade: 'g',
    calorias_por_100: 0
});
let debounceTimer = null;

// Estados do gráfico de evolução
const periodoEvoucao = ref('6meses');
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

// Campo combinado para pressão arterial no formato 120/80
const pressaoArterialCombinada = ref('');

// ===== COMPUTED PROPERTIES PARA MEDIDAS =====

// IMC com classificação
const imcComClassificacao = computed(() => {
    return calcularIMCComClassificacao(formularioMedida.value.peso, formularioMedida.value.altura);
});

// % Massa Magra calculada automaticamente
const massaMagraCalculada = computed(() => {
    const perc_gordura = formularioMedida.value.perc_gordura_corporal;
    if (!perc_gordura || perc_gordura <= 0) {
        return '—';
    }
    return (100 - perc_gordura).toFixed(1);
});

// RCQ com classificação
const rcqComClassificacao = computed(() => {
    return calcularRCQComClassificacao(formularioMedida.value.circunferencia_cintura, formularioMedida.value.circunferencia_quadril, paciente.value?.sexo);
});

// GET calculado automaticamente
const getCalculado = computed(() => {
    return calcularGET(formularioMedida.value.tmb, formularioMedida.value.nivel_atividade);
});

// URL da foto do paciente com base no ambiente
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

// ===== FUNÇÕES DE CÁLCULO PARA MODAL DE MEDIDAS =====

// Calcular IMC e retornar { valor, classificacao, cor }
const calcularIMCComClassificacao = (peso, altura) => {
    if (!peso || peso <= 0 || !altura || altura <= 0) {
        return { valor: '—', classificacao: null, cor: null };
    }
    const alturaMetros = altura / 100;
    const imc = peso / (alturaMetros * alturaMetros);

    let classificacao = '';
    let cor = '';

    if (imc < 18.5) {
        classificacao = 'Abaixo do peso';
        cor = 'info'; // azul
    } else if (imc < 25) {
        classificacao = 'Normal';
        cor = 'success'; // verde
    } else if (imc < 30) {
        classificacao = 'Sobrepeso';
        cor = 'warning'; // amarelo
    } else if (imc < 35) {
        classificacao = 'Obesidade I';
        cor = 'warning'; // laranja (usando warning)
    } else if (imc < 40) {
        classificacao = 'Obesidade II';
        cor = 'danger'; // vermelho
    } else {
        classificacao = 'Obesidade III';
        cor = 'danger'; // vermelho escuro
    }

    return {
        valor: imc.toFixed(1),
        classificacao,
        cor
    };
};

// Calcular RCQ e retornar { valor, classificacao, cor }
const calcularRCQComClassificacao = (cintura, quadril, sexo) => {
    if (!cintura || cintura <= 0 || !quadril || quadril <= 0) {
        return { valor: '—', classificacao: null, cor: null };
    }

    const rcq = cintura / quadril;
    let classificacao = '';
    let cor = '';

    if (!sexo) {
        // Sem sexo definido, apenas retorna o valor
        return { valor: rcq.toFixed(2), classificacao: null, cor: null };
    }

    if (sexo === 'M' || sexo === 'masculino') {
        if (rcq < 0.9) {
            classificacao = 'Baixo risco';
            cor = 'success';
        } else if (rcq < 0.95) {
            classificacao = 'Risco moderado';
            cor = 'warning';
        } else {
            classificacao = 'Alto risco';
            cor = 'danger';
        }
    } else if (sexo === 'F' || sexo === 'feminino') {
        if (rcq < 0.8) {
            classificacao = 'Baixo risco';
            cor = 'success';
        } else if (rcq < 0.85) {
            classificacao = 'Risco moderado';
            cor = 'warning';
        } else {
            classificacao = 'Alto risco';
            cor = 'danger';
        }
    }

    return {
        valor: rcq.toFixed(2),
        classificacao,
        cor
    };
};

// Calcular TMB usando Harris-Benedict revisado
const calcularTMB = (peso, altura, idade, sexo) => {
    if (!peso || peso <= 0 || !altura || altura <= 0 || !idade || idade <= 0) {
        return null;
    }

    let tmb = 0;
    const usarMasculino = !sexo || sexo === 'M' || sexo === 'masculino';

    if (usarMasculino) {
        // Harris-Benedict para homens
        tmb = 88.36 + 13.4 * peso + 4.8 * altura - 5.7 * idade;
    } else {
        // Harris-Benedict para mulheres
        tmb = 447.6 + 9.2 * peso + 3.1 * altura - 4.3 * idade;
    }

    return Math.round(tmb);
};

// Obter fator de atividade
const obterFatorAtividade = (nivelAtividade) => {
    const fatores = {
        sedentario: 1.2,
        leve: 1.375,
        moderado: 1.55,
        intenso: 1.725
    };
    return fatores[nivelAtividade] || 1.375;
};

// Calcular GET
const calcularGET = (tmb, nivelAtividade) => {
    if (!tmb || tmb <= 0) {
        return '—';
    }
    const fator = obterFatorAtividade(nivelAtividade);
    return Math.round(tmb * fator);
};

// Validar e parsear pressão arterial (formato 120/80)
const parsePressoArterial = (valor) => {
    if (!valor || valor.trim() === '') {
        return { sistolica: null, diastolica: null, valido: true };
    }

    const partes = valor.split('/');
    if (partes.length !== 2) {
        return { sistolica: null, diastolica: null, valido: false, erro: 'Formato deve ser: 120/80' };
    }

    const sistolica = parseInt(partes[0].trim(), 10);
    const diastolica = parseInt(partes[1].trim(), 10);

    if (isNaN(sistolica) || isNaN(diastolica)) {
        return { sistolica: null, diastolica: null, valido: false, erro: 'Valores devem ser números' };
    }

    if (sistolica <= diastolica) {
        return { sistolica, diastolica, valido: false, erro: 'Sistólica deve ser maior que diastólica' };
    }

    return { sistolica, diastolica, valido: true };
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

// Funções de Medidas
const carregarMedidas = async () => {
    loadingMedidas.value = true;
    erroMedidas.value = null;

    try {
        const idPaciente = route.params.id;
        console.log('📊 Carregando medidas do paciente:', idPaciente);

        const response = await MedidaService.listarMedidasPaciente(idPaciente);
        console.log('✅ Resposta de medidas:', response.data);

        if (response.data.success && response.data.data) {
            if (Array.isArray(response.data.data) && response.data.data.length > 0) {
                // A API retorna os dados já ordenados por ID DESC (mais recente primeiro)
                // Não é necessário fazer sort novamente
                medidas.value = response.data.data;

                // A primeira medida é sempre a mais recente - preencher a seleção
                medidaSelecionada.value = medidas.value[0];
                console.log('📍 Medida selecionada:', medidaSelecionada.value.id, '- Peso:', medidaSelecionada.value.peso, 'kg');
                medidaSelecionada.value.imc = medidaSelecionada.value.gasto_energetico_total;

                erroMedidas.value = null;
            } else {
                // API retornou sucesso mas sem dados
                medidas.value = [];
                medidaSelecionada.value = null;
                erroMedidas.value = null;
                console.log('ℹ️ Nenhuma medida registrada para este paciente');
            }
        } else {
            // API retornou erro
            erroMedidas.value = response.data.message || 'Erro ao listar medidas';
            medidas.value = [];
            medidaSelecionada.value = null;
            console.error('❌ Erro na resposta da API:', erroMedidas.value);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar medidas:', error);
        erroMedidas.value = 'Erro ao carregar medidas. Tente novamente.';
        medidas.value = [];
        medidaSelecionada.value = null;
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

const abrirCriacaoMedida = async () => {
    // Inicializar formulário com valores padrão
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
    pressaoArterialCombinada.value = '';

    // Buscar dados da última anamnese para preencher campos
    try {
        const response = await AnamneseService.obterAnamnesePaciente(paciente.value.id);
        if (response.data.success && response.data.data) {
            const anamneseData = response.data.data;

            // Preencher peso
            if (anamneseData.peso_atual) {
                formularioMedida.value.peso = parseFloat(anamneseData.peso_atual);
            }

            // Preencher altura
            if (anamneseData.altura) {
                formularioMedida.value.altura = parseFloat(anamneseData.altura);
            }

            // Definir nível de atividade baseado nos dados da anamnese
            if (anamneseData.faz_exercicios && anamneseData.frequencia_exercicio_semana) {
                const frequencia = parseInt(anamneseData.frequencia_exercicio_semana);
                if (frequencia >= 5) {
                    formularioMedida.value.nivel_atividade = 'intenso';
                } else if (frequencia >= 3) {
                    formularioMedida.value.nivel_atividade = 'moderado';
                } else if (frequencia > 0) {
                    formularioMedida.value.nivel_atividade = 'leve';
                } else {
                    formularioMedida.value.nivel_atividade = 'sedentario';
                }
            } else {
                formularioMedida.value.nivel_atividade = 'sedentario';
            }

            // Calcular TMB automaticamente se temos todos os dados necessários
            if (paciente.value?.data_nascimento && formularioMedida.value.peso && formularioMedida.value.altura) {
                await nextTick();
                const idade = calcularIdade(paciente.value.data_nascimento);
                const tmb = calcularTMB(formularioMedida.value.peso, formularioMedida.value.altura, idade, paciente.value.sexo);
                if (tmb) {
                    formularioMedida.value.tmb = tmb;
                    console.log('✅ TMB calculado automaticamente:', tmb, 'kcal/dia');
                }
            }
        }
    } catch (error) {
        console.warn('Erro ao buscar anamnese para preencher medida:', error);
        // Continuar mesmo se não conseguir buscar a anamnese (valores padrão já estão definidos)
    }

    showDialogCriacaoMedida.value = true;
};

const fecharCriacaoMedida = () => {
    showDialogCriacaoMedida.value = false;
    formularioMedida.value = {};
    pressaoArterialCombinada.value = '';
};

// Calcular TMB usando Harris-Benedict e preencher o campo
const calcularTMBParam = () => {
    if (!paciente.value?.data_nascimento || !formularioMedida.value.peso || !formularioMedida.value.altura) {
        toast.add({
            severity: 'warn',
            summary: 'Dados incompletos',
            detail: 'Preencha peso, altura e verifique se a data de nascimento do paciente está registrada',
            life: 3000
        });
        return;
    }

    const idade = calcularIdade(paciente.value.data_nascimento);
    const tmb = calcularTMB(formularioMedida.value.peso, formularioMedida.value.altura, idade, paciente.value.sexo);

    if (tmb) {
        formularioMedida.value.tmb = tmb;
        toast.add({
            severity: 'success',
            summary: 'TMB calculado',
            detail: `TMB: ${tmb} kcal/dia${!paciente.value.sexo ? ' (referência masculina)' : ''}`,
            life: 3000
        });
    }
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

        // Preparar dados para enviar (todos os campos, apenas se preenchidos)
        const dadosMedida = {};

        // Data
        if (dataFormatada) dadosMedida.data_avaliacao = dataFormatada;

        // Dados Antropométricos Básicos
        if (formularioMedida.value.peso !== null && formularioMedida.value.peso !== '') {
            dadosMedida.peso = formularioMedida.value.peso.toString();
        }
        if (formularioMedida.value.altura !== null && formularioMedida.value.altura !== '') {
            dadosMedida.altura = formularioMedida.value.altura.toString();
        }

        // IMC (enviar mesmo sendo calculado no backend, para consistência)
        if (formularioMedida.value.imc !== null && formularioMedida.value.imc !== '') {
            dadosMedida.imc = formularioMedida.value.imc.toString();
        }

        // Percentuais e Composição Corporal
        if (formularioMedida.value.perc_gordura_corporal !== null && formularioMedida.value.perc_gordura_corporal !== '') {
            dadosMedida.perc_gordura_corporal = formularioMedida.value.perc_gordura_corporal.toString();
        }
        if (formularioMedida.value.perc_massa_magra !== null && formularioMedida.value.perc_massa_magra !== '') {
            dadosMedida.perc_massa_magra = formularioMedida.value.perc_massa_magra.toString();
        }
        if (formularioMedida.value.idade_metabolica !== null && formularioMedida.value.idade_metabolica !== '') {
            dadosMedida.idade_metabolica = formularioMedida.value.idade_metabolica;
        }

        // Circunferências
        if (formularioMedida.value.circunferencia_cintura !== null && formularioMedida.value.circunferencia_cintura !== '') {
            dadosMedida.circunferencia_cintura = formularioMedida.value.circunferencia_cintura.toString();
        }
        if (formularioMedida.value.circunferencia_quadril !== null && formularioMedida.value.circunferencia_quadril !== '') {
            dadosMedida.circunferencia_quadril = formularioMedida.value.circunferencia_quadril.toString();
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

        // Dobras Cutâneas
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

        // Dados Cardiovasculares
        if (formularioMedida.value.pressao_arterial_sistolica !== null && formularioMedida.value.pressao_arterial_sistolica !== '') {
            dadosMedida.pressao_arterial_sistolica = formularioMedida.value.pressao_arterial_sistolica;
        }
        if (formularioMedida.value.pressao_arterial_diastolica !== null && formularioMedida.value.pressao_arterial_diastolica !== '') {
            dadosMedida.pressao_arterial_diastolica = formularioMedida.value.pressao_arterial_diastolica;
        }
        if (formularioMedida.value.frequencia_cardiaca !== null && formularioMedida.value.frequencia_cardiaca !== '') {
            dadosMedida.frequencia_cardiaca = formularioMedida.value.frequencia_cardiaca;
        }

        // Gasto Energético
        if (formularioMedida.value.nivel_atividade) {
            dadosMedida.nivel_atividade = formularioMedida.value.nivel_atividade;
        }
        if (formularioMedida.value.tmb !== null && formularioMedida.value.tmb !== '') {
            dadosMedida.tmb = formularioMedida.value.tmb.toString();
        }
        if (formularioMedida.value.gasto_energetico_total !== null && formularioMedida.value.gasto_energetico_total !== '') {
            dadosMedida.gasto_energetico_total = formularioMedida.value.gasto_energetico_total.toString();
        }

        // Observações
        if (formularioMedida.value.observacoes) {
            dadosMedida.observacoes = formularioMedida.value.observacoes;
        }

        console.log('📤 Dados da medida a serem enviados:', dadosMedida);
        console.log(dadosMedida);

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

const deletarMedida = (event, idMedida) => {
    confirm.require({
        target: event.currentTarget,
        message: 'Tem certeza que deseja deletar esta medida?',
        icon: 'pi pi-exclamation-triangle',
        defaultFocus: 'reject',
        rejectButtonProps: {
            label: 'Cancelar',
            severity: 'secondary',
            outlined: true
        },
        acceptButtonProps: {
            label: 'Deletar',
            severity: 'danger'
        },
        accept: async () => {
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
        }
    });
};

// Visualizar medida selecionada com scroll
const visualizarMedida = (medida) => {
    medidaSelecionada.value = medida;

    // Scroll para a seção de detalhes após um pequeno delay
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

// ===== FUNÇÕES DE TRADUÇÃO PARA ABA RESUMO =====

const traduzirObjetivo = (valor) => {
    const mapa = {
        emagrecer: 'Emagrecimento',
        ganhar_massa: 'Ganho de Massa',
        melhorar_saude: 'Melhorar Saúde',
        controlar_doenca: 'Controlar Doença',
        melhorar_performance: 'Performance',
        outro: 'Outro'
    };
    return mapa[valor] || valor;
};

const traduzirRestricao = (valor) => {
    const mapa = {
        lactose: 'Intolerância à lactose',
        gluten: 'Doença celíaca (glúten)',
        vegetariano: 'Vegetariano',
        vegano: 'Vegano',
        religiao: 'Restrição religiosa',
        outra: 'Outra restrição',
        nenhuma: 'Nenhuma'
    };
    return mapa[valor] || valor;
};

const traduzirNivelAtividade = (valor) => {
    const mapa = {
        sedentario: 'Sedentário',
        leve: 'Leve',
        moderado: 'Moderado',
        intenso: 'Intenso',
        muito_intenso: 'Muito Intenso'
    };
    return mapa[valor] || valor;
};

const traduzirQualidadeSono = (valor) => {
    const mapa = {
        otimo: 'Ótimo',
        bom: 'Bom',
        ruim: 'Ruim',
        pessimo: 'Péssimo'
    };
    return mapa[valor] || valor;
};

const traduzirConsumoAlcool = (valor) => {
    const mapa = {
        nao: 'Não consome',
        socialmente: 'Socialmente',
        frequentemente: 'Frequentemente'
    };
    return mapa[valor] || valor;
};

const obterCorSono = (valor) => {
    const cores = {
        otimo: 'success',
        bom: 'info',
        ruim: 'warning',
        pessimo: 'danger'
    };
    return cores[valor] || 'secondary';
};

const obterCorEstresse = (nivel) => {
    if (nivel <= 2) return 'success';
    if (nivel === 3) return 'warning';
    return 'danger';
};

const obterClassificacaoIMC = (imc) => {
    if (imc < 18.5) {
        return { label: 'Abaixo do peso', severity: 'info' };
    } else if (imc < 25) {
        return { label: 'Normal', severity: 'success' };
    } else if (imc < 30) {
        return { label: 'Sobrepeso', severity: 'warning' };
    } else if (imc < 35) {
        return { label: 'Obesidade I', severity: 'warning' };
    } else if (imc < 40) {
        return { label: 'Obesidade II', severity: 'danger' };
    } else {
        return { label: 'Obesidade III', severity: 'danger' };
    }
};

const abrirCriacaoPlano = () => {
    stepAtualPlano.value = 1;
    errosPlano.value = {};
    formularioPlano.value = {
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
    };
    showDialogCriacaoPlano.value = true;
};

const fecharCriacaoPlano = () => {
    showDialogCriacaoPlano.value = false;
    stepAtualPlano.value = 1;
    formularioPlano.value = {
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
    };
    errosPlano.value = {};
};

const validarStep1Plano = () => {
    errosPlano.value = {};

    if (!formularioPlano.value.nome || formularioPlano.value.nome.trim() === '') {
        errosPlano.value.nome = 'Nome do plano é obrigatório';
    }

    if (!formularioPlano.value.objetivo || formularioPlano.value.objetivo.trim() === '') {
        errosPlano.value.objetivo = 'Objetivo do plano é obrigatório';
    }

    if (!formularioPlano.value.calorias_meta || formularioPlano.value.calorias_meta <= 0) {
        errosPlano.value.calorias_meta = 'Meta calórica é obrigatória e deve ser maior que 0';
    }

    return Object.keys(errosPlano.value).length === 0;
};

const avancarStep = () => {
    if (stepAtualPlano.value === 1) {
        if (validarStep1Plano()) {
            stepAtualPlano.value++;
            console.log('✅ Step 1 validado, avançando para Step 2');
            inicializarRefeicoes();
        } else {
            toast.add({
                severity: 'warn',
                summary: 'Campos obrigatórios',
                detail: 'Preencha todos os campos obrigatórios',
                life: 3000
            });
        }
    } else if (stepAtualPlano.value === 2) {
        if (validarStep2Plano()) {
            stepAtualPlano.value++;
        }
    } else {
        stepAtualPlano.value++;
    }
};

const salvarPlano = async () => {
    try {
        loadingCriacaoPlano.value = true;

        // Construir payload no formato esperado pela API
        const payload = {
            nome: formularioPlano.value.nome,
            objetivo: formularioPlano.value.objetivo,
            observacoes: formularioPlano.value.notas || '',
            calorias_objetivo: formularioPlano.value.calorias_meta,
            proteinas_objetivo_pct: formularioPlano.value.proteina_perc,
            carboidratos_objetivo_pct: formularioPlano.value.carboidrato_perc,
            gorduras_objetivo_pct: formularioPlano.value.gordura_perc,
            refeicoes: formularioPlano.value.refeicoes.map((refeicao) => ({
                nome: refeicao.nome,
                horario_sugerido: refeicao.horario ? `${refeicao.horario}:00` : '',
                ordem: refeicao.ordem,
                observacoes: refeicao.notas || '',
                itens: refeicao.itens.map((item) => ({
                    id_alimento: item.alimento_id,
                    quantidade: item.quantidade,
                    unidade: item.unidade,
                    observacoes: '' // Vazio por enquanto
                }))
            }))
        };

        console.log('✏️ Salvando plano alimentar:', payload);

        // Chamar serviço para criar plano
        const response = await PlanoAlimentarService.criar(paciente.value.id, payload);

        console.log('✅ Plano salvo com sucesso:', response);

        toast.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Plano alimentar salvo com sucesso!',
            life: 3000
        });

        // Avançar para Step 4 (Enviar)
        stepAtualPlano.value = 4;
    } catch (error) {
        console.error('❌ Erro ao salvar plano:', error);
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: error.response?.data?.message || 'Erro ao salvar o plano alimentar',
            life: 3000
        });
    } finally {
        loadingCriacaoPlano.value = false;
    }
};

// ========== FUNÇÕES DO STEP 2 - REFEIÇÕES ==========

// Distribuição de calorias por refeição baseado em quantidade
const distribuirCalorias = (refeicoes_dia) => {
    const distribuicoes = {
        3: [
            { nome: 'Café da manhã', horario: '07:00', perc: 0.25 },
            { nome: 'Almoço', horario: '13:00', perc: 0.4 },
            { nome: 'Jantar', horario: '19:30', perc: 0.35 }
        ],
        4: [
            { nome: 'Café da manhã', horario: '07:00', perc: 0.25 },
            { nome: 'Almoço', horario: '13:00', perc: 0.35 },
            { nome: 'Lanche tarde', horario: '16:00', perc: 0.1 },
            { nome: 'Jantar', horario: '19:30', perc: 0.3 }
        ],
        5: [
            { nome: 'Café da manhã', horario: '07:00', perc: 0.25 },
            { nome: 'Lanche manhã', horario: '10:00', perc: 0.1 },
            { nome: 'Almoço', horario: '13:00', perc: 0.35 },
            { nome: 'Lanche tarde', horario: '16:00', perc: 0.1 },
            { nome: 'Jantar', horario: '19:30', perc: 0.2 }
        ],
        6: [
            { nome: 'Café da manhã', horario: '07:00', perc: 0.25 },
            { nome: 'Lanche manhã', horario: '10:00', perc: 0.1 },
            { nome: 'Almoço', horario: '13:00', perc: 0.3 },
            { nome: 'Lanche tarde', horario: '16:00', perc: 0.1 },
            { nome: 'Jantar', horario: '19:30', perc: 0.2 },
            { nome: 'Ceia', horario: '22:00', perc: 0.05 }
        ]
    };
    return distribuicoes[refeicoes_dia] || distribuicoes[5];
};

// Inicializar array de refeições com metas calculadas
const inicializarRefeicoes = () => {
    console.log('🔄 Inicializando refeições para o plano');
    console.log('📊 Dados atuais do plano:', formularioPlano.value);
    // if (formularioPlano.value.refeicoes.length > 0) {
    //     // Já tem dados, não reinicializa
    //     return;
    // }

    console.log('📊 Refeições antes da inicialização:', formularioPlano.value.refeicoes);

    const refeicoesDia = parseInt(formularioPlano.value.refeicoes_dia);
    const distribuicao = distribuirCalorias(refeicoesDia);

    formularioPlano.value.refeicoes = distribuicao.map((ref, idx) => ({
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
};

// Buscar alimentos com debounce (400ms)
const buscarAlimentosDebounce = (termo) => {
    clearTimeout(debounceTimer);

    if (termo.length < 2) {
        resultadosBusca.value = [];
        paginaAtualAlimentos.value = 1;
        totalPaginasAlimentos.value = 1;
        return;
    }

    loadingBusca.value = true;
    paginaAtualAlimentos.value = 1; // Reset para primeira página
    debounceTimer = setTimeout(async () => {
        try {
            const response = await AlimentoService.buscarAlimentos({
                busca: termo,
                limite: 10,
                pagina: 1
            });
            resultadosBusca.value = response.data?.data?.dados || [];
            totalPaginasAlimentos.value = response.data?.data?.totalPaginas || 1;
        } catch (error) {
            console.error('❌ Erro ao buscar alimentos:', error);
            resultadosBusca.value = [];
            totalPaginasAlimentos.value = 1;
        } finally {
            loadingBusca.value = false;
        }
    }, 400);
};

// Carregar mais alimentos (paginação infinita)
const carregarMaisAlimentos = async () => {
    if (carregandoMaisAlimentos.value || !buscarAlimentoText.value || paginaAtualAlimentos.value >= totalPaginasAlimentos.value) {
        return;
    }

    carregandoMaisAlimentos.value = true;
    const proximaPagina = paginaAtualAlimentos.value + 1;

    try {
        const response = await AlimentoService.buscarAlimentos({
            busca: buscarAlimentoText.value,
            limite: 10,
            pagina: proximaPagina
        });
        const novosAlimentos = response.data?.data?.dados || [];
        resultadosBusca.value = [...resultadosBusca.value, ...novosAlimentos];
        paginaAtualAlimentos.value = proximaPagina;
        // Re-setup observer após carregar mais alimentos
        setupDropdownObserver();
    } catch (error) {
        console.error('❌ Erro ao carregar mais alimentos:', error);
    } finally {
        carregandoMaisAlimentos.value = false;
    }
};

// Setup Intersection Observer para detectar quando antepenúltimo item fica visível
const setupDropdownObserver = async () => {
    await nextTick();

    if (resultadosBusca.value.length < 2) {
        return;
    }

    // Limpar observer anterior se existir
    if (dropdownObserver.value) {
        dropdownObserver.value.disconnect();
    }

    // Criar novo observer
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                // Quando o antepenúltimo item ficar visível, carregar mais
                if (entry.isIntersecting) {
                    carregarMaisAlimentos();
                }
            });
        },
        {
            root: document.querySelector('[data-dropdown-results]'), // Viewport do dropdown
            threshold: 0.1 // Quando 10% do elemento estiver visível
        }
    );

    // Monitorar o antepenúltimo item da lista
    const elementos = document.querySelectorAll('[data-alimento-item]');
    if (elementos.length >= 2) {
        const antepenultimoIndex = elementos.length - 2;
        observer.observe(elementos[antepenultimoIndex]);
    }

    dropdownObserver.value = observer;
};

// Watcher para setup observer quando os resultados mudam
watch(
    () => resultadosBusca.value.length,
    () => {
        setupDropdownObserver();
    }
);

// Converter unidades para gramas
const converterParaGramas = (quantidade, unidade) => {
    const conversoes = {
        g: quantidade,
        ml: quantidade,
        'colher de sopa': quantidade * 15,
        'colher de chá': quantidade * 5,
        xícara: quantidade * 200,
        unidade: 100
    };
    return conversoes[unidade] || 100;
};

// Calcular nutrientes de um item baseado em quantidade
const calcularNutrienteItem = (alimento, quantidade, unidade) => {
    const gramasTotal = converterParaGramas(quantidade, unidade);
    const fator = gramasTotal / 100;

    // Converter strings para números (API retorna como string)
    const energiaKcal = typeof alimento.energiaKcal === 'string' ? parseFloat(alimento.energiaKcal) : alimento.energiaKcal;
    const proteina = typeof alimento.proteina === 'string' ? parseFloat(alimento.proteina) : alimento.proteina;
    const carboidrato = typeof alimento.carboidrato === 'string' ? parseFloat(alimento.carboidrato) : alimento.carboidrato;
    const lipidios = typeof alimento.lipidios === 'string' ? parseFloat(alimento.lipidios) : alimento.lipidios;

    return {
        calorias: Math.round(energiaKcal * fator * 10) / 10,
        proteinas: Math.round(proteina * fator * 10) / 10,
        carboidrato: Math.round(carboidrato * fator * 10) / 10,
        gordura: Math.round(lipidios * fator * 10) / 10
    };
};

// Selecionar alimento do dropdown
const selecionarAlimento = (alimento) => {
    formQuantidade.value.alimento_id = alimento.id;
    formQuantidade.value.nome_alimento = alimento.nome;
    formQuantidade.value.grupo_alimento = alimento.grupo;
    // Converter para número se vier como string
    formQuantidade.value.calorias_por_100 = typeof alimento.energiaKcal === 'string' ? parseFloat(alimento.energiaKcal) : alimento.energiaKcal;
    formQuantidade.value.alimento = alimento;
    resultadosBusca.value = [];
    buscarAlimentoText.value = '';
};

// Adicionar item à refeição
const adicionarItem = (refeicaoIndex) => {
    if (!formQuantidade.value.alimento_id) return;

    const refeicao = formularioPlano.value.refeicoes[refeicaoIndex];
    const nutrientes = calcularNutrienteItem(formQuantidade.value.alimento, formQuantidade.value.quantidade, formQuantidade.value.unidade);

    const novoItem = {
        alimento_id: formQuantidade.value.alimento_id,
        nome_alimento: formQuantidade.value.nome_alimento,
        grupo_alimento: formQuantidade.value.grupo_alimento,
        quantidade: formQuantidade.value.quantidade,
        unidade: formQuantidade.value.unidade,
        calorias_calculadas: nutrientes.calorias,
        proteinas_calculadas: nutrientes.proteinas,
        carboidrato_calculado: nutrientes.carboidrato,
        gordura_calculada: nutrientes.gordura
    };

    refeicao.itens.push(novoItem);
    calcularTotalRefeicao(refeicao);

    // Limpar formulário
    formQuantidade.value = {
        alimento_id: null,
        nome_alimento: '',
        grupo_alimento: '',
        quantidade: 100,
        unidade: 'g',
        calorias_por_100: 0
    };
    buscarAlimentoText.value = '';
};

// Deletar item da refeição
const deletarItem = (refeicaoIndex, itemIndex) => {
    formularioPlano.value.refeicoes[refeicaoIndex].itens.splice(itemIndex, 1);
    calcularTotalRefeicao(formularioPlano.value.refeicoes[refeicaoIndex]);
};

// Recalcular totais de uma refeição
const calcularTotalRefeicao = (refeicao) => {
    refeicao.total_calorias = 0;
    refeicao.total_proteinas_g = 0;
    refeicao.total_carboidrato_g = 0;
    refeicao.total_gordura_g = 0;

    refeicao.itens.forEach((item) => {
        refeicao.total_calorias += item.calorias_calculadas;
        refeicao.total_proteinas_g += item.proteinas_calculadas;
        refeicao.total_carboidrato_g += item.carboidrato_calculado;
        refeicao.total_gordura_g += item.gordura_calculada;
    });

    refeicao.total_calorias = Math.round(refeicao.total_calorias * 10) / 10;
    refeicao.total_proteinas_g = Math.round(refeicao.total_proteinas_g * 10) / 10;
    refeicao.total_carboidrato_g = Math.round(refeicao.total_carboidrato_g * 10) / 10;
    refeicao.total_gordura_g = Math.round(refeicao.total_gordura_g * 10) / 10;
};

// Calcular totais do dia (para barra sticky)
const calcularTotaisDia = () => {
    let total_calorias = 0;
    let total_proteinas = 0;
    let total_carboidrato = 0;
    let total_gordura = 0;

    formularioPlano.value.refeicoes.forEach((refeicao) => {
        total_calorias += refeicao.total_calorias;
        total_proteinas += refeicao.total_proteinas_g;
        total_carboidrato += refeicao.total_carboidrato_g;
        total_gordura += refeicao.total_gordura_g;
    });

    return {
        total_calorias: Math.round(total_calorias * 10) / 10,
        total_proteinas: Math.round(total_proteinas * 10) / 10,
        total_carboidrato: Math.round(total_carboidrato * 10) / 10,
        total_gordura: Math.round(total_gordura * 10) / 10,
        perc_calorias: Math.round((total_calorias / formularioPlano.value.calorias_meta) * 100),
        perc_proteinas: Math.round((total_proteinas / formularioPlano.value.proteina_g) * 100),
        perc_carboidrato: Math.round((total_carboidrato / formularioPlano.value.carboidrato_g) * 100),
        perc_gordura: Math.round((total_gordura / formularioPlano.value.gordura_g) * 100)
    };
};

// ========== FUNÇÕES DO STEP 3 - REVISÃO ==========

// Traduzir objetivo interno para texto legível
// const traduzirObjetivo = (objetivo) => {
//     const traducoes = {
//         Emagrecimento: 'Emagrecimento',
//         'Ganho de massa': 'Ganho de Massa',
//         Manutenção: 'Manutenção',
//         Performance: 'Performance'
//     };
//     return traducoes[objetivo] || objetivo;
// };

// Calcular diferença entre realizado e meta calórica
const calcularDiferencaCalorica = () => {
    const totais = calcularTotaisDia();
    return {
        diferenca: totais.total_calorias - formularioPlano.value.calorias_meta,
        realizado: totais.total_calorias,
        meta: formularioPlano.value.calorias_meta
    };
};

// Obter status comparativo com a meta
const obterStatusComparativo = () => {
    const { diferenca } = calcularDiferencaCalorica();

    if (diferenca >= -200 && diferenca <= 200) {
        return {
            status: 'dentro',
            titulo: 'Dentro da meta calórica',
            icone: 'pi-check-circle',
            classe: 'bg-emerald-50 border-emerald-200',
            textoClasse: 'text-emerald-700',
            descricao: 'O plano atual atende a recomendação basal + atividade física.'
        };
    } else if (diferenca < -200) {
        return {
            status: 'abaixo',
            titulo: 'Abaixo da meta calórica',
            icone: 'pi-arrow-down-circle',
            classe: 'bg-amber-50 border-amber-200',
            textoClasse: 'text-amber-700',
            descricao: `O plano está ${Math.abs(Math.round(diferenca))} kcal abaixo da meta.`
        };
    } else {
        return {
            status: 'acima',
            titulo: 'Acima da meta calórica',
            icone: 'pi-exclamation-circle',
            classe: 'bg-red-50 border-red-200',
            textoClasse: 'text-red-700',
            descricao: `O plano está ${Math.round(diferenca)} kcal acima da meta.`
        };
    }
};

// Formatar valor numérico sem casas decimais
const formatarValor = (valor) => {
    return Math.round(valor);
};

// Adicionar refeição extra personalizada
const adicionarRefeicaoExtra = () => {
    const ordem = formularioPlano.value.refeicoes.length + 1;
    formularioPlano.value.refeicoes.push({
        nome: 'Personalizado',
        horario: '',
        ordem: ordem,
        notas: '',
        itens: [],
        meta_calorias: 0,
        meta_proteinas_g: 0,
        meta_carboidrato_g: 0,
        meta_gordura_g: 0,
        total_calorias: 0,
        total_proteinas_g: 0,
        total_carboidrato_g: 0,
        total_gordura_g: 0
    });
};

// Validar Step 2 - Deve ter ao menos 1 alimento em alguma refeição
const validarStep2Plano = () => {
    const temAlimento = formularioPlano.value.refeicoes.some((ref) => ref.itens.length > 0);
    if (!temAlimento) {
        toast.add({
            severity: 'warn',
            summary: 'Refeições vazias',
            detail: 'Adicione pelo menos 1 alimento em alguma refeição para continuar.',
            life: 3000
        });
    }
    return temAlimento;
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
                                        <Button label="Continuar" class="bg-emerald-600 hover:bg-emerald-700 text-white font-medium" @click="router.push(`/pacientes/${paciente.id}/planos/${plano.id}`)" />
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

        <!-- Dialog Criar Medida -->
        <Dialog v-model:visible="showDialogCriacaoMedida" header="Adicionar Medida" :modal="true" :style="{ width: '90vw', maxHeight: '90vh' }" :breakpoints="{ '1199px': '95vw', '575px': '100vw' }" @hide="fecharCriacaoMedida">
            <div v-if="true" class="space-y-4 max-h-[calc(90vh-250px)] overflow-y-auto pr-4">
                <!-- Data da Avaliação -->
                <section class="bg-white rounded-xl border-2 border-emerald-100 p-4">
                    <div class="flex items-center gap-2 mb-3">
                        <div class="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-base">📅</div>
                        <h3 class="text-base font-bold text-gray-900">Data da Avaliação</h3>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Data</label>
                        <DatePicker v-model="formularioMedida.data_avaliacao" dateFormat="dd/mm/yy" placeholder="dd/mm/yyyy" :showIcon="true" class="w-full" />
                    </div>
                </section>

                <!-- Seção 1: Dados Antropométricos (expandida) -->
                <section class="bg-white rounded-xl border-2 border-blue-100 p-4">
                    <div class="flex items-center gap-2 mb-3">
                        <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-base">⚖️</div>
                        <h3 class="text-base font-bold text-gray-900">Dados Antropométricos</h3>
                    </div>
                    <div class="space-y-4">
                        <!-- Primeira linha: Peso, Altura, IMC -->
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <!-- Peso (editável) -->
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Peso (kg)</label>
                                <InputNumber v-model="formularioMedida.peso" :maxFractionDigits="2" placeholder="00.00" />
                            </div>

                            <!-- Altura (editável) -->
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Altura (cm)</label>
                                <InputNumber v-model="formularioMedida.altura" :maxFractionDigits="2" placeholder="00.00" />
                            </div>

                            <!-- IMC (calculado) -->
                            <div>
                                <div class="flex items-center justify-between mb-1">
                                    <label class="text-xs font-semibold text-gray-600 uppercase tracking-wider">IMC <span class="text-gray-400 font-normal">(calculado)</span></label>
                                </div>
                                <div class="bg-blue-50 border border-blue-200 rounded-lg p-2 flex items-center justify-between">
                                    <span class="text-sm font-semibold text-gray-800">{{ imcComClassificacao.valor }}</span>
                                    <Tag v-if="imcComClassificacao.classificacao" :value="imcComClassificacao.classificacao" :severity="imcComClassificacao.cor" class="text-xs" />
                                </div>
                                <p class="text-xs text-gray-400 italic mt-1">Calculado automaticamente a partir do peso e altura.</p>
                            </div>
                        </div>

                        <!-- Segunda linha: % Gordura, % Massa Magra, Idade Metabólica -->
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <!-- % Gordura Corporal (editável) -->
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">% Gordura Corporal</label>
                                <InputNumber v-model="formularioMedida.perc_gordura_corporal" :maxFractionDigits="2" placeholder="00.00" />
                            </div>

                            <!-- % Massa Magra (calculada) -->
                            <div>
                                <div class="flex items-center justify-between mb-1">
                                    <label class="text-xs font-semibold text-gray-600 uppercase tracking-wider">% Massa Magra <span class="text-gray-400 font-normal">(calculada)</span></label>
                                </div>
                                <div class="bg-green-50 border border-green-200 rounded-lg p-2">
                                    <span class="text-sm font-semibold text-gray-800">{{ massaMagraCalculada }}</span>
                                </div>
                                <p class="text-xs text-gray-400 italic mt-1">100% − % Gordura Corporal</p>
                            </div>

                            <!-- Idade Metabólica (editável) -->
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Idade Metabólica (anos)</label>
                                <InputNumber v-model="formularioMedida.idade_metabolica" :maxFractionDigits="0" placeholder="00" />
                            </div>
                        </div>

                        <!-- Separador visual: Gasto Energético -->
                        <div class="flex items-center gap-3 my-4">
                            <div class="flex-1 h-px bg-blue-100"></div>
                            <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Gasto Energético</span>
                            <div class="flex-1 h-px bg-blue-100"></div>
                        </div>

                        <!-- Nível de Atividade (largura total) -->
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Nível de Atividade</label>
                            <div class="flex gap-1 flex-wrap">
                                <button
                                    v-for="nivel in ['sedentario', 'leve', 'moderado', 'intenso']"
                                    :key="nivel"
                                    @click="formularioMedida.nivel_atividade = nivel"
                                    :class="['px-3 py-1 rounded-full text-xs font-medium transition-all', formularioMedida.nivel_atividade === nivel ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200']"
                                >
                                    {{ MedidaService.formatarValor('nivel_atividade', nivel) }}
                                </button>
                            </div>
                            <p class="text-xs text-gray-400 italic mt-2">Sedentário: sem exercício ou trabalho sentado · Leve: 1 a 3x por semana · Moderado: 3 a 5x por semana · Intenso: 6 a 7x por semana</p>
                        </div>

                        <!-- TMB e GET -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <!-- TMB com botão Calcular -->
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">TMB (kcal/dia)</label>
                                <div class="flex gap-2">
                                    <InputNumber v-model="formularioMedida.tmb" :maxFractionDigits="0" placeholder="0000" class="flex-1" />
                                    <Button icon="pi pi-calculator" @click="calcularTMBParam" severity="secondary" class="px-3" title="Calcular usando Harris-Benedict" />
                                </div>
                                <p class="text-xs text-gray-400 italic mt-1">Taxa Metabólica Basal — energia mínima em repouso. Clique em 🧮 para calcular automaticamente usando Harris-Benedict.</p>
                            </div>

                            <!-- GET (calculado, readonly) -->
                            <div>
                                <div class="flex items-center justify-between mb-1">
                                    <label class="text-xs font-semibold text-gray-600 uppercase tracking-wider">GET <span class="text-gray-400 font-normal">(calculada)</span></label>
                                </div>
                                <div class="bg-blue-50 border border-blue-200 rounded-lg p-2">
                                    <span class="text-sm font-semibold text-gray-800">{{ getCalculado }} kcal/dia</span>
                                </div>
                                <p class="text-xs text-gray-400 italic mt-1">Gasto Energético Total — energia diária estimada com base na TMB e nível de atividade selecionado.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Seção 2: Circunferências -->
                <section class="bg-white rounded-xl border-2 border-purple-100 p-4">
                    <div class="flex items-center gap-2 mb-3">
                        <div class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-base">📏</div>
                        <h3 class="text-base font-bold text-gray-900">Circunferências (cm)</h3>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <!-- Cintura (editável) -->
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Cintura</label>
                            <InputNumber v-model="formularioMedida.circunferencia_cintura" :maxFractionDigits="2" placeholder="00.00" />
                        </div>

                        <!-- Quadril (editável) -->
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Quadril</label>
                            <InputNumber v-model="formularioMedida.circunferencia_quadril" :maxFractionDigits="2" placeholder="00.00" />
                        </div>

                        <!-- RCQ (calculada) -->
                        <div>
                            <div class="flex items-center justify-between mb-1">
                                <label class="text-xs font-semibold text-gray-600 uppercase tracking-wider">RCQ <span class="text-gray-400 font-normal">(calculada)</span></label>
                            </div>
                            <div class="bg-purple-50 border border-purple-200 rounded-lg p-2 flex items-center justify-between">
                                <span class="text-sm font-semibold text-gray-800">{{ rcqComClassificacao.valor }}</span>
                                <Tag v-if="rcqComClassificacao.classificacao" :value="rcqComClassificacao.classificacao" :severity="rcqComClassificacao.cor" class="text-xs" />
                            </div>
                            <p class="text-xs text-gray-400 italic mt-1">Cintura ÷ Quadril. Risco cardiovascular baseado no sexo do paciente.</p>
                        </div>

                        <!-- Abdominal (editável) -->
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Abdominal</label>
                            <InputNumber v-model="formularioMedida.circunferencia_abdominal" :maxFractionDigits="2" placeholder="00.00" />
                        </div>

                        <!-- Braço (editável) -->
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Braço</label>
                            <InputNumber v-model="formularioMedida.circunferencia_braco" :maxFractionDigits="2" placeholder="00.00" />
                        </div>

                        <!-- Tórax (editável) -->
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Tórax</label>
                            <InputNumber v-model="formularioMedida.circunferencia_torax" :maxFractionDigits="2" placeholder="00.00" />
                        </div>

                        <!-- Coxa Direita (editável) -->
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Coxa Direita</label>
                            <InputNumber v-model="formularioMedida.circunferencia_coxa_direita" :maxFractionDigits="2" placeholder="00.00" />
                        </div>

                        <!-- Coxa Esquerda (editável) -->
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Coxa Esquerda</label>
                            <InputNumber v-model="formularioMedida.circunferencia_coxa_esquerda" :maxFractionDigits="2" placeholder="00.00" />
                        </div>

                        <!-- Panturrilha (editável) -->
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Panturrilha</label>
                            <InputNumber v-model="formularioMedida.circunferencia_panturrilha" :maxFractionDigits="2" placeholder="00.00" />
                        </div>
                    </div>
                </section>

                <!-- Seção 3: Dobras Cutâneas -->
                <section class="bg-white rounded-xl border-2 border-orange-100 p-4">
                    <div class="flex items-center gap-2 mb-3">
                        <div class="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-base">📐</div>
                        <h3 class="text-base font-bold text-gray-900">Dobras Cutâneas (mm)</h3>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Subscapular</label>
                            <InputNumber v-model="formularioMedida.dobra_subescapular" :maxFractionDigits="2" placeholder="00.00" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Tríceps</label>
                            <InputNumber v-model="formularioMedida.dobra_tricipital" :maxFractionDigits="2" placeholder="00.00" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Bíceps</label>
                            <InputNumber v-model="formularioMedida.dobra_bicipital" :maxFractionDigits="2" placeholder="00.00" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Suprailíaca</label>
                            <InputNumber v-model="formularioMedida.dobra_suprailíaca" :maxFractionDigits="2" placeholder="00.00" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Abdominal</label>
                            <InputNumber v-model="formularioMedida.dobra_abdominal" :maxFractionDigits="2" placeholder="00.00" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Coxal</label>
                            <InputNumber v-model="formularioMedida.dobra_coxal" :maxFractionDigits="2" placeholder="00.00" />
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Peitoral</label>
                            <InputNumber v-model="formularioMedida.dobra_peitoral" :maxFractionDigits="2" placeholder="00.00" />
                        </div>
                    </div>
                </section>

                <!-- Seção 4: Dados Cardiovasculares e Observações -->
                <section class="bg-white rounded-xl border-2 border-red-100 p-4">
                    <div class="flex items-center gap-2 mb-3">
                        <div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-base">❤️</div>
                        <h3 class="text-base font-bold text-gray-900">Dados Cardiovasculares e Observações</h3>
                    </div>
                    <div class="space-y-4">
                        <!-- Pressão Arterial e Frequência Cardíaca -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <!-- Pressão Arterial (merged: 120/80) -->
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Pressão Arterial (mmHg)</label>
                                <InputMask v-model="pressaoArterialCombinada" mask="999/99" placeholder="120/80" class="w-full" slotChar=" " />
                                <p class="text-xs text-gray-400 italic mt-1">Formato: sistólica/diastólica. Ex: 120/80</p>
                            </div>

                            <!-- Frequência Cardíaca -->
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Frequência Cardíaca (bpm)</label>
                                <InputNumber v-model="formularioMedida.frequencia_cardiaca" :maxFractionDigits="0" placeholder="72" />
                            </div>
                        </div>

                        <!-- Observações (largura total) -->
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Observações</label>
                            <textarea
                                v-model="formularioMedida.observacoes"
                                placeholder="Adicione observações importantes"
                                rows="2"
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
            <div v-if="anamneseEditando" class="space-y-6 overflow-y-auto pr-4">
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

        <!-- BEGIN: Dialog Criar Plano Alimentar (4 Steps) -->
        <Dialog
            v-model:visible="showDialogCriacaoPlano"
            :modal="true"
            :style="{ width: '95vw', maxHeight: '95vh' }"
            :breakpoints="{ '1199px': '95vw', '575px': '100vw' }"
            @hide="fecharCriacaoPlano"
            :header="false"
            :pt="{ header: 'hidden' }"
            class="overflow-hidden"
        >
            <!-- Header com Progresso -->
            <div class="bg-white border-b border-slate-200 p-6 -m-6 mb-6">
                <div class="flex items-center justify-between mb-6">
                    <div>
                        <h2 class="text-2xl font-bold text-slate-800">Novo plano — {{ paciente?.nome }}</h2>
                        <p class="text-xs text-slate-500 uppercase tracking-wider mt-1">Passo {{ stepAtualPlano }} de 4</p>
                    </div>
                    <button @click="fecharCriacaoPlano" class="text-slate-400 hover:text-slate-600">
                        <i class="pi pi-times text-2xl"></i>
                    </button>
                </div>
                <!-- Tabs de Progresso -->
                <div class="hidden md:flex items-center gap-8">
                    <div class="flex items-center gap-3">
                        <span class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" :class="stepAtualPlano >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'">1</span>
                        <span :class="['font-medium', stepAtualPlano >= 1 ? 'text-emerald-600' : 'text-slate-400']">Configure</span>
                    </div>
                    <div class="w-12 h-[1px] bg-slate-200"></div>
                    <div class="flex items-center gap-3">
                        <span class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" :class="stepAtualPlano >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'">2</span>
                        <span :class="['font-medium', stepAtualPlano >= 2 ? 'text-emerald-600' : 'text-slate-400']">Refeições</span>
                    </div>
                    <div class="w-12 h-[1px] bg-slate-200"></div>
                    <div class="flex items-center gap-3">
                        <span class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" :class="stepAtualPlano >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'">3</span>
                        <span :class="['font-medium', stepAtualPlano >= 3 ? 'text-emerald-600' : 'text-slate-400']">Revisão</span>
                    </div>
                    <div class="w-12 h-[1px] bg-slate-200"></div>
                    <div class="flex items-center gap-3">
                        <span class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" :class="stepAtualPlano >= 4 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'">4</span>
                        <span :class="['font-medium', stepAtualPlano >= 4 ? 'text-emerald-600' : 'text-slate-400']">Enviar</span>
                    </div>
                </div>
            </div>

            <!-- Conteúdo do Step 1: Configurações Básicas -->
            <div v-if="stepAtualPlano === 1" class="space-y-4 overflow-y-auto pr-4">
                <!-- Seção 1: Configurações Básicas -->
                <section class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-base">⚙️</div>
                        <h3 class="text-lg font-bold text-slate-800">Configurações Básicas</h3>
                    </div>

                    <div class="space-y-4">
                        <!-- Nome do Plano -->
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 mb-1.5">Nome do plano <span class="text-red-500">*</span></label>
                            <InputText
                                v-model="formularioPlano.nome"
                                placeholder="Protocolo Cutting"
                                class="w-full px-3 py-2 text-sm bg-slate-50 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                                :class="errosPlano.nome ? 'border-red-500' : 'border-slate-200'"
                                @input="errosPlano.nome = ''"
                            />
                            <small v-if="errosPlano.nome" class="block text-red-500 text-xs font-semibold mt-1">{{ errosPlano.nome }}</small>
                        </div>

                        <!-- Objetivo -->
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 mb-2">Objetivo do plano <span class="text-red-500">*</span></label>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                                <button
                                    v-for="opt in ['Emagrecimento', 'Ganho de massa', 'Manutenção', 'Performance']"
                                    :key="opt"
                                    @click="
                                        () => {
                                            formularioPlano.objetivo = opt;
                                            errosPlano.objetivo = '';
                                        }
                                    "
                                    :class="[
                                        'group p-3 rounded-lg border-2 transition-all text-center flex flex-col items-center gap-1.5 font-medium text-xs',
                                        formularioPlano.objetivo === opt ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md' : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-slate-50'
                                    ]"
                                >
                                    <span class="text-base">
                                        {{ opt === 'Emagrecimento' ? '📉' : opt === 'Ganho de massa' ? '💪' : opt === 'Manutenção' ? '⚖️' : '⚡' }}
                                    </span>
                                    {{ opt }}
                                </button>
                            </div>
                            <small v-if="errosPlano.objetivo" class="block text-red-500 text-xs font-semibold mt-1.5">{{ errosPlano.objetivo }}</small>
                        </div>
                    </div>
                </section>

                <!-- Seção 2: Metas Diárias -->
                <section class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-base">🎯</div>
                        <h3 class="text-lg font-bold text-slate-800">Metas Diárias</h3>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Meta Calórica -->
                        <div class="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border-2" :class="errosPlano.calorias_meta ? 'border-red-500' : 'border-emerald-200'">
                            <div class="flex items-center gap-2 mb-3">
                                <div class="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm">
                                    <i class="pi pi-fire text-xs"></i>
                                </div>
                                <span class="text-xs font-semibold text-emerald-900 uppercase">Meta Calórica <span class="text-red-600">*</span></span>
                            </div>
                            <div class="flex items-baseline gap-1.5">
                                <InputNumber
                                    v-model="formularioPlano.calorias_meta"
                                    :use-grouping="false"
                                    @input="errosPlano.calorias_meta = ''"
                                    class="!text-xl !font-bold"
                                    :class="errosPlano.calorias_meta ? '!text-red-600' : '!text-emerald-600'"
                                    input-class="text-xl font-bold"
                                />
                                <span class="text-sm font-semibold text-emerald-700">kcal</span>
                            </div>
                            <p v-if="!errosPlano.calorias_meta" class="text-xs text-emerald-600 mt-2">
                                <i class="pi pi-info-circle text-xs mr-0.5"></i>
                                Energia diária
                            </p>
                            <small v-if="errosPlano.calorias_meta" class="block text-red-500 text-xs font-semibold mt-2">{{ errosPlano.calorias_meta }}</small>
                        </div>

                        <!-- Refeições por dia -->
                        <div class="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200">
                            <div class="flex items-center gap-2 mb-4">
                                <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">
                                    <i class="pi pi-home text-xs"></i>
                                </div>
                                <span class="text-xs font-semibold text-blue-900 uppercase">Refeições por dia</span>
                            </div>
                            <div class="grid grid-cols-4 gap-2">
                                <button
                                    v-for="num in [3, 4, 5, 6]"
                                    :key="num"
                                    @click="formularioPlano.refeicoes_dia = num"
                                    :class="[
                                        'py-3 rounded-lg border-2 transition-all text-center font-bold text-sm',
                                        formularioPlano.refeicoes_dia === num ? 'border-blue-600 bg-blue-600 text-white shadow-lg' : 'border-blue-300 bg-white text-blue-700 hover:border-blue-500 hover:bg-blue-50'
                                    ]"
                                >
                                    {{ num }}
                                </button>
                            </div>
                            <p class="text-xs text-blue-600 mt-3">
                                <i class="pi pi-info-circle text-xs mr-0.5"></i>
                                Selecione a quantidade de refeições
                            </p>
                        </div>
                    </div>
                </section>

                <!-- Seção 3: Distribuição de Macros -->
                <section class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-base">📊</div>
                            <h3 class="text-lg font-bold text-slate-800">Distribuição de Macros</h3>
                        </div>
                        <span
                            :class="[
                                'px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider',
                                formularioPlano.proteina_perc + formularioPlano.carboidrato_perc + formularioPlano.gordura_perc === 100
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : formularioPlano.proteina_perc + formularioPlano.carboidrato_perc + formularioPlano.gordura_perc > 100
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-yellow-100 text-yellow-700'
                            ]"
                        >
                            {{ formularioPlano.proteina_perc + formularioPlano.carboidrato_perc + formularioPlano.gordura_perc }}%
                        </span>
                    </div>

                    <!-- Barra Visual de Distribuição -->
                    <div class="mb-4">
                        <div class="w-full h-5 rounded-full overflow-hidden flex bg-slate-100 border border-slate-200">
                            <div class="h-full bg-emerald-600 transition-all duration-300 flex-shrink-0" :style="{ width: formularioPlano.proteina_perc + '%' }"></div>
                            <div class="h-full bg-blue-600 transition-all duration-300 flex-shrink-0" :style="{ width: formularioPlano.carboidrato_perc + '%' }"></div>
                            <div class="h-full bg-red-600 transition-all duration-300 flex-shrink-0" :style="{ width: formularioPlano.gordura_perc + '%' }"></div>
                        </div>
                    </div>

                    <!-- Cards de Macros -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        <!-- Proteína -->
                        <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                            <div class="w-2 h-2 rounded-full bg-emerald-600 mx-auto mb-1.5"></div>
                            <p class="text-xs font-bold text-emerald-700 uppercase mb-0.5">Proteína</p>
                            <p class="text-lg font-bold text-emerald-700">{{ formularioPlano.proteina_g }}g</p>
                            <p class="text-xs text-emerald-600 mt-0.5">{{ formularioPlano.proteina_perc }}%</p>
                        </div>

                        <!-- Carboidrato -->
                        <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                            <div class="w-2 h-2 rounded-full bg-blue-600 mx-auto mb-1.5"></div>
                            <p class="text-xs font-bold text-blue-700 uppercase mb-0.5">Carboidrato</p>
                            <p class="text-lg font-bold text-blue-700">{{ formularioPlano.carboidrato_g }}g</p>
                            <p class="text-xs text-blue-600 mt-0.5">{{ formularioPlano.carboidrato_perc }}%</p>
                        </div>

                        <!-- Gordura -->
                        <div class="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                            <div class="w-2 h-2 rounded-full bg-red-600 mx-auto mb-1.5"></div>
                            <p class="text-xs font-bold text-red-700 uppercase mb-0.5">Gordura</p>
                            <p class="text-lg font-bold text-red-700">{{ formularioPlano.gordura_g }}g</p>
                            <p class="text-xs text-red-600 mt-0.5">{{ formularioPlano.gordura_perc }}%</p>
                        </div>
                    </div>

                    <!-- Sliders com Labels -->
                    <div class="space-y-4 mt-4">
                        <!-- Proteína Slider -->
                        <div class="space-y-2">
                            <div class="flex justify-between items-center">
                                <div class="flex items-center gap-1.5">
                                    <div class="w-2 h-2 rounded-full bg-emerald-600"></div>
                                    <span class="text-sm font-semibold text-slate-700">Proteínas</span>
                                </div>
                                <span class="text-xs font-bold text-emerald-600">{{ formularioPlano.proteina_perc }}%</span>
                            </div>
                            <input
                                v-model.number="formularioPlano.proteina_perc"
                                type="range"
                                min="0"
                                max="100"
                                class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                @input="() => (formularioPlano.proteina_g = Math.round((formularioPlano.calorias_meta * formularioPlano.proteina_perc) / 100 / 4))"
                            />
                        </div>

                        <!-- Carboidrato Slider -->
                        <div class="space-y-2">
                            <div class="flex justify-between items-center">
                                <div class="flex items-center gap-1.5">
                                    <div class="w-2 h-2 rounded-full bg-blue-600"></div>
                                    <span class="text-sm font-semibold text-slate-700">Carboidratos</span>
                                </div>
                                <span class="text-xs font-bold text-blue-600">{{ formularioPlano.carboidrato_perc }}%</span>
                            </div>
                            <input
                                v-model.number="formularioPlano.carboidrato_perc"
                                type="range"
                                min="0"
                                max="100"
                                class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                @input="() => (formularioPlano.carboidrato_g = Math.round((formularioPlano.calorias_meta * formularioPlano.carboidrato_perc) / 100 / 4))"
                            />
                        </div>

                        <!-- Gordura Slider -->
                        <div class="space-y-2">
                            <div class="flex justify-between items-center">
                                <div class="flex items-center gap-1.5">
                                    <div class="w-2 h-2 rounded-full bg-red-600"></div>
                                    <span class="text-sm font-semibold text-slate-700">Gorduras</span>
                                </div>
                                <span class="text-xs font-bold text-red-600">{{ formularioPlano.gordura_perc }}%</span>
                            </div>
                            <input
                                v-model.number="formularioPlano.gordura_perc"
                                type="range"
                                min="0"
                                max="100"
                                class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                                @input="() => (formularioPlano.gordura_g = Math.round((formularioPlano.calorias_meta * formularioPlano.gordura_perc) / 100 / 9))"
                            />
                        </div>
                    </div>

                    <!-- Info Box -->
                    <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p class="text-xs text-blue-700 flex items-start gap-2">
                            <i class="pi pi-info-circle text-xs flex-shrink-0 mt-0.5"></i>
                            <span>Ajuste os sliders para distribuir as calorias.</span>
                        </p>
                    </div>
                </section>
            </div>

            <!-- Conteúdo do Step 2: Refeições -->
            <div v-if="stepAtualPlano === 2" class="space-y-3 overflow-y-auto pr-4">
                <!-- Barra Sticky de Progresso do Dia -->
                <div class="sticky top-0 z-10 bg-white border-b border-slate-200 p-3 rounded-2xl shadow-sm mb-3 border">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <!-- Calorias Principal -->
                        <div class="border-r border-slate-200 pr-3">
                            <div class="flex items-baseline gap-1 mb-2">
                                <span class="text-2xl font-bold text-slate-800">{{ calcularTotaisDia().total_calorias }}</span>
                                <span class="text-xs text-slate-500">/ {{ formularioPlano.calorias_meta }} kcal</span>
                            </div>
                            <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                    class="h-full rounded-full transition-all"
                                    :class="calcularTotaisDia().perc_calorias < 90 ? 'bg-emerald-600' : calcularTotaisDia().perc_calorias <= 100 ? 'bg-yellow-500' : 'bg-red-600'"
                                    :style="{ width: Math.min(calcularTotaisDia().perc_calorias, 100) + '%' }"
                                ></div>
                            </div>
                        </div>

                        <!-- Macros -->
                        <div class="md:col-span-3 grid grid-cols-3 gap-3">
                            <div>
                                <div class="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                                    <span>Carboidrato</span>
                                    <span class="text-slate-800">{{ calcularTotaisDia().total_carboidrato }}g / {{ formularioPlano.carboidrato_g }}g</span>
                                </div>
                                <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div class="h-full bg-blue-600 rounded-full transition-all" :style="{ width: Math.min(calcularTotaisDia().perc_carboidrato, 100) + '%' }"></div>
                                </div>
                            </div>
                            <div>
                                <div class="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                                    <span>Proteína</span>
                                    <span class="text-slate-800">{{ calcularTotaisDia().total_proteinas }}g / {{ formularioPlano.proteina_g }}g</span>
                                </div>
                                <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div class="h-full bg-red-600 rounded-full transition-all" :style="{ width: Math.min(calcularTotaisDia().perc_proteinas, 100) + '%' }"></div>
                                </div>
                            </div>
                            <div>
                                <div class="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                                    <span>Gordura</span>
                                    <span class="text-slate-800">{{ calcularTotaisDia().total_gordura }}g / {{ formularioPlano.gordura_g }}g</span>
                                </div>
                                <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div class="h-full bg-yellow-500 rounded-full transition-all" :style="{ width: Math.min(calcularTotaisDia().perc_gordura, 100) + '%' }"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Cards de Refeições -->
                <div v-for="(refeicao, refIdx) in formularioPlano.refeicoes" :key="refIdx" class="bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <!-- Header da Refeição -->
                    <div @click="refeicaoExpandida = refeicaoExpandida === refIdx ? null : refIdx" class="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100">
                        <div class="flex items-center gap-2">
                            <div class="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">🍽️</div>
                            <div>
                                <h3 class="text-sm font-semibold text-slate-800">{{ refeicao.nome }}</h3>
                                <span class="text-xs text-slate-500">{{ refeicao.horario }} • {{ refeicao.itens.length }} alimentos</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="text-right">
                                <span class="text-lg font-bold text-slate-800">{{ refeicao.total_calorias }}</span>
                                <span class="text-xs text-slate-500 ml-1">kcal</span>
                                <div
                                    class="text-xs font-semibold mt-1"
                                    :class="
                                        refeicao.meta_calorias === 0
                                            ? 'text-slate-400'
                                            : refeicao.total_calorias >= refeicao.meta_calorias * 0.9 && refeicao.total_calorias <= refeicao.meta_calorias * 1.1
                                              ? 'text-emerald-600'
                                              : refeicao.total_calorias > refeicao.meta_calorias * 1.1
                                                ? 'text-red-600'
                                                : 'text-slate-600'
                                    "
                                >
                                    {{ refeicao.meta_calorias === 0 ? '' : `/ ${refeicao.meta_calorias} kcal` }}
                                </div>
                            </div>
                            <i :class="['pi text-slate-400', refeicaoExpandida === refIdx ? 'pi-chevron-up' : 'pi-chevron-down']"></i>
                        </div>
                    </div>

                    <!-- Mini barra de progresso -->
                    <div v-if="refeicao.meta_calorias > 0" class="h-1 bg-slate-100 overflow-hidden">
                        <div
                            class="h-full transition-all"
                            :class="
                                refeicao.total_calorias >= refeicao.meta_calorias * 0.9 && refeicao.total_calorias <= refeicao.meta_calorias * 1.1
                                    ? 'bg-emerald-600'
                                    : refeicao.total_calorias > refeicao.meta_calorias * 1.1
                                      ? 'bg-red-600'
                                      : 'bg-slate-300'
                            "
                            :style="{ width: Math.min((refeicao.total_calorias / refeicao.meta_calorias) * 100, 100) + '%' }"
                        ></div>
                    </div>

                    <!-- Conteúdo Expandido -->
                    <div v-if="refeicaoExpandida === refIdx" class="p-3 space-y-3">
                        <!-- Tabela de Alimentos -->
                        <div v-if="refeicao.itens.length > 0" class="overflow-x-auto">
                            <table class="w-full text-left text-sm">
                                <thead>
                                    <tr class="text-xs font-bold uppercase text-slate-600 border-b border-slate-200">
                                        <th class="pb-2">Alimento</th>
                                        <th class="pb-2">Qtd.</th>
                                        <th class="pb-2 text-right">Kcal</th>
                                        <th class="pb-2 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                    <tr v-for="(item, itemIdx) in refeicao.itens" :key="itemIdx">
                                        <td class="py-2">
                                            <div class="font-medium text-slate-800">{{ item.nome_alimento }}</div>
                                            <div class="text-xs text-slate-500">{{ item.grupo_alimento }}</div>
                                        </td>
                                        <td class="py-2 text-sm text-slate-700">{{ item.quantidade }}{{ item.unidade }}</td>
                                        <td class="py-2 text-sm font-semibold text-slate-800 text-right">{{ item.calorias_calculadas }} kcal</td>
                                        <td class="py-2 text-right">
                                            <button @click="deletarItem(refIdx, itemIdx)" class="text-slate-400 hover:text-red-600 transition-colors">
                                                <i class="pi pi-trash text-lg"></i>
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr class="border-t border-slate-200">
                                        <td class="pt-3 text-sm font-bold text-slate-800" colspan="2">Subtotal</td>
                                        <td class="pt-3 text-sm font-bold text-emerald-600 text-right">{{ refeicao.total_calorias }} kcal</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <!-- Mensagem vazio -->
                        <div v-else class="text-center py-6 text-slate-500">
                            <p class="text-sm">Nenhum alimento adicionado ainda</p>
                        </div>

                        <!-- Seção de Busca e Adição -->
                        <div class="pt-3 border-t border-slate-200 space-y-2">
                            <label class="block text-xs font-bold text-slate-700 uppercase">Adicionar alimento</label>

                            <div class="relative">
                                <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                                <input
                                    v-model="buscarAlimentoText"
                                    @input="buscarAlimentosDebounce(buscarAlimentoText)"
                                    type="text"
                                    placeholder="Busque por alimento..."
                                    class="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                />

                                <!-- Dropdown de Resultados -->
                                <div v-if="resultadosBusca.length > 0" data-dropdown-results class="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto relative">
                                    <div
                                        v-for="alimento in resultadosBusca"
                                        :key="alimento.id"
                                        data-alimento-item
                                        @click="selecionarAlimento(alimento)"
                                        class="px-4 py-3 hover:bg-emerald-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors"
                                    >
                                        <div class="flex justify-between items-start">
                                            <div>
                                                <div class="text-sm font-medium text-slate-800">{{ alimento.nome }}</div>
                                                <div class="text-xs text-slate-500">100g = {{ alimento.energiaKcal }} kcal</div>
                                            </div>
                                            <i class="pi pi-plus-circle text-emerald-600"></i>
                                        </div>
                                    </div>

                                    <!-- Indicador de Carregamento -->
                                    <div v-if="carregandoMaisAlimentos" class="px-4 py-3 text-center border-t border-slate-100">
                                        <div class="flex items-center justify-center gap-2 text-slate-500">
                                            <i class="pi pi-spin pi-spinner text-xs text-emerald-600"></i>
                                            <span class="text-xs font-medium">Carregando mais...</span>
                                        </div>
                                    </div>

                                    <!-- Indicador de Scroll -->
                                    <div v-else-if="paginaAtualAlimentos < totalPaginasAlimentos" class="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-3 pb-2 text-center">
                                        <div class="flex items-center justify-center gap-2 text-slate-500">
                                            <i class="pi pi-chevron-down text-xs animate-bounce"></i>
                                            <span class="text-xs font-medium">Role para mais</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Formulário de Quantidade (aparece após selecionar alimento) -->
                            <div v-if="formQuantidade.alimento_id" class="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                                <div class="text-sm font-medium text-slate-800">{{ formQuantidade.nome_alimento }}</div>
                                <div class="grid grid-cols-3 gap-2 text-xs">
                                    <div>
                                        <label class="block text-xs font-semibold text-slate-600 mb-1">Qtd.</label>
                                        <InputNumber v-model="formQuantidade.quantidade" :min="0" class="w-full" input-class="text-xs py-1" />
                                    </div>
                                    <div>
                                        <label class="block text-xs font-semibold text-slate-600 mb-1">Unidade</label>
                                        <select v-model="formQuantidade.unidade" class="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
                                            <option value="g">g</option>
                                            <option value="ml">ml</option>
                                            <option value="colher de sopa">colher sopa</option>
                                            <option value="colher de chá">colher chá</option>
                                            <option value="xícara">xícara</option>
                                            <option value="unidade">unidade</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-xs font-semibold text-slate-600 mb-1">Kcal</label>
                                        <div class="w-full px-2 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-lg font-semibold text-slate-800 flex items-center">
                                            {{ calcularNutrienteItem(formQuantidade.alimento, formQuantidade.quantidade, formQuantidade.unidade).calorias }}
                                        </div>
                                    </div>
                                </div>
                                <div class="flex gap-2 text-xs">
                                    <button @click="adicionarItem(refIdx)" class="flex-1 bg-emerald-600 text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                                        <i class="pi pi-plus"></i> Adicionar
                                    </button>
                                    <button @click="formQuantidade.alimento_id = null" class="bg-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-1.5 rounded-lg hover:bg-slate-300 transition-colors">Cancelar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Botão Adicionar Refeição Extra -->
                <button
                    @click="adicionarRefeicaoExtra"
                    class="w-full py-3 border-2 border-dashed border-slate-300 rounded-2xl text-slate-600 font-semibold hover:border-emerald-500 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2"
                >
                    <i class="pi pi-plus"></i> Adicionar refeição extra
                </button>
            </div>

            <!-- Conteúdo do Step 3: Revisão -->
            <div v-if="stepAtualPlano === 3" class="pr-4">
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <!-- COLUNA ESQUERDA (65%) -->
                    <div class="lg:col-span-8 space-y-4">
                        <!-- Card de Resumo do Plano -->
                        <div class="bg-white border border-slate-200 shadow-sm rounded-2xl p-4">
                            <div class="flex items-start justify-between mb-4">
                                <div class="flex-1">
                                    <span class="text-emerald-600 text-xs font-bold tracking-widest uppercase mb-1 block">Resumo do plano</span>
                                    <h2 class="text-xl font-bold text-slate-800">{{ formularioPlano.nome }}</h2>
                                    <p class="text-slate-500 text-sm mt-2">{{ formularioPlano.notas || 'Sem observações' }}</p>
                                </div>
                                <Tag value="ATIVO" severity="success" class="text-xs font-bold uppercase" />
                            </div>

                            <!-- Grid com 4 informações -->
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-slate-200">
                                <div class="text-center">
                                    <p class="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Objetivo</p>
                                    <p class="text-sm font-bold text-slate-800">{{ traduzirObjetivo(formularioPlano.objetivo) }}</p>
                                </div>
                                <div class="text-center">
                                    <p class="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Refeições</p>
                                    <p class="text-sm font-bold text-slate-800">{{ formularioPlano.refeicoes_dia }} por dia</p>
                                </div>
                                <div class="text-center">
                                    <p class="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Calorias</p>
                                    <p class="text-sm font-bold text-slate-800">{{ formatarValor(formularioPlano.calorias_meta) }} kcal</p>
                                </div>
                                <div class="text-center">
                                    <p class="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Observações</p>
                                    <p class="text-sm font-bold text-slate-800">{{ formularioPlano.notas ? 'Sim' : 'Não' }}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Tabela de Refeições -->
                        <div class="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                            <div class="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                                <h3 class="font-bold text-sm text-slate-800">Resumo por refeição</h3>
                                <span class="text-xs text-slate-500">Valores nutricionais</span>
                            </div>
                            <div class="overflow-x-auto">
                                <table class="w-full text-sm">
                                    <thead class="bg-slate-100 border-b border-slate-200">
                                        <tr>
                                            <th class="px-4 py-2 text-left text-xs font-bold uppercase text-slate-600 tracking-wider">Refeição</th>
                                            <th class="px-4 py-2 text-left text-xs font-bold uppercase text-slate-600 tracking-wider">Horário</th>
                                            <th class="px-4 py-2 text-left text-xs font-bold uppercase text-slate-600 tracking-wider">Proteína</th>
                                            <th class="px-4 py-2 text-left text-xs font-bold uppercase text-slate-600 tracking-wider">Carbo</th>
                                            <th class="px-4 py-2 text-left text-xs font-bold uppercase text-slate-600 tracking-wider">Gordura</th>
                                            <th class="px-4 py-2 text-right text-xs font-bold uppercase text-slate-600 tracking-wider">Calorias</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-slate-100">
                                        <tr v-for="(refeicao, idx) in formularioPlano.refeicoes" :key="idx" class="hover:bg-slate-50 transition-colors">
                                            <td class="px-4 py-2 text-sm font-medium text-slate-800">{{ refeicao.nome }}</td>
                                            <td class="px-4 py-2 text-sm text-slate-600">{{ refeicao.horario || '—' }}</td>
                                            <td class="px-4 py-2 text-sm text-slate-600">{{ formatarValor(refeicao.total_proteinas_g) }}g</td>
                                            <td class="px-4 py-2 text-sm text-slate-600">{{ formatarValor(refeicao.total_carboidrato_g) }}g</td>
                                            <td class="px-4 py-2 text-sm text-slate-600">{{ formatarValor(refeicao.total_gordura_g) }}g</td>
                                            <td class="px-4 py-2 text-right text-sm font-bold text-slate-800">{{ formatarValor(refeicao.total_calorias) }} kcal</td>
                                        </tr>
                                        <!-- Total do Dia -->
                                        <tr class="bg-emerald-50 border-t-2 border-emerald-200 font-bold">
                                            <td class="px-4 py-2 text-sm text-emerald-900" colspan="5">TOTAL DO DIA</td>
                                            <td class="px-4 py-2 text-right text-sm text-emerald-600">{{ formatarValor(calcularTotaisDia().total_calorias) }} kcal</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- COLUNA DIREITA (35%) -->
                    <div class="lg:col-span-4 space-y-4">
                        <!-- Card: Metas vs Realizado -->
                        <div class="bg-white border border-slate-200 shadow-sm rounded-2xl p-4">
                            <h3 class="font-bold text-sm text-slate-800 mb-4">Metas vs Realizado</h3>
                            <div class="space-y-3">
                                <!-- Calorias -->
                                <div>
                                    <div class="flex justify-between items-end mb-1">
                                        <span class="text-xs font-semibold text-slate-600 uppercase">Calorias (kcal)</span>
                                        <span class="text-sm font-bold text-slate-800">{{ formatarValor(calcularTotaisDia().total_calorias) }} / {{ formatarValor(formularioPlano.calorias_meta) }}</span>
                                    </div>
                                    <div class="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div class="h-full bg-emerald-600 transition-all" :style="{ width: Math.min(calcularTotaisDia().perc_calorias, 100) + '%' }"></div>
                                    </div>
                                </div>

                                <!-- Proteínas -->
                                <div>
                                    <div class="flex justify-between items-end mb-1">
                                        <span class="text-xs font-semibold text-slate-600 uppercase">Proteínas</span>
                                        <span class="text-xs font-bold text-slate-800">{{ formatarValor(calcularTotaisDia().total_proteinas) }}g</span>
                                    </div>
                                    <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div class="h-full bg-red-500 transition-all" :style="{ width: Math.min(calcularTotaisDia().perc_proteinas, 100) + '%' }"></div>
                                    </div>
                                </div>

                                <!-- Carboidratos -->
                                <div>
                                    <div class="flex justify-between items-end mb-1">
                                        <span class="text-xs font-semibold text-slate-600 uppercase">Carboidratos</span>
                                        <span class="text-xs font-bold text-slate-800">{{ formatarValor(calcularTotaisDia().total_carboidrato) }}g</span>
                                    </div>
                                    <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div class="h-full bg-blue-500 transition-all" :style="{ width: Math.min(calcularTotaisDia().perc_carboidrato, 100) + '%' }"></div>
                                    </div>
                                </div>

                                <!-- Gorduras -->
                                <div>
                                    <div class="flex justify-between items-end mb-1">
                                        <span class="text-xs font-semibold text-slate-600 uppercase">Gorduras</span>
                                        <span class="text-xs font-bold text-slate-800">{{ formatarValor(calcularTotaisDia().total_gordura) }}g</span>
                                    </div>
                                    <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div class="h-full bg-yellow-500 transition-all" :style="{ width: Math.min(calcularTotaisDia().perc_gordura, 100) + '%' }"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Card: Comparativo com a Meta -->
                        <div class="bg-white border border-slate-200 shadow-sm rounded-2xl p-4" :class="obterStatusComparativo().classe">
                            <div class="flex items-start gap-3 mb-4">
                                <i :class="['pi', obterStatusComparativo().icone, 'text-2xl', obterStatusComparativo().textoClasse]"></i>
                                <div>
                                    <h4 class="font-bold" :class="obterStatusComparativo().textoClasse">{{ obterStatusComparativo().titulo }}</h4>
                                    <p class="text-xs mt-1" :class="obterStatusComparativo().textoClasse">{{ obterStatusComparativo().descricao }}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Card: Gráfico de Distribuição de Macros -->
                        <div class="bg-white border border-slate-200 shadow-sm rounded-2xl p-4">
                            <h4 class="font-bold text-slate-800 mb-3 text-xs">Distribuição de Macros</h4>
                            <div class="flex justify-center mb-4" style="height: 140px">
                                <Chart
                                    type="doughnut"
                                    :data="{
                                        labels: ['Proteínas', 'Carboidratos', 'Gorduras'],
                                        datasets: [
                                            {
                                                data: [formularioPlano.proteina_perc, formularioPlano.carboidrato_perc, formularioPlano.gordura_perc],
                                                backgroundColor: ['#ef4444', '#3b82f6', '#eab308'],
                                                borderColor: '#ffffff',
                                                borderWidth: 2
                                            }
                                        ]
                                    }"
                                    :options="{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: { display: false },
                                            tooltip: { enabled: true }
                                        }
                                    }"
                                />
                            </div>

                            <!-- Legenda -->
                            <div class="space-y-1.5 text-xs">
                                <div class="flex items-center gap-2">
                                    <span class="w-3 h-3 rounded-full bg-red-500"></span>
                                    <span class="font-medium text-slate-700">{{ formularioPlano.proteina_perc }}% Proteínas</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="w-3 h-3 rounded-full bg-blue-500"></span>
                                    <span class="font-medium text-slate-700">{{ formularioPlano.carboidrato_perc }}% Carbo</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="w-3 h-3 rounded-full bg-yellow-500"></span>
                                    <span class="font-medium text-slate-700">{{ formularioPlano.gordura_perc }}% Gorduras</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Conteúdo do Step 4: Enviar -->
            <div v-if="stepAtualPlano === 4" class="max-h-[calc(95vh-300px)] overflow-y-auto flex items-center justify-center">
                <div class="text-center">
                    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-6">
                        <i class="pi pi-check text-3xl text-emerald-600"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-slate-800 mb-2">✅ Plano salvo com sucesso!</h2>
                    <p class="text-slate-500">O plano alimentar foi registrado no sistema.</p>
                </div>
            </div>

            <!-- Footer -->
            <template #footer>
                <div class="flex items-center justify-between">
                    <!-- Botão Voltar (exceto Step 1) -->
                    <Button v-if="stepAtualPlano > 1" label="Voltar" severity="secondary" @click="stepAtualPlano--" icon="pi pi-chevron-left" />

                    <!-- Botões Direita -->
                    <div class="flex gap-3 ml-auto">
                        <!-- Cancelar (sempre) -->
                        <Button label="Cancelar" severity="secondary" @click="fecharCriacaoPlano" />

                        <!-- Descartar + Salvar (Step 3) -->
                        <div v-if="stepAtualPlano === 3" class="flex gap-2">
                            <!-- <Button
                                label="Descartar"
                                severity="secondary"
                                @click="
                                    () => {
                                        if (confirm('Tem certeza que deseja descartar este plano? Todos os dados serão perdidos.')) {
                                            fecharCriacaoPlano();
                                        }
                                    }
                                "
                            /> -->
                            <Button label="Salvar plano" severity="success" icon="pi pi-check" :loading="loadingCriacaoPlano" @click="salvarPlano" />
                        </div>

                        <!-- Próximo (Steps 1-2) e Enviar (Step 4) -->
                        <Button v-if="stepAtualPlano < 3" label="Próximo" severity="success" @click="avancarStep" icon="pi pi-chevron-right" icon-pos="right" />
                        <Button v-if="stepAtualPlano === 4" label="Enviar Plano" severity="success" icon="pi pi-send" :loading="loadingCriacaoPlano" @click="salvarPlano" />
                    </div>
                </div>
            </template>
        </Dialog>
        <!-- END: Dialog Criar Plano Alimentar -->
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
