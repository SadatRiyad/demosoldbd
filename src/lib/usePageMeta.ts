import * as React from "react";

function upsertMeta(name: string, content: string) {
  const head = document.head;
  let el = head.querySelector(`meta[name=\"${name}\"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function usePageMeta(opts: { title: string; description: string }) {
  React.useEffect(() => {
    document.title = opts.title;
    upsertMeta("description", opts.description);
  }, [opts.description, opts.title]);
}
