<script setup lang="ts">
import {
  FOOTBALL_MAX_TEAMS,
  VOLLEYBALL_BASKETBALL_MAX_TEAMS,
} from "#shared/constants"
import { z } from "zod"
import type {
  Enums,
  Group,
  ParsedJsonTournament,
  TournamentTeamSummary,
} from "@tourney/types"

type TournamentParticipant = {
  id: string
  name: string
  group_id: string | null
  registration: {
    status: Enums<"registration_status">
  } | null
}

const title = ref<string>("Turniere")
useHead({
  title: () => title.value,
})
const { getCurrentUserId } = useUser()
const { clearPageContext, setPageContext } = useAiAssistantPageContext()
const route = useRoute()
const { data: tournament, refresh: tournamentRefresh } =
  await useFetch<ParsedJsonTournament | null>(
    `/api/tournaments/${route.params.id}`,
  )
if (!tournament.value) {
  throw createError({
    statusCode: 404,
    message: "Turnier nicht gefunden",
  })
}
const tournamentName = computed(() => tournament.value?.name ?? "Turnier")
const { data, refresh: teamsRefresh } = await useFetch<TournamentTeamSummary>(
  `/api/tournaments/${tournament.value.id}/teams`,
)
const { data: participants, refresh: participantsRefresh } = await useFetch<
  TournamentParticipant[]
>(`/api/tournaments/${tournament.value.id}/participants`)

const maxTeams = computed(() => {
  switch (tournament.value?.sport) {
    case "Fußball":
      return FOOTBALL_MAX_TEAMS
    case "Basketball":
    case "Volleyball":
      return VOLLEYBALL_BASKETBALL_MAX_TEAMS
    default:
      return 0
  }
})

const groupAlert = computed(() => {
  if (!data.value) return
  if (data.value.teams < maxTeams.value) {
    return `Es fehlen noch ${maxTeams.value - data.value.teams} Spielteams.`
  }
  if (data.value.teams > maxTeams.value) {
    return `Es sind ${data.value.teams - maxTeams.value} Spielteams zu viel ausgewählt.`
  }
  return undefined
})

const waitingTeamsAlert = computed(() => {
  if (!data.value || data.value.waiting <= 0) return

  return `${data.value.waiting} ${data.value.waiting === 1 ? "Team ist" : "Teams sind"} angemeldet, aber aktuell nicht im Spielfeld.`
})

const links = computed(() => [
  {
    label: "Turniere",
    to: "/tournaments",
  },
  {
    label: tournamentName.value,
    to: `/tournaments/${route.params.id}`,
  },
])

const { data: groups, refresh: refreshGroups } = await useFetch(
  `/api/tournaments/${tournament.value.id}/groups`,
)

const isOpenLive = defineModel<boolean>()
const isTournamentLive: ComputedRef<boolean> = computed(() => {
  return tournament.value?.is_live!
})
const is_live = useState<boolean>("is_live", () => isTournamentLive.value)
watch(isTournamentLive, () => {
  is_live.value = isTournamentLive.value
})
const liveLabel = computed(() => {
  return is_live.value ? "Offline gehen..." : "Live gehen..."
})

const { fetchLiveTournaments } = useLiveTournaments()
const onSetLive = async () => {
  try {
    await $fetch(`/api/tournaments/${tournament.value?.id}/live`, {
      method: "PUT",
      body: {
        is_live: !isTournamentLive.value,
      },
    })
    isOpenLive.value = false
    await tournamentRefresh()
    await fetchLiveTournaments()
    displaySuccessNotification(
      "Erfolgreich",
      `Das Turnier ist jetzt ${tournament.value?.is_live ? "live" : "offline"}.`,
    )
  } catch (err) {
    console.error(err)
    displayFailureNotification(
      "Fehler",
      "Das Turnier konnte nicht live gesetzt werden.",
    )
  }
}

const refreshTournament = async () => {
  await tournamentRefresh()
  await refreshGroups()
  await teamsRefresh()
  await participantsRefresh()
  displaySuccessNotification("Aktualisiert", "Die Daten wurde aktualisiert.")
}

const mixGroups = async () => {
  try {
    await $fetch(`/api/tournaments/${tournament.value?.id}/mix`)
    await refreshGroups()
    await teamsRefresh()
    await participantsRefresh()
    isOpenConfirm.value = false
    displaySuccessNotification(
      "Erfolgreich",
      "Die Gruppen wurden neu gemischt.",
    )
  } catch (err) {
    console.error(err)
    displayFailureNotification(
      "Fehler",
      "Die Gruppen konnten nicht gemischt werden.",
    )
  }
}

const timeline = [
  { label: "Gruppenphase" },
  { label: "Viertelfinale" },
  { label: "Semifinale" },
  { label: "Kleines Finale" },
  { label: "Finale" },
]

