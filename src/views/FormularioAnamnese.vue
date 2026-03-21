<template>
    <div class="min-h-screen bg-gradient-to-br from-emerald-50 to-sky-50">
        <!-- Loading State -->
        <div v-if="carregandoInicial" class="flex items-center justify-center min-h-screen">
            <div class="text-center">
                <div class="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p class="text-gray-600 font-semibold">Carregando formulário...</p>
            </div>
        </div>

        <!-- Error State -->
        <div v-else-if="erroValidacao" class="flex items-center justify-center min-h-screen">
            <div class="max-w-md mx-auto text-center bg-white rounded-lg p-8 shadow-lg">
                <div class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-4xl mx-auto mb-4">⚠️</div>
                <h2 class="text-2xl font-bold text-gray-900 mb-2">Formulário Inválido</h2>
                <p class="text-gray-600 mb-6">{{ erroValidacao }}</p>
                <a href="/" class="inline-block px-6 py-3 bg-emerald-600 text-white font-semibold rounded hover:bg-emerald-700">Voltar à página inicial</a>
            </div>
        </div>

        <!-- Already Completed State -->
        <div v-else-if="formularioPreenchido" class="flex items-center justify-center min-h-screen">
            <div class="max-w-md mx-auto text-center bg-white rounded-lg p-8 shadow-lg">
                <div class="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-4xl mx-auto mb-4">✓</div>
                <h2 class="text-2xl font-bold text-gray-900 mb-2">Formulário Já Preenchido</h2>
                <p class="text-gray-600 mb-2">
                    Olá <span class="font-semibold">{{ pacienteInfo?.como_prefere_ser_chamado || pacienteInfo?.nome_paciente }}</span
                    >!
                </p>
                <p class="text-gray-600 mb-6">
                    Seu formulário de anamnese já foi preenchido com sucesso. Seu profissional de saúde <strong>{{ pacienteInfo?.nome_nutricionista }}</strong> já tem acesso aos seus dados.
                </p>
                <div class="bg-emerald-50 border border-emerald-200 rounded p-4 mb-6">
                    <p class="text-sm text-emerald-900">🔐 Seus dados estão seguros e serão vistos apenas pelo profissional de saúde.</p>
                </div>
                <!-- <a href="/" class="inline-block px-6 py-3 bg-emerald-600 text-white font-semibold rounded hover:bg-emerald-700">Voltar à página inicial</a> -->
            </div>
        </div>

        <!-- Form Submitted Success State -->
        <div v-else-if="formularioEnviado" class="flex items-center justify-center min-h-screen">
            <div class="max-w-md mx-auto text-center bg-white rounded-lg p-8 shadow-lg">
                <div class="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-4xl mx-auto mb-4">✓</div>
                <h2 class="text-2xl font-bold text-gray-900 mb-2">Formulário Enviado</h2>
                <p class="text-gray-600 mb-6">Perfeito! Seu formulário de anamnese foi enviado com sucesso para a nutricionista.</p>
                <div class="bg-emerald-50 border border-emerald-200 rounded p-4 mb-6">
                    <p class="text-sm text-emerald-900">📋 A nutricionista analisará seus dados e entrará em contato em breve para agendar sua consulta.</p>
                </div>
                <p class="text-gray-600 text-sm mb-6">🔐 Seus dados estão seguros e serão vistos apenas pelo profissional de saúde.</p>
                <!-- <a href="/" class="inline-block px-6 py-3 bg-emerald-600 text-white font-semibold rounded hover:bg-emerald-700">Voltar à página inicial</a> -->
            </div>
        </div>

        <!-- Form State -->
        <div v-else>
            <!-- Header -->
            <header class="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-emerald-100/50 px-4 py-4">
                <div class="max-w-4xl mx-auto flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <svg class="w-8 h-8 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                        <h1 class="text-xl font-bold text-emerald-900">Nutno</h1>
                    </div>
                    <p class="text-sm text-gray-600">Pré-Consulta</p>
                </div>
            </header>

            <!-- Main Content -->
            <main class="max-w-4xl mx-auto px-4 py-8">
                <!-- Progress Section -->
                <section>
                    <div class="flex justify-between items-end mb-4">
                        <div>
                            <p class="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">Formulário de Pré-Consulta</p>
                            <h2 class="text-2xl font-bold text-gray-900">Etapa {{ etapaAtual }} de 6 — {{ tituloEtapa }}</h2>
                        </div>
                        <span class="text-sm font-medium text-gray-600">{{ percentualConcluido }}% concluído</span>
                    </div>
                    <div class="w-full h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-300" :style="{ width: percentualConcluido + '%' }"></div>
                    </div>
                </section>

                <!-- Form Sections -->
                <div class="space-y-8">
                    <!-- Bloco 1: Identificação -->
                    <section v-if="etapaAtual === 1" class="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 animate-fade-in">
                        <div class="flex items-center gap-4 mb-8">
                            <div class="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">👤</div>
                            <h3 class="text-xl font-bold text-gray-900">Identificação</h3>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Nome Completo -->
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Nome completo *</label>
                                <input
                                    v-model="form.nome_completo"
                                    type="text"
                                    placeholder="Seu nome completo"
                                    class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                    @input="limparErro('nome_completo')"
                                />
                                <p v-if="erros.nome_completo" class="text-red-500 text-xs mt-1">{{ erros.nome_completo }}</p>
                            </div>

                            <!-- Como prefere ser chamado -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Como prefere ser chamado? *</label>
                                <input
                                    v-model="form.como_prefere_ser_chamado"
                                    type="text"
                                    placeholder="Apelido"
                                    class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                    @input="limparErro('como_prefere_ser_chamado')"
                                />
                                <p v-if="erros.como_prefere_ser_chamado" class="text-red-500 text-xs mt-1">{{ erros.como_prefere_ser_chamado }}</p>
                            </div>

                            <!-- Data de Nascimento -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Data de Nascimento *</label>
                                <input
                                    v-model="form.data_nascimento"
                                    type="date"
                                    class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                    @input="limparErro('data_nascimento')"
                                />
                                <p v-if="erros.data_nascimento" class="text-red-500 text-xs mt-1">{{ erros.data_nascimento }}</p>
                            </div>

                            <!-- Gênero -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Gênero *</label>
                                <div class="flex gap-2">
                                    <button
                                        v-for="opcao in opcoesGenero"
                                        :key="opcao.value"
                                        @click="
                                            form.sexo = opcao.value;
                                            limparErro('sexo');
                                        "
                                        :class="['flex-1 py-3 rounded-lg font-medium text-sm transition-all', form.sexo === opcao.value ? 'bg-emerald-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200']"
                                    >
                                        {{ opcao.label }}
                                    </button>
                                </div>
                                <p v-if="erros.sexo" class="text-red-500 text-xs mt-1">{{ erros.sexo }}</p>
                            </div>

                            <!-- Telefone -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Telefone</label>
                                <input v-model="form.telefone" type="tel" placeholder="(11) 99999-9999" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
                            </div>

                            <!-- WhatsApp -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">WhatsApp</label>
                                <div class="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                                    <input v-model="form.whatsapp" type="tel" placeholder="(11) 99999-9999" class="flex-1 bg-transparent border-none focus:outline-none focus:ring-0" />
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- Bloco 2: Corpo Atual -->
                    <section v-if="etapaAtual === 2" class="bg-white rounded-2xl border-2 border-emerald-200 shadow-xl p-8 animate-fade-in">
                        <div class="flex items-center gap-4 mb-8">
                            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold">⚖️</div>
                            <h3 class="text-xl font-bold text-gray-900">Corpo Atual</h3>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <!-- Peso Atual -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Peso atual (kg) *</label>
                                <div class="relative">
                                    <input
                                        v-model.number="form.peso_atual"
                                        type="number"
                                        step="0.1"
                                        placeholder="00.0"
                                        class="w-full px-4 py-4 pr-12 bg-gray-50 border border-gray-200 rounded-lg text-2xl font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                        @input="limparErro('peso_atual')"
                                    />
                                    <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 font-medium">kg</span>
                                </div>
                                <p v-if="erros.peso_atual" class="text-red-500 text-xs mt-1">{{ erros.peso_atual }}</p>
                            </div>

                            <!-- Altura -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Altura (cm) *</label>
                                <div class="relative">
                                    <input
                                        v-model.number="form.altura"
                                        type="number"
                                        step="0.1"
                                        placeholder="170"
                                        class="w-full px-4 py-4 pr-12 bg-gray-50 border border-gray-200 rounded-lg text-2xl font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                        @input="limparErro('altura')"
                                    />
                                    <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 font-medium">cm</span>
                                </div>
                                <p v-if="erros.altura" class="text-red-500 text-xs mt-1">{{ erros.altura }}</p>
                            </div>

                            <!-- Tempo nesse peso -->
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-3">Quanto tempo você mantém esse peso? *</label>
                                <div class="flex flex-wrap gap-3">
                                    <button
                                        v-for="opcao in opcoesTempo"
                                        :key="opcao.value"
                                        @click="
                                            form.tempo_nesse_peso = opcao.value;
                                            limparErro('tempo_nesse_peso');
                                        "
                                        :class="['px-6 py-3 rounded-full text-sm font-medium transition-all', form.tempo_nesse_peso === opcao.value ? 'bg-emerald-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200']"
                                    >
                                        {{ opcao.label }}
                                    </button>
                                </div>
                                <p v-if="erros.tempo_nesse_peso" class="text-red-500 text-xs mt-1">{{ erros.tempo_nesse_peso }}</p>
                            </div>

                            <!-- Acompanhamento anterior -->
                            <div class="md:col-span-2 flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                                <div>
                                    <p class="font-semibold text-gray-900">Já fez acompanhamento nutricional antes?</p>
                                    <p class="text-xs text-gray-600 mt-1">Isso nos ajuda a entender sua experiência prévia.</p>
                                </div>
                                <input v-model="form.fez_acompanhamento_antes" type="checkbox" class="w-6 h-6 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                            </div>

                            <!-- Qual acompanhamento -->
                            <div v-if="form.fez_acompanhamento_antes" class="md:col-span-2 animate-fade-in">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Qual foi o acompanhamento?</label>
                                <input
                                    v-model="form.qual_acompanhamento"
                                    type="text"
                                    placeholder="Descreva brevemente..."
                                    class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                />
                            </div>
                        </div>
                    </section>

                    <!-- Bloco 3: Objetivo -->
                    <section v-if="etapaAtual === 3" class="space-y-6 animate-fade-in">
                        <div>
                            <p class="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">Etapa 3</p>
                            <h3 class="text-xl font-bold text-gray-900 mb-6">Qual seu principal objetivo? *</h3>
                        </div>

                        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <button
                                v-for="opcao in opcoesObjetivo"
                                :key="opcao.value"
                                @click="
                                    form.objetivo = opcao.value;
                                    limparErro('objetivo');
                                "
                                :class="[
                                    'group p-6 rounded-2xl border-2 transition-all text-center flex flex-col items-center gap-3',
                                    form.objetivo === opcao.value ? 'border-emerald-500 bg-emerald-50 shadow-lg' : 'border-gray-200 bg-white hover:border-emerald-300'
                                ]"
                            >
                                <div :class="['w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all', form.objetivo === opcao.value ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600']">
                                    {{ opcao.icon }}
                                </div>
                                <span class="text-sm font-semibold text-gray-900">{{ opcao.label }}</span>
                            </button>
                        </div>

                        <p v-if="erros.objetivo" class="text-red-500 text-xs">{{ erros.objetivo }}</p>

                        <!-- Descrição do objetivo -->
                        <div class="mt-8">
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Descreva seu objetivo com mais detalhes</label>
                            <textarea
                                v-model="form.objetivo_descricao"
                                placeholder="Conte-nos mais sobre seu objetivo..."
                                rows="4"
                                class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                            ></textarea>
                        </div>

                        <!-- Maior dificuldade -->
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Qual é sua maior dificuldade com alimentação?</label>
                            <textarea
                                v-model="form.maior_dificuldade_alimentacao"
                                placeholder="Descreva sua maior dificuldade..."
                                rows="3"
                                class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                            ></textarea>
                        </div>
                    </section>

                    <!-- Bloco 4: Rotina -->
                    <section v-if="etapaAtual === 4" class="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 animate-fade-in space-y-8">
                        <div class="flex items-center gap-4 mb-8">
                            <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">🕐</div>
                            <h3 class="text-xl font-bold text-gray-900">Sua Rotina</h3>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Horários -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Que horas você acorda? *</label>
                                <input
                                    v-model="form.horario_acorda"
                                    type="time"
                                    class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                    @input="limparErro('horario_acorda')"
                                />
                                <p v-if="erros.horario_acorda" class="text-red-500 text-xs mt-1">{{ erros.horario_acorda }}</p>
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Que horas você dorme? *</label>
                                <input
                                    v-model="form.horario_dorme"
                                    type="time"
                                    class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                    @input="limparErro('horario_dorme')"
                                />
                                <p v-if="erros.horario_dorme" class="text-red-500 text-xs mt-1">{{ erros.horario_dorme }}</p>
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Café da manhã</label>
                                <input v-model="form.horario_cafe_manha" type="time" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Almoço</label>
                                <input v-model="form.horario_almoco" type="time" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Jantar</label>
                                <input v-model="form.horario_jantar" type="time" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
                            </div>

                            <!-- Trabalho -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Onde você trabalha? *</label>
                                <div class="flex gap-2">
                                    <button
                                        v-for="opcao in opcoesTrabalhoCasaOuFora"
                                        :key="opcao.value"
                                        @click="
                                            form.trabalha_casa_ou_fora = opcao.value;
                                            limparErro('trabalha_casa_ou_fora');
                                        "
                                        :class="['flex-1 py-2.5 rounded-lg text-xs font-medium transition-all', form.trabalha_casa_ou_fora === opcao.value ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200']"
                                    >
                                        {{ opcao.label }}
                                    </button>
                                </div>
                                <p v-if="erros.trabalha_casa_ou_fora" class="text-red-500 text-xs mt-1">{{ erros.trabalha_casa_ou_fora }}</p>
                            </div>

                            <!-- Tempo para cozinhar -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Tem tempo para cozinhar? *</label>
                                <div class="flex gap-2">
                                    <button
                                        v-for="opcao in opcoesTempoCozinhar"
                                        :key="opcao.value"
                                        @click="
                                            form.tempo_parar_cozinhar = opcao.value;
                                            limparErro('tempo_parar_cozinhar');
                                        "
                                        :class="['flex-1 py-2.5 rounded-lg text-xs font-medium transition-all', form.tempo_parar_cozinhar === opcao.value ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200']"
                                    >
                                        {{ opcao.label }}
                                    </button>
                                </div>
                                <p v-if="erros.tempo_parar_cozinhar" class="text-red-500 text-xs mt-1">{{ erros.tempo_parar_cozinhar }}</p>
                            </div>
                        </div>

                        <!-- Exercícios -->
                        <div class="pt-4 border-t border-gray-200">
                            <div class="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div>
                                    <p class="font-semibold text-gray-900">Pratica exercícios físicos?</p>
                                    <p class="text-xs text-gray-600 mt-1">Musculação, corrida, natação...</p>
                                </div>
                                <input v-model="form.faz_exercicios" type="checkbox" class="w-6 h-6 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                            </div>

                            <div v-if="form.faz_exercicios" class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 mb-2">Qual exercício?</label>
                                    <input
                                        v-model="form.qual_exercicio"
                                        type="text"
                                        placeholder="Ex: Musculação, Corrida..."
                                        class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 mb-2">Frequência por semana *</label>
                                    <input
                                        v-model.number="form.frequencia_exercicio_semana"
                                        type="number"
                                        min="0"
                                        max="7"
                                        class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                        @input="limparErro('frequencia_exercicio_semana')"
                                    />
                                    <p v-if="erros.frequencia_exercicio_semana" class="text-red-500 text-xs mt-1">{{ erros.frequencia_exercicio_semana }}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- Bloco 5: Alimentação -->
                    <section v-if="etapaAtual === 5" class="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 animate-fade-in space-y-6">
                        <div class="flex items-center gap-4 mb-8">
                            <div class="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">🍽️</div>
                            <h3 class="text-xl font-bold text-gray-900">Alimentação</h3>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Alimentos que você ama</label>
                                <textarea
                                    v-model="form.alimentos_que_ama"
                                    placeholder="Liste seus alimentos favoritos..."
                                    rows="3"
                                    class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                                ></textarea>
                            </div>

                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Alimentos que você odeia</label>
                                <textarea
                                    v-model="form.alimentos_que_odeia"
                                    placeholder="Liste alimentos que não gosta..."
                                    rows="3"
                                    class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                                ></textarea>
                            </div>

                            <!-- Restrições -->
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-3">Possui alguma restrição alimentar? *</label>
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    <button
                                        v-for="opcao in opcoesRestricao"
                                        :key="opcao.value"
                                        @click="
                                            form.restricao_alimentar = opcao.value;
                                            limparErro('restricao_alimentar');
                                        "
                                        :class="['px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-center', form.restricao_alimentar === opcao.value ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200']"
                                    >
                                        {{ opcao.label }}
                                    </button>
                                </div>
                                <p v-if="erros.restricao_alimentar" class="text-red-500 text-xs mt-1">{{ erros.restricao_alimentar }}</p>
                            </div>

                            <div v-if="form.restricao_alimentar && form.restricao_alimentar !== 'nenhuma'" class="md:col-span-2 animate-fade-in">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Descreva a restrição</label>
                                <input
                                    v-model="form.restricao_descricao"
                                    type="text"
                                    placeholder="Descreva sua restrição..."
                                    class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                />
                            </div>

                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Alergias alimentares</label>
                                <textarea
                                    v-model="form.alergias_alimentares"
                                    placeholder="Liste suas alergias alimentares..."
                                    rows="3"
                                    class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                                ></textarea>
                            </div>

                            <!-- Copos de água -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Copos de água por dia *</label>
                                <input
                                    v-model.number="form.copos_agua_por_dia"
                                    type="number"
                                    min="0"
                                    placeholder="8"
                                    class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                    @input="limparErro('copos_agua_por_dia')"
                                />
                                <p v-if="erros.copos_agua_por_dia" class="text-red-500 text-xs mt-1">{{ erros.copos_agua_por_dia }}</p>
                            </div>

                            <!-- Consumo de álcool -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Consumo de álcool *</label>
                                <select v-model="form.consumo_alcool" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" @change="limparErro('consumo_alcool')">
                                    <option value="">Selecione uma opção</option>
                                    <option value="nao">Não consome</option>
                                    <option value="socialmente">Socialmente</option>
                                    <option value="frequentemente">Frequentemente</option>
                                </select>
                                <p v-if="erros.consumo_alcool" class="text-red-500 text-xs mt-1">{{ erros.consumo_alcool }}</p>
                            </div>
                        </div>
                    </section>

                    <!-- Bloco 6: Saúde -->
                    <section v-if="etapaAtual === 6" class="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 animate-fade-in space-y-6">
                        <div class="flex items-center gap-4 mb-8">
                            <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">❤️</div>
                            <h3 class="text-xl font-bold text-gray-900">Saúde</h3>
                        </div>

                        <div class="space-y-6">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Doenças diagnosticadas</label>
                                <textarea
                                    v-model="form.doencas_diagnosticadas"
                                    placeholder="Liste suas doenças diagnosticadas..."
                                    rows="3"
                                    class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                                ></textarea>
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Medicamentos em uso</label>
                                <textarea
                                    v-model="form.medicamentos"
                                    placeholder="Liste seus medicamentos..."
                                    rows="3"
                                    class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                                ></textarea>
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Histórico familiar</label>
                                <textarea
                                    v-model="form.historico_familiar"
                                    placeholder="Conte sobre doenças na família..."
                                    rows="3"
                                    class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                                ></textarea>
                            </div>

                            <!-- Qualidade do sono -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-3">Como é a qualidade do seu sono? *</label>
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    <button
                                        v-for="opcao in opcoesQualidadeSono"
                                        :key="opcao.value"
                                        @click="
                                            form.qualidade_sono = opcao.value;
                                            limparErro('qualidade_sono');
                                        "
                                        :class="['px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-center', form.qualidade_sono === opcao.value ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200']"
                                    >
                                        {{ opcao.label }}
                                    </button>
                                </div>
                                <p v-if="erros.qualidade_sono" class="text-red-500 text-xs mt-1">{{ erros.qualidade_sono }}</p>
                            </div>

                            <!-- Nível de estresse -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-3">Qual seu nível de estresse? (1 a 5) *</label>
                                <div class="flex gap-3 items-center">
                                    <input v-model.number="form.nivel_estresse" type="range" min="1" max="5" class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" @input="limparErro('nivel_estresse')" />
                                    <span class="text-2xl font-bold text-emerald-600 min-w-12">{{ form.nivel_estresse || 0 }}</span>
                                </div>
                                <div class="flex justify-between text-xs text-gray-600 mt-2">
                                    <span>Muito baixo</span>
                                    <span>Muito alto</span>
                                </div>
                                <p v-if="erros.nivel_estresse" class="text-red-500 text-xs mt-1">{{ erros.nivel_estresse }}</p>
                            </div>

                            <!-- Observações livres -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Observações adicionais</label>
                                <textarea
                                    v-model="form.observacoes_livres"
                                    placeholder="Compartilhe qualquer outra informação importante..."
                                    rows="4"
                                    class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                                ></textarea>
                            </div>
                        </div>
                    </section>
                </div>

                <!-- Navigation Buttons -->
                <div class="mt-12 flex gap-4 justify-between">
                    <button v-if="etapaAtual > 1" @click="etapaAnterior" class="px-6 py-3 bg-gray-300 text-gray-900 font-semibold rounded hover:bg-gray-400">← Voltar</button>

                    <div class="flex-1"></div>

                    <button v-if="etapaAtual < 6" @click="proximaEtapa" class="px-6 py-3 bg-emerald-600 text-white font-semibold rounded hover:bg-emerald-700">Continuar para Etapa {{ etapaAtual + 1 }} →</button>

                    <button v-if="etapaAtual === 6" @click="enviarFormulario" :disabled="carregando" class="px-6 py-3 bg-emerald-600 text-white font-semibold rounded hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">
                        <span v-if="!carregando">✓ Finalizar Formulário</span>
                        <span v-else>Enviando...</span>
                    </button>
                </div>

                <!-- Security Note -->
                <div class="mt-8 flex items-center justify-center gap-2 text-gray-600 text-sm">
                    <span>🔐</span>
                    <p>Seus dados estão seguros e serão vistos apenas pelo profissional de saúde.</p>
                </div>
            </main>
        </div>
    </div>
