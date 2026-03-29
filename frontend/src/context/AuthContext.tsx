import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthState {
  token: string | null;
  email: string | null;
  firstName: string | null;
  isAdmin: boolean;
}

interface AuthContextType extends AuthState {
  login: (token: string, email: string, firstName: string, isAdmin?: boolean) => void;
  logout: () => void;
  setFirstName: (name: string) => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ token: null, email: null, firstName: null, isAdmin: false });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");
    const firstName = localStorage.getItem("firstName");
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    if (token && email) setAuth({ token, email, firstName, isAdmin });
  }, []);

  const login = (token: string, email: string, firstName: string, isAdmin = false) => {
    localStorage.setItem("token", token);
    localStorage.setItem("email", email);
    localStorage.setItem("firstName", firstName);
    localStorage.setItem("isAdmin", String(isAdmin));
    setAuth({ token, email, firstName, isAdmin });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("firstName");
    localStorage.removeItem("isAdmin");
    setAuth({ token: null, email: null, firstName: null, isAdmin: false });
  };

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

export const useAuth = () => useContext(AuthContext);
