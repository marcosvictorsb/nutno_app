<template>
    <div class="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased">
        <!-- Header / Nav -->
        <header class="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16 items-center">
                    <div class="flex items-center gap-2 text-primary font-bold text-xl">
                        <span class="material-symbols-outlined text-3xl">eco</span>
                        <span>Nutno</span>
                    </div>
                    <nav class="hidden md:flex gap-8 items-center text-sm font-medium text-slate-600 dark:text-slate-300">
                        <a class="hover:text-primary transition-colors" href="#problema">O Problema</a>
                        <a class="hover:text-primary transition-colors" href="#como-funciona">Como Funciona</a>
                        <a class="hover:text-primary transition-colors" href="#beneficios">Benefícios</a>
                        <a class="hover:text-primary transition-colors" href="#precos">Preços</a>
                        <button @click="router.push('/auth/login')" class="border border-primary text-primary px-5 py-2 rounded-lg font-bold hover:bg-primary/10 transition-all">Entrar</button>
                        <button @click="irParaCadastroGratis()" class="bg-primary text-white px-5 py-2 rounded-lg font-bold hover:bg-primary-dark transition-all">Começar grátis</button>
                    </nav>
                </div>
            </div>
        </header>
        <!-- Hero Section -->
        <section class="relative pt-16 pb-24 overflow-hidden">
            <div class="max-w-4xl mx-auto px-4 text-center">
                <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 leading-tight">Monte a dieta do seu paciente em minutos e envie direto pelo celular</h1>
                <p class="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto">Chega de planilhas e Word. Com o Nutno você cria, organiza e envia planos alimentares profissionais de forma simples e rápida.</p>
                <!-- CTA Buttons -->
                <div class="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                    <button @click="irParaCadastroGratis()" class="bg-primary text-white font-bold px-8 py-4 rounded-xl hover:bg-primary-dark transition-all whitespace-nowrap">Começar grátis agora</button>
                    <button @click="scrollToPrecos()" class="border-2 border-primary text-primary font-bold px-8 py-4 rounded-xl hover:bg-primary/10 transition-all whitespace-nowrap">Ver planos e preços</button>
                </div>
                <p class="text-sm text-slate-500">Sem cartão de crédito</p>
            </div>
        </section>
        <!-- Problem Section -->
        <section class="py-20 bg-slate-50 dark:bg-slate-950/50" id="problema">
            <div class="max-w-7xl mx-auto px-4">
                <h2 class="text-3xl font-bold text-center mb-16 text-slate-900 dark:text-white">Você ainda perde horas fazendo isso?</h2>
                <div class="grid md:grid-cols-3 gap-8">
                    <div class="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 text-center">
                        <div class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span class="material-symbols-outlined text-3xl">description</span>
                        </div>
                        <h3 class="font-bold text-xl mb-3">Formatação Word/Excel</h3>
                        <p class="text-slate-600 dark:text-slate-400">Lutando com tabelas que quebram e fontes que não batem toda vez que cria uma dieta.</p>
                    </div>
                    <div class="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 text-center">
                        <div class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span class="material-symbols-outlined text-3xl">chat</span>
                        </div>
                        <h3 class="font-bold text-xl mb-3">PDF via WhatsApp</h3>
                        <p class="text-slate-600 dark:text-slate-400">Pacientes perdendo o arquivo na conversa e você tendo que re-enviar constantemente.</p>
                    </div>
                    <div class="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 text-center">
                        <div class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span class="material-symbols-outlined text-3xl">history_edu</span>
                        </div>
                        <h3 class="font-bold text-xl mb-3">Anamnese em Papel</h3>
                        <p class="text-slate-600 dark:text-slate-400">Informações vitais espalhadas em pastas físicas difíceis de consultar e organizar.</p>
                    </div>
                </div>
            </div>
        </section>
        <!-- Solution Steps -->
        <section class="py-20" id="como-funciona">
            <div class="max-w-7xl mx-auto px-4">
                <div class="text-center mb-16">
                    <h2 class="text-3xl font-bold text-slate-900 dark:text-white">Simples assim. Do cadastro à dieta em 3 passos.</h2>
                </div>
                <div class="grid md:grid-cols-3 gap-12 relative">
                    <!-- Step 1 -->
                    <div class="flex flex-col items-center text-center">
                        <div class="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xl mb-6">1</div>
                        <h3 class="font-bold text-lg mb-2">Coleta de Informações</h3>
                        <p class="text-slate-600 dark:text-slate-400">Realize a anamnese completa direto na plataforma, de forma rápida e intuitiva.</p>
                    </div>
                    <!-- Step 2 -->
                    <div class="flex flex-col items-center text-center">
                        <div class="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xl mb-6">2</div>
                        <h3 class="font-bold text-lg mb-2">Monte a Dieta (TACO)</h3>
                        <p class="text-slate-600 dark:text-slate-400">Use a base de dados TACO para cálculos precisos de macros e micronutrientes.</p>
                    </div>
                    <!-- Step 3 -->
                    <div class="flex flex-col items-center text-center">
                        <div class="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xl mb-6">3</div>
                        <h3 class="font-bold text-lg mb-2">Envio Instantâneo</h3>
                        <p class="text-slate-600 dark:text-slate-400">Gere um link exclusivo ou envie diretamente pelo WhatsApp do seu paciente.</p>
                    </div>
                </div>
            </div>
        </section>
        <!-- Patient Tracking -->
        <section class="py-20 bg-primary/5">
            <div class="max-w-5xl mx-auto px-4">
                <div class="flex flex-col md:flex-row items-center gap-12">
                    <div class="flex-1">
                        <h2 class="text-3xl font-bold mb-6">Seu paciente pode te avisar quando não seguiu a dieta</h2>
                        <p class="text-slate-600 dark:text-slate-400 mb-8">Aumente a aderência e saiba exatamente onde seu paciente está encontrando dificuldades em tempo real.</p>
                        <div class="space-y-4">
                            <div class="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-primary/20 shadow-sm">
                                <span class="material-symbols-outlined text-primary text-3xl">check_circle</span>
                                <div>
                                    <p class="font-bold mb-0">Seguiu o plano</p>
                                    <p class="text-sm text-slate-500">Café da manhã completo e nutritivo</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-yellow-400/20 shadow-sm">
                                <span class="material-symbols-outlined text-yellow-500 text-3xl">report_problem</span>
                                <div>
                                    <p class="font-bold mb-0">Refeição pulada</p>
                                    <p class="text-sm text-slate-500">Almoço não realizado por falta de tempo</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="flex-1 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 rotate-2">
                        <div class="bg-primary/10 rounded-xl p-4 mb-4">
                            <div class="h-2 w-24 bg-primary/30 rounded mb-2"></div>
                            <div class="h-4 w-48 bg-primary rounded mb-4"></div>
                            <div class="grid grid-cols-7 gap-1">
                                <div class="h-8 bg-primary rounded-sm"></div>
                                <div class="h-8 bg-primary rounded-sm"></div>
                                <div class="h-8 bg-primary rounded-sm"></div>
                                <div class="h-8 bg-yellow-400 rounded-sm"></div>
                                <div class="h-8 bg-primary rounded-sm"></div>
                                <div class="h-8 bg-primary rounded-sm"></div>
                                <div class="h-8 bg-primary/20 rounded-sm"></div>
                            </div>
                        </div>
                        <p class="text-xs text-center text-slate-400">Visualização exclusiva do dashboard do Nutricionista</p>
                    </div>
                </div>
            </div>
        </section>
        <!-- Quick Benefits Grid -->
        <section class="py-20" id="beneficios">
            <div class="max-w-7xl mx-auto px-4">
                <h2 class="text-3xl font-bold text-center mb-16">Tudo o que você precisa em um só lugar</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div class="p-6 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/50 transition-colors">
                        <span class="material-symbols-outlined text-primary mb-4">clinical_notes</span>
                        <h3 class="font-bold text-lg mb-2 mt-0">Anamnese</h3>
                        <p class="text-slate-600 text-sm">Questionários pré-definidos e customizáveis para cada paciente.</p>
                    </div>
                    <div class="p-6 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/50 transition-colors">
                        <span class="material-symbols-outlined text-primary mb-4">table_chart</span>
                        <h3 class="font-bold text-lg mb-2 mt-0">Tabela TACO</h3>
                        <p class="text-slate-600 text-sm">Acesso completo à tabela oficial para precisão nutricional absoluta.</p>
                    </div>
                    <div class="p-6 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/50 transition-colors">
                        <span class="material-symbols-outlined text-primary mb-4">visibility</span>
                        <h3 class="font-bold text-lg mb-2 mt-0">Dieta Visual</h3>
                        <p class="text-slate-600 text-sm">Layouts modernos que facilitam a leitura do paciente.</p>
                    </div>
                    <div class="p-6 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/50 transition-colors">
                        <span class="material-symbols-outlined text-primary mb-4">send_and_archive</span>
                        <h3 class="font-bold text-lg mb-2 mt-0">WhatsApp/Email</h3>
                        <p class="text-slate-600 text-sm">Envie o plano com um clique sem precisar baixar PDFs.</p>
                    </div>
                    <div class="p-6 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/50 transition-colors">
                        <span class="material-symbols-outlined text-primary mb-4">bar_chart</span>
                        <h3 class="font-bold text-lg mb-2 mt-0">Relatórios de Adesão</h3>
                        <p class="text-slate-600 text-sm">Gráficos automáticos sobre o cumprimento da dieta pelo paciente.</p>
                    </div>
                    <div class="p-6 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/50 transition-colors">
                        <span class="material-symbols-outlined text-primary mb-4">timeline</span>
                        <h3 class="font-bold text-lg mb-2 mt-0">Histórico de Evolução</h3>
                        <p class="text-slate-600 text-sm">Acompanhe medidas e fotos de forma organizada por consulta.</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Pricing Section -->
        <section class="py-20 bg-slate-50 dark:bg-slate-950/50" id="precos">
            <div class="max-w-7xl mx-auto px-4">
                <div class="text-center mb-16">
                    <h2 class="text-3xl font-bold text-slate-900 dark:text-white mb-4">Escolha seu plano</h2>
                    <p class="text-lg text-slate-600 dark:text-slate-400">Comece grátis. Faça upgrade quando quiser. Cancele a qualquer momento.</p>
                </div>
                <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <!-- Free Plan Card -->
                    <div class="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-8 flex flex-col">
                        <div class="inline-block w-fit mb-4 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                            <span class="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Grátis para sempre</span>
                        </div>
                        <h3 class="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Free</h3>
                        <div class="mb-6">
                            <span class="text-4xl font-bold text-slate-900 dark:text-white">R$ 0</span>
                            <span class="text-slate-600 dark:text-slate-400">/mês</span>
                        </div>
                        <p class="text-slate-600 dark:text-slate-400 mb-8">Para começar sem risco</p>
                        <ul class="space-y-4 mb-8 flex-grow">
                            <li class="flex items-start gap-3">
                                <span class="text-primary font-bold text-xl">✓</span>
                                <span class="text-slate-700 dark:text-slate-300">Até 3 pacientes ativos</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-primary font-bold text-xl">✓</span>
                                <span class="text-slate-700 dark:text-slate-300">Planos alimentares ilimitados</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-primary font-bold text-xl">✓</span>
                                <span class="text-slate-700 dark:text-slate-300">Banco TACO + TBCA completo</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-primary font-bold text-xl">✓</span>
                                <span class="text-slate-700 dark:text-slate-300">Envio do plano por link</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-primary font-bold text-xl">✓</span>
                                <span class="text-slate-700 dark:text-slate-300">Anamnese digital básica</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-slate-400 font-bold text-xl line-through">✗</span>
                                <span class="text-slate-400">Personalização de logo</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-slate-400 font-bold text-xl line-through">✗</span>
                                <span class="text-slate-400">Histórico de medidas</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-slate-400 font-bold text-xl line-through">✗</span>
                                <span class="text-slate-400">Relatórios de adesão</span>
                            </li>
                        </ul>
                        <button @click="irParaCadastroGratis()" class="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold px-6 py-3 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                            Criar conta grátis
                        </button>
                    </div>

                    <!-- Pro Plan Card -->
                    <div class="bg-white dark:bg-slate-900 rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/5 to-transparent p-8 flex flex-col ring-2 ring-primary/20">
                        <div class="inline-block w-fit mb-4 px-3 py-1 bg-primary/20 rounded-full">
                            <span class="text-xs font-bold text-primary uppercase">Mais popular</span>
                        </div>
                        <h3 class="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Pro</h3>
                        <div class="mb-2">
                            <span class="text-4xl font-bold text-slate-900 dark:text-white">R$ 59,90</span>
                            <span class="text-slate-600 dark:text-slate-400">/mês</span>
                        </div>
                        <p class="text-sm text-slate-600 dark:text-slate-400 mb-8">ou R$ 47,90/mês no plano anual</p>
                        <p class="text-slate-600 dark:text-slate-400 mb-8">Para nutricionistas que querem crescer</p>
                        <ul class="space-y-4 mb-8 flex-grow">
                            <li class="flex items-start gap-3">
                                <span class="text-primary font-bold text-xl">✓</span>
                                <span class="text-slate-700 dark:text-slate-300">Pacientes ilimitados</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-primary font-bold text-xl">✓</span>
                                <span class="text-slate-700 dark:text-slate-300">Planos alimentares ilimitados</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-primary font-bold text-xl">✓</span>
                                <span class="text-slate-700 dark:text-slate-300">Banco TACO + TBCA completo</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-primary font-bold text-xl">✓</span>
                                <span class="text-slate-700 dark:text-slate-300">Envio por WhatsApp e e-mail</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-primary font-bold text-xl">✓</span>
                                <span class="text-slate-700 dark:text-slate-300">Anamnese completa com link para paciente</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-primary font-bold text-xl">✓</span>
                                <span class="text-slate-700 dark:text-slate-300">Histórico de medidas e evolução</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-primary font-bold text-xl">✓</span>
                                <span class="text-slate-700 dark:text-slate-300">Registro de adesão por refeição</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-primary font-bold text-xl">✓</span>
                                <span class="text-slate-700 dark:text-slate-300">Relatórios de evolução do paciente</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-primary font-bold text-xl">✓</span>
                                <span class="text-slate-700 dark:text-slate-300">Personalização de logo nos planos</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <span class="text-primary font-bold text-xl">✓</span>
                                <span class="text-slate-700 dark:text-slate-300">Suporte por e-mail</span>
                            </li>
                        </ul>
                        <button @click="irParaCadastroGratis()" class="w-full bg-primary text-white font-bold px-6 py-3 rounded-lg hover:bg-primary-dark transition-all">Assinar Pro</button>
                    </div>
                </div>
                <div class="text-center mt-12">
                    <p class="text-sm text-slate-600 dark:text-slate-400">🔒 Pagamento seguro · Cancele quando quiser · Sem fidelidade</p>
                </div>
            </div>
        </section>

        <section class="py-20 bg-slate-50 dark:bg-slate-950/50">
            <div class="max-w-7xl mx-auto px-4">
                <h2 class="text-3xl font-bold text-center mb-16">O que dizem os primeiros usuários</h2>
                <div class="grid md:grid-cols-3 gap-8">
                    <div class="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm italic text-slate-600 dark:text-slate-400">
                        <p class="mb-6">"Finalmente consigo enviar a dieta de forma organizada e o paciente entende tudo direto no celular. Sem PDF, sem confusão."</p>
                        <div class="flex items-center gap-4 not-italic">
                            <div class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                <span class="material-symbols-outlined">person</span>
                            </div>
                            <div>
                                <p class="font-bold text-slate-900 dark:text-white">Nutricionista</p>
                                <p class="text-xs text-slate-500">São Paulo</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm italic text-slate-600 dark:text-slate-400">
                        <p class="mb-6">"A tabela TACO integrada faz toda a diferença. Monto o plano muito mais rápido do que no Word."</p>
                        <div class="flex items-center gap-4 not-italic">
                            <div class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                <span class="material-symbols-outlined">person</span>
                            </div>
                            <div>
                                <p class="font-bold text-slate-900 dark:text-white">Nutricionista</p>
                                <p class="text-xs text-slate-500">Rio de Janeiro</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm italic text-slate-600 dark:text-slate-400">
                        <p class="mb-6">"O paciente consegue registrar se seguiu ou não a refeição. Isso mudou como eu acompanho a adesão."</p>
                        <div class="flex items-center gap-4 not-italic">
                            <div class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                <span class="material-symbols-outlined">person</span>
                            </div>
                            <div>
                                <p class="font-bold text-slate-900 dark:text-white">Nutricionista</p>
                                <p class="text-xs text-slate-500">Minas Gerais</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <!-- Final CTA -->
        <section class="py-24 bg-primary-dark text-white">
            <div class="max-w-4xl mx-auto px-4 text-center">
                <h2 class="text-3xl md:text-5xl font-bold mb-8 text-white">Pronto para simplificar sua prática clínica?</h2>
                <p class="text-xl text-white mb-12">Junte-se a nutricionistas que já economizam horas toda semana.</p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <button @click="irParaCadastroGratis()" class="bg-white text-primary-dark font-bold px-8 py-3 rounded-lg hover:bg-slate-100 transition-all whitespace-nowrap">Criar conta grátis</button>
                    <button @click="scrollToPrecos()" class="border-2 border-white text-white font-bold px-8 py-3 rounded-lg hover:bg-white/10 transition-all whitespace-nowrap">Ver planos e preços</button>
                </div>
            </div>
        </section>
        <!-- Footer -->
        <footer class="py-12 bg-slate-900 text-slate-400 border-t border-slate-800">
            <div class="max-w-7xl mx-auto px-4">
                <div class="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
                    <div class="flex items-center gap-2 text-primary font-bold text-xl">
                        <span class="material-symbols-outlined text-3xl">eco</span>
                        <span>Nutno</span>
                    </div>
                    <p class="text-center md:text-left">Feito com 💚 para nutricionistas brasileiros</p>
                    <!--
                    <div class="flex gap-6">
                        <a class="hover:text-white" href="#">Instagram</a>
                        <a class="hover:text-white" href="#">E-mail</a>
                        <a class="hover:text-white" href="#">Suporte</a>
                    </div>
                --></div>
                <div class="text-center text-xs border-t border-slate-800 pt-8">© 2024 Nutno SaaS. Todos os direitos reservados.</div>
            </div>
        </footer>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const irParaCadastro = () => {
    router.push('/criar-conta-gratis');
};

const irParaCadastroGratis = () => {
    router.push('/criar-conta-gratis');
};

const scrollToPrecos = () => {
    const element = document.getElementById('precos');
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
};
</script>

<style scoped></style>
