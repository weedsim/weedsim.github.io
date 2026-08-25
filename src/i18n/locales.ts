/**
 * The locales the site ships, in menu order, with each language's own name.
 *
 * ⚠ Keep the `code` list in sync with `i18n.locales` in `astro.config.ts`.
 * Astro validates locale codes against that config — a code that is present
 * here but missing there throws `MissingLocaleError` at build time.
 *
 * Labels are autonyms (each language named in itself), so they are not
 * translated and need no entry in the UI string dictionaries.
 */
export const LOCALES = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
] as const;

export type LocaleCode = (typeof LOCALES)[number]["code"];
