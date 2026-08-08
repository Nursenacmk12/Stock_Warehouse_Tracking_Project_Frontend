import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { loginWithApi } from "../services/authApi.js";
import { beginEntraLoginRedirect, completeEntraRedirectLogin } from "../services/entraAuth.js";
import { setUnauthorizedHandler, TOKEN_KEY, USER_KEY } from "../services/apiClient.js";

function readSession() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const rawUser = localStorage.getItem(USER_KEY);
    if (!token || !rawUser) {
      return { token: null, user: null };
    }
    const user = JSON.parse(rawUser);
    if (user?.expiresAt && new Date(user.expiresAt).getTime() <= Date.now()) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return { token: null, user: null };
    }
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

function applySession(result, setToken, setUser) {
  const nextUser = {
    userName: result.userName,
    role: result.role,
    expiresAt: result.expiresAt,
  };

  localStorage.setItem(TOKEN_KEY, result.token);
  localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  setToken(result.token);
  setUser(nextUser);
}

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const initial = readSession();
  const [token, setToken] = useState(initial.token);
  const [user, setUser] = useState(initial.user);

  const isAuthenticated = Boolean(token && user);

  const login = useCallback(async (email, password) => {
    const result = await loginWithApi(email, password);
    if (!result.ok) {
      return { success: false, message: result.message };
    }

    applySession(result, setToken, setUser);
    return { success: true };
  }, []);

  /**
   * Starts MSAL redirect to Microsoft. Session is applied on /auth/callback.
   */
  const loginWithMicrosoft = useCallback(async () => {
    const result = await beginEntraLoginRedirect();
    if (!result.ok) {
      return { success: false, message: result.message };
    }
    return { success: true, redirecting: true };
  }, []);

  /**
   * Finishes Entra redirect and stores the StockGuard JWT (localStorage Bearer).
   */
  const completeMicrosoftLogin = useCallback(async () => {
    const result = await completeEntraRedirectLogin();
    if (result.pendingRedirect) {
      return { success: true, redirecting: true };
    }
    if (!result.ok) {
      return { success: false, message: result.message, cancelled: result.cancelled };
    }

    applySession(result, setToken, setUser);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const value = useMemo(
    () => ({
      isAuthenticated,
      token,
      user,
      login,
      loginWithMicrosoft,
      completeMicrosoftLogin,
      logout,
    }),
    [isAuthenticated, token, user, login, loginWithMicrosoft, completeMicrosoftLogin, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext, AuthProvider };
