import { spawnSync } from "node:child_process"
import { dirname, resolve } from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"

const SPORT_TEAM_LIMITS = {
  Fußball: 20,
  Volleyball: 10,
  Basketball: 10,
}

const VARIANT_COLORS = ["Blau", "Grün", "Pride", "Rot"]
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function printUsage() {
  console.log(`Usage:
  bun run fill:tournament -- <tournament-name-or-id> [--count <teams>] [--players <players>] [--class-year <yyyy/yy>] [--dry-run]

Examples:
  bun run fill:tournament -- xyxcxy
  bun run fill:tournament -- xyxcxy --count 20 --players 2
  bun run fill:tournament -- 394c450c-b9bb-46de-93a5-6118470c71dc --dry-run`)
}

function fail(message) {
  throw new Error(message)
}

function parseIntegerFlag(name, value) {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    fail(`Invalid value for ${name}: ${value}`)
  }

  return parsed
}

function parseArgs(argv) {
  const options = {
    count: undefined,
    players: 2,
    classYear: undefined,
    dryRun: false,
    identifier: undefined,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]

    if (!current) {
      continue
    }

    if (current === "--help" || current === "-h") {
      printUsage()
      process.exit(0)
    }

    if (current === "--dry-run") {
      options.dryRun = true
      continue
    }

    if (current === "--count") {
      const next = argv[index + 1]
      if (!next) {
        fail("Missing value for --count")
      }

      options.count = parseIntegerFlag("--count", next)
      index += 1
      continue
    }

    if (current === "--players") {
      const next = argv[index + 1]
      if (!next) {
        fail("Missing value for --players")
      }

      options.players = parseIntegerFlag("--players", next)
      index += 1
      continue
    }

    if (current === "--class-year") {
      const next = argv[index + 1]
      if (!next) {
        fail("Missing value for --class-year")
      }

      options.classYear = next
      index += 1
      continue
    }

    if (current.startsWith("--")) {
      fail(`Unknown flag: ${current}`)
    }

    if (options.identifier) {
      fail(`Unexpected extra argument: ${current}`)
    }

    options.identifier = current
  }

  if (!options.identifier) {
    printUsage()
    process.exit(1)
  }

  return options
}

function parseEnvOutput(output) {
  const values = {}

  for (const line of output.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || !trimmed.includes("=")) {
      continue
    }

    const separatorIndex = trimmed.indexOf("=")
    const key = trimmed.slice(0, separatorIndex)
    let value = trimmed.slice(separatorIndex + 1)

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    values[key] = value
  }

  return values
}

function resolveSupabaseCredentials() {
  const envUrl = process.env.SUPABASE_URL ?? process.env.API_URL
  const envKey =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_KEY ??
    process.env.SERVICE_ROLE_KEY

  if (envUrl && envKey) {
    return {
      url: envUrl,
      key: envKey,
    }
  }

  const currentDir = dirname(fileURLToPath(import.meta.url))
  const supabaseDir = resolve(currentDir, "../api/supabase")
  const result = spawnSync("bunx", ["supabase", "status", "-o", "env"], {
    cwd: supabaseDir,
    encoding: "utf8",
  })

  if (result.status !== 0) {
    const stderr = result.stderr.trim()
    fail(
      stderr ||
        "Could not resolve local Supabase credentials. Start Supabase with `bun run start:supabase` first.",
    )
  }

  const env = parseEnvOutput(result.stdout)
  const url = env.API_URL ?? env.SUPABASE_URL
  const key = env.SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_KEY

  if (!url || !key) {
    fail(
      "Supabase CLI output did not include API_URL and SERVICE_ROLE_KEY. Start the local stack with `bun run start:supabase`.",
    )
  }

  return { url, key }
}

function deriveClassYear(tournamentYear) {
  const previousYear = String(tournamentYear - 1)
  const currentYearSuffix = String(tournamentYear).slice(-2)
  return `${previousYear}/${currentYearSuffix}`
}

