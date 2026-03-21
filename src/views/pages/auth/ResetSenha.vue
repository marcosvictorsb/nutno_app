<template>
    <div class="min-h-screen flex bg-gradient-to-br from-green-50 to-green-100">
        <!-- Lado Esquerdo -->
        <div class="hidden lg:flex w-1/2 flex-col justify-between p-12 text-white" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%)">
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                    <span class="text-2xl font-bold text-green-600">🥗</span>
                </div>
                <span class="text-2xl font-bold">Nutno</span>
            </div>

            <div>
                <h1 class="text-5xl font-bold mb-6 leading-tight">
                    Crie uma
                    <span class="block">nova senha</span>
                    <span class="block">para sua conta.</span>
                </h1>
                <p class="text-lg mb-12 text-green-50">Escolha uma senha forte e segura para proteger sua conta e seus dados de pacientes.</p>

                <div class="flex gap-12">
                    <div>
                        <div class="text-4xl font-bold mb-2">🔐</div>
                        <div class="text-green-50">Mais Segurança</div>
                    </div>
                    <div>
                        <div class="text-4xl font-bold mb-2">✨</div>
                        <div class="text-green-50">Acesso Rápido</div>
                    </div>
                </div>
            </div>

            <div class="text-sm text-green-50">© 2024 Nutno. Todos os direitos reservados.</div>
        </div>

        <!-- Lado Direito -->
        <div class="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 py-12">
            <div class="max-w-md mx-auto w-full">
                <div>
                    <!-- Carregando Token -->
                    <div v-if="loading" class="text-center">
                        <i class="pi pi-spin pi-spinner text-4xl text-emerald-600 mb-3"></i>
                        <p class="text-slate-600">Validando seu link de recuperação...</p>
                    </div>

                    <!-- Token Inválido -->
                    <template v-if="!loading && !tokenValido">
                        <h2 class="text-3xl font-bold text-gray-900 mb-2">Link Expirado</h2>
                        <p class="text-gray-600 mb-8">O link de recuperação de senha não é válido ou expirou.</p>

                        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <div class="flex gap-3">
                                <span class="text-red-600 font-bold text-xl">!</span>
                                <div>
                                    <p class="text-sm font-semibold text-red-900">Link inválido ou expirado</p>
                                    <p class="text-sm text-red-700 mt-1">{{ mensagemErro }}</p>
                                </div>
                            </div>
                        </div>

                        <button @click="voltarParaLogin" class="w-full font-semibold py-3 rounded-lg transition bg-green-600 hover:bg-green-700 text-white">Voltar para Login</button>
                    </template>

                    <!-- Token Válido - Formulário de Reset -->
                    <template v-if="!loading && tokenValido">
                        <h2 class="text-3xl font-bold text-gray-900 mb-2">Redefinir Senha</h2>
                        <p class="text-gray-600 mb-8">Crie uma nova senha forte para sua conta</p>

                        <!-- Mensagem de Sucesso -->
                        <div v-if="mensagemSucesso" class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                            <div class="flex gap-3">
                                <span class="text-green-600 font-bold text-xl">✓</span>
                                <div>
                                    <p class="text-sm font-semibold text-green-900">Sucesso!</p>
                                    <p class="text-sm text-green-700 mt-1">{{ mensagemSucesso }}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Mensagem de Erro -->
                        <div v-if="mensagemErro" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <div class="flex gap-3">
                                <span class="text-red-600 font-bold text-xl">!</span>
                                <div>
                                    <p class="text-sm font-semibold text-red-900">Erro ao redefinir</p>
                                    <p class="text-sm text-red-700 mt-1">{{ mensagemErro }}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Formulário -->
                        <form class="space-y-6">
                            <!-- Nova Senha -->
                            <div class="space-y-1.5">
                                <label class="block text-sm font-medium text-gray-700 mb-2">Nova Senha</label>
                                <div class="relative">
                                    <input
                                        v-model="formSenha.novaSenha"
                                        :type="mostrarSenha.nova ? 'text' : 'password'"
                                        placeholder="Mínimo 8 caracteres"
                                        class="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                                    />
                                    <span @click="mostrarSenha.nova = !mostrarSenha.nova" class="material-symbols-outlined absolute right-3 top-3 text-slate-400 cursor-pointer text-xl hover:text-slate-600 transition-colors">
                                        {{ mostrarSenha.nova ? 'visibility_off' : 'visibility' }}
                                    </span>
                                </div>

                                <!-- Strength Indicator -->
                                <div v-if="formSenha.novaSenha" class="mt-2 space-y-1">
                                    <div class="flex gap-1 h-1.5">
                                        <div v-for="(ativa, i) in barraSenha" :key="i" :class="[ativa ? corBarraSenha : 'bg-slate-200', 'flex-1 rounded-full transition-colors']"></div>
                                    </div>
                                    <p :class="['text-xs font-semibold uppercase tracking-wider', forcaSenha.cor === 'success' ? 'text-green-600' : forcaSenha.cor === 'warning' ? 'text-yellow-600' : 'text-red-600']">
                                        {{ forcaSenha.label }}
                                    </p>
                                </div>

                                <p v-if="errosSenha.novaSenha" class="text-xs text-red-600 mt-1">{{ errosSenha.novaSenha }}</p>
                            </div>

                            <!-- Confirmar Senha -->
                            <div class="space-y-1.5">
                                <label class="block text-sm font-medium text-gray-700 mb-2">Confirmar Nova Senha</label>
                                <div class="relative">
                                    <input
                                        v-model="formSenha.confirmarSenha"
                                        :type="mostrarSenha.confirmar ? 'text' : 'password'"
                                        placeholder="Repita a nova senha"
                                        class="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                                    />
                                    <span @click="mostrarSenha.confirmar = !mostrarSenha.confirmar" class="material-symbols-outlined absolute right-3 top-3 text-slate-400 cursor-pointer text-xl hover:text-slate-600 transition-colors">
                                        {{ mostrarSenha.confirmar ? 'visibility_off' : 'visibility' }}
                                    </span>
                                </div>
                                <p v-if="errosSenha.confirmarSenha" class="text-xs text-red-600 mt-1">{{ errosSenha.confirmarSenha }}</p>
                            </div>

                            <!-- Botões -->
                            <div class="space-y-3 pt-4">
                                <div class="mb-3 p-3 bg-blue-50 rounded text-xs">
                                    <p><strong>Debug:</strong></p>
                                    <p>podeResetar: {{ podeResetar }}</p>
                                    <p>loadingReset: {{ loadingReset }}</p>
                                    <p>novaSenha length: {{ formSenha.novaSenha.length }}</p>
                                    <p>confirmarSenha length: {{ formSenha.confirmarSenha.length }}</p>
                                    <p>Senhas iguais: {{ formSenha.novaSenha === formSenha.confirmarSenha }}</p>
                                    <p>força: {{ forcaSenha.forca }}/4</p>
                                </div>

                                <button type="button" @click="handleReset" class="w-full font-bold py-3 rounded-lg transition flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white cursor-pointer">
                                    <span v-if="loadingReset" class="inline-block animate-spin">⟳</span>
                                    <span>{{ loadingReset ? 'Redefinindo...' : 'Redefinir Senha' }}</span>
                                </button>

                                <button type="button" @click="voltarParaLogin" class="w-full font-semibold py-3 rounded-lg transition text-green-600 hover:bg-green-50 border border-green-200">Voltar para Login</button>
                            </div>
                        </form>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import AuthService from '@/service/AuthService.js';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();

