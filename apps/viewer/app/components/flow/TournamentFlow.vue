<script setup lang="ts">
import { type Node } from "@vue-flow/core"
import { VueFlow } from "@vue-flow/core"
import { Background } from "@vue-flow/background"
import { MiniMap } from "@vue-flow/minimap"
import { Controls } from "@vue-flow/controls"
import type { Group } from "@tourney/types"

const { groups } = defineProps<{
  groups: Group[]
}>()

const nodes = ref<Node[]>([])
const generateNodes = (groups: Group[]) => {
  const generatedNodes: Node[] = []

  groups.forEach((group, groupIndex) => {
    const groupNode: Node = {
      id: `group-${groupIndex}`,
      type: "group",
      data: {
        label: group.name,
        teams: group.teams,
        nodeType: "group",
      },
      position: { x: groupIndex * 250, y: 0 },
      style: {
        width: "200px",
        height: `${75 + group.teams.length * 30}px`,
      },
    }
    generatedNodes.push(groupNode)
  })

  return generatedNodes
}

nodes.value = generateNodes(groups)
</script>

<template>
  <VueFlow
    :nodes="nodes"
    class="bg-neutral-100 dark:bg-neutral-800"
    :default-viewport="{ zoom: 1.5 }"
    :min-zoom="0.2"
    :max-zoom="4"
  >
    <Background pattern-color="#aaa" :gap="16" />
    <MiniMap pannable zoomable />
    <Controls position="top-left" />

    <template #node-team="teamNodeProps">
      <TeamNode v-bind="teamNodeProps" />
    </template>

    <template #node-group="groupNodeProps">
      <GroupNode v-bind="groupNodeProps" />
    </template>
  </VueFlow>
</template>

<style>
@import "@vue-flow/core/dist/style.css";
@import "@vue-flow/core/dist/theme-default.css";
@import "@vue-flow/controls/dist/style.css";
@import "@vue-flow/minimap/dist/style.css";
</style>
