import type { UIStrings } from "../types";

export default {
  nav: {
    home: "ホーム",
    posts: "記事",
    tags: "タグ",
    about: "プロフィール",
    archives: "アーカイブ",
    search: "検索",
  },
  post: {
    publishedAt: "公開日",
    updatedAt: "更新日",
    sharePostIntro: "この記事をシェア:",
    sharePostOn: "{{platform}}でこの記事をシェア",
    sharePostViaEmail: "メールでこの記事をシェア",
    tagLabel: "タグ",
    backToTop: "トップへ戻る",
    goBack: "戻る",
    editPage: "ページを編集",
    previousPost: "前の記事",
    nextPost: "次の記事",
  },
  pagination: {
    prev: "前へ",
    next: "次へ",
    page: "ページ",
  },
  home: {
    socialLinks: "リンク",
    featured: "注目の記事",
    recentPosts: "最近の記事",
    allPosts: "すべての記事を見る",
  },
  footer: {
    copyright: "Copyright",
    allRightsReserved: "All rights reserved.",
  },
  pages: {
    tagTitle: "タグ",
    tagDesc: "このタグが付いたすべての記事",

    tagsTitle: "タグ",
    tagsDesc: "記事で使われているすべてのタグ",

    postsTitle: "記事",
    postsDesc: "投稿したすべての記事",

    archivesTitle: "アーカイブ",
    archivesDesc: "アーカイブされたすべての記事",

    searchTitle: "検索",
    searchDesc: "記事を検索 ...",
  },
  a11y: {
    skipToContent: "本文へスキップ",
    openMenu: "メニューを開く",
    closeMenu: "メニューを閉じる",
    toggleTheme: "テーマを切り替える",
    searchPlaceholder: "記事を検索...",
    noResults: "検索結果がありません",
    goToPreviousPage: "前のページへ",
    goToNextPage: "次のページへ",
  },
  notFound: {
    title: "404 Not Found",
    message: "ページが見つかりません",
    goHome: "ホームに戻る",
  },
} satisfies UIStrings;
