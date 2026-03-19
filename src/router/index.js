import AppLayout from '@/layout/AppLayout.vue';
import AuthService from '@/service/AuthService';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'landing',
            component: () => import('@/views/pages/Landing.vue')
        },
        {
            path: '/',
            component: AppLayout,
            beforeEnter: (to, from, next) => {
                if (AuthService.isAuthenticated()) {
                    next();
                } else {
                    next('/auth/login');
                }
            },
            children: [
                {
                    path: '/pacientes',
                    name: 'pacientes',
                    meta: {
                        breadcrumb: ['Pacientes']
                    },
                    component: () => import('@/views/Pacientes.vue')
                },
                {
                    path: '/pacientes/:id',
                    name: 'pacienteDetalhes',
                    meta: {
                        breadcrumb: ['Pacientes', 'Detalhes']
                    },
                    component: () => import('@/views/PacienteDetalhes.vue')
                },
                {
                    path: '/alimentos',
                    name: 'alimentos',
                    meta: {
                        breadcrumb: ['Alimentos']
                    },
                    component: () => import('@/Alimentos/views/Alimentos.vue')
                },
                {
                    path: '/configuracao',
                    name: 'configuracao',
                    meta: {
                        breadcrumb: ['Configuração']
                    },
                    component: () => import('@/views/utilities/Blocks.vue')
                },
                {
                    path: '/perfil',
                    name: 'perfil',
                    meta: {
                        breadcrumb: ['Perfil']
                    },
                    component: () => import('@/views/PerfilNutricionista.vue')
                }
            ]
        },
        {
            path: '/xyz/leads/campanha',
            name: 'leadsCampanha',
            component: () => import('@/views/pages/LeadsCampanha.vue')
        },
        {
            path: '/pages/notfound',
            name: 'notfound',
            component: () => import('@/views/pages/NotFound.vue')
        },

        {
            path: '/auth/login',
            name: 'login',
            component: () => import('@/views/pages/auth/Login.vue')
        },
        {
            path: '/recuperar-senha',
            name: 'recuperarSenha',
            component: () => import('@/views/pages/auth/RecuperarSenha.vue')
        },
        {
            path: '/auth/access',
            name: 'accessDenied',
            component: () => import('@/views/pages/auth/Access.vue')
        },
        {
            path: '/auth/error',
            name: 'error',
            component: () => import('@/views/pages/auth/Error.vue')
        },
        {
            path: '/criar-conta-gratis',
            name: 'criarContaGratis',
            component: () => import('@/views/pages/CriarContaGratis.vue')
        },
        {
            path: '/formulario/:id',
            name: 'formularioAnamnese',
            component: () => import('@/views/FormularioAnamnese.vue')
        }
    ]
});

export default router;