const token = ref('');
const loading = ref(true);
const loadingReset = ref(false);
const tokenValido = ref(false);
const mensagemErro = ref('');
const mensagemSucesso = ref('');

const formSenha = ref({
    novaSenha: '',
    confirmarSenha: ''
});
const mostrarSenha = ref({
    nova: false,
    confirmar: false
});

const errosSenha = ref({});

// Calcular força da senha
const calcularForcaSenha = (senha) => {
    if (!senha) return { forca: 0, label: '', cor: '', percentual: 0 };

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

const barraSenha = computed(() => {
    const forca = forcaSenha.value.forca;
    return [forca >= 1, forca >= 2, forca >= 3, forca >= 4];
});

const corBarraSenha = computed(() => {
    const cor = forcaSenha.value.cor;
    if (cor === 'success') return 'bg-green-600';
    if (cor === 'warning') return 'bg-yellow-600';
    return 'bg-red-600';
});

// Botão resetar habilitado?
const podeResetar = computed(() => {
    return formSenha.value.novaSenha.trim() !== '' && formSenha.value.confirmarSenha.trim() !== '' && formSenha.value.novaSenha === formSenha.value.confirmarSenha && forcaSenha.value.forca >= 3;
});

// Validar token
const validarToken = async () => {
    try {
        loading.value = true;
        console.log('Validando token de reset de senha:', token.value);
        const response = await AuthService.checkToken(token.value);

        if (response.data && response.data.success && response.data.data.valido) {
            tokenValido.value = true;
        } else {
            mensagemErro.value = response.data?.message || 'Token inválido ou expirado';
        }
    } catch (error) {
        console.error('Erro ao validar token:', error);
        if (error.response && error.response.data && error.response.data.message) {
            mensagemErro.value = error.response.data.message;
        } else {
            mensagemErro.value = 'O link de recuperação expirou. Solicite um novo link para recuperar sua senha.';
        }
    } finally {
        loading.value = false;
    }
};

// Resetar senha
const handleReset = async () => {
    if (!podeResetar.value) {
        console.log('❌ handleReset retornando porque podeResetar é false');
        return;
    }

    try {
        console.log('6️⃣ Definindo loadingReset = true');
        loadingReset.value = true;
        mensagemErro.value = '';
        mensagemSucesso.value = '';

        const dadosEnvio = {
            token: token.value,
            senha: formSenha.value.novaSenha
        };
        const response = await AuthService.resetarSenha(dadosEnvio);

        if (response.data && response.data.success) {
            console.log('✅ Sucesso! Mensagem:', response.data.message);
            mensagemSucesso.value = response.data.message || 'Senha redefinida com sucesso! Redirecionando...';

            // Redireciona para login após 3 segundos
            setTimeout(() => {
                console.log('⏱️ Redirecionando para login');
                router.push({ name: 'login' });
            }, 3000);
        } else {
            console.log('❌ response.data.success é false ou undefined');
            mensagemErro.value = response.data?.message || 'Erro ao redefinir senha. Tente novamente.';
        }
    } catch (error) {
        console.error('💥 Erro no try-catch:', error);
        console.error('Response error:', error.response?.data);
        if (error.response && error.response.data && error.response.data.message) {
            mensagemErro.value = error.response.data.message;
        } else {
            mensagemErro.value = 'Erro ao redefinir senha. Tente novamente mais tarde.';
        }
    } finally {
        console.log('🏁 finally block - Definindo loadingReset = false');
        loadingReset.value = false;
    }
};

const voltarParaLogin = () => {
    router.push({ name: 'login' });
};

// Lifecycle
onMounted(() => {
    console.log('Route params:', route.params);
    token.value = route.params.token || '';

    if (!token.value) {
        tokenValido.value = false;
        loading.value = false;
        mensagemErro.value = 'Token de reset não fornecido na URL.';
    } else {
        console.log('Token capturado:', token.value);
        validarToken();
    }
});
</script>

<style scoped></style>
