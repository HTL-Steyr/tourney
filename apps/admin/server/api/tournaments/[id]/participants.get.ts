import type { Enums } from "@tourney/types"

type TournamentParticipant = {
  id: string
  name: string
  group_id: string | null
  registration: {
    status: Enums<"registration_status">
  } | null
}

export default defineEventHandler(async (event) => {
  const supabase = await useDatabase(event)
  const id = getRouterParam(event, "id")

  if (!id) {
    throw createError({
      message: "Tournament id missing",
      statusCode: 400,
    })
  }

  const { data, error } = await supabase
    .from("team")
    .select("id, name, group_id, registration(status)")
    .eq("tournament_id", id)
    .order("name", { ascending: true })

  if (error) {
    throw createError({
      message: error.message,
      statusCode: 500,
    })
  }

  return (data ?? []) as TournamentParticipant[]
})
