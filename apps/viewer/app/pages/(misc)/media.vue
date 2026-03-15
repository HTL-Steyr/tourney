<script setup lang="ts">
const supabase = useSupabaseClient()
const { data, error, status } = await useAsyncData(
  "viewer-media-news",
  async () => {
    const { data, error } = await supabase.storage
      .from("misc")
      .download("news.md")

    if (error) {
      throw error
    }

    return ((await data?.text()) ?? "").trim()
  },
)

if (error.value) {
  throw createError({
    statusCode: 500,
    statusMessage:
      error.value.message || "Aktuelles konnte nicht geladen werden.",
  })
}

const content = computed(() => data.value ?? "")
</script>

<template>
  <PageWrapper>
    <PageHeader title="Medien" description="Aktuelles und Galerie" />

    <section
      class="my-3 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
    >
      <div
        v-if="status === 'pending'"
        class="flex min-h-48 items-center justify-center px-4 py-10 text-neutral-500"
      >
        <UIcon name="i-svg-spinners-180-ring-with-bg" size="24" />
      </div>

      <div v-else-if="content" class="media-content px-4 py-5 sm:px-6 sm:py-6">
        <MDC :value="content" />
      </div>

      <div
        v-else
        class="flex min-h-48 items-center justify-center px-4 py-10 text-center text-neutral-500"
      >
        Kein Inhalt verfuegbar.
      </div>
    </section>
  </PageWrapper>
</template>

<style scoped>
.media-content :deep(*) {
  color: inherit;
}

.media-content :deep(h1),
.media-content :deep(h2),
.media-content :deep(h3),
.media-content :deep(h4) {
  margin-top: 1.75rem;
  margin-bottom: 0.75rem;
  font-weight: 700;
  line-height: 1.2;
}

.media-content :deep(h1) {
  margin-top: 0;
  font-size: 1.875rem;
}

.media-content :deep(h2) {
  font-size: 1.5rem;
}

.media-content :deep(h3) {
  font-size: 1.25rem;
}

.media-content :deep(p),
.media-content :deep(ul),
.media-content :deep(ol),
.media-content :deep(blockquote),
.media-content :deep(pre) {
  margin-bottom: 1rem;
  line-height: 1.7;
}

.media-content :deep(ul),
.media-content :deep(ol) {
  padding-left: 1.25rem;
}

.media-content :deep(ul) {
  list-style: disc;
}

.media-content :deep(ol) {
  list-style: decimal;
}

.media-content :deep(a) {
  color: rgb(37 99 235);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.dark .media-content :deep(a) {
  color: rgb(96 165 250);
}

.media-content :deep(blockquote) {
  border-left: 3px solid rgb(212 212 212);
  padding-left: 1rem;
  color: rgb(82 82 82);
}

.dark .media-content :deep(blockquote) {
  border-left-color: rgb(82 82 82);
  color: rgb(163 163 163);
}

.media-content :deep(code) {
  border-radius: 0.375rem;
  background: rgb(245 245 245);
  padding: 0.125rem 0.375rem;
  font-size: 0.875rem;
}

.dark .media-content :deep(code) {
  background: rgb(38 38 38);
}

.media-content :deep(pre) {
  overflow-x: auto;
  border-radius: 0.75rem;
  background: rgb(245 245 245);
  padding: 1rem;
}

.dark .media-content :deep(pre) {
  background: rgb(38 38 38);
}

.media-content :deep(pre code) {
  background: transparent;
  padding: 0;
}

.media-content :deep(img) {
  border-radius: 0.75rem;
}

.media-content :deep(hr) {
  margin: 1.5rem 0;
  border-color: rgb(229 229 229);
}

.dark .media-content :deep(hr) {
  border-color: rgb(64 64 64);
}
</style>
