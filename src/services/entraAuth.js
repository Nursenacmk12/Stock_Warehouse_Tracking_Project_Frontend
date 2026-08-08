import { PublicClientApplication, InteractionRequiredAuthError } from "@azure/msal-browser";
import { getEntraEnvConfig } from "../config/entraConfig.js";
import { fetchEntraConfig, loginWithEntraToken } from "./authApi.js";

/** @type {PublicClientApplication | null} */
let pca = null;

function buildMsalConfig(env) {
  return {
    auth: {
      clientId: env.clientId,
      authority: env.authority,
      redirectUri: env.redirectUri,
      postLogoutRedirectUri: window.location.origin,
      navigateToLoginRequestUrl: false,
    },
    cache: {
      cacheLocation: "sessionStorage",
      storeAuthStateInCookie: false,
    },
  };
}

/**
 * @returns {Promise<{ ok: true, pca: PublicClientApplication, env: ReturnType<typeof getEntraEnvConfig> } | { ok: false, message: string }>}
 */
async function ensureMsal() {
  const env = getEntraEnvConfig();
  if (!env.configured) {
    return {
      ok: false,
      message:
        "Microsoft girişi yapılandırılmamış. VITE_ENTRA_CLIENT_ID ve VITE_ENTRA_TENANT_ID gerekli.",
    };
  }

  if (!pca) {
    pca = new PublicClientApplication(buildMsalConfig(env));
    await pca.initialize();
  }

  return { ok: true, pca, env };
}

/**
 * Whether the login UI should offer Microsoft SSO (env placeholders filled).
 */
export function isEntraLoginAvailable() {
  return getEntraEnvConfig().configured;
}

/**
 * Optional API probe — returns server-side Entra status.
 */
export async function probeEntraApiConfig() {
  return fetchEntraConfig();
}

/**
 * Start Entra redirect login (MSAL). Returns to /auth/callback.
 */
export async function beginEntraLoginRedirect() {
  const ready = await ensureMsal();
  if (!ready.ok) return ready;

  const api = await fetchEntraConfig();
  if (api.ok && api.data && api.data.enabled === false) {
    return {
      ok: false,
      message:
        api.data.message
        || "API tarafında Entra SSO kapalı (Authentication:Entra:Enabled=false).",
    };
  }

  await ready.pca.loginRedirect({
    scopes: ["openid", "profile", "email"],
    prompt: "select_account",
  });

  return { ok: true };
}

/**
 * Complete redirect on /auth/callback: exchange Entra id_token for StockGuard JWT.
 * @returns {Promise<{ ok: true, token: string, userName: string, role: string, expiresAt: string } | { ok: false, message: string, cancelled?: boolean }>}
 */
export async function completeEntraRedirectLogin() {
  const ready = await ensureMsal();
  if (!ready.ok) return ready;

  let result;
  try {
    result = await ready.pca.handleRedirectPromise();
  } catch (err) {
    const message = err?.message || "Microsoft yönlendirmesi tamamlanamadı.";
    return { ok: false, message };
  }

  if (!result) {
    // No redirect response — user may have opened /auth/callback directly.
    const accounts = ready.pca.getAllAccounts();
    if (accounts.length === 0) {
      return { ok: false, message: "Microsoft oturumu bulunamadı.", cancelled: true };
    }

    try {
      const silent = await ready.pca.acquireTokenSilent({
        account: accounts[0],
        scopes: ["openid", "profile", "email"],
      });
      result = silent;
    } catch (err) {
      if (err instanceof InteractionRequiredAuthError) {
        await ready.pca.loginRedirect({ scopes: ["openid", "profile", "email"] });
        return { ok: true, pendingRedirect: true };
      }
      return { ok: false, message: err?.message || "Microsoft jetonu alınamadı." };
    }
  }

  const idToken = result?.idToken;
  if (!idToken) {
    return { ok: false, message: "Microsoft kimlik jetonu (id_token) alınamadı." };
  }

  return loginWithEntraToken(idToken);
}