const isOpenTeamSelection = ref<boolean>(false)
const selectedPlayableIds = ref<string[]>([])
const currentPlayableIds = computed(() => {
  return (
    participants.value
      ?.filter((team) => team.group_id !== null)
      .map((team) => team.id) ?? []
  )
})
watch(
  currentPlayableIds,
  (ids) => {
    selectedPlayableIds.value = [...ids]
  },
  { immediate: true },
)

const eligibleParticipants = computed(() => {
  return (
    participants.value?.filter(
      (team) => team.registration?.status !== "Abgelehnt",
    ) ?? []
  )
})
const selectedPlayableCount = computed(() => selectedPlayableIds.value.length)
const selectedPlayableIdSet = computed(() => new Set(selectedPlayableIds.value))
const selectionHasExactTeamCount = computed(() => {
  return selectedPlayableCount.value === maxTeams.value
})
const canRandomizeSelection = computed(() => {
  return eligibleParticipants.value.length >= maxTeams.value
})

function shuffleParticipants(
  items: TournamentParticipant[],
): TournamentParticipant[] {
  const shuffled = [...items]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const current = shuffled[i]
    const random = shuffled[j]
    if (current === undefined || random === undefined) continue
    shuffled[i] = random
    shuffled[j] = current
  }
  return shuffled
}

const sortedParticipants = computed(() => {
  return [...(participants.value ?? [])].sort((a, b) => {
    const aSelected = selectedPlayableIdSet.value.has(a.id)
    const bSelected = selectedPlayableIdSet.value.has(b.id)
    if (aSelected !== bSelected) {
      return aSelected ? -1 : 1
    }
    return a.name.localeCompare(b.name)
  })
})

const onResetTeamSelection = () => {
  selectedPlayableIds.value = [...currentPlayableIds.value]
}

const onRandomizeTeamSelection = () => {
  if (!canRandomizeSelection.value) {
    displayFailureNotification(
      "Zu wenig Teams",
      `Für die Auslosung werden mindestens ${maxTeams.value} Teams benötigt.`,
    )
    return
  }

  const shuffled = shuffleParticipants(eligibleParticipants.value)
  selectedPlayableIds.value = shuffled
    .slice(0, maxTeams.value)
    .map((team) => team.id)
}

const isOpenRemoveTeam = ref<boolean>(false)
const isOpenRemoveTeamConfirm = ref<boolean>(false)
const teamToRemove = ref<TournamentParticipant | null>(null)
const removingTeamId = ref<string | null>(null)

const removableParticipants = computed(() => {
  return [...(participants.value ?? [])].sort((a, b) => {
    if (Boolean(a.group_id) !== Boolean(b.group_id)) {
      return a.group_id ? -1 : 1
    }

    return a.name.localeCompare(b.name)
  })
})

const onRemoveTeamClick = (participant: TournamentParticipant) => {
  teamToRemove.value = participant
  isOpenRemoveTeamConfirm.value = true
}

watch(isOpenRemoveTeam, (isOpen) => {
  if (isOpen) return

  isOpenRemoveTeamConfirm.value = false
  teamToRemove.value = null
})

const onRemoveTeam = async () => {
  if (!teamToRemove.value || !tournament.value) return

  try {
    const teamName = teamToRemove.value.name
    removingTeamId.value = teamToRemove.value.id

    await $fetch(
      `/api/tournaments/${tournament.value.id}/team/${teamToRemove.value.id}`,
      {
        method: "DELETE",
      },
    )

    await refreshGroups()
    await teamsRefresh()
    await participantsRefresh()
    isOpenRemoveTeamConfirm.value = false
    teamToRemove.value = null
    displaySuccessNotification(
      "Team entfernt",
      `${teamName} wurde aus dem Turnier entfernt.`,
    )
  } catch (err) {
    console.error(err)
    displayFailureNotification(
      "Fehler beim Entfernen",
      err instanceof Error
        ? err.message
        : "Das Team konnte nicht aus dem Turnier entfernt werden.",
    )
  } finally {
    removingTeamId.value = null
  }
}

const toggleTeamSelection = (teamId: string, checked: boolean) => {
  if (checked) {
    if (selectedPlayableIdSet.value.has(teamId)) return
    if (selectedPlayableCount.value >= maxTeams.value) return
    selectedPlayableIds.value = [...selectedPlayableIds.value, teamId]
    return
  }

  selectedPlayableIds.value = selectedPlayableIds.value.filter(
    (id) => id !== teamId,
  )
}

