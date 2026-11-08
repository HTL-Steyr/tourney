<script setup lang="ts">
import type { Tables } from "@tourney/types"
import { z } from "zod"

const title = ref<string>("Klassenverwaltung")
useHead({
  title: () => title.value,
})

const years = Array.from(
  { length: 11 },
  (_, i) =>
    `${new Date().getFullYear() + i - 1}/${(new Date().getFullYear() + i).toString().slice(2)}`,
)
const selectedYear = ref<string>(years[0] ?? "")
const encodedYear = computed(() => encodeURIComponent(selectedYear.value))

watch(selectedYear, () => {
  selectedRows.value = []
})

const {
  data,
  refresh: refreshClasses,
  status,
} = await useFetch<
  {
    id: string
    name: string
    year: string
  }[]
>(() => `/api/classes/${encodedYear.value}`, {
  transform: (item) => {
    if (!item) return []
    return item.map((item) => ({
      id: item.id,
      name: item.name,
      year: item.year,
    }))
  },
})

type ClassColumn = {
  id: string
  name: string
  year: string
}

const selectedRows = ref<ClassColumn[]>([])
function select(row: ClassColumn) {
  const index = selectedRows.value.findIndex((item) => item.id === row.id)
  if (index === -1) {
    selectedRows.value.push(row)
  } else {
    selectedRows.value.splice(index, 1)
  }
}

const search = ref<string>("")
const tableData = computed(() => data.value || [])
const filteredRows = computed(() => {
  if (!search.value) {
    return tableData.value
  }
  return tableData.value.filter((item) => {
    return Object.values(item).some((value) => {
      return String(value).toLowerCase().includes(search.value.toLowerCase())
    })
  })
})

const isOpenDelete = ref<boolean>(false)
const isOpenEdit = ref<boolean>(false)
const isOpenCreate = ref<boolean>(false)
const isOpenMultipleCreate = ref<boolean>(false)
const isOpenInfo = ref<boolean>(false)
const selectedClass = ref<ClassColumn | null>(null)

const { data: yearClasses, refresh: refreshYearClasses } = await useFetch<
  {
    id: string
    name: string
    year: string
  }[]
>(() => `/api/classes/${encodedYear.value}`, {
  watch: [selectedYear],
})

const creationSchemaSingle = z.object({
  name: z.string().min(1, "Klassenname ist erforderlich"),
  year: z.string(),
})

const creationStateSingle = reactive({
  name: "",
  year: selectedYear.value,
})

const resetCreateSingleState = () => {
  creationStateSingle.name = ""
  creationStateSingle.year = selectedYear.value
}

const predefinedClasses = ref([
  "1AHITN",
  "2AHITN",
  "3AHITN",
  "4AHITN",
  "1AHEL",
  "2AHEL",
  "3AHEL",
  "4AHEL",
  "1AHME",
  "2AHME",
  "3AHME",
  "4AHME",
  "1BHME",
  "2BHME",
  "3BHME",
  "4BHME",
  "1AHMBZ",
  "2AHMBZ",
  "3AHMBZ",
  "4AHMBZ",
  "1BHMBZ",
  "2BHMBZ",
  "3BHMBZ",
  "4BHMBZ",
  "1YHKUG",
  "2YHKUG",
  "3YHKUG",
  "4YHKUG",
  "1YHKUJ",
  "2YHKUJ",
  "3YHKUJ",
  "4YHKUJ",
  "1YHKUP",
  "2YHKUP",
  "3YHKUP",
  "4YHKUP",
  "1AFMBZ",
  "2AFMBZ",
  "3AFMBZ",
  "4AFMBZ",
])

const creationSchemaMultiple = z.object({
  classes: z.array(z.string()).min(1, "Mindestens eine Klasse"),
  year: z.string(),
})

const creationStateMultiple = reactive({
  classes: [...predefinedClasses.value],
  year: selectedYear.value,
})

const customClassName = ref<string>("")
const resetCreateMultipleState = () => {
  creationStateMultiple.classes = [...predefinedClasses.value]
  creationStateMultiple.year = selectedYear.value
  customClassName.value = ""
}

const addCustomClass = () => {
  if (
    customClassName.value.trim() &&
    !creationStateMultiple.classes.includes(customClassName.value.trim())
  ) {
    creationStateMultiple.classes.push(customClassName.value.trim())
    customClassName.value = ""
  }
}

const removeClass = (className: string) => {
  const index = creationStateMultiple.classes.indexOf(className)
  if (index !== -1) {
    creationStateMultiple.classes.splice(index, 1)
  }
}

const editSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Klassenname ist erforderlich"),
  year: z.string(),
})

const editState = reactive({
  id: "",
  name: "",
  year: "",
})