</template>

<script setup>
import AnamneseService from '@/service/AnamneseService';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const toast = useToast();

const etapaAtual = ref(1);
const carregando = ref(false);
const carregandoInicial = ref(true);
const formularioPreenchido = ref(false);
const formularioEnviado = ref(false);
const erroValidacao = ref(null);
const pacienteInfo = ref(null);

const form = ref({
    // Bloco 1: Identificação
    nome_completo: '',
    como_prefere_ser_chamado: '',
    data_nascimento: '',
    sexo: '',
    telefone: '',
    whatsapp: '',

    // Bloco 2: Corpo Atual
    peso_atual: null,
    altura: null,
    tempo_nesse_peso: '',
    fez_acompanhamento_antes: false,
    qual_acompanhamento: '',

    // Bloco 3: Objetivo
    objetivo: '',
    objetivo_descricao: '',
    maior_dificuldade_alimentacao: '',

    // Bloco 4: Rotina
    horario_acorda: '',
    horario_dorme: '',
    horario_cafe_manha: '',
    horario_almoco: '',
    horario_jantar: '',
    trabalha_casa_ou_fora: '',
    tempo_parar_cozinhar: '',
    faz_exercicios: false,
    qual_exercicio: '',
    frequencia_exercicio_semana: null,

    // Bloco 5: Alimentação
    alimentos_que_ama: '',
    alimentos_que_odeia: '',
    restricao_alimentar: 'nenhuma',
    restricao_descricao: '',
    alergias_alimentares: '',
    copos_agua_por_dia: null,
    consumo_alcool: '',

    // Bloco 6: Saúde
    doencas_diagnosticadas: '',
    medicamentos: '',
    historico_familiar: '',
    qualidade_sono: '',
    nivel_estresse: 3,
    observacoes_livres: ''
});

