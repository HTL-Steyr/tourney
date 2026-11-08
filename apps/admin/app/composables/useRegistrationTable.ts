import type { TableColumn } from "@nuxt/ui/components/Table.vue"
import type { Enums, RegistrationColumn } from "@tourney/types"

export const useRegistrationTable = (
  onUpdate: (status: Enums<"registration_status">) => void,
  onCopyLink: (row: RegistrationColumn) => void,
  onEdit: (row: RegistrationColumn) => void,
  onInfo: (row: RegistrationColumn) => void,
  onDelete: () => void,
) => {
  const columns: TableColumn<RegistrationColumn>[] = [
    {
      id: "select",
      header: "",
      enableSorting: false,
      enableHiding: false,
      meta: {
        class: {
          th: "w-12 px-2",
          td: "w-12 px-2",
        },
      },
    },
    {
      accessorKey: "name",
      header: "Name",
      enableSorting: true,
    },
    {
      accessorKey: "class",
      header: "Klasse",
      enableSorting: true,
    },
    {
      id: "date",
      accessorFn: (row: RegistrationColumn) => row.expire_date,
      header: "Ablaufdatum",
      enableSorting: true,
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: true,
    },
    {
      accessorKey: "allow_class_mixing",
      header: "Mischung",
      enableSorting: true,
    },
    {
      id: "actions",
      header: "Aktionen",
      enableSorting: false,
      enableHiding: false,
      meta: {
        class: {
          th: "w-16",
          td: "w-16",
        },
      },
    },
  ]

  const actions = [
    [
      {
        key: "in_progress",
        label: "Ausstehend",
        icon: "i-heroicons-arrow-path",
        onSelect: () => onUpdate("Ausstehend"),
      },
    ],
    [
      {
        key: "submitted",
        label: "Abgesendet",
        icon: "i-heroicons-envelope",
        onSelect: () => onUpdate("Abgesendet"),
      },
    ],
    [
      {
        key: "completed",
        label: "Abgeschlossen",
        icon: "i-heroicons-check",
        onSelect: () => onUpdate("Abgeschlossen"),
      },
    ],
    [
      {
        key: "discarded",
        label: "Abgelehnt",
        icon: "i-heroicons-no-symbol",
        onSelect: () => onUpdate("Abgelehnt"),
      },
    ],
  ]

  const items = (row: RegistrationColumn) =>
    ref([
      [
        {
          label: "Link kopieren",
          icon: "i-heroicons-clipboard-document-check",
          onSelect: () => onCopyLink(row),
        },
        {
          label: "Editieren",
          icon: "i-heroicons-pencil-square-20-solid",
          onSelect: () => onEdit(row),
        },
        {
          label: "Info",
          icon: "i-heroicons-information-circle",
          onSelect: () => onInfo(row),
        },
      ],
      [
        {
          label: "Löschen",
          icon: "i-heroicons-trash",
          onSelect: () => onDelete(),
        },
      ],
    ])

  const tabItems = [
    {
      slot: "multiple",
      key: "multiple",
      label: "Mehrfach",
      icon: "i-heroicons-rectangle-stack",
      description: "Anmeldungen für alle Klassen erstellen.",
    },
    {
      slot: "single",
      key: "single",
      label: "Einzel",
      icon: "i-heroicons-document",
      description: "Anmeldung für eine Klasse erstellen.",
    },
  ]

  return {
    columns,
    items,
    actions,
    tabItems,
  }
}
