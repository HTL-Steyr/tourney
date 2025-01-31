<script setup lang="ts">
import type { ParsedJsonTournament } from "~/types/prizes"
import {
  FOOTBALL_MAX_TEAMS,
  VOLLEYBALL_BASKETBALL_MAX_TEAMS,
} from "~/misc/constants"
import { z } from "zod"
import type { Enums } from "~/types/database.types"
import type { Group } from "~/types/group"

const title = ref<string>("Turniere")
useHead({
  title: () => title.value,
})
const route = useRoute()
const { data: tournament, refresh } =
  await useFetch<ParsedJsonTournament | null>(
    `/api/tournaments/${route.params.id}`,
  )
if (!tournament.value) {
  throw createError({
    statusCode: 404,
    message: "Turnier nicht gefunden",
  })
}
const tournamentName = ref<string>(tournament.value?.name ?? "Turnier")
const { data } = await useFetch(`/api/tournaments/${tournament.value.id}/teams`)

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
  if (!groups.value || !data.value) return
  return `Es fehlen noch ${maxTeams.value - data.value.teams} Teams.`
})

const links = [
  {
    label: "Turniere",
    to: "/tournaments",
  },
  {
    label: tournamentName.value,
    to: `/tournaments/${route.params.id}`,
  },
]

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
    await refresh()
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

const refreshTournament = () => {
  refresh()
  displaySuccessNotification("Aktualisiert", "Die Daten wurde aktualisiert.")
}

const mixGroups = async () => {
  try {
    await $fetch(`/api/tournaments/${tournament.value?.id}/mix`)
    await refreshGroups()
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
  { label: "Kreuzspiele" },
  { label: "Halbfinale" },
  { label: "Kleines Finale" },
  { label: "Finale" },
]

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
  year: z.number(),
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
})

const editState = reactive({
  name: tournament.value.name,
  rules: tournament.value.rules,
  start_date: tournament.value.start_date,
  from: tournament.value.from,
  to: tournament.value.to,
  year: tournament.value.year,
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
})

const isOpenEdit = ref<boolean>(false)
const onSubmitEdit = async () => {
  try {
    await $fetch("/api/tournaments/edit", {
      method: "PUT",
      body: {
        id: tournament.value?.id,
        tournament: editState,
      },
    })
    isOpenEdit.value = false
    await refresh()
    displaySuccessNotification(
      "Turnier bearbeitet",
      "Das Turnier wurde erfolgreich bearbeitet.",
    )
  } catch (err) {
    console.error(err)
    displayFailureNotification(
      "Fehler beim Bearbeiten",
      "Das Turnier konnte nicht bearbeitet werden.",
    )
  }
}
</script>

