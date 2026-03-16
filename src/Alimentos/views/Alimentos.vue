<script setup>
import BuscaFiltros from '@/Alimentos/components/BuscaFiltros.vue';
import ModalDetalhes from '@/Alimentos/components/ModalDetalhes.vue';
import ModalNovoAlimento from '@/Alimentos/components/ModalNovoAlimento.vue';
import TabelaAlimentos from '@/Alimentos/components/TabelaAlimentos.vue';
import { useAlimentos } from '@/Alimentos/composables/useAlimentos';
import ConfirmDialog from 'primevue/confirmdialog';
import { useConfirm } from 'primevue/useconfirm';
import { onMounted } from 'vue';

const confirm = useConfirm();

const {
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
    totalAtivos,
    abrirDetalhes,
    fecharDetalhes,
    criarAlimento,
    atualizarAlimento,
    deletarAlimento,
    mudarPagina,
    mudarLimite,
    atualizarFiltros,
    inicializar
} = useAlimentos();

const formatarTotal = (valor) => {
    return valor.toLocaleString('pt-BR');
};

const confirmarDelecao = (id) => {
    confirm.require({
        group: 'alimentos',
        message: 'Tem certeza que deseja deletar este alimento?',
        header: 'Confirmar deleção',
        icon: 'pi pi-exclamation-triangle',
        rejectLabel: 'Cancelar',
        acceptLabel: 'Deletar',
        accept: () => {
            deletarAlimento(id);
        }
    });
};

onMounted(() => {
    inicializar();
});
</script>

<template>
    <div class="space-y-8">
        <!-- ConfirmDialog -->
        <ConfirmDialog group="alimentos">
            <template #message="slotProps">
                <div class="flex items-center gap-3">
                    <span class="material-symbols-outlined text-2xl text-red-500">warning</span>
                    <span>{{ slotProps.message.message }}</span>
                </div>
            </template>
        </ConfirmDialog>

        <!-- Header -->
        <div class="flex items-end justify-between">
            <div>
                <h1 class="text-3xl font-bold tracking-tight text-gray-800">Alimentos</h1>
                <p class="text-gray-600 mt-1">Tabela TACO + TBCA · {{ formatarTotal(total) }} alimentos disponíveis</p>
            </div>
            <button @click="modalNovoAberto = true" class="px-6 py-2.5 bg-[#16a34a] text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-green-700 transition shadow-sm">
                <span class="material-symbols-outlined">add</span>
                Novo alimento
            </button>
        </div>

        <!-- Busca e Filtros -->
        <BuscaFiltros :filtros="filtros" :totalAtivos="totalAtivos" @update:filtros="atualizarFiltros" />

        <!-- Tabela -->
        <TabelaAlimentos
            :alimentos="alimentos"
            :carregando="carregando"
            :pagina="filtros.pagina"
            :totalPaginas="totalPaginas"
            :total="total"
            :limite="filtros.limite"
            @abrirDetalhes="abrirDetalhes"
            @deletar="confirmarDelecao"
            @mudarPagina="mudarPagina"
            @mudarLimite="mudarLimite"
            @abrirNovo="modalNovoAberto = true"
        />

        <!-- Modal Detalhes -->
        <ModalDetalhes :aberto="modalDetalhesAberto" :alimento="alimentoSelecionado" :salvando="salvando" :erros="erroFormulario" @fechar="fecharDetalhes" @salvar="(id, form) => atualizarAlimento(id, form)" />

        <!-- Modal Novo -->
        <ModalNovoAlimento :aberto="modalNovoAberto" :salvando="salvando" :erros="erroFormulario" @fechar="modalNovoAberto = false" @salvar="criarAlimento" />
    </div>
</template>
