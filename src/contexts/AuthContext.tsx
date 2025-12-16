
"use client";

import type { UserRole, User } from "@/lib/types";
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";

interface AuthContextType {
  currentUser: User | null | undefined; // undefined means still loading
  login: (username: string, password_plain: string) => Promise<boolean>;
  logout: () => void;
  availableRoles: UserRole[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const availableRoles: UserRole[] = ["admin", "cashier"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null | undefined>(undefined); // Start as undefined
  const router = useRouter();

  useEffect(() => {
    // Simulate async check for existing session (e.g., from localStorage)
    // For now, we'll just set it to null after a short delay if no actual check is done
    const timer = setTimeout(() => {
      if (currentUser === undefined) { // Only if still in initial loading state
        setCurrentUser(null); 
      }
    }, 50); // Minimal delay to allow initial render with undefined
    return () => clearTimeout(timer);
  }, []); // Runs once on mount

  const login = async (usernameInput: string, password_plain: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: password_plain }),
      });

      if (!response.ok) {
        // The API returns a specific error message, which the UI will handle
        return false;
      }

      const user: User = await response.json();
      setCurrentUser(user);
      return true;

    } catch (error) {
      console.error("Login request failed:", error);
      setCurrentUser(null);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    router.push("/"); 
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, availableRoles }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
