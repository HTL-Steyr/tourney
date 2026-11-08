<script setup lang="ts">
const isOpenDelete = defineModel<boolean>()
const {
  title = "Löschen",
  description = "Bestätigungsdialog zum Löschen des aktuellen Eintrags.",
} = defineProps<{
  title?: string
  description?: string
}>()
const emit = defineEmits<{
  delete: []
}>()
</script>

<template>
  <UModal
    v-model:open="isOpenDelete"
    :title="title"
    :description="description"
    :ui="{ content: 'w-full sm:max-w-md' }"
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
              color="error"
              @click="emit('delete')"
              label="Löschen"
            />
            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              @click="isOpenDelete = false"
              label="Abbrechen"
            />
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
