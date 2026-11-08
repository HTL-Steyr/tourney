<script setup lang="ts">
import type { ParsedJsonTournament } from "@tourney/types"
import { useDateFormat } from "@vueuse/core"

const { truncate = true } = defineProps<{
  tournament: ParsedJsonTournament
  truncate?: boolean
}>()
</script>

<template>
  <div class="flex flex-col text-base sm:text-sm">
    <div class="flex items-center space-x-1">
      <UIcon name="i-heroicons-calendar-days" />
      <p>
        {{ useDateFormat(tournament.start_date, "DD.MM.YYYY") }}
      </p>
    </div>
    <div class="flex items-center space-x-1">
      <UIcon name="i-heroicons-map-pin" />
      <p :class="['truncate', truncate && 'max-w-28']">
        {{ tournament.location }}
      </p>
    </div>
  </div>
</template>
