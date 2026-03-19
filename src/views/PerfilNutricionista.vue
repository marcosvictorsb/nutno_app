<script setup>
import { apiUrl } from '@/service/ApiClient';
import NutricionistaService from '@/service/NutricionistaService';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const toast = useToast();

// ===== ESTADOS GERAIS =====
const loading = ref(true);
const nutricionista = ref(null);
const previewFoto = ref(null);
const showSuccessToast = ref(false);

// ===== ESTADOS DO FORMULÁRIO DE DADOS PESSOAIS =====
const formDados = ref({
    nome: '',
    email: '',
    crn: '',
    telefone: '',
    especialidade: ''
});
const dadosOriginais = ref({});
const errosDados = ref({});
const carregandoDados = ref(false);

// ===== ESTADOS DO FORMULÁRIO DE SENHA =====
const formSenha = ref({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
});
const mostrarSenha = ref({
    atual: false,
    nova: false,
    confirmar: false
});
const errosSenha = ref({});
const carregandoSenha = ref(false);

// ===== VALIDAÇÕES E CÁLCULOS =====

// Calcular força da senha
const calcularForcaSenha = (senha) => {
    if (!senha) return { forca: 0, label: '', cor: '', precoHtml: 0 };

    let forca = 0;
    if (senha.length >= 8) forca++;
    if (/[A-Z]/.test(senha)) forca++;
    if (/[0-9]/.test(senha)) forca++;
    if (/[!@#$%^&*]/.test(senha)) forca++;

    const labels = ['', 'Fraca', 'Média', 'Forte', 'Muito Forte'];
    const cores = ['danger', 'danger', 'warning', 'success', 'success'];

    return {
        forca: forca,
        label: labels[forca] || 'Muito Forte',
        cor: cores[forca] || 'success',
        percentual: (forca / 4) * 100
    };
};

const forcaSenha = computed(() => calcularForcaSenha(formSenha.value.novaSenha));

// Array de barrinhas para visualizar força
const barraSenha = computed(() => {
    const forca = forcaSenha.value.forca;
    return [forca >= 1, forca >= 2, forca >= 3, forca >= 4];
});

// Cor das barrinhas
const corBarraSenha = computed(() => {
    const cor = forcaSenha.value.cor;
    if (cor === 'success') return 'bg-green-600';
    if (cor === 'warning') return 'bg-yellow-600';
    return 'bg-red-600';
});

// Validar email
const validarEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

// Dados foram alterados?
const dadosAlterados = computed(() => {
    return Object.keys(formDados.value).some((key) => formDados.value[key] !== dadosOriginais.value[key]);
});

// Botão alterar senha habilitado?
const podeAlterarSenha = computed(() => {
    return formSenha.value.senhaAtual.trim() !== '' && formSenha.value.novaSenha.trim() !== '' && formSenha.value.confirmarSenha.trim() !== '' && formSenha.value.novaSenha === formSenha.value.confirmarSenha && forcaSenha.value.forca >= 3;
});

// Construir URL completa da foto
const construirUrlFoto = (caminho) => {
    if (!caminho) return null;
    if (caminho.startsWith('http')) return caminho;
    const urlCompleta = `${apiUrl}/${caminho}`;
    console.log('🖼️ URL da foto construída:', urlCompleta);
    return urlCompleta;
};

// ===== FUNÇÕES DE CARREGAMENTO =====

const carregarPerfil = async () => {
    try {
        loading.value = true;
        const response = (await NutricionistaService.buscarDadosNutricionista()).data;

        nutricionista.value = response.data;

        // Preencher formulário
        formDados.value = {
            nome: response.data.nome || '',
            email: response.data.email || '',
            crn: response.data.crn || '',
            telefone: response.data.telefone || '',
            especialidade: response.data.especialidade || ''
        };

        // Guardar valores originais
        dadosOriginais.value = { ...formDados.value };

        // Carregar foto se houver
        console.log('📸 Resposta do servidor:', response.data);
        if (response.data.caminho_foto) {
            console.log('📸 Usando caminho_foto:', response.data.caminho_foto);
            previewFoto.value = construirUrlFoto(response.data.caminho_foto);
        } else if (response.data.fotoUrl) {
            console.log('📸 Usando fotoUrl:', response.data.fotoUrl);
            previewFoto.value = construirUrlFoto(response.data.fotoUrl);
        }
        console.log('📸 Preview foto final:', previewFoto.value);
    } catch (erro) {
        console.error('Erro ao carregar perfil:', erro);
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Falha ao carregar dados do perfil',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

// ===== FUNÇÕES DE UPLOAD DE FOTO =====

const selecionarFoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png';
    input.onchange = async (e) => {
        const arquivo = e.target.files[0];

        if (!arquivo) return;

        // Validar tamanho (máx 2MB)
        if (arquivo.size > 5 * 1024 * 1024) {
            toast.add({
                severity: 'error',
                summary: 'Arquivo muito grande',
                detail: 'Máximo permitido: 2MB',
                life: 3000
            });
            return;
        }

        // Validar tipo
        if (!['image/jpeg', 'image/png'].includes(arquivo.type)) {
            toast.add({
                severity: 'error',
                summary: 'Tipo inválido',
                detail: 'Aceitar apenas JPEG ou PNG',
                life: 3000
            });
            return;
        }

        // Criar preview
        const reader = new FileReader();
        reader.onload = (event) => {
            previewFoto.value = event.target.result;
        };
        reader.readAsDataURL(arquivo);

        // Upload
        await enviarFoto(arquivo);
        await carregarPerfil(); // Recarregar perfil para atualizar foto e dados
    };
    input.click();
};

const enviarFoto = async (arquivo) => {
    try {
        const formData = new FormData();
        formData.append('foto', arquivo);

        const response = await NutricionistaService.enviarFoto(formData);

        nutricionista.value.foto_url = response.data.foto_url;

        showSuccessToast.value = true;
        setTimeout(() => {
            showSuccessToast.value = false;
        }, 3000);
    } catch (erro) {
        console.error('Erro ao enviar foto:', erro);
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Falha ao enviar foto',
            life: 3000
        });
    }
};

// ===== FUNÇÕES DE VALIDAÇÃO =====

const validarFormularioDados = () => {
    errosDados.value = {};

    if (!formDados.value.nome.trim() || formDados.value.nome.trim().length < 3) {
        errosDados.value.nome = 'Nome deve ter pelo menos 3 caracteres';
    }

    return Object.keys(errosDados.value).length === 0;
};

const validarFormularioSenha = () => {
    errosSenha.value = {};

    if (!formSenha.value.senhaAtual.trim()) {
        errosSenha.value.senhaAtual = 'Obrigatório';
    }

    if (!formSenha.value.novaSenha.trim() || formSenha.value.novaSenha.length < 8) {
        errosSenha.value.novaSenha = 'Mínimo 8 caracteres';
    }

    if (forcaSenha.value.forca < 3) {
        errosSenha.value.forcaSenha = 'Senha não atende aos critérios';
    }

    if (formSenha.value.novaSenha !== formSenha.value.confirmarSenha) {
        errosSenha.value.confirmarSenha = 'As senhas não coincidem';
    }

    return Object.keys(errosSenha.value).length === 0;
};

// ===== FUNÇÕES DE SUBMISSÃO =====

const salvarDados = async () => {
    if (!validarFormularioDados()) return;

    try {
        carregandoDados.value = true;

        await NutricionistaService.salvarDadosPessoais({
            nome: formDados.value.nome,
            crn: formDados.value.crn || null,
            telefone: formDados.value.telefone || null,
            especialidade: formDados.value.especialidade || null
        });

        // Atualizar valores originais
        dadosOriginais.value = { ...formDados.value };
        nutricionista.value.nome = formDados.value.nome;

        showSuccessToast.value = true;
        setTimeout(() => {
            showSuccessToast.value = false;
        }, 3000);
    } catch (erro) {
        console.error('Erro ao salvar dados:', erro);
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: erro.response?.data?.message || 'Falha ao atualizar dados',
            life: 3000
        });
    } finally {
        carregandoDados.value = false;
    }
};

