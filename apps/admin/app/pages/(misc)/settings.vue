<script setup lang="ts">
const title = ref<string>("Einstellungen")
useHead({
  title: () => title.value,
})

const { name, role, email, last_sign_in, logout } = useUser()
const { enabled: aiAssistantEnabled } = useAiAssistant()
const { showGroupedStandings } = useLiveSettings()

const cardUi = {
  root: "border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900",
  header: "px-4 py-2.5 sm:px-5",
  body: "px-4 py-3 sm:px-5",
  footer: "px-4 py-2.5 sm:px-5",
}

const onLogout = async () => {
  await logout()
  return navigateTo("/login")
}
</script>

<template>
  <BasePageHeader :title="title">
    <ToolbarContainer>
      <NuxtLink to="/">
        <UButton
          label="Dokumentation"
          size="sm"
          variant="outline"
          color="neutral"
          trailing-icon="i-heroicons-arrow-up-right"
        />
      </NuxtLink>
    </ToolbarContainer>
  </BasePageHeader>
  <BasePageContent>
    <div class="h-full overflow-auto px-2 pb-16">
      <main class="m-auto flex min-h-full max-w-150 flex-col space-y-2 py-3">
        <UCard variant="soft" :ui="cardUi">
          <template #header> Aussehen </template>
          <BaseSettingsItem>
            <div class="flex items-center justify-between">
              <strong>Modus</strong>
              <ThemeButton />
            </div>
          </BaseSettingsItem>
        </UCard>
        <UCard variant="soft" :ui="cardUi">
          <template #header> Account </template>
          <BaseSettingsItem>
            <strong>{{ name }}</strong>
            <UBadge variant="subtle" class="float-right">{{ role }}</UBadge>
            <p>{{ email }}</p>
            <p
              class="text-right text-sm text-neutral-400 dark:text-neutral-500"
              v-if="last_sign_in !== 'Unbekannt'"
            >
              Zuletzt eingeloggt:
              {{ last_sign_in }}
            </p>
          </BaseSettingsItem>
          <template #footer>
            <UButton label="Logout" size="sm" @click="onLogout()" />
          </template>
        </UCard>
        <UCard variant="soft" :ui="cardUi">
          <template #header> Live </template>
          <BaseSettingsItem>
            <div class="flex items-start justify-between gap-4">
              <div>
                <strong>Gruppenansicht</strong>
                <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  Zeigt auf der Live-Seite alle Gruppen untereinander statt der
                  bisherigen Gesamtwertung.
                </p>
              </div>
              <USwitch v-model="showGroupedStandings" />
            </div>
          </BaseSettingsItem>
        </UCard>
        <UCard variant="soft" :ui="cardUi">
          <template #header>
            <div class="flex items-center justify-between gap-2">
              <span>AI</span>
              <UBadge color="warning" variant="subtle" size="sm">BETA</UBadge>
            </div>
          </template>
          <BaseSettingsItem>
            <div class="flex items-start justify-between gap-4">
              <div>
                <strong>Assistent</strong>
                <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  Aktiviere den AI Assistenten, um automatisch generierte
                  Antworten auf deine Fragen zu erhalten.
                </p>
              </div>
              <USwitch v-model="aiAssistantEnabled" />
            </div>
          </BaseSettingsItem>
        </UCard>
        <UCard variant="soft" :ui="cardUi">
          <template #header> Kontakt </template>
          <BaseSettingsItem>
            <strong>Dino Kupinic</strong>
            <p>dinokupinic2006@gmail.com</p>
            <br />
            <strong>Prof. Mag. Peter Rathgeb</strong>
            <p>Peter.Rathgeb@htl-steyr.ac.at</p>
          </BaseSettingsItem>
        </UCard>
      </main>
    </div>
  </BasePageContent>
</template>
