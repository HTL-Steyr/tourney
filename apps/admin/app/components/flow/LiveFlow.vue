<script setup lang="ts">
import { VueFlow, type Node, type Edge } from "@vue-flow/core"
import { Background } from "@vue-flow/background"
import { Controls } from "@vue-flow/controls"
import { MiniMap } from "@vue-flow/minimap"
import type { TournamentPhases } from "@tourney/types"

import "@vue-flow/core/dist/style.css"
import "@vue-flow/core/dist/theme-default.css"
import "@vue-flow/controls/dist/style.css"
import "@vue-flow/minimap/dist/style.css"

const { tournamentId } = defineProps<{
  tournamentId: string
}>()

const { data: tournamentData, refresh } = await useFetch<TournamentPhases>(
  () => `/api/tournaments/${tournamentId}/phases`,
)

defineExpose({ refresh })

const supabase = useSupabaseClient()
supabase
  .channel("channel-match")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "match" },
    async () => {
      await refresh()
    },
  )
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "result" },
    async () => {
      await refresh()
    },
  )
  .subscribe()

const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])

const HORIZONTAL_SPACING = 250
const GROUP_VERTICAL_SPACING = 300
const TEAM_HEIGHT = 35
const GROUP_PADDING = 75

watchEffect(() => {
  if (!tournamentData.value) return

  const data = tournamentData.value
  const nodeList: Node[] = []
  const edgeList: Edge[] = []

  data.groups.forEach((group, groupIndex) => {
    const groupHeight = GROUP_PADDING + group.teams.length * TEAM_HEIGHT

    const groupNode: Node = {
      id: `group-${group.id}`,
      type: "group",
      data: {
        label: group.name,
        teams: group.teams.map((team) => team.name),
        nodeType: "group",
      },
      position: { x: 0, y: groupIndex * GROUP_VERTICAL_SPACING },
      style: {
        width: "200px",
        height: `${groupHeight}px`,
      },
    }
    nodeList.push(groupNode)
  })

  const sortedQuarterFinals = [...data.phases.quarterFinals].sort((a, b) => {
    return String(a.match_id).localeCompare(String(b.match_id))
  })

  sortedQuarterFinals.forEach((match, index) => {
    const matchNode: Node = {
      id: `quarterfinal-${match.match_id}`,
      type: "tournamentMatch",
      data: {
        label: "Viertelfinale",
        teams: [match.team1_name, match.team2_name],
        winner:
          match.result && "winner_id" in match.result
            ? match.result.winner_id === match.team1_id
              ? match.team1_name
              : match.team2_name
            : undefined,
        nodeType: "quarterfinal",
      },
      position: { x: HORIZONTAL_SPACING, y: index * GROUP_VERTICAL_SPACING },
    }
    nodeList.push(matchNode)

    const team1GroupId = data.groups.find((group) =>
      group.teams.some((team) => team.id === match.team1_id),
    )?.id

    const team2GroupId = data.groups.find((group) =>
      group.teams.some((team) => team.id === match.team2_id),
    )?.id

    if (team1GroupId) {
      edgeList.push({
        id: `edge-group-${team1GroupId}-to-quarterfinal-${match.match_id}`,
        source: `group-${team1GroupId}`,
        target: `quarterfinal-${match.match_id}`,
        type: "smoothstep",
      })
    }

    if (team2GroupId && team2GroupId !== team1GroupId) {
      edgeList.push({
        id: `edge-group-${team2GroupId}-to-quarterfinal-${match.match_id}`,
        source: `group-${team2GroupId}`,
        target: `quarterfinal-${match.match_id}`,
        type: "smoothstep",
      })
    }
  })

  const sortedSemiFinals = [...data.phases.semiFinals].sort((a, b) => {
    return String(a.match_id).localeCompare(String(b.match_id))
  })

  sortedSemiFinals.forEach((match, index) => {
    const matchNode: Node = {
      id: `semifinal-${match.match_id}`,
      type: "tournamentMatch",
      data: {
        label: "Semifinale",
        teams: [match.team1_name, match.team2_name],
        winner:
          match.result && "winner_id" in match.result
            ? match.result.winner_id === match.team1_id
              ? match.team1_name
              : match.team2_name
            : undefined,
        nodeType: "semifinal",
      },
      position: {
        x: HORIZONTAL_SPACING * 2,
        y: index * GROUP_VERTICAL_SPACING + GROUP_VERTICAL_SPACING / 2,
      },
    }
    nodeList.push(matchNode)

    if (index === 0) {
      if (sortedQuarterFinals[0]) {
        edgeList.push({
          id: `edge-to-semifinal-${index}-1`,
          source: `quarterfinal-${sortedQuarterFinals[0].match_id}`,
          target: `semifinal-${match.match_id}`,
          type: "smoothstep",
        })
      }

      if (sortedQuarterFinals[2]) {
        edgeList.push({
          id: `edge-to-semifinal-${index}-2`,
          source: `quarterfinal-${sortedQuarterFinals[2].match_id}`,
          target: `semifinal-${match.match_id}`,
          type: "smoothstep",
        })
      }
    } else if (index === 1) {
      if (sortedQuarterFinals[1]) {
        edgeList.push({
          id: `edge-to-semifinal-${index}-1`,
          source: `quarterfinal-${sortedQuarterFinals[1].match_id}`,
          target: `semifinal-${match.match_id}`,
          type: "smoothstep",
        })
      }

      if (sortedQuarterFinals[3]) {
        edgeList.push({
          id: `edge-to-semifinal-${index}-2`,
          source: `quarterfinal-${sortedQuarterFinals[3].match_id}`,
          target: `semifinal-${match.match_id}`,
          type: "smoothstep",
        })
      }
    }
  })

  if (data.phases.thirdPlace) {
    const thirdPlaceNode: Node = {
      id: `thirdplace-${data.phases.thirdPlace.match_id}`,
      type: "tournamentMatch",
      data: {
        label: "Kleines Finale",
        teams: [
          data.phases.thirdPlace.team1_name,
          data.phases.thirdPlace.team2_name,
        ],
        winner:
          data.phases.thirdPlace.result &&
          "winner_id" in data.phases.thirdPlace.result
            ? data.phases.thirdPlace.result.winner_id ===
              data.phases.thirdPlace.team1_id
              ? data.phases.thirdPlace.team1_name
              : data.phases.thirdPlace.team2_name
            : undefined,
        nodeType: "final",
      },
      position: { x: HORIZONTAL_SPACING * 3, y: GROUP_VERTICAL_SPACING },
    }
    nodeList.push(thirdPlaceNode)

    sortedSemiFinals.forEach((match, index) => {
      edgeList.push({
        id: `edge-to-thirdplace-${index}`,
        source: `semifinal-${match.match_id}`,
        target: `thirdplace-${data.phases.thirdPlace?.match_id}`,
        type: "smoothstep",
        style: { strokeDasharray: "5, 5" }, // Dashed line for losers
      })
    })
  }

  if (data.phases.final) {
    const finalNode: Node = {
      id: `final-${data.phases.final.match_id}`,
      type: "tournamentMatch",
      data: {
        label: "Finale",
        teams: [data.phases.final.team1_name, data.phases.final.team2_name],
        winner:
          data.phases.final.result && "winner_id" in data.phases.final.result
            ? data.phases.final.result.winner_id === data.phases.final.team1_id
              ? data.phases.final.team1_name
              : data.phases.final.team2_name
            : undefined,
        nodeType: "final",
      },
      position: { x: HORIZONTAL_SPACING * 3, y: 0 },
    }
    nodeList.push(finalNode)

    sortedSemiFinals.forEach((match, index) => {
      edgeList.push({
        id: `edge-to-final-${index}`,
        source: `semifinal-${match.match_id}`,
        target: `final-${data.phases.final?.match_id}`,
        type: "smoothstep",
      })
    })

    if (data.winner && "team_id" in data.winner) {
      let winnerTeamName = ""
      data.groups.forEach((group) => {
        group.teams.forEach((team) => {
          if (team.id === data.winner?.team_id) {
            winnerTeamName = team.name
          }
        })
      })

      if (winnerTeamName) {
        const winnerNode: Node = {
          id: "tournament-winner",
          type: "tournamentMatch",
          data: {
            label: "Turniersieger",
            teams: [winnerTeamName],
            nodeType: "winner",
          },
          position: { x: HORIZONTAL_SPACING * 4, y: 0 },
        }
        nodeList.push(winnerNode)

        edgeList.push({
          id: "edge-to-winner",
          source: `final-${data.phases.final.match_id}`,
          target: "tournament-winner",
          type: "smoothstep",
        })
      }
    }
  }

  nodes.value = nodeList
  edges.value = edgeList
})
</script>

<template>
  <VueFlow
    :nodes="nodes"
    :edges="edges"
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

    <template #node-tournamentMatch="tournamentMatchProps">
      <TournamentMatchNode v-bind="tournamentMatchProps" />
    </template>

    <template #node-group="groupNodeProps">
      <GroupNode v-bind="groupNodeProps" />
    </template>
  </VueFlow>
</template>
