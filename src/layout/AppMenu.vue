<script setup>
import { ref } from 'vue';
import AppMenuItem from './AppMenuItem.vue';

const model = ref([
    {
        label: 'Home',
        items: [
            {
                label: 'Dashboard',
                icon: 'pi pi-fw pi-home',
                to: '/dashboard'
            }
        ]
    },
    {
        label: 'Gerenciamento',
        icon: 'pi pi-fw pi-cog',
        path: '/gerenciamento',
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
            },
            {
                label: 'Configuração',
                icon: 'pi pi-fw pi-sliders-v',
                to: '/configuracao'
            }
        ]
    },
    {
        label: 'Pages',
        icon: 'pi pi-fw pi-briefcase',
        path: '/pages',
        items: [
            {
                label: 'Landing',
                icon: 'pi pi-fw pi-globe',
                to: '/'
            },
            {
                label: 'Auth',
                icon: 'pi pi-fw pi-user',
                path: '/auth',
                items: [
                    {
                        label: 'Login',
                        icon: 'pi pi-fw pi-sign-in',
                        to: '/auth/login'
                    },
                    {
                        label: 'Error',
                        icon: 'pi pi-fw pi-times-circle',
                        to: '/auth/error'
                    },
                    {
                        label: 'Access Denied',
                        icon: 'pi pi-fw pi-lock',
                        to: '/auth/access'
                    }
                ]
            },
            {
                label: 'Crud',
                icon: 'pi pi-fw pi-pencil',
                to: '/pages/crud'
            },
            {
                label: 'Not Found',
                icon: 'pi pi-fw pi-exclamation-circle',
                to: '/pages/notfound'
            },
            {
                label: 'Empty',
                icon: 'pi pi-fw pi-circle-off',
                to: '/pages/empty'
            }
        ]
    },
    {
        label: 'Hierarchy',
        icon: 'pi pi-fw pi-align-left',
        path: '/hierarchy',
        items: [
            {
                label: 'Submenu 1',
                icon: 'pi pi-fw pi-align-left',
                path: '/submenu_1',
                items: [
                    {
                        label: 'Submenu 1.1',
                        icon: 'pi pi-fw pi-align-left',
                        path: '/submenu_1_1',
                        items: [
                            {
                                label: 'Submenu 1.1.1',
                                icon: 'pi pi-fw pi-align-left'
                            },
                            {
                                label: 'Submenu 1.1.2',
                                icon: 'pi pi-fw pi-align-left'
                            },
                            {
                                label: 'Submenu 1.1.3',
                                icon: 'pi pi-fw pi-align-left'
                            }
                        ]
                    },
                    {
                        label: 'Submenu 1.2',
                        icon: 'pi pi-fw pi-align-left',
                        path: '/submenu_1_2',
                        items: [
                            {
                                label: 'Submenu 1.2.1',
                                icon: 'pi pi-fw pi-align-left'
                            }
                        ]
                    }
                ]
            },
            {
                label: 'Submenu 2',
                icon: 'pi pi-fw pi-align-left',
                path: '/submenu_2',
                items: [
                    {
                        label: 'Submenu 2.1',
                        icon: 'pi pi-fw pi-align-left',
                        path: '/submenu_2_1',
                        items: [
                            {
                                label: 'Submenu 2.1.1',
                                icon: 'pi pi-fw pi-align-left'
                            },
                            {
                                label: 'Submenu 2.1.2',
                                icon: 'pi pi-fw pi-align-left'
                            }
                        ]
                    },
                    {
                        label: 'Submenu 2.2',
                        icon: 'pi pi-fw pi-align-left',
                        path: '/submenu_2_2',
                        items: [
                            {
                                label: 'Submenu 2.2.1',
                                icon: 'pi pi-fw pi-align-left'
                            }
                        ]
                    }
                ]
            }
        ]
    }
]);
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
