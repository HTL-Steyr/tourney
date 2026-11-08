<script setup lang="ts">
import { z } from "zod"
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

const selectedRows = ref<RegistrationColumn[]>([])
function select(row: RegistrationColumn) {
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

const sort = ref({ column: "status", direction: "asc" as const })

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
const classYear = ref<string>(years[0])
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
    selectedRows.value = []
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
    selectedRows.value = []
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
  const { text, copy, copied, isSupported } = useClipboard({
    source,
    legacy: true,
  })
  await copy()
  let description = text.value
  if (!isSupported.value) {
    description = "Ihr Browser unterstützt das Kopieren nicht."
  }
  copied.value
    ? displaySuccessNotification("Link kopiert", description)
    : displayFailureNotification("Fehler beim Kopieren", description)
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
const groupLinks = () => {
  return selectedRows.value.reduce((acc, row) => {
    const { class: className, name, id } = row
    const url: string = `${config.public.clientUrl}/registrations/${id}`

    if (!acc[className]) {
      acc[className] = { links: [], sent: false }
    }

    acc[className].links.push({ name, url, class: className })
    return acc
  }, {} as LinkGroup)
}

const generateLinks = () => {
  links.value = groupLinks()
  isOpenLinks.value = true
}

const onCopyEmail = async (classLinks: { links: Link[]; sent: boolean }) => {
  let source: string
  const links = classLinks.links
    .map((link) => `${link.name}\n${link.url}`)
    .join("\n\n")
  if (linksState.active) {
    source = `${linksState.beginning}\n\n${links}\n\n${linksState.end}`
  } else {
    source = links
  }
  const { text, copy, copied, isSupported } = useClipboard({
    source,
    legacy: true,
  })
  await copy()
  let description = text.value.slice(0, 150) + "\n... (Nachricht gekürzt)"
  if (!isSupported.value) {
    description = "Ihr Browser unterstützt das Kopieren nicht."
  }
  copied.value
    ? displaySuccessNotification("E-Mail kopiert", description)
    : displayFailureNotification("Fehler beim Kopieren", description)
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

const selectedColumns = ref(columns)
const columnsTable = computed(() =>
  columns.filter((column) => selectedColumns.value.includes(column)),
)

type TabKey = "multiple" | "single"
const currentTab = ref<TabKey>(tabItems[0].key as TabKey)
function onChange(index: number) {
  const item = tabItems[index]
  currentTab.value = item.key as TabKey
}

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
          color="red"
          size="xs"
          label="Löschen..."
        />
        <UButton
          label="Links exportieren"
          icon="i-heroicons-arrow-up-on-square"
          @click="generateLinks"
          color="gray"
          size="xs"
        />
      </template>

      <UDropdown
        v-if="selectedRows.length > 0"
        :items="actions"
        :ui="{ width: 'w-40', item: { padding: 'p-1' } }"
      >
        <UButton
          icon="i-heroicons-chevron-down"
          trailing
          color="gray"
          size="xs"
          label="Markieren als"
        />
      </UDropdown>

      <ColumnsDropdown :columns="columns" v-model="selectedColumns" />

      <UButton
        icon="i-heroicons-arrow-path"
        color="gray"
        size="xs"
        square
        @click="refreshTable"
      />

      <UButton
        size="xs"
        variant="soft"
        @click="isOpenCreate = true"
        label="Neue Anmeldung..."
      />

      <!-- Link Modal -->
      <UModal
        v-model="isOpenLinks"
        :ui="{ width: 'w-full sm:max-w-5xl' }"
        prevent-close
      >
        <UCard
          :ui="{
            divide: 'divide-y divide-gray-100 dark:divide-gray-800',
            body: {
              padding: 'px-4 py-5 sm:p-6',
            },
            header: {
              padding: 'px-4 py-3 sm:px-6',
            },
            footer: {
              padding: 'px-4 py-3 sm:px-6',
            },
          }"
        >
          <template #header>
            <strong> Export </strong>
          </template>

          <strong>Anleitung</strong>
          <p>
            Die ausgewählten Anmeldungen wurden nach Klasse gruppiert. Kopieren
            Sie den Textinhalt pro Klasse und verschicken Sie diesen per Mail an
            die Klassenmail (z.b. <code>1ahitn@htl-steyr.ac.at</code> ).
          </p>
          <div class="mt-3 flex gap-3">
            <div class="flex grow flex-col gap-1">
              <strong>Klassenlinks</strong>
              <ul
                class="h-96 w-full overflow-y-scroll rounded-md border border-gray-200 shadow-sm dark:border-gray-800"
              >
                <li
                  v-for="[className, classLinks] in Object.entries(links)"
                  :key="className"
                  class="flex justify-between border-b border-gray-200 p-2 px-4 dark:border-gray-800"
                >
                  <div class="my-3 flex w-full flex-col gap-3">
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
                      class="space-y-1 rounded-md bg-gray-100 p-3 shadow-sm dark:bg-gray-800"
                    >
                      <li v-for="link in classLinks.links" :key="link.url">
                        <p class="text-xs">{{ link.name }}</p>
                        <code class="text-xs">{{ link.url }}</code>
                      </li>
                    </ul>
                    <div class="flex justify-between">
                      <UButton
                        variant="soft"
                        size="xs"
                        icon="i-heroicons-clipboard-document-check"
                        label="Kopieren"
                        @click="onCopyEmail(classLinks)"
                      />
                      <UButton
                        variant="soft"
                        color="green"
                        size="xs"
                        icon="i-heroicons-check"
                        label="Abgesendet"
                        @click="classLinks.sent = !classLinks.sent"
                      />
                    </div>
                  </div>
                </li>
              </ul>
            </div>
            <div class="flex flex-col gap-1">
              <strong>Einstellungen</strong>
              <div
                class="h-full w-80 rounded-md border border-gray-200 p-3 shadow-sm dark:border-gray-800"
              >
                <UForm
                  :state="linksState"
                  :schema="linksSchema"
                  class="space-y-2"
                >
                  <UFormGroup
                    label="Aktivieren"
                    :ui="{
                      wrapper:
                        'flex items-center justify-between rounded-md bg-gray-50 p-3 dark:bg-gray-800 gap-3',
                    }"
                  >
                    <UToggle v-model="linksState.active" />
                  </UFormGroup>
                  <UFormGroup label="Einleitungstext">
                    <UTextarea
                      placeholder="Liebe Schülerinnen und Schüler, ..."
                      color="gray"
                      :rows="6"
                      v-model="linksState.beginning"
                      :disabled="!linksState.active"
                    />
                  </UFormGroup>
                  <UFormGroup label="Abschlusstext">
                    <UTextarea
                      placeholder="Mit freundlichen Grüßen"
                      color="gray"
                      :rows="5"
                      v-model="linksState.end"
                      :disabled="!linksState.active"
                    />
                  </UFormGroup>
                </UForm>
              </div>
            </div>
          </div>

          <template #footer>
            <UButton
              color="gray"
              size="xs"
              @click="isOpenLinks = false"
              label="Fertig"
            />
          </template>
        </UCard>
      </UModal>

      <ModalCreate
        title="Neues Anmeldung"
        v-model="isOpenCreate"
        @create="onSubmitCreate"
        modal-width="sm:max-w-md"
      >
        <UTabs
          :items="tabItems"
          class="w-full"
          @change="onChange"
          :ui="{ list: { tab: { height: 'h-7' }, height: 'h-9' } }"
        >
          <template #icon="{ item, selected }">
            <UIcon
              :name="item.icon"
              class="me-2 h-4 w-4 flex-shrink-0"
              :class="[selected && 'text-primary-500 dark:text-primary-400']"
            />
          </template>

          <template #multiple="{ item }">
            <UForm
              :schema="creationSchemaMultiple"
              :state="creationStateMultiple"
              class="space-y-4 pt-2"
              @submit="onSubmitCreateMultiple"
            >
              <UFormGroup
                label="Teams"
                name="teams"
                description="Anzahl an Anmeldungen für jede Klasse."
                required
              >
                <UInput v-model="creationStateMultiple.teams" type="number" />
              </UFormGroup>

              <UFormGroup
                label="Klassen"
                name="classes"
                class="grow"
                description="Für diese Klassen wird ein Link generiert."
              >
                <ul
                  class="h-40 w-full overflow-y-scroll rounded-md border border-gray-200 shadow-sm dark:border-gray-800"
                >
                  <template v-if="classes?.length">
                    <li
                      v-for="schoolClass in classes"
                      :key="schoolClass.name"
                      class="flex justify-between border-b border-gray-200 p-2 px-4 dark:border-gray-800"
                    >
                      <p>{{ schoolClass.name }}</p>
                      <p>{{ schoolClass.year }}</p>
                    </li>
                  </template>
                  <template v-else>
                    <div class="flex h-full w-full items-center justify-center">
                      <p class="text-sm text-gray-500 dark:text-gray-400">
                        Keine Klassen für {{ classYear }} gefunden.
                      </p>
                    </div>
                  </template>
                </ul>
              </UFormGroup>

              <UFormGroup label="Datensatz">
                <USelect v-model="classYear" :options="years" />
              </UFormGroup>

              <UFormGroup
                label="Ablaufdatum"
                name="date"
                description="An diesem Datum werden die Anmeldungen automatisch geschlossen."
                required
              >
                <UInput
                  v-model="creationStateMultiple.expire_date"
                  type="date"
                />
              </UFormGroup>
            </UForm>
          </template>
          <template #single="{ item }">
            <UForm
              :schema="creationSchemaSingle"
              :state="creationSchemaSingle"
              class="space-y-4 pt-2"
              @submit="onSubmitCreateSingle"
            >
              <UFormGroup
                label="Name"
                name="name"
                description="Der Name der Anmeldung."
                required
              >
                <UInput v-model="creationStateSingle.name" />
              </UFormGroup>

              <UFormGroup
                label="Klasse"
                name="class"
                description="Die Klasse der Anmeldung."
                required
              >
                <USelectMenu
                  v-model="creationStateSingle.schoolClass"
                  placeholder="Klasse auswählen"
                  :options="classes ?? []"
                  option-attribute="name"
                />
              </UFormGroup>

              <UFormGroup label="Datensatz">
                <USelect v-model="classYear" :options="years" />
              </UFormGroup>

              <UFormGroup
                label="Ablaufdatum"
                name="date"
                description="An diesem Datum wird die Anmeldung automatisch geschlossen."
                required
              >
                <UInput v-model="creationStateSingle.expire_date" type="date" />
              </UFormGroup>

              <UFormGroup
                label="Klassenmischung erlauben"
                name="allow_class_mixing"
                description="Schüler können sich in anderen Klassen anmelden."
                :ui="{
                  wrapper:
                    'flex items-center justify-between rounded-md bg-gray-50 p-3 dark:bg-gray-800 gap-3',
                }"
              >
                <UToggle v-model="creationStateSingle.allow_class_mixing" />
              </UFormGroup>
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
          <UFormGroup label="Name" name="name">
            <UInput v-model="editState.name" />
          </UFormGroup>

          <UFormGroup
            label="Ablaufdatum"
            name="expire_date"
            description="An diesem Datum wird die Anmeldung automatisch geschlossen."
          >
            <UInput v-model="editState.expire_date" type="date" />
          </UFormGroup>

          <UFormGroup
            label="Klassenmischung erlauben"
            name="allow_class_mixing"
            description="Schüler können sich in anderen Klassen anmelden."
            :ui="{
              wrapper:
                'flex items-center justify-between rounded-md bg-gray-50 p-3 dark:bg-gray-800 gap-3',
            }"
          >
            <UToggle v-model="editState.allow_class_mixing" />
          </UFormGroup>
        </UForm>
      </ModalEdit>

      <ModalInfo v-model="isOpenInfo">
        <pre>{{ infoDisplay }}</pre>
      </ModalInfo>
    </ToolbarContainer>
  </BasePageHeader>
  <BasePageContent>
    <UTable
      v-model="selectedRows"
      v-model:sort="sort"
      :rows="filteredRows"
      :columns="columnsTable"
      :loading="status === 'pending'"
      :loading-state="{
        icon: 'i-heroicons-arrow-path-20-solid',
        label: 'Lade...',
      }"
      class="h-full w-full bg-white dark:bg-gray-900"
      :ui="{
        wrapper: 'relative overflow-auto',
        th: {
          padding: 'px-4 py-3',
        },
        td: { base: 'max-w-[0] truncate', padding: 'py-2' },
      }"
      @select="select"
    >
      <template #status-data="{ row }">
        <UBadge
          size="xs"
          v-if="row.status === 'Ausstehend'"
          label="Ausstehend"
          color="yellow"
          variant="subtle"
        />
        <UBadge
          size="xs"
          v-else-if="row.status === 'Abgesendet'"
          label="Abgesendet"
          color="orange"
          variant="subtle"
        />
        <UBadge
          size="xs"
          v-else-if="row.status === 'Abgeschlossen'"
          label="Abgeschlossen"
          color="green"
          variant="subtle"
        />
        <UBadge
          size="xs"
          v-else
          label="Abgelehnt"
          color="red"
          variant="subtle"
        />
      </template>

      <template #date-data="{ row }">
        <span>{{ useDateFormat(row.expire_date, "DD.MM.YYYY") }}</span>
      </template>

      <template #allow_class_mixing-data="{ row }">
        <div>
          <span v-if="row.allow_class_mixing" class="flex items-center gap-2">
            <UIcon class="text-green-500" name="i-heroicons-check" size="20" />
            Ja
          </span>
          <span v-else class="flex items-center gap-2">
            <UIcon class="text-red-500" name="i-heroicons-x-mark" size="20" />
            Nein
          </span>
        </div>
      </template>

      <template #actions-data="{ row }">
        <UDropdown :items="items(row).value" :ui="{ width: 'w-auto' }">
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-ellipsis-horizontal-20-solid"
            size="2xs"
            square
          />
        </UDropdown>
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
