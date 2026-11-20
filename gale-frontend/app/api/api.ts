import { isTokenValid } from "@/_utils/validate-token";
import axios from "axios";

const isBrowser = typeof window !== "undefined";

/*
 * Endereço do backend, decidido por uma regra só:
 *
 *   NEXT_PUBLIC_API_URL preenchida  -> ambiente real, usa esse endereço.
 *   NEXT_PUBLIC_API_URL vazia       -> ambiente de teste, descobre sozinho.
 *
 * No modo de teste o host vem da própria página aberta no navegador, e não
 * de "localhost" fixo. Isso importa porque quem resolve "localhost" é o
 * NAVEGADOR: abrindo http://192.168.x.x:3001 de outro computador, um
 * "localhost:3000" apontaria pra esse outro computador, onde não há
 * backend. Assim, cada máquina acerta o endereço sem configurar nada.
 *
 * Onde definir cada uma (o Next escolhe o arquivo pelo comando usado):
 *   .env.local       -> npm run dev    : deixe vazia
 *   .env.production  -> npm run build  : coloque a URL pública da API
 */
const API_PORT = process.env.NEXT_PUBLIC_API_PORT?.trim() || "3000";

// trim + checagem de vazio porque `NEXT_PUBLIC_API_URL=" "` viria como
// string com espaço — verdadeira, e viraria uma URL inválida.
const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

const autoDetectedBaseURL = isBrowser
  ? `${window.location.protocol}//${window.location.hostname}:${API_PORT}`
  : `http://localhost:${API_PORT}`;

export const baseURL = configuredApiUrl
  ? // Barra final atrapalha: viraria "https://api.site.com//user".
    configuredApiUrl.replace(/\/+$/, "")
  : autoDetectedBaseURL;

// Em produção o endereço deveria estar configurado. Se não está, o app
// segue funcionando pelo host detectado — mas avisa, porque isso quase
// sempre é um .env.production esquecido.
if (
  isBrowser &&
  !configuredApiUrl &&
  process.env.NODE_ENV === "production"
) {
  console.warn(
    `[api] NEXT_PUBLIC_API_URL está vazia em produção. ` +
      `Usando o host detectado: ${baseURL}. ` +
      `Defina a URL da API em .env.production.`,
  );
}

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  if (token && isTokenValid(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
