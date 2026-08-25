import config from "@/config";

type LocalizedEntry = { data: { lang?: string } };

/**
 * Keeps only the entries written in the given locale.
 *
 * `lang` is always present on collection entries because the schema defines a
 * default, but the fallback keeps this safe if the schema ever changes.
 *
 * Routes under `src/pages/` serve the default locale and pass no argument;
 * routes under `src/pages/<locale>/` pass their own locale explicitly. Passing
 * `Astro.currentLocale` works in components, but NOT inside `getStaticPaths()`
 * — that runs before any URL exists, so the locale must be hardcoded there.
 */
export function filterByLocale<T extends LocalizedEntry>(
  entries: T[],
  locale: string = config.site.lang
): T[] {
  return entries.filter(
    entry => (entry.data.lang ?? config.site.lang) === locale
  );
}
