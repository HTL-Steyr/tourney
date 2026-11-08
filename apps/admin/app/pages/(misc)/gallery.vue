<script setup lang="ts">
const title = ref<string>("Galerie")
useHead({
  title: () => title.value,
})

const supabase = useSupabaseClient()
const images = ref<any[]>([])
const isUploading = ref(false)
const selectedImages = ref<string[]>([])
const isDeleting = ref(false)

function sanitizeStorageSegment(value: string) {
  return value
    .replaceAll("ß", "ss")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

async function fetchImages() {
  const { data, error } = await supabase.storage
    .from("images")
    .list("tournament")
  if (error) {
    displayFailureNotification("Fehler beim Laden der Bilder", error.message)
    return
  }

  images.value = data.filter((img) => img.name !== ".emptyFolderPlaceholder")
}

async function uploadImages(event: Event) {
  let fileInput: HTMLInputElement | null = event.target as HTMLInputElement
  if (!fileInput.files || fileInput.files.length === 0) return

  isUploading.value = true

  try {
    const files = Array.from(fileInput.files)

    for (const file of files) {
      const extensionIndex = file.name.lastIndexOf(".")
      const rawBaseName =
        extensionIndex > 0 ? file.name.slice(0, extensionIndex) : file.name
      const rawExtension =
        extensionIndex > 0 ? file.name.slice(extensionIndex + 1) : ""
      const fileBaseName = sanitizeStorageSegment(rawBaseName) || "bild"
      const fileExt = rawExtension.toLowerCase().replace(/[^a-z0-9]/g, "")
      const fileName = `${fileBaseName}_${Date.now()}${fileExt ? `.${fileExt}` : ""}`

      const { error } = await supabase.storage
        .from("images")
        .upload(`tournament/${fileName}`, file)

      if (error) {
        throw error
      }
    }

    await fetchImages()
    displaySuccessNotification(
      "Bilder hochgeladen",
      "Die Bilder wurden erfolgreich hochgeladen.",
    )
  } catch (error: any) {
    displayFailureNotification("Fehler beim Hochladen", error.message)
  } finally {
    isUploading.value = false
    fileInput.value = ""
  }
}

async function deleteSelectedImages() {
  if (selectedImages.value.length === 0) return

  isDeleting.value = true

  try {
    for (const imageName of selectedImages.value) {
      const { error } = await supabase.storage
        .from("images")
        .remove([`tournament/${imageName}`])

      if (error) {
        throw error
      }
    }

    await fetchImages()
    selectedImages.value = []
    displaySuccessNotification(
      "Bilder gelöscht",
      "Die ausgewählten Bilder wurden erfolgreich gelöscht.",
    )
  } catch (error: any) {
    displayFailureNotification("Fehler beim Löschen", error.message)
  } finally {
    isDeleting.value = false
  }
}

function toggleImageSelection(imageName: string) {
  const index = selectedImages.value.indexOf(imageName)
  if (index === -1) {
    selectedImages.value.push(imageName)
  } else {
    selectedImages.value.splice(index, 1)
  }
}

function getImageUrl(imageName: string) {
  return supabase.storage.from("images").getPublicUrl(`tournament/${imageName}`)
    .data.publicUrl
}

await fetchImages()
</script>

<template>
  <BasePageHeader :title="title.toUpperCase()">
    <ToolbarContainer>
      <UButton
        v-if="selectedImages.length > 0"
        label="Löschen"
        color="error"
        variant="soft"
        size="sm"
        icon="i-heroicons-trash"
        :loading="isDeleting"
        @click="deleteSelectedImages"
      />
      <!-- @vue-ignore -->
      <UButton
        label="Bilder hochladen"
        variant="soft"
        size="sm"
        icon="i-heroicons-arrow-up-tray"
        :loading="isUploading"
        @click="() => $refs.fileInput.click()"
      />
      <input
        ref="fileInput"
        type="file"
        multiple
        accept="image/*"
        class="hidden"
        @change="uploadImages"
      />
    </ToolbarContainer>
  </BasePageHeader>

  <div class="p-3">
    <div
      v-if="images.length === 0 && !isUploading"
      class="flex h-64 items-center justify-center rounded-md border border-dashed border-neutral-300 dark:border-neutral-700"
    >
      <div class="text-center">
        <UIcon
          name="i-heroicons-photo"
          class="mb-2 text-neutral-400"
          size="32"
        />
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          Keine Bilder vorhanden
        </p>
        <p class="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
          Klicken Sie auf "Bilder hochladen", um Bilder hinzuzufügen
        </p>
      </div>
    </div>

    <div
      v-else
      class="grid max-h-[calc(100vh-120px)] grid-cols-2 gap-4 overflow-y-auto p-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
    >
      <div
        v-for="image in images"
        :key="image.name"
        class="group relative aspect-square overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700"
        :class="{
          'ring-primary-500 ring-2': selectedImages.includes(image.name),
        }"
        @click="toggleImageSelection(image.name)"
      >
        <NuxtImg
          :src="getImageUrl(image.name)"
          :alt="image.name"
          class="h-full w-full object-cover"
        />
        <div
          class="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30"
        >
          <UCheckbox
            :model-value="selectedImages.includes(image.name)"
            class="opacity-0 group-hover:opacity-100"
            @click.stop="toggleImageSelection(image.name)"
          />
        </div>
        <div
          class="absolute right-0 bottom-0 left-0 bg-black/50 p-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
        >
          {{ image.name }}
        </div>
      </div>
    </div>

    <UModal v-model:open="isUploading">
      <template #content>
        <div class="p-4 text-center">
          <UIcon
            name="i-svg-spinners-180-ring-with-bg"
            class="text-primary-500 mb-2"
            size="32"
          />
          <p>Bilder werden hochgeladen...</p>
        </div>
      </template>
    </UModal>
  </div>
</template>
