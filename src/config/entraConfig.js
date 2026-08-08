/**
 * Frontend Entra (Azure AD) MSAL settings from Vite env.
 * No secrets — SPA public client. Live SSO needs TenantId + ClientId filled.
 */

export function getEntraEnvConfig() {
  const clientId = (import.meta.env.VITE_ENTRA_CLIENT_ID ?? "").trim();
  const tenantId = (import.meta.env.VITE_ENTRA_TENANT_ID ?? "").trim();
  const redirectUri = (import.meta.env.VITE_ENTRA_REDIRECT_URI ?? "").trim()
    || `${window.location.origin}/auth/callback`;
  const apiClientId = (import.meta.env.VITE_ENTRA_API_CLIENT_ID ?? "").trim();

  const configured = Boolean(clientId && tenantId);

  return {
    clientId,
    tenantId,
    redirectUri,
    apiClientId,
    authority: configured
      ? `https://login.microsoftonline.com/${tenantId}`
      : "",
    configured,
  };
}
