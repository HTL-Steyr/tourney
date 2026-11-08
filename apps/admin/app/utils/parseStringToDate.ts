export default function (timeString: string): Date {
  const [hours = 0, minutes = 0, seconds = 0] = timeString
    .split(":")
    .map(Number)
  const date = new Date()
  date.setHours(hours)
  date.setMinutes(minutes)
  date.setSeconds(seconds)
  return date
}
