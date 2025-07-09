import { isTokenValid } from "@/_utils/validate-token";

export async function requestWithAuth<T>(
  callback: () => Promise<T>,
): Promise<T> {
  const token = localStorage.getItem("token");

  if (!token || !isTokenValid(token)) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Token inválido ou ausente.");
  }

  return await callback();
}
