<script setup lang="ts">
import { DefaultChatTransport } from "ai"
import { Chat } from "@ai-sdk/vue"
import {
  createAiAssistantRequestContext,
  AI_ASSISTANT_DEFAULT_MODEL,
  AI_ASSISTANT_MODEL_OPTIONS,
} from "#shared/aiAssistant"

const route = useRoute()

const { collapsed: isCollapsed } = useAiAssistant()
const { pageContext } = useAiAssistantPageContext()
const input = ref("")
const selectedModel = ref(AI_ASSISTANT_DEFAULT_MODEL)

const chat = new Chat({
  transport: new DefaultChatTransport({
    api: "/api/assistant/chat",
    body: () => ({
      context: createAiAssistantRequestContext({
        route: route.path,
        pageLabel: currentPageLabel.value,
        dynamic: pageContext.value,
      }),
      model: selectedModel.value,
    }),
  }),
  onError(error) {
    console.error(error)
  },
})

const currentPageLabel = computed(() => {
  if (route.path === "/") {
    return "Dashboard"
  }

  return route.path.split("/").filter(Boolean).map(formatSegment).join(" / ")
})
const selectedModelLabel = computed(() => {
  return (
    AI_ASSISTANT_MODEL_OPTIONS.find(
      ({ value }) => value === selectedModel.value,
    )?.label ?? AI_ASSISTANT_DEFAULT_MODEL
  )
})
const isBusy = computed(() => {
  return chat.status === "submitted" || chat.status === "streaming"
})
const isNewConversation = computed(() => chat.messages.length === 0)
const starterGroups = computed(() => [
  {
    label: "Kontext",
    items: [
      {
        description:
          "Welche Aufgaben sind auf dieser Seite gerade am wichtigsten?",
        icon: "i-heroicons-map",
        prompt: `Was kann ich auf der Seite ${currentPageLabel.value} als Nächstes erledigen?`,
        title: "Aktuelle Seite verstehen",
      },
      {
        description:
          "Zeig mir den schnellsten Weg zu Einstellungen und Profil.",
        icon: "i-heroicons-cog-8-tooth",
        prompt: "Wo finde ich die wichtigsten Einstellungen im Admin?",
        title: "Navigation finden",
      },
    ],
  },
  {
    label: "Schnellaktionen",
    items: [
      {
        description: "Welche Ansicht ist für laufende Turniere relevant?",
        icon: "i-heroicons-signal",
        prompt: "Wie prüfe ich laufende Live-Turniere im Admin?",
        title: "Live-Status prüfen",
      },
      {
        description:
          "Hilf mir bei den nächsten Schritten für einen neuen Eintrag.",
        icon: "i-heroicons-document-plus",
        prompt: "Hilf mir beim Anlegen eines neuen Turniers.",
        title: "Neues Turnier vorbereiten",
      },
      {
        description:
          "Welche Daten kann ich in diesem Bereich pflegen oder korrigieren?",
        icon: "i-heroicons-wrench-screwdriver",
        prompt: `Welche Admin-Aktionen passen zur Seite ${currentPageLabel.value}?`,
        title: "Passende Aktionen finden",
      },
    ],
  },
])

