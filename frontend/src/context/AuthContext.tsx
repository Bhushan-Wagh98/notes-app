/**
 * @module context/AuthContext
 * @description Global authentication state managed via React Context.
 * Persists token, email, firstName, and admin flag in localStorage
 * so the session survives page reloads.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

/** Internal auth state shape stored in context. */
interface AuthState {
  token: string | null;
  email: string | null;
  firstName: string | null;
  isAdmin: boolean;
}

/** Public API exposed by the AuthContext provider. */
interface AuthContextType extends AuthState {
  login: (token: string, email: string, firstName: string, isAdmin?: boolean) => void;
  logout: () => void;
  setFirstName: (name: string) => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

/** Provides authentication state and actions to the component tree. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    token: null, email: null, firstName: null, isAdmin: false,
  });

  /* Rehydrate auth state from localStorage on initial mount. */
  useEffect(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");
    const firstName = localStorage.getItem("firstName");
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    if (token && email) setAuth({ token, email, firstName, isAdmin });
  }, []);

  /** Persists credentials and updates context after successful authentication. */
  const login = (token: string, email: string, firstName: string, isAdmin = false) => {
    localStorage.setItem("token", token);
    localStorage.setItem("email", email);
    localStorage.setItem("firstName", firstName);
    localStorage.setItem("isAdmin", String(isAdmin));
    setAuth({ token, email, firstName, isAdmin });
  };

  /** Clears all persisted credentials and resets context. */
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("firstName");
    localStorage.removeItem("isAdmin");
    setAuth({ token: null, email: null, firstName: null, isAdmin: false });
  };

  /** Updates only the display name in both context and localStorage. */
  const setFirstName = (name: string) => {
    localStorage.setItem("firstName", name);
    setAuth((prev) => ({ ...prev, firstName: name }));
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, setFirstName, isLoggedIn: !!auth.token }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Convenience hook to consume the AuthContext. */
export const useAuth = () => useContext(AuthContext);
