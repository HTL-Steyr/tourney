<script setup lang="ts"></script>

<template>
  <div class="flex h-dvh w-full justify-center bg-white dark:bg-neutral-950">
    <div
      class="flex h-dvh min-h-0 w-full max-w-[1440px] flex-col border-x border-neutral-200 dark:border-neutral-800"
    >
      <TheNavigation />
      <div class="min-h-0 grow overflow-y-auto p-6 pb-0">
        <slot />
      </div>
    </div>
  </div>
</template>
