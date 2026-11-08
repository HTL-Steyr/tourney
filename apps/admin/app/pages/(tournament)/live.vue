<script setup lang="ts">
import { z } from "zod"
import type {
  Database,
  Match,
  ParsedJsonTournament,
  Standing,
} from "@tourney/types"

type LiveGroup = {
  id: string
  name: string
  teams: Database["public"]["Tables"]["team"]["Row"][]
}

type GroupStanding = Database["public"]["Views"]["group_standings"]["Row"]
type GroupStandingsSection = {
  id: string
  name: string
  standings: Standing[]
}
type TournamentOption = {
  label: string
  value: string
}

const title = ref<string>("Live")
useHead({
  title: () => title.value,
})

const { tournaments, fetchTournaments } = useLiveTournaments()
const { showGroupedStandings, flowPanelRatio } = useLiveSettings()
const { clearPageContext, setPageContext } = useAiAssistantPageContext()
const selected = useState<string>("selectedTournament", () => "")
await fetchTournaments()
const tournamentOptions = computed<TournamentOption[]>(() =>
  tournaments.value.map((item) => ({
    label: item.name,
    value: item.id,
  })),
)
const hasTournaments = computed(() => tournamentOptions.value.length > 0)

watch(
  tournamentOptions,
  (options: TournamentOption[]) => {
    if (!options.length) {
      selected.value = ""
      return
    }

    if (
      !options.some(
        (option: TournamentOption) => option.value === selected.value,
      )
    ) {
      selected.value = options[0]?.value ?? ""
    }
  },
  { immediate: true },
)

const selectedTournamentId = computed(() => selected.value || null)

const { data: tournament, refresh: tournamentRefresh } =
  await useAsyncData<ParsedJsonTournament | null>(
    "admin-live-tournament",
    async () => {
      if (!selectedTournamentId.value) {
        return null
      }

      return await $fetch(`/api/tournaments/${selectedTournamentId.value}`)
    },
    {
      default: () => null,
      watch: [selectedTournamentId],
    },
  )

const tournamentId = computed(() => tournament.value?.id ?? null)

const { data: matches, refresh: matchRefresh } = await useAsyncData<Match[]>(
  "admin-live-matches",
  async () => {
    if (!tournamentId.value) {
      return []
    }

    return await $fetch(`/api/views/matches/${tournamentId.value}`)
  },
  {
    default: () => [],
    watch: [tournamentId],
  },
)

const isOpenInfo = ref<boolean>(false)
const { data: groups, refresh: groupsRefresh } = await useAsyncData<
  LiveGroup[]
>(
  "admin-live-groups",
  async () => {
    if (!tournamentId.value) {
      return []
    }

    return await $fetch(`/api/tournaments/${tournamentId.value}/groups`)
  },
  {
    default: () => [],
    watch: [tournamentId],
  },
)

const groupIds = computed(() => groups.value.map((group) => group.id).join(","))

function normalizeGroupStanding(standing: GroupStanding): Standing {
  return {
    draws: standing.draws ?? 0,
    goal_difference: standing.goal_difference ?? 0,
    goals_conceded: standing.goals_conceded ?? 0,
    goals_scored: standing.goals_scored ?? 0,
    losses: standing.losses ?? 0,
    points: standing.points ?? 0,
    team_id: standing.team_id ?? "",
    team_name: standing.team_name ?? "",
    tournament_id: standing.tournament_id ?? tournamentId.value ?? "",
    wins: standing.wins ?? 0,
  }
}

const { data: fullStandings, refresh: fullStandingsRefresh } =
  await useAsyncData<Standing[]>(
    "admin-live-standings",
    async () => {
      if (!tournamentId.value) {
        return []
      }

      return await $fetch(`/api/views/standings/${tournamentId.value}`)
    },
    {
      default: () => [],
      watch: [tournamentId],
    },
  )

