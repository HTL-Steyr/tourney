<script setup lang="ts">
import { marked } from "marked"
import changelogMarkdown from "../../../../../CHANGELOG.md?raw"

const title = "Was ist neu"
const renderedChangelog = computed(
  () => marked.parse(changelogMarkdown) as string,
)

useHead({
  title,
})
</script>

<template>
  <BasePageHeader :title="title">
    <ToolbarContainer>
      <NuxtLink to="/">
        <UButton
          label="Dokumentation"
          size="sm"
          variant="outline"
          color="neutral"
          trailing-icon="i-heroicons-arrow-up-right"
        />
      </NuxtLink>
    </ToolbarContainer>
  </BasePageHeader>
  <div class="flex h-full w-full overflow-auto p-6">
    <div class="changelog-content" v-html="renderedChangelog" />
  </div>
</template>

<style scoped>
.changelog-content :deep(h1),
.changelog-content :deep(h2),
.changelog-content :deep(h3) {
  color: rgb(10 10 10);
  font-weight: 600;
  line-height: 1.2;
  margin-top: 1.5rem;
}

.changelog-content :deep(h1) {
  font-size: 1.5rem;
  margin-top: 0;
}

.changelog-content :deep(h2) {
  font-size: 1.25rem;
}

.changelog-content :deep(h3) {
  font-size: 1rem;
}

.changelog-content :deep(p),
.changelog-content :deep(ul) {
  color: rgb(82 82 82);
  line-height: 1.7;
  margin-top: 0.75rem;
}

.changelog-content :deep(ul) {
  list-style: disc;
  margin-left: 1.25rem;
  padding-left: 0.25rem;
}

.changelog-content :deep(li + li) {
  margin-top: 0.5rem;
}

.changelog-content :deep(a) {
  color: rgb(8 145 178);
  text-decoration: underline;
  text-underline-offset: 0.2rem;
}

.changelog-content :deep(code) {
  background: rgb(245 245 245);
  border-radius: 0.375rem;
  color: rgb(38 38 38);
  font-family: "JetBrains Mono", monospace;
  font-size: 0.875rem;
  padding: 0.125rem 0.375rem;
}

.dark .changelog-content :deep(h1),
.dark .changelog-content :deep(h2),
.dark .changelog-content :deep(h3) {
  color: rgb(245 245 245);
}

.dark .changelog-content :deep(p),
.dark .changelog-content :deep(ul) {
  color: rgb(212 212 212);
}

.dark .changelog-content :deep(a) {
  color: rgb(103 232 249);
}

.dark .changelog-content :deep(code) {
  background: rgb(38 38 38);
  color: rgb(229 229 229);
}
</style>
