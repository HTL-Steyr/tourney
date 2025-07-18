import type { Enums, TournamentDTO } from "@tourney/types"

type Body = {
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
  knockout_interval: number
}

export default defineEventHandler(async (event) => {
  const supabase = await useDatabase(event)
  const {
    name,
    rules,
    start_date,
    from,
    to,
    year,
    sport,
    prizes,
    thumbnail_path,
    location,
    last_edited_by_id,
    groups,
    group_teams,
    knockout_interval,
  } = await readBody<Body>(event)

  if (
    !name ||
    !start_date ||
    !from ||
    !to ||
    !year ||
    !sport ||
    !prizes ||
    !thumbnail_path ||
    !location ||
    !last_edited_by_id ||
    !groups ||
    !group_teams ||
    !knockout_interval
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing data field(s)",
    })
  }

  type TournamentInsert = Omit<TournamentDTO, "created_at" | "is_live">
  const tournament: TournamentInsert = {
    name,
    rules,
    start_date,
    from,
    to,
    year,
    sport,
    prizes,
    thumbnail_path,
    location,
    last_edited_by_id,
    groups,
    group_teams,
    knockout_interval,
  }

  const { data, error: tournamentError } = await supabase
    .from("tournament")
    .insert(tournament)
    .select()

  if (tournamentError) {
    throw createError({
      statusCode: 500,
      statusMessage: tournamentError.message,
    })
  }

  let groupNames: string[]
  tournament.sport === "Fußball"
    ? (groupNames = ["Gruppe A", "Gruppe B", "Gruppe C", "Gruppe D"])
    : (groupNames = ["Gruppe A", "Gruppe B"])
  const groupInserts = groupNames.map((name) => ({
    tournament_id: data?.[0].id,
    name,
  }))

  const { error: groupError } = await supabase
    .from("group")
    .insert(groupInserts)

  if (groupError) {
    throw createError({
      statusCode: 500,
      statusMessage: groupError.message,
    })
  }

  setResponseStatus(event, 201, "success")
})
