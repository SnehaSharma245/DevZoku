"use client";
import { createContext, useContext } from "react";
import type { AppUser } from "./Types";

interface AuthContextType {
  user: AppUser | null;
  setUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
  loading: boolean;
  error: string | null;
  handleLogout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  isPublicRoute: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  loading: false,
  error: null,
  handleLogout: async () => {},
  refreshUserData: async () => {},
  isPublicRoute: true,
});

export const useAuth = () => useContext(AuthContext);
