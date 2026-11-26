import React, { useEffect, useMemo, useState } from "react";

/* ------------------------------------------------------------------ icons */
const paths: Record<string, string> = {
  play: "M6 4.5v15l13-7.5z",
  pause: "M6 4h4v16H6zM14 4h4v16h-4z",
  undo: "M9 7H4V2M4.5 7A8 8 0 1 1 4 13",
  redo: "M15 7h5V2M19.5 7A8 8 0 1 0 20 13",
  reset: "M3 12a9 9 0 1 0 3-6.7M3 4v5h5",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  copy: "M8 8h11v11H8zM5 16H4V4h12v1",
  search: "M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14zM20 20l-4-4",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
  left: "M15 5l-7 7 7 7",
  right: "M9 5l7 7-7 7",
  loop: "M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3",
  doc: "M6 2h9l5 5v15H6zM14 2v6h6",
  step: "M5 5v14M9 12l10-7v14z",
  github: "M9 19c-4 1.5-4-2-6-2.5M15 21v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21",
};
export function Icon({ name, fill = false }: { name: keyof typeof paths | string; fill?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"} stroke={fill ? "none" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={paths[name] ?? ""} />
    </svg>
  );
}

/* ------------------------------------------------------------------ toast */
let pushToast: (s: string) => void = () => {};
export const toast = (s: string) => pushToast(s);
export function Toaster() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let t: number | undefined;
    pushToast = (s) => {
      setMsg(s);
      window.clearTimeout(t);
      t = window.setTimeout(() => setMsg(null), 1600);
    };
  }, []);
  return msg ? <div className="toast" role="status">{msg}</div> : null;
}
export async function copy(text: string, label = "Copied") {
  try {
    await navigator.clipboard.writeText(text);
    toast(label);
  } catch {
    toast("Clipboard blocked by the browser");
  }
}

/* ------------------------------------------------------------- highlighter */
const KW = /\b(import|from|export|const|let|return|function|type|interface|extends|new|default|as|if|else|true|false|null|undefined)\b/;
export function highlight(src: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\/\/[^\n]*|#[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(<\/?[A-Z][\w.]*|<\/?[a-z][\w-]*(?=[\s>/]))|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_]\w*\b)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(src))) {
    if (m.index > last) out.push(src.slice(last, m.index));
    const [tok, com, s, tag, n, word] = m;
    if (com && (com.startsWith("//") || /^#\s/.test(com) || com === "#")) out.push(<span key={i++} className="tok-c">{tok}</span>);
    else if (com) out.push(tok);
    else if (s) out.push(<span key={i++} className="tok-s">{tok}</span>);
    else if (tag) out.push(<span key={i++} className="tok-t">{tok}</span>);
    else if (n) out.push(<span key={i++} className="tok-n">{tok}</span>);
    else if (word && KW.test(word)) out.push(<span key={i++} className="tok-k">{tok}</span>);
    else out.push(tok);
    last = m.index + tok.length;
  }
  if (last < src.length) out.push(src.slice(last));
  return out;
}

export function CodeBlock({ tabs, initial = 0 }: { tabs: { label: string; code: string }[]; initial?: number }) {
  const [i, setI] = useState(initial);
  const cur = tabs[Math.min(i, tabs.length - 1)];
  const nodes = useMemo(() => highlight(cur.code), [cur.code]);
  return (
    <div className="code">
      <div className="code-head">
        {tabs.length > 1 ? (
          <div className="tabs" role="tablist">
            {tabs.map((t, k) => (
              <button key={t.label} role="tab" aria-selected={k === i} className={k === i ? "on" : ""} onClick={() => setI(k)}>
                {t.label}
              </button>
            ))}
          </div>
        ) : (
          <span className="mono faint">{cur.label}</span>
        )}
        <span className="spacer" />
        <button className="icon-btn" style={{ width: 28, height: 28 }} title="Copy" onClick={() => copy(cur.code)}>
          <Icon name="copy" />
        </button>
      </div>
      <pre>
        <code>{nodes}</code>
      </pre>
    </div>
  );
}
