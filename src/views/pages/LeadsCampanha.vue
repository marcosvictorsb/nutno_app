<script setup>
import { LeadsService } from '@/service/LeadsService';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import InputText from 'primevue/inputtext';
import ProgressSpinner from 'primevue/progressspinner';
import Tag from 'primevue/tag';
import Toolbar from 'primevue/toolbar';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const toast = useToast();
const leads = ref([]);
const isLoading = ref(false);
const searchQuery = ref('');

const filteredLeads = computed(() => {
    if (!searchQuery.value.trim()) return leads.value;

    const query = searchQuery.value.toLowerCase();
    return leads.value.filter((lead) => lead.name.toLowerCase().includes(query) || lead.email.toLowerCase().includes(query));
});

const loadLeads = async () => {
    isLoading.value = true;
    try {
        const response = await LeadsService.getLeads();

        if (response.success && Array.isArray(response.data)) {
            leads.value = response.data;
            toast.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: `${response.data.length} lead(s) carregado(s)`,
                life: 3000
            });
        } else {
            throw new Error('Resposta inválida da API');
        }
    } catch (error) {
        console.error('Erro ao carregar leads:', error);
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao carregar leads. Por favor, tente novamente.',
            life: 3000
        });
    } finally {
        isLoading.value = false;
    }
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const getTodayLeads = () => {
    const today = new Date().toDateString();
    return leads.value.filter((lead) => new Date(lead.created_at).toDateString() === today).length;
};

onMounted(() => {
    loadLeads();
});
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
        <!-- Header Section -->
        <div class="mb-8">
            <div class="flex items-center gap-3 mb-4">
                <span class="material-symbols-outlined text-4xl text-primary">people</span>
                <div>
                    <h1 class="text-4xl font-bold text-slate-900 dark:text-white">Campanha de Leads</h1>
                    <p class="text-slate-500 dark:text-slate-400 mt-1">Gerencie todos os leads capturados da sua campanha</p>
                </div>
            </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card class="shadow-lg">
                <template #content>
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-slate-600 dark:text-slate-400 text-sm font-medium">Total de Leads</p>
                            <p class="text-3xl font-bold text-slate-900 dark:text-white mt-2">{{ leads.length }}</p>
                        </div>
                        <span class="material-symbols-outlined text-5xl text-blue-500 opacity-20">contacts</span>
                    </div>
                </template>
            </Card>

            <Card class="shadow-lg">
                <template #content>
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-slate-600 dark:text-slate-400 text-sm font-medium">Leads Hoje</p>
                            <p class="text-3xl font-bold text-slate-900 dark:text-white mt-2">{{ getTodayLeads() }}</p>
                        </div>
                        <span class="material-symbols-outlined text-5xl text-green-500 opacity-20">today</span>
                    </div>
                </template>
            </Card>

            <Card class="shadow-lg">
                <template #content>
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-slate-600 dark:text-slate-400 text-sm font-medium">Resultando em</p>
                            <p class="text-3xl font-bold text-slate-900 dark:text-white mt-2">{{ ((getTodayLeads() / (leads.length || 1)) * 100).toFixed(0) }}%</p>
                        </div>
                        <span class="material-symbols-outlined text-5xl text-purple-500 opacity-20">trending_up</span>
                    </div>
                </template>
            </Card>
        </div>

        <!-- Main Card with Table -->
        <Card class="shadow-xl">
            <template #header>
                <Toolbar class="bg-transparent border-0 p-0">
                    <template #start>
                        <span class="text-lg font-bold text-slate-900 dark:text-white">Lista de Leads</span>
                    </template>
                    <template #end>
                        <Button @click="loadLeads" :loading="isLoading" icon="pi pi-refresh" rounded text severity="secondary" v-tooltip.top="'Recarregar dados'" />
                    </template>
                </Toolbar>
            </template>

            <template #content>
                <!-- Search Bar -->
                <div class="mb-6">
                    <span class="p-input-icon-left w-full">
                        <i class="pi pi-search"></i>
                        <InputText v-model="searchQuery" type="text" placeholder="Buscar por nome ou email..." class="w-full" />
                    </span>
                </div>

                <!-- Loading State -->
                <div v-if="isLoading" class="flex justify-center items-center py-20">
                    <ProgressSpinner />
                </div>

                <!-- Leads Table -->
                <DataTable v-else :value="filteredLeads" striped-rows responsive-layout="scroll" :rows="10" paginator :show-grid-lines="false" class="custom-datatable">
                    <template #empty>
                        <div class="text-center py-12">
                            <span class="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 block mb-4">inbox</span>
                            <p class="text-slate-600 dark:text-slate-400 text-lg">{{ searchQuery ? 'Nenhum lead encontrado com esses critérios' : 'Nenhum lead encontrado' }}</p>
                        </div>
                    </template>

                    <Column field="id" header="ID" style="width: 80px">
                        <template #body="{ data }">
                            <Tag :value="'#' + data.id" severity="info" />
                        </template>
                    </Column>

                    <Column field="name" header="Nome" sortable>
                        <template #body="{ data }">
                            <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-slate-400">account_circle</span>
                                <span class="font-medium">{{ data.name }}</span>
                            </div>
                        </template>
                    </Column>

                    <Column field="email" header="Email" sortable>
                        <template #body="{ data }">
                            <a :href="'mailto:' + data.email" class="text-primary hover:underline font-medium">
                                {{ data.email }}
                            </a>
                        </template>
                    </Column>

                    <Column field="created_at" header="Data de Criação" sortable style="width: 200px">
                        <template #body="{ data }">
                            <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-sm text-slate-400">schedule</span>
                                <span class="text-sm">{{ formatDate(data.created_at) }}</span>
                            </div>
                        </template>
                    </Column>
                </DataTable>

                <!-- Footer Stats -->
                <div class="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <div class="flex items-center justify-between">
                        <div class="flex gap-4">
                            <div>
                                <p class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Exibindo</p>
                                <p class="text-lg font-bold text-slate-900 dark:text-white">{{ filteredLeads.length }} de {{ leads.length }}</p>
                            </div>
                        </div>
                        <Button @click="loadLeads" :loading="isLoading" icon="pi pi-refresh" label="Recarregar" raised />
                    </div>
                </div>
            </template>
        </Card>
    </div>
