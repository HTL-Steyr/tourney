<script setup lang="ts">
import { computed } from "vue"
import type { VisibilityState } from "@tanstack/vue-table"

type DataTableColumn = {
  id?: string
  accessorKey?: string
  header?: unknown
  enableHiding?: boolean
}

const model = defineModel<VisibilityState>({
  default: () => ({}),
})

const props = defineProps<{
  columns: DataTableColumn[]
}>()

const items = computed(() => [
  props.columns
    .filter((column) => column.enableHiding !== false)
    .flatMap((column) => {
      const key = column.id ?? column.accessorKey

      if (!key) {
        return []
      }

      return [
        {
          type: "checkbox" as const,
          label:
            typeof column.header === "string" ? column.header : String(key),
          checked: model.value[key] !== false,
          onUpdateChecked: (checked: boolean) => {
            const next = { ...model.value }

            if (checked) {
              delete next[key]
            } else {
              next[key] = false
            }

            model.value = next
          },
        },
      ]
    }),
])
</script>

<template>
  <UDropdownMenu :items="items" :content="{ align: 'end' }" v-slot="{ open }">
    <UButton
      color="neutral"
      variant="outline"
      size="sm"
      class="w-32 flex-1 justify-between"
    >
      <div class="flex items-center gap-1">
        <UIcon name="i-heroicons-view-columns" class="h-4 w-4" />
        Spalten
      </div>
      <UIcon
        name="i-heroicons-chevron-down-20-solid"
        class="h-4 w-4 text-neutral-400 transition-transform dark:text-neutral-500"
        :class="[open && 'rotate-180 transform']"
      />
    </UButton>
  </UDropdownMenu>
</template>