const erros = ref({});

// Opções de select
const opcoesGenero = [
    { value: 'M', label: 'Masculino' },
    { value: 'F', label: 'Feminino' },
    { value: 'Outro', label: 'Outro' }
];

const opcoesTempo = [
    { value: 'menos_6_meses', label: 'Menos de 6 meses' },
    { value: '6_meses_1_ano', label: '6 meses a 1 ano' },
    { value: 'mais_1_ano', label: 'Mais de 1 ano' }
];

const opcoesObjetivo = [
    { value: 'emagrecer', label: 'Emagrecer', icon: '📉' },
    { value: 'ganhar_massa', label: 'Ganhar Massa', icon: '💪' },
    { value: 'melhorar_saude', label: 'Saúde', icon: '🌱' },
    { value: 'controlar_doenca', label: 'Controlar Doença', icon: '⚕️' },
    { value: 'melhorar_performance', label: 'Performance', icon: '⚡' },
    { value: 'outro', label: 'Outro', icon: '🎯' }
];

const opcoesTrabalhoCasaOuFora = [
    { value: 'casa', label: 'Casa' },
    { value: 'fora', label: 'Fora' },
    { value: 'hibrido', label: 'Híbrido' }
];

const opcoesTempoCozinhar = [
    { value: 'sempre', label: 'Sempre' },
    { value: 'as_vezes', label: 'Às vezes' },
    { value: 'raramente', label: 'Raramente' }
];

