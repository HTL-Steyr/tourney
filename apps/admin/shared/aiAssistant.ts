export const AI_ASSISTANT_MODELS = ["gpt-4.1-nano"] as const

export type AiAssistantModel = (typeof AI_ASSISTANT_MODELS)[number]

export type AiAssistantPageDefinition = {
  capabilities: string[]
  label: string
  match: string
  summary: string
}

export type AiAssistantPageDynamicContext = {
  live?: {
    groups: number
    hasSelectedTournament: boolean
    liveMatches: number
    liveTournamentCount: number
    matches: number
    selectedTournamentId: string | null
    selectedTournamentIsLive: boolean | null
    selectedTournamentName: string | null
    selectedTournamentSport: string | null
    standingsMode: "grouped" | "overall"
  }
  tournament?: {
    groupNames: string[]
    groups: number | null
    id: string
    isLive: boolean
    knockoutInterval: number | null
    location: string | null
    matches: number
    name: string
    participants: number
    playableTeams: number | null
    sport: string | null
    startDate: string | null
    teamsPerGroup: number | null
    timeRange: string | null
    waitingTeams: number | null
  }
}

export type AiAssistantRequestContext = {
  appName: string
  dynamic: AiAssistantPageDynamicContext | null
  navigation: Array<{
    label: string
    path: string
    summary: string
  }>
  page: {
    capabilities: string[]
    label: string
    route: string
    summary: string
  }
}

const AI_ASSISTANT_PAGES: AiAssistantPageDefinition[] = [
  {
    match: "/dashboard",
    label: "Dashboard",
    summary: "Uebersicht fuer Status, Kennzahlen und Orientierung im Admin.",
    capabilities: [
      "Wichtige Bereiche im Admin einordnen",
      "Zu relevanten Seiten fuer die naechste Aufgabe navigieren",
      "Sinnvolle naechste Schritte fuer den Tagesbetrieb nennen",
    ],
  },
  {
    match: "/live",
    label: "Live",
    summary:
      "Live-Steuerung eines Turniers mit Matches, Tabellen, Gruppen und Ergebnissen.",
    capabilities: [
      "Live-Turnier auswaehlen und pruefen",
      "Gruppenphase-Matches generieren",
      "Matches, Live-Matches, Tabellen und Resultate erklaeren",
    ],
  },
  {
    match: "/tournaments/",
    label: "Turnierdetails",
    summary:
      "Detailansicht eines einzelnen Turniers mit Stammdaten, Teams, Gruppen und Live-Schaltung.",
    capabilities: [
      "Turnierdaten und Preise einordnen",
      "Spielteams auswaehlen oder Gruppen neu mischen",
      "Turnier live schalten oder Match-Flow erklaeren",
    ],
  },
  {
    match: "/tournaments",
    label: "Turniere",
    summary:
      "Turnieruebersicht zum Suchen, Erstellen und Oeffnen bestehender Turniere.",
    capabilities: [
      "Bestehende Turniere finden",
      "Neues Turnier vorbereiten",
      "Zum passenden Detailbereich navigieren",
    ],
  },
  {
    match: "/registration",
    label: "Anmeldung",
    summary:
      "Verwaltung von Registrierungen, Ablaufdaten, Klassen und Team-Links.",
    capabilities: [
      "Registrierungen filtern und pruefen",
      "Einzelne oder mehrere Registrierungen anlegen",
      "Status und Klassenbezug erklaeren",
    ],
  },
  {
    match: "/news",
    label: "Aktuelles",
    summary: "Bearbeitung und Veroeffentlichung des News-Inhalts aus Storage.",
    capabilities: [
      "News-Inhalt aktualisieren",
      "Refresh- und Speichervorgang erklaeren",
      "Hinweise zur redaktionellen Pflege geben",
    ],
  },
  {
    match: "/gallery",
    label: "Galerie",
    summary: "Upload und Loeschung von Turnierbildern im Storage.",
    capabilities: [
      "Bilder hochladen",
      "Bilder selektieren und loeschen",
      "Dateinamen- und Storage-Verhalten erklaeren",
    ],
  },
  {
    match: "/logs",
    label: "Aktivitaet",
    summary: "Aktivitaetsbereich des Admins, aktuell noch im Ausbau.",
    capabilities: [
      "Den Bereich als noch nicht fertig einordnen",
      "Auf andere relevante Admin-Seiten verweisen",
    ],
  },
  {
    match: "/management",
    label: "Verwaltung",
    summary:
      "Klassenverwaltung pro Schuljahr mit Erstellen, Bearbeiten und Loeschen.",
    capabilities: [
      "Klassen fuer ein Jahr filtern",
      "Einzelne oder mehrere Klassen anlegen",
      "Vorhandene Klassen bearbeiten oder loeschen",
    ],
  },
  {
    match: "/new",
    label: "Was ist neu",
    summary: "Bereich fuer Aenderungsinfos und neue Funktionen im Admin.",
    capabilities: [
      "Auf Neuerungen im Admin verweisen",
      "Zu passenden Produktbereichen weiterleiten",
    ],
  },
  {
    match: "/settings",
    label: "Einstellungen",
    summary:
      "Persoenliche Einstellungen, Live-Anzeigeoptionen und AI-Assistent.",
    capabilities: [
      "Assistent aktivieren oder deaktivieren",
      "Live-Gruppenansicht umschalten",
      "Account- und Theme-Bereich erklaeren",
    ],
  },
  {
    match: "/",
    label: "Home",
    summary: "Startpunkt des Admins mit Navigation zu allen Hauptbereichen.",
    capabilities: [
      "Zum passenden Admin-Bereich lotsen",
      "Hauptfunktionen von Tourney im Admin erklaeren",
    ],
  },
]