function formatSegment(segment: string) {
  return segment
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function getMessageText(message: {
  parts: Array<{ type: string; text?: string }>
}) {
  return message.parts
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n\n")
}

async function submitPrompt(value: string) {
  const normalizedValue = value.trim()

  if (!normalizedValue || isBusy.value) {
    return
  }

  if (chat.status === "error") {
    chat.clearError()
  }

  await chat.sendMessage({ text: normalizedValue })
  input.value = ""
}

function onSubmit() {
  return submitPrompt(input.value)
}

function resetConversation() {
  if (isBusy.value) {
    void chat.stop()
  }

  if (chat.status === "error") {
    chat.clearError()
  }

  chat.messages = []
  input.value = ""
}

function closeAssistant() {
  if (isBusy.value) {
    void chat.stop()
  }

  isCollapsed.value = true
}

onBeforeUnmount(() => {
  if (isBusy.value) {
    void chat.stop()
  }
})
</script>

<template>
  <UDashboardSidebar
    v-model:collapsed="isCollapsed"
    id="assistant"
    side="right"
    :default-size="25"
    :min-size="22"
    :max-size="34"
    :collapsed-size="0"
    :resizable="!isCollapsed"
    collapsible
    :toggle="false"
    :ui="{
      root: 'h-full !min-h-0 rounded-md border border-neutral-200 bg-white data-[collapsed=true]:!hidden data-[collapsed=true]:!w-0 data-[collapsed=true]:!min-w-0 data-[collapsed=true]:overflow-hidden data-[collapsed=true]:border-0 data-[collapsed=true]:bg-transparent data-[collapsed=true]:p-0 data-[collapsed=true]:shadow-none dark:border-neutral-800 dark:bg-neutral-900',
      header:
        'border-b border-neutral-200 h-11 px-4 py-2.5 dark:border-neutral-800',
      body: 'min-h-0 px-0 py-0',
      footer: 'border-t border-neutral-200 px-4 py-4 dark:border-neutral-800',
      content: 'bg-white dark:bg-neutral-900',
    }"
  >
    <template #header="{ collapsed }">
      <div v-if="!collapsed" class="w-full">
        <div class="flex w-full items-center justify-between">
          <div class="flex min-w-0 items-center gap-3">
            <button
              type="button"
              class="flex min-w-0 items-center gap-2 text-left"
              @click="resetConversation()"
            >
              <span
                class="truncate text-sm font-semibold text-neutral-950 dark:text-white"
              >
                Neue Unterhaltung
              </span>
              <UIcon
                name="i-heroicons-chevron-down"
                class="h-4 w-4 shrink-0 text-neutral-400 dark:text-neutral-500"
              />
            </button>

            <UBadge color="warning" variant="subtle" size="sm">BETA</UBadge>
          </div>

          <div class="flex items-center gap-1">
            <UTooltip text="Neuer Chat">
              <UButton
                color="neutral"
                variant="ghost"
                size="sm"
                icon="i-heroicons-plus"
                @click="resetConversation()"
              />
            </UTooltip>

            <UTooltip text="AI-Assistent ausblenden">
              <UButton
                color="neutral"
                variant="ghost"
                size="sm"
                icon="i-heroicons-x-mark"
                @click="closeAssistant()"
              />
            </UTooltip>
          </div>
        </div>
      </div>
    </template>

    <template #default="{ collapsed }">
      <div v-if="!collapsed" class="flex h-full min-h-0 flex-col">
        <!--        <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5">-->
        <!--          <div v-if="isNewConversation" class="flex min-h-full flex-col gap-10">-->
        <!--            <div class="space-y-8">-->
        <!--              <section-->
        <!--                v-for="group in starterGroups"-->
        <!--                :key="group.label"-->
        <!--                class="space-y-3"-->
        <!--              >-->
        <!--                <p-->
        <!--                  class="text-[11px] font-semibold tracking-[0.35em] text-neutral-400 uppercase dark:text-neutral-500"-->
        <!--                >-->
        <!--                  {{ group.label }}-->
        <!--                </p>-->

        <!--                <div class="space-y-2">-->
        <!--                  <button-->
        <!--                    v-for="item in group.items"-->
        <!--                    :key="item.title"-->
        <!--                    type="button"-->
        <!--                    class="flex w-full items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/60 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-blue-900 dark:hover:bg-blue-950/20"-->
        <!--                    @click="submitPrompt(item.prompt)"-->
        <!--                  >-->
        <!--                    <span-->
        <!--                      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-300"-->
        <!--                    >-->
        <!--                      <UIcon :name="item.icon" class="h-5 w-5" />-->
        <!--                    </span>-->

        <!--                    <span class="min-w-0 flex-1">-->
        <!--                      <span-->
        <!--                        class="block truncate text-sm font-medium text-neutral-950 dark:text-white"-->
        <!--                      >-->
        <!--                        {{ item.title }}-->
        <!--                      </span>-->
        <!--                      <span-->
        <!--                        class="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400"-->
        <!--                      >-->
        <!--                        {{ item.description }}-->
        <!--                      </span>-->
        <!--                    </span>-->

        <!--                    <UIcon-->
        <!--                      name="i-heroicons-chevron-right"-->
        <!--                      class="h-4 w-4 shrink-0 text-neutral-300 dark:text-neutral-700"-->
        <!--                    />-->
        <!--                  </button>-->
        <!--                </div>-->
        <!--              </section>-->
        <!--            </div>-->
        <!--                  </div>-->

        <UChatMessages
          :messages="chat.messages"
          :status="chat.status"
          :user="{ icon: 'i-heroicons-user-circle', variant: 'soft' }"
          :assistant="{ icon: 'i-heroicons-sparkles', variant: 'naked' }"
          :auto-scroll="{ color: 'neutral', variant: 'ghost', size: 'sm' }"
          should-auto-scroll
        >
          <template #content="{ message }">
            <p
              class="whitespace-pre-wrap"
              :class="
                message.role === 'assistant'
                  ? 'text-[15px] leading-7 text-neutral-700 dark:text-neutral-200'
                  : 'text-sm leading-6 text-neutral-900 dark:text-white'
              "
            >
              {{ getMessageText(message) }}
            </p>
          </template>
        </UChatMessages>
        <!--      </div>-->
      </div>
    </template>

    <template #footer="{ collapsed }">
      <div v-if="!collapsed" class="w-full space-y-3">
        <div
          v-if="chat.error"
          class="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
        >
          {{ chat.error.message }}
        </div>

        <UChatPrompt
          v-model="input"
          class="w-full"
          size="sm"
          variant="subtle"
          :ui="{
            base: 'text-sm leading-6 placeholder:text-sm',
          }"
          :rows="2"
          :maxrows="6"
          placeholder="Frag nach einer Funktion, einem Ablauf oder dem nächsten Schritt..."
          :disabled="isBusy"
          @submit="onSubmit"
        >
          <template #footer>
            <div class="flex w-full items-center justify-between gap-3">
              <div class="flex min-w-0 items-center gap-2">
                <USelect
                  v-model="selectedModel"
                  class="w-32"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  :items="AI_ASSISTANT_MODEL_OPTIONS"
                  :disabled="isBusy"
                />
              </div>

              <UChatPromptSubmit
                :status="chat.status"
                @stop="chat.stop()"
                @reload="chat.regenerate()"
              />
            </div>
          </template>
        </UChatPrompt>
      </div>
    </template>
  </UDashboardSidebar>
</template>
