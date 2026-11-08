<script setup lang="ts">
import type { ParsedJsonTournament } from "@tourney/types"
import { getImageUrl, parseStringToDate } from "#imports"
import { useDateFormat } from "@vueuse/core"

const { tournament } = defineProps<{
  tournament: ParsedJsonTournament
}>()

const bonus = computed(() => {
  return tournament.prizes?.bonus ?? "Keine weiteren Preise"
})
</script>

<template>
  <UCard>
    <template #header>
      <div
        class="relative flex h-[200px] flex-col justify-end overflow-hidden rounded-t-lg p-4 py-2"
      >
        <NuxtImg
          :src="getImageUrl(tournament.thumbnail_path)"
          class="absolute top-0 left-0 h-full w-full overflow-clip object-cover object-top"
        />
        <h2
          class="z-10 text-3xl font-bold tracking-tight text-white drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]"
        >
          {{ tournament.name }}
        </h2>
      </div>
    </template>
    <div class="flex items-center gap-4 sm:gap-3">
      <div
        class="flex grow items-center gap-1 rounded-md bg-neutral-50 p-1 px-3 dark:bg-neutral-800"
      >
        <div class="flex flex-col text-base sm:text-sm">
          <div class="flex items-center space-x-1">
            <UIcon name="i-heroicons-calendar-days" />
            <p>
              {{ useDateFormat(tournament.start_date, "DD.MM.YYYY") }}
            </p>
          </div>
          <div class="flex items-center space-x-1">
            <UIcon name="i-heroicons-map-pin" />
            <p class="max-w-36 truncate">
              {{ tournament.location }}
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
      </div>
    </div>
    <PageHeading>Regeln</PageHeading>
    <div
      class="h-28 overflow-auto rounded-md border-neutral-200 bg-neutral-50 p-2 dark:border-neutral-800 dark:bg-neutral-800"
    >
      <pre class="text text-sm text-wrap">{{ tournament.rules }}</pre>
    </div>
    <PageHeading>Preise</PageHeading>
    <div class="flex flex-col gap-1">
      <TournamentPrizeRow :place="1">
        {{ tournament.prizes?.first ?? "Nichts" }}
      </TournamentPrizeRow>
      <TournamentPrizeRow :place="2">
        {{ tournament.prizes?.second ?? "Nichts" }}
      </TournamentPrizeRow>
      <TournamentPrizeRow :place="3">
        {{ tournament.prizes?.third ?? "Nichts" }}
      </TournamentPrizeRow>
      <div
        class="h-20 overflow-auto rounded-md border-neutral-200 bg-neutral-50 p-2 dark:border-neutral-800 dark:bg-neutral-800"
      >
        <!-- Keep this as one line or else there will be an unnecessary line -->
        <pre class="text text-sm text-wrap">{{ bonus }}</pre>
      </div>
    </div>
    <template #footer>
      <UButton
        block
        label="Anschauen"
        :to="`/tournaments/${tournament.id}`"
        size="xl"
        variant="soft"
      />
    </template>
  </UCard>
</template>
