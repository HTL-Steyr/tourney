<script setup lang="ts">
import { z } from "zod"
import type { Enums } from "@tourney/types"

const title = ref<string>("Turniere")
useHead({
  title: () => title.value,
})

const { getCurrentUserId } = useUser()

const { data: groupedTournaments, refresh } = await useFetch(
  "/api/tournaments",
  {
    transform: (data) =>
      data?.reduce<Record<number, typeof data>>((acc, curr) => {
        const year = curr.year
        if (!acc[year]) {
          acc[year] = []
        }
        acc[year].push(curr)
        return acc
      }, {}),
  },
)

const sortedTournaments = computed(() => {
  const tournaments = groupedTournaments.value
  if (!tournaments) {
    return []
  }

  return Object.entries(tournaments)
    .map(([year, items]) => ({
      year: Number(year),
      tournaments: items,
    }))
    .sort((a, b) => b.year - a.year)
})

const search = ref<string>("")
const filteredTournaments = computed(() => {
  const query = search.value.toLowerCase()
  if (!query) return sortedTournaments.value

  return sortedTournaments.value
    .map((group) => {
      const filteredItems = group.tournaments.filter((tournament) =>
        tournament.name.toLowerCase().includes(query),
      )
      return { ...group, tournaments: filteredItems }
    })
    .filter((group) => group.tournaments.length > 0)
})

const refreshTournaments = () => {
  refresh()
  displaySuccessNotification("Aktualisiert", "Turniere wurden aktualisiert")
}

const isOpenCreate = ref<boolean>(false)
const creationSchema = z.object({
  name: z.string(),
  rules: z.string(),
  start_date: z.string().date(),
  from: z.string(),
  to: z.string(),
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

const creationState = reactive({
  name: undefined,
  rules: "",
  start_date: undefined,
  from: undefined,
  to: undefined,
  sport: "Fußball",
  prizes: {
    first: "",
    second: "",
    third: "",
    bonus: "",
  },
  thumbnail_path: undefined,
  location: "Sportplatz",
  groups: 0,
  group_teams: 0,
  knockout_interval: 15,
})

const resetCreationState = () => {
  creationState.name = undefined
  creationState.rules = ""
  creationState.start_date = undefined
  creationState.from = undefined
  creationState.to = undefined
  creationState.sport = "Fußball"
  creationState.prizes.first = ""
  creationState.prizes.second = ""
  creationState.prizes.third = ""
  creationState.prizes.bonus = ""
  creationState.thumbnail_path = undefined
  creationState.location = "Sportplatz"
  creationState.groups = 0
  creationState.group_teams = 0
  creationState.knockout_interval = 15
}

watch(isOpenCreate, (isOpen) => {
  if (isOpen) return

  resetCreationState()
})

const FOOTBALL_GROUPS: number = 4
const FOOTBALL_TEAMS: number = 5
const VOLLEYBALL_BASKETBALL_GROUPS: number = 2
const VOLLEYBALL_BASKETBALL_TEAMS: number = 5

const onSubmitCreate = async () => {
  try {
    creationSchema.parse(creationState)
    switch (creationState.sport as Enums<"sport_type">) {
      case "Fußball":
        creationState.groups = FOOTBALL_GROUPS
        creationState.group_teams = FOOTBALL_TEAMS
        break
      case "Volleyball":
      case "Basketball":
        creationState.groups = VOLLEYBALL_BASKETBALL_GROUPS
        creationState.group_teams = VOLLEYBALL_BASKETBALL_TEAMS
        break
    }
    const editorId = await getCurrentUserId()
    await $fetch("/api/tournaments/create", {
      method: "POST",
      body: {
        ...creationState,
        last_edited_by_id: editorId,
      },
    })
    isOpenCreate.value = false
    await refresh()
    displaySuccessNotification(
      "Turnier erstellt",
      "Das Turnier wurde erfolgreich erstellt.",
    )
  } catch (err) {
    console.error(err)
    displayFailureNotification(
      "Fehler beim Erstellen",
      "Das Turnier konnte nicht erstellt werden.",
    )
  }
}
</script>

<template>
  <BasePageHeader :title="title">
    <ToolbarContainer>
      <SearchInput v-model="search" placeholder="Namen suchen..." />
      <UButton
        icon="i-heroicons-arrow-path"
        color="neutral"
        variant="outline"
        size="sm"
        square
        @click="refreshTournaments"
      />
      <UButton
        size="sm"
        variant="soft"
        @click="isOpenCreate = true"
        label="Neues Turnier..."
      />
      <ModalCreate
        title="Neues Turnier"
        v-model="isOpenCreate"
        @create="onSubmitCreate"
        modal-width="sm:max-w-4xl"
      >
        <TournamentForm :schema="creationSchema" :state="creationState" />
      </ModalCreate>
    </ToolbarContainer>
  </BasePageHeader>
  <BasePageContent>
    <div class="h-full overflow-auto p-6 pb-24">
      <template v-if="filteredTournaments.length">
        <div
          class="flex flex-col gap-3"
          v-for="item in filteredTournaments"
          :key="item.year"
        >
          <div>
            <UBadge :label="item.year" variant="subtle" />
          </div>
          <TournamentGrid>
            <TournamentItem
              v-for="tournament in item.tournaments"
              :key="tournament.id"
              :tournament
              @refresh="refresh"
            />
          </TournamentGrid>
          <USeparator class="my-6" />
        </div>
      </template>
      <template v-else>
        <EmptyState
          v-model="search"
          title="Keine Turniere"
          description="Mit Turnieren kannst du deine Sportveranstaltungen verwalten.
              Erstelle ein neues Turnier, um zu beginnen."
        />
      </template>
    </div>
  </BasePageContent>
</template>
