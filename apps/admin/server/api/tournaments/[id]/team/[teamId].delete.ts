export default defineEventHandler(async (event) => {
  const supabase = await useDatabase(event)
  const tournamentId = getRouterParam(event, "id")
  const teamId = getRouterParam(event, "teamId")

  if (!tournamentId || !teamId) {
    throw createError({
      statusCode: 400,
      message: "Tournament id or team id missing",
    })
  }

  const { data: team, error: teamError } = await supabase
    .from("team")
    .select("id")
    .eq("id", teamId)
    .eq("tournament_id", tournamentId)
    .single()

  if (teamError) {
    throw createError({
      statusCode: teamError.code === "PGRST116" ? 404 : 500,
      message: teamError.message,
    })
  }

  if (!team) {
    throw createError({
      statusCode: 404,
      message: "Team not found in tournament",
    })
  }

  const { error: updateError } = await supabase
    .from("team")
    .update({
      group_id: null,
      tournament_id: null,
    })
    .eq("id", teamId)
    .eq("tournament_id", tournamentId)

  if (updateError) {
    throw createError({
      statusCode: 500,
      message: updateError.message,
    })
  }

  setResponseStatus(event, 204, "success")
})
