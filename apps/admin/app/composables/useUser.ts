import type { Database } from "@tourney/types"

export const useUser = () => {
  const supabase = useSupabaseClient<Database>()
  const session = useSupabaseUser()

  async function getUserById(user_id: string) {
    const { data, error } = await useFetch(`/api/users/${user_id}`)
    const user = data.value?.data.user
    if (error.value) {
      throw createError({
        status: 500,
        message: error.value.message,
      })
    }
    return user
  }

  function formatUsername(email: string | undefined) {
    if (email === undefined) {
      return "Unknown"
    }
    return email.slice(0, email.indexOf("@"))
  }

  const id = computed<string>(() => session.value?.id ?? "")
  const name = computed<string>(() => formatUsername(session.value?.email))
  const email = computed<string>(() => session.value?.email ?? "Unknown")
  const role = computed<string>(() => {
    return (
      (session.value?.user_metadata?.role as string | undefined) ?? "Unknown"
    )
  })
  const last_sign_in = computed<string>(() => {
    const lastSignInAt = session.value?.last_sign_in_at

    if (!lastSignInAt) {
      return "Unbekannt"
    }

    return new Date(lastSignInAt).toLocaleString("de-AT")
  })

  async function login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })
    return { data, error }
  }

  async function getCurrentUserId() {
    if (id.value) {
      return id.value
    }

    const { data, error } = await supabase.auth.getUser()

    if (error) {
      throw error
    }

    if (!data.user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      })
    }

    return data.user.id
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  return {
    id,
    name,
    email,
    role,
    last_sign_in,
    login,
    logout,
    getCurrentUserId,
    getUserById,
    formatUsername,
  }
}
