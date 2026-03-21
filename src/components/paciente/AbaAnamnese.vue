<script setup>
import AnamneseService from '@/service/AnamneseService';
import Button from 'primevue/button';
import Tag from 'primevue/tag';

defineProps({
    loadingAnamnese: {
        type: Boolean,
        default: false
    },
    erroAnamnese: {
        type: [String, Object],
        default: null
    },
    anamnese: {
        type: Object,
        default: null
    }
});

defineEmits(['criar-anamnese', 'editar-anamnese', 'enviar-formulario']);
</script>

<template>
    <div class="mx-auto">
        <div v-if="loadingAnamnese" class="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-emerald-50">
            <i class="pi pi-spin pi-spinner text-5xl text-emerald-600 mb-4"></i>
            <p class="text-gray-600 font-medium">Carregando anamnese...</p>
        </div>

        <div v-else-if="erroAnamnese && !anamnese" class="bg-white rounded-2xl shadow-sm border border-emerald-50 p-8">
            <div class="flex items-start gap-4 mb-6">
                <div class="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <i class="pi pi-inbox text-2xl text-amber-500"></i>
                </div>
                <div class="flex-1">
                    <h3 class="text-lg font-bold text-gray-900">Formulario de Anamnese Nao Preenchido</h3>
                    <p class="text-sm text-gray-500 mt-1">O paciente ainda nao preencheu o formulario de anamnese</p>
                </div>
            </div>

            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button label="Criar Anamnese" icon="pi pi-plus" @click="$emit('criar-anamnese')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" size="lg" />
                <Button label="Enviar Formulario" icon="pi pi-envelope" severity="secondary" text @click="$emit('enviar-formulario')" size="small" />
            </div>
        </div>

        <div v-else-if="anamnese" class="space-y-6">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-slate-800">Dados da Anamnese</h2>
                <Button label="Editar Anamnese" icon="pi pi-pencil" @click="$emit('editar-anamnese')" class="bg-emerald-600 hover:bg-emerald-700" />
            </div>

            <div class="bg-white rounded-2xl shadow-sm border border-emerald-50 p-8">
                <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <i class="pi pi-user text-emerald-500 text-lg"></i>
                    Identificacao
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="p-4 bg-slate-50 rounded-lg">
                        <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Telefone</p>
                        <p class="text-slate-700 font-medium">{{ anamnese.telefone || 'Nao informado' }}</p>
                    </div>
                    <div class="p-4 bg-slate-50 rounded-lg">
                        <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">WhatsApp</p>
                        <p class="text-slate-700 font-medium">{{ anamnese.whatsapp || 'Nao informado' }}</p>
                    </div>
                </div>
            </div>

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
                        <Tag :value="anamnese.fez_acompanhamento_antes ? 'Sim' : 'Nao'" :severity="anamnese.fez_acompanhamento_antes ? 'success' : 'secondary'" />
                    </div>
                    <div v-if="anamnese.qual_acompanhamento" class="p-4 bg-slate-50 rounded-lg md:col-span-2">
                        <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Qual Acompanhamento</p>
                        <p class="text-slate-700">{{ anamnese.qual_acompanhamento }}</p>
                    </div>
                </div>
            </div>

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
                        <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Descricao do Objetivo</p>
                        <p class="text-slate-700">{{ anamnese.objetivo_descricao || 'Nao informado' }}</p>
                    </div>
                    <div class="p-4 bg-slate-50 rounded-lg">
                        <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Maior Dificuldade com Alimentacao</p>
                        <p class="text-slate-700">{{ anamnese.maior_dificuldade_alimentacao || 'Nao informado' }}</p>
                    </div>
                </div>
            </div>

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
                        <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Cafe da Manha</p>
                        <p class="text-lg font-bold text-emerald-600">{{ anamnese.horario_cafe_manha }}</p>
                    </div>
                    <div class="p-4 bg-slate-50 rounded-lg">
                        <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Almoco</p>
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
                        <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Pratica Exercicios</p>
                        <Tag :value="anamnese.faz_exercicios ? 'Sim' : 'Nao'" :severity="anamnese.faz_exercicios ? 'success' : 'secondary'" />
                    </div>
                    <div v-if="anamnese.faz_exercicios" class="p-4 bg-slate-50 rounded-lg">
                        <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Qual Exercicio</p>
                        <p class="text-slate-700 font-medium">{{ anamnese.qual_exercicio }} ({{ anamnese.frequencia_exercicio_semana }}x/semana)</p>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-2xl shadow-sm border border-emerald-50 p-8">
                <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3"><i class="pi pi-heart text-emerald-500 text-lg"></i>Alimentacao</h3>
                <div class="grid grid-cols-1 gap-6">
                    <div class="p-4 bg-slate-50 rounded-lg">
                        <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Alimentos que Ama</p>
                        <p class="text-slate-700">{{ anamnese.alimentos_que_ama || 'Nao informado' }}</p>
                    </div>
                    <div class="p-4 bg-slate-50 rounded-lg">
                        <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Alimentos que Odeia</p>
                        <p class="text-slate-700">{{ anamnese.alimentos_que_odeia || 'Nao informado' }}</p>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="p-4 bg-slate-50 rounded-lg">
                            <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Restricao Alimentar</p>
                            <p class="text-slate-700 font-medium">{{ AnamneseService.formatarValor('restricao_alimentar', anamnese.restricao_alimentar) }}</p>
                            <div v-if="anamnese.restricao_alimentar && anamnese.restricao_alimentar !== 'nenhuma' && anamnese.restricao_descricao" class="mt-3 pt-3 border-t border-slate-200">
                                <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Detalhes</p>
                                <p class="text-slate-700 text-sm">{{ anamnese.restricao_descricao }}</p>
                            </div>
                        </div>
                        <div class="p-4 bg-slate-50 rounded-lg">
                            <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Copos de Agua por Dia</p>
                            <p class="text-lg font-bold text-emerald-600">{{ anamnese.copos_agua_por_dia }}</p>
                        </div>
                    </div>
                    <div class="p-4 bg-slate-50 rounded-lg">
                        <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Alergias Alimentares</p>
                        <p class="text-slate-700">{{ anamnese.alergias_alimentares || 'Nenhuma' }}</p>
                    </div>
                    <div class="p-4 bg-slate-50 rounded-lg">
                        <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Consumo de Alcool</p>
                        <p class="text-slate-700 font-medium">{{ AnamneseService.formatarValor('consumo_alcool', anamnese.consumo_alcool) }}</p>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-2xl shadow-sm border border-emerald-50 p-8 mb-6">
                <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3"><i class="pi pi-heart text-red-500 text-lg"></i>Saude</h3>
                <div class="space-y-6">
                    <div class="p-4 bg-slate-50 rounded-lg">
                        <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Doencas Diagnosticadas</p>
                        <p class="text-slate-700">{{ anamnese.doencas_diagnosticadas || 'Nenhuma' }}</p>
                    </div>
                    <div class="p-4 bg-slate-50 rounded-lg">
                        <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Medicamentos</p>
                        <p class="text-slate-700">{{ anamnese.medicamentos || 'Nenhum' }}</p>
                    </div>
                    <div class="p-4 bg-slate-50 rounded-lg">
                        <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Historico Familiar</p>
                        <p class="text-slate-700">{{ anamnese.historico_familiar || 'Nenhum' }}</p>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="p-4 bg-slate-50 rounded-lg">
                            <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Qualidade do Sono</p>
                            <p class="text-slate-700 font-medium">{{ AnamneseService.formatarValor('qualidade_sono', anamnese.qualidade_sono) }}</p>
                        </div>
                        <div class="p-4 bg-slate-50 rounded-lg">
                            <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Nivel de Estresse</p>
                            <p class="text-lg font-bold text-emerald-600">{{ anamnese.nivel_estresse }} / 5</p>
                        </div>
                    </div>
                    <div class="p-4 bg-slate-50 rounded-lg">
                        <p class="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Observacoes Adicionais</p>
                        <p class="text-slate-700">{{ anamnese.observacoes_livres || 'Nenhuma' }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
