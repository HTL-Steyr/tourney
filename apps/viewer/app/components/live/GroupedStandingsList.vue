<script setup lang="ts">
import type { Standing } from "@tourney/types"

type GroupedStandingsSection = {
  id: string
  name: string
  standings: Standing[]
}

withDefaults(
  defineProps<{
    groupedStandings?: GroupedStandingsSection[]
    fullStandings?: Standing[]
  }>(),
  {
    groupedStandings: () => [],
    fullStandings: () => [],
  },
)
</script>

<template>
  <div v-if="groupedStandings.length" class="flex flex-col gap-3">
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
        <span class="inline-block rotate-180 [writing-mode:vertical-rl]">
          {{ group.name }}
        </span>
      </UBadge>
      <div class="min-w-0 flex-1">
        <StandingsTable :standings="group.standings" compact />
      </div>
    </div>
  </div>
  <StandingsTable
    v-else-if="fullStandings.length"
    :standings="fullStandings"
    compact
  />
  <UAlert
    v-else
    icon="i-heroicons-information-circle"
    color="primary"
    variant="soft"
    title="Keine Platzierungen verfügbar"
    description="Für dieses Turnier sind noch keine Platzierungen verfügbar."
  />
</template>
