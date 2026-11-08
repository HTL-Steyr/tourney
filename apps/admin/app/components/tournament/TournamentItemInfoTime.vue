<script setup lang="ts">
import type { ParsedJsonTournament } from "@tourney/types"
import { useDateFormat } from "@vueuse/core"
import { parseStringToDate } from "#imports"

const { arrowRight = false } = defineProps<{
  tournament: ParsedJsonTournament
  arrowRight?: boolean
}>()
</script>

<template>
  <UIcon name="i-heroicons-arrow-long-down" size="20" v-if="!arrowRight" />
  <div class="flex flex-col text-base sm:text-sm">
    <div class="flex items-center space-x-1">
      <UIcon name="i-heroicons-clock" />
      <p>
        {{ useDateFormat(parseStringToDate(tournament.from), "HH:mm") }}
      </p>
    </div>
    <div class="flex items-center space-x-1">
      <UIcon name="i-heroicons-clock" />
      <p>
        {{ useDateFormat(parseStringToDate(tournament.to), "HH:mm") }}
      </p>
    </div>
  </div>
  <UIcon name="i-heroicons-arrow-long-down" size="20" v-if="arrowRight" />
</template>
