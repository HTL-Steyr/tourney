<script setup lang="ts">
import type { Match } from "@tourney/types"
import { getImageUrl } from "#imports"

const { match } = defineProps<{ match: Match }>()

const logoTeam1 = computed(
  () => match.team1?.logo_variant?.image_path ?? match.team1?.logo?.image_path,
)
const logoTeam2 = computed(
  () => match.team2?.logo_variant?.image_path ?? match.team2?.logo?.image_path,
)

const timeElapsed = ref<number>(0)
const isRunning = ref<boolean>(false)

const now = useTimestamp({ immediate: true })

const calculateElapsedTime = () => {
  if (!match.start_time) return
  const [hours = 0, minutes = 0, seconds = 0] = match.start_time
    .split(":")
    .map(Number)
  const startDateTime = new Date()
  startDateTime.setHours(hours, minutes, seconds || 0, 0)
  const startTimeMs = startDateTime.getTime()
  timeElapsed.value = now.value - startTimeMs
}

calculateElapsedTime()

let lastTimestamp = Date.now()
const { resume } = useIntervalFn(
  () => {
    const currentTimestamp = Date.now()
    const delta = currentTimestamp - lastTimestamp
    timeElapsed.value += delta
    lastTimestamp = currentTimestamp
  },
  1,
  { immediate: true },
)

const startStopwatch = () => {
  isRunning.value = true
  resume()
}

startStopwatch()

const formattedTime = computed(() => {
  const totalSeconds = Math.floor(timeElapsed.value / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const milliseconds = timeElapsed.value % 1000

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`
})

const score1 = useState<number>(`score1-${match.match_id}`, () => 0)
const score2 = useState<number>(`score2-${match.match_id}`, () => 0)

const winner = computed(() => {
  if (score1.value > score2.value) return match.team1
  if (score1.value < score2.value) return match.team2
  return null
})

const emit = defineEmits(["finish"])
const isOpenConfirm = ref<boolean>(false)
const supabase = useDatabaseClient()

const isLoading = ref<boolean>(false)
const completeMatch = async () => {
  try {
    isLoading.value = true
    const { error: endTimeError } = await supabase
      .from("match")
      .update({
        end_time: new Date().toLocaleTimeString("de-DE", { hour12: false }),
      })
      .eq("id", match.match_id!)
    if (endTimeError) {
      displayFailureNotification(
        "Fehler",
        endTimeError.message || "Ein Fehler ist aufgetreten.",
      )
      console.error(endTimeError)
      return
    }
    const { error } = await supabase.rpc("record_match_result", {
      p_match_id: match.match_id!,
      p_team1_score: score1.value,
      p_team2_score: score2.value,
    })
    if (error) {
      displayFailureNotification(
        "Fehler",
        error.message || "Ein Fehler ist aufgetreten.",
      )
      console.error(error)
      return
    }
    emit("finish")
    displaySuccessNotification(
      "Match beendet",
      "Das Match wurde erfolgreich beendet.",
    )
    isLoading.value = false
    isOpenConfirm.value = false
  } catch (error) {
    const err = error as Error
    isLoading.value = false
    displayFailureNotification("Fehler", err.message)
    throw createError({
      statusMessage: err.message,
    })
  }
}
</script>

<template>
  <ModalMatch
    v-model="isOpenConfirm"
    @confirm="completeMatch"
    v-model:loading="isLoading"
  >
    <p>
      {{ match.team1?.name }} hat <strong>{{ score1 }}</strong> Punkt(e) <br />
      {{ match.team2?.name }} hat <strong>{{ score2 }}</strong> Punkt(e)
    </p>
    <br />
    <p>
      Anhand von diesen Angaben, wird
      <strong class="text-primary-500">{{ winner?.name ?? "keiner" }}</strong>
      der Gewinner.
    </p>
    <p v-if="winner === null">Somit ein Unentschieden.</p>
  </ModalMatch>
  <div class="rounded-md border border-neutral-200 dark:border-neutral-700">
    <div
      class="flex justify-between gap-0.5 rounded-t-md border-b border-neutral-200 bg-neutral-100 p-0.5 dark:border-neutral-700 dark:bg-neutral-800"
    >
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
          variant="subtle"
          icon="i-heroicons-clock"
          block
          class="tabular-nums"
        />
      </div>
      <ClientOnly>
        <UBadge
          :label="formattedTime"
          icon="i-heroicons-clock"
          color="neutral"
          variant="subtle"
          :trailing="false"
          class="min-w-26 shrink-0 justify-center tabular-nums"
          block
        />
      </ClientOnly>
    </div>
    <div class="flex flex-col items-center justify-between px-6 py-2">
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
          <div class="flex flex-col items-center justify-center">
            <p class="text-xs">{{ match.team1?.name }}</p>
            <p class="text-xs text-neutral-500">
              {{ match.team1?.group?.name }}
            </p>
          </div>
          <div class="space-x-0.5">
            <UButton
              class="rounded-full"
              size="sm"
              color="neutral"
              variant="outline"
              square
              icon="i-heroicons-minus"
              @click="score1 > 0 ? score1-- : 0"
            />
            <UButton
              class="rounded-full"
              size="sm"
              color="neutral"
              variant="outline"
              square
              icon="i-heroicons-plus"
              @click="score1++"
            />
          </div>
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
          <div class="flex flex-col items-center justify-center">
            <p class="text-xs">{{ match.team2?.name }}</p>
            <p class="text-xs text-neutral-500">
              {{ match.team2?.group?.name }}
            </p>
          </div>
          <div class="space-x-0.5">
            <UButton
              class="rounded-full"
              size="sm"
              color="neutral"
              variant="outline"
              square
              icon="i-heroicons-minus"
              @click="score2 > 0 ? score2-- : 0"
            />
            <UButton
              class="rounded-full"
              size="sm"
              color="neutral"
              variant="outline"
              square
              icon="i-heroicons-plus"
              @click="score2++"
            />
          </div>
        </div>
      </div>
      <UButton
        icon="i-heroicons-hand-raised"
        variant="soft"
        color="secondary"
        label="Spiel beenden..."
        size="sm"
        @click="isOpenConfirm = true"
      />
    </div>
  </div>
</template>
