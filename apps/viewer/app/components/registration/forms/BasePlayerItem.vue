<script setup lang="ts">
import type { Tables } from "@tourney/types"
import { formLocked } from "../../../keys/isFormLocked"
import { classMixing } from "../../../keys/allowClassMixing"

const { index } = defineProps<{
  index: number
  name: string
  schoolClasses: Tables<"class">[]
}>()

const firstName = defineModel<string>("firstName")
const lastName = defineModel<string>("lastName")
const schoolClass = defineModel<Tables<"class">>("schoolClass")

const isLocked = inject(formLocked)
const allowClassMixing = inject(classMixing)

const fNameInput = `players.${index}.firstName`
const lNameInput = `players.${index}.lastName`
const schoolClassInput = `players.${index}.schoolClass`
</script>

<template>
  <RegistrationItem>
    <div class="flex w-full grow flex-col gap-3">
      <div
        class="w-full rounded-md border border-neutral-200 bg-white p-1 text-center dark:border-neutral-600 dark:bg-neutral-700"
      >
        <strong class="text-base"> {{ name }} </strong>
      </div>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <UFormField label="Vorname" :name="fNameInput" size="lg" class="w-full">
          <UInput
            v-model="firstName"
            placeholder="Max"
            :disabled="isLocked"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Nachname"
          :name="lNameInput"
          size="lg"
          class="w-full"
        >
          <UInput
            v-model="lastName"
            placeholder="Mustermann"
            :disabled="isLocked"
            class="w-full"
          />
        </UFormField>
      </div>
      <UFormField
        v-if="allowClassMixing"
        label="Klasse"
        :name="schoolClassInput"
        size="lg"
        class="w-full"
      >
        <USelectMenu
          v-model="schoolClass"
          :items="schoolClasses ?? []"
          label-key="name"
          :disabled="isLocked"
          class="w-full"
        />
      </UFormField>
    </div>
  </RegistrationItem>
</template>
