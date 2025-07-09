import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  exp: number;
  [key: string]: any; // permite outros campos como sub, email, role, etc.
}

export function isTokenValid(token: string): boolean {
  try {
    const decoded: TokenPayload = jwtDecode(token);
    const now = Date.now() / 1000; // em segundos
    return decoded.exp > now;
  } catch (error) {
    return false;
  }
}
