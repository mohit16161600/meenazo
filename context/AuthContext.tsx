"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { User, AuthResult } from "@/types";
import { authService } from "@/services/authService";
import { pushLocalDataToServer } from "@/lib/customerSync";

export interface RegisterInput {
  name: string;
  phone: string;
  email?: string;
  password?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  /** Send a login OTP to a mobile number. */
  requestOtp: (phone: string) => Promise<AuthResult>;
  /** Verify a phone OTP and sign in. */
  verifyOtp: (phone: string, code: string, name?: string) => Promise<AuthResult>;
  /** Optional email + password login. */
  loginEmail: (email: string, password: string) => Promise<AuthResult>;
  register: (input: RegisterInput) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User> & { password?: string; currentPassword?: string }) => Promise<AuthResult>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const u = await authService.me().catch(() => null);
    setUser(u);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // On a successful sign-in, adopt the user and push local wishlist/cart to DB.
  const onAuthed = useCallback(async (res: AuthResult): Promise<AuthResult> => {
    if (res.success && res.user) {
      setUser(res.user);
      try {
        await pushLocalDataToServer();
      } catch {
        /* non-fatal */
      }
    }
    return res;
  }, []);

  const requestOtp = useCallback((phone: string) => authService.requestOtp(phone), []);

  const verifyOtp = useCallback(
    async (phone: string, code: string, name?: string) =>
      onAuthed(await authService.verifyOtp(phone, code, name)),
    [onAuthed]
  );

  const loginEmail = useCallback(
    async (email: string, password: string) => onAuthed(await authService.loginEmail(email, password)),
    [onAuthed]
  );

  const register = useCallback(
    async (input: RegisterInput) => onAuthed(await authService.register(input)),
    [onAuthed]
  );

  const logout = useCallback(async () => {
    await authService.logout().catch(() => {});
    setUser(null);
  }, []);

  const updateUser = useCallback(
    async (updates: Partial<User> & { password?: string; currentPassword?: string }) => {
      const res = await authService.updateProfile({
        name: updates.name,
        email: updates.email,
        password: updates.password,
        currentPassword: updates.currentPassword,
      });
      if (res.success && res.user) setUser(res.user);
      return res;
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        requestOtp,
        verifyOtp,
        loginEmail,
        register,
        logout,
        updateUser,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
