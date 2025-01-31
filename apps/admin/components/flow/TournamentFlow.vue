<script setup lang="ts">
import { type Node } from "@vue-flow/core"
import { VueFlow } from "@vue-flow/core"
import { Background } from "@vue-flow/background"
import { MiniMap } from "@vue-flow/minimap"
import { Controls } from "@vue-flow/controls"
import type { Group } from "~/types/group"

const { groups } = defineProps<{
  groups: Group[]
}>()

const nodes = ref<Node[]>([])
const generateNodes = (groups: Group[]) => {
  const generatedNodes: Node[] = []

  groups.forEach((group, groupIndex) => {
    const groupNode: Node = {
      id: `group-${groupIndex}`,
      data: { label: group.name },
      position: { x: groupIndex * 250, y: 0 },
      style: {
        backgroundColor: "rgba(16, 185, 129, 0.5)",
        width: "200px",
        height: `${75 + group.teams.length * 50}px`,
      },
    }
    generatedNodes.push(groupNode)

    group.teams.forEach((team, teamIndex) => {
      const teamNode: Node = {
        id: `team-${groupIndex}-${teamIndex}`,
        data: { label: team },
        type: "special",
        position: { x: 25, y: 50 + teamIndex * 50 },
        parentNode: `group-${groupIndex}`,
        extent: "parent",
      }
      generatedNodes.push(teamNode)
    })
  })

  return generatedNodes
}

nodes.value = generateNodes(groups)
</script>

<template>
  <VueFlow
    :nodes="nodes"
    class="bg-gray-100 dark:bg-gray-800"
    :default-viewport="{ zoom: 1.5 }"
    :min-zoom="0.2"
    :max-zoom="4"
  >
    <Background pattern-color="#aaa" :gap="16" />
    <MiniMap pannable zoomable />
    <Controls position="top-left" />

    <template #node-special="specialNodeProps">
      <SpecialNode v-bind="specialNodeProps" />
    </template>
  </VueFlow>
</template>

<style>
@import "@vue-flow/core/dist/style.css";
@import "@vue-flow/core/dist/theme-default.css";
@import "@vue-flow/controls/dist/style.css";
@import "@vue-flow/minimap/dist/style.css";
</style>
