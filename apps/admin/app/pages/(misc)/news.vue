<script setup lang="ts">
import type { EditorToolbarItem } from "@nuxt/ui"

const title = ref<string>("Aktuelles")
useHead({
  title: () => title.value,
})

const content = ref("")
const isRefreshing = ref(false)
const isSaving = ref(false)
const supabase = useSupabaseClient()

const editorToolbarItems = [
  [
    { kind: "heading", level: 1, label: "H1" },
    { kind: "heading", level: 2, label: "H2" },
    { kind: "paragraph", label: "Text" },
  ],
  [
    { kind: "mark", mark: "bold", label: "Fett" },
    { kind: "mark", mark: "italic", label: "Kursiv" },
    { kind: "link", label: "Link" },
  ],
  [
    { kind: "bulletList", label: "Liste" },
    { kind: "orderedList", label: "1." },
    { kind: "blockquote", label: "Zitat" },
    { kind: "codeBlock", label: "Code" },
  ],
  [
    { kind: "undo", label: "Undo" },
    { kind: "redo", label: "Redo" },
  ],
] satisfies EditorToolbarItem[][]

async function loadContent() {
  const { data, error } = await supabase.storage
    .from("misc")
    .download("news.md")

  if (error) {
    throw error
  }

  content.value = (await data?.text()) ?? ""
}

try {
  await loadContent()
} catch (error: any) {
  throw createError({
    statusCode: 500,
    statusMessage: error?.message ?? "Aktuelles konnte nicht geladen werden.",
  })
}

async function refresh() {
  isRefreshing.value = true

  try {
    await loadContent()
    displaySuccessNotification(
      "Inhalt aktualisiert",
      "Der Inhalt wurde erfolgreich aktualisiert.",
    )
  } catch (error: any) {
    displayFailureNotification(
      "Fehler beim Aktualisieren",
      error?.message ?? "Aktuelles konnte nicht geladen werden.",
    )
  } finally {
    isRefreshing.value = false
  }
}

async function saveContent() {
  isSaving.value = true

  try {
    const { error } = await supabase.storage
      .from("misc")
      .upload("news.md", content.value, { upsert: true })

    if (error) {
      throw error
    }

    displaySuccessNotification(
      "Änderungen gespeichert",
      "Die Änderungen wurden erfolgreich gespeichert.",
    )
  } catch (error: any) {
    displayFailureNotification(
      "Fehler beim Speichern",
      error?.message ?? "Aktuelles konnte nicht gespeichert werden.",
    )
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <BasePageHeader :title="title">
    <ToolbarContainer>
      <UButton
        icon="i-heroicons-arrow-path"
        color="neutral"
        variant="outline"
        size="sm"
        square
        :loading="isRefreshing"
        @click="refresh"
      />
      <UButton
        label="Änderungen speichern"
        variant="soft"
        size="sm"
        icon="i-heroicons-check"
        :loading="isSaving"
        @click="saveContent"
      />
    </ToolbarContainer>
  </BasePageHeader>
  <ClientOnly>
    <div class="h-full w-full pb-3">
      <UEditor
        v-slot="{ editor }"
        v-model="content"
        content-type="markdown"
        placeholder="Aktuelles verfassen..."
        class="h-full"
        :ui="{
          root: 'flex h-full min-h-[32rem] flex-col',
          content: 'flex-1 overflow-y-auto py-6',
        }"
      >
        <UEditorToolbar
          :editor="editor"
          :items="editorToolbarItems"
          class="px-2 py-2"
        />
      </UEditor>
    </div>
    <template #fallback>
      <div
        class="flex h-full w-full items-center justify-center bg-neutral-100 dark:bg-neutral-900"
      >
        <UIcon name="i-svg-spinners-180-ring-with-bg" size="24" />
      </div>
    </template>
  </ClientOnly>
</template>
