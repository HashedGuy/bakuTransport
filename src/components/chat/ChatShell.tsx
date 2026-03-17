"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CkanResponse, OpendataPackageShowResult } from "@/lib/opendata";

type PackageShowApiResponse =
  | {
      ok: true;
      datasetId: string;
      data: CkanResponse<OpendataPackageShowResult>;
    }
  | { ok: false; error: string; datasetId?: string };

type Role = "user" | "assistant";

type Message =
  | { id: string; role: Role; kind: "text"; text: string }
  | {
      id: string;
      role: "assistant";
      kind: "source";
      datasetId: string;
      pkg?: OpendataPackageShowResult;
      csvPreview?: string;
      error?: string;
    };

function formatDateTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

function humanBytes(bytes?: number) {
  if (bytes == null || !Number.isFinite(bytes)) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  const v = i === 0 ? `${Math.round(n)}` : `${n.toFixed(1)}`;
  return `${v} ${units[i]}`;
}

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

function Icon({ name, className }: { name: "spark" | "db" | "send" | "plus"; className?: string }) {
  const common = { className: cx("shrink-0", className), "aria-hidden": true as const };
  switch (name) {
    case "spark":
      return (
        <svg {...common} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2l1.2 4.2a6 6 0 0 0 4.1 4.1L21.5 12l-4.2 1.2a6 6 0 0 0-4.1 4.1L12 21.5l-1.2-4.2a6 6 0 0 0-4.1-4.1L2.5 12l4.2-1.7a6 6 0 0 0 4.1-4.1L12 2Z"
            className="stroke-current"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "db":
      return (
        <svg {...common} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3c4.4 0 8 1.6 8 3.5S16.4 10 12 10 4 8.4 4 6.5 7.6 3 12 3Z"
            className="stroke-current"
            strokeWidth="1.5"
          />
          <path d="M4 6.5V17.5C4 19.4 7.6 21 12 21s8-1.6 8-3.5V6.5" className="stroke-current" strokeWidth="1.5" />
          <path d="M4 11c0 1.9 3.6 3.5 8 3.5s8-1.6 8-3.5" className="stroke-current" strokeWidth="1.5" />
          <path d="M4 15.2c0 1.9 3.6 3.5 8 3.5s8-1.6 8-3.5" className="stroke-current" strokeWidth="1.5" />
        </svg>
      );
    case "send":
      return (
        <svg {...common} viewBox="0 0 24 24" fill="none">
          <path
            d="M4 12l16-8-6.2 17-2.7-7L4 12Z"
            className="stroke-current"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M10.9 14L20 4" className="stroke-current" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common} viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
  }
}

function SourceCard({
  datasetId,
  pkg,
  csvPreview,
  error,
}: {
  datasetId: string;
  pkg?: OpendataPackageShowResult;
  csvPreview?: string;
  error?: string;
}) {
  const res0 = pkg?.resources?.[0];
  const title = pkg?.title_translated?.en || pkg?.title || datasetId;
  const org = pkg?.organization?.title || pkg?.author || "Open Data Azerbaijan";

  return (
    <div className="rounded-2xl border border-black/10 bg-white/70 p-4 shadow-[0_10px_50px_-35px_rgba(0,0,0,0.45)] backdrop-blur dark:border-white/10 dark:bg-white/5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-black/5 text-zinc-900 dark:bg-white/10 dark:text-zinc-50">
          <Icon name="db" className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">{title}</div>
              <div className="truncate text-xs text-zinc-600 dark:text-zinc-400">{org}</div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="rounded-full border border-black/10 bg-black/2 px-2 py-1 text-[11px] font-medium text-zinc-700 dark:border-white/10 dark:bg-white/6 dark:text-zinc-300">
                {res0?.format || "DATA"}
              </span>
              <a
                href={res0?.url || "#"}
                target="_blank"
                rel="noreferrer"
                className={cx(
                  "rounded-full px-2 py-1 text-[11px] font-medium",
                  res0?.url
                    ? "text-zinc-900 hover:bg-black/5 dark:text-zinc-100 dark:hover:bg-white/10"
                    : "cursor-not-allowed text-zinc-400",
                )}
              >
                Download
              </a>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-zinc-600 dark:text-zinc-400 sm:grid-cols-4">
            <div className="rounded-xl bg-black/2 px-3 py-2 dark:bg-white/6">
              <div className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Dataset</div>
              <div className="truncate font-medium text-zinc-800 dark:text-zinc-200">{datasetId}</div>
            </div>
            <div className="rounded-xl bg-black/2 px-3 py-2 dark:bg-white/6">
              <div className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Updated</div>
              <div className="font-medium text-zinc-800 dark:text-zinc-200">{formatDateTime(res0?.last_modified || pkg?.metadata_modified)}</div>
            </div>
            <div className="rounded-xl bg-black/2 px-3 py-2 dark:bg-white/6">
              <div className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Size</div>
              <div className="font-medium text-zinc-800 dark:text-zinc-200">{humanBytes(res0?.size)}</div>
            </div>
            <div className="rounded-xl bg-black/2 px-3 py-2 dark:bg-white/6">
              <div className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">License</div>
              <div className="truncate font-medium text-zinc-800 dark:text-zinc-200">{pkg?.license_title || "—"}</div>
            </div>
          </div>

          {error ? (
            <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-700 dark:text-red-300">
              {error}
            </div>
          ) : null}

          {csvPreview ? (
            <div className="mt-3 overflow-hidden rounded-xl border border-black/10 bg-black/2 dark:border-white/10 dark:bg-white/6">
              <div className="flex items-center justify-between px-3 py-2">
                <div className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">CSV preview</div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">first lines</div>
              </div>
              <pre className="max-h-52 overflow-auto px-3 pb-3 text-[11px] leading-4 text-zinc-800 dark:text-zinc-200">
{csvPreview}
              </pre>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  if (msg.kind === "source") {
    return (
      <div className="max-w-[860px]">
        <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <Icon name="spark" className="h-4 w-4" />
          Connected source
        </div>
        <SourceCard datasetId={msg.datasetId} pkg={msg.pkg} csvPreview={msg.csvPreview} error={msg.error} />
      </div>
    );
  }

  const isUser = msg.role === "user";
  return (
    <div className={cx("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cx(
          "max-w-[860px] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 shadow-[0_10px_50px_-40px_rgba(0,0,0,0.6)]",
          isUser
            ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
            : "border border-black/10 bg-white/70 text-zinc-900 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-zinc-100",
        )}
      >
        {msg.text}
      </div>
    </div>
  );
}

function Sidebar({
  title,
  sourcesCount,
  onNewChat,
}: {
  title: string;
  sourcesCount: number;
  onNewChat: () => void;
}) {
  return (
    <aside className="hidden w-[320px] shrink-0 border-r border-black/10 bg-black/2 p-4 dark:border-white/10 dark:bg-white/3 lg:block">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{title}</div>
        <button
          onClick={onNewChat}
          className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-medium text-zinc-900 hover:bg-black/3 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-white/10"
        >
          <Icon name="plus" className="h-4 w-4" />
          New chat
        </button>
      </div>

      <div className="mt-5 rounded-2xl border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
          <Icon name="db" className="h-4 w-4" />
          Connected sources
        </div>
        <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">{sourcesCount} source(s) available in this chat</div>
      </div>

      <div className="mt-5">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Chats</div>
        <div className="space-y-2">
          <button className="w-full rounded-2xl border border-black/10 bg-white/70 px-3 py-3 text-left text-sm font-medium text-zinc-900 hover:bg-black/3 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-white/10">
            Passenger turnover · CKAN
            <div className="mt-1 text-xs font-normal text-zinc-600 dark:text-zinc-400">Open Data Azerbaijan</div>
          </button>
        </div>
      </div>
    </aside>
  );
}

export default function ChatShell({ datasetId }: { datasetId: string }) {
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: "m0",
      role: "assistant",
      kind: "text",
      text:
        "Welcome to Baku Transport OS.\n\nI can connect to open datasets, summarize them, and help you explore trends. I’ve connected the first open source dataset below.",
    },
    { id: "m1", role: "assistant", kind: "source", datasetId },
  ]);

  const [input, setInput] = useState("");
  const [loadingSource, setLoadingSource] = useState(true);
  const endRef = useRef<HTMLDivElement | null>(null);

  const sourceMessageIndex = useMemo(
    () => messages.findIndex((m) => m.kind === "source" && m.datasetId === datasetId),
    [messages, datasetId],
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadingSource(true);
      try {
        const pkgRes = await fetch(`/api/opendata/package_show?id=${encodeURIComponent(datasetId)}`);
        const pkgJson = (await pkgRes.json()) as PackageShowApiResponse;

        if (!pkgRes.ok || !pkgJson.ok) {
          const error = "error" in pkgJson ? pkgJson.error : `Request failed (${pkgRes.status})`;
          if (cancelled) return;
          setMessages((prev) => {
            const next = [...prev];
            const i = next.findIndex((m) => m.kind === "source" && m.datasetId === datasetId);
            if (i >= 0) next[i] = { ...next[i], error } as Message;
            return next;
          });
          return;
        }

        const pkg = pkgJson.data.result;
        const res0 = pkg.resources?.[0];
        let csvPreview: string | undefined;

        if (res0?.url) {
          const previewRes = await fetch(
            `/api/opendata/csv_preview?lines=30&url=${encodeURIComponent(res0.url)}`,
          );
          if (previewRes.ok) {
            csvPreview = await previewRes.text();
          }
        }

        if (cancelled) return;
        setMessages((prev) => {
          const next = [...prev];
          const i = next.findIndex((m) => m.kind === "source" && m.datasetId === datasetId);
          if (i >= 0) next[i] = { ...next[i], pkg, csvPreview } as Message;
          return next;
        });
      } catch (e) {
        if (cancelled) return;
        setMessages((prev) => {
          const next = [...prev];
          const i = next.findIndex((m) => m.kind === "source" && m.datasetId === datasetId);
          if (i >= 0)
            next[i] = {
              ...next[i],
              error: e instanceof Error ? e.message : "Unknown error",
            } as Message;
          return next;
        });
      } finally {
        if (!cancelled) setLoadingSource(false);
      }
    }

    if (sourceMessageIndex >= 0 && (messages[sourceMessageIndex] as any).pkg == null) {
      void load();
    } else {
      setLoadingSource(false);
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetId]);

  function onNewChat() {
    setMessages([
      {
        id: "m0",
        role: "assistant",
        kind: "text",
        text:
          "New chat started.\n\nAsk me to connect another dataset, or tell me what you want to learn about Baku transport.",
      },
      { id: "m1", role: "assistant", kind: "source", datasetId },
    ]);
    setInput("");
  }

  function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: `u-${crypto.randomUUID()}`, role: "user", kind: "text", text },
      {
        id: `a-${crypto.randomUUID()}`,
        role: "assistant",
        kind: "text",
        text:
          "UI stub: chat responses aren’t implemented yet.\n\nNext step: add a backend route to answer using tools + connected datasets, then stream replies into this thread.",
      },
    ]);
  }

  const sourcesCount = messages.filter((m) => m.kind === "source").length;

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_800px_at_30%_-10%,rgba(0,0,0,0.06),transparent_55%),radial-gradient(900px_700px_at_110%_10%,rgba(0,0,0,0.05),transparent_55%)] dark:bg-[radial-gradient(1200px_800px_at_30%_-10%,rgba(255,255,255,0.10),transparent_55%),radial-gradient(900px_700px_at_110%_10%,rgba(255,255,255,0.07),transparent_55%)]">
      <div className="mx-auto flex min-h-screen max-w-[1280px]">
        <Sidebar title="Baku Transport OS" sourcesCount={sourcesCount} onNewChat={onNewChat} />

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-black/10 bg-white/60 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-black/20 lg:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                  Passenger turnover · Baku transport
                </div>
                <div className="truncate text-xs text-zinc-600 dark:text-zinc-400">
                  Connected to Open Data Azerbaijan CKAN (`package_show`)
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <span
                  className={cx(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1",
                    loadingSource
                      ? "border-black/10 bg-black/2 dark:border-white/10 dark:bg-white/6"
                      : "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                  {loadingSource ? "Connecting…" : "Connected"}
                </span>
              </div>
            </div>
          </header>

          <section className="min-w-0 flex-1 px-4 py-6 lg:px-6">
            <div className="space-y-4">
              {messages.map((m) => (
                <MessageBubble key={m.id} msg={m} />
              ))}
              <div ref={endRef} />
            </div>
          </section>

          <footer className="sticky bottom-0 border-t border-black/10 bg-white/70 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-black/20 lg:px-6">
            <div className="mx-auto max-w-[920px]">
              <div className="rounded-2xl border border-black/10 bg-white/80 p-2 shadow-[0_10px_50px_-35px_rgba(0,0,0,0.35)] backdrop-blur dark:border-white/10 dark:bg-white/5">
                <div className="flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    rows={1}
                    placeholder="Ask about passenger turnover, trends, or data quality…"
                    className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-500 dark:text-zinc-50 dark:placeholder:text-zinc-400"
                  />
                  <button
                    onClick={send}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-zinc-50 hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    disabled={!input.trim()}
                    aria-label="Send message"
                  >
                    <Icon name="send" className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 px-3 pb-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="rounded-full border border-black/10 bg-black/2 px-2 py-1 dark:border-white/10 dark:bg-white/6">
                    Tip: Press Enter to send, Shift+Enter for a newline
                  </span>
                  <a
                    className="rounded-full border border-black/10 bg-black/2 px-2 py-1 hover:bg-black/4 dark:border-white/10 dark:bg-white/6 dark:hover:bg-white/10"
                    href="https://admin.opendata.az/api/3/action/package_show?id=neqliyyat-sektorunda-sernisin-dovriyyesi-milyon-sernisin-km"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Dataset API
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

