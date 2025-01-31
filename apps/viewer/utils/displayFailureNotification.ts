/**
 * Display a failure notification
 * @param title title of the notification
 * @param description description of the notification, keep it short
 */
export default function (title: string, description: string) {
  const toast = useToast()
  toast.add({
    title: title,
    description: description,
    color: "red",
    icon: "i-material-symbols-error-circle-rounded-outline-sharp",
  })
}