const resetEditState = () => {
  editState.id = ""
  editState.name = ""
  editState.year = ""
}

const onSubmitCreateSingle = async () => {
  try {
    creationSchemaSingle.parse(creationStateSingle)
    await $fetch("/api/classes/create/single", {
      method: "POST",
      body: creationStateSingle,
    })
    isOpenCreate.value = false
    await refreshClasses()
    await refreshYearClasses()
    displaySuccessNotification(
      "Klasse erstellt",
      "Die Klasse wurde erfolgreich erstellt.",
    )
  } catch (err) {
    console.error(err)
    displayFailureNotification(
      "Fehler beim Erstellen",
      "Die Klasse konnte nicht erstellt werden.",
    )
  }
}

const onSubmitCreateMultiple = async () => {
  try {
    creationSchemaMultiple.parse(creationStateMultiple)
    await $fetch("/api/classes/create/multiple", {
      method: "POST",
      body: creationStateMultiple,
    })
    isOpenMultipleCreate.value = false
    await refreshClasses()
    await refreshYearClasses()
    displaySuccessNotification(
      "Klassen erstellt",
      "Die Klassen wurden erfolgreich erstellt.",
    )
  } catch (err) {
    console.error(err)
    displayFailureNotification(
      "Fehler beim Erstellen",
      "Die Klassen konnten nicht erstellt werden.",
    )
  }
}

const onInfo = (row: ClassColumn) => {
  selectedClass.value = row
  isOpenInfo.value = true
}

const onEdit = async (row: Tables<"class">) => {
  isOpenEdit.value = true
  editState.id = row.id
  editState.name = row.name
  editState.year = row.year
}

const onSubmitEdit = async () => {
  try {
    editSchema.parse(editState)
    await $fetch("/api/classes/update", {
      method: "PUT",
      body: editState,
    })
    isOpenEdit.value = false
    await refreshClasses()
    await refreshYearClasses()
    displaySuccessNotification(
      "Klasse aktualisiert",
      "Die Klasse wurde erfolgreich aktualisiert.",
    )
  } catch (err) {
    console.error(err)
    displayFailureNotification(
      "Fehler beim Aktualisieren",
      "Die Klasse konnte nicht aktualisiert werden.",
    )
  }
}

watch(selectedYear, (value) => {
  if (!isOpenCreate.value) {
    creationStateSingle.year = value
  }

  if (!isOpenMultipleCreate.value) {
    creationStateMultiple.year = value
  }
})

watch(isOpenCreate, (isOpen) => {
  if (isOpen) return

  resetCreateSingleState()
})

watch(isOpenMultipleCreate, (isOpen) => {
  if (isOpen) return

  resetCreateMultipleState()
})

watch(isOpenEdit, (isOpen) => {
  if (isOpen) return

  resetEditState()
})

const classIds = computed(() => selectedRows.value.map((row) => row.id))
const onDeleteClick = (row?: ClassColumn) => {
  if (row) {
    selectedRows.value = [row]
  }
  isOpenDelete.value = true
}

const onDelete = async () => {
  try {
    await $fetch("/api/classes/delete", {
      method: "DELETE",
      body: classIds.value,
    })
    isOpenDelete.value = false
    selectedRows.value = []
    await refreshClasses()
    await refreshYearClasses()
    displaySuccessNotification(
      "Klassen gelöscht",
      "Die Klassen wurden erfolgreich gelöscht.",
    )
  } catch (err) {
    console.error(err)
    displayFailureNotification(
      "Fehler beim Löschen",
      "Die Klassen konnten nicht gelöscht werden.",
    )
  }
}

const { columns, items } = useClassTable(onEdit, onInfo, onDeleteClick)
const refresh = async () => {
  await refreshClasses()
  await refreshYearClasses()
  displaySuccessNotification(
    "Daten aktualisiert",
    "Die Daten wurden aktualisiert.",
  )
}
</script>

