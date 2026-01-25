import { create } from "zustand";

interface YearState {
  year: number;
  setYear: (year: number) => void;
}

const currentYear = new Date().getFullYear();

export const useYearStore = create<YearState>((set) => ({
  year: currentYear,
  setYear: (year) => set({ year }),
}));
