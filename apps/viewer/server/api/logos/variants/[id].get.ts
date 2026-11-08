export default defineEventHandler(async (event) => {
  const supabase = await useDatabase(event)
  const id = getRouterParam(event, "id")

  if (id === undefined) {
    throw createError({
      message: "Logo id missing",
      statusCode: 400,
    })
  }

  const { data } = await supabase
    .from("logo_variant")
    .select("*")
    .eq("logo_id", id)
    .order("color")
    .order("id")

  return data
})
