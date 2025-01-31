<script setup lang="ts">
import type { ParsedJsonTournament } from "~/types/prizes"
import type { Tables } from "~/types/database.types"
import type { FormPlayer } from "~/types/form"
import { formLocked } from "~/keys/isFormLocked"
import { classMixing } from "~/keys/allowClassMixing"
import type { RegistrationWithClass } from "~/types/registration"
import displayFailureNotification from "~/utils/displayFailureNotification"

useHead({
  title: "Anmeldung",
})

const route = useRoute()
const uuid = route.params.id

const { data: registration, refresh } = await useFetch<RegistrationWithClass>(
  `/api/registrations/${uuid}`,
)
if (!registration.value || registration.value.hidden) {
  throw createError({
    statusCode: 404,
    message: "Anmeldung nicht gefunden",
  })
}

const displayPdfDownload: ComputedRef<boolean> = computed(() => {
  return registration.value?.status === "Abgesendet"
})
const isFormLocked: ComputedRef<boolean> = computed(() => {
  return registration.value?.status !== "Ausstehend"
})
provide(formLocked, isFormLocked)

const allowClassMixing = registration.value?.allow_class_mixing
provide(classMixing, allowClassMixing)

const { data: tournaments } = await useFetch("/api/tournaments/active")
const tournament = ref<ParsedJsonTournament>()

const fetchTeam = async () => {
  const team = await $fetch<Tables<"team">>(
    `/api/teams/query/find-by-registration/${registration.value?.id}`,
  )

  if (!team && registration.value?.status !== "Abgelehnt") {
    throw createError({
      statusCode: 404,
      message: "Team nicht gefunden",
    })
  }
  associatedTeam.value = team
  tournament.value = tournaments.value?.find(
    (t) => t.id === team?.tournament_id,
  )
}

const associatedTeam = ref<Tables<"team">>()
if (isFormLocked.value) {
  await fetchTeam()
}

const { data: logos } = await useFetch("/api/logos")
if (!logos.value) {
  throw createError({
    statusCode: 404,
    message: "Logos nicht gefunden",
  })
}
const selectedLogo = ref<Tables<"logo"> | null>(logos.value[0])

const url = computed(() =>
  selectedLogo.value?.id
    ? `/api/logos/variants/${selectedLogo.value.id}`
    : `/api/logos/variants/placeholder`,
)
const { data: variants } = await useFetch<Tables<"logo_variant">[]>(url, {
  watch: [selectedLogo],
})
if (!variants.value) {
  throw createError({
    statusCode: 404,
    message: "Varianten nicht gefunden",
  })
}

const selectedLogoVariant = ref<Tables<"logo_variant"> | null>()
watch(selectedLogo, () => {
  selectedLogoVariant.value = null
})

const isOpen = ref<boolean>(false)
const pdfName = ref<string>(`anmeldung_${registration.value?.class?.name}.pdf`)

const formPlayers = ref<FormPlayer[]>()

