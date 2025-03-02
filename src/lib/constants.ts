
import { ShiftTemplate } from "./types";

export const DAYS_OF_WEEK = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

export const MONTHS = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

export const DEFAULT_SHIFT_TEMPLATES: ShiftTemplate[] = [
  { id: "morning", name: "Mattina", startTime: "08:00", endTime: "12:00", duration: 4 },
  { id: "lunch", name: "Pranzo", startTime: "12:00", endTime: "17:00", duration: 5 },
  { id: "evening", name: "Sera", startTime: "17:00", endTime: "23:00", duration: 6 },
  { id: "short-morning", name: "Breve Mattina", startTime: "10:00", endTime: "14:00", duration: 4 },
  { id: "short-evening", name: "Breve Sera", startTime: "18:00", endTime: "22:00", duration: 4 },
  { id: "full-day", name: "Giornata completa", startTime: "09:00", endTime: "17:00", duration: 8 },
];