const AI_ASSISTANT_NAVIGATION = [
  {
    label: "Home",
    path: "/",
    summary: "Startseite des Admins.",
  },
  {
    label: "Dashboard",
    path: "/dashboard",
    summary: "Schnelle Uebersicht und Orientierung.",
  },
  {
    label: "Live",
    path: "/live",
    summary: "Live-Betrieb eines Turniers mit Matches und Tabellen.",
  },
  {
    label: "Turniere",
    path: "/tournaments",
    summary: "Turniere durchsuchen, anlegen und verwalten.",
  },
  {
    label: "Anmeldung",
    path: "/registration",
    summary: "Registrierungen und Team-Links verwalten.",
  },
  {
    label: "Aktuelles",
    path: "/news",
    summary: "News-Inhalt pflegen.",
  },
  {
    label: "Galerie",
    path: "/gallery",
    summary: "Turnierbilder hochladen und loeschen.",
  },
  {
    label: "Aktivitaet",
    path: "/logs",
    summary: "Aktivitaetsbereich, aktuell noch im Ausbau.",
  },
  {
    label: "Verwaltung",
    path: "/management",
    summary: "Klassen pro Schuljahr verwalten.",
  },
  {
    label: "Einstellungen",
    path: "/settings",
    summary: "Persoenliche Einstellungen und AI/Live-Optionen.",
  },
] as const

export const AI_ASSISTANT_DEFAULT_MODEL: AiAssistantModel = "gpt-4.1-nano"

export const AI_ASSISTANT_MODEL_OPTIONS: Array<{
  label: string
  value: AiAssistantModel
}> = [
  {
    label: "GPT 4.1 Nano",
    value: "gpt-4.1-nano",
  },
]

export function isAiAssistantModel(value: unknown): value is AiAssistantModel {
  return (
    typeof value === "string" &&
    AI_ASSISTANT_MODELS.includes(value as AiAssistantModel)
  )
}

export function getAiAssistantPageDefinition(
  route: string,
): AiAssistantPageDefinition {
  const normalizedRoute = route.trim() || "/"

  return (
    AI_ASSISTANT_PAGES.find((page) => {
      if (page.match === "/") {
        return normalizedRoute === "/"
      }

      return normalizedRoute.startsWith(page.match)
    }) ?? AI_ASSISTANT_PAGES[AI_ASSISTANT_PAGES.length - 1]!
  )
}

export function createAiAssistantRequestContext(input: {
  dynamic?: AiAssistantPageDynamicContext | null
  pageLabel: string
  route: string
}): AiAssistantRequestContext {
  const page = getAiAssistantPageDefinition(input.route)

  return {
    appName: "Tourney Admin",
    dynamic: input.dynamic ?? null,
    navigation: AI_ASSISTANT_NAVIGATION.map((item) => ({ ...item })),
    page: {
      capabilities: [...page.capabilities],
      label: input.pageLabel || page.label,
      route: input.route,
      summary: page.summary,
    },
  }
}
