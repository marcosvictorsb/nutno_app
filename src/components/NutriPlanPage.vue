<script setup>
import { LeadsService } from '@/service/LeadsService';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const heroName = ref('');
const heroEmail = ref('');
const ctaEmail = ref('');
const isLoadingHero = ref(false);
const isLoadingCta = ref(false);
const totalLeads = ref(214);

const fetchLeadsCount = async () => {
    try {
        const response = await LeadsService.getLeadsCount();
        if (response.success && response.data && response.data.count) {
            // Somar o count do backend + 214 (fictício)
            totalLeads.value = response.data.count + 214;
        }
    } catch (error) {
        console.error('Erro ao buscar contagem de leads:', error);
        // Manter o valor padrão de 214 em caso de erro
    }
};

onMounted(() => {
    fetchLeadsCount();
});

const submitHeroLead = async () => {
    if (!heroName.value.trim() || !heroEmail.value.trim()) {
        toast.add({
            severity: 'warn',
            summary: 'Campos obrigatórios',
            detail: 'Por favor, preencha o nome e o email',
            life: 3000
        });
        return;
    }

    isLoadingHero.value = true;
    try {
        await LeadsService.sendLead({
            name: heroName.value,
            email: heroEmail.value
        });
        toast.add({
            severity: 'success',
            summary: 'Sucesso!',
            detail: 'Você foi adicionado à lista de espera',
            life: 3000
        });
        heroName.value = '';
        heroEmail.value = '';
        fetchLeadsCount();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao enviar. Por favor, tente novamente.',
            life: 3000
        });
    } finally {
        isLoadingHero.value = false;
    }
};

