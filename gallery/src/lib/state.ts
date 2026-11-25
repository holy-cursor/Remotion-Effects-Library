import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EffectMeta, PropSpec } from "../../../meta/schema";
import { STYLE_PRESETS, type StylePreset } from "../../../core/tokens";
import type { Values } from "../preview/bindings";
import { CATEGORIES, EFFECTS } from "../../../meta/effects";

/** Reading order used by the sidebar, j/k and prev/next (grouped by category). */
export const ORDER = CATEGORIES.flatMap((c) => EFFECTS.filter((m) => m.category === c.id));

/* ------------------------------------------------------------------ routing */
export type Route =
  | { page: "home" }
  | { page: "category"; id: string }
  | { page: "effect"; slug: string; state?: string }
  | { page: "all" };

export function parseHash(hash: string): Route {
  const h = hash.replace(/^#\/?/, "");
  const [path, query = ""] = h.split("?");
  const parts = path.split("/").filter(Boolean);
  const q = new URLSearchParams(query);
  if (parts[0] === "effects" && parts[1]) return { page: "effect", slug: parts[1], state: q.get("s") ?? undefined };
  if (parts[0] === "category" && parts[1]) return { page: "category", id: parts[1] };
  if (parts[0] === "effects") return { page: "all" };
  return { page: "home" };
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(location.hash));
  useEffect(() => {
    const on = () => setRoute(parseHash(location.hash));
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}

export const go = (hash: string) => {
  if (location.hash !== hash) location.hash = hash;
};

/* ------------------------------------------------------------ site theme */
export type SiteTheme = "light" | "dark";
export function useSiteTheme(): [SiteTheme, (t: SiteTheme) => void] {
  const [t, setT] = useState<SiteTheme>(() => {
    const saved = localStorage.getItem("fx-site-theme");
    if (saved === "light" || saved === "dark") return saved;
    return "dark";
  });
  useEffect(() => {
    document.documentElement.dataset.theme = t;
    localStorage.setItem("fx-site-theme", t);
  }, [t]);
  return [t, setT];
}

/* ------------------------------------------------------- customize values */
export const presetValues = (p: StylePreset): Values => ({
  palette: p.palette,
  theme: p.theme,
  fontFamily: p.fontFamily,
  grain: p.grain,
  speed: p.speed,
  delay: p.delay,
  accent: p.accent ?? "",
});

export function defaultsFor(meta: EffectMeta, theme: "light" | "dark"): Values {
  const v: Values = {
    ...presetValues(STYLE_PRESETS[0]),
    theme,
    background: "canvas",
    grid: true,
    scale: 1,
  };
  for (const [k, spec] of Object.entries(meta.props)) {
    if (spec.control === false || spec.kind === "node" || spec.kind === "json") continue;
    if (spec.default !== undefined) v[k] = spec.default;
  }
  return v;
}

/** Compact, URL-safe encoding of the values that differ from defaults. */
export function encodeState(values: Values, defaults: Values): string {
  const diff: Values = {};
  for (const [k, v] of Object.entries(values)) if (JSON.stringify(v) !== JSON.stringify(defaults[k])) diff[k] = v;
  if (!Object.keys(diff).length) return "";
  return btoa(unescape(encodeURIComponent(JSON.stringify(diff)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeState(s: string | undefined): Values {
  if (!s) return {};
  try {
    const json = decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));
    const v = JSON.parse(json);
    return v && typeof v === "object" ? (v as Values) : {};
  } catch {
    return {};
  }
}

/** Customize state with undo/redo. Writes the share state to the URL. */
export function useCustomize(meta: EffectMeta, siteTheme: "light" | "dark", initial?: string) {
  const defaults = useMemo(() => defaultsFor(meta, siteTheme), [meta, siteTheme]);
  const [values, setValues] = useState<Values>(() => ({ ...defaults, ...decodeState(initial) }));
  const past = useRef<Values[]>([]);
  const future = useRef<Values[]>([]);
  const [, bump] = useState(0);

  // Reset when the effect changes.
  const slugRef = useRef(meta.slug);
  useEffect(() => {
    if (slugRef.current !== meta.slug) {
      slugRef.current = meta.slug;
      past.current = [];
      future.current = [];
      setValues({ ...defaults, ...decodeState(initial) });
    }
  }, [meta.slug, defaults, initial]);

  // Follow the site theme unless the user picked one for the effect.
  const userTheme = useRef(false);
  useEffect(() => {
    if (!userTheme.current) setValues((v) => ({ ...v, theme: siteTheme }));
  }, [siteTheme]);

  const commit = useCallback((next: Values | ((v: Values) => Values)) => {
    setValues((prev) => {
      const n = typeof next === "function" ? next(prev) : next;
      past.current.push(prev);
      if (past.current.length > 100) past.current.shift();
      future.current = [];
      return n;
    });
    bump((x) => x + 1);
  }, []);

  const set = useCallback(
    (key: string, value: unknown) => {
      if (key === "theme") userTheme.current = true;
      commit((v) => ({ ...v, [key]: value }));
    },
    [commit],
  );

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    setValues((cur) => {
      future.current.push(cur);
      return prev;
    });
    bump((x) => x + 1);
  }, []);
  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    setValues((cur) => {
      past.current.push(cur);
      return next;
    });
    bump((x) => x + 1);
  }, []);
  const reset = useCallback(() => {
    userTheme.current = false;
    commit({ ...defaults });
  }, [commit, defaults]);
  const apply = useCallback((patch: Values) => commit((v) => ({ ...v, ...patch })), [commit]);

  useEffect(() => {
    const s = encodeState(values, defaults);
    const target = `#/effects/${meta.slug}${s ? "?s=" + s : ""}`;
    if (location.hash !== target) history.replaceState(null, "", target);
  }, [values, defaults, meta.slug]);

  return {
    values,
    defaults,
    set,
    apply,
    undo,
    redo,
    reset,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}

export const isControl = (s: PropSpec) => s.control !== false && s.kind !== "node" && s.kind !== "json";
