<template>
    <div class="mx-auto">
        <div v-if="loadingPlanos" class="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-emerald-50">
            <i class="pi pi-spin pi-spinner text-5xl text-emerald-600 mb-4"></i>
            <p class="text-gray-600 font-medium">Carregando planos alimentares...</p>
        </div>

        <div v-else-if="!loadingPlanos && planos.length === 0" class="bg-white rounded-2xl shadow-sm border border-emerald-50 p-8 mx-auto">
            <div class="text-center space-y-6">
                <div class="flex justify-center">
                    <div class="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center"><i class="pi pi-list text-5xl text-orange-500"></i></div>
                </div>
                <div>
                    <h3 class="text-2xl font-bold text-gray-900 mb-2">Nenhum Plano Alimentar Cadastrado</h3>
                    <p class="text-gray-500 text-base leading-relaxed">Este paciente ainda nao possui um plano alimentar.<br />Clique no botao abaixo para criar o primeiro plano alimentar personalizado.</p>
                </div>
                <Button label="Criar Plano Alimentar" icon="pi pi-plus" @click="$emit('criar-plano')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold w-full sm:w-auto justify-center" size="large" />
            </div>
        </div>

        <div v-else-if="!loadingPlanos && planos.length > 0" class="space-y-3">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-bold text-slate-800">Planos Alimentares</h2>
                <Button label="Novo Plano" icon="pi pi-plus" severity="success" @click="$emit('criar-plano')" />
            </div>

            <div class="space-y-3">
                <template v-for="plano in planos" :key="plano.id">
                    <div v-if="plano.status === 'ativo'" class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div class="flex-1">
                                <div class="flex items-baseline gap-3 mb-3">
                                    <Tag value="ATIVO" severity="success" class="text-xs font-bold uppercase" />
                                    <h4 class="text-xl font-semibold text-slate-800">{{ plano.nome }}</h4>
                                </div>
                                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                                    <div class="bg-slate-50 p-3 rounded-xl">
                                        <p class="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-tight">Energia</p>
                                        <p class="text-lg font-bold text-slate-800">{{ plano.calorias_objetivo }}<span class="text-xs font-normal text-slate-500">kcal</span></p>
                                    </div>
                                    <div class="bg-slate-50 p-3 rounded-xl">
                                        <p class="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-tight">Proteina</p>
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
                                <div class="flex items-center gap-2 text-sm text-slate-500">
                                    <i class="pi pi-calendar text-base"></i><span v-if="plano.enviado_em">Enviado em {{ formatarDataBrasileira(plano.enviado_em) }}</span
                                    ><span v-else>Criado em {{ formatarDataBrasileira(plano.criado_em) }}</span>
                                </div>
                            </div>
                            <div class="flex flex-row md:flex-col gap-2 justify-end">
                                <Button icon="pi pi-send" label="Enviar" severity="help" @click="$emit('enviar-plano', plano.id)" />
                                <Button icon="pi pi-pencil" label="Editar" severity="info" @click="$emit('editar-plano', plano.id)" />
                                <Button icon="pi pi-inbox" label="Arquivar" severity="warn" @click="$emit('arquivar-plano', plano.id)" />
                            </div>
                        </div>
                    </div>

                    <div v-else-if="plano.status === 'rascunho'" class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500"><span class="material-symbols-outlined text-2xl" data-icon="edit_note">edit_note</span></div>
                                <div>
                                    <div class="flex items-baseline gap-2 mb-0.5">
                                        <Tag value="RASCUNHO" severity="warning" class="text-xs font-bold uppercase" />
                                        <h4 class="text-sm font-semibold text-slate-800">{{ plano.nome }}</h4>
                                    </div>
                                    <p class="text-xs text-slate-500">Ultima edicao {{ formatarDataBrasileira(plano.atualizado_em) }}</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <Button label="Arquivar" severity="warn" @click="$emit('arquivar-plano', plano.id)" />
                                <Button v-if="planoTemRefeicoes(plano)" label="Enviar" severity="help" @click="$emit('enviar-plano', plano.id)" />
                                <Button label="Continuar" severity="info" @click="$emit('editar-plano', plano.id)" />
                            </div>
                        </div>
                    </div>

                    <div v-else-if="plano.status === 'arquivado'" class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 opacity-80">
                        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500"><span class="material-symbols-outlined text-2xl" data-icon="inventory_2">inventory_2</span></div>
                                <div>
                                    <div class="flex items-center gap-2 mb-0.5">
                                        <Tag value="ARQUIVADO" severity="secondary" class="text-xs font-bold uppercase" />
                                        <h4 class="text-sm font-semibold text-slate-800">{{ plano.nome }}</h4>
                                    </div>
                                    <p class="text-xs text-slate-500">Finalizado em {{ formatarDataBrasileira(plano.atualizado_em) }}</p>
                                </div>
                            </div>
                            <Button icon="pi pi-check" label="Ativar" severity="success" @click="$emit('ativar-plano', plano.id)" />
                        </div>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<script setup>
import Button from 'primevue/button';
import Tag from 'primevue/tag';

defineProps({
    loadingPlanos: {
        type: Boolean,
        default: false
    },
    planos: {
        type: Array,
        default: () => []
    },
    formatarDataBrasileira: {
        type: Function,
        required: true
    }
});

defineEmits(['criar-plano', 'editar-plano', 'deletar-plano', 'enviar-plano', 'arquivar-plano', 'ativar-plano']);

// Helper function to check if plan has meals with items
const planoTemRefeicoes = (plano) => {
    if (!plano || !plano.refeicoes || !Array.isArray(plano.refeicoes)) {
        return false;
    }
    return plano.refeicoes.some((refeicao) => refeicao.itens && Array.isArray(refeicao.itens) && refeicao.itens.length > 0);
};
</script>
