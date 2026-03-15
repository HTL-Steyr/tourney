<script setup lang="ts">
import type { PageFeatureProps } from "@nuxt/ui"

definePageMeta({
  colorMode: "light",
})

const {
  public: { siteUrl, adminAppUrl, viewerAppUrl, muxDemoPlaybackId },
} = useRuntimeConfig()

const demoVideoPlaybackId = computed(() => muxDemoPlaybackId.trim())

const description =
  "Die Plattform, die komplexe Brackets verwaltet, maßgeschneiderte Spielpläne entwirft und die Organisation übernimmt, während sich dein Team auf alles andere konzentriert."

useSeoMeta({
  title: "Tourney",
  description,
  ogTitle: "Tourney - Turniere veranstalten. Ohne das Chaos.",
  ogDescription: description,
  ogType: "website",
  ogUrl: siteUrl,
  ogImage: `${siteUrl}/ogImage.jpg`,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: "Tourney – Turnierplattform",
  ogLocale: "de_AT",
  twitterCard: "summary_large_image",
  twitterTitle: "Tourney – Turniere veranstalten. Ohne das Chaos.",
  twitterDescription: description,
  twitterImage: `${siteUrl}/ogImage.jpg`,
  robots: "index, follow",
})

useHead({
  link: [{ rel: "canonical", href: siteUrl }],
  script: [
    {
      src: "https://cdn.jsdelivr.net/npm/@mux/mux-player",
      defer: true,
    },
  ],
})

const items = [
  {
    label: "GitHub",
    to: "https://github.com/HTL-Steyr/tourney",
    target: "_blank",
  },
  {
    label: "Impressum",
    to: "https://dino-kupinic.dev/impressum",
    target: "_blank",
  },
  {
    label: "Releases",
    to: "https://github.com/HTL-Steyr/tourney/releases",
    target: "_blank",
  },
]

const cards = ref([
  {
    title: "Turniere",
    description:
      "Erstelle Fußball-, Volleyball- oder Basketballturniere mit Regeln, Zeitfenstern, Preisen und automatischer Gruppeneinteilung.",
    icon: "i-lucide-trophy",
    target: "_blank",
    class: "lg:col-span-2",
    orientation: "horizontal" as const,
  },
  {
    title: "Live-Steuerung",
    description:
      "Starte Gruppenphasen, setze Matches live und aktualisiere Ergebnisse direkt während des Events.",
    icon: "i-lucide-signal",
    target: "_blank",
    variant: "soft" as const,
  },
  {
    title: "Klassen und Jahrgänge pflegen",
    description:
      "Verwalte Klassen pro Schuljahr als Grundlage für Team- und Anmeldelogik.",
    icon: "i-lucide-graduation-cap",
    target: "_blank",
    variant: "soft" as const,
  },
  {
    title: "Aktuelles veröffentlichen",
    description: "Bearbeite Neuigkeiten direkt im Dashboard",
    icon: "i-lucide-newspaper",
    target: "_blank",
    variant: "soft" as const,
  },
  {
    title: "Anmeldungen verwalten",
    description:
      "Erstelle Registrierungslinks, verwalte Teams und bearbeite den Status von Anmeldungen zentral.",
    icon: "i-lucide-ticket",
    target: "_blank",
    class: "lg:row-span-2",
  },
  {
    title: "Galerie verwalten",
    description: "Lade Fotos hoch und verwalte diese im Medienbereich.",
    icon: "i-lucide-images",
    target: "_blank",
  },
  {
    title: "Turnierdetails und Platzierungen",
    description: "Jedes Turnier hat eine öffentliche Detailseite",
    icon: "i-lucide-list-ordered",
    target: "_blank",
    variant: "soft" as const,
  },
])

const features = ref<PageFeatureProps[]>([
  {
    title: "Turnierdetails für alle",
    description:
      "Alle Turniere mit Datum, Ort, Regeln und Preisen sind im Viewer öffentlich und ohne Login zugänglich.",
    icon: "i-lucide-calendar-days",
    to: `${viewerAppUrl}/tournaments`,
  },
  {
    title: "Live-Flow und Tabellen",
    description:
      "Turnierbaum, laufende Matches und Gruppenstände werden in Echtzeit aktualisiert.",
    icon: "i-lucide-git-branch-plus",
    to: `${viewerAppUrl}/live`,
  },
  {
    title: "Medien und Updates",
    description: "Neuigkeiten schreiben, Bilder hochladen und veröffentlichen.",
    icon: "i-lucide-images",
    to: `${viewerAppUrl}/media`,
  },
])
</script>

