<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui"
import getNavLinks, { type NavLink } from "../../utils/getNavLinks"

const route = useRoute()

const items = computed<NavigationMenuItem[][]>(() => [
  getNavLinks().map((link: NavLink) => ({
    ...link,
    active: route.path === link.to || route.path.startsWith(`${link.to}/`),
  })),
])
</script>

<template>
  <div
    class="flex w-full items-center gap-3 border-b border-neutral-200 bg-neutral-50/90 px-4 py-2 backdrop-blur-lg dark:border-neutral-800 dark:bg-neutral-900/90"
  >
    <UNavigationMenu
      :items="items"
      color="primary"
      class="min-w-0"
      :ui="{
        root: 'min-w-0',
        list: 'gap-1 flex-nowrap',
        link: 'rounded-md px-3 py-2 text-sm font-medium',
        linkLeadingIcon: 'h-4 w-4',
      }"
    />
    <SettingsButton size="sm" class="ml-auto shrink-0" />
  </div>
</template>
