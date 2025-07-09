export async function deleteFile(fileKey: string) {
  const response = await fetch("/api/uploadthing/delete-uploadthing-file", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileKey }),
  });
  if (!response.ok) {
    throw new Error("Erro ao deletar arquivo do UploadThing");
  }
  return response.json();
}