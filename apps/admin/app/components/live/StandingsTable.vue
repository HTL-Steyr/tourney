<script setup lang="ts">
import type { Standing } from "@tourney/types"

withDefaults(
  defineProps<{
    standings: Standing[]
    compact?: boolean
  }>(),
  {
    compact: false,
  },
)
</script>

<template>
  <div
    class="flex flex-col gap-1"
    :class="compact ? '' : 'overflow-auto pt-2 pb-12'"
  >
    <div
      class="shrink-0 overflow-hidden rounded-md border border-neutral-300 dark:border-neutral-700"
    >
      <table class="w-full table-auto border-separate border-spacing-0">
        <thead>
          <tr
            class="bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
          >
            <th class="py-2 first:rounded-tl-sm last:rounded-tr-sm">Team</th>
            <th class="py-2 first:rounded-tl-sm last:rounded-tr-sm">Pkt.</th>
            <th class="px-1 py-2 first:rounded-tl-sm last:rounded-tr-sm">S</th>
            <th class="px-1 py-2 first:rounded-tl-sm last:rounded-tr-sm">U</th>
            <th class="px-1 py-2 first:rounded-tl-sm last:rounded-tr-sm">N</th>
            <th class="px-1 py-2 first:rounded-tl-sm last:rounded-tr-sm">T</th>
            <th class="px-1 py-2 first:rounded-tl-sm last:rounded-tr-sm">D</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="standing in standings" :key="standing.team_id!">
            <td
              class="border-t border-r border-neutral-300 py-2 text-center font-medium dark:border-neutral-700"
            >
              {{ standing.team_name }}
            </td>
            <td
              class="border-t border-r border-neutral-300 py-2 text-center dark:border-neutral-700"
            >
              {{ standing.points }}
            </td>
            <td
              class="border-t border-r border-neutral-300 px-1 py-2 text-center dark:border-neutral-700"
            >
              {{ standing.wins }}
            </td>
            <td
              class="border-t border-r border-neutral-300 px-1 py-2 text-center dark:border-neutral-700"
            >
              {{ standing.draws }}
            </td>
            <td
              class="border-t border-r border-neutral-300 px-1 py-2 text-center dark:border-neutral-700"
            >
              {{ standing.losses }}
            </td>
            <td
              class="border-t border-r border-neutral-300 px-1 py-2 text-center dark:border-neutral-700"
            >
              {{ standing.goals_scored }}:{{ standing.goals_conceded }}
            </td>
            <td
              class="border-t border-neutral-300 px-1 py-2 text-center dark:border-neutral-700"
            >
              {{ standing.goal_difference }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
