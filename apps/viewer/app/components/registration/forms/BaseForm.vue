<script setup lang="ts">
import { z } from "zod"
import type { FormPlayer, Tables } from "@tourney/types"

const { playerCount, defaultClass } = defineProps<{
  playerCount: number
  defaultClass: Tables<"class"> | null | undefined
}>()

if (defaultClass === undefined || defaultClass === null) {
  throw createError({
    statusCode: 404,
    message: "Klasse nicht gefunden",
  })
}
const validDefaultClass = defaultClass as Tables<"class">

const { data: schoolClasses } = await useFetch("/api/classes")

const model = defineModel<FormPlayer[]>("players")
const PLAYER_LENGTH = ref<number>(playerCount)

const schema = ref(
  z.object({
    players: z
      .array(
        z.object({
          firstName: z
            .string()
            .min(1, "Feld 'Vorname' muss einen Wert enthalten"),
          lastName: z
            .string()
            .min(1, "Feld 'Nachname' muss einen Wert enthalten"),
          schoolClass: z.custom<Tables<"class">>(),
        }),
      )
      .length(PLAYER_LENGTH.value),
  }),
)

function updateStatePlayers(newCount: number) {
  state.players = Array.from({ length: newCount }, () => ({
    firstName: "",
    lastName: "",
    schoolClass: validDefaultClass,
  }))
}

watch(
  () => playerCount,
  (newCount) => {
    PLAYER_LENGTH.value = newCount
    schema.value = z.object({
      players: z
        .array(
          z.object({
            firstName: z
              .string()
              .min(1, "Feld 'Vorname' muss einen Wert enthalten"),
            lastName: z
              .string()
              .min(1, "Feld 'Nachname' muss einen Wert enthalten"),
            schoolClass: z.custom<Tables<"class">>(),
          }),
        )
        .length(newCount),
    })
    updateStatePlayers(newCount)
  },
)

type Schema = z.output<typeof schema.value>
const state = reactive({
  players: Array.from({ length: PLAYER_LENGTH.value }, () => ({
    firstName: "",
    lastName: "",
    schoolClass: validDefaultClass,
  })),
})

type FormError = {
  path: string
  message: string
}

type FormRef = {
  setErrors: (errors: FormError[]) => void
}

const form = useTemplateRef<FormRef>("form")

async function submitForm() {
  try {
    const result = schema.value.safeParse(state)
    if (!result.success) {
      const formErrors = result.error.errors.map((err) => ({
        path: err.path.join("."),
        message: err.message,
      }))
      form.value?.setErrors(formErrors)
      return false
    } else {
      model.value = state.players
      return true
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: "Unerwarteter Fehler bei der Validierung",
    })
  }
}

defineExpose({ submitForm })
</script>

<template>
  <UForm :schema="schema" :state="state" class="my-2 space-y-4" ref="form">
    <template v-for="(player, index) in state.players" :key="index">
      <BasePlayerItem
        :index
        :name="'Spieler ' + (index + 1)"
        :schoolClasses="schoolClasses ?? []"
        v-model:first-name="player.firstName"
        v-model:last-name="player.lastName"
        v-model:school-class="player.schoolClass"
      />
    </template>
  </UForm>
</template>
