<script setup lang="ts">
defineProps<{
  first: string
  second: string
  third: string
  fourth: string
}>()
</script>

<template>
  <div class="flex flex-col gap-1">
    <TournamentPlaceRow :place="1">
      {{ first }}
    </TournamentPlaceRow>
    <TournamentPlaceRow :place="2">
      {{ second }}
    </TournamentPlaceRow>
    <TournamentPlaceRow :place="3">
      {{ third }}
    </TournamentPlaceRow>
    <TournamentPlaceRow :place="4">
      {{ fourth }}
    </TournamentPlaceRow>
  </div>
</template>
