import { setRouter, setToast } from '@/service/ApiClient';
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import Aura from '@primeuix/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import Toast from 'primevue/toast';
import ToastService from 'primevue/toastservice';

import '@/assets/styles.scss';
import '@/assets/tailwind.css';

const app = createApp(App);

app.use(router);
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.app-dark'
        }
    },
    locale: {
        startsWith: 'Começa com',
        contains: 'Contém',
        notContains: 'Não contém',
        endsWith: 'Termina com',
        equals: 'Igual a',
        notEquals: 'Diferente de',
        noFilter: 'Sem filtro',
        lt: 'Menor que',
        lte: 'Menor ou igual a',
        gt: 'Maior que',
        gte: 'Maior ou igual a',
        dateIs: 'Data é',
        dateIsNot: 'Data não é',
        dateBefore: 'Data antes de',
        dateAfter: 'Data depois de',
        clear: 'Limpar',
        apply: 'Aplicar',
        matchAll: 'Corresponder a todos',
        matchAny: 'Corresponder a qualquer',
        addRule: 'Adicionar regra',
        removeRule: 'Remover regra',
        accept: 'Sim',
        reject: 'Não',
        choose: 'Escolher',
        upload: 'Enviar',
        cancel: 'Cancelar',
        completed: 'Concluído',
        pending: 'Pendente',
        fileSizeTypes: ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        dayNames: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
        dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
        dayNamesMin: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
        monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
        monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
        chooseYear: 'Escolher ano',
        chooseMonth: 'Escolher mês',
        chooseDate: 'Escolher data',
        prevDecade: 'Década anterior',
        nextDecade: 'Próxima década',
        prevYear: 'Ano anterior',
        nextYear: 'Próximo ano',
        prevMonth: 'Mês anterior',
        nextMonth: 'Próximo mês',
        prevHour: 'Hora anterior',
        nextHour: 'Próxima hora',
        prevMinute: 'Minuto anterior',
        nextMinute: 'Próximo minuto',
        prevSecond: 'Segundo anterior',
        nextSecond: 'Próximo segundo',
        am: 'AM',
        pm: 'PM',
        today: 'Hoje',
        weekHeader: 'Sm',
        firstDayOfWeek: 0,
        showMonthAfterYear: false,
        dateFormat: 'dd/mm/yy',
        weak: 'Fraco',
        medium: 'Médio',
        strong: 'Forte',
        passwordPrompt: 'Digite uma senha',
        searchMessage: '{0} resultados disponíveis',
        selectionMessage: '{0} itens selecionados',
        emptySelectionMessage: 'Nenhum item selecionado',
        emptySearchMessage: 'Nenhum resultado encontrado',
        fileChosenMessage: '{0} arquivos',
        noFileChosenMessage: 'Nenhum arquivo selecionado',
        emptyMessage: 'Sem opções disponíveis',
        toggleOn: 'Sim',
        toggleOff: 'Não',
        aria: {
            trueLabel: 'Sim',
            falseLabel: 'Não',
            nullLabel: 'Não selecionado',
            star: '1 estrela',
            stars: '{star} estrelas',
            selectAll: 'Todos os itens selecionados',
            unselectAll: 'Todos os itens desmarcados',
            close: 'Fechar',
            previous: 'Anterior',
            next: 'Próximo',
            navigation: 'Navegação',
            scrollTop: 'Rolar para o topo',
            moveTop: 'Mover para o topo',
            moveUp: 'Mover para cima',
            moveDown: 'Mover para baixo',
            moveBottom: 'Mover para o final',
            moveToTarget: 'Mover para o destino',
            moveToSource: 'Mover para a origem',
            moveAllToTarget: 'Mover todos para o destino',
            moveAllToSource: 'Mover todos para a origem',
            pageLabel: 'Página {page}',
            firstPageLabel: 'Primeira página',
            lastPageLabel: 'Última página',
            nextPageLabel: 'Próxima página',
            prevPageLabel: 'Página anterior',
            rowsPerPageLabel: 'Linhas por página',
            jumpToPageDropdownLabel: 'Ir para a página (menu)',
            jumpToPageInputLabel: 'Ir para a página (entrada)',
            selectRow: 'Linha selecionada',
            unselectRow: 'Linha desmarcada',
            expandRow: 'Linha expandida',
            collapseRow: 'Linha recolhida',
            showFilterMenu: 'Exibir menu de filtros',
            hideFilterMenu: 'Ocultar menu de filtros',
            filterOperator: 'Operador de filtro',
            filterConstraint: 'Restrição de filtro',
            editRow: 'Editar linha',
            saveEdit: 'Salvar edição',
            cancelEdit: 'Cancelar edição',
            listView: 'Visualização em lista',
            gridView: 'Visualização em grade',
            slide: 'Slide',
            slideNumber: '{slideNumber}',
            zoomImage: 'Ampliar imagem',
            zoomIn: 'Aproximar',
            zoomOut: 'Afastar',
            rotateRight: 'Girar para a direita',
            rotateLeft: 'Girar para a esquerda'
        }
    }
});
app.use(ToastService);
app.use(ConfirmationService);
app.component('Toast', Toast);

// Inicializar ApiClient com router e toast
setRouter(router);

// Aguardar a app estar pronta para acessar o toast
app.mount('#app');

// Após a app estar montada, configurar o toast global
setTimeout(() => {
    const appInstance = app._instance;
    if (appInstance && appInstance.appContext.config.globalProperties.$toast) {
        setToast(appInstance.appContext.config.globalProperties.$toast);
    }
}, 0);
