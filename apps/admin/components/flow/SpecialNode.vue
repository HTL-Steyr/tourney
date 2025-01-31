<script setup lang="ts">
import { type NodeProps } from "@vue-flow/core"

defineProps<NodeProps>()
</script>

<template>
  <div class="vue-flow__node-default">
    <div>{{ data.label }}</div>
  </div>
</template>
