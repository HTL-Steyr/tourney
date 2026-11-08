<script setup lang="ts">
import { z } from "zod"
import type { FormSubmitEvent } from "#ui/types"

definePageMeta({
  layout: false,
})

useHead({
  title: "Login",
})

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string(),
})

type Schema = z.output<typeof schema>
const state = reactive({
  email: undefined,
  password: undefined,
})

const loginError = ref("")
const { login } = useUser()
const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  loginError.value = ""
  const { data, error } = await login(event.data.email, event.data.password)
  if (error) {
    loginError.value =
      error.code === "invalid_credentials"
        ? "E-Mail-Adresse oder Passwort ist falsch."
        : "Die Anmeldung ist fehlgeschlagen. Bitte versuchen Sie es erneut."
    return
  }
  if (data.user) await navigateTo("/")
}
</script>

<template>
  <div class="flex h-dvh w-full items-center justify-center">
    <UCard
      class="w-full sm:w-96"
      :ui="{
        body: {
          padding: 'px-4 py-5 sm:p-6',
        },
        header: {
          padding: 'px-4 py-5 sm:px-4',
        },
        footer: {
          padding: 'px-4 py-4 sm:px-6',
        },
      }"
    >
      <template #header>
        <div class="flex flex-col items-center space-y-3">
          <Logo class="h-12 w-12" />
          <HeaderTitle>TOURNEY LOGIN</HeaderTitle>
        </div>
      </template>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UAlert
          v-if="loginError"
          color="red"
          :title="loginError"
          role="alert"
        />
        <UFormGroup label="E-mail" name="email">
          <UInput v-model="state.email" />
        </UFormGroup>

        <UFormGroup label="Passwort" name="password">
          <UInput v-model="state.password" type="password" />
        </UFormGroup>

        <UButton type="submit" label="Einloggen" />
      </UForm>
      <template #footer>
        <div class="text-sm">
          <strong>Wo kriege ich meine Daten?</strong>
          <br />
          <span>
            Die Anmeldedaten werden Ihnen auf die Schul Mail
            <code>(@htl-steyr.ac.at)</code> geschickt.
          </span>
        </div>
      </template>
    </UCard>
  </div>
</template>
