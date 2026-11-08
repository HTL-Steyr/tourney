<script setup lang="ts">
import type { NodeProps } from "@vue-flow/core"
import { Position, Handle } from "@vue-flow/core"

defineProps<NodeProps>()
</script>

<template>
  <div
    class="min-w-[180px] rounded border border-blue-500/50 bg-blue-500/10 p-2.5 shadow-md"
  >
    <div class="flex flex-col gap-2">
      <div class="pb-1.5 text-center font-bold">{{ data.label }}</div>
      <div
        v-if="data.teams && data.teams.length > 0"
        class="flex flex-col gap-1.5"
      >
        <div
          v-for="(team, index) in data.teams"
          :key="index"
          class="rounded bg-neutral-100 p-1.5 dark:bg-neutral-900"
        >
          {{ team }}
        </div>
      </div>
      <div v-else class="text-center text-neutral-500 italic">Keine Teams</div>
    </div>
    <Handle type="source" :position="Position.Right" />
  </div>
</template>
