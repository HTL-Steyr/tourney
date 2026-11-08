<script setup lang="ts">
import { z } from "zod"
import type { RowSelectionState } from "@tanstack/vue-table"
import type {
  Enums,
  Link,
  LinkGroup,
  RegistrationColumn,
  Tables,
} from "@tourney/types"
import { useDateFormat } from "@vueuse/core"

const title = ref<string>("Anmeldung")
useHead({
  title: () => title.value,
})

const { data, status, refresh } = await useFetch("/api/registrations", {
  transform: (item) => {
    if (!item) return []
    return item.map((item) => ({
      id: item.id,
      name: item.name,
      class: item.class?.name,
      expire_date: item.expire_date,
      status: item.status,
      allow_class_mixing: item.allow_class_mixing,
    }))
  },
})

const search = ref<string>("")
const tableData = computed(() => data.value || [])
const rowSelection = ref<RowSelectionState>({})
const selectedRows = computed(() =>
  tableData.value.filter((row) => Boolean(rowSelection.value[row.id])),
)

async function copyTextToClipboard(text: string) {
  if (!import.meta.client) {
    return false
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return true
  }

  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.setAttribute("readonly", "")
  textarea.style.position = "absolute"
  textarea.style.left = "-9999px"
  document.body.appendChild(textarea)

  const selection = document.getSelection()
  const previousRange =
    selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null

  textarea.select()
  const copied = document.execCommand("copy")
  document.body.removeChild(textarea)

  if (selection && previousRange) {
    selection.removeAllRanges()
    selection.addRange(previousRange)
  }

  return copied
}

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

const sort = ref([{ id: "status", desc: false }])
const sortableHeaderButtonClass =
  "flex items-center gap-1 font-medium text-neutral-700 transition-colors hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white"

function getSortIcon(column: { getIsSorted: () => false | "asc" | "desc" }) {
  const direction = column.getIsSorted()

  if (direction === "asc") {
    return "i-heroicons-chevron-up"
  }

  if (direction === "desc") {
    return "i-heroicons-chevron-down"
  }

  return "i-heroicons-arrows-up-down"
}

const isOpenDelete = ref<boolean>(false)
const isOpenEdit = ref<boolean>(false)
const isOpenCreate = ref<boolean>(false)
const isOpenInfo = ref<boolean>(false)
const isOpenLinks = ref<boolean>(false)

const years = Array.from(
  { length: 11 },
  (_, i) =>
    `${new Date().getFullYear() + i - 1}/${(new Date().getFullYear() + i).toString().slice(2)}`,
)
const getDefaultClassYear = () => years[0] ?? ""
const classYear = ref<string>(getDefaultClassYear())
const encodedYear = computed(() => encodeURIComponent(classYear.value))

const { data: classes } = await useFetch<
  {
    id: string
    name: string
    year: string
  }[]
>(() => `/api/classes/${encodedYear.value}`, {
  watch: [classYear],
})

const creationSchemaMultiple = z.object({
  expire_date: z.string().date(),
  teams: z.number().min(1, "Mindestens ein Team pro Klasse").default(1),
  year: z.string(),
})

const creationStateMultiple = reactive({
  expire_date: undefined,
  teams: 1,
  year: classYear.value,
})

const resetCreateMultipleState = () => {
  creationStateMultiple.expire_date = undefined
  creationStateMultiple.teams = 1
  creationStateMultiple.year = classYear.value
}

const onSubmitCreateMultiple = async () => {
  try {
    creationSchemaMultiple.parse(creationStateMultiple)
    await $fetch("/api/registrations/create/multiple", {
      method: "POST",
      body: creationStateMultiple,
    })
    isOpenCreate.value = false
    await refresh()
    displaySuccessNotification(
      "Anmeldungen erstellt",
      "Die Anmeldungen wurden erfolgreich erstellt.",
    )
  } catch (err) {
    console.error(err)
    displayFailureNotification(
      "Fehler beim Erstellen",
      "Die Anmeldungen konnte nicht erstellt werden.",
    )
  }
}