const downloadPdf = (response: Blob) => {
  const url = window.URL.createObjectURL(response)
  const a = document.createElement("a")
  a.href = url
  a.download = pdfName.value
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

const generatePDF = async () => {
  try {
    await fetchTeam()

    const payload = {
      pdfName: pdfName.value,
      registration_id: registration.value?.id,
      team_id: associatedTeam.value?.id,
      date: tournament.value?.start_date,
      schoolClass: registration.value?.class?.name,
      year: new Date().getFullYear(),
      sport: tournament.value?.sport,
    }

    const response = await $fetch<Blob>("/api/pdf/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    })

    downloadPdf(response)
  } catch (error) {
    throw createError({
      message: "Error generating PDF",
      data: error,
    })
  }
}

// TODO: change later
const playerCount = computed(() => {
  switch (tournament.value?.sport) {
    case "Fußball":
      return 2 // 10
    case "Basketball":
      return 3 // 5
    case "Volleyball":
      return 4 // 6
  }
  throw createError({
    statusCode: 404,
    message: "Sport nicht gefunden",
  })
})

const formRef = useTemplateRef("formRef")
const submit = async () => {
  // @ts-ignore build error
  formRef.value?.$.exposed?.submitForm()

  const payload = {
    formPlayers: formPlayers.value,
    logo: selectedLogo.value,
    logo_variant: selectedLogoVariant.value,
    tournament: tournament.value,
    registration: registration.value,
  }

  try {
    await $fetch("/api/teams/create", {
      method: "POST",
      body: payload,
    })
    await refresh()
    setTimeout(() => {
      window.scrollBy(0, 512)
    }, 500)
  } catch (error) {
    const err = error as Error
    displayFailureNotification("Fehler beim Anmelden", err.message)
    throw createError({
      statusMessage: err.message,
    })
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Anmeldeformular"
      description="Trage dich hier ein für ein Turnier"
    />
    <UCard
      :ui="{
        base: 'max-w-xl mb-3',
        body: {
          padding: 'p-4 sm:p-6',
        },
        header: {
          padding: 'p-4 sm:p-6',
        },
        footer: {
          padding: 'p-4 sm:p-6',
        },
      }"
    >
      <template #header>
        <div class="flex flex-col gap-3 text-base">
          <div
            class="flex justify-between rounded-md bg-gray-50 p-3 dark:bg-gray-800"
          >
            <div class="flex grow-0 flex-col gap-1">
              <strong>Status</strong>
              <StatusDisplay :status="registration?.status ?? ''" />
            </div>
            <div class="flex items-center justify-center">
              <UButton
                icon="i-ic-round-question-mark"
                size="md"
                square
                color="white"
                @click="isOpen = true"
              />
              <StatusExplanationModal v-model="isOpen" />
            </div>
          </div>
          <div class="flex gap-3">
            <RegistrationItem class="grow flex-col">
              <strong>Klasse</strong>
              <p>{{ registration?.name }}, {{ registration?.class?.name }}</p>
            </RegistrationItem>
            <RegistrationItem class="flex-col">
              <strong>Ablaufdatum</strong>
              <p>
                {{ useDateFormat(registration?.expire_date, "DD.MM.YYYY") }}
              </p>
            </RegistrationItem>
          </div>
          <div class="rounded-md bg-gray-50 p-3 dark:bg-gray-800">
            <USelectMenu
              v-model="tournament"
              :disabled="isFormLocked"
              :options="tournaments ?? []"
              placeholder="Wähle das Turnier"
              option-attribute="name"
              size="lg"
            />
          </div>
        </div>
      </template>
      <template v-if="tournament && !isFormLocked">
        <PageHeading>Spieler</PageHeading>
        <BaseForm
          v-model:players="formPlayers"
          :player-count="playerCount"
          :default-class="registration?.class"
          ref="formRef"
        />
        <PageHeading>Logo</PageHeading>
        <RegistrationItem class="w-full gap-3 overflow-x-auto">
          <div
            v-for="logo in logos"
            :key="logo.id"
            class="flex cursor-pointer flex-col items-center"
            @click="selectedLogo = logo"
          >
            <div
              :class="[
                'curser-pointer flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md border',
                {
                  'border-primary-500 shadow-[0_0px_60px_3px_rgba(29,78,216,0.4)]':
                    selectedLogo?.id === logo.id,
                  'border-gray-200 dark:border-gray-700':
                    selectedLogo?.id !== logo.id,
                },
              ]"
              class="bg-white dark:bg-gray-900"
            >
              <NuxtImg
                width="48"
                height="48"
                :src="getImageUrl(logo.image_path)"
                class="dark:invert dark:filter"
              />
            </div>
            <p class="mt-1 text-wrap text-center text-xs text-gray-500">
              {{ logo.name }}
            </p>
          </div>
        </RegistrationItem>
        <PageHeading>
          <span> Varianten </span>
          <code class="text-xs">[OPTIONAL]</code>
        </PageHeading>
        <RegistrationItem class="w-full gap-3 overflow-x-auto">
          <template v-if="variants?.length">
            <div
              v-for="variant in variants"
              :key="variant.id"
              class="flex cursor-pointer flex-col items-center"
              @click="selectedLogoVariant = variant"
            >
              <div
                :class="[
                  'curser-pointer flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md border',
                  {
                    'border-primary-500 shadow-[0_0px_60px_3px_rgba(29,78,216,0.4)]':
                      selectedLogoVariant?.id === variant.id,
                    'border-gray-200 dark:border-gray-700':
                      selectedLogoVariant?.id !== variant.id,
                  },
                ]"
                class="bg-white dark:bg-gray-900"
              >
                <NuxtImg
                  width="48"
                  height="48"
                  :src="getImageUrl(variant.image_path)"
                />
              </div>
              <p class="mt-1 text-wrap text-center text-xs text-gray-500">
                {{ variant.color }}
              </p>
            </div>
          </template>
          <template v-else>
            <p>Keine Varianten für dieses Logo verfügbar</p>
          </template>
        </RegistrationItem>
        <UAlert
          icon="i-heroicons-exclamation-triangle"
          color="yellow"
          variant="soft"
          class="my-3"
          title="Warnung"
          description="Nach der Anmeldung können die Daten nicht mehr geändert werden. Falls ihr einen Fehler
          gemacht habt, wendet euch an einen Verantwortlichen für eine Freigabe."
        />
        <UButton
          label="Anmelden"
          @click="submit"
          block
          size="lg"
          variant="soft"
        />
      </template>
      <template v-else>
        <template v-if="isFormLocked && registration?.status === 'Abgesendet'">
          <UAlert
            icon="i-heroicons-exclamation-triangle"
            color="yellow"
            variant="soft"
            class="my-3"
            title="Warnung"
            description="Die Anmeldung wurde abgesendet und kann nicht mehr geändert werden. Falls ihr einen Fehler
          gemacht habt, wendet euch an einen Verantwortlichen für eine Freigabe."
          />
        </template>
        <template
          v-else-if="isFormLocked && registration?.status === 'Abgeschlossen'"
        >
          <UAlert
            icon="i-heroicons-check-circle"
            color="green"
            variant="soft"
            class="my-3"
            title="Erfolgreich"
            description="Die Anmeldung wurde erfolgreich abgeschlossen. Viel Erfolg!"
          />
        </template>
        <template
          v-else-if="isFormLocked && registration?.status === 'Abgelehnt'"
        >
          <UAlert
            icon="i-heroicons-x-circle"
            color="red"
            variant="soft"
            class="my-3"
            title="Abgelehnt"
            description="Die Anmeldung wurde abgelehnt. Wende dich an einen Verantwortlichen für weitere Informationen."
          />
        </template>
        <template v-else>
          <p class="text-center">Es wurde noch kein Turnier ausgewählt.</p>
        </template>
      </template>
      <template #footer v-if="displayPdfDownload">
        <PageHeading>Nächsten Schritte</PageHeading>
        <div class="flex flex-col gap-3">
          <RegistrationItem class="flex-col gap-3">
            <div>
              <strong>1. Runterladen</strong>
              <p>Lade dir die PDF Datei auf deinem Gerät runter.</p>
            </div>
            <div>
              <strong>2. Bearbeiten</strong>
              <p>
                Öffne die Datei und fülle die Freistellungs-Tabelle aus. Lasse
                jede Einheit von den jeweiligen Lehrer/-innen unterschreiben.
              </p>
            </div>
            <div>
              <strong>3. Abgeben</strong>
              <p>Drucke die Datei aus und gebe sie ab.</p>
            </div>
            <UAlert
              icon="i-heroicons-information-circle"
              color="blue"
              variant="soft"
              title="Information"
              description="Die Anmeldung ist erst gültig, wenn das Formular abgegeben wurde."
            />
          </RegistrationItem>
          <RegistrationItem class="flex-col">
            <strong>PDF-Dokument</strong>
            <p>
              Name:
              <strong>{{ pdfName }}</strong>
            </p>
            <p>Das Dokument kann so oft wie nötig runtergeladen werden.</p>
          </RegistrationItem>
          <UButton
            block
            label="Download"
            size="lg"
            variant="soft"
            :ui="{
              gap: {
                lg: 'gap-x-2',
              },
            }"
            icon="i-heroicons-document-arrow-down"
            @click="generatePDF"
          />
          <UAlert
            icon="i-heroicons-exclamation-circle"
            color="red"
            variant="soft"
            title="Probleme beim runterladen?"
            description="Versuche es mit einem anderen Browser oder Gerät. Ansonsten wende dich
          an einen Verantwortlichen."
          />
        </div>
      </template>
    </UCard>
  </div>
</template>
