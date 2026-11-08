<script setup lang="ts">
useHead({
  title: "Willkommen",
})
</script>

<template>
  <div
    class="m-auto flex h-dvh max-w-[768px] flex-col items-center justify-between pt-16 pb-32 dark:bg-neutral-900"
  >
    <div>
      <div class="w-[280px]">
        <Logo class="m-auto mb-8 h-16 w-16" />
        <PageTitle class="mb-2">Willkommen bei Tourney</PageTitle>
        <p class="text text-sm tracking-wide text-wrap text-neutral-500">
          Verfolge das Fußball-, Volleyball- und Basketballturnier der HTL Steyr
          live auf deinem Handy oder Laptop.
        </p>
      </div>
      <div class="mt-8 flex items-center justify-center gap-2">
        <div
          class="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-3xl"
        >
          🏐
        </div>
        <div
          class="bg-primary-100 flex h-24 w-24 items-center justify-center rounded-full text-5xl"
        >
          ⚽️
        </div>
        <div
          class="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 text-3xl"
        >
          🏀
        </div>
      </div>
      <div class="my-12 flex justify-center">
        <UButton
          label="Los geht's"
          size="xl"
          variant="soft"
          to="/tournaments"
          class="rounded-xl px-8 py-3"
        />
      </div>
    </div>
    <div class="text text-sm tracking-wide text-neutral-500">
      <p>Entwickelt von Dino Kupinic</p>
      <p>Projekt betreut von Prof. Mag. Peter Rathgeb</p>
      <br />
      <p>Copyright © 2024 - {{ new Date().getFullYear() }} HTBLA Steyr</p>
    </div>
  </div>
</template>
