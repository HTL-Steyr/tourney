<script setup lang="ts">
import type { Match } from "@tourney/types"
import { z } from "zod"
import { getImageUrl } from "#imports"

const { id, match, score1, score2, winner } = defineProps<{
  id: string
  match: Match
  score1: number
  score2: number
  winner: string | null
}>()

const logoTeam1 = computed(
  () => match.team1?.logo_variant?.image_path ?? match.team1?.logo?.image_path,
)
const logoTeam2 = computed(
  () => match.team2?.logo_variant?.image_path ?? match.team2?.logo?.image_path,
)

const stateWinner = computed(() => {
  if (editState.score1 > editState.score2) return match.team1
  if (editState.score1 < editState.score2) return match.team2
  return null
})

const isOpenEdit = ref<boolean>(false)
const editSchema = z.object({
  score1: z.number(),
  score2: z.number(),
})

const editState = reactive({
  score1: score1,
  score2: score2,
})

const resetEditState = () => {
  editState.score1 = score1
  editState.score2 = score2
}

watch(isOpenEdit, (isOpen) => {
  if (isOpen) return

  resetEditState()
})

watch(
  () => [score1, score2],
  () => {
    if (isOpenEdit.value) return

    resetEditState()
  },
)

const supabase = useDatabaseClient()
const emit = defineEmits(["refresh"])
const onSubmitEdit = async () => {
  try {
    const { error } = await supabase
      .from("result")
      .update({
        team1_score: editState.score1,
        team2_score: editState.score2,
        winner_id: stateWinner?.value?.id ?? null,
      })
      .eq("id", id)
    isOpenEdit.value = false
    if (error) {
      throw new Error(error.message)
    }
    displaySuccessNotification("Erfolg", "Das Match wurde aktualisiert.")
    emit("refresh")
  } catch (error) {
    const err = error as Error
    displayFailureNotification("Fehler", err.message)
    throw createError({
      statusMessage: err.message,
    })
  }
}
</script>

<template>
  <ModalEdit
    v-model="isOpenEdit"
    modal-width="sm:max-w-md"
    @edit="onSubmitEdit"
  >
    <UForm :schema="editSchema" :state="editState" class="space-y-4">
      <div class="flex justify-between">
        <UFormField
          :label="match.team1?.name"
          name="score1"
          description="Punkteanzahl"
          required
        >
          <UInput v-model="editState.score1" type="number" />
        </UFormField>
        <UFormField
          :label="match.team2?.name"
          name="score2"
          description="Punkteanzahl"
          required
        >
          <UInput v-model="editState.score2" type="number" />
        </UFormField>
      </div>
      <p>
        Anhand von diesen Angaben, ist
        <strong class="text-primary-500">{{
          stateWinner?.name ?? "keiner"
        }}</strong>
        der Gewinner.
      </p>
      <p v-if="winner === null">Somit ein Unentschieden.</p>
    </UForm>
  </ModalEdit>
  <div class="rounded-md border border-neutral-200 dark:border-neutral-700">
    <div
      class="flex justify-between gap-0.5 rounded-t-md border-b border-neutral-200 bg-neutral-100 p-0.5 dark:border-neutral-700 dark:bg-neutral-800"
    >
      <div class="flex w-full justify-between">
        <div class="flex gap-0.5">
          <UBadge
            :label="match.round ?? 'Unbekannte Runde'"
            color="secondary"
            variant="subtle"
            block
          />
          <UBadge
            :label="match.start_time!"
            color="neutral"
            variant="outline"
            icon="i-heroicons-clock"
            block
          />
          <UBadge
            :label="match.end_time!"
            color="neutral"
            variant="outline"
            icon="i-heroicons-bell"
            block
          />
        </div>

        <UButton
          icon="i-heroicons-pencil"
          color="neutral"
          variant="outline"
          size="xs"
          square
          @click="isOpenEdit = true"
        />
      </div>
    </div>
    <div class="flex flex-col items-center justify-between gap-1 px-6 py-3">
      <div class="flex w-full items-center justify-between">
        <div class="flex flex-col items-center space-y-1">
          <NuxtImg
            width="36"
            height="36"
            :src="getImageUrl(logoTeam1!)"
            :class="{
              'dark:invert dark:filter': match.team1?.logo_variant === null,
            }"
          />
          <p :class="['text-xs', winner === match.team1?.id && 'font-bold']">
            {{ match.team1?.name }}
          </p>
          <p class="text-xs text-neutral-500">{{ match.team1?.group?.name }}</p>
        </div>
        <div class="flex items-center gap-5">
          <p class="text-4xl font-bold">{{ score1 }}</p>
          <p>vs</p>
          <p class="text-4xl font-bold">{{ score2 }}</p>
        </div>
        <div class="flex flex-col items-center space-y-1">
          <NuxtImg
            width="36"
            height="36"
            :src="getImageUrl(logoTeam2!)"
            :class="{
              'dark:invert dark:filter': match.team2?.logo_variant === null,
            }"
          />
          <p :class="['text-xs', winner === match.team2?.id && 'font-bold']">
            {{ match.team2?.name }}
          </p>
          <p class="text-xs text-neutral-500">{{ match.team2?.group?.name }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