const alterarSenha = async () => {
    if (!validarFormularioSenha()) return;

    try {
        carregandoSenha.value = true;

        await NutricionistaService.alterarSenha({
            senha_atual: formSenha.value.senhaAtual,
            senha_nova: formSenha.value.novaSenha,
            senha_confirmacao: formSenha.value.confirmarSenha
        });

        // Limpar formulário
        formSenha.value = {
            senhaAtual: '',
            novaSenha: '',
            confirmarSenha: ''
        };
        errosSenha.value = {};

        showSuccessToast.value = true;
        setTimeout(() => {
            showSuccessToast.value = false;
        }, 3000);
    } catch (erro) {
        console.error('Erro ao alterar senha:', erro);

        if (erro.response?.status === 400) {
            toast.add({
                severity: 'error',
                summary: 'Erro',
                detail: erro.response.data.message,
                life: 3000
            });
            errosSenha.value.senhaAtual = 'Incorreta';
            return;
        } else if (erro.response?.status === 401) {
            toast.add({
                severity: 'error',
                summary: 'Erro',
                detail: 'Senha atual incorreta',
                life: 3000
            });
            errosSenha.value.senhaAtual = 'Incorreta';
        } else {
            toast.add({
                severity: 'error',
                summary: 'Erro',
                detail: 'Falha ao alterar senha',
                life: 3000
            });
        }
    } finally {
        carregandoSenha.value = false;
    }
};