<template>
  <UPage>
    <header class="flex w-full justify-between p-4 pb-2">
      <div class="flex items-center gap-3 font-mono">
        <NuxtLink to="https://dino-kupinic.dev" target="_blank">
          <NuxtImg
            src="/logo_dk.png"
            alt="dino-kupinic.dev logo"
            width="32"
            height="32"
          />
        </NuxtLink>
        <p>/</p>
        <NuxtLink to="https://dino-kupinic.dev/project/tourney" target="_blank">
          <strong class="hover:text-primary tracking-tight">Tourney</strong>
        </NuxtLink>
      </div>
      <NuxtLink to="https://dino-kupinic.dev" target="_blank">
        <div class="hidden space-x-3 sm:block">
          <span>Mehr auf</span>
          <span class="text-primary border p-1">
            ★ www.dino-kupinic.dev ★
          </span>
        </div>
      </NuxtLink>
    </header>
    <main class="relative overflow-hidden pt-32 pb-24 md:pt-40">
      <div class="mx-auto max-w-7xl px-6 lg:px-8">
        <div class="max-w-3xl">
          <h1
            class="mb-6 text-4xl leading-tight font-bold tracking-tighter text-neutral-900 md:text-7xl"
          >
            Turniere veranstalten. <br />
            Ohne das Chaos.
          </h1>
          <p
            class="mb-6 max-w-2xl text-lg leading-tight text-neutral-500 sm:mb-10 md:text-xl"
          >
            Die Plattform, die komplexe Brackets verwaltet, maßgeschneiderte
            Spielpläne entwirft und die Organisation übernimmt, während sich
            dein Team auf alles andere konzentriert.
          </p>
          <div
            class="flex flex-row items-start gap-2 sm:flex-row sm:items-center sm:gap-4"
          >
            <NuxtLink
              :to="viewerAppUrl"
              external
              class="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm transition-all hover:bg-blue-700 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:outline-none active:scale-95"
            >
              Zuschauen
            </NuxtLink>
            <NuxtLink
              :to="adminAppUrl"
              external
              class="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-6 py-3 text-base font-medium text-neutral-700 transition-all hover:border-neutral-300 hover:bg-neutral-50"
            >
              Dashboard
            </NuxtLink>
          </div>
        </div>

        <div id="video-demo" class="relative mt-20">
          <div
            class="overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950 shadow-2xl"
          >
            <div
              class="pointer-events-none hidden h-12 items-center gap-2 border-b border-white/10 bg-neutral-950/90 px-6 sm:flex"
            >
              <div class="flex gap-2">
                <div class="h-3 w-3 rounded-full bg-red-500/80"></div>
                <div class="h-3 w-3 rounded-full bg-yellow-500/80"></div>
                <div class="h-3 w-3 rounded-full bg-green-500/80"></div>
              </div>
            </div>

            <div class="aspect-video w-full">
              <ClientOnly v-if="demoVideoPlaybackId">
                <mux-player
                  :playback-id="demoVideoPlaybackId"
                  stream-type="on-demand"
                  metadata-video-title="Tourney Produktdemo"
                  thumbnail-time="5"
                  class="h-full w-full"
                />
              </ClientOnly>
            </div>
          </div>
        </div>

        <div id="features" class="mt-32 border-t border-neutral-100 pt-16">
          <UPageGrid>
            <UPageCard
              v-for="(card, index) in cards"
              :key="index"
              v-bind="card"
            >
            </UPageCard>
          </UPageGrid>
        </div>

        <UPageSection
          title="Alles für den Turniertag"
          description="Vom Anmeldeprozess bis zur Live-Auswertung alles in einer gemeinsamen Plattform."
          orientation="horizontal"
          :features="features"
        >
          <div class="w-full">
            <NuxtImg
              src="/football.jpg"
              width="600"
              height="700"
              alt="Fußballspieler bei einem Turnier"
              class="w-full rounded-2xl shadow-md"
              loading="lazy"
            />
            <p class="mt-2 text-right text-xs text-neutral-400">
              Bildquelle:
              <NuxtLink
                to="https://www.freepik.com"
                external
                target="_blank"
                class="underline underline-offset-2 hover:text-neutral-600"
              >
                freepik.com
              </NuxtLink>
            </p>
          </div>
        </UPageSection>

        <div
          class="relative my-32 overflow-hidden rounded-[3rem] bg-neutral-900 px-6 py-20 text-center text-white lg:py-24"
        >
          <div
            class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.3),transparent_50%)]"
          ></div>

          <div class="relative z-10 mx-auto max-w-3xl">
            <h2
              class="mb-6 text-4xl font-semibold tracking-tighter md:text-6xl"
            >
              Bereit, deine Turniere auf das nächste Level zu bringen?
            </h2>
            <p class="mx-auto mb-10 max-w-xl text-lg text-neutral-400">
              Erstelle dein erstes Turnier in Sekunden und erlebe, wie Tourney
              die Organisation übernimmt, damit du dich auf das Wesentliche
              konzentrieren kannst
            </p>
            <div
              class="flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <NuxtLink
                :to="adminAppUrl"
                external
                class="inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-8 py-4 text-base font-medium text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all hover:bg-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:outline-none active:scale-95 sm:w-auto"
              >
                Dashboard
              </NuxtLink>
              <NuxtLink
                :to="viewerAppUrl"
                external
                class="inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white/10 px-8 py-4 text-base font-medium text-white backdrop-blur-md transition-all hover:bg-white/20 sm:w-auto"
              >
                Zuschauen
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </main>

    <UFooter>
      <template #left>
        <p class="text-muted text-sm">
          Copyright © {{ new Date().getFullYear() }} Dino Kupinic
        </p>
      </template>

      <UNavigationMenu :items="items" variant="link" />

      <template #right>
        <UButton
          icon="i-simple-icons-github"
          color="neutral"
          variant="ghost"
          to="https://github.com/HTL-Steyr/tourney"
          target="_blank"
          aria-label="GitHub"
        />
      </template>
    </UFooter>
  </UPage>
</template>
