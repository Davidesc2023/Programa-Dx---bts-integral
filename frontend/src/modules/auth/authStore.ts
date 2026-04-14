'use client';

import { create } from 'zustand';
import { decodeJwtPayload } from '@/lib/token';
import type { JwtPayload } from '@/types/api.types';
import type { UserRole } from '@/types/enums';

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  setUserFromToken: (accessToken: string) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setUserFromToken: (accessToken: string) => {
    const payload = decodeJwtPayload<JwtPayload>(accessToken);
    if (!payload) return;
    set({
      user: {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      },
      isAuthenticated: true,
    });
  },

  clearUser: () => set({ user: null, isAuthenticated: false }),
}));
