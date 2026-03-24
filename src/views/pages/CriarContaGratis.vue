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
                    Eleve o nível do seu
                    <span class="block">atendimento</span>
                    <span class="block">nutricional.</span>
                </h1>
                <p class="text-lg mb-12 text-green-50">A plataforma completa para gestão de pacientes, planos alimentares personalizados e evolução clínica simplificada.</p>

                <div class="flex gap-12">
                    <div>
                        <div class="text-4xl font-bold mb-2">5k+</div>
                        <div class="text-green-50">Nutricionistas</div>
                    </div>
                    <div>
                        <div class="text-4xl font-bold mb-2">100k+</div>
                        <div class="text-green-50">Planos Criados</div>
                    </div>
                </div>
            </div>

            <div class="text-sm text-green-50">© 2024 Nutno. Todos os direitos reservados.</div>
        </div>

        <!-- Lado Direito -->
        <div class="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 py-12">
            <div class="max-w-md mx-auto w-full">
                <!-- Abas -->
                <div class="flex gap-8 mb-8 border-b border-gray-300">
                    <button @click="tabAtivo = 'criar'" :class="['pb-4 font-semibold text-lg transition', tabAtivo === 'criar' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-400']">Criar conta</button>
                    <!-- <button @click="tabAtivo = 'entrar'" :class="['pb-4 font-semibold text-lg transition', tabAtivo === 'entrar' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-400']">Entrar</button> -->
                </div>

                <!-- Conteúdo da Aba Criar Conta -->
                <div v-if="tabAtivo === 'criar'">
                    <!--
                    <h2 class="text-3xl font-bold text-gray-900 mb-2">Comece sua jornada</h2>
                    <p class="text-gray-600 mb-8">Preencha os dados abaixo para criar seu perfil profissional.</p>

                    <button class="w-full border-2 border-gray-300 rounded-lg py-3 font-semibold text-gray-700 mb-6 hover:bg-gray-50 transition flex items-center justify-center gap-3">
                        <svg class="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#1f2937" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#1f2937" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#1f2937" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#1f2937" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Cadastrar com Google
                    </button>

                    <div class="relative mb-6">
                        <div class="absolute inset-0 flex items-center">
                            <div class="w-full border-t border-gray-300"></div>
                        </div>
                        <div class="relative flex justify-center text-sm">
                            <span class="px-2 bg-white text-gray-500 uppercase text-xs font-semibold">Ou use seu e-mail</span>
                        </div>
                    </div>

                    -->

                    <!-- Formulário -->
                    <form @submit="handleSubmit" class="space-y-5">
                        <!-- Mensagem de Erro -->
                        <div v-if="mensagemErro" class="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div class="flex gap-3">
                                <span class="text-red-600 font-bold text-xl">!</span>
                                <div>
                                    <p class="text-sm font-semibold text-red-900">Erro ao criar conta</p>
                                    <p class="text-sm text-red-700 mt-1">{{ mensagemErro }}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Mensagem de Sucesso -->
                        <div v-if="mensagemSucesso" class="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div class="flex gap-3">
                                <span class="text-green-600 font-bold text-xl">✓</span>
                                <div>
                                    <p class="text-sm font-semibold text-green-900">Sucesso!</p>
                                    <p class="text-sm text-green-700 mt-1">{{ mensagemSucesso }}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                            <input v-model="nomeCompleto" type="text" placeholder="Seu nome completo" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition" />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">E-mail Profissional</label>
                            <input v-model="email" type="email" placeholder="exemplo@nutri.com" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition" />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Senha</label>
                            <input v-model="password" type="password" placeholder="••••••••" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition" />
                        </div>

                        <!-- Dicas de Senha -->
                        <div v-if="password" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p class="text-xs font-semibold text-blue-900 mb-3">Requisitos de senha forte:</p>
                            <div class="space-y-2">
                                <div class="flex items-center gap-2">
                                    <span :class="['w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold transition', validacoes.minLength ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500']">
                                        {{ validacoes.minLength ? '✓' : '✗' }}
                                    </span>
                                    <span :class="['text-xs', validacoes.minLength ? 'text-green-700 font-medium' : 'text-gray-600']">Mínimo 8 caracteres</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span :class="['w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold transition', validacoes.maiuscula ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500']">
                                        {{ validacoes.maiuscula ? '✓' : '✗' }}
                                    </span>
                                    <span :class="['text-xs', validacoes.maiuscula ? 'text-green-700 font-medium' : 'text-gray-600']">Contém letra maiúscula (A-Z)</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span :class="['w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold transition', validacoes.minuscula ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500']">
                                        {{ validacoes.minuscula ? '✓' : '✗' }}
                                    </span>
                                    <span :class="['text-xs', validacoes.minuscula ? 'text-green-700 font-medium' : 'text-gray-600']">Contém letra minúscula (a-z)</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span :class="['w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold transition', validacoes.numero ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500']">
                                        {{ validacoes.numero ? '✓' : '✗' }}
                                    </span>
                                    <span :class="['text-xs', validacoes.numero ? 'text-green-700 font-medium' : 'text-gray-600']">Contém número (0-9)</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span :class="['w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold transition', validacoes.especial ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500']">
                                        {{ validacoes.especial ? '✓' : '✗' }}
                                    </span>
                                    <span :class="['text-xs', validacoes.especial ? 'text-green-700 font-medium' : 'text-gray-600']">Contém caractere especial (!@#$%^&...)</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Confirme a Senha</label>
                            <input
                                v-model="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                :class="['w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition', confirmPassword && !senhasCorrespondem ? 'border-red-500' : 'border-gray-300']"
                            />

                            <!-- Validação de correspondência de senhas -->
                            <div v-if="confirmPassword" class="mt-2">
                                <div v-if="senhasCorrespondem" class="flex items-center gap-2">
                                    <span class="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-xs font-bold text-white">✓</span>
                                    <span class="text-xs text-green-700 font-medium">As senhas correspondem</span>
                                </div>
                                <div v-else class="flex items-center gap-2">
                                    <span class="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-xs font-bold text-white">✗</span>
                                    <span class="text-xs text-red-700 font-medium">As senhas não correspondem</span>
                                </div>
                            </div>
                        </div>

                        <div class="flex items-start gap-3">
                            <input v-model="aceitoTermos" type="checkbox" id="termos" class="mt-1" />
                            <label for="termos" class="text-sm text-gray-700"> Aceito os <span class="font-semibold cursor-pointer text-green-600 hover:underline" @click="abrirTermos">Termos de Uso</span> </label>
                        </div>

                        <button
                            type="submit"
                            :disabled="!formularioValido || loading"
                            :class="[
                                'w-full font-bold py-3 rounded-lg transition flex items-center justify-center gap-2',
                                formularioValido && !loading ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            ]"
                        >
                            <span v-if="loading" class="inline-block animate-spin">⟳</span>
                            <span>{{ loading ? 'Criando conta...' : 'Criar minha conta gratuita' }}</span>
                        </button>

                        <p class="text-center text-sm text-gray-600 mt-6">
                            Já tem uma conta?
                            <span class="font-semibold cursor-pointer text-green-600 hover:underline">Faça login agora</span>
                        </p>
                    </form>
                </div>

                <!-- Conteúdo da Aba Entrar -->
                <div v-else>
                    <p class="text-gray-600">Conteúdo de login aqui</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Termos de Uso -->
    <TermosDeUso ref="termosRef" />
