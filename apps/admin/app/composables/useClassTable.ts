import type { TableColumn } from "@nuxt/ui/components/Table.vue"

export type ClassColumn = {
  id: string
  name: string
  year: string
}

export const useClassTable = (
  onEdit: (row: ClassColumn) => void,
  onInfo: (row: ClassColumn) => void,
  onDelete: (row: ClassColumn) => void,
) => {
  const columns: TableColumn<ClassColumn>[] = [
    {
      accessorKey: "name",
      header: "Klasse",
      enableSorting: true,
    },
    {
      accessorKey: "year",
      header: "Schuljahr",
    },
    {
      id: "actions",
      header: "Aktionen",
    },
  ]

  const items = (row: ClassColumn) =>
    ref([
      [
        {
          label: "Info",
          icon: "i-heroicons-information-circle",
          onSelect: () => onInfo(row),
        },
        {
          label: "Editieren",
          icon: "i-heroicons-pencil-square-20-solid",
          onSelect: () => onEdit(row as ClassColumn),
        },
      ],
      [
        {
          label: "Löschen",
          icon: "i-heroicons-trash",
          onSelect: () => onDelete(row),
        },
      ],
    ])

  return {
    columns,
    items,
  }
}
