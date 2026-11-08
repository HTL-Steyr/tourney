<script setup lang="ts">
const isOpenCreate = defineModel<boolean>()
const { title, description, modalWidth } = defineProps<{
  title: string
  description?: string
  modalWidth?: string
}>()

const emit = defineEmits<{
  create: []
}>()

const defaultModalWidth = "sm:max-w-xl"
const modalUI = computed(() => ({
  content: `w-full ${modalWidth || defaultModalWidth}`,
}))
</script>

<template>
  <UModal
    v-model:open="isOpenCreate"
    :title="title"
    :description="description || 'Dialog zum Erstellen eines neuen Eintrags.'"
    :ui="modalUI"
  >
    <template #content>
      <UCard
        :ui="{
          root: 'divide-y divide-neutral-100 dark:divide-neutral-800',
          body: 'px-4 py-5 sm:p-6',
          header: 'px-4 py-3 sm:px-6',
          footer: 'px-4 py-3 sm:px-6',
        }"
      >
        <template #header>
          <strong> {{ title }} </strong>
        </template>

        <slot />

        <template #footer>
          <div class="flex items-center gap-2">
            <UButton
              variant="soft"
              size="sm"
              @click="emit('create')"
              label="Erstellen"
            />
            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              @click="isOpenCreate = false"
              label="Abbrechen"
            />
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