const creationSchemaSingle = z.object({
  expire_date: z.string().date(),
  name: z.string(),
  schoolClass: z.custom<Tables<"class">>(),
  year: z.string(),
  allow_class_mixing: z.boolean().optional(),
})

const creationStateSingle = reactive({
  expire_date: undefined,
  name: "Team 1",
  year: classYear.value,
  schoolClass: undefined,
  allow_class_mixing: false,
})

const resetCreateSingleState = () => {
  creationStateSingle.expire_date = undefined
  creationStateSingle.name = "Team 1"
  creationStateSingle.year = classYear.value
  creationStateSingle.schoolClass = undefined
  creationStateSingle.allow_class_mixing = false
}

const resetCreateForms = () => {
  classYear.value = getDefaultClassYear()
  currentTab.value = "multiple"
  resetCreateMultipleState()
  resetCreateSingleState()
}

const onSubmitCreateSingle = async () => {
  try {
    creationSchemaSingle.parse(creationStateSingle)
    await $fetch("/api/registrations/create/single", {
      method: "POST",
      body: creationStateSingle,
    })
    isOpenCreate.value = false
    await refresh()
    displaySuccessNotification(
      "Anmeldung erstellt",
      "Die Anmeldung wurden erfolgreich erstellt.",
    )
  } catch (err) {
    console.error(err)
    displayFailureNotification(
      "Fehler beim Erstellen",
      "Die Anmeldung konnte nicht erstellt werden.",
    )
  }
}

const registrationIds = computed(() => selectedRows.value.map((row) => row.id))
const onDelete = async () => {
  try {
    await $fetch("/api/registrations/delete", {
      method: "DELETE",
      body: registrationIds.value,
    })
    isOpenDelete.value = false
    rowSelection.value = {}
    await refresh()
    displaySuccessNotification(
      "Anmeldungen gelöscht",
      "Die Anmeldungen wurden erfolgreich gelöscht.",
    )
  } catch (err) {
    console.error(err)
    displayFailureNotification(
      "Fehler beim Löschen",
      "Die Anmeldungen konnten nicht gelöscht werden.",
    )
  }
}

const onUpdate = async (status: Enums<"registration_status">) => {
  try {
    const rowsToRevert = selectedRows.value.filter(
      (row) => row.status !== "Ausstehend" && status === "Ausstehend",
    )
    if (rowsToRevert.length > 0) {
      await $fetch("/api/registrations/update/revert", {
        method: "PUT",
        body: { registrations: rowsToRevert.map((row) => row.id) },
      })
    }
    await $fetch("/api/registrations/update", {
      method: "PUT",
      body: { registrations: registrationIds.value, status: status },
    })
    rowSelection.value = {}
    await refresh()
    displaySuccessNotification(
      "Anmeldungen aktualisiert",
      "Die Anmeldungen wurden erfolgreich aktualisiert.",
    )
  } catch (err) {
    const error = err as Error
    console.error(error)
    displayFailureNotification(
      "Fehler beim Aktualisieren",
      "Die Anmeldungen konnten nicht aktualisiert werden.",
    )
  }
}

const config = useRuntimeConfig()
const onCopyLink = async (row: RegistrationColumn) => {
  const source: string = `${config.public.clientUrl}/registrations/${row.id}`
  const copied = await copyTextToClipboard(source)

  copied
    ? displaySuccessNotification("Link kopiert", source)
    : displayFailureNotification(
        "Fehler beim Kopieren",
        "Ihr Browser unterstützt das Kopieren nicht.",
      )
}

const editSchema = z.object({
  id: z.string(),
  expire_date: z.string().date(),
  name: z.string().trim().min(1, "Name ist erforderlich"),
  allow_class_mixing: z.boolean(),
  class: z.string(),
})

const editState = reactive({
  id: "",
  expire_date: "",
  name: "",
  allow_class_mixing: false,
  class: "",
})

const resetEditState = () => {
  editState.id = ""
  editState.expire_date = ""
  editState.name = ""
  editState.allow_class_mixing = false
  editState.class = ""
}

