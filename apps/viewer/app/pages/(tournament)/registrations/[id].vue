<script setup lang="ts">
import { formLocked } from "~/keys/isFormLocked"
import { classMixing } from "~/keys/allowClassMixing"
import type {
  FormPlayer,
  ParsedJsonTournament,
  RegistrationWithClass,
  Tables,
} from "@tourney/types"
import { useDateFormat } from "@vueuse/core"
import { getImageUrl } from "#imports"

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
    (t: any) => t.id === team?.tournament_id,
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
const selectedLogo = ref<Tables<"logo"> | null>(logos.value[0] ?? null)

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
const isGeneratingPdf = ref<boolean>(false)
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
  isGeneratingPdf.value = true

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
      deadline: registration.value?.expire_date,
    }

    const response = await $fetch<Blob>("/api/pdf/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    })

    downloadPdf(response)
  } catch (error) {
    const err = error as Error

    throw createError({
      message: `Error generating PDF: ${err.message}`,
      data: err,
    })
  } finally {
    isGeneratingPdf.value = false
  }
}

const COUNT_DEV = 2
const FOOTBALL_PROD = 10
const BASKETBALL_PROD = 5
const VOLLEYBALL_PROD = 6

const playerCount = computed(() => {
  const isDev = import.meta.dev
  switch (tournament.value?.sport) {
    case "Fußball":
      return isDev ? COUNT_DEV : FOOTBALL_PROD
    case "Basketball":
      return isDev ? COUNT_DEV : BASKETBALL_PROD
    case "Volleyball":
      return isDev ? COUNT_DEV : VOLLEYBALL_PROD
  }
  throw createError({
    statusCode: 404,
    message: "Sport nicht gefunden",
  })
})

const formRef = useTemplateRef("formRef")
const isSubmitting = ref(false)
const celebrateSignup = useSignupConfetti()

const submit = async () => {
  if (isSubmitting.value) {
    return
  }

  // @ts-ignore build error
  const isValid = await formRef.value?.$.exposed?.submitForm()
  if (!isValid) {
    return
  }

  const payload = {
    formPlayers: formPlayers.value,
    logo: selectedLogo.value,
    logo_variant: selectedLogoVariant.value,
    tournament: tournament.value,
    registration: registration.value,
  }

  try {
    isSubmitting.value = true

    await $fetch("/api/teams/create", {
      method: "POST",
      body: payload,
    })
    void celebrateSignup()
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
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <PageWrapper>
    <PageHeader
      title="Anmeldeformular"
      description="Trage dich hier ein für ein Turnier"
    />
    <UCard class="mb-3 max-w-xl">
      <template #header>
        <div class="flex flex-col gap-3 text-base">
          <div
            class="flex justify-between rounded-md bg-neutral-50 p-3 dark:bg-neutral-800"
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
                color="neutral"
                variant="outline"
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
          <div class="rounded-md bg-neutral-50 p-3 dark:bg-neutral-800">
            <USelectMenu
              v-model="tournament"
              :disabled="isFormLocked"
              :items="tournaments ?? []"
              placeholder="Wähle das Turnier"
              label-key="name"
              size="lg"
            />
          </div>
        </div>
      </template>
      <template v-if="tournament && !isFormLocked">
        <UAlert
          icon="i-heroicons-information-circle"
          variant="soft"
          color="primary"
          title="Info"
          class="mb-6"
          description="Alle Felder sind auszufüllen. Falls die maximale Anzahl nicht erreicht
          werden kann, ist 'Leer' bei den übrigen Feldern einzutragen. Genauere
        Informationen unter 'Medien' oder nachfragen!"
        />
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
                  'border-neutral-200 dark:border-neutral-700':
                    selectedLogo?.id !== logo.id,
                },
              ]"
              class="bg-white dark:bg-neutral-900"
            >
              <NuxtImg
                width="48"
                height="48"
                :src="getImageUrl(logo.image_path)"
                class="dark:invert dark:filter"
              />
            </div>
            <p class="mt-1 text-center text-xs text-wrap text-neutral-500">
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
                    'border-neutral-200 dark:border-neutral-700':
                      selectedLogoVariant?.id !== variant.id,
                  },
                ]"
                class="bg-white dark:bg-neutral-900"
              >
                <NuxtImg
                  width="48"
                  height="48"
                  :src="getImageUrl(variant.image_path)"
                />
              </div>
              <p class="mt-1 text-center text-xs text-wrap text-neutral-500">
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
          color="warning"
          variant="soft"
          class="my-3"
          title="Warnung"
          description="Nach der Anmeldung können die Daten nicht mehr geändert werden. Falls ihr einen Fehler
          gemacht habt, wendet euch an einen Verantwortlichen für eine Freigabe."
        />
        <UButton
          label="Anmelden"
          :disabled="isSubmitting"
          :loading="isSubmitting"
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
            color="warning"
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
            color="success"
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
            color="error"
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
              color="info"
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
            <p>
              Das Dokument kann so oft wie nötig runtergeladen werden. Der
              Download kann ein paar Sekunden dauern!
            </p>
          </RegistrationItem>
          <UButton
            block
            label="Download"
            size="lg"
            variant="soft"
            icon="i-heroicons-document-arrow-down"
            :loading="isGeneratingPdf"
            :disabled="isGeneratingPdf"
            @click="generatePDF"
          />
          <UAlert
            icon="i-heroicons-exclamation-circle"
            color="error"
            variant="soft"
            title="Probleme beim Runterladen?"
            description="Versuche es mit einem anderen Browser oder Gerät. Ansonsten wende dich
          an einen Verantwortlichen."
          />
        </div>
      </template>
    </UCard>
  </PageWrapper>
</template>
