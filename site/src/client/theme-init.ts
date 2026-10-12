import {
  normalizeTheme,
  readPresentationPreference,
  resolvedTheme,
} from "./preferences";
const theme = normalizeTheme(
  readPresentationPreference("maintenance-theme", "theme"),
);
const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
document.documentElement.dataset["theme"] = resolvedTheme(theme, systemDark);
