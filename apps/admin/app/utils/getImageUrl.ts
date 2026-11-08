export default function (filePath: string) {
  const client = useSupabaseClient()
  const { data } = client.storage.from("images").getPublicUrl(filePath)

  return data.publicUrl
}
