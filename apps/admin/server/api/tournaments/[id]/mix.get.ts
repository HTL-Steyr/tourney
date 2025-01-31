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

  const { data: teams, error: teamError } = await supabase
    .from("team")
    .select("id, group_id")
    .eq("tournament_id", id)

  if (teamError) {
    throw createError({
      statusCode: 500,
      statusMessage: teamError.message,
    })
  }

  if (!teams || teams.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "No teams found for the tournament",
    })
  }

  const { data: groups, error: groupError } = await supabase
    .from("group")
    .select("id")
    .eq("tournament_id", id)

  if (groupError) {
    throw createError({
      statusCode: 500,
      statusMessage: groupError.message,
    })
  }

  if (!groups || groups.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "No groups found for the tournament",
    })
  }

  const shuffledTeams = [...teams].sort(() => Math.random() - 0.5)
  const updatedTeams = shuffledTeams.map((team, index) => ({
    id: team.id,
    group_id: groups[index % groups.length].id,
  }))

  const updates = updatedTeams.map((team) =>
    supabase.from("team").update({ group_id: team.group_id }).eq("id", team.id),
  )

  const results = await Promise.all(updates)
  const errors = results.filter((result) => result.error)

  if (errors.length > 0) {
    throw createError({
      statusCode: 500,
      statusMessage: "Error updating team group assignments",
    })
  }

  setResponseStatus(event, 200, "Teams randomized successfully")
})
