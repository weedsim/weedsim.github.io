import { ogImagePaths } from "@/utils/localeRoutes";

export { GET } from "@/utils/postOgImage";

export async function getStaticPaths() {
  return ogImagePaths("en");
}
