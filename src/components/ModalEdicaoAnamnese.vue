<template>
    <Dialog
        :visible="visible"
        :header="modoEdicao ? 'Editar Anamnese' : 'Criar Anamnese'"
        :modal="true"
        :style="{ width: '90vw', maxHeight: '90vh' }"
        :breakpoints="{ '1199px': '95vw', '575px': '100vw' }"
        @update:visible="$emit('update:visible', $event)"
    >
        <div v-if="anamneseEditando" class="space-y-6 overflow-y-auto pr-4">
            <!-- Bloco 1: Identificação -->
            <section class="bg-white rounded-xl border-2 border-emerald-100 p-6">
                <div class="flex items-center gap-3 mb-6">
                    <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-lg">👤</div>
                    <h3 class="text-lg font-bold text-gray-900">Identificação</h3>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Telefone</label>
                        <InputText
                            :model-value="anamneseEditando.telefone"
                            @update:model-value="updateAnamnese('telefone', $event)"
                            type="tel"
                            placeholder="(11) 99999-9999"
                            class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">WhatsApp</label>
                        <InputText
                            :model-value="anamneseEditando.whatsapp"
                            @update:model-value="updateAnamnese('whatsapp', $event)"
                            type="tel"
                            placeholder="(11) 99999-9999"
                            class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                </div>
            </section>

            <!-- Bloco 2: Corpo Atual -->
            <section class="bg-white rounded-xl border-2 border-blue-100 p-6">
                <div class="flex items-center gap-3 mb-6">
                    <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-lg">⚖️</div>
                    <h3 class="text-lg font-bold text-gray-900">Corpo Atual</h3>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Peso Atual (kg)</label>
                        <InputText
                            :model-value="anamneseEditando.peso_atual"
                            @update:model-value="updateAnamnese('peso_atual', $event === '' ? null : Number($event))"
                            type="number"
                            step="0.1"
                            placeholder="00.0"
                            class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Altura (cm)</label>
                        <InputText
                            :model-value="anamneseEditando.altura"
                            @update:model-value="updateAnamnese('altura', $event === '' ? null : Number($event))"
                            type="number"
                            step="0.1"
                            placeholder="170"
                            class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Tempo Nesse Peso</label>
                        <div class="flex flex-wrap gap-2">
                            <button
                                v-for="opcao in opcoesTempo"
                                :key="opcao.value"
                                @click="updateAnamnese('tempo_nesse_peso', opcao.value)"
                                :class="['px-4 py-2 rounded-full text-xs font-medium transition-all', anamneseEditando.tempo_nesse_peso === opcao.value ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200']"
                            >
                                {{ opcao.label }}
                            </button>
                        </div>
                    </div>
                    <div class="flex items-center pt-2">
                        <input
                            :checked="anamneseEditando.fez_acompanhamento_antes"
                            @change="updateAnamnese('fez_acompanhamento_antes', $event.target.checked)"
                            type="checkbox"
                            id="acompanhamento-edit"
                            class="w-4 h-4 rounded border-gray-300 text-emerald-600 accent-emerald-600"
                        />
                        <label for="acompanhamento-edit" class="ml-3 text-sm font-semibold text-gray-700">Fez acompanhamento anterior</label>
                    </div>
                    <div v-if="anamneseEditando.fez_acompanhamento_antes" class="md:col-span-2">
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Qual Acompanhamento?</label>
                        <InputText
                            :model-value="anamneseEditando.qual_acompanhamento"
                            @update:model-value="updateAnamnese('qual_acompanhamento', $event)"
                            placeholder="Descreva o acompanhamento"
                            class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                </div>
            </section>

            <!-- Bloco 3: Objetivo -->
            <section class="bg-white rounded-xl border-2 border-purple-100 p-6">
                <div class="flex items-center gap-3 mb-6">
                    <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-lg">🎯</div>
                    <h3 class="text-lg font-bold text-gray-900">Objetivo</h3>
                </div>
                <div class="space-y-4">
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Objetivo Principal</label>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <button
                                v-for="opcao in opcoesObjetivo"
                                :key="opcao.value"
                                @click="updateAnamnese('objetivo', opcao.value)"
                                :class="[
                                    'p-4 rounded-xl border-2 transition-all text-center flex flex-col items-center gap-2',
                                    anamneseEditando.objetivo === opcao.value ? 'border-purple-500 bg-purple-50 shadow-md' : 'border-gray-200 bg-white hover:border-purple-300'
                                ]"
                            >
                                <div :class="['w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all', anamneseEditando.objetivo === opcao.value ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600']">
                                    {{ opcao.icon }}
                                </div>
                                <span class="text-xs font-semibold text-gray-900">{{ opcao.label }}</span>
                            </button>
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Descrição do Objetivo</label>
                        <textarea
                            :model-value="anamneseEditando.objetivo_descricao"
                            @update:model-value="updateAnamnese('objetivo_descricao', $event)"
                            placeholder="Descreva seu objetivo com detalhes"
                            rows="2"
                            class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                        ></textarea>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Maior Dificuldade com Alimentação</label>
                        <textarea
                            :model-value="anamneseEditando.maior_dificuldade_alimentacao"
                            @update:model-value="updateAnamnese('maior_dificuldade_alimentacao', $event)"
                            placeholder="Descreva sua maior dificuldade"
                            rows="2"
                            class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                        ></textarea>
                    </div>
                </div>
            </section>

            <!-- Bloco 4: Rotina -->
            <section class="bg-white rounded-xl border-2 border-amber-100 p-6">
                <div class="flex items-center gap-3 mb-6">
                    <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-lg">🕐</div>
                    <h3 class="text-lg font-bold text-gray-900">Rotina</h3>
                </div>
                <div class="space-y-4">
                    <div>
                        <p class="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Horários</p>
                        <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
                            <div>
                                <label class="block text-xs text-gray-600 font-medium mb-1">Acorda</label>
                                <InputText
                                    :model-value="anamneseEditando.horario_acorda"
                                    @update:model-value="updateAnamnese('horario_acorda', $event)"
                                    type="time"
                                    class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label class="block text-xs text-gray-600 font-medium mb-1">Café</label>
                                <InputText
                                    :model-value="anamneseEditando.horario_cafe_manha"
                                    @update:model-value="updateAnamnese('horario_cafe_manha', $event)"
                                    type="time"
                                    class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label class="block text-xs text-gray-600 font-medium mb-1">Almoço</label>
                                <InputText
                                    :model-value="anamneseEditando.horario_almoco"
                                    @update:model-value="updateAnamnese('horario_almoco', $event)"
                                    type="time"
                                    class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label class="block text-xs text-gray-600 font-medium mb-1">Jantar</label>
                                <InputText
                                    :model-value="anamneseEditando.horario_jantar"
                                    @update:model-value="updateAnamnese('horario_jantar', $event)"
                                    type="time"
                                    class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label class="block text-xs text-gray-600 font-medium mb-1">Dorme</label>
                                <InputText
                                    :model-value="anamneseEditando.horario_dorme"
                                    @update:model-value="updateAnamnese('horario_dorme', $event)"
                                    type="time"
                                    class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <p class="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Trabalho e Atividades</p>
                        <div class="space-y-3">
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Local de Trabalho</label>
                                <div class="flex gap-2">
                                    <button
                                        v-for="opcao in opcoesTrabalhoCasaOuFora"
                                        :key="opcao.value"
                                        @click="updateAnamnese('trabalha_casa_ou_fora', opcao.value)"
                                        :class="['flex-1 py-2 rounded-lg text-xs font-medium transition-all', anamneseEditando.trabalha_casa_ou_fora === opcao.value ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200']"
                                    >
                                        {{ opcao.label }}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Tempo para Cozinhar</label>
                                <div class="flex gap-2">
                                    <button
                                        v-for="opcao in opcoesTempoCozinhar"
                                        :key="opcao.value"
                                        @click="updateAnamnese('tempo_parar_cozinhar', opcao.value)"
                                        :class="['flex-1 py-2 rounded-lg text-xs font-medium transition-all', anamneseEditando.tempo_parar_cozinhar === opcao.value ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200']"
                                    >
                                        {{ opcao.label }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="pt-2">
                        <div class="flex items-center mb-3">
                            <input
                                :checked="anamneseEditando.faz_exercicios"
                                @change="updateAnamnese('faz_exercicios', $event.target.checked)"
                                type="checkbox"
                                id="exercicios-edit"
                                class="w-4 h-4 rounded border-gray-300 text-emerald-600 accent-emerald-600"
                            />
                            <label for="exercicios-edit" class="ml-3 text-sm font-semibold text-gray-700">Pratica exercícios físicos</label>
                        </div>
                        <div v-if="anamneseEditando.faz_exercicios" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Qual Exercício</label>
                                <InputText
                                    :model-value="anamneseEditando.qual_exercicio"
                                    @update:model-value="updateAnamnese('qual_exercicio', $event)"
                                    type="text"
                                    placeholder="Ex: Musculação"
                                    class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Frequência (x/semana)</label>
                                <InputText
                                    :model-value="anamneseEditando.frequencia_exercicio_semana"
                                    @update:model-value="updateAnamnese('frequencia_exercicio_semana', $event === '' ? null : Number($event))"
                                    type="number"
                                    min="0"
                                    max="7"
                                    placeholder="3"
                                    class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Bloco 5: Alimentação -->
            <section class="bg-white rounded-xl border-2 border-orange-100 p-6">
                <div class="flex items-center gap-3 mb-6">
                    <div class="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-lg">🍽️</div>
                    <h3 class="text-lg font-bold text-gray-900">Alimentação</h3>
                </div>
                <div class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Alimentos que Ama</label>
                            <textarea
                                :model-value="anamneseEditando.alimentos_que_ama"
                                @update:model-value="updateAnamnese('alimentos_que_ama', $event)"
                                placeholder="Liste seus favoritos"
                                rows="2"
                                class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                            ></textarea>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Alimentos que Odeia</label>
                            <textarea
                                :model-value="anamneseEditando.alimentos_que_odeia"
                                @update:model-value="updateAnamnese('alimentos_que_odeia', $event)"
                                placeholder="Liste os que não gosta"
                                rows="2"
                                class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                            ></textarea>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="md:col-span-2">
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Restrição Alimentar</label>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                                <button
                                    v-for="opcao in opcoesRestricao"
                                    :key="opcao.value"
                                    @click="updateAnamnese('restricao_alimentar', opcao.value)"
                                    :class="[
                                        'px-3 py-2 rounded-lg text-xs font-medium transition-all text-center',
                                        anamneseEditando.restricao_alimentar === opcao.value ? 'bg-orange-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    ]"
                                >
                                    {{ opcao.label }}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Copos de Água/Dia</label>
                            <InputText
                                :model-value="anamneseEditando.copos_agua_por_dia"
                                @update:model-value="updateAnamnese('copos_agua_por_dia', $event === '' ? null : Number($event))"
                                type="number"
                                min="0"
                                placeholder="8"
                                class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>
                    <div v-if="anamneseEditando.restricao_alimentar && anamneseEditando.restricao_alimentar !== 'nenhuma'">
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Descrição da Restrição</label>
                        <InputText
                            :model-value="anamneseEditando.restricao_descricao"
                            @update:model-value="updateAnamnese('restricao_descricao', $event)"
                            placeholder="Descreva detalhes da restrição"
                            class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Alergias Alimentares</label>
                        <textarea
                            :model-value="anamneseEditando.alergias_alimentares"
                            @update:model-value="updateAnamnese('alergias_alimentares', $event)"
                            placeholder="Liste suas alergias"
                            rows="2"
                            class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                        ></textarea>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Consumo de Álcool</label>
                        <div class="flex gap-2">
                            <button
                                v-for="opcao in opcoesConsumoAlcool"
                                :key="opcao.value"
                                @click="updateAnamnese('consumo_alcool', opcao.value)"
                                :class="['flex-1 py-2 rounded-lg text-xs font-medium transition-all', anamneseEditando.consumo_alcool === opcao.value ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200']"
                            >
                                {{ opcao.label }}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Bloco 6: Saúde -->
            <section class="bg-white rounded-xl border-2 border-red-100 p-6">
                <div class="flex items-center gap-3 mb-6">
                    <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-lg">❤️</div>
                    <h3 class="text-lg font-bold text-gray-900">Saúde</h3>
                </div>
                <div class="space-y-4">
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Doenças Diagnosticadas</label>
                        <textarea
                            :model-value="anamneseEditando.doencas_diagnosticadas"
                            @update:model-value="updateAnamnese('doencas_diagnosticadas', $event)"
                            placeholder="Liste suas doenças"
                            rows="2"
                            class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                        ></textarea>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Medicamentos</label>
                        <textarea
                            :model-value="anamneseEditando.medicamentos"
                            @update:model-value="updateAnamnese('medicamentos', $event)"
                            placeholder="Liste seus medicamentos"
                            rows="2"
                            class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                        ></textarea>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Histórico Familiar</label>
                        <textarea
                            :model-value="anamneseEditando.historico_familiar"
                            @update:model-value="updateAnamnese('historico_familiar', $event)"
                            placeholder="Descreva histórico familiar relevante"
                            rows="2"
                            class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                        ></textarea>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Qualidade do Sono</label>
                        <div class="flex gap-2 mb-4">
                            <button
                                v-for="opcao in opcoesQualidadeSono"
                                :key="opcao.value"
                                @click="updateAnamnese('qualidade_sono', opcao.value)"
                                :class="['flex-1 py-2 rounded-lg text-xs font-medium transition-all', anamneseEditando.qualidade_sono === opcao.value ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200']"
                            >
                                {{ opcao.label }}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Nível de Estresse (1-5)</label>
                        <div class="flex items-center gap-3">
                            <input
                                :model-value="anamneseEditando.nivel_estresse"
                                @update:model-value="updateAnamnese('nivel_estresse', Number($event))"
                                type="range"
                                min="1"
                                max="5"
                                class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                            />
                            <span class="text-lg font-bold text-emerald-600 min-w-8">{{ anamneseEditando.nivel_estresse }}</span>
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Observações Adicionais</label>
                        <textarea
                            :model-value="anamneseEditando.observacoes_livres"
                            @update:model-value="updateAnamnese('observacoes_livres', $event)"
                            placeholder="Comentários adicionais importantes"
                            rows="2"
                            class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                        ></textarea>
                    </div>
                </div>
            </section>
        </div>

        <template #footer>
            <Button label="Cancelar" severity="secondary" @click="handleClose" />
            <Button :label="modoEdicao ? 'Atualizar Anamnese' : 'Criar Anamnese'" severity="success" icon="pi pi-check" :loading="loading" @click="handleSave" />
        </template>
    </Dialog>
</template>

<script setup>
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';

const props = defineProps({
    visible: Boolean,
    anamneseEditando: Object,
    modoEdicao: Boolean,
    loading: {
        type: Boolean,
        default: false
    },
    opcoesTempo: Array,
    opcoesObjetivo: Array,
    opcoesTrabalhoCasaOuFora: Array,
    opcoesTempoCozinhar: Array,
    opcoesRestricao: Array,
    opcoesConsumoAlcool: Array,
    opcoesQualidadeSono: Array
});

const emit = defineEmits(['update:visible', 'update:anamneseEditando', 'fechar', 'salvar']);

const handleClose = () => {
    emit('update:visible', false);
    emit('fechar');
};

const handleSave = () => {
    emit('salvar');
};

const updateAnamnese = (field, value) => {
    const updated = { ...props.anamneseEditando };
    updated[field] = value;
    emit('update:anamneseEditando', updated);
};
</script>
