"use client";
import { createContext, useContext } from "react";
import type { AppUser } from "./Types";

interface AuthContextType {
  user: AppUser | null;
  setUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
  loading: boolean;
  handleLogout: () => Promise<void>;
  notifications?: any[];
  setNotifications?: React.Dispatch<React.SetStateAction<any[]>>;
  redBadge: boolean;
  isAuthenticated: boolean;
  setRedBadge: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  loading: false,
  handleLogout: async () => {},
  notifications: [],
  isAuthenticated: false,
  setNotifications: () => {},
  redBadge: false,
  setRedBadge: () => {},
});

export const useAuth = () => useContext(AuthContext);
