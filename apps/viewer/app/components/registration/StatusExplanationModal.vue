<script setup lang="ts">
const isOpen = defineModel<boolean>()
</script>

<template>
  <UModal v-model:open="isOpen" :ui="{ content: 'w-full sm:max-w-96' }">
    <template #content>
      <div class="p-4">
        <PageHeading class="text-center"> Status der Anmeldung </PageHeading>
        <div
          class="my-4 flex flex-col gap-3 text-base text-neutral-700 sm:text-sm dark:text-neutral-300"
        >
          <div class="space-y-2">
            <UBadge label="Ausstehend" color="neutral" variant="subtle" />
            <p>Die Anmeldung muss noch ausgefüllt werden.</p>
          </div>
          <div class="space-y-2">
            <UBadge label="Abgesendet" color="warning" variant="subtle" />
            <p>
              Das PDF wurde generiert und muss akzeptiert werden. Die Anmeldung
              kann nicht mehr geändert werden.
            </p>
            <p>
              Bei Fehlern kann sie von einem Lehrer wieder freigegeben werden.
            </p>
          </div>
          <div class="space-y-2">
            <UBadge label="Abgeschlossen" color="success" variant="subtle" />
            <p>Alles passt! Ihr wurdet erfolgreich angemeldet.</p>
          </div>
          <div class="space-y-2">
            <UBadge label="Abgelehnt" color="error" variant="subtle" />
            <p>
              Ungültig oder das Turnier hat zu viele Teams und ein paar Teams
              müssen entfernt werden. Oder das Ablaufdatum wurde überschritten.
            </p>
          </div>
        </div>
        <UButton
          label="Ok, verstanden"
          block
          size="lg"
          variant="soft"
          @click="isOpen = false"
        />
      </div>
    </template>
  </UModal>
</template>
