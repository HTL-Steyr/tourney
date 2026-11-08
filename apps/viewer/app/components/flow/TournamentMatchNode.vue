<script setup lang="ts">
import type { NodeProps } from "@vue-flow/core"
import { Position, Handle } from "@vue-flow/core"

defineProps<NodeProps>()
</script>

<template>
  <div
    class="min-w-[180px] rounded border border-neutral-300 p-2.5 shadow-md"
    :class="{
      'border-blue-500/50 bg-blue-500/10': data.nodeType === 'group',
      'border-purple-500/50 bg-purple-500/10': data.nodeType === 'quarterfinal',
      'border-yellow-500/50 bg-amber-500/10': data.nodeType === 'semifinal',
      'border-red-500/50 bg-red-500/10': data.nodeType === 'final',
      'border-green-500/50 bg-emerald-500/10': data.nodeType === 'winner',
    }"
  >
    <Handle type="target" :position="Position.Left" />
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
          :class="{ 'bg-emerald-500/20 font-bold': data.winner === team }"
        >
          {{ team }}
        </div>
      </div>
      <div v-else class="text-center text-neutral-500 italic">Pending</div>
    </div>
    <Handle type="source" :position="Position.Right" />
  </div>
</template>
