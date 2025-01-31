<script setup lang="ts">
import type { Enums } from "~/types/database.types"

defineProps<{
  schema: any
  state: any
}>()

const sports: Enums<"sport_type">[] = ["Fußball", "Basketball", "Volleyball"]
const client = useSupabaseClient()
const { data } = await client.storage.from("images").list("tournament")
const thumbnails = computed(() => {
  const temp = data?.filter((image) => image.name !== ".emptyFolderPlaceholder")
  return temp?.map((image) => `/tournament/${image.name}`)
})
</script>

<template>
  <UForm :schema="schema" :state="state" class="pt-2" :validate-on="[]">
    <div class="flex h-full w-full justify-between gap-6">
      <div class="flex w-[28rem] flex-col gap-3">
        <div class="flex space-x-3">
          <UFormGroup label="Name" name="name" class="grow" required>
            <UInput
              v-model="state.name"
              placeholder="Fußball Turnier 2024/25"
            />
          </UFormGroup>
          <UFormGroup label="Sportart" name="sport" required>
            <USelect
              v-model="state.sport"
              placeholder="Sport auswählen"
              :options="sports"
              class="w-40"
            />
          </UFormGroup>
        </div>

        <UFormGroup class="grow" label="Ort" name="location" required>
          <UInput v-model="state.location" />
        </UFormGroup>

        <UFormGroup label="Regeln" name="rules">
          <UTextarea
            v-model="state.rules"
            :rows="4"
            placeholder="Lorem Ipsum..."
          />
        </UFormGroup>

        <div
          class="flex flex-col gap-3 rounded-md border border-gray-200 p-3 dark:border-gray-700"
        >
          <UFormGroup
            label="Startdatum"
            name="start_date"
            description="An diesem Datum findet das Turnier statt."
            required
          >
            <UInput v-model="state.start_date" type="date" />
          </UFormGroup>

          <div class="flex space-x-3">
            <UFormGroup label="Von" name="from" required class="grow">
              <UInput v-model="state.from" type="time" :step="2" />
            </UFormGroup>

            <UFormGroup label="Bis" name="to" required class="grow">
              <UInput v-model="state.to" type="time" :step="2" />
            </UFormGroup>
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-3">
        <UFormGroup
          label="Vorschaubild"
          name="thumbnail_path"
          description="Ein Bild für das Turnier."
          required
        >
          <USelectMenu
            v-model="state.thumbnail_path"
            :options="thumbnails"
            placeholder="Bild auswählen"
          >
            <template #option="{ option }">
              <span class="font-mono text-xs">{{ option }}</span>
            </template>
          </USelectMenu>
        </UFormGroup>
        <p class="text-xs text-gray-500">
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
        <UFormGroup label="Preise">
          <div
            class="flex flex-col gap-3 rounded-md bg-gray-50 p-3 dark:bg-gray-800"
          >
            <UFormGroup label="Erster Platz" name="prizes.first">
              <UInput v-model="state.prizes.first" placeholder="Pokal" />
            </UFormGroup>
            <div class="flex space-x-3">
              <UFormGroup label="Zweiter Platz" name="prizes.second">
                <UInput
                  v-model="state.prizes.second"
                  placeholder="Silver Medaille"
                />
              </UFormGroup>
              <UFormGroup label="Dritter Platz" name="prizes.third">
                <UInput
                  v-model="state.prizes.third"
                  placeholder="Bronze Medaille"
                />
              </UFormGroup>
            </div>
            <UFormGroup label="Sonstiges" name="prizes.bonus">
              <UTextarea
                v-model="state.prizes.bonus"
                :rows="5"
                placeholder="Eis, Frankfurter, etc."
              />
            </UFormGroup>
          </div>
        </UFormGroup>
      </div>
    </div>
  </UForm>
</template>
