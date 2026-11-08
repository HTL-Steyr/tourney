import type { TournamentTeamSummary } from "@tourney/types"

export default defineEventHandler(async (event) => {
  const supabase = await useDatabase(event)
  const id = getRouterParam(event, "id")

  if (!id) {
    throw createError({
      message: "Tournament id missing",
      statusCode: 400,
    })
  }

  const { data: teamsData, error: teamsError } = await supabase
    .from("team")
    .select("id, group_id, registration_id, registration(status)")
    .eq("tournament_id", id)

  if (teamsError) {
    throw createError({
      message: teamsError.message,
      statusCode: 500,
    })
  }

  if (!teamsData) {
    return {
      students: 0,
      teams: 0,
      registered: 0,
      waiting: 0,
      accepted: 0,
      pending: 0,
      rejected: 0,
    }
  }

  const { data: playersData, error: playersError } = await supabase
    .from("player")
    .select("id, team_id")

  if (playersError) {
    throw createError({
      message: playersError.message,
      statusCode: 500,
    })
  }

  const playersInTeams = playersData?.filter((player) =>
    teamsData.some((team) => team.id === player.team_id),
  )
  const studentCount = playersInTeams?.length || 0

  const activeTeams = teamsData.filter((team) => team.group_id !== null)
  const registered = teamsData.length
  const waiting = registered - activeTeams.length

  const teamStatuses = teamsData.reduce(
    (acc, team) => {
      const status = team.registration?.status
      if (status === "Abgeschlossen") acc.accepted += 1
      if (status === "Abgesendet") acc.pending += 1
      if (status === "Abgelehnt") acc.rejected += 1
      return acc
    },
    { accepted: 0, pending: 0, rejected: 0 },
  )

  return {
    students: studentCount,
    teams: activeTeams.length,
    registered,
    waiting,
    ...teamStatuses,
  } as TournamentTeamSummary
})