</template>

<style scoped>
:deep(.p-card) {
    background-color: white;
    border: none;
}

:deep(.dark .p-card) {
    background-color: rgb(30, 41, 59);
}

:deep(.custom-datatable) {
    background-color: transparent;
}

:deep(.custom-datatable .p-datatable-thead > tr > th) {
    background-color: rgb(241, 245, 249);
    color: rgb(15, 23, 42);
    font-weight: 600;
    border: none;
    padding: 1rem;
}

:deep(.dark .custom-datatable .p-datatable-thead > tr > th) {
    background-color: rgb(55, 65, 81);
    color: rgb(226, 232, 240);
}

:deep(.custom-datatable .p-datatable-tbody > tr) {
    border-bottom: 1px solid rgb(226, 232, 240);
    transition: all 0.2s ease;
}

:deep(.dark .custom-datatable .p-datatable-tbody > tr) {
    border-bottom-color: rgb(51, 65, 85);
}

:deep(.custom-datatable .p-datatable-tbody > tr:hover) {
    background-color: rgb(248, 250, 252) !important;
}

:deep(.dark .custom-datatable .p-datatable-tbody > tr:hover) {
    background-color: rgba(55, 65, 81, 0.5) !important;
}

:deep(.custom-datatable .p-datatable-tbody > tr > td) {
    color: rgb(71, 85, 105);
    border: none;
    padding: 1rem;
}

:deep(.dark .custom-datatable .p-datatable-tbody > tr > td) {
    color: rgb(203, 213, 225);
}

:deep(.p-paginator) {
    background-color: rgb(248, 250, 252);
    border-top: 1px solid rgb(226, 232, 240);
    margin-top: 1.5rem;
}

:deep(.dark .p-paginator) {
    background-color: rgb(55, 65, 81);
    border-top-color: rgb(51, 65, 85);
}

:deep(.p-input-icon-left > input) {
    padding-left: 2.5rem;
    border-radius: 0.5rem;
}

:deep(.p-input-icon-left > svg, .p-input-icon-left > i) {
    left: 0.75rem;
}

:deep(.p-toolbar) {
    background-color: transparent !important;
    border: none !important;
}
</style>
