<script setup lang="ts">
import type { NodeProps } from "@vue-flow/core"
import { Position, Handle } from "@vue-flow/core"

defineProps<NodeProps>()
</script>

<template>
  <div class="w-[150px] rounded bg-white px-2 py-1 shadow-sm">
    <Handle type="target" :position="Position.Left" />
    <div
      class="overflow-hidden text-center text-xs text-ellipsis whitespace-nowrap"
    >
      {{ data.teams[0] }}
    </div>
    <Handle type="source" :position="Position.Right" />
  </div>
</template>
