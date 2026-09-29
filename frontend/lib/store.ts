import { create } from "zustand";
import { persist } from "zustand/middleware";

export type BrowsePath = "rent" | "buy" | null;
export type UserRole = "user" | "landlord" | "agent" | "realtor" | "admin" | null;
export type Theme = "light" | "dark";

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  bio: string;
  states: string[];
  areas: string[];
}

interface AppState {
  path: BrowsePath;
  setPath: (path: BrowsePath) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  role: UserRole;
  loggedIn: boolean;
  token: string | null;
  logIn: (role: Exclude<UserRole, null>, token?: string) => void;
  logOut: (notice?: string) => void;
  /** Shown once on the sign-in page, e.g. "Your session expired." */
  sessionNotice: string | null;
  clearSessionNotice: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  user: UserProfile | null;
  setUser: (user: UserProfile) => void;
  updateUser: (patch: Partial<UserProfile>) => void;
  railExpanded: boolean;
  toggleRail: () => void;
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      path: null,
      setPath: (path) => set({ path }),
      searchQuery: "",
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      role: null,
      loggedIn: false,
      token: null,
      logIn: (role, token) => set({ role, loggedIn: true, token: token ?? null }),
      logOut: (notice) => set({ role: null, loggedIn: false, token: null, user: null, sessionNotice: notice ?? null }),
      sessionNotice: null,
      clearSessionNotice: () => set({ sessionNotice: null }),
      theme: "light",
      setTheme: (theme) => {
        set({ theme });
        document.documentElement.classList.toggle("dark", theme === "dark");
      },
      toggleTheme: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),
      user: null,
      setUser: (user) => set({ user }),
      updateUser: (patch) =>
        set((s) => ({
          user: { name: "", email: "", phone: "", bio: "", states: [], areas: [], ...s.user, ...patch },
        })),
      railExpanded: false,
      toggleRail: () => set((s) => ({ railExpanded: !s.railExpanded })),
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "housify-session",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