const opcoesRestricao = [
    { value: 'nenhuma', label: 'Nenhuma' },
    { value: 'lactose', label: 'Lactose' },
    { value: 'gluten', label: 'Glúten' },
    { value: 'vegetariano', label: 'Vegetariano' },
    { value: 'vegano', label: 'Vegano' },
    { value: 'religiao', label: 'Religiosa' },
    { value: 'outra', label: 'Outra' }
];

const opcoesQualidadeSono = [
    { value: 'otimo', label: 'Ótimo' },
    { value: 'bom', label: 'Bom' },
    { value: 'ruim', label: 'Ruim' },
    { value: 'pessimo', label: 'Péssimo' }
];

// Computed properties
const tituloEtapa = computed(() => {
    const titulos = ['', 'Identificação', 'Corpo Atual', 'Seu Objetivo', 'Sua Rotina', 'Alimentação', 'Saúde'];
    return titulos[etapaAtual.value];
});

const percentualConcluido = computed(() => {
    return Math.round((etapaAtual.value / 6) * 100);
});

// Validação inicial do formulário pelo token
const inicializarFormulario = async () => {
    carregandoInicial.value = true;
    erroValidacao.value = null;

    try {
        const token = route.params.id;

        if (!token) {
            erroValidacao.value = 'Token inválido ou não fornecido';
            carregandoInicial.value = false;
            return;
        }

        const resultado = await AnamneseService.validarFormulario(token);

        if (resultado.data.success) {
            const { data } = resultado.data;

            pacienteInfo.value = data;
            formularioPreenchido.value = data.formulario_preenchido;

            // Se o formulário ainda não foi preenchido, preencher etapa 1
            if (!data.formulario_preenchido) {
                form.value.nome_completo = data.nome_paciente || '';
                form.value.como_prefere_ser_chamado = data.como_prefere_ser_chamado || '';
                form.value.data_nascimento = data.data_nascimento || '';
                form.value.sexo = data.sexo || '';
                form.value.telefone = data.telefone || '';
                form.value.whatsapp = data.whatsapp || '';
            } else {
                console.log('✅ Formulário já foi preenchido anteriormente');
            }
        } else {
            console.warn('❌ Erro na resposta:', resultado.data.message);
            erroValidacao.value = resultado.data.message || 'Formulário não encontrado';
        }
    } catch (erro) {
        console.error('❌ Erro ao validar formulário:', erro);
        console.error('Detalhes do erro:', {
            message: erro.message,
            status: erro.response?.status,
            data: erro.response?.data
        });
        erroValidacao.value = erro.response?.data?.message || 'Erro ao validar formulário. Tente novamente.';
    } finally {
        carregandoInicial.value = false;
    }
};