const onSaveTeamSelection = async () => {
  if (!selectionHasExactTeamCount.value) {
    displayFailureNotification(
      "Ungültige Auswahl",
      `Es müssen genau ${maxTeams.value} Teams ausgewählt sein.`,
    )
    return
  }

  if (!tournament.value) return

  try {
    await $fetch(`/api/tournaments/${tournament.value.id}/participants`, {
      method: "PUT",
      body: {
        selected_team_ids: selectedPlayableIds.value,
      },
    })
    await refreshGroups()
    await teamsRefresh()
    await participantsRefresh()
    isOpenTeamSelection.value = false
    displaySuccessNotification(
      "Auswahl gespeichert",
      "Die Spielteams wurden gespeichert und neu gemischt.",
    )
  } catch (err) {
    console.error(err)
    displayFailureNotification(
      "Fehler",
      "Die Team-Auswahl konnte nicht gespeichert werden.",
    )
  }
}

const flowGroups = computed<Group[]>(() => {
  return (
    groups.value?.map((group) => ({
      name: group.name,
      teams: group.teams.map((team) => team.name),
    })) ?? []
  )
})

const teams = computed(() => {
  return groups.value
    ?.flatMap((group) => group.teams)
    .sort((a, b) => {
      return a.name.localeCompare(b.name)
    })
})

const search = ref<string>("")
const filteredTeams = computed(() => {
  return teams.value?.filter((team) => {
    return team.name.toLowerCase().includes(search.value.toLowerCase())
  })
})

const isOpenConfirm = ref<boolean>(false)
const editPlayerNote = async (id: string, note: string) => {
  try {
    await $fetch("/api/players/edit", {
      method: "PUT",
      body: { id, note },
    })
    await refreshGroups()
    isOpenConfirm.value = false
    displaySuccessNotification(
      "Notiz bearbeitet",
      "Die Notiz wurde bearbeitet.",
    )
  } catch (err) {
    console.error(err)
    displayFailureNotification(
      "Fehler",
      "Die Notiz konnte nicht bearbeitet werden.",
    )
  }
}

const isOpenDelete = ref<boolean>(false)
const playerToDeleteId = ref<string>("")
const onDeleteClick = (id: string) => {
  playerToDeleteId.value = id
  isOpenDelete.value = true
}

const deletePlayer = async () => {
  try {
    await $fetch(`/api/players/delete/${playerToDeleteId.value}`, {
      method: "DELETE",
    })
    await refreshGroups()
    playerToDeleteId.value = ""
    isOpenDelete.value = false
    displaySuccessNotification("Gelöscht", "Der Spieler wurde gelöscht.")
  } catch (err) {
    console.error(err)
    displayFailureNotification(
      "Fehler",
      "Der Spieler konnte nicht gelöscht werden.",
    )
  }
}

const editSchema = z.object({
  name: z.string(),
  rules: z.string(),
  start_date: z.string().date(),
  from: z.string().time(),
  to: z.string().time(),
  sport: z.custom<Enums<"sport_type">>(),
  prizes: z.object({
    first: z.string(),
    second: z.string(),
    third: z.string(),
    bonus: z.string(),
  }),
  thumbnail_path: z.string(),
  location: z.string(),
  groups: z.number(),
  group_teams: z.number(),
  knockout_interval: z.number(),
})

const editState = reactive({
  name: tournament.value.name,
  rules: tournament.value.rules,
  start_date: tournament.value.start_date,
  from: tournament.value.from,
  to: tournament.value.to,
  sport: tournament.value.sport,
  prizes: {
    first: tournament.value.prizes?.first ?? "",
    second: tournament.value.prizes?.second ?? "",
    third: tournament.value.prizes?.third ?? "",
    bonus: tournament.value.prizes?.bonus ?? "",
  },
  thumbnail_path: tournament.value.thumbnail_path,
  location: tournament.value.location,
  groups: tournament.value.groups,
  group_teams: tournament.value.group_teams,
  knockout_interval: tournament.value.knockout_interval,
})

const resetEditState = () => {
  if (!tournament.value) return

  editState.name = tournament.value.name
  editState.rules = tournament.value.rules
  editState.start_date = tournament.value.start_date
  editState.from = tournament.value.from
  editState.to = tournament.value.to
  editState.sport = tournament.value.sport
  editState.prizes.first = tournament.value.prizes?.first ?? ""
  editState.prizes.second = tournament.value.prizes?.second ?? ""
  editState.prizes.third = tournament.value.prizes?.third ?? ""
  editState.prizes.bonus = tournament.value.prizes?.bonus ?? ""
  editState.thumbnail_path = tournament.value.thumbnail_path
  editState.location = tournament.value.location
  editState.groups = tournament.value.groups
  editState.group_teams = tournament.value.group_teams
  editState.knockout_interval = tournament.value.knockout_interval
}

const isOpenEdit = ref<boolean>(false)
const liveFlow = useTemplateRef<{ refresh: () => Promise<void> }>("liveFlow")
watch(isOpenEdit, (isOpen) => {
  if (isOpen) return

  resetEditState()
})

watch(tournament, () => {
  if (isOpenEdit.value) return

  resetEditState()
})

