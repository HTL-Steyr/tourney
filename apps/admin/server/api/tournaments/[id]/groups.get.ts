import { serverSupabaseClient } from "#supabase/server"
import type { Database } from "~/types/database.types"

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient<Database>(event)
  const id = getRouterParam(event, "id")

  if (id === undefined) {
    throw createError({
      message: "Tournament id missing",
      statusCode: 400,
    })
  }

  const { data: groups, error: groupError } = await supabase
    .from("group")
    .select("*")
    .eq("tournament_id", id)

  if (groupError) {
    throw createError({
      message: groupError.message,
      statusCode: 500,
    })
  }

  if (!groups || groups.length === 0) {
    throw createError({
      message: "No groups found for the tournament",
      statusCode: 404,
    })
  }

  const { data: teams, error: teamError } = await supabase
    .from("team")
    .select("*, registration(*), player(*)")
    .in(
      "group_id",
      groups.map((group) => group.id),
    )

  if (teamError) {
    throw createError({
      message: teamError.message,
      statusCode: 500,
    })
  }

  const formattedData = groups.map((group) => ({
    name: group.name,
    teams: teams.filter((team) => team.group_id === group.id),
  }))

  setResponseStatus(event, 200)
  return formattedData
})