</template>

<script setup>
import TermosDeUso from '@/components/TermosDeUso.vue';
import AuthService from '@/service/AuthService.js';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const termosRef = ref(null);

const tabAtivo = ref('criar');
const nomeCompleto = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const aceitoTermos = ref(false);
const loading = ref(false);
const mensagemErro = ref('');
const mensagemSucesso = ref('');

// Validações de senha
const validacoes = computed(() => ({
    minLength: password.value.length >= 8,
    maiuscula: /[A-Z]/.test(password.value),
    minuscula: /[a-z]/.test(password.value),
    numero: /\d/.test(password.value),
    especial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password.value)
}));

const senhasCorrespondem = computed(() => {
    return password.value && confirmPassword.value && password.value === confirmPassword.value;
});

const senhaValida = computed(() => {
    return Object.values(validacoes.value).every((v) => v === true);
});

const formularioValido = computed(() => {
    return nomeCompleto.value.trim() !== '' && email.value.trim() !== '' && senhaValida.value && senhasCorrespondem.value && aceitoTermos.value;
});

const abrirTermos = () => {
    termosRef.value?.abrir();
};

const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formularioValido.value) return;

    loading.value = true;
    mensagemErro.value = '';
    mensagemSucesso.value = '';

    try {
        const response = await AuthService.criarContaGratis({
            nome: nomeCompleto.value,
            email: email.value,
            senha: password.value
        });

        // Sucesso
        if (response.status === 201 && response.data.success) {
            mensagemSucesso.value = response.data.message;

            // Aguarda um pouco para mostrar a mensagem de sucesso, depois redireciona
            setTimeout(() => {
                router.push({
                    name: 'login',
                    query: { contaCriada: true, email: email.value }
                });
            }, 2000);
        }
    } catch (error) {
        // Erro
        if (error.response && error.response.data && error.response.data.message) {
            mensagemErro.value = error.response.data.message;
        } else if (error.response && error.response.status === 400) {
            mensagemErro.value = 'Erro ao criar conta. Tente novamente.';
        } else {
            mensagemErro.value = 'Erro de conexão. Verifique sua internet e tente novamente.';
        }
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped></style>