onMounted(() => {
    console.log('🚀 Componente montado, inicializando formulário...');
    inicializarFormulario();
});

// Methods
const limparErro = (campo) => {
    if (erros.value[campo]) {
        delete erros.value[campo];
    }
};

const validarEtapa = () => {
    erros.value = {};
    const campos = {
        1: ['nome_completo', 'como_prefere_ser_chamado', 'data_nascimento', 'sexo'],
        2: ['peso_atual', 'altura', 'tempo_nesse_peso'],
        3: ['objetivo'],
        4: ['horario_acorda', 'horario_dorme', 'trabalha_casa_ou_fora', 'tempo_parar_cozinhar'],
        5: ['restricao_alimentar', 'copos_agua_por_dia', 'consumo_alcool'],
        6: ['qualidade_sono', 'nivel_estresse']
    };

    const validados = campos[etapaAtual.value] || [];

    validados.forEach((campo) => {
        const valor = form.value[campo];
        if (valor === '' || valor === null || valor === undefined) {
            erros.value[campo] = 'Este campo é obrigatório';
        }
    });

    // Validações extras
    if (etapaAtual.value === 4 && form.value.faz_exercicios && form.value.frequencia_exercicio_semana == null) {
        erros.value.frequencia_exercicio_semana = 'Campo obrigatório quando pratica exercícios';
    }

    return Object.keys(erros.value).length === 0;
};

