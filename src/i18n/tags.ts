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
  androidStudio: { ko: "안드로이드 스튜디오", en: "Android Studio" },
  appSigning: { ko: "앱 서명", en: "App Signing" },
  keystore: { ko: "키스토어", en: "Keystore" },
  security: { ko: "보안", en: "Security" },
  cloud: { ko: "클라우드", en: "Cloud" },
  network: { ko: "네트워크", en: "Network" },
  pricing: { ko: "요금", en: "Pricing" },
  backnd: { ko: "뒤끝", en: "BACKND" },
  gameServer: { ko: "게임 서버", en: "Game Server" },
  camera: { ko: "카메라", en: "Camera" },
  input: { ko: "입력", en: "Input" },
  multiplayer: { ko: "멀티플레이어", en: "Multiplayer" },
  physics: { ko: "물리", en: "Physics" },
  sound: { ko: "사운드", en: "Sound" },
  assetStore: { ko: "에셋스토어", en: "Asset Store" },
  container: { ko: "컨테이너", en: "Container" },
  infrastructure: { ko: "인프라", en: "Infrastructure" },
  versionControl: { ko: "버전 관리", en: "Version Control" },
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
