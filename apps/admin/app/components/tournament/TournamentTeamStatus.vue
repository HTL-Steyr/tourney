<script setup lang="ts">
import type { TournamentTeamSummary } from "@tourney/types"

interface SummaryItem {
  icon: string
  color: string
  value: number
}

const { data } = defineProps<{ data: TournamentTeamSummary }>()
const summaryItems = computed<SummaryItem[]>(() => [
  {
    icon: "i-heroicons-envelope",
    color: "text-orange-500",
    value: data.pending,
  },
  {
    icon: "i-heroicons-check",
    color: "text-green-500",
    value: data.accepted,
  },
  {
    icon: "i-heroicons-no-symbol",
    color: "text-red-500",
    value: data.rejected,
  },
])
</script>

<template>
  <div class="flex justify-between gap-1">
    <div
      v-for="(item, index) in summaryItems"
      :key="index"
      class="flex grow items-center justify-center space-x-1 rounded-md bg-white px-2 py-1 dark:bg-neutral-900"
    >
      <UIcon :name="item.icon" :class="item.color" size="16" />
      <p class="font-mono">{{ item.value }}</p>
    </div>
  </div>
</template>