<template>
  <BasePageHeader :title="title">
    <ToolbarContainer>
      <SearchInput v-model="search" placeholder="Klasse suchen..." />
      <USelect
        v-model="selectedYear"
        :items="years"
        placeholder="Schuljahr auswählen"
        size="sm"
        class="min-w-36"
      />
      <UButton
        icon="i-heroicons-arrow-path"
        color="neutral"
        variant="outline"
        size="sm"
        square
        @click="refresh"
      />
      <UButton
        size="sm"
        variant="soft"
        @click="isOpenCreate = true"
        label="Neue Klasse..."
      />
      <UButton
        size="sm"
        variant="soft"
        @click="isOpenMultipleCreate = true"
        label="Mehrere Klassen..."
      />
      <UButton
        v-if="selectedRows.length > 1"
        size="sm"
        color="error"
        variant="soft"
        @click="isOpenDelete = true"
        label="Löschen..."
      />
      <ModalCreate
        title="Neue Klasse"
        v-model="isOpenCreate"
        @create="onSubmitCreateSingle"
      >
        <div class="space-y-4">
          <UFormField label="Schuljahr">
            <USelect
              v-model="creationStateSingle.year"
              :items="years"
              placeholder="Schuljahr auswählen"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Klassenname">
            <UInput
              v-model="creationStateSingle.name"
              placeholder="z.B. 1AHITN"
            />
          </UFormField>
        </div>
      </ModalCreate>

      <ModalCreate
        title="Mehrere Klassen erstellen"
        v-model="isOpenMultipleCreate"
        @create="onSubmitCreateMultiple"
      >
        <div class="space-y-4">
          <div class="flex items-center justify-between gap-3">
            <UFormField label="Schuljahr" class="grow">
              <USelect
                v-model="creationStateMultiple.year"
                :items="years"
                placeholder="Schuljahr auswählen"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Neue Klasse hinzufügen">
              <div class="flex gap-2">
                <UInput
                  v-model="customClassName"
                  placeholder="z.B. 1AHITN"
                  @keyup.enter="addCustomClass"
                />
                <UButton
                  icon="i-heroicons-plus"
                  variant="soft"
                  @click="addCustomClass"
                />
              </div>
            </UFormField>
          </div>

          <UFormField label="Klassen">
            <div
              class="max-h-60 overflow-y-auto rounded border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
            >
              <div
                v-for="className in creationStateMultiple.classes"
                :key="className"
                class="group flex items-center justify-between border-b border-neutral-200 px-2 py-1 dark:border-neutral-700"
              >
                <span>{{ className }}</span>
                <UButton
                  icon="i-heroicons-x-mark"
                  color="error"
                  variant="ghost"
                  size="sm"
                  @click="removeClass(className)"
                />
              </div>
            </div>
          </UFormField>
        </div>
      </ModalCreate>

      <ModalEdit
        title="Klasse bearbeiten"
        v-model="isOpenEdit"
        @edit="onSubmitEdit"
      >
        <div class="space-y-4">
          <UFormField label="Schuljahr">
            <USelect
              v-model="editState.year"
              :items="years"
              placeholder="Schuljahr auswählen"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Klassenname">
            <UInput v-model="editState.name" placeholder="z.B. 10a" />
          </UFormField>
        </div>
      </ModalEdit>

      <ModalInfo v-model="isOpenInfo">
        <div class="space-y-4">
          <pre
            class="overflow-auto rounded bg-neutral-100 p-4 dark:bg-neutral-800"
            >{{ selectedClass }}</pre
          >
        </div>
      </ModalInfo>

      <ModalDelete v-model="isOpenDelete" @delete="onDelete">
        <div class="space-y-4">
          <p>
            Sind Sie sicher, dass Sie
            <strong>{{ selectedRows.length }}</strong> Klasse(n) löschen
            möchten?
          </p>
          <UAlert
            icon="i-heroicons-exclamation-triangle"
            color="error"
            variant="soft"
            title="Achtung"
            description="Diese Aktion kann nicht rückgängig gemacht werden. Alle Verknüpfungen zu dieser Klasse werden ebenfalls gelöscht."
          />
        </div>
      </ModalDelete>
    </ToolbarContainer>
  </BasePageHeader>
  <BasePageContent>
    <div class="h-full overflow-auto pb-1">
      <template v-if="yearClasses && yearClasses.length > 0">
        <UTable
          :data="filteredRows"
          :columns="columns"
          :sorting="[{ id: 'name', desc: false }]"
          :loading="status === 'pending'"
          class="h-full w-full bg-white dark:bg-neutral-900"
          :ui="{
            root: 'relative overflow-auto',
            th: 'px-4 py-3',
            td: 'max-w-[0] truncate py-2',
          }"
          @select="(_, row) => select(row.original)"
        >
          <template #actions-cell="{ row }">
            <div class="flex items-center gap-2">
              <UDropdownMenu :items="items(row.original).value">
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-heroicons-ellipsis-horizontal-20-solid"
                  size="sm"
                  square
                  @click.stop
                />
              </UDropdownMenu>
            </div>
          </template>
          <template #empty-state>
            <EmptyState
              v-model="search"
              title="Keine Klassen gefunden"
              description="Schulklassen für das ausgewählte Schuljahr wurden nicht gefunden."
            />
          </template>
        </UTable>
      </template>
      <template v-else>
        <EmptyState
          title="Keine Klassen gefunden"
          description="Schulklassen für das ausgewählte Schuljahr wurden nicht gefunden."
        />
      </template>
    </div>
  </BasePageContent>
</template>
