import {
  defineConfig,
  envField,
  fontProviders,
  svgoOptimizer,
} from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { unified } from "@astrojs/markdown-remark";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import rehypeCallouts from "rehype-callouts";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { transformerFileName } from "./src/utils/transformers/fileName";
import config from "./astro-paper.config";

export default defineConfig({
  site: config.site.url,
  integrations: [
    mdx(),
    sitemap({
      filter: page =>
        config.features?.showArchives !== false || !page.endsWith("/archives/"),
    }),
  ],
  // ─────────────────────────────────────────────────────────────
  // 다국어 URL 구조 — B안 확정 (결정: 2026-08-24)
  //   /  = 한국어(기본),  /en/,  /ja/
  //
  // [근거]
  //   A안(/ko/ 대칭 구조)은 prefixDefaultLocale: true를 요구하는데,
  //   짝이 되는 redirectToDefaultLocale이 output: "server"를 요구한다.
  //   (Astro v6부터 기본값 false, prefixDefaultLocale: true일 때만 유효)
  //   GitHub Pages는 정적 호스팅이라 301을 쓸 수 없으므로, A안을 택하면
  //   사이트에서 가장 많이 공유되는 URL인 / 에 meta refresh 한 홉이
  //   영구히 남는다. B안의 비용(루트용/[locale]용 라우트 두 벌)은
  //   라우트 8개짜리 일회성이므로 더 싸다고 판단.
  //
  // [검증한 것]
  //   - hreflang: @astrojs/sitemap의 i18n 옵션이 URL 접두사로 로케일을
  //     판별해 자동 생성. 접두사 없는 URL은 defaultLocale 처리 → B안 OK.
  //   - 검색: Pagefind가 <html lang>만 보고 언어별 인덱스를 분리. 설정 불필요.
  //   - rest 파라미터 한 벌 관리([...locale]/posts/[...slug])는 astro 7.2.2
  //     기준 검증상 막히지 않고 빌드도 되지만, 매칭 정규식이 모호해지고
  //     최상위 catch-all이 라우트 우선순위와 충돌할 여지가 있어 채택하지 않음.
  //
  // [연동 주의]
  //   locales는 astro-paper.config.ts의 site.lang과 연동된다.
  //   한쪽만 바꾸면 MissingLocaleError로 빌드가 깨진다.
  //   ja 추가 시 src/i18n/lang/ja.ts도 함께 추가할 것.
  //
  // [재검토 조건]
  //   글 대부분을 3개국어로 번역하게 되거나, 주 언어가 한국어가 아니게 되면
  //   A안의 대칭성이 리다이렉트 비용을 넘어선다. 그때 다시 판단할 것.
  // ─────────────────────────────────────────────────────────────
  i18n: {
    // 번역할 글이 생기면 "en", "ja"를 추가한다. (착수 전까지는 ko 단독 유지)
    locales: ["ko"],
    defaultLocale: "ko",
    routing: {
      // B안: 기본 로케일(ko)에는 접두사를 붙이지 않는다.
      prefixDefaultLocale: false,
    },
  },
  markdown: {
    processor: unified({
      remarkPlugins: [
        remarkToc,
        [remarkCollapse, { test: "Table of contents" }],
      ],
      rehypePlugins: [rehypeCallouts],
    }),
    shikiConfig: {
      themes: { light: "min-light", dark: "night-owl" },
      defaultColor: false,
      wrap: false,
      transformers: [
        transformerFileName({ style: "v2", hideDot: false }),
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  fonts: [
    {
      name: "Google Sans Code",
      cssVariable: "--font-google-sans-code",
      provider: fontProviders.google(),
      fallbacks: ["monospace"],
      weights: [300, 400, 500, 600, 700],
      styles: ["normal", "italic"],
      formats: ["woff", "ttf"],
    },
  ],
  env: {
    schema: {
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
    },
  },
  experimental: {
    svgOptimizer: svgoOptimizer(),
  },
});
