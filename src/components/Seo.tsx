import { useEffect } from "react";
import {
  absoluteUrl,
  DEFAULT_IMAGE,
  DEFAULT_KEYWORDS,
  SITE_NAME,
} from "../lib/seo";
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

function setStructuredData(
  data: Record<string, unknown> | Array<Record<string, unknown>> | undefined,
) {
  // Remove every JSON-LD block we previously added (and the legacy one from index.html).
  document.head
    .querySelectorAll('script[type="application/ld+json"]')
    .forEach((node) => node.remove());

  if (!data) return;

  const items = Array.isArray(data) ? data : [data];

  items.forEach((item) => {
    const element = document.createElement("script");
    element.type = "application/ld+json";
    element.setAttribute("data-seo", "true");
    element.textContent = JSON.stringify(item);
    document.head.appendChild(element);
  });
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
    const robots = noindex
      ? "noindex, nofollow"
      : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

    document.documentElement.lang = "en";
    document.title = title;

    upsertMeta("name", "description", description);
    upsertMeta("name", "keywords", keywords);
    upsertMeta("name", "robots", robots);
    upsertMeta("name", "author", SITE_NAME);
    upsertMeta("name", "application-name", SITE_NAME);
    upsertMeta("name", "apple-mobile-web-app-title", SITE_NAME);

    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("property", "og:image", imageUrl);
    upsertMeta("property", "og:image:alt", `${SITE_NAME} - ${title}`);
    upsertMeta("property", "og:locale", "en_US");

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", imageUrl);
    upsertMeta("name", "twitter:image:alt", `${SITE_NAME} - ${title}`);

    upsertLink("canonical", canonicalUrl);

    if (!noindex) {
      setStructuredData(structuredData);
    } else {
      setStructuredData(undefined);
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
