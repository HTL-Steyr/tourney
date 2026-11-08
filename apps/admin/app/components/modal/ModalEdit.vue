<script setup lang="ts">
const isOpenEdit = defineModel<boolean>()
const {
  title = "Editieren",
  description,
  modalWidth,
} = defineProps<{
  title?: string
  description?: string
  modalWidth?: string
}>()

const emit = defineEmits<{
  edit: []
}>()

const defaultModalWidth = "sm:max-w-xl"
const modalUI = computed(() => ({
  content: `w-full ${modalWidth || defaultModalWidth}`,
}))
</script>

<template>
  <UModal
    v-model:open="isOpenEdit"
    :title="title"
    :description="
      description || 'Dialog zum Bearbeiten des aktuellen Eintrags.'
    "
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
              @click="emit('edit')"
              label="Speichern"
            />
            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              @click="isOpenEdit = false"
              label="Abbrechen"
            />
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
