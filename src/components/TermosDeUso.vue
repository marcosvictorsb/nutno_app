<template>
    <Dialog v-model:visible="isVisible" header="Termos de Uso e Política de Privacidade" :modal="true" :style="{ width: '90vw', maxHeight: '90vh' }" :breakpoints="{ '1199px': '95vw', '575px': '100vw' }" @hide="fechar" class="termos-dialog">
        <div class="termos-content text-sm space-y-4 leading-relaxed text-gray-700">
            <!-- Header -->
            <div class="text-center border-b pb-6 mb-6">
                <div class="flex items-center justify-center gap-2 mb-3">
                    <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <span class="text-xl">🌱</span>
                    </div>
                    <span class="text-xl font-bold text-green-600">Nutno</span>
                </div>
                <h2 class="text-lg font-bold text-gray-900">TERMOS DE USO E POLÍTICA DE PRIVACIDADE</h2>
                <p class="text-xs text-gray-500 mt-2">Versão 1.0 — Março de 2026</p>
            </div>

            <!-- Introdução -->
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <p class="text-sm font-medium text-gray-900">
                    Bem-vindo ao Nutno. Antes de utilizar nossa plataforma, leia atentamente estes Termos de Uso e Política de Privacidade. Ao se cadastrar e utilizar o Nutno, você concorda integralmente com as condições aqui descritas.
                </p>
                <p class="text-sm text-gray-700 mt-3">Caso não concorde com qualquer parte destes termos, pedimos que não utilize a plataforma.</p>
            </div>

            <!-- Seção 1 -->
            <div>
                <h3 class="font-bold text-gray-900 mb-2">1. O que é o Nutno</h3>
                <p class="text-gray-700 mb-2">
                    O Nutno é uma plataforma de software como serviço (SaaS) desenvolvida para auxiliar nutricionistas no gerenciamento de pacientes, criação de planos alimentares, registro de medidas antropométricas e comunicação com pacientes.
                </p>
                <p class="text-gray-700">
                    O Nutno é uma ferramenta de apoio profissional e não substitui o julgamento clínico do nutricionista. Todas as recomendações, planos e orientações gerados pela plataforma são de exclusiva responsabilidade do profissional que os
                    elaborou.
                </p>
            </div>

            <!-- Seção 2 -->
            <div>
                <h3 class="font-bold text-gray-900 mb-2">2. Quem pode utilizar o Nutno</h3>
                <p class="text-gray-700 mb-2">O Nutno destina-se exclusivamente a nutricionistas devidamente habilitados e registrados no Conselho Federal de Nutricionistas (CFN) ou órgão equivalente. Ao se cadastrar, o profissional declara que:</p>
                <ul class="list-disc list-inside text-gray-700 space-y-1 ml-2">
                    <li>Possui habilitação legal para exercer a nutrição no Brasil.</li>
                    <li>As informações de cadastro fornecidas são verdadeiras e atualizadas.</li>
                    <li>Utilizará a plataforma somente para fins legítimos e dentro da legislação vigente.</li>
                </ul>
                <p class="text-gray-700 mt-2">O Nutno reserva-se o direito de suspender contas que não atendam a esses requisitos.</p>
            </div>

            <!-- Seção 3 -->
            <div>
                <h3 class="font-bold text-gray-900 mb-2">3. Responsabilidades do nutricionista</h3>
                <p class="text-gray-700 mb-2">O nutricionista é o único responsável por:</p>
                <ul class="list-disc list-inside text-gray-700 space-y-1 ml-2">
                    <li>A elaboração, adequação e segurança dos planos alimentares criados na plataforma.</li>
                    <li>A obtenção do consentimento dos pacientes para coleta e armazenamento de dados pessoais e de saúde.</li>
                    <li>A veracidade das informações cadastradas sobre pacientes.</li>
                    <li>O uso adequado das informações geradas pela plataforma na conduta clínica.</li>
                    <li>Manter a confidencialidade das credenciais de acesso à conta.</li>
                    <li>Comunicar ao Nutno imediatamente qualquer uso não autorizado de sua conta.</li>
                </ul>
                <p class="text-gray-700 mt-2">
                    O Nutno não se responsabiliza por danos decorrentes de condutas clínicas baseadas em informações incorretas inseridas pelo profissional, por erros de interpretação dos dados ou por uso inadequado da plataforma.
                </p>
            </div>

            <!-- Seção 4 -->
            <div>
                <h3 class="font-bold text-gray-900 mb-2">4. Limitação de responsabilidade do Nutno</h3>
                <p class="text-gray-700 mb-2">O Nutno não é responsável por:</p>
                <ul class="list-disc list-inside text-gray-700 space-y-1 ml-2">
                    <li>Resultados clínicos obtidos ou não obtidos pelos pacientes dos profissionais cadastrados.</li>
                    <li>Decisões clínicas tomadas pelos nutricionistas com base nas ferramentas da plataforma.</li>
                    <li>Erros ou imprecisões nos dados nutricionais provenientes das bases TACO e TBCA, pois tais informações são fornecidas por órgãos externos.</li>
                    <li>Perda de dados causada por falhas no dispositivo do usuário, conexão de internet ou eventos fora do controle do Nutno.</li>
                    <li>Danos indiretos, incidentais ou consequentes resultantes do uso ou incapacidade de uso da plataforma.</li>
                    <li>Acesso não autorizado por terceiros decorrente de negligência do próprio usuário com suas credenciais.</li>
                </ul>
                <p class="text-gray-700 mt-2">A plataforma é fornecida no estado em que se encontra. O Nutno não garante que o serviço será ininterrupto, livre de erros ou que atenderá a todas as necessidades específicas do usuário.</p>
            </div>

            <!-- Seção 5 -->
            <div>
                <h3 class="font-bold text-gray-900 mb-2">5. Dados pessoais e privacidade (LGPD)</h3>
                <p class="text-gray-700 mb-2">O Nutno segue as diretrizes da Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD). Nesta relação:</p>
                <ul class="list-disc list-inside text-gray-700 space-y-1 ml-2 mb-2">
                    <li><strong>O nutricionista é o Controlador dos dados:</strong> é o profissional quem decide quais dados dos pacientes serão coletados e como serão utilizados.</li>
                    <li><strong>O Nutno é o Operador dos dados:</strong> a plataforma armazena e processa os dados exclusivamente conforme as instruções do nutricionista e para a finalidade de prestação do serviço.</li>
                </ul>
                <p class="text-gray-700 font-medium mb-1">Dados coletados pelo Nutno sobre o nutricionista:</p>
                <ul class="list-disc list-inside text-gray-700 space-y-1 ml-2 mb-2">
                    <li>Nome completo, e-mail, número do CRN e informações de perfil.</li>
                    <li>Dados de uso da plataforma para melhoria do serviço.</li>
                    <li>Informações de pagamento processadas por provedor seguro terceirizado.</li>
                </ul>
                <p class="text-gray-700 font-medium mb-1">Dados dos pacientes armazenados pelo nutricionista na plataforma:</p>
                <ul class="list-disc list-inside text-gray-700 space-y-1 ml-2 mb-2">
                    <li>Dados cadastrais: nome, e-mail, telefone, data de nascimento.</li>
                    <li>Dados de saúde: medidas antropométricas, composição corporal, histórico clínico.</li>
                    <li>Planos alimentares e registros de adesão.</li>
                </ul>
                <p class="text-gray-700 font-medium mb-1">O Nutno compromete-se a:</p>
                <ul class="list-disc list-inside text-gray-700 space-y-1 ml-2 mb-2">
                    <li>Não vender, alugar ou compartilhar dados de pacientes com terceiros para fins comerciais.</li>
                    <li>Utilizar os dados dos pacientes apenas para operação da plataforma.</li>
                    <li>Aplicar medidas técnicas de segurança para proteger os dados armazenados.</li>
                    <li>Manter os dados enquanto o nutricionista mantiver conta ativa. Após o cancelamento, os dados serão mantidos por até 90 dias e então excluídos, salvo obrigação legal.</li>
                </ul>
                <p class="text-gray-700">
                    O nutricionista é responsável por obter o consentimento de seus pacientes para o tratamento dos dados de saúde, conforme exigido pela LGPD para dados sensíveis. O Nutno não coleta consentimento dos pacientes diretamente.
                </p>
            </div>

            <!-- Seção 6 -->
            <div>
                <h3 class="font-bold text-gray-900 mb-2">6. Confidencialidade</h3>
                <p class="text-gray-700 mb-2">
                    O Nutno reconhece que os dados dos pacientes são informações sigilosas protegidas pelo sigilo profissional do nutricionista e pela LGPD. Todos os funcionários e colaboradores do Nutno com acesso a dados estão sujeitos a obrigações
                    de confidencialidade.
                </p>
                <p class="text-gray-700">O Nutno não acessará os dados de pacientes, exceto quando estritamente necessário para suporte técnico, e somente mediante solicitação do nutricionista titular da conta.</p>
            </div>

            <!-- Seção 7 -->
            <div>
                <h3 class="font-bold text-gray-900 mb-2">7. Planos e pagamento</h3>
                <p class="text-gray-700 mb-2">O Nutno oferece planos gratuitos e pagos. As condições de cada plano, valores e funcionalidades disponíveis estão descritos na página de preços do site nutno.com.br.</p>
                <p class="text-gray-700 font-medium mb-1">Para planos pagos:</p>
                <ul class="list-disc list-inside text-gray-700 space-y-1 ml-2">
                    <li>O pagamento é processado de forma recorrente conforme o ciclo escolhido (mensal ou anual).</li>
                    <li>O cancelamento pode ser feito a qualquer momento. O acesso permanece ativo até o fim do período já pago.</li>
                    <li>Não há reembolso proporcional por cancelamento antecipado, exceto conforme exigido pelo Código de Defesa do Consumidor.</li>
                    <li>O Nutno pode alterar os valores dos planos com aviso prévio de 30 dias por e-mail.</li>
                </ul>
            </div>

            <!-- Seção 8 -->
            <div>
                <h3 class="font-bold text-gray-900 mb-2">8. Suspensão e cancelamento de conta</h3>
                <p class="text-gray-700 mb-2">O Nutno pode suspender ou encerrar uma conta em caso de:</p>
                <ul class="list-disc list-inside text-gray-700 space-y-1 ml-2 mb-2">
                    <li>Violação destes Termos de Uso.</li>
                    <li>Uso da plataforma para fins ilegais ou antiéticos.</li>
                    <li>Inadimplência no plano pago após período de carência.</li>
                    <li>Fornecimento de informações falsas no cadastro.</li>
                </ul>
                <p class="text-gray-700">O nutricionista pode solicitar o cancelamento da conta a qualquer momento pelo e-mail oi@nutno.com.br. Após o cancelamento, os dados serão mantidos por 90 dias antes da exclusão definitiva.</p>
            </div>

            <!-- Seção 9 -->
            <div>
                <h3 class="font-bold text-gray-900 mb-2">9. Propriedade intelectual</h3>
                <p class="text-gray-700 mb-2">Todos os direitos sobre o software, marca, design e conteúdo da plataforma Nutno pertencem exclusivamente à Nutno Saas Ltda. É vedado ao usuário:</p>
                <ul class="list-disc list-inside text-gray-700 space-y-1 ml-2 mb-2">
                    <li>Copiar, modificar, distribuir ou criar trabalhos derivados da plataforma.</li>
                    <li>Fazer engenharia reversa do software.</li>
                    <li>Utilizar a marca Nutno sem autorização expressa.</li>
                </ul>
                <p class="text-gray-700">Os dados inseridos pelo nutricionista na plataforma (dados de pacientes, planos alimentares) permanecem de propriedade do profissional.</p>
            </div>

            <!-- Seção 10 -->
            <div>
                <h3 class="font-bold text-gray-900 mb-2">10. Alterações destes termos</h3>
                <p class="text-gray-700 mb-2">
                    O Nutno pode atualizar estes Termos de Uso a qualquer momento. Alterações relevantes serão comunicadas por e-mail com antecedência mínima de 15 dias. O uso continuado da plataforma após a comunicação implica aceitação dos novos
                    termos.
                </p>
                <p class="text-gray-700">A versão mais atualizada dos termos estará sempre disponível em nutno.com.br/termos.</p>
            </div>

            <!-- Seção 11 -->
            <div>
                <h3 class="font-bold text-gray-900 mb-2">11. Legislação aplicável e foro</h3>
                <p class="text-gray-700">
                    Estes termos são regidos pelas leis da República Federativa do Brasil. As partes elegem o foro da Comarca de Ouro Preto, Estado de Minas Gerais, para dirimir quaisquer controvérsias decorrentes deste instrumento, com renúncia a
                    qualquer outro, por mais privilegiado que seja.
                </p>
            </div>

            <!-- Seção 12 -->
            <div>
                <h3 class="font-bold text-gray-900 mb-2">12. Contato e suporte</h3>
                <p class="text-gray-700 mb-2">Para dúvidas, solicitações relacionadas à LGPD, suporte técnico ou qualquer outra questão sobre estes termos, entre em contato:</p>
                <div class="text-gray-700 space-y-1">
                    <p><strong>E-mail:</strong> oi@nutno.com.br</p>
                    <p><strong>Site:</strong> nutno.com.br</p>
                </div>
            </div>

            <!-- Footer -->
            <div class="border-t pt-6 mt-6 text-center text-xs text-gray-500">
                <p class="font-medium text-gray-700 mb-1">Nutno Saas Ltda.</p>
                <p>nutno.com.br · oi@nutno.com.br</p>
                <p class="mt-1">Versão 1.0 — Março de 2026</p>
            </div>
        </div>

        <template #footer>
            <Button label="Fechar" severity="secondary" @click="fechar" class="w-full sm:w-auto" />
        </template>
    </Dialog>
</template>

<script setup>
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import { ref } from 'vue';

const isVisible = ref(false);

const abrir = () => {
    isVisible.value = true;
};

const fechar = () => {
    isVisible.value = false;
};

defineExpose({
    abrir,
    fechar
});
</script>

<style scoped>
:deep(.termos-dialog .p-dialog-content) {
    max-height: 70vh;
    overflow-y: auto;
}

::-webkit-scrollbar {
    width: 8px;
}

::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
}

::-webkit-scrollbar-thumb {
    background: #10b981;
    border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
    background: #059669;
}
</style>