<template>
  <BasePageHeader class="pl-0">
    <ToolbarContainer class="flex w-full items-center justify-between">
      <div class="flex items-center gap-2">
        <UBreadcrumb :links="links" />
        <TournamentLiveDisplay v-if="tournament" :is-live="isTournamentLive" />
      </div>
      <div class="flex items-center space-x-2">
        <UButton
          icon="i-heroicons-arrow-path"
          color="gray"
          size="xs"
          square
          @click="refreshTournament"
        />
        <UButton
          v-if="!isTournamentLive"
          icon="i-heroicons-pencil-square"
          label="Bearbeiten"
          color="gray"
          size="xs"
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
        <UButton
          v-if="!tournament?.is_live"
          label="Gruppen neu mischen..."
          icon="i-heroicons-table-cells"
          variant="soft"
          color="yellow"
          size="xs"
          @click="isOpenConfirm = true"
        />
        <UButton
          :label="liveLabel"
          icon="i-heroicons-signal"
          color="red"
          variant="soft"
          size="xs"
          @click="isOpenLive = true"
        />
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
        class="flex w-1/2 flex-col overflow-auto border-r border-gray-200 dark:border-gray-700"
      >
        <div
          class="flex h-auto w-full gap-3 border-b border-gray-200 bg-gray-100 p-3 px-6 dark:border-gray-800 dark:bg-gray-900"
        >
          <div
            v-if="tournament"
            class="flex w-auto grow items-center gap-1 rounded-md bg-gray-50 p-3 pr-3 dark:bg-gray-800"
          >
            <div class="flex flex-col">
              <TournamentItemInfoStart
                :tournament
                :truncate="false"
                class="pr-3"
              />
              <div class="flex items-center">
                <TournamentItemInfoTime :tournament :arrow-right="true" />
              </div>
            </div>
          </div>
          <div
            class="flex w-64 flex-col gap-2 rounded-md bg-gray-50 p-2 px-3 dark:bg-gray-800"
            v-if="data"
          >
            <div class="flex justify-between">
              <div class="flex items-center space-x-1">
                <UIcon name="i-heroicons-clipboard-document-list" />
                <p>{{ data?.teams }}/{{ maxTeams }} Teams</p>
              </div>
              <div class="flex items-center space-x-1">
                <UIcon name="i-heroicons-users" />
                <p>{{ data?.students }} Schüler</p>
              </div>
            </div>
            <UDivider
              :ui="{
                border: {
                  base: 'flex border-gray-200 dark:border-gray-700',
                },
              }"
            />
            <TournamentTeamStatus :data="data" class="grow" />
          </div>
          <div class="rounded-md bg-gray-50 p-3 pr-3 text-sm dark:bg-gray-800">
            <div class="flex items-center space-x-1">
              <UIcon name="i-heroicons-ticket" />
              <p>{{ tournament?.sport }}</p>
            </div>
            <div class="flex items-center space-x-1">
              <UIcon name="i-heroicons-user-group" />
              <p>{{ tournament?.groups }} Gruppen</p>
            </div>
            <div class="flex items-center space-x-1">
              <UIcon name="i-heroicons-identification" />
              <p>{{ tournament?.group_teams }} Teams pro Gruppe</p>
            </div>
          </div>
        </div>
        <div class="flex h-full w-full flex-col gap-3 p-6">
          <strong>Ablauf</strong>
          <UBreadcrumb :links="timeline" divider="i-heroicons-arrow-long-right">
            <template #default="{ link }">
              <UBadge color="gray" class="truncate rounded-full">
                {{ link.label }}
              </UBadge>
            </template>
          </UBreadcrumb>
          <strong>Gruppen</strong>
          <div
            class="shrink-0 overflow-hidden rounded-md border border-gray-300 dark:border-gray-700"
          >
            <table class="w-full table-auto border-separate border-spacing-0">
              <thead>
                <tr
                  class="bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
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
                      ? 'last:rounded-bl-md last:rounded-br-md'
                      : '',
                  ]"
                >
                  <td
                    class="border-r border-t border-gray-300 px-4 py-2 text-center font-medium dark:border-gray-700"
                  >
                    {{ group.name }}
                  </td>
                  <td
                    class="border-t border-gray-300 px-4 py-2 dark:border-gray-700"
                  >
                    <div class="flex flex-wrap gap-2">
                      <UBadge
                        v-for="(team, teamIndex) in group.teams"
                        :key="teamIndex"
                        :color="
                          team.registration?.status === 'Abgesendet'
                            ? 'orange'
                            : 'green'
                        "
                        :ui="{ rounded: 'rounded-full' }"
                        variant="subtle"
                        size="xs"
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
              color="red"
              variant="soft"
              title="Gruppen unvollständig"
              :description="groupAlert"
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
                class="flex flex-col gap-1 rounded-md border border-gray-300 p-3 dark:border-gray-700"
              >
                <strong>{{ team.name }}</strong>
                <template v-if="team.player.length > 0">
                  <div
                    v-for="player in team.player"
                    class="flex gap-1 rounded-md bg-gray-100 p-3 pr-3 dark:bg-gray-800"
                  >
                    <UFormGroup label="Vorname">
                      <UInput v-model="player.first_name" disabled />
                    </UFormGroup>
                    <UFormGroup label="Nachname">
                      <UInput v-model="player.last_name" disabled />
                    </UFormGroup>
                    <UFormGroup label="Klasse">
                      <UInput v-model="player.class" class="w-20" disabled />
                    </UFormGroup>
                    <UFormGroup label="Notiz">
                      <UInput v-model="player.note" />
                    </UFormGroup>
                    <div class="flex h-full gap-1">
                      <div class="self-end">
                        <UButton
                          icon="i-heroicons-pencil"
                          color="gray"
                          size="sm"
                          square
                          @click="editPlayerNote(player.id, player.note)"
                        />
                      </div>
                      <div class="self-end" v-if="!isTournamentLive">
                        <UButton
                          icon="i-heroicons-x-mark"
                          color="red"
                          variant="soft"
                          size="sm"
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
                    color="red"
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
      <div class="w-1/2">
        <ClientOnly>
          <TournamentFlow
            :groups="flowGroups"
            :key="JSON.stringify(flowGroups)"
          />
          <template #fallback>
            <div
              class="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800"
            >
              <UIcon name="i-svg-spinners-180-ring-with-bg" size="24" />
            </div>
          </template>
        </ClientOnly>
      </div>
    </div>
  </BasePageContent>
</template>
