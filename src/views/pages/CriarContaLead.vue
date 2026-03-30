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
                    Parabéns! Você foi
                    <span class="block">selecionado para</span>
                    <span class="block">começar sua jornada.</span>
                </h1>
                <p class="text-lg mb-12 text-green-50">Você se inscreveu em nossa plataforma e foi aprovado para desfrutar de 30 dias completos de acesso a todas as funcionalidades Nutno.</p>

                <div class="flex gap-12">
                    <div>
                        <div class="text-4xl font-bold mb-2">30</div>
                        <div class="text-green-50">Dias de Teste</div>
                    </div>
                    <div>
                        <div class="text-4xl font-bold mb-2">∞</div>
                        <div class="text-green-50">Funcionalidades</div>
                    </div>
                </div>
            </div>

            <div class="text-sm text-green-50">© 2024 Nutno. Todos os direitos reservados.</div>
        </div>

        <!-- Lado Direito -->
        <div class="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 py-12">
            <div class="max-w-md mx-auto w-full">
                <!-- Cabeçalho -->
                <div class="mb-8">
                    <div class="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">✓ E-mail verificado e aprovado</div>
                    <h2 class="text-3xl font-bold text-gray-900 mb-2">Comece sua jornada</h2>
                    <p class="text-gray-600">Complete seu cadastro para acessar a plataforma Nutno por 30 dias integralmente.</p>
                </div>

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

                    <!-- E-mail (Apenas leitura) -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                        <div class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 flex items-center">
                            <span class="text-gray-700">{{ emailLead }}</span>
                            <span class="ml-auto text-green-600 font-bold">✓</span>
                        </div>
                        <p class="text-xs text-gray-500 mt-2">Este é o e-mail que você utilizou na inscrição</p>
                    </div>

                    <!-- Nome Completo -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                        <input v-model="nomeCompleto" type="text" placeholder="Seu nome completo" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition" />
                    </div>

                    <!-- Profissão (Opcional) -->
                    <!-- <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Profissão <span class="text-gray-400 text-xs">(Opcional)</span></label>
                        <input
                            v-model="profissao"
                            type="text"
                            placeholder="Ex: Nutricionista, Dietista, Estudante"
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                        />
                    </div> -->

                    <!-- Senha -->
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

                    <!-- Confirme a Senha -->
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

                    <!-- Info dos 30 dias -->
                    <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div class="flex gap-3">
                            <div class="text-2xl">🎉</div>
                            <div>
                                <p class="text-sm font-semibold text-green-900">30 dias de acesso completo</p>
                                <p class="text-xs text-green-700 mt-1">Você terá acesso a todas as funcionalidades Nutno por 30 dias a partir de agora, sem necessidade de cartão de crédito.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Aceitar Termos -->
                    <div class="flex items-start gap-3">
                        <input v-model="aceitoTermos" type="checkbox" id="termos" class="mt-1" />
                        <label for="termos" class="text-sm text-gray-700"> Aceito os <span class="font-semibold cursor-pointer text-green-600 hover:underline" @click="abrirTermos">Termos de Uso</span> </label>
                    </div>

                    <!-- Botão de Envio -->
                    <button
                        type="submit"
                        :disabled="!formularioValido || loading"
                        :class="[
                            'w-full font-bold py-3 rounded-lg transition flex items-center justify-center gap-2',
                            formularioValido && !loading ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        ]"
                    >
                        <span v-if="loading" class="inline-block animate-spin">⟳</span>
                        <span>{{ loading ? 'Criando conta...' : 'Ativar meus 30 dias de teste' }}</span>
                    </button>

                    <p class="text-center text-sm text-gray-600 mt-6">
                        Já tem uma conta?
                        <router-link to="/login" class="font-semibold cursor-pointer text-green-600 hover:underline">Faça login agora</router-link>
                    </p>
                </form>
            </div>
        </div>
    </div>

    <!-- Modal Termos de Uso -->
    <TermosDeUso ref="termosRef" />
</template>

<script setup>
import TermosDeUso from '@/components/TermosDeUso.vue';
import AuthService from '@/service/AuthService.js';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const termosRef = ref(null);

// Estados
const nomeCompleto = ref('');
const emailLead = ref('');
const password = ref('');
const confirmPassword = ref('');
const aceitoTermos = ref(false);
const loading = ref(false);
const mensagemErro = ref('');
const mensagemSucesso = ref('');
const emailValido = ref(false);

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
    return nomeCompleto.value.trim() !== '' && emailValido.value && senhaValida.value && senhasCorrespondem.value && aceitoTermos.value;
});

// Métodos
const abrirTermos = () => {
    termosRef.value?.abrir();
};

const verificarEmail = async () => {
    // Verifica se o email veio via query parameter
    const email = route.query.email;
    if (email) {
        emailLead.value = email;
        emailValido.value = true;
    } else {
        // Se não houver email, redireciona para a página de leads
        mensagemErro.value = 'E-mail não encontrado. Verifique o link de inscrição.';
        setTimeout(() => {
            router.push('/');
        }, 3000);
    }
};

const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formularioValido.value) return;

    loading.value = true;
    mensagemErro.value = '';
    mensagemSucesso.value = '';

    try {
        // Cria a conta com informação de que é um lead com período de teste
        const response = await AuthService.criarContaGratis({
            nome: nomeCompleto.value,
            email: emailLead.value,
            senha: password.value,
            isLead: true
        });

        // Sucesso
        if (response.status === 201 && response.data.success) {
            mensagemSucesso.value = 'Conta criada com sucesso! Redirecionando...';

            // Aguarda um pouco para mostrar a mensagem de sucesso, depois redireciona
            setTimeout(() => {
                router.push({
                    name: 'login',
                    query: { contaCriada: true, email: emailLead.value }
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

// Verificar email ao carregar
onMounted(() => {
    verificarEmail();
});
</script>

<style scoped></style>