const submitCtaLead = async () => {
    if (!ctaEmail.value.trim()) {
        toast.add({
            severity: 'warn',
            summary: 'Campo obrigatório',
            detail: 'Por favor, preencha o email',
            life: 3000
        });
        return;
    }

    isLoadingCta.value = true;
    try {
        await LeadsService.sendLead({
            email: ctaEmail.value
        });
        toast.add({
            severity: 'success',
            summary: 'Sucesso!',
            detail: 'Você foi adicionado à lista de espera',
            life: 3000
        });
        ctaEmail.value = '';
        fetchLeadsCount();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao enviar. Por favor, tente novamente.',
            life: 3000
        });
    } finally {
        isLoadingCta.value = false;
    }
};
</script>

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
                        <button class="bg-primary text-white px-5 py-2 rounded-lg font-bold hover:bg-primary-dark transition-all">Lista de Espera</button>
                    </nav>
                </div>
            </div>
        </header>
        <!-- Hero Section -->
        <section class="relative pt-16 pb-24 overflow-hidden">
            <div class="max-w-4xl mx-auto px-4 text-center">
                <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 leading-tight">Monte a dieta do seu paciente em minutos e envie direto pelo celular</h1>
                <p class="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto">Chega de planilhas e Word. Com o Nutno você cria, organiza e envia planos alimentares profissionais de forma simples e rápida.</p>
                <!-- Lead Capture Form -->
                <div class="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 mb-6">
                    <form @submit.prevent="submitHeroLead" class="flex flex-col lg:flex-row gap-2">
                        <input v-model="heroName" class="flex-1 border-none focus:ring-0 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="Seu Nome" type="text" :disabled="isLoadingHero" />
                        <input v-model="heroEmail" class="flex-1 border-none focus:ring-0 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="Seu melhor e-mail" type="email" :disabled="isLoadingHero" />
                        <button class="bg-primary text-white font-bold px-8 py-3 rounded-xl hover:bg-primary-dark transition-all whitespace-nowrap lg:w-auto w-full" type="submit" :disabled="isLoadingHero">
                            {{ isLoadingHero ? 'Enviando...' : 'Quero conhecer primeiro — é grátis' }}
                        </button>
                    </form>
                </div>
                <p class="text-sm text-slate-500 mb-8">Seja um dos primeiros a testar. Sem cartão de crédito. Sem compromisso.</p>
                <div class="flex items-center justify-center gap-3">
                    <div class="flex -space-x-2">
                        <img
                            alt="Nutri 1"
                            class="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900"
                            data-alt="Portrait of a female nutritionist"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnN-udeayiq38vIiqBDTEwPtp9wIoaWl3iL2ogkOL8TPLw0Sax52Fqhiyw9gY7R90ejjLg1aOswHn86SGs02BRFx8TbL7pzqZcp62zZaNhWVMYwSyBV6sJ-k-AtH5hckeqoFaazI1wH5U-9yp2vpemMpE8Ocl_w2ZlrjQdptpGo-fQhsdqUNZxotONFieFqjSAiA23xEo5Fq6MNlOLJKQQB7loMmocjlQWm95GFgEaxQ1SVGIQxbBACkimhRYCTuqFKdz9oxaztMay"
                        />
                        <img
                            alt="Nutri 2"
                            class="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900"
                            data-alt="Portrait of a male health professional"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDDN5M66-CpFp4Kb6i34FDsYE62n-2tY1RBJd661qEpSqQfcmB1-G9Blgty0iSUC_cUTO7NeYNanYjL_-ehgoAWhY6DGwkONNR9J7jBoMjcbQJYqqkutO9kc0PNafUrqBAjFb7WL0WzX_hvKsjrpjdnwhz8TiY7zct9oCHCLkrlnAzsGX81CEwOVM-70BSTV6coOcStu4S2rmXsZrRD3tgvFYSQsLirjCd0BXKmtSg21FF8ae8phH6MncL6AJLpOvlGTYtu4RclDt2N"
                        />
                        <img
                            alt="Nutri 3"
                            class="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900"
                            data-alt="Close up of a professional doctor"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6fGys7XUAmpQiI9t93lloYIesSbu4oYI4a7a2omrpdmdMUtHwGIv5ryB6Yr_YeJBafuuZL1LviON8_GFopV2uCyn-hiXcHQ7zsA30W2kW5XJGTdjWGyRQt-zBY-IRwjxUHLlp3TaspVQ3SBzVB9g4w9u9Jmh2tlAl3H0U0JJPUstCOmAh_4H2F2IhJlzabe4tgrVC6eeK7OOLdXnm1wa_RJj7aLsWu3l_lLFX0xXkbwdAzfBVAlpwsxhYBfp9GLZZFabs-d75eg7a"
                        />
                    </div>
                    <span class="text-primary font-semibold text-sm">🎉 {{ totalLeads }} nutricionistas já estão na lista de espera</span>
                </div>
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
        <!--
        <section class="py-20 bg-slate-50 dark:bg-slate-950/50">
            <div class="max-w-7xl mx-auto px-4">
                <h2 class="text-3xl font-bold text-center mb-16">O que dizem os primeiros usuários</h2>
                <div class="grid md:grid-cols-3 gap-8">
                    <div class="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm italic text-slate-600 dark:text-slate-400">
                        <p class="mb-6">"Reduzi o tempo de montagem de dieta pela metade. O envio pelo WhatsApp mudou a relação com meus pacientes."</p>
                        <div class="flex items-center gap-4 not-italic">
                            <img
                                alt="Dra. Camila"
                                class="w-12 h-12 rounded-full"
                                data-alt="Portrait of Dr. Camila Rocha"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhgm_aB4cvJOARddBleWgRGrNgpQM5R_tlOrDKGoEz6CGxgAUF69MNrT0JX58HPMmL8svQnpLqGeE7vL7fhid4u4LlZjJoYZhYFzvwr5zX1yI1AYs3i-nTvJIbeiDzUAh7NSCuyPiWGC_KX5xBXnfoYYGipSeis0rI845Trfx7J1ipmmoRLkaC30ITjzfoP1Mrxu-xLF6IZfHjHHbSl2HdWHTsJ8gYf1-NldYF6qTK5H6F2an99vLbYFx9gG3CxwCdN4c3FvGFblkK"
                            />
                            <div>
                                <p class="font-bold text-slate-900 dark:text-white">Dra. Camila Rocha</p>
                                <p class="text-xs text-slate-500 uppercase tracking-widest">CRN 4-12345</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm italic text-slate-600 dark:text-slate-400">
                        <p class="mb-6">"O suporte para a tabela TACO é sensacional. Tudo flui de uma maneira muito profissional."</p>
                        <div class="flex items-center gap-4 not-italic">
                            <img
                                alt="Dra. Fernanda"
                                class="w-12 h-12 rounded-full"
                                data-alt="Portrait of Dr. Fernanda Lima"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-L3bmYM3EKqGpyLjgu2TDZ4Gqn7qU93I1kM-JrP9QGm7DW_3mErRVSJWYTDGkLgc4QGsoUg8EUFdUfHs0mxGjwutZFJSXv38CwlXD8yeSKyzjtVU9dysW-V_-wEJnbHiM-0MfuHjsMtN5ItpFsITij3CN3vjueH75i5rh0AhXFFoRW49NkBEqxyyYyhj0tZ_BAcNyJhOkgoJQ08fq76BHnm-1CFAeVoZe0ZLi4dcA7PN3zi1IKcMwRv5v_FN6HTUVDrkhkLh1GBEl"
                            />
                            <div>
                                <p class="font-bold text-slate-900 dark:text-white">Dra. Fernanda Lima</p>
                                <p class="text-xs text-slate-500 uppercase tracking-widest">CRN 2-98765</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm italic text-slate-600 dark:text-slate-400">
                        <p class="mb-6">"Os pacientes adoram o visual das dietas no celular. A adesão aumentou significativamente."</p>
                        <div class="flex items-center gap-4 not-italic">
                            <img
                                alt="Dra. Juliana"
                                class="w-12 h-12 rounded-full"
                                data-alt="Portrait of Dr. Juliana Matos"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKpsp8jowIS3wjBzWo6D9AgKhjv3bHkz0DWgMthaZscSUoe_YlYDa9PfX7kDJm8YRmESvDTsJ6DbNUj-Zx8RKQ3rmz7tnhmd0Rb_liqLfakUl7m7L64VU5yprtH0Ivw6eOkkixiWBRnB4Da3xrdwPrBYAkLmZWFyw2MvldyMHKe-9ZiZBpT_Tis9unpq0UbsTJSVq6wisM3kPPEzQjhfaQTbn7X-QOLhu4lBKY2g2nihH6N3cisVk2bYWQmdyiECjk2BrrEm0a0zYl"
                            />
                            <div>
                                <p class="font-bold text-slate-900 dark:text-white">Dra. Juliana Matos</p>
                                <p class="text-xs text-slate-500 uppercase tracking-widest">CRN 1-54321</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        Testimonials -->
        <!-- Final CTA -->
        <section class="py-24 bg-primary-dark text-white">
            <div class="max-w-4xl mx-auto px-4 text-center">
                <h2 class="text-3xl md:text-5xl font-bold mb-8 text-white">Pronto para transformar sua prática clínica?</h2>
                <p class="text-xl text-white mb-12">Entre para a lista exclusiva de lançamento e ganhe benefícios vitalícios.</p>
                <div class="bg-white/10 p-2 rounded-2xl shadow-xl border border-white/20 max-w-lg mx-auto">
                    <form @submit.prevent="submitCtaLead" class="flex flex-col md:flex-row gap-2">
                        <input v-model="ctaEmail" class="flex-1 border-none focus:ring-0 rounded-xl px-4 py-3 bg-white text-slate-900" placeholder="Seu melhor e-mail" type="email" :disabled="isLoadingCta" />
                        <button class="bg-white text-primary-dark font-bold px-8 py-3 rounded-xl hover:bg-slate-100 transition-all whitespace-nowrap" type="submit" :disabled="isLoadingCta">
                            {{ isLoadingCta ? 'Enviando...' : 'Quero participar agora' }}
                        </button>
                    </form>
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

<style scoped></style>
