import { serverSupabaseClient } from "#supabase/server"
import type { Database, Enums } from "~/types/database.types"

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
    last_edited_by_id: string
    groups: number
    group_teams: number
  }
}

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient<Database>(event)
  const { id, tournament } = await readBody<Body>(event)

  if (!id || !tournament) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing data field(s)",
    })
  }

  const { error } = await supabase
    .from("tournament")
    .update(tournament)
    .eq("id", id)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  setResponseStatus(event, 201, "success")
})
