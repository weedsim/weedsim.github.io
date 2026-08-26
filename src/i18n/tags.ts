/**
 * Tags whose label differs between locales.
 *
 * The key is an arbitrary concept id; the value maps a locale code to the
 * label used in that locale's posts. Tags written the same way everywhere
 * (`adb`, `Unity`, `GPU`) are deliberately absent — their slugs already match
 * across locales, so no mapping is needed.
 *
 * Naming rule: use the original-language form, unless Korean developers
 * normally write the term in Hangul (Android → 안드로이드). Add a row here
 * whenever a new tag of that kind is introduced.
 */
export const TAG_TRANSLATIONS: Record<string, Record<string, string>> = {
  android: { ko: "안드로이드", en: "Android" },
  graphics: { ko: "그래픽스", en: "Graphics" },
  rendering: { ko: "렌더링", en: "Rendering" },
  filesystem: { ko: "파일시스템", en: "File System" },
  linux: { ko: "리눅스", en: "Linux" },
  windows: { ko: "윈도우", en: "Windows" },
  shader: { ko: "셰이더", en: "Shader" },
  ondeviceAi: { ko: "온디바이스 AI", en: "On-device AI" },
  advertising: { ko: "광고", en: "Advertising" },
  monetization: { ko: "수익화", en: "Monetization" },
  mobile: { ko: "모바일", en: "Mobile" },
};

/**
 * The label for the same tag in another locale.
 *
 * Returns the input unchanged when the tag is not in the dictionary, which is
 * the correct answer for locale-neutral tags.
 */
export function translateTag(
  tagName: string,
  from: string,
  to: string
): string {
  for (const labels of Object.values(TAG_TRANSLATIONS)) {
    if (labels[from] === tagName) {
      return labels[to] ?? tagName;
    }
  }
  return tagName;
}