const onSubmitEdit = async () => {
  try {
    const editorId = await getCurrentUserId()
    await $fetch("/api/tournaments/edit", {
      method: "PUT",
      body: {
        id: tournament.value?.id,
        tournament: {
          ...editState,
          last_edited_by_id: editorId,
        },
      },
    })
    await tournamentRefresh()
    await refreshGroups()
    await teamsRefresh()
    await liveFlow.value?.refresh()
    resetEditState()
    isOpenEdit.value = false
    displaySuccessNotification(
      "Turnier bearbeitet",
      "Das Turnier wurde erfolgreich bearbeitet.",
    )
  } catch (err) {
    console.error(err)
    displayFailureNotification(
      "Fehler beim Bearbeiten",
      (err as { data?: { message?: string } }).data?.message ??
        "Das Turnier konnte nicht bearbeitet werden.",
    )
  }
}

const { data: matches } = await useFetch(
  `/api/tournaments/${tournament.value.id}/matches`,
)

watchEffect(() => {
  if (!tournament.value) {
    clearPageContext()
    return
  }

  setPageContext({
    tournament: {
      groupNames: (groups.value ?? []).map((group) => group.name),
      groups: tournament.value.groups ?? null,
      id: tournament.value.id,
      isLive: tournament.value.is_live,
      knockoutInterval: tournament.value.knockout_interval ?? null,
      location: tournament.value.location ?? null,
      matches: matches.value?.length ?? 0,
      name: tournament.value.name,
      participants: participants.value?.length ?? 0,
      playableTeams: data.value?.teams ?? null,
      sport: tournament.value.sport ?? null,
      startDate: tournament.value.start_date ?? null,
      teamsPerGroup: tournament.value.group_teams ?? null,
      timeRange:
        tournament.value.from && tournament.value.to
          ? `${tournament.value.from} - ${tournament.value.to}`
          : null,
      waitingTeams: data.value?.waiting ?? null,
    },
  })
})

onBeforeUnmount(() => {
  clearPageContext()
})

const hasMatches = computed<boolean>(() => {
  return Boolean(matches.value && matches.value.length > 0)
})

const allTeamsRegistered = computed(() => {
  return (
    groups.value?.every((group) =>
      group.teams.every(
        (team) => team.registration?.status === "Abgeschlossen",
      ),
    ) ?? false
  )
})

const TOURNAMENT_META_WIDE_MIN_WIDTH = 574
const tournamentMetaRef = ref<HTMLElement | null>(null)
const { width: tournamentMetaWidth } = useElementSize(tournamentMetaRef)
const isTournamentMetaWide = computed(() => {
  return tournamentMetaWidth.value >= TOURNAMENT_META_WIDE_MIN_WIDTH
})

const canGoLive = computed(() => {
  if (isTournamentLive.value) return true
  return allTeamsRegistered.value && data.value?.teams === maxTeams.value
})
</script>

