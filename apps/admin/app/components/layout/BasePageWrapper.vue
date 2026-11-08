<template>
  <UDashboardPanel
    id="main"
    class="min-h-0 flex-1 overflow-hidden rounded-md"
    :ui="{
      root: 'border border-neutral-200 bg-neutral-50 text-neutral-950 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100',
    }"
  >
    <div class="flex h-full w-full flex-col overflow-hidden">
      <div class="relative min-h-0 w-full flex-1 overflow-hidden">
        <slot />
      </div>

      <div
        class="shrink-0 border-t border-neutral-200 px-1 py-0.5 dark:border-neutral-800"
      >
        <TheStatusBar />
      </div>
    </div>
  </UDashboardPanel>
</template>