const { data: groupedStandings, refresh: groupedStandingsRefresh } =
  await useAsyncData<GroupStandingsSection[]>(
    "admin-live-grouped-standings",
    async () => {
      if (!groups.value.length) {
        return []
      }

      return await Promise.all(
        groups.value.map(async (group) => {
          const standings = await $fetch<GroupStanding[]>(
            `/api/views/standings/group/${group.id}`,
          )

          return {
            id: group.id,
            name: group.name,
            standings: (standings ?? []).map(normalizeGroupStanding),
          }
        }),
      )
    },
    {
      default: () => [],
      watch: [groupIds],
    },
  )

const refreshStandings = async () => {
  await fullStandingsRefresh()
  await groupedStandingsRefresh()
}

const { data: liveMatches, refresh: refreshLiveMatches } = await useAsyncData<
  Match[]
>(
  "admin-live-live-matches",
  async () => {
    if (!tournamentId.value) {
      return []
    }

    return await $fetch(`/api/views/matches/live/${tournamentId.value}`)
  },
  {
    default: () => [],
    watch: [tournamentId],
  },
)

const refresh = async () => {
  await fetchTournaments()
  await tournamentRefresh()
  await groupsRefresh()
  await matchRefresh()
  await refreshStandings()
  await refreshLiveMatches()
  await refreshResults()
  await refreshHistory()
  displaySuccessNotification(
    "Daten aktualisiert",
    "Die Daten wurden aktualisiert.",
  )
}

const refreshMatches = async () => {
  await matchRefresh()
  await refreshLiveMatches()
  await refreshStandings()
  await refreshResults()
  await refreshHistory()
}

watchEffect(() => {
  setPageContext({
    live: {
      groups: groups.value.length,
      hasSelectedTournament: Boolean(tournament.value),
      liveMatches: liveMatches.value.length,
      liveTournamentCount: tournaments.value.length,
      matches: matches.value.length,
      selectedTournamentId: tournament.value?.id ?? null,
      selectedTournamentIsLive: tournament.value?.is_live ?? null,
      selectedTournamentName: tournament.value?.name ?? null,
      selectedTournamentSport: tournament.value?.sport ?? null,
      standingsMode: showGroupedStandings.value ? "grouped" : "overall",
    },
  })
})

onBeforeUnmount(() => {
  clearPageContext()
})

const schema = z.object({
  interval: z.number().int().positive(),
  start_time: z.string(),
})

const state = reactive({
  interval: 12,
  start_time: "",
})

const resetCreateState = () => {
  state.interval = 12
  state.start_time = tournament.value?.from ?? ""
}

watch(
  () => tournament.value?.from,
  (startTime) => {
    state.start_time = startTime ?? ""
  },
  { immediate: true },
)

const supabase = useDatabaseClient()
const isOpenCreate = ref<boolean>(false)

watch(isOpenCreate, (isOpen) => {
  if (isOpen) return

  resetCreateState()
})

const generateGroupMatches = async () => {
  try {
    schema.parse(state)
    const { error } = await supabase.rpc("generate_group_stage_matches", {
      p_interval_minutes: state.interval,
      p_start_time: state.start_time,
      p_tournament_id: tournament.value?.id!,
    })
    if (error) {
      displayFailureNotification(
        "Fehler",
        error.message || "Ein Fehler ist aufgetreten.",
      )
      console.error(error)
      return
    }
    await refreshMatches()
    await groupsRefresh()
    displaySuccessNotification(
      "Gruppenphase gestartet",
      "Die Gruppenphase wurde erfolgreich gestartet.",
    )
    isOpenCreate.value = false
  } catch (error) {
    const err = error as Error
    displayFailureNotification("Fehler", err.message)
    throw createError({
      statusMessage: err.message,
    })
  }
}

const isOpenWinners = ref<boolean>(false)
const { data: results, refresh: refreshResults } = await useAsyncData(
  "admin-live-results",
  async () => {
    if (!tournamentId.value) {
      return []
    }

    return await $fetch(`/api/tournament_results/${tournamentId.value}`)
  },
  {
    default: () => [],
    watch: [tournamentId],
  },
)

