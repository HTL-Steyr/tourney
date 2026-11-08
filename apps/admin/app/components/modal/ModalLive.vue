<script setup lang="ts">
const isOpenLive = defineModel<boolean>()
const emit = defineEmits<{
  live: []
}>()
const is_live = useState<boolean>("is_live")
const liveButtonLabel = computed(() => {
  return is_live.value ? "Ja, Offline gehen" : "Ja, Live gehen"
})
const liveIcon = computed(() => {
  return is_live.value ? "i-heroicons-signal-slash" : "i-heroicons-signal"
})
const liveTitle = computed(() => {
  return is_live.value ? "Offline gehen?" : "Live gehen?"
})
const liveDescription = computed(() => {
  return is_live.value
    ? "Bestätigungsdialog zum Deaktivieren des Live-Status."
    : "Bestätigungsdialog zum Aktivieren des Live-Status."
})
</script>

<template>
  <UModal
    v-model:open="isOpenLive"
    :title="liveTitle"
    :description="liveDescription"
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
          <strong>{{ liveTitle }}</strong>
        </template>

        <div
          v-if="!is_live"
          class="space-y-3 text-sm text-neutral-500 dark:text-neutral-400"
        >
          <p>
            Möchtest du das Turnier live gehen lassen? Es wird für alle sichtbar
            sein.
          </p>
          <p>
            <strong>Auswirkungen:</strong>
          </p>
          <div class="space-y-2 pl-6">
            <div class="flex items-center gap-3">
              <UIcon
                name="i-heroicons-check"
                class="text-primary-500"
                size="16"
              />
              <p>Das Turnier beginnt nach Zeitplan.</p>
            </div>
            <div class="flex items-center gap-3">
              <UIcon
                name="i-heroicons-check"
                class="text-primary-500"
                size="20"
              />
              <p>
                Gruppeneinteilung wird fixiert und kann nicht mehr geändert
                werden.
              </p>
            </div>
            <div class="flex items-center gap-3">
              <UIcon
                name="i-heroicons-check"
                class="text-primary-500"
                size="16"
              />
              <p>Manche Einstellungen sind nicht mehr änderbar.</p>
            </div>
          </div>
        </div>
        <div v-else>
          <p>Möchtest du das Turnier offline gehen lassen?</p>
        </div>

        <template #footer>
          <div class="flex items-center gap-2">
            <UButton
              variant="soft"
              size="sm"
              color="error"
              :icon="liveIcon"
              @click="emit('live')"
              :label="liveButtonLabel"
            />
            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              @click="isOpenLive = false"
              label="Abbrechen"
            />
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
