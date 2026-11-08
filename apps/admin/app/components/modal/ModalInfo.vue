<script setup lang="ts">
const isOpenInfo = defineModel<boolean>()
const { title = "Info", description = "Informationsdialog." } = defineProps<{
  title?: string
  description?: string
}>()
</script>

<template>
  <UModal
    v-model:open="isOpenInfo"
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
              color="neutral"
              variant="outline"
              size="sm"
              @click="isOpenInfo = false"
              label="Fertig"
            />
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