const onEdit = async (row: RegistrationColumn) => {
  isOpenEdit.value = true

  editState.id = row.id
  editState.expire_date = row.expire_date
  editState.name = row.name
  editState.allow_class_mixing = row.allow_class_mixing
  editState.class = row.class
}

const infoDisplay = ref<RegistrationColumn>()
const onInfo = async (row: RegistrationColumn) => {
  isOpenInfo.value = true
  infoDisplay.value = row
}

const onSubmitEdit = async () => {
  try {
    const values = editSchema.parse(editState)
    await $fetch("/api/registrations/edit", {
      method: "PUT",
      body: values,
    })
    isOpenEdit.value = false
    await refresh()
    displaySuccessNotification(
      "Editiert",
      "Die Anmeldung wurde erfolgreich editiert.",
    )
  } catch (err) {
    console.error(err)
    displayFailureNotification(
      "Fehler beim Editieren",
      "Die Anmeldung konnte nicht editiert werden.",
    )
  }
}

const linksSchema = z.object({
  active: z.boolean().optional(),
  beginning: z.string().optional(),
  end: z.string().optional(),
})

const linksState = reactive({
  active: false,
  beginning: "",
  end: "",
})

const links = ref<LinkGroup>({})
const teamLinkNameCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
})

const groupLinks = () => {
  const groupedLinks = selectedRows.value.reduce((acc, row) => {
    const { class: className, name, id } = row
    const url: string = `${config.public.clientUrl}/registrations/${id}`

    if (!acc[className]) {
      acc[className] = { links: [], sent: false }
    }

    acc[className].links.push({ name, url, class: className })
    return acc
  }, {} as LinkGroup)

  Object.values(groupedLinks).forEach((group) => {
    group.links.sort((a, b) => teamLinkNameCollator.compare(a.name, b.name))
  })

  return groupedLinks
}

const generateLinks = () => {
  links.value = groupLinks()
  isOpenLinks.value = true
}

const onCopyEmail = async (classLinks: { links: Link[]; sent: boolean }) => {
  let source: string
  const linkText = classLinks.links
    .map((link) => `${link.name}\n${link.url}`)
    .join("\n\n")
  if (linksState.active) {
    source =
      `${linksState.beginning}\n\n${linkText}\n\n${linksState.end}`.trim()
  } else {
    source = linkText
  }
  const copied = await copyTextToClipboard(source)
  const description =
    source.length > 150
      ? `${source.slice(0, 150)}\n... (Nachricht gekürzt)`
      : source

  copied
    ? displaySuccessNotification("E-Mail kopiert", description)
    : displayFailureNotification(
        "Fehler beim Kopieren",
        "Ihr Browser unterstützt das Kopieren nicht.",
      )
}

const refreshTable = () => {
  refresh()
  displaySuccessNotification("Aktualisiert", "Die Tabelle wurde aktualisiert.")
}

const { items, actions, columns, tabItems } = useRegistrationTable(
  onUpdate,
  onCopyLink,
  onEdit,
  onInfo,
  onDelete,
)

const columnVisibility = ref({})

type TabKey = "multiple" | "single"
const currentTab = ref<TabKey>((tabItems[0]?.key as TabKey) ?? "multiple")

watch(classYear, (value) => {
  creationStateMultiple.year = value
  creationStateSingle.year = value
})

watch(isOpenCreate, (isOpen) => {
  if (isOpen) return

  resetCreateForms()
})

watch(isOpenEdit, (isOpen) => {
  if (isOpen) return

  resetEditState()
})

const onSubmitCreate = async () => {
  if (currentTab.value === "multiple") {
    await onSubmitCreateMultiple()
  } else {
    await onSubmitCreateSingle()
    currentTab.value = "multiple"
  }
}
</script>