function mapBy(items, key) {
  return new Map(items.map((item) => [item[key], item]))
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const { url, key } = resolveSupabaseCredentials()
  const supabase = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  let tournamentQuery = supabase
    .from("tournament")
    .select("id, name, sport, year, group_teams")
    .limit(2)

  tournamentQuery = UUID_PATTERN.test(options.identifier)
    ? tournamentQuery.eq("id", options.identifier)
    : tournamentQuery.eq("name", options.identifier)

  const { data: tournaments, error: tournamentError } = await tournamentQuery

  if (tournamentError) {
    fail(tournamentError.message)
  }

  if (!tournaments || tournaments.length === 0) {
    fail(`Tournament not found: ${options.identifier}`)
  }

  if (tournaments.length > 1) {
    fail(
      `Multiple tournaments matched "${options.identifier}". Use the tournament UUID instead.`,
    )
  }

  const tournament = tournaments[0]
  const classYear = options.classYear ?? deriveClassYear(tournament.year)

  const [
    { data: groups, error: groupsError },
    { data: teams, error: teamsError },
    { data: classes, error: classesError },
    { data: logos, error: logosError },
    { data: variants, error: variantsError },
  ] = await Promise.all([
    supabase
      .from("group")
      .select("id, name")
      .eq("tournament_id", tournament.id)
      .order("name"),
    supabase
      .from("team")
      .select("id, name, group_id, registration_id, logo_id, created_at")
      .eq("tournament_id", tournament.id)
      .order("created_at"),
    supabase
      .from("class")
      .select("id, name, year")
      .eq("year", classYear)
      .order("name"),
    supabase.from("logo").select("id, name").order("name"),
    supabase.from("logo_variant").select("id, logo_id, color").order("color"),
  ])

  if (groupsError) fail(groupsError.message)
  if (teamsError) fail(teamsError.message)
  if (classesError) fail(classesError.message)
  if (logosError) fail(logosError.message)
  if (variantsError) fail(variantsError.message)
  if (!groups || groups.length === 0) fail("Tournament has no groups to fill.")
  if (!classes || classes.length === 0) {
    fail(`No classes found for school year ${classYear}.`)
  }
  if (!logos || logos.length === 0) fail("No logos found.")
  if (!variants || variants.length === 0) fail("No logo variants found.")

  const existingTeams = teams ?? []
  const registrationIds = existingTeams.map((team) => team.registration_id)

  let registrations = []
  if (registrationIds.length > 0) {
    const { data, error } = await supabase
      .from("registration")
      .select("id, class_id, status")
      .in("id", registrationIds)

    if (error) {
      fail(error.message)
    }

    registrations = data ?? []
  }

  const registrationsById = mapBy(registrations, "id")
  const groupedTeams = existingTeams.filter((team) => team.group_id !== null)
  const waitingTeams = existingTeams.filter(
    (team) =>
      team.group_id === null &&
      registrationsById.get(team.registration_id)?.status !== "Abgelehnt",
  )

  const capacity = groups.length * tournament.group_teams
  const defaultTarget =
    Math.min(SPORT_TEAM_LIMITS[tournament.sport] ?? capacity, capacity) ||
    capacity
  const targetCount = options.count ?? defaultTarget

  if (targetCount > capacity) {
    fail(
      `Requested ${targetCount} teams, but tournament capacity is ${capacity} (${groups.length} groups x ${tournament.group_teams} teams).`,
    )
  }

  if (groupedTeams.length > targetCount) {
    fail(
      `Tournament already has ${groupedTeams.length} active teams. This script only fills missing slots.`,
    )
  }

  const groupCounts = new Map(groups.map((group) => [group.id, 0]))
  for (const team of groupedTeams) {
    if (!team.group_id) {
      continue
    }

    groupCounts.set(team.group_id, (groupCounts.get(team.group_id) ?? 0) + 1)
  }

  const openSlots = []
  for (const group of groups) {
    const currentCount = groupCounts.get(group.id) ?? 0
    const freeSlots = Math.max(tournament.group_teams - currentCount, 0)

    for (let index = 0; index < freeSlots; index += 1) {
      openSlots.push(group)
    }
  }

  const teamsNeeded = targetCount - groupedTeams.length
  if (teamsNeeded === 0) {
    console.log(
      `Tournament "${tournament.name}" already has ${targetCount} active teams. No changes made.`,
    )
    return
  }

  const teamsToActivate = waitingTeams.slice(
    0,
    Math.min(waitingTeams.length, teamsNeeded),
  )
  const teamsToCreate = teamsNeeded - teamsToActivate.length
  const remainingSlots = openSlots.slice(teamsToActivate.length)

  if (remainingSlots.length < teamsToCreate) {
    fail("Not enough group slots are available to create the requested teams.")
  }

  const usedClassIds = new Set(
    registrations.map((registration) => registration.class_id),
  )
  const availableClasses = classes.filter(
    (schoolClass) => !usedClassIds.has(schoolClass.id),
  )

  if (availableClasses.length < teamsToCreate) {
    fail(
      `Not enough unused classes in ${classYear}. Needed ${teamsToCreate}, found ${availableClasses.length}.`,
    )
  }

  const usedLogoIds = new Set(existingTeams.map((team) => team.logo_id))
  const logoPool = [
    ...logos.filter((logo) => !usedLogoIds.has(logo.id)),
    ...logos.filter((logo) => usedLogoIds.has(logo.id)),
  ]

  if (logoPool.length === 0) {
    fail("No logos are available for generated teams.")
  }

  const variantsByLogoId = new Map()
  for (const variant of variants) {
    const currentVariants = variantsByLogoId.get(variant.logo_id) ?? []
    currentVariants.push(variant)
    variantsByLogoId.set(variant.logo_id, currentVariants)
  }

  const previewRows = []
  for (const [index, team] of teamsToActivate.entries()) {
    const group = openSlots[index]
    previewRows.push({
      action: "activate",
      team: team.name,
      group: group?.name ?? "-",
      registration: registrationsById.get(team.registration_id)?.status ?? "-",
    })
  }

  const creationPlan = availableClasses
    .slice(0, teamsToCreate)
    .map((schoolClass, index) => {
      const logo = logoPool[index % logoPool.length]
      const preferredColor = VARIANT_COLORS[index % VARIANT_COLORS.length]
      const logoVariants = variantsByLogoId.get(logo.id) ?? []
      const variant =
        logoVariants.find((item) => item.color === preferredColor) ??
        logoVariants[0] ??
        null
      const group = remainingSlots[index]

      if (!group) {
        fail("Could not assign a group for one of the generated teams.")
      }

      previewRows.push({
        action: "create",
        team: schoolClass.name,
        group: group.name,
        registration: `Team ${existingTeams.length + index + 1}`,
      })

      return {
        schoolClass,
        logo,
        variant,
        group,
        registrationName: `Team ${existingTeams.length + index + 1}`,
      }
    })

  if (options.dryRun) {
    console.log(
      `Dry run for "${tournament.name}": activate ${teamsToActivate.length}, create ${creationPlan.length}, target ${targetCount} active teams.`,
    )
    console.table(previewRows)
    return
  }

  if (teamsToActivate.length > 0) {
    const statusUpdates = teamsToActivate
      .map((team, index) => {
        const group = openSlots[index]
        if (!group) {
          return null
        }

        return supabase
          .from("team")
          .update({ group_id: group.id })
          .eq("id", team.id)
          .eq("tournament_id", tournament.id)
      })
      .filter(Boolean)

    const updateResults = await Promise.all(statusUpdates)
    const teamUpdateError = updateResults.find((result) => result.error)?.error

    if (teamUpdateError) {
      fail(teamUpdateError.message)
    }

    const registrationsToComplete = teamsToActivate.map(
      (team) => team.registration_id,
    )
    const { error: registrationUpdateError } = await supabase
      .from("registration")
      .update({ status: "Abgeschlossen" })
      .in("id", registrationsToComplete)

    if (registrationUpdateError) {
      fail(registrationUpdateError.message)
    }
  }

  if (creationPlan.length > 0) {
    const { data: insertedRegistrations, error: registrationInsertError } =
      await supabase
        .from("registration")
        .insert(
          creationPlan.map((entry) => ({
            expire_date: new Date().toISOString().slice(0, 10),
            status: "Abgeschlossen",
            class_id: entry.schoolClass.id,
            name: entry.registrationName,
            hidden: false,
            allow_class_mixing: false,
          })),
        )
        .select("id, class_id")

    if (registrationInsertError) {
      fail(registrationInsertError.message)
    }

    const registrationByClassId = new Map(
      (insertedRegistrations ?? []).map((registration) => [
        registration.class_id,
        registration.id,
      ]),
    )

    const { data: insertedTeams, error: teamInsertError } = await supabase
      .from("team")
      .insert(
        creationPlan.map((entry) => ({
          name: entry.schoolClass.name,
          logo_id: entry.logo.id,
          logo_variant_id: entry.variant?.id ?? null,
          tournament_id: tournament.id,
          registration_id: registrationByClassId.get(entry.schoolClass.id),
          group_id: entry.group.id,
        })),
      )
      .select("id, name")

    if (teamInsertError) {
      fail(teamInsertError.message)
    }

    if ((insertedTeams ?? []).length !== creationPlan.length) {
      fail("Created team count does not match the requested insert plan.")
    }

    const teamByName = new Map(
      (insertedTeams ?? []).map((team) => [team.name, team.id]),
    )
    const players = creationPlan.flatMap((entry) =>
      Array.from({ length: options.players }, (_, index) => ({
        first_name: "Demo",
        last_name: `${entry.schoolClass.name} ${index + 1}`,
        class: entry.schoolClass.name,
        team_id: teamByName.get(entry.schoolClass.name),
      })),
    )

    if (players.some((player) => !player.team_id)) {
      fail("Could not map generated players to their inserted teams.")
    }

    const { error: playerInsertError } = await supabase
      .from("player")
      .insert(players)

    if (playerInsertError) {
      fail(playerInsertError.message)
    }
  }

  const { count: finalActiveCount, error: finalCountError } = await supabase
    .from("team")
    .select("*", { count: "exact", head: true })
    .eq("tournament_id", tournament.id)
    .not("group_id", "is", null)

  if (finalCountError) {
    fail(finalCountError.message)
  }

  console.log(
    `Filled "${tournament.name}" to ${finalActiveCount ?? 0} active teams (${teamsToActivate.length} activated, ${creationPlan.length} created).`,
  )
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