<template>
  <BasePageHeader class="pl-0">
    <ToolbarContainer class="flex w-full items-center justify-between">
      <div class="flex items-center gap-2">
        <UBreadcrumb :items="links" />
        <TournamentLiveDisplay v-if="tournament" :is-live="isTournamentLive" />
      </div>
      <div class="flex items-center space-x-2">
        <UButton
          icon="i-heroicons-arrow-path"
          color="neutral"
          variant="outline"
          size="sm"
          square
          @click="refreshTournament"
        />
        <UButton
          v-if="!isTournamentLive"
          icon="i-heroicons-pencil-square"
          label="Bearbeiten"
          color="neutral"
          variant="outline"
          size="sm"
          square
          @click="isOpenEdit = true"
        />
        <ModalEdit
          v-model="isOpenEdit"
          @edit="onSubmitEdit"
          modal-width="sm:max-w-4xl"
        >
          <TournamentForm :schema="editSchema" :state="editState" />
        </ModalEdit>
        <ModalConfirm v-model="isOpenConfirm" @confirm="mixGroups">
          <p>Möchtest du die Gruppen neu mischen?</p>
        </ModalConfirm>
        <template v-if="hasMatches && !isTournamentLive">
          <UTooltip text="Spiele existieren, Team-Auswahl nicht mehr möglich.">
            <UButton
              v-if="!tournament?.is_live"
              label="Spielteams wählen..."
              icon="i-heroicons-user-group"
              variant="outline"
              color="neutral"
              size="sm"
              :disabled="hasMatches"
            />
          </UTooltip>
        </template>
        <template v-else>
          <UButton
            v-if="!tournament?.is_live"
            label="Spielteams wählen..."
            icon="i-heroicons-user-group"
            variant="outline"
            color="neutral"
            size="sm"
            @click="isOpenTeamSelection = true"
          />
        </template>
        <template v-if="hasMatches && !isTournamentLive">
          <UTooltip text="Spiele existieren, keine Gruppenmischung möglich.">
            <UButton
              v-if="!tournament?.is_live"
              label="Gruppen neu mischen..."
              icon="i-heroicons-table-cells"
              variant="soft"
              color="warning"
              size="sm"
              :disabled="hasMatches as boolean"
              @click="isOpenConfirm = true"
            />
          </UTooltip>
        </template>
        <template v-else>
          <UButton
            v-if="!tournament?.is_live"
            label="Gruppen neu mischen..."
            icon="i-heroicons-table-cells"
            variant="soft"
            color="warning"
            size="sm"
            @click="isOpenConfirm = true"
          />
        </template>
        <UModal
          v-model:open="isOpenTeamSelection"
          :ui="{
            content: 'w-full overflow-hidden sm:max-w-3xl sm:max-h-[90vh]',
          }"
          prevent-close
        >
          <template #content>
            <UCard
              :ui="{
                root: 'flex max-h-[90vh] flex-col divide-y divide-neutral-100 overflow-hidden dark:divide-neutral-800',
                body: 'flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-5',
                header: 'px-4 py-3 sm:px-5',
                footer: 'px-4 py-3 sm:px-5',
              }"
            >
              <template #header>
                <strong>Spielteams auswählen</strong>
              </template>

              <div class="space-y-3">
                <UAlert
                  icon="i-heroicons-information-circle"
                  color="primary"
                  variant="soft"
                  title="Auswahl"
                  :description="`Wähle genau ${maxTeams} Teams aus. Danach werden diese zufällig auf die Gruppen verteilt.`"
                />

                <div
                  class="grid gap-2 rounded-md bg-neutral-100 p-3 text-sm sm:grid-cols-3 dark:bg-neutral-800"
                >
                  <div>
                    <p class="text-neutral-500">Ausgewählt</p>
                    <p class="font-semibold">
                      {{ selectedPlayableCount }}/{{ maxTeams }}
                    </p>
                  </div>
                  <div>
                    <p class="text-neutral-500">Anmeldbar</p>
                    <p class="font-semibold">
                      {{ eligibleParticipants.length }}
                    </p>
                  </div>
                  <div>
                    <p class="text-neutral-500">Warteliste</p>
                    <p class="font-semibold">{{ data?.waiting ?? 0 }}</p>
                  </div>
                </div>

                <div class="flex flex-wrap gap-2">
                  <UButton
                    label="Zufällig auswählen"
                    icon="i-heroicons-sparkles"
                    color="warning"
                    variant="soft"
                    size="sm"
                    :disabled="!canRandomizeSelection"
                    @click="onRandomizeTeamSelection"
                  />
                  <UButton
                    label="Zurücksetzen"
                    icon="i-heroicons-arrow-uturn-left"
                    color="neutral"
                    variant="outline"
                    size="sm"
                    @click="onResetTeamSelection"
                  />
                </div>

                <div
                  class="min-h-0 overflow-y-auto rounded-md border border-neutral-200 dark:border-neutral-800"
                  style="max-height: 26rem"
                >
                  <div
                    v-for="participant in sortedParticipants"
                    :key="participant.id"
                    class="flex items-center justify-between border-b border-neutral-200 p-3 last:border-b-0 dark:border-neutral-800"
                  >
                    <div class="flex min-w-0 items-center gap-3">
                      <UCheckbox
                        :model-value="selectedPlayableIdSet.has(participant.id)"
                        :disabled="
                          participant.registration?.status === 'Abgelehnt' ||
                          (!selectedPlayableIdSet.has(participant.id) &&
                            selectedPlayableCount >= maxTeams)
                        "
                        @update:model-value="
                          toggleTeamSelection(participant.id, Boolean($event))
                        "
                      />
                      <div class="min-w-0">
                        <p class="truncate font-medium">
                          {{ participant.name }}
                        </p>
                        <p
                          class="text-xs text-neutral-500 dark:text-neutral-400"
                        >
                          {{
                            participant.group_id
                              ? "Aktuell im Spielfeld"
                              : "Aktuell Warteliste"
                          }}
                        </p>
                      </div>
                    </div>
                    <UBadge
                      :label="participant.registration?.status ?? 'Unbekannt'"
                      :color="
                        participant.registration?.status === 'Abgeschlossen'
                          ? 'success'
                          : participant.registration?.status === 'Abgesendet'
                            ? 'warning'
                            : participant.registration?.status === 'Abgelehnt'
                              ? 'error'
                              : 'neutral'
                      "
                      variant="subtle"
                    />
                  </div>
                </div>
              </div>

              <template #footer>
                <div class="flex justify-end gap-2">
                  <UButton
                    label="Abbrechen"
                    color="neutral"
                    variant="outline"
                    size="sm"
                    @click="isOpenTeamSelection = false"
                  />
                  <UButton
                    label="Auswahl speichern"
                    icon="i-heroicons-check"
                    color="success"
                    variant="soft"
                    size="sm"
                    :disabled="!selectionHasExactTeamCount"
                    @click="onSaveTeamSelection"
                  />
                </div>
              </template>
            </UCard>
          </template>
        </UModal>
        <UModal
          v-model:open="isOpenRemoveTeam"
          :ui="{
            content: 'w-full overflow-hidden sm:max-w-4xl sm:max-h-[90vh]',
          }"
        >
          <template #content>
            <UCard
              :ui="{
                root: 'flex max-h-[80vh] flex-col divide-y divide-neutral-100 overflow-hidden dark:divide-neutral-800',
                body: 'flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-6',
                header: 'px-4 py-3 sm:px-6',
                footer: 'px-4 py-3 sm:px-6',
              }"
            >
              <template #header>
                <strong>Team entfernen</strong>
              </template>

              <div class="flex min-h-0 flex-1 flex-col space-y-4">
                <div
                  v-if="removableParticipants.length"
                  class="min-h-0 overflow-y-auto rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
                >
                  <div class="grid gap-3 sm:grid-cols-2">
                    <div
                      v-for="participant in removableParticipants"
                      :key="participant.id"
                      class="flex items-start justify-between gap-3 rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
                    >
                      <div class="min-w-0 space-y-2">
                        <div>
                          <p class="truncate font-medium">
                            {{ participant.name }}
                          </p>
                          <p
                            class="text-xs text-neutral-500 dark:text-neutral-400"
                          >
                            {{
                              participant.group_id
                                ? "Aktuell im Spielfeld"
                                : "Aktuell Warteliste"
                            }}
                          </p>
                        </div>
                        <UBadge
                          :label="
                            participant.registration?.status ?? 'Unbekannt'
                          "
                          :color="
                            participant.registration?.status === 'Abgeschlossen'
                              ? 'success'
                              : participant.registration?.status ===
                                  'Abgesendet'
                                ? 'warning'
                                : participant.registration?.status ===
                                    'Abgelehnt'
                                  ? 'error'
                                  : 'neutral'
                          "
                          variant="subtle"
                        />
                      </div>
                      <UButton
                        icon="i-heroicons-trash"
                        color="error"
                        variant="soft"
                        size="sm"
                        square
                        @click="onRemoveTeamClick(participant)"
                      />
                    </div>
                  </div>
                </div>

                <p
                  v-else
                  class="rounded-md border border-dashed border-neutral-200 px-4 py-8 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400"
                >
                  Dieses Turnier hat aktuell keine Teams.
                </p>
              </div>

              <template #footer>
                <div class="flex justify-end">
                  <UButton
                    color="neutral"
                    variant="outline"
                    size="sm"
                    label="Schließen"
                    @click="isOpenRemoveTeam = false"
                  />
                </div>
              </template>
            </UCard>
          </template>
        </UModal>
        <UModal
          v-model:open="isOpenRemoveTeamConfirm"
          :ui="{ content: 'w-full sm:max-w-md' }"
        >
          <template #content>
            <UCard
              :ui="{
                root: 'divide-y divide-neutral-100 dark:divide-neutral-800',
                body: 'space-y-3 px-4 py-5 sm:p-6',
                header: 'px-4 py-3 sm:px-6',
                footer: 'px-4 py-3 sm:px-6',
              }"
            >
              <template #header>
                <strong>Team entfernen</strong>
              </template>

              <p>
                Möchtest du <strong>{{ teamToRemove?.name }}</strong> wirklich
                aus diesem Turnier entfernen?
              </p>
              <UAlert
                icon="i-heroicons-exclamation-triangle"
                color="error"
                variant="soft"
                title="Achtung"
                description="Das Team wird aus allen Gruppen genommen. Die Anmeldung bleibt bestehen."
              />

              <template #footer>
                <div class="flex items-center gap-2">
                  <UButton
                    label="Entfernen"
                    color="error"
                    variant="soft"
                    size="sm"
                    :loading="removingTeamId === teamToRemove?.id"
                    @click="onRemoveTeam"
                  />
                  <UButton
                    label="Abbrechen"
                    color="neutral"
                    variant="outline"
                    size="sm"
                    @click="isOpenRemoveTeamConfirm = false"
                  />
                </div>
              </template>
            </UCard>
          </template>
        </UModal>
        <template v-if="!canGoLive">
          <UTooltip
            text="Genaues Teamfeld + alle Spielteams müssen akzeptiert sein"
          >
            <UButton
              :label="liveLabel"
              icon="i-heroicons-signal"
              color="error"
              variant="soft"
              size="sm"
              :disabled="!canGoLive"
              @click="isOpenLive = true"
            />
          </UTooltip>
        </template>
        <template v-else>
          <UButton
            :label="liveLabel"
            icon="i-heroicons-signal"
            color="error"
            variant="soft"
            size="sm"
            @click="isOpenLive = true"
          />
        </template>
        <ModalLive v-model="isOpenLive" @live="onSetLive" />
        <ModalDelete v-model="isOpenDelete" @delete="deletePlayer()">
          <p>Möchtest du diesen Schüler wirklich vom Team entfernen?</p>
        </ModalDelete>
      </div>
    </ToolbarContainer>
  </BasePageHeader>
  <BasePageContent>
    <div class="flex h-full w-full">
      <div
        class="flex w-1/2 flex-col overflow-auto border-r border-neutral-200 2xl:w-2/5 dark:border-neutral-700"
      >
        <div
          ref="tournamentMetaRef"
          class="grid h-auto w-full gap-3 border-b border-neutral-200 bg-neutral-100 p-3 px-6 dark:border-neutral-800 dark:bg-neutral-900"
          :class="
            isTournamentMetaWide
              ? 'grid-cols-[minmax(0,1fr)_16rem_minmax(0,1fr)]'
              : 'grid-cols-1'
          "
        >
          <div
            v-if="tournament"
            class="w-full rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-none dark:bg-neutral-800"
          >
            <div
              :class="
                isTournamentMetaWide
                  ? 'flex flex-col gap-1'
                  : 'grid grid-cols-2 gap-3'
              "
            >
              <TournamentItemInfoStart
                :tournament
                :truncate="false"
                class="min-w-0"
              />
              <div
                :class="[
                  'flex min-w-0 items-center',
                  !isTournamentMetaWide ? 'justify-end' : '',
                ]"
              >
                <TournamentItemInfoTime :tournament :arrow-right="true" />
              </div>
            </div>
          </div>
          <div
            class="flex flex-col gap-2 rounded-md border border-neutral-200 bg-neutral-50 p-2 px-3 dark:border-none dark:bg-neutral-800"
            :class="isTournamentMetaWide ? 'w-64' : 'w-full'"
            v-if="data"
          >
            <div class="flex justify-between">
              <div class="flex items-center space-x-1">
                <UIcon name="i-heroicons-clipboard-document-list" />
                <p>{{ data?.teams }}/{{ maxTeams }} Spielteams</p>
              </div>
              <div class="flex items-center space-x-1">
                <UIcon name="i-heroicons-users" />
                <p>{{ data?.students }} Schüler</p>
              </div>
            </div>
            <p class="text-xs text-neutral-500 dark:text-neutral-400">
              Insg. angemeldet: {{ data?.registered }} Teams
            </p>
            <USeparator
              :ui="{
                border: 'flex border-neutral-200 dark:border-neutral-700',
              }"
            />
            <TournamentTeamStatus :data="data" class="grow" />
          </div>
          <div
            class="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm dark:border-none dark:bg-neutral-800"
          >
            <div
              class="grid gap-x-4 gap-y-1"
              :class="isTournamentMetaWide ? 'grid-cols-1' : 'grid-cols-2'"
            >
              <div class="flex min-w-0 items-center space-x-1">
                <UIcon name="i-heroicons-ticket" />
                <p>{{ tournament?.sport }}</p>
              </div>
              <div
                :class="[
                  'flex min-w-0 items-center space-x-1',
                  !isTournamentMetaWide ? 'justify-end' : '',
                ]"
              >
                <UIcon name="i-heroicons-user-group" />
                <p>{{ tournament?.groups }} Gruppen</p>
              </div>
              <div class="flex min-w-0 items-center space-x-1">
                <UIcon name="i-heroicons-identification" />
                <p>{{ tournament?.group_teams }} Teams/Gruppe</p>
              </div>
              <div
                :class="[
                  'flex min-w-0 items-center space-x-1',
                  !isTournamentMetaWide ? 'justify-end' : '',
                ]"
              >
                <UIcon name="i-heroicons-clock" />
                <p>{{ tournament?.knockout_interval }}min Knockout</p>
              </div>
            </div>
          </div>
        </div>
        <div class="flex h-full w-full flex-col gap-3 p-6">
          <div class="flex flex-col gap-2">
            <strong>Ablauf</strong>
            <div class="rounded-lg bg-neutral-100 p-3 dark:bg-neutral-800">
              <UBreadcrumb
                :items="timeline"
                separator-icon="i-heroicons-arrow-long-right"
                :ui="{
                  root: 'w-full',
                  list: 'flex w-full flex-wrap items-center gap-1.5',
                }"
              >
                <template #item="{ item }">
                  <UBadge
                    color="neutral"
                    variant="outline"
                    class="truncate rounded-full"
                  >
                    {{ item.label }}
                  </UBadge>
                </template>
              </UBreadcrumb>
            </div>
          </div>

          <div class="flex items-center justify-between gap-3">
            <strong>Gruppen</strong>
            <UButton
              label="Team entfernen..."
              icon="i-heroicons-user-minus"
              variant="outline"
              color="neutral"
              size="sm"
              :disabled="!participants?.length"
              @click="isOpenRemoveTeam = true"
            />
          </div>
          <div
            class="shrink-0 overflow-hidden rounded-md border border-neutral-300 dark:border-neutral-700"
          >
            <table class="w-full table-auto border-separate border-spacing-0">
              <thead>
                <tr
                  class="bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                >
                  <th class="px-4 py-2 first:rounded-tl-sm last:rounded-tr-sm">
                    Gruppe
                  </th>
                  <th class="px-4 py-2 first:rounded-tl-sm last:rounded-tr-sm">
                    Teams
                  </th>
                </tr>
              </thead>
              <tbody v-if="groups">
                <tr
                  v-for="(group, groupIndex) in groups"
                  :key="groupIndex"
                  :class="[
                    groupIndex === groups?.length - 1
                      ? 'last:rounded-br-md last:rounded-bl-md'
                      : '',
                  ]"
                >
                  <td
                    class="border-t border-r border-neutral-300 px-4 py-2 text-center font-medium dark:border-neutral-700"
                  >
                    {{ group.name }}
                  </td>
                  <td
                    class="border-t border-neutral-300 px-4 py-2 dark:border-neutral-700"
                  >
                    <div class="flex flex-wrap gap-2">
                      <UBadge
                        v-for="(team, teamIndex) in group.teams"
                        :key="teamIndex"
                        :color="
                          team.registration?.status === 'Abgesendet'
                            ? 'warning'
                            : 'success'
                        "
                        class="rounded-full"
                        variant="subtle"
                        :label="team.name"
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <UAlert
              v-if="maxTeams !== data?.teams"
              icon="i-heroicons-exclamation-triangle"
              color="error"
              variant="soft"
              title="Gruppen unvollständig"
              :description="groupAlert"
            />
          </div>
          <div>
            <UAlert
              v-if="waitingTeamsAlert"
              icon="i-heroicons-users"
              color="warning"
              variant="soft"
              title="Warteliste"
              :description="waitingTeamsAlert"
            />
          </div>
          <div class="flex w-full justify-between">
            <strong>Teams</strong>
            <SearchInput v-model="search" placeholder="Suche nach Teams..." />
          </div>
          <div class="flex flex-col gap-3 pb-24">
            <template v-if="filteredTeams?.length">
              <div
                v-for="team in filteredTeams"
                class="flex flex-col gap-1 rounded-md border border-neutral-300 p-3 dark:border-neutral-700"
              >
                <strong>{{ team.name }}</strong>
                <template v-if="team.player.length > 0">
                  <div
                    v-for="player in team.player"
                    class="flex gap-1 rounded-md bg-neutral-100 p-3 pr-3 dark:bg-neutral-800"
                  >
                    <UFormField label="Vorname">
                      <UInput v-model="player.first_name" disabled />
                    </UFormField>
                    <UFormField label="Nachname">
                      <UInput v-model="player.last_name" disabled />
                    </UFormField>
                    <UFormField label="Klasse">
                      <UInput v-model="player.class" class="w-20" disabled />
                    </UFormField>
                    <UFormField label="Notiz">
                      <UInput v-model="player.note" />
                    </UFormField>
                    <div class="flex h-full gap-1">
                      <div class="self-end">
                        <UButton
                          icon="i-heroicons-check"
                          color="neutral"
                          variant="outline"
                          square
                          @click="editPlayerNote(player.id, player.note)"
                        />
                      </div>
                      <div class="self-end" v-if="!isTournamentLive">
                        <UButton
                          icon="i-heroicons-x-mark"
                          color="error"
                          variant="soft"
                          square
                          @click="onDeleteClick(player.id)"
                        />
                      </div>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <UAlert
                    icon="i-heroicons-exclamation-triangle"
                    color="error"
                    variant="soft"
                    title="Keine Spieler"
                    description="Dieses Team hat keine Spieler!"
                  />
                </template>
              </div>
            </template>
            <template v-else>
              <UAlert
                icon="i-heroicons-information-circle"
                color="primary"
                variant="soft"
                title="Keine Teams"
                description="Dieses Turnier hat noch keine Teams. Wurden Anmeldungen schon erstellt und verschickt?"
              />
            </template>
          </div>
        </div>
      </div>
      <div class="w-1/2 2xl:w-3/5">
        <ClientOnly>
          <LiveFlow ref="liveFlow" :tournament-id="tournament?.id as string" />
          <template #fallback>
            <div
              class="flex h-full w-full items-center justify-center bg-neutral-100 dark:bg-neutral-800"
            >
              <UIcon name="i-svg-spinners-180-ring-with-bg" size="24" />
            </div>
          </template>
        </ClientOnly>
      </div>
    </div>
  </BasePageContent>
</template>
