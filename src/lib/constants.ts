import { ShiftTemplate } from "./types";

export const DAYS_OF_WEEK = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

export const MONTHS = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

export const DEFAULT_SHIFT_TEMPLATES: ShiftTemplate[] = [
  { id: "1", name: "Mattina", startTime: "12:00", endTime: "17:00", duration: 5 },
  { id: "2", name: "Sera", startTime: "17:00", endTime: "23:00", duration: 6 },
  { id: "3", name: "Lungo", startTime: "12:00", endTime: "23:00", duration: 11 }
];
