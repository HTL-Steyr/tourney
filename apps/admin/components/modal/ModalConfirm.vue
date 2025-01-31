<script setup lang="ts">
const isOpenConfirm = defineModel<boolean>()
defineEmits<{
  confirm: () => void
}>()
</script>

<template>
  <UModal v-model="isOpenConfirm" :ui="{ width: 'w-full sm:max-w-md' }">
    <UCard
      :ui="{
        divide: 'divide-y divide-gray-100 dark:divide-gray-800',
        body: {
          padding: 'px-4 py-5 sm:p-6',
        },
        header: {
          padding: 'px-4 py-3 sm:px-6',
        },
        footer: {
          padding: 'px-4 py-3 sm:px-6',
        },
      }"
    >
      <template #header>
        <strong> Bestätigung </strong>
      </template>

      <slot />

      <template #footer>
        <div class="flex items-center gap-2">
          <UButton
            variant="soft"
            size="xs"
            color="yellow"
            @click="$emit('confirm')"
            label="Bestätigen"
          />
          <UButton
            color="gray"
            size="xs"
            @click="isOpenConfirm = false"
            label="Abbrechen"
          />
        </div>
      </template>
    </UCard>
  </UModal>
</template>
