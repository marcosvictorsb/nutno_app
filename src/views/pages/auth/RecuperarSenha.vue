<script setup>
import AuthService from '@/service/AuthService.js';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const email = ref('');
const loading = ref(false);
const mensagemErro = ref('');
const mensagemSucesso = ref('');

const emailValido = computed(() => {
    return email.value.trim() !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value);
});

const handleSubmit = async () => {
    if (!emailValido.value) return;

    loading.value = true;
    mensagemErro.value = '';
    mensagemSucesso.value = '';

    try {
        const response = await AuthService.recuperarSenha({
            email: email.value
        });

        if (response.data && response.data.success) {
            mensagemSucesso.value = response.data.message || 'Um link de recuperação foi enviado para seu email. Verifique sua caixa de entrada.';
            email.value = '';

            setTimeout(() => {
                router.push({ name: 'login' });
            }, 3000);
        } else {
            mensagemErro.value = response.data?.message || 'Erro ao processar solicitação. Tente novamente.';
        }
    } catch (error) {
        if (error.response && error.response.data) {
            if (error.response.data.success === false) {
                mensagemErro.value = error.response.data.message || 'Erro ao processar solicitação.';
            } else if (error.response.data.message) {
                mensagemErro.value = error.response.data.message;
            } else {
                mensagemErro.value = 'Erro ao processar solicitação. Tente novamente mais tarde.';
            }
        } else {
            mensagemErro.value = 'Erro de conexão. Verifique sua internet e tente novamente.';
        }
    } finally {
        loading.value = false;
    }
};

const voltarParaLogin = () => {
    router.push({ name: 'login' });
};
</script>

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
                    Recupere seu
                    <span class="block">acesso à</span>
                    <span class="block">plataforma.</span>
                </h1>
                <p class="text-lg mb-12 text-green-50">Enviaremos um link seguro para você redefinir sua senha e continuar gerenciando seus pacientes.</p>

                <div class="flex gap-12">
                    <div>
                        <div class="text-4xl font-bold mb-2">🔒</div>
                        <div class="text-green-50">Seguro e Rápido</div>
                    </div>
                    <div>
                        <div class="text-4xl font-bold mb-2">⚡</div>
                        <div class="text-green-50">Link Instantâneo</div>
                    </div>
                </div>
            </div>

            <div class="text-sm text-green-50">© 2024 Nutno. Todos os direitos reservados.</div>
        </div>

        <!-- Lado Direito -->
        <div class="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 py-12">
            <div class="max-w-md mx-auto w-full">
                <div>
                    <!-- Título -->
                    <h2 class="text-3xl font-bold text-gray-900 mb-2">Recuperar Senha</h2>
                    <p class="text-gray-600 mb-8">Informe seu email para receber um link de recuperação de senha</p>

                    <!-- Mensagem de Sucesso -->
                    <div v-if="mensagemSucesso" class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <div class="flex gap-3">
                            <span class="text-green-600 font-bold text-xl">✓</span>
                            <div>
                                <p class="text-sm font-semibold text-green-900">Email enviado!</p>
                                <p class="text-sm text-green-700 mt-1">{{ mensagemSucesso }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Mensagem de Erro -->
                    <div v-if="mensagemErro" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div class="flex gap-3">
                            <span class="text-red-600 font-bold text-xl">!</span>
                            <div>
                                <p class="text-sm font-semibold text-red-900">Erro ao processar</p>
                                <p class="text-sm text-red-700 mt-1">{{ mensagemErro }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Formulário -->
                    <form class="space-y-5">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                            <input v-model="email" type="email" placeholder="seu@email.com" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition" />
                        </div>

                        <button
                            type="button"
                            @click="handleSubmit"
                            :disabled="!emailValido || loading || mensagemSucesso"
                            :class="[
                                'w-full font-bold py-3 rounded-lg transition flex items-center justify-center gap-2',
                                emailValido && !loading && !mensagemSucesso ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            ]"
                        >
                            <span v-if="loading" class="inline-block animate-spin">⟳</span>
                            <span>{{ loading ? 'Enviando...' : 'Enviar Link de Recuperação' }}</span>
                        </button>

                        <button type="button" @click="voltarParaLogin" class="w-full font-semibold py-3 rounded-lg transition text-green-600 hover:bg-green-50 border border-green-200">Voltar para Login</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped></style>
