import {
  FOOTBALL_MAX_TEAMS,
  VOLLEYBALL_BASKETBALL_MAX_TEAMS,
} from "#shared/constants"

type Body = {
  selected_team_ids: string[]
}

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const current = shuffled[i]
    const random = shuffled[j]
    if (current === undefined || random === undefined) continue
    shuffled[i] = random
    shuffled[j] = current
  }

  return shuffled
}

export default defineEventHandler(async (event) => {
  const supabase = await useDatabase(event)
  const id = getRouterParam(event, "id")
  const { selected_team_ids } = await readBody<Body>(event)

  if (!id) {
    throw createError({
      message: "Tournament id missing",
      statusCode: 400,
    })
  }

  if (!Array.isArray(selected_team_ids)) {
    throw createError({
      message: "Invalid selected team ids payload",
      statusCode: 400,
    })
  }

  const uniqueSelectedTeamIds = [...new Set(selected_team_ids)]
  if (uniqueSelectedTeamIds.length !== selected_team_ids.length) {
    throw createError({
      message: "Duplicate team ids are not allowed",
      statusCode: 400,
    })
  }

  const { data: tournament, error: tournamentError } = await supabase
    .from("tournament")
    .select("group_teams, sport")
    .eq("id", id)
    .single()

  if (tournamentError) {
    throw createError({
      message: tournamentError.message,
      statusCode: tournamentError.code === "PGRST116" ? 404 : 500,
    })
  }

  const { data: groups, error: groupError } = await supabase
    .from("group")
    .select("id")
    .eq("tournament_id", id)

  if (groupError) {
    throw createError({
      message: groupError.message,
      statusCode: 500,
    })
  }

  if (!groups || groups.length === 0) {
    throw createError({
      message: "No groups found for this tournament",
      statusCode: 404,
    })
  }

  const { data: teams, error: teamsError } = await supabase
    .from("team")
    .select("id, registration(status)")
    .eq("tournament_id", id)

  if (teamsError) {
    throw createError({
      message: teamsError.message,
      statusCode: 500,
    })
  }

  const requiredTeamCount =
    tournament.sport === "Fußball"
      ? FOOTBALL_MAX_TEAMS
      : VOLLEYBALL_BASKETBALL_MAX_TEAMS
  if (uniqueSelectedTeamIds.length !== requiredTeamCount) {
    throw createError({
      message: `Exactly ${requiredTeamCount} teams must be selected to play.`,
      statusCode: 400,
    })
  }

  const teamIds = new Set((teams ?? []).map((team) => team.id))
  const hasUnknownTeam = uniqueSelectedTeamIds.some(
    (teamId) => !teamIds.has(teamId),
  )

  if (hasUnknownTeam) {
    throw createError({
      message: "One or more selected teams do not belong to this tournament",
      statusCode: 400,
    })
  }

  const rejectedTeamIds = new Set(
    (teams ?? [])
      .filter((team) => team.registration?.status === "Abgelehnt")
      .map((team) => team.id),
  )
  const hasRejectedTeam = uniqueSelectedTeamIds.some((teamId) =>
    rejectedTeamIds.has(teamId),
  )

  if (hasRejectedTeam) {
    throw createError({
      message: "Rejected teams cannot be selected as playable teams",
      statusCode: 400,
    })
  }

  const { error: resetError } = await supabase
    .from("team")
    .update({ group_id: null })
    .eq("tournament_id", id)

  if (resetError) {
    throw createError({
      message: resetError.message,
      statusCode: 500,
    })
  }

  const shuffledTeamIds = shuffle(uniqueSelectedTeamIds)
  const updates = shuffledTeamIds.map((teamId, index) =>
    supabase
      .from("team")
      .update({ group_id: groups[index % groups.length]!.id })
      .eq("id", teamId)
      .eq("tournament_id", id),
  )

  const results = await Promise.all(updates)
  const updateError = results.find((result) => result.error)
  if (updateError?.error) {
    throw createError({
      message: updateError.error.message,
      statusCode: 500,
    })
  }

  return {
    selected: uniqueSelectedTeamIds.length,
    waiting: Math.max((teams?.length ?? 0) - uniqueSelectedTeamIds.length, 0),
  }
})