const getTeamName = (index: number) =>
  computed(() => {
    if (!results.value) return
    // @ts-ignore
    return results.value?.[index]?.team?.name
  })

const first = getTeamName(0)
const second = getTeamName(1)
const third = getTeamName(2)
const fourth = getTeamName(3)

const tabsMatches = [
  {
    slot: "matches",
    key: "matches",
    label: "Matches",
    icon: "i-heroicons-bars-4",
  },
  {
    slot: "history",
    key: "history",
    label: "Historie",
    icon: "i-heroicons-archive-box",
  },
]

const tabTable = [
  {
    label: "Platzierungen",
    icon: "i-heroicons-table-cells",
  },
]

const tabLive = [
  {
    label: "Live",
    icon: "i-heroicons-signal",
  },
]

const LIVE_FLOW_HANDLE_HEIGHT = 16
const LIVE_FLOW_DEFAULT_RATIO = 0.34
const LIVE_FLOW_MIN_RATIO = 0.2
const LIVE_FLOW_MAX_RATIO = 0.75

const clampLiveFlowRatio = (value: number) =>
  Math.min(LIVE_FLOW_MAX_RATIO, Math.max(LIVE_FLOW_MIN_RATIO, value))

const livePageLayoutRef = ref<HTMLElement | null>(null)
const { height: livePageLayoutHeight } = useElementSize(livePageLayoutRef)
const isResizingLiveFlow = ref(false)

const liveFlowPanelRatio = computed(() =>
  clampLiveFlowRatio(flowPanelRatio.value),
)
const livePageGridTemplateRows = computed(() => {
  return `calc((100% - ${LIVE_FLOW_HANDLE_HEIGHT}px) * ${liveFlowPanelRatio.value}) ${LIVE_FLOW_HANDLE_HEIGHT}px minmax(0, 1fr)`
})

const setLiveFlowCursor = (isActive: boolean) => {
  if (!import.meta.client) return

  document.body.style.userSelect = isActive ? "none" : ""
  document.body.style.cursor = isActive ? "row-resize" : ""
}

const setLiveFlowPanelRatio = (value: number) => {
  flowPanelRatio.value = clampLiveFlowRatio(value)
}

const adjustLiveFlowPanelRatio = (delta: number) => {
  setLiveFlowPanelRatio(liveFlowPanelRatio.value + delta)
}

const updateLiveFlowPanelRatio = (event: PointerEvent) => {
  if (
    !isResizingLiveFlow.value ||
    !livePageLayoutRef.value ||
    livePageLayoutHeight.value <= LIVE_FLOW_HANDLE_HEIGHT
  ) {
    return
  }

  const { top } = livePageLayoutRef.value.getBoundingClientRect()
  const availableHeight = livePageLayoutHeight.value - LIVE_FLOW_HANDLE_HEIGHT
  const offsetY = event.clientY - top

  setLiveFlowPanelRatio(offsetY / availableHeight)
}

const startLiveFlowResize = (event: PointerEvent) => {
  event.preventDefault()
  isResizingLiveFlow.value = true
  setLiveFlowCursor(true)
  updateLiveFlowPanelRatio(event)
}

const stopLiveFlowResize = () => {
  if (!isResizingLiveFlow.value) return

  isResizingLiveFlow.value = false
  setLiveFlowCursor(false)
}

const resetLiveFlowPanelRatio = () => {
  setLiveFlowPanelRatio(LIVE_FLOW_DEFAULT_RATIO)
}

const { data: history, refresh: refreshHistory } = await useAsyncData(
  "admin-live-history",
  async () => {
    if (!tournamentId.value) {
      return []
    }

    return await $fetch(`/api/results/${tournamentId.value}`)
  },
  {
    default: () => [],
    watch: [tournamentId],
  },
)

