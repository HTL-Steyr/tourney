<script setup lang="ts">
import { z } from "zod"
import type { AuthFormField } from "@nuxt/ui"
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
  remember: z.boolean().optional(),
})

type Schema = z.output<typeof schema>
const fields: AuthFormField[] = [
  {
    name: "email",
    type: "email",
    label: "E-mail",
    size: "xl",
  },
  {
    name: "password",
    type: "password",
    label: "Passwort",
    size: "xl",
  },
  {
    name: "remember",
    type: "checkbox",
    label: "Login merken",
  },
]

const loginError = ref("")
const { login } = useUser()
const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  loginError.value = ""
  const { data, error } = await login(
    event.data.email ?? "",
    event.data.password ?? "",
  )
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
  <div class="min-h-dvh w-full p-3">
    <div
      class="grid min-h-[calc(100dvh-1.5rem)] w-full gap-2 rounded-3xl border border-neutral-200 p-2 lg:grid-cols-2 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div
        class="flex min-h-80 items-end rounded-2xl bg-linear-to-b from-neutral-50 via-blue-300 to-blue-700 p-8 sm:p-12 lg:rounded-r-md dark:from-neutral-900 dark:via-blue-700 dark:to-indigo-900"
      >
        <p
          class="max-w-md text-4xl font-black tracking-tighter text-white sm:text-6xl lg:max-w-3xl lg:text-7xl"
        >
          The next level of tournament management.
        </p>
      </div>

      <div
        class="flex items-center justify-center rounded-2xl bg-white p-6 sm:p-8 lg:rounded-l-md dark:bg-neutral-950"
      >
        <div
          class="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 sm:p-10 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <UAlert
            v-if="loginError"
            color="error"
            :title="loginError"
            role="alert"
            class="mb-4"
          />
          <UAuthForm
            :schema="schema"
            :fields="fields"
            :submit="{ label: 'Einloggen', block: true, size: 'xl' }"
            class="space-y-4"
            @submit="onSubmit"
          >
            <template #header>
              <div class="mb-8 flex flex-col items-center space-y-3">
                <Logo class="h-12 w-12" />
                <HeaderTitle>TOURNEY LOGIN</HeaderTitle>
              </div>
            </template>
            <template #footer>
              <div class="mt-6 text-sm">
                <strong>Woher kriege ich meine Daten?</strong>
                <br />
                <span>
                  Die Anmeldedaten werden Ihnen auf die Schul Mail
                  <code>(@htl-steyr.ac.at)</code> geschickt.
                </span>
              </div>
            </template>
          </UAuthForm>
        </div>
      </div>
    </div>
  </div>
</template>
