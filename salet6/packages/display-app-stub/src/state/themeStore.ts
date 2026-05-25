import { create } from 'zustand';
import type { DrinkProfile, ThemePackage } from '@salet/shared';

interface ThemeState {
  themePackage: ThemePackage | null;
  applyTheme: (pkg: ThemePackage) => void;
  clearTheme: () => void;
  getDrinkById: (id: string) => DrinkProfile | undefined;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  themePackage: null,
  applyTheme: (pkg) => set({ themePackage: pkg }),
  clearTheme: () => set({ themePackage: null }),
  getDrinkById: (id) => get().themePackage?.drinkProfiles.find((drink) => drink.id === id),
}));
