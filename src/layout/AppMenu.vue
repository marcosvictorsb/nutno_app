<script setup>
import { ref } from 'vue';
import AppMenuItem from './AppMenuItem.vue';

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
            },
            {
                label: 'Configuração',
                icon: 'pi pi-fw pi-sliders-v',
                to: '/configuracao'
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