onMounted(() => {
  window.addEventListener("pointermove", updateLiveFlowPanelRatio)
  window.addEventListener("pointerup", stopLiveFlowResize)
  window.addEventListener("pointercancel", stopLiveFlowResize)
})

onBeforeUnmount(() => {
  stopLiveFlowResize()
  window.removeEventListener("pointermove", updateLiveFlowPanelRatio)
  window.removeEventListener("pointerup", stopLiveFlowResize)
  window.removeEventListener("pointercancel", stopLiveFlowResize)
})
</script>

<template>
  <BasePageHeader :title="title">
    <ToolbarContainer>
      <UButton
        size="sm"
        variant="soft"
        color="warning"
        label="Gewinner anzeigen"
        icon="i-heroicons-trophy"
        v-if="tournament && results?.length"
        @click="isOpenWinners = true"
      />
      <ModalInfo v-model="isOpenWinners">
        <TournamentPlaces
          v-if="results?.length"
          :first="first!"
          :second="second!"
          :third="third!"
          :fourth="fourth!"
        />
      </ModalInfo>
      <UButton
        size="sm"
        variant="soft"
        color="primary"
        label="Gruppenphase starten..."
        @click="isOpenCreate = true"
        v-if="
          tournament &&
          !matches?.length &&
          !liveMatches?.length &&
          !results?.length
        "
      />
      <ModalCreate
        title="Gruppenphase starten"
        v-model="isOpenCreate"
        @create="generateGroupMatches"
        modal-width="sm:max-w-sm"
      >
        <UForm :schema="schema" :state="state" class="space-y-4 pt-2">
          <UFormField
            label="Matchlänge"
            name="interval"
            description="Matchlänge in Minuten, nach dieser Zeit folgt das nächste Match."
            required
          >
            <UInput v-model="state.interval" type="number" />
          </UFormField>

          <UFormField
            label="Startzeit"
            name="start_time"
            description="Startzeit der Gruppenphase. Standardmäßig die Turnierzeit."
            required
          >
            <UInput v-model="state.start_time" type="time" :step="60" />
          </UFormField>
        </UForm>
      </ModalCreate>
      <UButton
        icon="i-heroicons-arrow-path"
        color="neutral"
        variant="outline"
        size="sm"
        square
        :disabled="!hasTournaments"
        @click="refresh"
      />
      <USelect
        :items="tournamentOptions"
        v-model="selected"
        placeholder="Kein Live-Turnier verfügbar"
        size="sm"
        class="min-w-64"
        :disabled="!hasTournaments"
      />
      <UButton
        @click="isOpenInfo = true"
        square
        color="neutral"
        variant="outline"
        icon="i-ic-round-question-mark"
        size="sm"
      />
      <ModalInfo v-model="isOpenInfo">
        <p>Punktetabelle Abkürzungen</p>
        <ul class="list-disc">
          <li class="ml-6">Pkt. = Punkte</li>
          <li class="ml-6">S = Siege</li>
          <li class="ml-6">U = Unentschieden</li>
          <li class="ml-6">N = Niederlagen</li>
          <li class="ml-6">T = Tore geschossen : Tore bekommen</li>
          <li class="ml-6">D = Tore Differenz</li>
        </ul>
      </ModalInfo>
    </ToolbarContainer>
  </BasePageHeader>
  <BasePageContent>
    <template v-if="tournament">
      <div
        ref="livePageLayoutRef"
        class="grid h-full w-full overflow-hidden"
        :style="{ gridTemplateRows: livePageGridTemplateRows }"
      >
        <div class="min-h-0">
          <ClientOnly>
            <LiveFlow :tournament-id="tournament.id" />
            <template #fallback>
              <div
                class="flex h-full w-full items-center justify-center bg-neutral-100 dark:bg-neutral-800"
              >
                <UIcon name="i-svg-spinners-180-ring-with-bg" size="24" />
              </div>
            </template>
          </ClientOnly>
        </div>
        <button
          type="button"
          class="group focus-visible:ring-primary-500 flex cursor-row-resize items-center justify-center border-y border-neutral-200 bg-neutral-50/80 text-neutral-400 transition hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 dark:border-neutral-700 dark:bg-neutral-900/80 dark:text-neutral-500 dark:hover:bg-neutral-800"
          aria-label="LiveFlow Höhe anpassen"
          @pointerdown="startLiveFlowResize"
          @dblclick="resetLiveFlowPanelRatio"
          @keydown.up.prevent="adjustLiveFlowPanelRatio(-0.05)"
          @keydown.down.prevent="adjustLiveFlowPanelRatio(0.05)"
        >
          <span
            class="h-1 w-14 rounded-full bg-current opacity-70 transition group-hover:opacity-100"
          />
        </button>
        <div
          class="flex min-h-0 justify-between gap-6 overflow-hidden p-6 pt-3"
        >
          <div class="flex w-1/3 flex-col gap-0.5">
            <UTabs
              :items="tabTable"
              variant="link"
              :ui="{ list: 'h-9', trigger: 'h-7' }"
            />
            <div
              class="mt-2 flex min-h-0 flex-1 flex-col gap-3 overflow-auto pb-12"
            >
              <template v-if="showGroupedStandings">
                <div
                  v-for="group in groupedStandings"
                  :key="group.id"
                  class="flex items-stretch gap-2"
                >
                  <UBadge
                    color="neutral"
                    variant="subtle"
                    class="flex w-8 shrink-0 items-center justify-center rounded-md px-1 py-3 text-center text-xs font-medium tracking-wide"
                  >
                    <span
                      class="inline-block rotate-180 [writing-mode:vertical-rl]"
                    >
                      {{ group.name }}
                    </span>
                  </UBadge>
                  <div class="min-w-0 flex-1">
                    <StandingsTable :standings="group.standings" compact />
                  </div>
                </div>
              </template>
              <template v-else>
                <StandingsTable :standings="fullStandings" compact />
              </template>
            </div>
          </div>
          <div class="flex w-1/3 flex-col gap-0.5">
            <UTabs
              :items="tabsMatches"
              variant="link"
              :ui="{
                list: 'relative mb-0.5 h-9',
                trigger: 'h-7',
              }"
            >
              <template #matches>
                <!-- TODO: fix height constraint, adjust padding -->
                <div
                  class="flex h-[500px] flex-col gap-1.5 overflow-auto pt-2 pb-48"
                >
                  <MatchItemRow
                    v-for="(match, index) in matches"
                    :match
                    :next="index < 2"
                    :key="match.match_id!"
                    @live="refreshMatches"
                  />
                </div>
              </template>
              <template #history>
                <!-- TODO: fix height constraint, adjust padding -->
                <div
                  class="flex h-[500px] flex-col gap-1.5 overflow-auto pt-2 pb-48"
                >
                  <!-- @vue-ignore -->
                  <ResultItem
                    v-for="result in history"
                    :match="result.match as Match"
                    :id="result.id"
                    :score1="result.team1_score"
                    :score2="result.team2_score"
                    :winner="result.winner_id"
                    @refresh="refreshMatches"
                  />
                </div>
              </template>
            </UTabs>
          </div>
          <div class="flex w-1/3 flex-col gap-0.5">
            <UTabs
              :items="tabLive"
              variant="link"
              :ui="{ list: 'h-9', trigger: 'h-7' }"
            />
            <div class="flex h-full flex-col gap-1.5 overflow-auto pt-2 pb-12">
              <MatchItemLive
                v-for="match in liveMatches"
                :key="match.match_id!"
                :match
                @finish="refreshMatches"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="flex h-full items-center justify-center p-6">
        <EmptyState
          title="Keine Live-Turniere"
          description="Sobald ein Turnier live geschaltet ist, kannst du es hier auswählen und verwalten."
        />
      </div>
    </template>
  </BasePageContent>
</template>
