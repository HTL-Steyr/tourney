export default defineEventHandler(async (event) => {
  const supabase = await useDatabase(event)
  const id = getRouterParam(event, "tournament_id")

  if (!id) {
    throw createError({
      message: "Id is missing",
      statusCode: 400,
    })
  }

  const { data, error } = await supabase
    .from("matches_status")
    .select(
      "*, team1:team1_id(*, group:group_id(*), logo:logo_id(*), logo_variant:logo_variant_id(*)), team2:team2_id(*, group:group_id(*), logo:logo_id(*), logo_variant:logo_variant_id(*))",
    )
    .eq("tournament_id", id)
    .eq("status", "upcoming")
    .order("start_time", { ascending: true })

  if (error) {
    throw createError({
      message: error.message,
      statusCode: 500,
    })
  }

  return data
})
