import {
  convertToModelMessages,
  pruneMessages,
  streamText,
  type UIMessage,
} from "ai"
import { openai } from "@ai-sdk/openai"
import {
  createAiAssistantRequestContext,
  type AiAssistantRequestContext,
  AI_ASSISTANT_DEFAULT_MODEL,
  isAiAssistantModel,
} from "#shared/aiAssistant"

function formatAssistantContext(context: AiAssistantRequestContext) {
  const sections = [
    `App: ${context.appName}`,
    `Aktuelle Seite: ${context.page.label} (${context.page.route})`,
    `Seitenzweck: ${context.page.summary}`,
    `Moegliche Aktionen: ${context.page.capabilities.join("; ")}`,
    `Navigation: ${context.navigation
      .map((item) => `${item.label} (${item.path}): ${item.summary}`)
      .join(" | ")}`,
  ]

  if (context.dynamic?.tournament) {
    const tournament = context.dynamic.tournament
    sections.push(
      `Aktuelles Turnier: ${tournament.name} [ID ${tournament.id}], Sport ${tournament.sport ?? "unbekannt"}, Live ${tournament.isLive ? "ja" : "nein"}, Datum ${tournament.startDate ?? "unbekannt"}, Zeit ${tournament.timeRange ?? "unbekannt"}, Ort ${tournament.location ?? "unbekannt"}, Gruppen ${tournament.groups ?? "unbekannt"}, Teams pro Gruppe ${tournament.teamsPerGroup ?? "unbekannt"}, Matches ${tournament.matches}, Teilnehmer ${tournament.participants}, Spielteams ${tournament.playableTeams ?? "unbekannt"}, Wartend ${tournament.waitingTeams ?? "unbekannt"}, Knockout-Intervall ${tournament.knockoutInterval ?? "unbekannt"} Minuten, Gruppennamen ${tournament.groupNames.join(", ") || "keine"}`,
    )
  }

  if (context.dynamic?.live) {
    const live = context.dynamic.live
    sections.push(
      `Live-Kontext: Live-Turniere ${live.liveTournamentCount}, ausgewaehltes Turnier ${live.selectedTournamentName ?? "keins"} [ID ${live.selectedTournamentId ?? "-"}], Sport ${live.selectedTournamentSport ?? "unbekannt"}, Live ${live.selectedTournamentIsLive === null ? "unbekannt" : live.selectedTournamentIsLive ? "ja" : "nein"}, Gruppen ${live.groups}, Matches ${live.matches}, laufende Matches ${live.liveMatches}, Tabellenmodus ${live.standingsMode}`,
    )
  }

  return sections.join("\n")
}

function normalizeAssistantContext(value: unknown): AiAssistantRequestContext {
  if (
    value &&
    typeof value === "object" &&
    "page" in value &&
    "navigation" in value &&
    "appName" in value
  ) {
    return value as AiAssistantRequestContext
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return createAiAssistantRequestContext({
      route: "/",
      pageLabel: value.trim(),
    })
  }

  return createAiAssistantRequestContext({
    route: "/",
    pageLabel: "Admin",
  })
}

export default defineEventHandler(async (event) => {
  if (!process.env.OPENAI_API_KEY) {
    throw createError({
      statusCode: 503,
      statusMessage:
        "OPENAI_API_KEY is not configured for the admin AI assistant.",
    })
  }

  const body = await readBody<{
    context?: unknown
    messages?: unknown
    model?: unknown
  }>(event)

  const context = normalizeAssistantContext(body?.context)
  const model = isAiAssistantModel(body?.model)
    ? body.model
    : AI_ASSISTANT_DEFAULT_MODEL
  const messages = Array.isArray(body?.messages)
    ? (body.messages as UIMessage[])
    : []
  const modelMessages = pruneMessages({
    messages: await convertToModelMessages(messages),
    reasoning: "all",
  })

  return streamText({
    model: openai(model),
    maxOutputTokens: 2000,
    system: [
      "You are the Tourney admin assistant for a tournament management dashboard.",
      "The verified application context below is authoritative. Use it instead of guessing product behavior.",
      formatAssistantContext(context),
      "Respond in concise German unless the user writes in another language.",
      "Prioritize practical guidance, navigation hints, and clear next steps inside the admin app.",
      "When the context includes live or tournament data, reference those concrete values in your answer.",
      "If information is missing from the provided context, say that directly instead of inventing details.",
      "If the user asks for an action you cannot perform from chat, explain where in the admin UI they should go.",
    ].join(" "),
    messages: modelMessages,
  }).toUIMessageStreamResponse({
    sendReasoning: false,
  })
})
