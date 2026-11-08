import type {
  Enums,
  FormPlayer,
  PlayerDTO,
  RegistrationWithClass,
  Tables,
} from "@tourney/types"

type Body = {
  formPlayers: FormPlayer[]
  logo: Tables<"logo">
  logo_variant: Tables<"logo_variant"> | null
  tournament: Tables<"tournament">
  registration: RegistrationWithClass
}

export default defineEventHandler(async (event) => {
  const supabase = await useDatabase(event)
  const { formPlayers, logo, logo_variant, registration, tournament } =
    await readBody<Body>(event)

  if (!formPlayers || !logo || !registration || !tournament) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing data fields",
    })
  }

  const { data: currentRegistration, error: registrationError } = await supabase
    .from("registration")
    .select("id, status")
    .eq("id", registration.id)
    .single()

  if (registrationError) {
    throw createError({
      statusCode: 500,
      statusMessage: registrationError.message,
    })
  }

  if (currentRegistration.status !== "Ausstehend") {
    throw createError({
      statusCode: 409,
      statusMessage: "Die Anmeldung wurde bereits abgesendet.",
    })
  }

  const { data: groups, error: groupError } = await supabase
    .from("group")
    .select("*")
    .eq("tournament_id", tournament.id)

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

  const groupTeamCounts = await Promise.all(
    groups.map(async (group) => {
      const { count, error } = await supabase
        .from("team")
        .select("*", { count: "exact" })
        .eq("group_id", group.id)

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: error.message,
        })
      }

      return { groupId: group.id, count: count ?? 0 }
    }),
  )

  const targetGroup = groupTeamCounts.find(
    (group) => group.count < tournament.group_teams,
  )

  const team = {
    name: registration.class.name,
    logo_id: logo.id,
    logo_variant_id: logo_variant?.id ?? null,
    tournament_id: tournament.id,
    registration_id: registration.id,
    // When all group slots are filled, keep the team as registered but unassigned.
    group_id: targetGroup?.groupId ?? null,
  }

  const { data, error } = await supabase.from("team").insert(team).select()

  if (error) {
    if (error.code === "23505") {
      throw createError({
        statusCode: 409,
        statusMessage: "Die Anmeldung wurde bereits abgesendet.",
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }
  const teamId = data?.[0]?.id
  if (!teamId) {
    throw createError({
      statusCode: 500,
      statusMessage: "Team could not be created",
    })
  }

  const players: PlayerDTO[] = formPlayers.map((formPlayer) => ({
    first_name: formPlayer.firstName,
    last_name: formPlayer.lastName,
    class: formPlayer.schoolClass.name,
    note: "",
    team_id: teamId,
  }))

  await $fetch("/api/players/create", {
    method: "POST",
    body: { players: players },
    async onRequestError({ error }) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message,
      })
    },
  })

  const payload: {
    registration_id: string
    status: Enums<"registration_status">
  } = {
    registration_id: registration.id,
    status: "Abgesendet",
  }

  await $fetch("/api/registrations/update", {
    method: "PUT",
    body: payload,
    async onRequestError({ error }) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message,
      })
    },
  })

  setResponseStatus(event, 201, "success")
})
