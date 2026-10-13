import { serverSupabaseUser } from "#supabase/server"
import type { Enums } from "@tourney/types"

function isUuid(value: string | null | undefined): value is string {
  if (!value) {
    return false
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}

type Body = {
  id: string
  tournament: {
    name: string
    rules: string
    start_date: string
    from: string
    to: string
    sport: Enums<"sport_type">
    prizes: {
      first: string
      second: string
      third: string
      bonus: string
    }
    thumbnail_path: string
    location: string
    last_edited_by_id?: string
    groups: number
    group_teams: number
    knockout_interval: number
  }
}

export default defineEventHandler(async (event) => {
  const supabase = await useDatabase(event)
  const user = await serverSupabaseUser(event)
  const { id, tournament } = await readBody<Body>(event)

  if (!id || !tournament) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing data field(s)",
    })
  }

  const editorId =
    user?.id ??
    (isUuid(tournament.last_edited_by_id) ? tournament.last_edited_by_id : null)

  if (!editorId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    })
  }

  const { error } = await supabase
    .from("tournament")
    .update({
      ...tournament,
      year: Number(tournament.start_date.slice(0, 4)),
      last_edited_by_id: editorId,
    })
    .eq("id", id)

  if (error) {
    throw createError({
      statusCode: error.code === "23514" ? 409 : 500,
      message: error.message,
      statusMessage: error.message,
    })
  }

  setResponseStatus(event, 201, "success")
})
