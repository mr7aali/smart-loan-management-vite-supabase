import { useEffect } from "react";
import { absoluteUrl, DEFAULT_IMAGE, DEFAULT_KEYWORDS, SITE_NAME } from "../lib/seo";
import type { SeoConfig } from "../lib/seo";

function upsertMeta(
  attribute: "name" | "property",
  key: string,
  content: string,
) {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${key}"]`,
  );

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(
    `link[rel="${rel}"]`,
  );

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }

  element.setAttribute("href", href);
}

function upsertJsonLd(data: Record<string, unknown>) {
  const id = "structured-data";
  let element = document.head.querySelector<HTMLScriptElement>(`#${id}`);

  if (!element) {
    element = document.createElement("script");
    element.id = id;
    element.type = "application/ld+json";
    document.head.appendChild(element);
  }

  element.textContent = JSON.stringify(data);
}

export default function Seo({
  title,
  description,
  path = "/",
  keywords = DEFAULT_KEYWORDS,
  image = DEFAULT_IMAGE,
  type = "website",
  noindex = false,
  structuredData,
}: SeoConfig) {
  useEffect(() => {
    const canonicalUrl = absoluteUrl(path);
    const imageUrl = absoluteUrl(image);
    const robots = noindex ? "noindex, nofollow" : "index, follow";

    document.documentElement.lang = "en";
    document.title = title;

    upsertMeta("name", "description", description);
    upsertMeta("name", "keywords", keywords);
    upsertMeta("name", "robots", robots);
    upsertMeta("name", "author", SITE_NAME);

    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("property", "og:image", imageUrl);

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", imageUrl);

    upsertLink("canonical", canonicalUrl);

    if (structuredData && !noindex) {
      upsertJsonLd(structuredData);
    } else {
      document.head.querySelector("#structured-data")?.remove();
    }
  }, [
    description,
    image,
    keywords,
    noindex,
    path,
    structuredData,
    title,
    type,
  ]);

  return null;
}
