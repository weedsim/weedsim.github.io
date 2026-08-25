/**
 * Home-page hero copy, per locale.
 *
 * This is site identity text rather than UI chrome, so it lives here instead
 * of in the `UIStrings` dictionaries — adding a locale here does not force a
 * change to the shared interface.
 */
type Hero = {
  heading: string;
  paragraphs: string[];
};

const HERO: Record<string, Hero> = {
  ko: {
    heading: "다다익선 개발자",
    paragraphs: [
      "많이 만들고, 많이 부딪히고, 많이 기록합니다.",
      "Unity로 게임 클라이언트를 만듭니다. 게임 시스템 설계와 구현이 주 관심사이고, AI와 하드웨어처럼 그 밑단에 있는 것들도 함께 파고듭니다.",
      "만들면서 부딪힌 문제와 해결 과정, 그리고 새로 써보고 싶은 기술에 대한 자료를 남깁니다.",
    ],
  },
  en: {
    heading: "The more, the better",
    paragraphs: [
      "Build a lot, break a lot, write a lot of it down.",
      "I build game clients with Unity. Designing and implementing game systems is the main interest, along with the layers underneath — AI and hardware.",
      "I write up the problems I hit while building things and how I worked through them, plus notes on tech I want to try.",
    ],
  },
};

export function getHero(locale: string): Hero {
  return HERO[locale] ?? HERO.ko;
}
