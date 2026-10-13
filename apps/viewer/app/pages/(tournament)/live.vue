<script setup lang="ts">
import type {
  Database,
  Match,
  ParsedJsonTournament,
  Standing,
} from "@tourney/types"

type TournamentGroup = Database["public"]["Tables"]["group"]["Row"]
type GroupStanding = Database["public"]["Views"]["group_standings"]["Row"]
type GroupStandingsSection = {
  id: string
  name: string
  standings: Standing[]
}
type HistoryItem = {
  id: string
  match: Match
  team1_score: number
  team2_score: number
  winner_id: string | null
}
type TournamentResult = {
  team?: {
    name?: string | null
  } | null
}
type TournamentOption = {
  label: string
  value: string
}

const { tournaments, fetchTournaments } = useLiveTournaments()
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

const { data: tournament, refresh: tournamentRefresh } =
  await useFetch<ParsedJsonTournament | null>(
    () => `/api/tournaments/${selected.value}`,
  )
if (!tournament.value) {
  throw createError({
    statusCode: 404,
    message: "Turnier nicht gefunden",
  })
}

const tournamentId = computed(() => tournament.value?.id ?? "")

const { data: matches, refresh: matchRefresh } = await useAsyncData<Match[]>(
  "viewer-live-matches",
  async () => {
    if (!tournamentId.value) {
      return []
    }

    return await $fetch<Match[]>(
      `/api/views/matches/${tournamentId.value}` as string,
    )
  },
  {
    default: () => [],
    watch: [tournamentId],
  },
)

const { data: groups, refresh: groupsRefresh } = await useAsyncData<
  TournamentGroup[]
>(
  "viewer-live-groups",
  async () => {
    if (!tournamentId.value) {
      return []
    }

    return await $fetch<TournamentGroup[]>(
      `/api/groups/${tournamentId.value}` as string,
    )
  },
  {
    default: () => [],
    watch: [tournamentId],
  },
)

const { data: fullStandings, refresh: fullStandingsRefresh } =
  await useAsyncData<Standing[]>(
    "viewer-live-standings",
    async () => {
      if (!tournamentId.value) {
        return []
      }

      return await $fetch<Standing[]>(
        `/api/views/standings/${tournamentId.value}` as string,
      )
    },
    {
      default: () => [],
      watch: [tournamentId],
    },
  )

const groupIds = computed(
  () => groups.value?.map((group) => group.id).join(",") ?? "",
)

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
    tournament_id: standing.tournament_id ?? tournamentId.value,
    wins: standing.wins ?? 0,
  }
}

