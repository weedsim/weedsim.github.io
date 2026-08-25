import type { GetStaticPathsOptions } from "astro";
import { type CollectionEntry, getCollection } from "astro:content";
import { getSortedPosts } from "./getSortedPosts";
import { getUniqueTags } from "./getUniqueTags";
import { getPostSlug, getPostUrl } from "./getPostPaths";
import { filterByLocale } from "./filterByLocale";
import { slugifyAll } from "./slugify";
import config from "@/config";

/**
 * Shared `getStaticPaths` builders, one per route shape.
 *
 * Every route exists twice — once under `src/pages/` for the default locale
 * and once under `src/pages/<locale>/` for the others — so the path logic
 * lives here instead of being copy-pasted between them.
 *
 * The locale has to be passed in explicitly: `getStaticPaths()` runs before
 * any URL exists, so `Astro.currentLocale` is not available there.
 */

async function localePosts(locale: string, excludeDrafts = false) {
  const posts = excludeDrafts
    ? await getCollection("posts", ({ data }) => !data.draft)
    : await getCollection("posts");
  return filterByLocale(posts, locale);
}

type AdjacentPost = {
  id: string;
  title: string;
  filePath: string | undefined;
};

const toAdjacent = (post: CollectionEntry<"posts">): AdjacentPost => ({
  id: post.id,
  title: post.data.title,
  filePath: post.filePath,
});

/** `/posts/[...page]` — paginated post list. */
export async function postListPaths(
  { paginate }: GetStaticPathsOptions,
  locale: string
) {
  const posts = await localePosts(locale, true);
  return paginate(getSortedPosts(posts), { pageSize: config.posts.perPage });
}

/** `/posts/[...slug]` — post detail, with previous/next navigation. */
export async function postDetailPaths(locale: string) {
  const sortedPosts = getSortedPosts(await localePosts(locale));

  return sortedPosts.map((post, index) => ({
    params: { slug: getPostSlug(post.id, post.filePath) },
    props: {
      post,
      // sortedPosts is newest-first, so "older" (prev) is a higher index
      // and "newer" (next) is a lower index.
      prevPost:
        index < sortedPosts.length - 1
          ? toAdjacent(sortedPosts[index + 1])
          : null,
      nextPost: index > 0 ? toAdjacent(sortedPosts[index - 1]) : null,
    },
  }));
}

/** `/posts/[...slug]/index.png` — generated Open Graph images. */
export async function ogImagePaths(locale: string) {
  if (!config.features.dynamicOgImage) {
    return [];
  }
  const posts = (await localePosts(locale)).filter(
    ({ data }) => !data.draft && !data.ogImage
  );
  return posts.map(post => ({
    params: { slug: getPostSlug(post.id, post.filePath) },
    props: post,
  }));
}

/** `/tags/[tag]/[...page]` — paginated posts for one tag. */
export async function tagPaths(
  { paginate }: GetStaticPathsOptions,
  locale: string
) {
  const posts = await localePosts(locale, true);
  const tags = getUniqueTags(posts);

  return tags.flatMap(({ tag, tagName }) => {
    const tagPosts = getSortedPosts(
      posts.filter(({ data }) => slugifyAll(data.tags).includes(tag))
    );
    return paginate(tagPosts, {
      params: { tag },
      props: { tagName },
      pageSize: config.posts.perPage,
    });
  });
}

/**
 * URL of the same post in another locale, or `null` when no translation
 * exists. Translations are linked by a shared `translationKey`.
 */
export async function getTranslationUrl(
  post: CollectionEntry<"posts">,
  targetLocale: string
): Promise<string | null> {
  const key = post.data.translationKey;
  if (!key) return null;

  const match = (await getCollection("posts")).find(
    entry =>
      entry.id !== post.id &&
      entry.data.translationKey === key &&
      (entry.data.lang ?? config.site.lang) === targetLocale &&
      !entry.data.draft
  );

  return match ? getPostUrl(match.id, match.filePath, targetLocale) : null;
}

/**
 * A `pages` collection entry for the given locale, looked up by the last
 * segment of its id (so `about` matches both `about` and `_en/about`).
 */
export async function getLocalePage(name: string, locale: string) {
  const pages = filterByLocale(await getCollection("pages"), locale);
  return pages.find(entry => entry.id.split("/").pop() === name);
}
