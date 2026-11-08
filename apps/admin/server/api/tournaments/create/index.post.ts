import { serverSupabaseUser } from "#supabase/server"
import type { Enums, TournamentDTO } from "@tourney/types"

function isUuid(value: string | null | undefined): value is string {
  if (!value) {
    return false
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}

type Body = {
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

export default defineEventHandler(async (event) => {
  const supabase = await useDatabase(event)
  const user = await serverSupabaseUser(event)
  const {
    name,
    rules,
    start_date,
    from,
    to,
    sport,
    prizes,
    thumbnail_path,
    location,
    last_edited_by_id,
    groups,
    group_teams,
    knockout_interval,
  } = await readBody<Body>(event)

  const editorId =
    user?.id ?? (isUuid(last_edited_by_id) ? last_edited_by_id : null)

  if (!editorId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    })
  }

  if (
    !name ||
    !start_date ||
    !from ||
    !to ||
    !sport ||
    !prizes ||
    !thumbnail_path ||
    !location ||
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
    year: Number(start_date.slice(0, 4)),
    sport,
    prizes,
    thumbnail_path,
    location,
    last_edited_by_id: editorId,
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
  const tournamentId = data?.[0]?.id
  if (!tournamentId) {
    throw createError({
      statusCode: 500,
      statusMessage: "Tournament could not be created",
    })
  }
  const groupInserts = groupNames.map((name) => ({
    tournament_id: tournamentId,
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
