import type { Enums } from "@tourney/types"

type Body = {
  id: string
  tournament: {
    name: string
    rules: string
    start_date: string
    from: string
    to: string
    year: number
    sport: Enums<"sport_type">
    prizes: {
      first: string
      second: string
      third: string
      bonus: string
    }
    thumbnail_path: string
    location: string
    groups: number
    group_teams: number
    knockout_interval: number
  }
}

export default defineEventHandler(async (event) => {
  const supabase = await useDatabase(event)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" })
  }

  const { id, tournament } = await readBody<Body>(event)

  if (!id || !tournament) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing data field(s)",
    })
  }

  const { error } = await supabase
    .from("tournament")
    .update({ ...tournament, last_edited_by_id: user.id })
    .eq("id", id)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  setResponseStatus(event, 201, "success")
})
