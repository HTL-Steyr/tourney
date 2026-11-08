<script setup lang="ts">
import { createAvatar } from "@dicebear/core"
import { glass } from "@dicebear/collection"

const { name, role, logout } = useUser()
const route = useRoute()
const {
  public: { docsUrl },
} = useRuntimeConfig()
const svg = computed(() =>
  createAvatar(glass, {
    seed: name.value,
  }).toDataUri(),
)
const { liveTournaments, fetchLiveTournaments } = useLiveTournaments()
await fetchLiveTournaments()

function isActive(to: string) {
  if (to === "/") {
    return route.path === to
  }

  return route.path === to || route.path.startsWith(`${to}/`)
}

async function onLogout() {
  await logout()
  return navigateTo("/login")
}

const navigationSearchItems = computed(() => [
  {
    label: "Home",
    icon: "i-heroicons-home",
    to: "/",
  },
  {
    label: "Dashboard",
    icon: "i-heroicons-chart-bar",
    to: "/dashboard",
  },
  {
    label: "Live",
    icon: "i-heroicons-signal",
    to: "/live",
  },
  {
    label: "Turniere",
    icon: "i-heroicons-trophy",
    to: "/tournaments",
  },
  {
    label: "Anmeldung",
    icon: "i-heroicons-ticket",
    to: "/registration",
  },
  {
    label: "Aktuelles",
    icon: "i-heroicons-newspaper",
    to: "/news",
  },
  {
    label: "Galerie",
    icon: "i-heroicons-photo",
    to: "/gallery",
  },
  {
    label: "Aktivität",
    icon: "i-heroicons-queue-list",
    to: "/logs",
  },
  {
    label: "Verwaltung",
    icon: "i-heroicons-squares-2x2",
    to: "/management",
  },
])

const searchGroups = computed(() => [
  {
    id: "navigation",
    label: "Navigation",
    items: navigationSearchItems.value,
  },
  {
    id: "support",
    label: "Hilfe & Konto",
    items: [
      {
        label: "Einstellungen",
        icon: "i-heroicons-cog-8-tooth",
        to: "/settings",
      },
      {
        label: "Dokumentation",
        icon: "i-heroicons-book-open",
        to: docsUrl,
        external: true,
        target: "_blank",
      },
      {
        label: "Hilfe",
        icon: "i-heroicons-question-mark-circle",
        to: docsUrl,
        external: true,
        target: "_blank",
      },
      {
        label: "Was ist neu",
        icon: "i-heroicons-sparkles",
        to: "/new",
      },
      {
        label: "Logout",
        icon: "i-heroicons-arrow-right-on-rectangle",
        color: "error",
        onSelect: onLogout,
      },
    ],
  },
])

const navigationLinks = computed(() => [
  [
    {
      label: "Home",
      icon: "i-heroicons-home",
      to: "/",
      exact: true,
      active: isActive("/"),
    },
    {
      label: "Dashboard",
      icon: "i-heroicons-chart-bar",
      to: "/dashboard",
      exact: true,
      active: isActive("/dashboard"),
    },
  ],
  [
    {
      label: "Live",
      icon: "i-heroicons-signal",
      badge:
        liveTournaments.value > 0
          ? {
              label: liveTournaments.value,
              color: "error",
              variant: "outline",
            }
          : undefined,
      to: "/live",
      exact: true,
      active: isActive("/live"),
    },
    {
      label: "Turniere",
      icon: "i-heroicons-trophy",
      to: "/tournaments",
      exact: true,
      active: isActive("/tournaments"),
    },
    {
      label: "Anmeldung",
      icon: "i-heroicons-ticket",
      to: "/registration",
      exact: true,
      active: isActive("/registration"),
    },
  ],
  [
    {
      label: "Aktuelles",
      icon: "i-heroicons-newspaper",
      to: "/news",
      exact: true,
      active: isActive("/news"),
    },
    {
      label: "Galerie",
      icon: "i-heroicons-photo",
      to: "/gallery",
      exact: true,
      active: isActive("/gallery"),
    },
  ],
  [
    {
      label: "Aktivität",
      icon: "i-heroicons-queue-list",
      to: "/logs",
      exact: true,
      active: isActive("/logs"),
    },
    {
      label: "Verwaltung",
      icon: "i-heroicons-squares-2x2",
      to: "/management",
      exact: true,
      active: isActive("/management"),
    },
  ],
])