<template>
  <BasePageHeader :title="title">
    <ToolbarContainer>
      <ModalDelete v-model="isOpenDelete" @delete="onDelete">
        <p>
          Möchten Sie wirklich
          <strong>{{ selectedRows.length }}</strong> Anmeldungen löschen?
        </p>
      </ModalDelete>

      <SearchInput v-model="search" />

      <template v-if="selectedRows.length > 1">
        <UButton
          @click="isOpenDelete = true"
          icon="i-heroicons-trash"
          variant="soft"
          color="error"
          size="sm"
          label="Löschen..."
        />
        <UButton
          label="Links exportieren"
          icon="i-heroicons-arrow-up-on-square"
          @click="generateLinks"
          color="neutral"
          variant="outline"
          size="sm"
        />
      </template>

      <UDropdownMenu v-if="selectedRows.length > 0" :items="actions">
        <UButton
          icon="i-heroicons-chevron-down"
          trailing
          color="neutral"
          variant="outline"
          size="sm"
          label="Markieren als"
        />
      </UDropdownMenu>

      <ColumnsDropdown :columns="columns" v-model="columnVisibility" />

      <UButton
        icon="i-heroicons-arrow-path"
        variant="outline"
        color="neutral"
        size="sm"
        square
        @click="refreshTable"
      />

      <UButton
        variant="soft"
        size="sm"
        @click="isOpenCreate = true"
        label="Neue Anmeldung..."
      />

      <!-- Link Modal -->
      <UModal
        v-model:open="isOpenLinks"
        :ui="{ content: 'w-full overflow-hidden sm:max-w-5xl sm:max-h-[90vh]' }"
        prevent-close
      >
        <template #content>
          <UCard
            :ui="{
              root: 'flex max-h-[90vh] flex-col divide-y divide-neutral-100 overflow-hidden dark:divide-neutral-800',
              body: 'flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-5 sm:p-6',
              header: 'px-4 py-3 sm:px-6',
              footer: 'px-4 py-3 sm:px-6',
            }"
          >
            <template #header>
              <strong> Export </strong>
            </template>

            <div class="space-y-1">
              <strong>Anleitung</strong>
              <p>
                Die ausgewählten Anmeldungen wurden nach Klasse gruppiert.
                Kopieren Sie den Textinhalt pro Klasse und verschicken Sie
                diesen per Mail an die Klassenmail (z.b.
                <code>1ahitn@htl-steyr.ac.at</code> ).
              </p>
            </div>
            <div
              class="mt-3 grid min-h-0 flex-1 gap-3 overflow-hidden lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]"
            >
              <div class="flex min-h-0 flex-col gap-1 overflow-hidden">
                <strong>Klassenlinks</strong>
                <div
                  class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-neutral-200 shadow-sm dark:border-neutral-800"
                >
                  <ul class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    <li
                      v-for="[className, classLinks] in Object.entries(links)"
                      :key="className"
                      class="border-b border-neutral-200 p-4 last:border-b-0 dark:border-neutral-800"
                    >
                      <div class="flex w-full flex-col gap-3">
                        <div class="flex items-center gap-2">
                          <strong class="text-lg">{{ className }}</strong>
                          <UIcon
                            v-if="classLinks.sent"
                            name="i-heroicons-check-circle"
                            class="text-green-500"
                            size="24"
                          />
                        </div>
                        <ul
                          class="space-y-1 rounded-md bg-neutral-100 p-3 shadow-sm dark:bg-neutral-800"
                        >
                          <li
                            v-for="link in classLinks.links"
                            :key="link.url"
                            class="min-w-0"
                          >
                            <p class="truncate text-xs">
                              <!-- Ugly hack but client wants it #220 -->
                              {{ link.name.replace("Team", "Bewerb") }}
                            </p>
                            <code class="block overflow-x-auto text-xs">{{
                              link.url
                            }}</code>
                          </li>
                        </ul>
                        <div class="flex items-center justify-between gap-3">
                          <UButton
                            color="neutral"
                            variant="outline"
                            size="sm"
                            icon="i-heroicons-clipboard-document-check"
                            label="Kopieren"
                            @click="onCopyEmail(classLinks)"
                          />
                          <UButton
                            variant="soft"
                            color="success"
                            size="sm"
                            icon="i-heroicons-check"
                            label="Abgesendet"
                            @click="classLinks.sent = !classLinks.sent"
                          />
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
              <div class="flex min-h-0 flex-col gap-1">
                <strong>Einstellungen</strong>
                <div
                  class="flex h-full min-h-0 flex-col overflow-y-auto rounded-md border border-neutral-200 p-3 shadow-sm dark:border-neutral-800"
                >
                  <UForm
                    :state="linksState"
                    :schema="linksSchema"
                    class="flex h-full min-h-0 flex-col space-y-3"
                  >
                    <div
                      class="flex items-start justify-between gap-3 rounded-md bg-neutral-50 p-3 dark:bg-neutral-800"
                    >
                      <div class="min-w-0">
                        <p
                          class="text-sm font-medium text-neutral-900 dark:text-white"
                        >
                          Aktivieren
                        </p>
                        <p
                          class="text-xs text-neutral-500 dark:text-neutral-400"
                        >
                          Fügt Einleitung und Abschlusstext zur Nachricht hinzu.
                        </p>
                      </div>
                      <USwitch v-model="linksState.active" class="shrink-0" />
                    </div>
                    <UFormField label="Einleitungstext">
                      <UTextarea
                        placeholder="Liebe Schülerinnen und Schüler, ..."
                        color="neutral"
                        :rows="6"
                        v-model="linksState.beginning"
                        :disabled="!linksState.active"
                        class="w-full"
                      />
                    </UFormField>
                    <UFormField label="Abschlusstext">
                      <UTextarea
                        placeholder="Mit freundlichen Grüßen"
                        color="neutral"
                        :rows="5"
                        v-model="linksState.end"
                        :disabled="!linksState.active"
                        class="w-full"
                      />
                    </UFormField>
                  </UForm>
                </div>
              </div>
            </div>

            <template #footer>
              <UButton
                color="neutral"
                variant="outline"
                size="sm"
                @click="isOpenLinks = false"
                label="Fertig"
              />
            </template>
          </UCard>
        </template>
      </UModal>

      <ModalCreate
        title="Neue Anmeldung"
        v-model="isOpenCreate"
        @create="onSubmitCreate"
        modal-width="sm:max-w-md"
      >
        <UTabs
          v-model="currentTab"
          :items="tabItems"
          value-key="key"
          class="w-full"
          :ui="{ list: 'h-9', trigger: 'h-7' }"
        >
          <template #multiple>
            <UForm
              :schema="creationSchemaMultiple"
              :state="creationStateMultiple"
              class="space-y-4 pt-2"
              @submit="onSubmitCreateMultiple"
            >
              <UFormField
                label="Teams"
                name="teams"
                description="Anzahl an Anmeldungen für jede Klasse."
                required
              >
                <UInput
                  v-model="creationStateMultiple.teams"
                  type="number"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Klassen"
                name="classes"
                class="grow"
                description="Für diese Klassen wird ein Link generiert."
              >
                <ul
                  class="h-40 w-full overflow-y-scroll rounded-md border border-neutral-200 shadow-sm dark:border-neutral-800"
                >
                  <template v-if="classes?.length">
                    <li
                      v-for="schoolClass in classes"
                      :key="schoolClass.name"
                      class="flex justify-between border-b border-neutral-200 p-2 px-4 dark:border-neutral-800"
                    >
                      <p>{{ schoolClass.name }}</p>
                      <p>{{ schoolClass.year }}</p>
                    </li>
                  </template>
                  <template v-else>
                    <div class="flex h-full w-full items-center justify-center">
                      <p class="text-sm text-neutral-500 dark:text-neutral-400">
                        Keine Klassen für {{ classYear }} gefunden.
                      </p>
                    </div>
                  </template>
                </ul>
              </UFormField>

              <UFormField label="Datensatz">
                <USelect v-model="classYear" :items="years" class="w-full" />
              </UFormField>

              <UFormField
                label="Ablaufdatum"
                name="date"
                description="An diesem Datum werden die Anmeldungen automatisch geschlossen."
                required
              >
                <UInput
                  v-model="creationStateMultiple.expire_date"
                  type="date"
                  class="w-full"
                />
              </UFormField>
            </UForm>
          </template>

          <template #single>
            <UForm
              :schema="creationSchemaSingle"
              :state="creationStateSingle"
              class="space-y-4 pt-2"
              @submit="onSubmitCreateSingle"
            >
              <UFormField
                label="Name"
                name="name"
                description="Der Name der Anmeldung."
                required
              >
                <UInput v-model="creationStateSingle.name" class="w-full" />
              </UFormField>

              <UFormField
                label="Klasse"
                name="class"
                description="Die Klasse der Anmeldung."
                required
              >
                <USelectMenu
                  v-model="creationStateSingle.schoolClass"
                  placeholder="Klasse auswählen"
                  :items="classes ?? []"
                  label-key="name"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Datensatz">
                <USelect v-model="classYear" :items="years" class="w-full" />
              </UFormField>

              <UFormField
                label="Ablaufdatum"
                name="date"
                description="An diesem Datum wird die Anmeldung automatisch geschlossen."
                required
              >
                <UInput
                  v-model="creationStateSingle.expire_date"
                  type="date"
                  class="w-full"
                />
              </UFormField>

              <UFormField name="allow_class_mixing">
                <div
                  class="flex items-start justify-between gap-3 rounded-md bg-neutral-50 p-3 dark:bg-neutral-800"
                >
                  <div class="min-w-0">
                    <p
                      class="text-sm font-medium text-neutral-900 dark:text-white"
                    >
                      Klassenmischung erlauben
                    </p>
                    <p class="text-xs text-neutral-500 dark:text-neutral-400">
                      Schüler können sich in anderen Klassen anmelden.
                    </p>
                  </div>
                  <USwitch
                    v-model="creationStateSingle.allow_class_mixing"
                    class="shrink-0"
                  />
                </div>
              </UFormField>
            </UForm>
          </template>
        </UTabs>
      </ModalCreate>

      <ModalEdit
        v-model="isOpenEdit"
        modal-width="sm:max-w-md"
        @edit="onSubmitEdit"
      >
        <UForm
          :schema="editSchema"
          :state="editState"
          class="space-y-4"
          @submit="onSubmitEdit"
        >
          <UFormField label="Name" name="name">
            <UInput v-model="editState.name" class="w-full" />
          </UFormField>

          <UFormField
            label="Ablaufdatum"
            name="expire_date"
            description="An diesem Datum wird die Anmeldung automatisch geschlossen."
          >
            <UInput
              v-model="editState.expire_date"
              type="date"
              class="w-full"
            />
          </UFormField>

          <UFormField name="allow_class_mixing">
            <div
              class="flex items-start justify-between gap-3 rounded-md bg-neutral-50 p-3 dark:bg-neutral-800"
            >
              <div class="min-w-0">
                <p class="text-sm font-medium text-neutral-900 dark:text-white">
                  Klassenmischung erlauben
                </p>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                  Schüler können sich in anderen Klassen anmelden.
                </p>
              </div>
              <USwitch
                v-model="editState.allow_class_mixing"
                class="shrink-0"
              />
            </div>
          </UFormField>
        </UForm>
      </ModalEdit>

      <ModalInfo v-model="isOpenInfo">
        <pre>{{ infoDisplay }}</pre>
      </ModalInfo>
    </ToolbarContainer>
  </BasePageHeader>
  <BasePageContent>
    <UTable
      v-model:sorting="sort"
      v-model:row-selection="rowSelection"
      v-model:column-visibility="columnVisibility"
      sticky="header"
      :data="filteredRows"
      :columns="columns"
      :get-row-id="(row) => row.id"
      :enable-row-selection="true"
      :loading="status === 'pending'"
      class="h-full w-full bg-white dark:bg-neutral-900"
      :meta="{
        class: {
          tr: (row) =>
            row.getIsSelected()
              ? 'cursor-pointer bg-neutral-50 dark:bg-neutral-800/40'
              : 'cursor-pointer',
        },
      }"
      :ui="{
        root: 'relative overflow-auto',
        th: 'px-4 py-3',
        td: 'max-w-[0] truncate py-2',
      }"
      @select="(_, row) => row.toggleSelected()"
    >
      <template #select-header="{ table }">
        <UCheckbox
          class="ml-2"
          :model-value="
            table.getIsSomePageRowsSelected()
              ? 'indeterminate'
              : table.getIsAllPageRowsSelected()
          "
          @update:model-value="table.toggleAllPageRowsSelected(!!$event)"
        />
      </template>

      <template #name-header="{ column }">
        <button
          type="button"
          :class="sortableHeaderButtonClass"
          aria-label="Nach Name sortieren"
          @click="column.getToggleSortingHandler()?.($event)"
        >
          <span>Name</span>
          <UIcon
            :name="getSortIcon(column)"
            class="h-4 w-4 shrink-0 text-neutral-400 dark:text-neutral-500"
          />
        </button>
      </template>

      <template #class-header="{ column }">
        <button
          type="button"
          :class="sortableHeaderButtonClass"
          aria-label="Nach Klasse sortieren"
          @click="column.getToggleSortingHandler()?.($event)"
        >
          <span>Klasse</span>
          <UIcon
            :name="getSortIcon(column)"
            class="h-4 w-4 shrink-0 text-neutral-400 dark:text-neutral-500"
          />
        </button>
      </template>

      <template #date-header="{ column }">
        <button
          type="button"
          :class="sortableHeaderButtonClass"
          aria-label="Nach Ablaufdatum sortieren"
          @click="column.getToggleSortingHandler()?.($event)"
        >
          <span>Ablaufdatum</span>
          <UIcon
            :name="getSortIcon(column)"
            class="h-4 w-4 shrink-0 text-neutral-400 dark:text-neutral-500"
          />
        </button>
      </template>

      <template #status-header="{ column }">
        <button
          type="button"
          :class="sortableHeaderButtonClass"
          aria-label="Nach Status sortieren"
          @click="column.getToggleSortingHandler()?.($event)"
        >
          <span>Status</span>
          <UIcon
            :name="getSortIcon(column)"
            class="h-4 w-4 shrink-0 text-neutral-400 dark:text-neutral-500"
          />
        </button>
      </template>

      <template #allow_class_mixing-header="{ column }">
        <button
          type="button"
          :class="sortableHeaderButtonClass"
          aria-label="Nach Mischung sortieren"
          @click="column.getToggleSortingHandler()?.($event)"
        >
          <span>Mischung</span>
          <UIcon
            :name="getSortIcon(column)"
            class="h-4 w-4 shrink-0 text-neutral-400 dark:text-neutral-500"
          />
        </button>
      </template>

      <template #select-cell="{ row }">
        <UCheckbox
          class="ml-2"
          :model-value="row.getIsSelected()"
          @click.stop
          @update:model-value="row.toggleSelected(!!$event)"
        />
      </template>

      <template #status-cell="{ row }">
        <UBadge
          v-if="row.original.status === 'Ausstehend'"
          label="Ausstehend"
          color="neutral"
          variant="subtle"
        />
        <UBadge
          v-else-if="row.original.status === 'Abgesendet'"
          label="Abgesendet"
          color="warning"
          variant="subtle"
        />
        <UBadge
          v-else-if="row.original.status === 'Abgeschlossen'"
          label="Abgeschlossen"
          color="success"
          variant="subtle"
        />
        <UBadge v-else label="Abgelehnt" color="error" variant="subtle" />
      </template>

      <template #date-cell="{ row }">
        <span>{{ useDateFormat(row.original.expire_date, "DD.MM.YYYY") }}</span>
      </template>

      <template #allow_class_mixing-cell="{ row }">
        <div>
          <span
            v-if="row.original.allow_class_mixing"
            class="flex items-center gap-2"
          >
            <UIcon class="text-green-500" name="i-heroicons-check" size="20" />
            Ja
          </span>
          <span v-else class="flex items-center gap-2">
            <UIcon class="text-red-500" name="i-heroicons-x-mark" size="20" />
            Nein
          </span>
        </div>
      </template>

      <template #actions-cell="{ row }">
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
      </template>

      <template #empty-state>
        <EmptyState
          v-model="search"
          title="Keine Anmeldungen"
          description="Mit Anmeldungen können sich Klassen bei Turnieren registrieren."
        />
      </template>
    </UTable>
  </BasePageContent>
</template>
