<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<script setup>
import AuthService from '@/service/AuthService';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import AppMenuItem from './AppMenuItem.vue';

const router = useRouter();

const handleLogout = () => {
    AuthService.clearToken();
    router.push('/auth/login');
};

const model = ref([
    {
        label: 'Gerenciamento',
        items: [
            {
                label: 'Pacientes',
                icon: 'pi pi-fw pi-heart',
                to: '/pacientes'
            },
            {
                label: 'Alimentos',
                icon: 'pi pi-fw pi-apple',
                to: '/alimentos'
            }
        ]
    },
    {
        label: 'Conta',
        items: [
            {
                label: 'Meu Perfil',
                icon: 'pi pi-fw pi-user',
                to: '/perfil'
            },
            {
                label: 'Suporte',
                icon: 'pi pi-fw pi-question-circle',
                to: '/suporte'
            },
            {
                label: 'Logout',
                icon: 'pi pi-fw pi-sign-out',
                command: handleLogout
            }
        ]
    }
]);
</script>

<style lang="scss" scoped></style>