const obterInicial = () => {
    return nutricionista.value?.nome?.charAt(0)?.toUpperCase() || 'N';
};

// ===== LIFECYCLE =====

onMounted(() => {
    carregarPerfil();
});
</script>

<template>
    <main class="flex-1 w-full mx-auto px-6 space-y-8">
        <!-- Toast Success Notification -->
        <div v-if="showSuccessToast" class="fixed top-20 right-6 z-50 flex items-center gap-3 bg-white dark:bg-slate-800 border-l-4 border-green-600 px-4 py-3 rounded-lg shadow-lg animate-bounce">
            <span class="material-symbols-outlined text-green-600">check_circle</span>
            <p class="text-sm font-medium text-slate-900 dark:text-white">Perfil atualizado com sucesso!</p>
        </div>

        <!-- CARD 1: Header/Photo (Loading State) -->
        <section v-if="loading" class="bg-white dark:bg-slate-900 rounded-lg shadow-sm overflow-hidden border border-slate-100/10 dark:border-slate-700/10 h-80 flex items-center justify-center">
            <div class="text-center">
                <i class="pi pi-spin pi-spinner text-4xl text-emerald-600 mb-3"></i>
                <p class="text-slate-600 dark:text-slate-300">Carregando perfil...</p>
            </div>
        </section>

        <!-- CARD 1: Header/Photo -->
        <section v-if="!loading" class="bg-white dark:bg-slate-900 rounded-lg shadow-sm overflow-hidden relative border border-slate-100/10 dark:border-slate-700/10">
            <!-- Dark Green Header -->
            <div class="h-32 w-full bg-emerald-900/60" />

            <!-- Avatar + Info Section -->
            <div class="px-8 pb-8 flex flex-col sm:flex-row items-end sm:items-center gap-6 -mt-12">
                <!-- Avatar -->
                <div class="relative group">
                    <div class="w-28 h-28 rounded-full border-4 border-white dark:border-slate-900 overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-sm flex items-center justify-center text-4xl font-bold text-emerald-600">
                        <img v-if="previewFoto" :src="previewFoto" alt="Avatar" class="w-full h-full object-cover" />
                        <span v-else>{{ obterInicial() }}</span>
                    </div>
                    <!-- Camera Button -->
                    <button
                        @click="selecionarFoto"
                        class="absolute bottom-0 right-0 w-8 h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm hover:shadow-md transition-colors active:scale-90 dark:bg-emerald-700 dark:hover:bg-emerald-800"
                    >
                        <span class="material-symbols-outlined text-sm">photo_camera</span>
                    </button>
                </div>

                <!-- Info -->
                <div class="flex-1 pt-4 sm:pt-12">
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{{ nutricionista?.nome }}</h2>
                    <div class="flex flex-wrap gap-x-4 gap-y-1 mt-2 items-center -mt-4">
                        <span class="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <span class="material-symbols-outlined text-base">mail</span>
                            {{ nutricionista?.email }}
                        </span>
                        <span v-if="nutricionista?.crn" class="text-xs text-slate-500 dark:text-slate-500 font-medium"> CRN {{ nutricionista.crn }} </span>
                    </div>
                </div>
            </div>
        </section>

        <!-- CARD 2: Personal Data -->
        <section class="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-100/10 dark:border-slate-700/10">
            <!-- Header -->
            <div class="px-8 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
                <span class="material-symbols-outlined text-emerald-600" style="font-variation-settings: 'FILL' 1">person</span>
                <h3 class="font-semibold text-lg text-slate-900 dark:text-white">Dados Pessoais</h3>
            </div>

            <!-- Form -->
            <form @submit.prevent="salvarDados" class="p-8">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Nome (Full Width) -->
                    <div class="md:col-span-2 space-y-1.5">
                        <label class="label-caps text-slate-600 dark:text-slate-400 font-medium text-xs block uppercase tracking-wider"> Nome Completo </label>
                        <input
                            v-model="formDados.nome"
                            type="text"
                            class="w-full h-11 px-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 dark:text-white transition-all text-sm outline-none"
                        />
                        <p v-if="errosDados.nome" class="text-xs text-red-600 dark:text-red-400 mt-1">{{ errosDados.nome }}</p>
                    </div>

                    <!-- Email -->
                    <div class="space-y-1.5">
                        <label class="label-caps text-slate-600 dark:text-slate-400 font-medium text-xs block uppercase tracking-wider"> Email </label>
                        <input
                            v-model="formDados.email"
                            type="email"
                            disabled
                            class="w-full h-11 px-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 dark:text-white transition-all text-sm outline-none opacity-60 cursor-not-allowed"
                        />
                        <p v-if="errosDados.email" class="text-xs text-red-600 dark:text-red-400 mt-1">{{ errosDados.email }}</p>
                    </div>

                    <!-- CRN -->
                    <div class="space-y-1.5">
                        <label class="label-caps text-slate-600 dark:text-slate-400 font-medium text-xs block uppercase tracking-wider"> CRN </label>
                        <input
                            v-model="formDados.crn"
                            type="text"
                            placeholder="Ex: 12345/SP"
                            class="w-full h-11 px-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 dark:text-white transition-all text-sm outline-none"
                        />
                    </div>

                    <!-- Telefone -->
                    <div class="space-y-1.5">
                        <label class="label-caps text-slate-600 dark:text-slate-400 font-medium text-xs block uppercase tracking-wider"> WhatsApp </label>
                        <input
                            v-model="formDados.telefone"
                            type="text"
                            placeholder="(11) 99999-9999"
                            class="w-full h-11 px-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 dark:text-white transition-all text-sm outline-none"
                        />
                    </div>

                    <!-- Especialidade -->
                    <div class="md:col-span-2 space-y-1.5">
                        <label class="label-caps text-slate-600 dark:text-slate-400 font-medium text-xs block uppercase tracking-wider"> Especialidade </label>
                        <input
                            v-model="formDados.especialidade"
                            type="text"
                            placeholder="Ex: Nutrição Esportiva, Clínica"
                            class="w-full h-11 px-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 dark:text-white transition-all text-sm outline-none"
                        />
                    </div>

                    <!-- Button -->
                    <div class="md:col-span-2 pt-2 flex justify-end">
                        <Button severity="success" type="submit" :loading="carregandoDados" :disabled="!dadosAlterados || carregandoDados" label="Salvar alterações" icon="pi pi-save" class="px-6" />
                    </div>
                </div>
            </form>
        </section>

        <!-- CARD 3: Security -->
        <section class="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-100/10 dark:border-slate-700/10 mb-12">
            <!-- Header -->
            <div class="px-8 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
                <span class="material-symbols-outlined text-emerald-600" style="font-variation-settings: 'FILL' 1">lock</span>
                <h3 class="font-semibold text-lg text-slate-900 dark:text-white">Segurança</h3>
            </div>

            <!-- Form -->
            <form @submit.prevent="alterarSenha" class="p-8">
                <div class="space-y-6">
                    <!-- Senha Atual -->
                    <div class="space-y-1.5">
                        <label class="label-caps text-slate-600 dark:text-slate-400 font-medium text-xs block uppercase tracking-wider"> Senha Atual </label>
                        <div class="relative">
                            <input
                                v-model="formSenha.senhaAtual"
                                :type="mostrarSenha.atual ? 'text' : 'password'"
                                placeholder="••••••••"
                                class="w-full h-11 px-4 pr-10 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 dark:text-white transition-all text-sm outline-none"
                            />
                            <span @click="mostrarSenha.atual = !mostrarSenha.atual" class="material-symbols-outlined absolute right-3 top-2.5 text-slate-400 cursor-pointer text-xl hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                {{ mostrarSenha.atual ? 'visibility_off' : 'visibility' }}
                            </span>
                        </div>
                        <p v-if="errosSenha.senhaAtual" class="text-xs text-red-600 dark:text-red-400 mt-1">{{ errosSenha.senhaAtual }}</p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Nova Senha -->
                        <div class="space-y-1.5">
                            <label class="label-caps text-slate-600 dark:text-slate-400 font-medium text-xs block uppercase tracking-wider"> Nova Senha </label>
                            <div class="relative">
                                <input
                                    v-model="formSenha.novaSenha"
                                    :type="mostrarSenha.nova ? 'text' : 'password'"
                                    placeholder="Mínimo 8 caracteres"
                                    class="w-full h-11 px-4 pr-10 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 dark:text-white transition-all text-sm outline-none"
                                />
                                <span @click="mostrarSenha.nova = !mostrarSenha.nova" class="material-symbols-outlined absolute right-3 top-2.5 text-slate-400 cursor-pointer text-xl hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                    {{ mostrarSenha.nova ? 'visibility_off' : 'visibility' }}
                                </span>
                            </div>

                            <!-- Strength Indicator -->
                            <div v-if="formSenha.novaSenha" class="mt-2 space-y-1">
                                <div class="flex gap-1 h-1.5">
                                    <div v-for="(ativa, i) in barraSenha" :key="i" :class="[ativa ? corBarraSenha : 'bg-slate-200 dark:bg-slate-700', 'flex-1 rounded-full transition-colors']"></div>
                                </div>
                                <p
                                    :class="[
                                        'text-xs font-semibold uppercase tracking-wider',
                                        forcaSenha.cor === 'success' ? 'text-green-600 dark:text-green-400' : forcaSenha.cor === 'warning' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                                    ]"
                                >
                                    {{ forcaSenha.label }}
                                </p>
                            </div>

                            <p v-if="errosSenha.novaSenha" class="text-xs text-red-600 dark:text-red-400 mt-1">{{ errosSenha.novaSenha }}</p>
                        </div>

                        <!-- Confirmar Senha -->
                        <div class="space-y-1.5">
                            <label class="label-caps text-slate-600 dark:text-slate-400 font-medium text-xs block uppercase tracking-wider"> Confirmar Nova Senha </label>
                            <div class="relative">
                                <input
                                    v-model="formSenha.confirmarSenha"
                                    :type="mostrarSenha.confirmar ? 'text' : 'password'"
                                    placeholder="Repita a nova senha"
                                    class="w-full h-11 px-4 pr-10 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 dark:text-white transition-all text-sm outline-none"
                                />
                                <span
                                    @click="mostrarSenha.confirmar = !mostrarSenha.confirmar"
                                    class="material-symbols-outlined absolute right-3 top-2.5 text-slate-400 cursor-pointer text-xl hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    {{ mostrarSenha.confirmar ? 'visibility_off' : 'visibility' }}
                                </span>
                            </div>
                            <p v-if="errosSenha.confirmarSenha" class="text-xs text-red-600 dark:text-red-400 mt-1">{{ errosSenha.confirmarSenha }}</p>
                        </div>
                    </div>

                    <!-- Button -->
                    <div class="pt-2 flex justify-end">
                        <Button type="submit" :loading="carregandoSenha" :disabled="!podeAlterarSenha || carregandoSenha" label="Alterar senha" icon="pi pi-lock" class="px-6" />
                    </div>
                </div>
            </form>
        </section>
    </main>
</template>

<style scoped>
.label-caps {
    font-size: 11px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
}
</style>
