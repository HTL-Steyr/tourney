<script setup lang="ts">
import type { Database, ParsedJsonTournament, Standing } from "@tourney/types"
import { parseStringToDate } from "#imports"
import { useDateFormat } from "@vueuse/core"

type TournamentGroup = Database["public"]["Tables"]["group"]["Row"]
type GroupStanding = Database["public"]["Views"]["group_standings"]["Row"]
type GroupStandingsSection = {
  id: string
  name: string
  standings: Standing[]
}

const route = useRoute()
const uuid = route.params.id

const { data: tournament } = await useFetch<ParsedJsonTournament | null>(
  `/api/tournaments/${uuid}`,
)

if (!tournament.value) {
  throw createError({
    statusCode: 404,
    message: "Turnier nicht gefunden",
  })
}

useHead({
  title: () => tournament.value?.name ?? "Turnier",
})

const bonus = computed(() => {
  return tournament.value?.prizes?.bonus ?? "Keine weiteren Preise"
})

const { data: history } = await useFetch(`/api/results/${uuid}`)
const { data: results } = await useFetch(`/api/tournament_results/${uuid}`)

const { data: groups } = tournament.value
  ? await useFetch<TournamentGroup[]>(`/api/groups/${tournament.value.id}`)
  : { data: ref([]) }

const { data: fullStandings } = await useFetch<Standing[]>(
  `/api/views/standings/${tournament.value.id}`,
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
    tournament_id: standing.tournament_id ?? tournament.value?.id ?? "",
    wins: standing.wins ?? 0,
  }
}

const { data: groupedStandings } = await useAsyncData<GroupStandingsSection[]>(
  `viewer-tournament-${tournament.value.id}-grouped-standings`,
  async () => {
    if (!groups.value?.length) {
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
</script>

<template>
  <PageWrapper>
    <div class="flex w-full flex-col gap-4 xl:gap-5">
      <div>
        <UButton
          to="/tournaments"
          icon="i-heroicons-chevron-left"
          variant="link"
          class="mb-2 -ml-3 w-fit"
          label="Zurück"
        />
        <PageTitle>{{ tournament?.name }}</PageTitle>
      </div>

      <div
        class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_280px_minmax(360px,0.95fr)] xl:items-start"
      >
        <div
          class="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <PageHeading>Infos</PageHeading>
          <div class="flex items-center gap-4 sm:gap-3">
            <div
              class="flex grow items-center gap-1 rounded-md bg-neutral-50 p-1 px-3 dark:bg-neutral-800"
            >
              <div class="flex flex-col text-base sm:text-sm">
                <div class="flex items-center space-x-1">
                  <UIcon name="i-heroicons-calendar-days" />
                  <p>
                    {{ useDateFormat(tournament?.start_date, "DD.MM.YYYY") }}
                  </p>
                </div>
                <div class="flex items-center space-x-1">
                  <UIcon name="i-heroicons-map-pin" />
                  <p class="max-w-36 truncate">
                    {{ tournament?.location }}
                  </p>
                </div>
              </div>
            </div>
            <div
              class="flex items-center gap-1 rounded-md bg-neutral-50 p-1 pr-3 dark:bg-neutral-800"
            >
              <UIcon name="i-heroicons-arrow-long-down" size="20" />
              <div class="flex flex-col text-base sm:text-sm">
                <div class="flex items-center space-x-1">
                  <UIcon name="i-heroicons-clock" />
                  <p>
                    {{
                      useDateFormat(
                        parseStringToDate(tournament?.from!),
                        "HH:mm",
                      )
                    }}
                  </p>
                </div>
                <div class="flex items-center space-x-1">
                  <UIcon name="i-heroicons-clock" />
                  <p>
                    {{
                      useDateFormat(parseStringToDate(tournament?.to!), "HH:mm")
                    }}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <PageHeading>Regeln</PageHeading>
          <div
            class="h-28 overflow-auto rounded-md border-neutral-200 bg-neutral-50 p-2 dark:border-neutral-800 dark:bg-neutral-800"
          >
            <pre class="text text-sm text-wrap">{{ tournament?.rules }}</pre>
          </div>
          <PageHeading>Preise</PageHeading>
          <div class="flex flex-col gap-1">
            <TournamentPrizeRow :place="1">
              {{ tournament?.prizes?.first ?? "Nichts" }}
            </TournamentPrizeRow>
            <TournamentPrizeRow :place="2">
              {{ tournament?.prizes?.second ?? "Nichts" }}
            </TournamentPrizeRow>
            <TournamentPrizeRow :place="3">
              {{ tournament?.prizes?.third ?? "Nichts" }}
            </TournamentPrizeRow>
            <div
              class="h-20 overflow-auto rounded-md border-neutral-200 bg-neutral-50 p-2 dark:border-neutral-800 dark:bg-neutral-800"
            >
              <!-- Keep this as one line or else there will be an unnecessary line -->
              <pre class="text text-sm text-wrap">{{ bonus }}</pre>
            </div>
          </div>
        </div>

        <div
          v-if="results && results.length"
          class="self-start rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <PageHeading>Gewinner</PageHeading>
          <TournamentPlaces
            :first="first!"
            :second="second!"
            :third="third!"
            :fourth="fourth!"
          />
        </div>
        <div
          class="self-start rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <PageHeading>Platzierungen</PageHeading>
          <div class="xl:max-h-[28rem] xl:overflow-auto xl:pr-1">
            <GroupedStandingsList
              :grouped-standings="groupedStandings ?? []"
              :full-standings="fullStandings ?? []"
            />
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:items-start">
        <div
          class="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm xl:col-span-2 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <PageHeading>Visualisierung</PageHeading>
          <div
            class="flex h-72 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 xl:h-[30rem] dark:border-neutral-700 dark:bg-neutral-900"
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
        </div>

        <div
          class="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <PageHeading>Spielverlauf</PageHeading>
          <div
            class="flex h-96 flex-col gap-1.5 overflow-auto rounded-lg border border-neutral-200 bg-neutral-50 p-3 pb-8 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <template v-if="history && history.length">
              <!-- @vue-ignore -->
              <ResultItem
                v-for="result in history"
                :match="result.match as Match"
                :id="result.id"
                :score1="result.team1_score"
                :score2="result.team2_score"
                :winner="result.winner_id"
              />
            </template>
            <UAlert
              v-else
              icon="i-heroicons-information-circle"
              color="primary"
              variant="soft"
              title="Keine Spielergebnisse verfügbar"
              description="Für dieses Turnier sind noch keine Spielergebnisse verfügbar."
            />
          </div>
        </div>
      </div>
    </div>
  </PageWrapper>
</template>
