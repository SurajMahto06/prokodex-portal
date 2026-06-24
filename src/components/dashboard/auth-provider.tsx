"use client";

import React, { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { User, Role } from "@/types";
import { authService } from "@/services/auth";
import { Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader } from "@/components/ui/loader";

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  hasRole: (role: Role) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: user, isLoading } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const currentUser = await authService.getMe();
      return currentUser;
    },
    staleTime: Infinity, // Don't auto-refetch the user profile unless explicitly invalidated
  });

  const login = (userData: User) => {
    queryClient.setQueryData(['auth-user'], userData);
  };

  const logout = async () => {
    await authService.logout();
    queryClient.setQueryData(['auth-user'], null);
    queryClient.clear();
  };

  const hasRole = (role: Role) => {
    return user?.role === role;
  };

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950">
        <Loader text="Loading application..." />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user: user || null, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

