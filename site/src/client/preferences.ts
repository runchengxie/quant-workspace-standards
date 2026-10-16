import type { Locale } from "../lib/locale";
export type { Locale } from "../lib/locale";
export type Theme = "system" | "light" | "dark";
export function normalizeLocale(value: unknown): Locale {
  return value === "zh-CN" ? "zh-CN" : "en-US";
}
export function normalizeTheme(value: unknown): Theme {
  return value === "light" || value === "dark" ? value : "system";
}
export function resolvedTheme(
  value: Theme,
  systemDark: boolean,
): "light" | "dark" {
  return value === "system" ? (systemDark ? "dark" : "light") : value;
}
export function readPreference(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
export function savePreference(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Preferences remain active in memory. */
  }
}

export function readPresentationPreference(
  key: string,
  queryKey: string,
): string | null {
  const fromFileLink =
    location.protocol === "file:"
      ? new URL(location.href).searchParams.get(queryKey)
      : null;
  return fromFileLink ?? readPreference(key);
}