const { data: groupedStandings, refresh: groupedStandingsRefresh } =
  await useAsyncData<GroupStandingsSection[]>(
    "viewer-live-grouped-standings",
    async () => {
      if (!groups.value?.length) {
        return []
      }

      return await Promise.all(
        groups.value.map(async (group) => {
          const standings = await $fetch<GroupStanding[]>(
            `/api/views/standings/group/${group.id}` as string,
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

const { data: liveMatches, refresh: refreshLiveMatches } = await useAsyncData<
  Match[]
>(
  "viewer-live-live-matches",
  async () => {
    if (!tournamentId.value) {
      return []
    }

    return await $fetch<Match[]>(
      `/api/views/matches/live/${tournamentId.value}` as string,
    )
  },
  {
    default: () => [],
    watch: [tournamentId],
  },
)

const refresh = async () => {
  await tournamentRefresh()
  await groupsRefresh()
  await matchRefresh()
  await refreshLiveMatches()
  await fullStandingsRefresh()
  await groupedStandingsRefresh()
  await refreshResults()
  await refreshHistory()
}

const supabase = useSupabaseClient()
const channelName = `viewer-live-${useId()}`
let channel: ReturnType<typeof supabase.channel> | undefined
onMounted(() => {
  channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "match" },
      async () => {
        await refresh()
      },
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "result" },
      async () => {
        await refresh()
      },
    )
    .subscribe()
})

onBeforeUnmount(() => {
  if (channel) void supabase.removeChannel(channel)
})

const { data: history, refresh: refreshHistory } = await useAsyncData<
  HistoryItem[]
>(
  "viewer-live-history",
  async () => {
    if (!tournamentId.value) {
      return []
    }

    return await $fetch<HistoryItem[]>(
      `/api/results/${tournamentId.value}` as string,
    )
  },
  {
    default: () => [],
    watch: [tournamentId],
  },
)

const { data: results, refresh: refreshResults } = await useAsyncData<
  TournamentResult[]
>(
  "viewer-live-results",
  async () => {
    if (!tournamentId.value) {
      return []
    }

    return await $fetch<TournamentResult[]>(
      `/api/tournament_results/${tournamentId.value}` as string,
    )
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

const { isDesktop } = useDevice()
</script>

<template>
  <div class="w-full">
    <div v-if="isDesktop" class="mb-2">
      <PageHeader title="Live" description="Verfolge hier das Turnier" />
    </div>
    <template v-if="hasTournaments">
      <div
        :class="[
          'h-full w-full overflow-hidden',
          isDesktop &&
            'rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950',
        ]"
      >
        <div
          :class="[
            'w-full border-b border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900',
            isDesktop ? 'rounded-t-xl' : '',
          ]"
        >
          <USelect
            :items="tournamentOptions"
            v-model="selected"
            placeholder="Kein Live-Turnier verfügbar"
            :size="isDesktop ? 'sm' : 'lg'"
            :class="isDesktop ? 'min-w-64' : 'w-full'"
            :disabled="!hasTournaments"
          />
        </div>
        <div
          class="flex h-56 items-center justify-center border-b border-neutral-200 bg-neutral-50 sm:h-96 dark:border-neutral-700 dark:bg-neutral-900"
        >
          <ClientOnly>
            <LiveFlow :tournament-id="tournament?.id as string" />
            <template #fallback>
              <div
                class="flex h-full w-full items-center justify-center bg-neutral-100 dark:bg-neutral-800"
              >
                <UIcon name="i-svg-spinners-180-ring-with-bg" size="24" />
              </div>
            </template>
          </ClientOnly>
        </div>

        <div
          :class="[
            isDesktop
              ? 'xl:grid xl:grid-cols-2 xl:items-start xl:gap-4'
              : 'flex flex-col gap-3',
            'p-4',
          ]"
        >
          <template v-if="results?.length">
            <div
              class="rounded-xl border border-neutral-200 bg-neutral-50 p-4 shadow-sm xl:col-span-2 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <PageHeading>Gewinner</PageHeading>
              <TournamentPlaces
                :first="first!"
                :second="second!"
                :third="third!"
                :fourth="fourth!"
              />
            </div>
          </template>

          <template v-else>
            <div class="flex flex-col gap-3 xl:col-span-2">
              <div
                class="ring-opacity-25 dark:bg-opacity-10 dark:ring-opacity-25 flex w-full items-center justify-center space-x-1.5 rounded-md bg-transparent px-2 py-1 ring-1 ring-red-400 ring-inset dark:bg-neutral-900"
              >
                <span class="relative flex h-2 w-2">
                  <span
                    class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"
                  ></span>
                  <span
                    class="relative inline-flex h-2 w-2 rounded-full bg-red-400"
                  ></span>
                </span>
                <p class="text-xs font-medium text-red-400">Live</p>
              </div>
              <div
                class="flex flex-col gap-1.5 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <template v-if="liveMatches?.length">
                  <div
                    :class="[
                      isDesktop ? 'lg:grid lg:grid-cols-2 lg:gap-3' : '',
                    ]"
                  >
                    <MatchItemLive
                      v-for="match in liveMatches"
                      :key="match.match_id!"
                      :match
                      class="lg:min-w-0"
                    />
                  </div>
                </template>
                <template v-else>
                  <UAlert
                    icon="i-heroicons-information-circle"
                    color="primary"
                    variant="soft"
                    title="Zurzeit keine Live Spiele"
                    description="Das nächste Spiel beginnt in Kürze."
                  />
                </template>
              </div>
            </div>

            <div class="flex w-full flex-col gap-1.5 xl:self-start">
              <USeparator>Anstehende Spiele</USeparator>
              <div
                class="flex h-96 flex-col gap-1.5 overflow-auto rounded-lg border border-neutral-200 bg-white p-3 pb-8 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <MatchItemRow
                  v-for="(match, index) in matches"
                  :match
                  :next="index < 2"
                  :key="match.match_id!"
                />
              </div>
            </div>

            <div class="flex w-full flex-col gap-1.5 xl:self-start">
              <USeparator>Historie</USeparator>
              <div
                class="flex h-96 flex-col gap-1.5 overflow-auto rounded-lg border border-neutral-200 bg-white p-3 pb-8 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <!-- @vue-ignore -->
                <ResultItem
                  v-for="result in history"
                  :match="result.match as Match"
                  :id="result.id"
                  :score1="result.team1_score"
                  :score2="result.team2_score"
                  :winner="result.winner_id"
                />
              </div>
            </div>

            <div class="flex flex-col gap-1.5 xl:col-span-2">
              <USeparator>Platzierungen</USeparator>
              <GroupedStandingsList
                :grouped-standings="groupedStandings ?? []"
                :full-standings="fullStandings ?? []"
              />
            </div>
          </template>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="p-3">
        <UAlert
          icon="i-heroicons-information-circle"
          color="primary"
          variant="soft"
          title="Keine Live Turniere gefunden"
          description="Entweder gibt es keine Turniere oder ein Fehler ist aufgetreten. Oder es geht bald los!"
        />
      </div>
    </template>
  </div>
</template>
