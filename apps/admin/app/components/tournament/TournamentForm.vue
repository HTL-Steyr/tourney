<script setup lang="ts">
import type { Enums } from "@tourney/types"

defineProps<{
  schema: any
  state: any
}>()

const sports: Enums<"sport_type">[] = ["Fußball", "Basketball", "Volleyball"]
const client = useSupabaseClient()
const { data: images } = useAsyncData(
  "admin-tournament-thumbnails",
  async () => {
    const { data } = await client.storage.from("images").list("tournament")
    return data ?? []
  },
  {
    default: () => [],
  },
)

const thumbnails = computed(() => {
  const temp = images.value?.filter(
    (image) => image.name !== ".emptyFolderPlaceholder",
  )
  return temp?.map((image) => `/tournament/${image.name}`)
})
</script>

<template>
  <UForm :schema="schema" :state="state" class="h-full pt-2" :validate-on="[]">
    <div class="grid h-full gap-6 lg:grid-cols-2">
      <div class="flex h-full flex-col gap-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <UFormField label="Name" name="name" class="w-full" required>
            <UInput
              v-model="state.name"
              placeholder="Fußball Turnier 2024/25"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Sportart" name="sport" class="w-full" required>
            <USelect
              v-model="state.sport"
              placeholder="Sport auswählen"
              :items="sports"
              class="w-full"
            />
          </UFormField>
        </div>

        <UFormField class="w-full" label="Ort" name="location" required>
          <UInput v-model="state.location" class="w-full" />
        </UFormField>

        <UFormField class="w-full" label="Regeln" name="rules">
          <UTextarea
            v-model="state.rules"
            :rows="4"
            placeholder="Lorem Ipsum..."
            class="w-full"
          />
        </UFormField>

        <div
          class="grid flex-1 gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
        >
          <div
            class="flex h-full flex-col gap-3 rounded-md border border-neutral-200 p-3 dark:border-neutral-700"
          >
            <UFormField
              label="Startdatum"
              name="start_date"
              description="An diesem Datum findet es statt."
              required
            >
              <UInput v-model="state.start_date" type="date" class="w-full" />
            </UFormField>

            <div class="flex space-x-1">
              <UFormField label="Von" name="from" required class="grow">
                <UInput
                  v-model="state.from"
                  type="time"
                  :step="60"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Bis" name="to" required class="grow">
                <UInput
                  v-model="state.to"
                  type="time"
                  :step="60"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>

          <div
            class="flex h-full flex-col gap-3 rounded-md border border-neutral-200 p-3 dark:border-neutral-700"
          >
            <UFormField
              label="Knockout Interval"
              name="knockout_interval"
              description="Matchlänge für Matches nach Gruppenphase."
              required
            >
              <UInput
                v-model="state.knockout_interval"
                type="number"
                class="w-full"
              />
            </UFormField>
          </div>
        </div>
      </div>
      <div class="flex h-full flex-col gap-4">
        <UFormField
          label="Vorschaubild"
          name="thumbnail_path"
          description="Ein Bild für das Turnier."
          class="w-full"
          required
        >
          <USelectMenu
            v-model="state.thumbnail_path"
            :items="thumbnails"
            placeholder="Bild auswählen"
            class="w-full"
          >
            <template #item-label="{ item }">
              <span class="font-mono text-xs">{{ item }}</span>
            </template>
          </USelectMenu>
        </UFormField>
        <p class="text-xs text-neutral-500">
          Keine Bilder? Lade eins hoch in
          <NuxtLink to="/gallery">
            <span class="text-primary-500">Galerie</span>
            <UIcon
              name="i-heroicons-arrow-up-right"
              class="text-primary-500 ml-0.5 pt-1"
              size="10"
            />
          </NuxtLink>
        </p>
        <UFormField label="Preise" class="flex-1">
          <div
            class="flex h-full flex-col gap-3 rounded-md bg-neutral-50 p-3 dark:bg-neutral-800"
          >
            <UFormField label="Erster Platz" name="prizes.first">
              <UInput
                v-model="state.prizes.first"
                placeholder="Pokal"
                class="w-full"
              />
            </UFormField>
            <div class="grid gap-3 sm:grid-cols-2">
              <UFormField
                label="Zweiter Platz"
                name="prizes.second"
                class="w-full"
              >
                <UInput
                  v-model="state.prizes.second"
                  placeholder="Silver Medaille"
                  class="w-full"
                />
              </UFormField>
              <UFormField
                label="Dritter Platz"
                name="prizes.third"
                class="w-full"
              >
                <UInput
                  v-model="state.prizes.third"
                  placeholder="Bronze Medaille"
                  class="w-full"
                />
              </UFormField>
            </div>
            <UFormField label="Sonstiges" name="prizes.bonus" class="flex-1">
              <UTextarea
                v-model="state.prizes.bonus"
                :rows="5"
                placeholder="Eis, Frankfurter, etc."
                class="w-full"
              />
            </UFormField>
          </div>
        </UFormField>
      </div>
    </div>
  </UForm>
</template>
