import { create } from 'zustand'

interface OnboardingState {
  onboarded: boolean
  setOnboarded: (value: boolean) => void
}

/**
 * Onboarding completion flag.
 *
 * NOTE: in-memory only for v1 — re-shown on every app launch. Persistence via
 * MMKV (or AsyncStorage) lands together with the background-geolocation SDK in
 * Phase 3 Task 3.2 when the bare React Native build is set up.
 */
export const useOnboarding = create<OnboardingState>((set) => ({
  onboarded: false,
  setOnboarded: (value) => set({ onboarded: value }),
}))
