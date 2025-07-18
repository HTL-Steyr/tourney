import type { RegistrationDTO } from "@tourney/types"

export default defineEventHandler(async (event) => {
  const { expire_date, teams, year } = await readBody<{
    expire_date: string
    teams: number
    year: string
  }>(event)

  const supabase = await useDatabase(event)

  const { data: classes, error: fetchError } = await supabase
    .from("class")
    .select("id, name, year")
    .eq("year", year)

  if (fetchError || !classes) {
    throw createError({
      message: fetchError?.message || "Failed to fetch classes.",
      statusCode: 500,
    })
  }

  const registrations: RegistrationDTO[] = Array.from({
    length: teams,
  }).flatMap((_, i) =>
    classes.map((item) => ({
      class_id: item.id,
      expire_date,
      status: "Ausstehend",
      hidden: false,
      name: `Team ${i + 1}`,
      allow_class_mixing: false,
    })),
  )

  const { error: insertError } = await supabase
    .from("registration")
    .insert(registrations)

  if (insertError) {
    throw createError({
      message: insertError.message,
      statusCode: 500,
    })
  }

  setResponseStatus(event, 201)
})