const proximaEtapa = () => {
    if (validarEtapa()) {
        etapaAtual.value++;
        window.scrollTo(0, 0);
    } else {
        toast.add({
            severity: 'warn',
            summary: 'Campos obrigatórios',
            detail: 'Preencha todos os campos obrigatórios desta etapa',
            life: 3000
        });
    }
};

const etapaAnterior = () => {
    etapaAtual.value--;
    window.scrollTo(0, 0);
};

const enviarFormulario = async () => {
    if (!validarEtapa()) {
        toast.add({
            severity: 'warn',
            summary: 'Campos incompletos',
            detail: 'Verifique os campos obrigatórios',
            life: 3000
        });
        return;
    }

    carregando.value = true;

    try {
        // Pegar token da rota
        const token = route.params.id;

        const dados = {
            ...form.value,
            criado_em: new Date(),
            atualizado_em: new Date()
        };

        const resposta = await AnamneseService.salvarAnamnesePublica(token, dados);

        // Validar resposta da API
        if (resposta.data && resposta.data.success === true) {
            // Mostrar mensagem de sucesso e manter na mesma tela
            formularioEnviado.value = true;

            toast.add({
                severity: 'success',
                summary: 'Sucesso!',
                detail: 'Formulário enviado com sucesso. A nutricionista analisará seus dados em breve.',
                life: 5000
            });
        } else {
            // Resposta sem success = true
            console.error('❌ Resposta inesperada da API:', resposta.data);
            toast.add({
                severity: 'error',
                summary: 'Erro ao enviar',
                detail: resposta.data?.message || 'Erro desconhecido ao enviar o formulário',
                life: 5000
            });
        }
    } catch (erro) {
        console.error('❌ Erro ao enviar formulário:', erro);
        console.error('Detalhes:', {
            message: erro.message,
            status: erro.response?.status,
            data: erro.response?.data
        });
        toast.add({
            severity: 'error',
            summary: 'Erro ao enviar',
            detail: erro.response?.data?.message || 'Tente novamente mais tarde',
            life: 5000
        });
    } finally {
        carregando.value = false;
    }
};

// inicializarFormulario();
</script>

<style scoped>
@keyframes fade-in {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fade-in {
    animation: fade-in 0.3s ease-in-out;
}
</style>
