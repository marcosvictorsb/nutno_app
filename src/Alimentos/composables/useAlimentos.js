import AlimentoService from '@/service/AlimentoService';
import { useToast } from 'primevue/usetoast';
import { computed, ref, watch } from 'vue';

export function useAlimentos() {
    const toast = useToast();

    // Estado
    const alimentos = ref([]);
    const total = ref(0);
    const totalPaginas = ref(0);
    const carregando = ref(false);
    const alimentoSelecionado = ref(null);
    const modalDetalhesAberto = ref(false);
    const modalNovoAberto = ref(false);
    const erroFormulario = ref({});
    const salvando = ref(false);
    let debounceTimer = null;

    const filtros = ref({
        busca: '',
        grupo: '',
        fonte: '',
        pagina: 1,
        limite: 20
    });

    // Computed
    const totalAtivos = computed(() => {
        return `Exibindo ${alimentos.value.length} de ${total.value} resultados`;
    });

    // Funções
    const buscarAlimentos = async () => {
        try {
            carregando.value = true;
            const response = await AlimentoService.buscarAlimentos(filtros.value);

            // A resposta vem com: { success, message, data: { dados, total, pagina, totalPaginas } }
            alimentos.value = response.data.data.dados || [];
            total.value = response.data.data.total || 0;
            totalPaginas.value = response.data.data.totalPaginas || 1;
            filtros.value.pagina = response.data.data.pagina || 1;
        } catch (erro) {
            console.error('Erro ao buscar alimentos:', erro);
            toast.add({
                severity: 'error',
                summary: 'Erro',
                detail: 'Falha ao carregar alimentos',
                life: 3000
            });
        } finally {
            carregando.value = false;
        }
    };

    const abrirDetalhes = (alimento) => {
        alimentoSelecionado.value = alimento;
        modalDetalhesAberto.value = true;
    };

    const fecharDetalhes = () => {
        modalDetalhesAberto.value = false;
        setTimeout(() => {
            alimentoSelecionado.value = null;
        }, 300);
    };

    const criarAlimento = async (form) => {
        // Validar campos obrigatórios
        const erros = {};

        if (!form.nome || form.nome.trim() === '') {
            erros.nome = 'Nome é obrigatório';
        } else if (form.nome.length < 3) {
            erros.nome = 'Nome deve ter no mínimo 3 caracteres';
        }

        if (!form.grupo) {
            erros.grupo = 'Grupo é obrigatório';
        }

        if (!AlimentoService.isValorValido(form.energiaKcal) || form.energiaKcal < 0) {
            erros.energiaKcal = 'Energia (kcal) é obrigatória';
        }

        if (!AlimentoService.isValorValido(form.proteina) || form.proteina < 0) {
            erros.proteina = 'Proteína é obrigatória';
        }

        if (!AlimentoService.isValorValido(form.lipidios) || form.lipidios < 0) {
            erros.lipidios = 'Gorduras totais é obrigatória';
        }

        if (!AlimentoService.isValorValido(form.carboidrato) || form.carboidrato < 0) {
            erros.carboidrato = 'Carboidratos é obrigatório';
        }

        if (Object.keys(erros).length > 0) {
            erroFormulario.value = erros;
            return;
        }

        try {
            salvando.value = true;
            erroFormulario.value = {};

            const dados = {
                nome: form.nome.trim(),
                nomeCientifico: form.nomeCientifico || null,
                grupo: form.grupo,
                energiaKcal: parseFloat(form.energiaKcal),
                energiaKj: form.energiaKj ? parseFloat(form.energiaKj) : null,
                proteina: parseFloat(form.proteina),
                lipidios: parseFloat(form.lipidios),
                carboidrato: parseFloat(form.carboidrato),
                fibra: form.fibra ? parseFloat(form.fibra) : null,
                sodio: form.sodio ? parseFloat(form.sodio) : null,
                umidade: form.umidade ? parseFloat(form.umidade) : null,
                calcio: form.calcio ? parseFloat(form.calcio) : null,
                ferro: form.ferro ? parseFloat(form.ferro) : null,
                potassio: form.potassio ? parseFloat(form.potassio) : null,
                magnesio: form.magnesio ? parseFloat(form.magnesio) : null,
                fosforo: form.fosforo ? parseFloat(form.fosforo) : null,
                zinco: form.zinco ? parseFloat(form.zinco) : null,
                vitaminaC: form.vitaminaC ? parseFloat(form.vitaminaC) : null,
                vitaminaA_re: form.vitaminaA_re ? parseFloat(form.vitaminaA_re) : null,
                colesterol: form.colesterol ? parseFloat(form.colesterol) : null,
                gorduraSaturada: form.gorduraSaturada ? parseFloat(form.gorduraSaturada) : null,
                gordurasTrans: form.gordurasTrans ? parseFloat(form.gordurasTrans) : null
            };

            await AlimentoService.criarAlimento(dados);

            modalNovoAberto.value = false;
            toast.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'Alimento cadastrado com sucesso!',
                life: 3000
            });

            // Resetar filtros e recarregar
            filtros.value.pagina = 1;
            await buscarAlimentos();
        } catch (erro) {
            console.error('Erro ao criar alimento:', erro);

            if (erro.response?.status === 409) {
                erroFormulario.value.nome = 'Você já tem um alimento com esse nome';
            } else {
                toast.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: erro.response?.data?.message || 'Falha ao criar alimento',
                    life: 3000
                });
            }
        } finally {
            salvando.value = false;
        }
    };

    const atualizarAlimento = async (id, form) => {
        // Validar campos obrigatórios
        const erros = {};

        if (!form.nome || form.nome.trim() === '') {
            erros.nome = 'Nome é obrigatório';
        } else if (form.nome.length < 3) {
            erros.nome = 'Nome deve ter no mínimo 3 caracteres';
        }

        if (!form.grupo) {
            erros.grupo = 'Grupo é obrigatório';
        }

        if (!AlimentoService.isValorValido(form.energiaKcal) || form.energiaKcal < 0) {
            erros.energiaKcal = 'Energia (kcal) é obrigatória';
        }

        if (!AlimentoService.isValorValido(form.proteina) || form.proteina < 0) {
            erros.proteina = 'Proteína é obrigatória';
        }

        if (!AlimentoService.isValorValido(form.lipidios) || form.lipidios < 0) {
            erros.lipidios = 'Gorduras totais é obrigatória';
        }

        if (!AlimentoService.isValorValido(form.carboidrato) || form.carboidrato < 0) {
            erros.carboidrato = 'Carboidratos é obrigatório';
        }

        if (Object.keys(erros).length > 0) {
            erroFormulario.value = erros;
            return;
        }

        try {
            salvando.value = true;
            erroFormulario.value = {};

            const dados = {
                nome: form.nome.trim(),
                nomeCientifico: form.nomeCientifico || null,
                grupo: form.grupo,
                energiaKcal: parseFloat(form.energiaKcal),
                energiaKj: form.energiaKj ? parseFloat(form.energiaKj) : null,
                proteina: parseFloat(form.proteina),
                lipidios: parseFloat(form.lipidios),
                carboidrato: parseFloat(form.carboidrato),
                fibra: form.fibra ? parseFloat(form.fibra) : null,
                sodio: form.sodio ? parseFloat(form.sodio) : null,
                umidade: form.umidade ? parseFloat(form.umidade) : null,
                calcio: form.calcio ? parseFloat(form.calcio) : null,
                ferro: form.ferro ? parseFloat(form.ferro) : null,
                potassio: form.potassio ? parseFloat(form.potassio) : null,
                magnesio: form.magnesio ? parseFloat(form.magnesio) : null,
                fosforo: form.fosforo ? parseFloat(form.fosforo) : null,
                zinco: form.zinco ? parseFloat(form.zinco) : null,
                vitaminaC: form.vitaminaC ? parseFloat(form.vitaminaC) : null,
                vitaminaA_re: form.vitaminaA_re ? parseFloat(form.vitaminaA_re) : null,
                colesterol: form.colesterol ? parseFloat(form.colesterol) : null,
                gorduraSaturada: form.gorduraSaturada ? parseFloat(form.gorduraSaturada) : null,
                gordurasTrans: form.gordurasTrans ? parseFloat(form.gordurasTrans) : null
            };

            await AlimentoService.atualizarAlimento(id, dados);

            // Atualizar item na lista
            const index = alimentos.value.findIndex((a) => a.id === id);
            if (index !== -1) {
                alimentos.value[index] = { ...alimentos.value[index], ...dados };
            }

            // Atualizar alimento selecionado
            if (alimentoSelecionado.value && alimentoSelecionado.value.id === id) {
                alimentoSelecionado.value = { ...alimentoSelecionado.value, ...dados };
            }

            fecharDetalhes();
            toast.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'Alimento atualizado com sucesso!',
                life: 3000
            });
        } catch (erro) {
            console.error('Erro ao atualizar alimento:', erro);

            if (erro.response?.status === 409) {
                erroFormulario.value.nome = 'Você já tem um alimento com esse nome';
            } else {
                toast.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: erro.response?.data?.message || 'Falha ao atualizar alimento',
                    life: 3000
                });
            }
        } finally {
            salvando.value = false;
        }
    };

    const deletarAlimento = async (id) => {
        try {
            await AlimentoService.deletarAlimento(id);

            // Remover da lista local
            alimentos.value = alimentos.value.filter((a) => a.id !== id);
            total.value -= 1;

            toast.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: 'Alimento removido com sucesso!',
                life: 3000
            });
        } catch (erro) {
            console.error('Erro ao deletar alimento:', erro);

            if (erro.response?.status === 409) {
                toast.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Este alimento está sendo usado em um plano ativo',
                    life: 3000
                });
            } else {
                toast.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Falha ao deletar alimento',
                    life: 3000
                });
            }
        }
    };

    const mudarPagina = (pagina) => {
        filtros.value.pagina = pagina;
        buscarAlimentos();
        // Scroll suave ao topo
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const mudarLimite = (novoLimite) => {
        filtros.value.limite = novoLimite;
        filtros.value.pagina = 1; // Voltar para página 1 ao mudar limite
        buscarAlimentos();
        // Scroll suave ao topo
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const atualizarFiltros = (novosFiltros) => {
        filtros.value = { ...filtros.value, ...novosFiltros };
    };

    // Watchers para debounce e resets
    watch(
        () => filtros.value.busca,
        () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                filtros.value.pagina = 1;
                buscarAlimentos();
            }, 400);
        }
    );

    watch(
        () => filtros.value.grupo,
        () => {
            filtros.value.pagina = 1;
            buscarAlimentos();
        }
    );

    watch(
        () => filtros.value.fonte,
        () => {
            filtros.value.pagina = 1;
            buscarAlimentos();
        }
    );

    // Inicializar
    const inicializar = () => {
        buscarAlimentos();
    };

    return {
        // State
        alimentos,
        total,
        totalPaginas,
        carregando,
        alimentoSelecionado,
        modalDetalhesAberto,
        modalNovoAberto,
        erroFormulario,
        salvando,
        filtros,

        // Computed
        totalAtivos,

        // Methods
        buscarAlimentos,
        abrirDetalhes,
        fecharDetalhes,
        criarAlimento,
        atualizarAlimento,
        deletarAlimento,
        mudarPagina,
        mudarLimite,
        atualizarFiltros,
        inicializar
    };
}
