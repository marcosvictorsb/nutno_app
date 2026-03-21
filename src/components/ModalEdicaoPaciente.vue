<template>
    <Dialog :visible="visible" header="Editar Paciente" :modal="true" :style="{ width: '60vw' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }" @update:visible="$emit('update:visible', $event)" @hide="handleClose">
        <div v-if="formEdicaoPaciente" class="space-y-6">
            <!-- Seção: Dados Pessoais -->
            <div>
                <h3 class="text-lg font-bold text-gray-900 mb-4">Dados pessoais</h3>

                <!-- Nome Completo -->
                <div class="mb-4">
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Nome completo</label>
                    <InputText :model-value="formEdicaoPaciente.nome" @update:model-value="updateFormField('nome', $event)" type="text" placeholder="Ex.: João da Silva" class="w-full" autocomplete="off" :invalid="!!formErrors?.nome" />
                    <small v-if="formErrors?.nome" class="block text-red-500 text-xs font-semibold mt-1">
                        {{ formErrors.nome }}
                    </small>
                </div>

                <!-- Apelido e Data de Nascimento -->
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Apelido</label>
                        <InputText :model-value="formEdicaoPaciente.apelido" @update:model-value="updateFormField('apelido', $event)" type="text" placeholder="Como ele prefere ser chamado" class="w-full" autocomplete="off" />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Data de nascimento</label>
                        <DatePicker :model-value="formEdicaoPaciente.data_nascimento" @update:model-value="updateFormField('data_nascimento', $event)" dateFormat="dd/mm/yy" placeholder="dd/mm/yyyy" :showIcon="true" />
                    </div>
                </div>

                <!-- E-mail -->
                <div class="mb-4">
                    <label class="block text-sm font-semibold text-gray-700 mb-2">E-mail</label>
                    <InputText :model-value="formEdicaoPaciente.email" @update:model-value="updateFormField('email', $event)" type="email" placeholder="email@exemplo.com" class="w-full" autocomplete="off" :invalid="!!formErrors?.email" />
                    <small v-if="formErrors?.email" class="block text-red-500 text-xs font-semibold mt-1">
                        {{ formErrors.email }}
                    </small>
                </div>

                <!-- WhatsApp e Sexo -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">WhatsApp</label>
                        <InputMask :model-value="formEdicaoPaciente.whatsapp" @update:model-value="updateFormField('whatsapp', $event)" mask="(99) 99999-9999" placeholder="(00) 00000-0000" class="w-full" />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Sexo</label>
                        <div class="flex items-center gap-4 mb-2">
                            <div class="flex items-center">
                                <RadioButton :model-value="formEdicaoPaciente.sexo" @update:model-value="updateFormField('sexo', $event)" value="M" inputId="masculino-edicao" :invalid="!!formErrors?.sexo" />
                                <label for="masculino-edicao" class="ml-2 text-sm cursor-pointer">Masculino</label>
                            </div>
                            <div class="flex items-center">
                                <RadioButton :model-value="formEdicaoPaciente.sexo" @update:model-value="updateFormField('sexo', $event)" value="F" inputId="feminino-edicao" :invalid="!!formErrors?.sexo" />
                                <label for="feminino-edicao" class="ml-2 text-sm cursor-pointer">Feminino</label>
                            </div>
                            <div class="flex items-center">
                                <RadioButton :model-value="formEdicaoPaciente.sexo" @update:model-value="updateFormField('sexo', $event)" value="Outro" inputId="outro-edicao" :invalid="!!formErrors?.sexo" />
                                <label for="outro-edicao" class="ml-2 text-sm cursor-pointer">Outro</label>
                            </div>
                        </div>
                        <small v-if="formErrors?.sexo" class="block text-red-500 text-xs font-semibold mt-1">
                            {{ formErrors.sexo }}
                        </small>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Cancelar" severity="secondary" @click="handleClose" />
            <Button label="Atualizar paciente" severity="success" icon="pi pi-check" :loading="loading" @click="handleSave" class="w-full" />
        </template>
    </Dialog>
</template>

<script setup>
import Button from 'primevue/button';
import DatePicker from 'primevue/datepicker';
import Dialog from 'primevue/dialog';
import InputMask from 'primevue/inputmask';
import InputText from 'primevue/inputtext';
import RadioButton from 'primevue/radiobutton';

const props = defineProps({
    visible: Boolean,
    formEdicaoPaciente: Object,
    formErrors: Object,
    loading: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:visible', 'update:formEdicaoPaciente', 'update:formErrors', 'fechar', 'salvar']);

const handleClose = () => {
    emit('update:visible', false);
    emit('fechar');
};

const handleSave = () => {
    emit('salvar');
};

const updateFormField = (field, value) => {
    const updated = { ...props.formEdicaoPaciente };
    updated[field] = value;
    emit('update:formEdicaoPaciente', updated);
};
</script>
