import Handlebars from "handlebars"
import { H3Event } from "h3"
import { useDateFormat } from "@vueuse/core"
import type { Enums, Tables } from "@tourney/types"

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  return error
}

export default defineEventHandler(async (event: H3Event) => {
  const runtimeConfig = useRuntimeConfig(event)
  const gotenbergUrl =
    typeof runtimeConfig.gotenbergUrl === "string"
      ? runtimeConfig.gotenbergUrl
      : ""
  const gotenbergUsername =
    typeof runtimeConfig.gotenbergUsername === "string"
      ? runtimeConfig.gotenbergUsername
      : ""
  const gotenbergPassword =
    typeof runtimeConfig.gotenbergPassword === "string"
      ? runtimeConfig.gotenbergPassword
      : ""

  const {
    pdfName,
    sport,
    year,
    date,
    schoolClass,
    registration_id,
    team_id,
    deadline,
  } = await readBody(event)

  if (!gotenbergUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: "Missing Gotenberg configuration",
    })
  }

  if (
    !sport ||
    !year ||
    !date ||
    !schoolClass ||
    !registration_id ||
    !team_id ||
    !deadline
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing data fields",
    })
  }

  const timestamp = new Date().toISOString()
  const formattedDate = useDateFormat(date, "DD.MM.YYYY")
  const formattedDeadline = useDateFormat(deadline, "DD.MM.YYYY")
  const players = await $fetch<Tables<"player">[]>(
    `/api/players/query/find-by-team/${team_id}`,
  )
  const formattedPlayers = players?.map((player) => {
    return `${player.first_name} ${player.last_name}, ${player.class}`
  })

  const templateSource =
    await useStorage("assets:templates").getItem<string>("pdf-template.html")
  if (!templateSource) {
    throw createError({
      statusCode: 500,
      statusMessage: "PDF template not found",
    })
  }

  Handlebars.registerHelper("getPlayer", function (array, index) {
    return array[index] || ""
  })

  let money
  switch (sport as Enums<"sport_type">) {
    case "Fußball":
      money = 25
      break
    case "Basketball":
      money = 12
      break
    case "Volleyball":
      money = 15
      break
  }

  const template = Handlebars.compile(templateSource)
  const html = template({
    date: formattedDate.value,
    deadline: formattedDeadline.value,
    players: formattedPlayers,
    id: registration_id,
    pdfName,
    sport,
    year,
    schoolClass,
    timestamp,
    money,
  })

  const formData = new FormData()
  const filename =
    typeof pdfName === "string" && pdfName.endsWith(".pdf")
      ? pdfName
      : `${pdfName || "document"}.pdf`
  const endpoint = new URL("/forms/chromium/convert/html", gotenbergUrl)
  const headers = new Headers()

  if (gotenbergUsername && gotenbergPassword) {
    const credentials = Buffer.from(
      `${gotenbergUsername}:${gotenbergPassword}`,
    ).toString("base64")
    headers.set("Authorization", `Basic ${credentials}`)
  }

  formData.append(
    "files",
    new File([html], "index.html", {
      type: "text/html",
    }),
  )
  formData.append("printBackground", "true")
  formData.append("paperWidth", "8.27")
  formData.append("paperHeight", "11.69")
  formData.append("marginTop", "0.2")
  formData.append("marginRight", "0.2")
  formData.append("marginBottom", "0.2")
  formData.append("marginLeft", "0.2")

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
      headers,
      signal: AbortSignal.timeout(30_000),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error("Gotenberg PDF generation failed", {
        body: errorBody,
        gotenbergUrl,
        status: response.status,
      })

      throw createError({
        statusCode: 500,
        statusMessage: "Gotenberg PDF generation failed",
      })
    }

    const pdfBuffer = Buffer.from(await response.arrayBuffer())

    event.node.res.setHeader("Content-Type", "application/pdf")
    event.node.res.setHeader(
      "Content-Disposition",
      `inline; filename="${filename}"`,
    )

    return pdfBuffer
  } catch (error) {
    console.error("Error generating PDF", {
      error: serializeError(error),
      gotenbergUrl,
    })

    throw createError({
      statusCode: 500,
      statusMessage: "Error generating PDF",
    })
  }
})