const secondaryLinks = computed(() => [
  {
    label: "Was ist neu",
    icon: "i-heroicons-sparkles",
    to: "/new",
    exact: true,
    active: isActive("/new"),
  },
  {
    label: "Hilfe",
    icon: "i-heroicons-question-mark-circle",
    to: docsUrl,
    external: true,
    target: "_blank",
  },
])

const userMenuItems = computed(() => [
  [
    {
      label: "Einstellungen",
      icon: "i-heroicons-cog-8-tooth",
      to: "/settings",
      exact: true,
      active: isActive("/settings"),
    },
  ],
  [
    {
      label: "Logout",
      icon: "i-heroicons-arrow-right-on-rectangle",
      color: "error",
      onSelect: onLogout,
    },
  ],
])
</script>

<template>
  <UDashboardSidebar
    id="navigation"
    :default-size="12"
    :min-size="12"
    :max-size="16"
    resizable
    :toggle="{ color: 'neutral', variant: 'ghost', size: 'sm' }"
    :ui="{
      root: 'h-full !min-h-0 rounded-md border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900',
      header: 'px-3 py-3',
      body: 'gap-2 px-2 py-2',
      footer: 'border-t border-neutral-200 px-2 py-2 dark:border-neutral-800',
      content: 'bg-white dark:bg-neutral-900',
    }"
  >
    <template #header>
      <NuxtLink to="/" class="flex items-center gap-3 px-1">
        <Logo class="h-8 w-8 shrink-0" />
        <div class="min-w-0">
          <p
            class="truncate text-sm font-semibold text-neutral-950 dark:text-white"
          >
            Tourney
          </p>
          <p class="text-xs text-neutral-500 dark:text-neutral-400">Admin</p>
        </div>
      </NuxtLink>
    </template>

    <UDashboardSearchButton
      variant="soft"
      :kbds="['meta', 'k']"
      label="Suchen..."
    />
    <UDashboardSearch :groups="searchGroups" size="lg" />

    <UNavigationMenu
      :items="navigationLinks"
      orientation="vertical"
      color="neutral"
      class="grow"
    />

    <UNavigationMenu
      :items="secondaryLinks"
      orientation="vertical"
      color="neutral"
      :external-icon="false"
    />

    <template #footer>
      <UDropdownMenu
        :items="userMenuItems"
        :content="{ align: 'end', side: 'top' }"
        class="w-full"
        v-slot="{ open }"
      >
        <UButton
          color="neutral"
          variant="ghost"
          class="w-full justify-between rounded-lg py-2"
        >
          <div class="flex min-w-0 items-center gap-2">
            <img
              :src="svg"
              :alt="name"
              class="h-5 w-5 rounded-full bg-neutral-100 object-cover dark:bg-neutral-800"
            />
            <div class="flex min-w-0 items-center gap-2">
              <p
                class="truncate text-sm font-semibold text-neutral-500 dark:text-neutral-300"
              >
                {{ name }}
              </p>
              <UBadge color="primary" variant="subtle" size="sm">
                {{ role }}
              </UBadge>
            </div>
          </div>

          <UIcon
            name="i-heroicons-chevron-down-20-solid"
            class="h-4 w-4 shrink-0 text-neutral-400 transition-transform dark:text-neutral-500"
            :class="[open && 'rotate-180 transform']"
          />
        </UButton>
      </UDropdownMenu>
    </template>
  </UDashboardSidebar>
</template>
