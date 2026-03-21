<script setup>
import MedidaService from '@/service/MedidaService';
import Button from 'primevue/button';

defineProps({
    loadingMedidas: {
        type: Boolean,
        default: false
    },
    medidas: {
        type: Array,
        default: () => []
    },
    medidaSelecionada: {
        type: Object,
        default: null
    }
});

defineEmits(['criar-medida', 'visualizar-medida', 'deletar-medida']);
</script>

<template>
    <div class="mx-auto">
        <div v-if="loadingMedidas" class="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-emerald-50">
            <i class="pi pi-spin pi-spinner text-5xl text-emerald-600 mb-4"></i>
            <p class="text-gray-600 font-medium">Carregando medidas...</p>
        </div>

        <div v-else-if="!loadingMedidas && medidas.length === 0" class="bg-white rounded-2xl shadow-sm border border-emerald-50 p-6 mx-auto">
            <div class="text-center space-y-4">
                <div class="flex justify-center">
                    <div class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center"><i class="pi pi-chart-bar text-3xl text-blue-500"></i></div>
                </div>
                <div>
                    <h3 class="text-xl font-bold text-gray-900 mb-1">Nenhuma Medida Registrada</h3>
                    <p class="text-gray-500 text-base leading-relaxed">Este paciente ainda nao possui medidas corporais registradas.<br />Clique no botao abaixo para registrar a primeira medida e comecar a monitorar a evolucao.</p>
                </div>
                <Button label="Registrar Primeira Medida" icon="pi pi-plus" @click="$emit('criar-medida')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold w-full sm:w-auto justify-center" size="large" />
            </div>
        </div>

        <div v-else-if="!loadingMedidas && medidas.length > 0" class="space-y-4">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-slate-800">Dados das Medidas</h2>
                <Button label="Adicionar Medida" icon="pi pi-plus" @click="$emit('criar-medida')" class="bg-emerald-600 hover:bg-emerald-700" />
            </div>

            <div v-if="medidaSelecionada" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div class="bg-white p-4 rounded-2xl shadow-sm border border-emerald-50 hover:shadow-md transition-shadow">
                    <p class="text-xs font-bold text-slate-400 tracking-widest uppercase mb-3">PESO ATUAL</p>
                    <div class="flex items-end justify-between">
                        <div>
                            <span class="text-3xl font-bold text-emerald-600">{{ medidaSelecionada.peso }}</span
                            ><span class="text-lg text-slate-400 ml-1 font-medium">kg</span>
                        </div>
                        <div v-if="medidas[1]" class="text-right">
                            <div class="flex items-center" :class="medidaSelecionada.peso < medidas[1].peso ? 'text-green-600' : 'text-red-600'">
                                <span class="material-symbols-outlined text-base">{{ medidaSelecionada.peso < medidas[1].peso ? 'arrow_downward' : 'arrow_upward' }}</span
                                ><span class="text-xs font-bold">{{ Math.abs((medidaSelecionada.peso - medidas[1].peso).toFixed(2)) }} kg</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bg-white p-4 rounded-2xl shadow-sm border border-blue-50 hover:shadow-md transition-shadow">
                    <p class="text-xs font-bold text-slate-400 tracking-widest uppercase mb-3">IMC</p>
                    <div class="flex items-end justify-between">
                        <div>
                            <span class="text-3xl font-bold text-blue-600">{{ medidaSelecionada.imc || '-' }}</span>
                        </div>
                        <span class="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">{{ medidaSelecionada.imc >= 30 ? 'ACIMA' : medidaSelecionada.imc >= 25 ? 'SOBRE' : 'NORMAL' }}</span>
                    </div>
                </div>

                <div class="bg-white p-4 rounded-2xl shadow-sm border border-orange-50 hover:shadow-md transition-shadow">
                    <p class="text-xs font-bold text-slate-400 tracking-widest uppercase mb-3">% GORDURA</p>
                    <div class="flex items-end justify-between">
                        <div>
                            <span class="text-3xl font-bold text-orange-600">{{ medidaSelecionada.perc_gordura_corporal || '-' }}</span
                            ><span class="text-lg text-slate-400 ml-1 font-medium">%</span>
                        </div>
                    </div>
                </div>

                <div class="bg-white p-4 rounded-2xl shadow-sm border border-purple-50 hover:shadow-md transition-shadow">
                    <p class="text-xs font-bold text-slate-400 tracking-widest uppercase mb-3">% MASSA MAGRA</p>
                    <div class="flex items-end justify-between">
                        <div>
                            <span class="text-3xl font-bold text-purple-600">{{ medidaSelecionada.perc_massa_magra || '-' }}</span
                            ><span class="text-lg text-slate-400 ml-1 font-medium">%</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-2xl shadow-sm border border-emerald-50 overflow-hidden">
                <div class="px-4 py-3 border-b border-emerald-100"><h4 class="font-bold text-sm text-slate-800">Historico de Avaliacoes</h4></div>
                <table class="w-full text-left text-sm">
                    <thead>
                        <tr class="bg-slate-50 text-slate-400 font-bold uppercase tracking-widest text-[10px] border-b border-emerald-100">
                            <th class="px-4 py-2">Data</th>
                            <th class="px-4 py-2">Peso</th>
                            <th class="px-4 py-2">Altura</th>
                            <th class="px-4 py-2">IMC</th>
                            <th class="px-4 py-2">% Gordura</th>
                            <th class="px-4 py-2">Cintura</th>
                            <th class="px-4 py-2 text-right">Acoes</th>
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
                                    <Button icon="pi pi-eye" text severity="info" size="small" @click="$emit('visualizar-medida', medida)" class="hover:text-emerald-600" title="Visualizar detalhes" />
                                    <Button icon="pi pi-trash" text severity="danger" size="small" @click="$emit('deletar-medida', $event, medida.id)" class="hover:text-red-600" />
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
