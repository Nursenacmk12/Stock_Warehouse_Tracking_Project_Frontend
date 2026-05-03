import { createContext, useCallback, useMemo, useState } from "react";
import { loginWithApi } from "../services/authApi.js";

const TOKEN_KEY = "stock_auth_token";
const USER_KEY = "stock_auth_user";

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

    const nextUser = {
      userName: result.userName,
      role: result.role,
      expiresAt: result.expiresAt,
    };

    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(result.token);
    setUser(nextUser);

    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, token, user, login, logout }),
    [isAuthenticated, token, user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext, AuthProvider };
