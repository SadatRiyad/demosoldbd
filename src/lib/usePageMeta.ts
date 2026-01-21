import * as React from "react";

function upsertMeta(name: string, content: string) {
  const head = document.head;
  let el = head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertProperty(property: string, content: string) {
  const head = document.head;
  let el = head.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  const head = document.head;
  let el = head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function usePageMeta(opts: {
  title: string;
  description: string;
  image?: string;
  canonicalUrl?: string;
}) {
  React.useEffect(() => {
    document.title = opts.title;
    upsertMeta("description", opts.description);

    upsertProperty("og:title", opts.title);
    upsertProperty("og:description", opts.description);
    upsertProperty("og:type", "website");
    upsertProperty("og:image", opts.image ?? "/og-soldbd.png");

    upsertMeta("twitter:card", "summary_large_image");
    upsertMeta("twitter:title", opts.title);
    upsertMeta("twitter:description", opts.description);
    upsertMeta("twitter:image", opts.image ?? "/og-soldbd.png");

    const canonical = opts.canonicalUrl ?? window.location.href;
    upsertProperty("og:url", canonical);
    upsertLink("canonical", canonical);
  }, [opts.canonicalUrl, opts.description, opts.image, opts.title]);
}
