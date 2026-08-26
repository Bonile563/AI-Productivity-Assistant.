import { useChat } from "@ai-sdk/react";
import { createFileRoute } from "@tanstack/react-router";
import { DefaultChatTransport } from "ai";
import {
  ArrowUp,
  Check,
  Copy,
  RefreshCw,
  Sparkles,
  Square,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WORKFLOWS, getWorkflow, type WorkflowId } from "@/lib/workflows";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cadence — AI Assistant for Automating Workplace Tasks" },
      {
        name: "description",
        content:
          "Cadence turns meeting notes into action items, drafts email replies, summarizes documents and builds project plans — an AI assistant for everyday work.",
      },
      {
        property: "og:title",
        content: "Cadence — AI Assistant for Automating Workplace Tasks",
      },
      {
        property: "og:description",
        content:
          "Draft messages, extract action items, summarize documents and plan projects with one AI workspace assistant.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const [workflow, setWorkflow] = useState<WorkflowId>("assistant");
  const active = getWorkflow(workflow);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages, body }) => ({
          body: { ...body, messages, workflow },
        }),
      }),
    [workflow],
  );

  const { messages, sendMessage, status, stop, setMessages, regenerate } = useChat({
    transport,
    onError: (error) => toast.error(error.message || "Something went wrong"),
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const send = (text: string) => {
    const value = text.trim();
    if (!value || busy) return;
    setInput("");
    void sendMessage({ text: value });
  };

  const switchWorkflow = (id: WorkflowId) => {
    setWorkflow(id);
    setMessages([]);
    inputRef.current?.focus();
  };

  return (
    <div className="grid-canvas min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1400px] flex-col px-4 lg:px-8">
        <Header onReset={() => setMessages([])} hasMessages={messages.length > 0} />

        <main className="grid flex-1 gap-6 pb-6 lg:grid-cols-[280px_1fr]">
          <WorkflowRail activeId={workflow} onSelect={switchWorkflow} />

          <section className="flex min-h-[70vh] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-panel">
            <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3.5">
              <div>
                <h2 className="text-sm font-semibold">{active.label}</h2>
                <p className="text-xs text-muted-foreground">{active.blurb}</p>
              </div>
              <span className="hidden items-center gap-1.5 rounded-full border border-border bg-surface-raised px-2.5 py-1 text-[11px] text-muted-foreground sm:flex">
                <span
                  className={cn(
                    "size-1.5 rounded-full bg-signal",
                    busy && "animate-thinking-dot",
                  )}
                />
                {busy ? "Working" : "Ready"}
              </span>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto">
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-6">
                {messages.length === 0 ? (
                  <EmptyState
                    starters={active.starters}
                    onPick={send}
                    label={active.label}
                  />
                ) : (
                  messages.map((message, index) => (
                    <MessageBubble
                      key={message.id}
                      role={message.role}
                      text={textOf(message)}
                      streaming={
                        busy &&
                        index === messages.length - 1 &&
                        message.role === "assistant"
                      }
                      onRetry={
                        !busy &&
                        index === messages.length - 1 &&
                        message.role === "assistant"
                          ? () => void regenerate()
                          : undefined
                      }
                    />
                  ))
                )}
                {status === "submitted" && <ThinkingRow />}
              </div>
            </div>

            <Composer
              value={input}
              onChange={setInput}
              onSubmit={() => send(input)}
              onStop={stop}
              busy={busy}
              placeholder={active.placeholder}
              inputRef={inputRef}
            />
          </section>
        </main>
      </div>
    </div>
  );
}

function Header({
  onReset,
  hasMessages,
}: {
  onReset: () => void;
  hasMessages: boolean;
}) {
  return (
    <header className="flex items-center justify-between gap-4 py-6">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-signal text-signal-foreground">
          <Zap className="size-4.5" strokeWidth={2.5} />
        </span>
        <div>
          <h1 className="font-display text-lg font-semibold tracking-tight">
            Cadence
          </h1>
          <p className="text-xs text-muted-foreground">
            AI assistant for everyday work
          </p>
        </div>
      </div>
      {hasMessages && (
        <Button variant="ghost" size="sm" onClick={onReset} className="gap-2">
          <RefreshCw className="size-3.5" />
          New task
        </Button>
      )}
    </header>
  );
}

function WorkflowRail({
  activeId,
  onSelect,
}: {
  activeId: WorkflowId;
  onSelect: (id: WorkflowId) => void;
}) {
  return (
    <aside className="lg:sticky lg:top-6 lg:self-start">
      <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Workflows
      </p>
      <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
        {WORKFLOWS.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={cn(
                "min-w-[190px] shrink-0 rounded-xl border px-3.5 py-3 text-left transition-colors lg:min-w-0",
                isActive
                  ? "border-signal/40 bg-surface-raised shadow-glow"
                  : "border-border bg-surface hover:bg-surface-raised",
              )}
            >
              <span
                className={cn(
                  "block text-sm font-medium",
                  isActive ? "text-signal" : "text-foreground",
                )}
              >
                {item.label}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {item.blurb}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function EmptyState({
  starters,
  onPick,
  label,
}: {
  starters: string[];
  onPick: (text: string) => void;
  label: string;
}) {
  return (
    <div className="flex flex-col items-start gap-5 py-10">
      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-raised px-3 py-1 text-xs text-muted-foreground">
        <Sparkles className="size-3.5 text-signal" />
        {label}
      </span>
      <h2 className="text-gradient-signal max-w-xl text-3xl font-semibold leading-tight sm:text-4xl">
        Hand off the busywork. Keep the judgment.
      </h2>
      <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
        Paste raw notes, threads or half-formed ideas. Cadence returns finished work —
        drafts, action items with owners, summaries and plans you can send as-is.
      </p>
      <div className="flex w-full flex-col gap-2 pt-2">
        {starters.map((starter) => (
          <button
            key={starter}
            type="button"
            onClick={() => onPick(starter)}
            className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-raised/60 px-4 py-3 text-left text-sm transition-colors hover:border-signal/40 hover:bg-surface-raised"
          >
            <span>{starter}</span>
            <ArrowUp className="size-4 shrink-0 rotate-45 text-muted-foreground transition-colors group-hover:text-signal" />
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  role,
  text,
  streaming,
  onRetry,
}: {
  role: string;
  text: string;
  streaming?: boolean;
  onRetry?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm border border-border bg-surface-raised px-4 py-3 text-sm leading-relaxed">
          {text}
        </div>
      </div>
    );
  }

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="group flex gap-3">
      <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-lg bg-signal/15 text-signal">
        <Zap className="size-3.5" strokeWidth={2.5} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="prose-answer text-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
          {streaming && (
            <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 bg-signal" />
          )}
        </div>
        {!streaming && text.length > 0 && (
          <div className="mt-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2" onClick={copy}>
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              <span className="text-xs">Copy</span>
            </Button>
            {onRetry && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 px-2"
                onClick={onRetry}
              >
                <RefreshCw className="size-3.5" />
                <span className="text-xs">Redo</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ThinkingRow() {
  return (
    <div className="flex items-center gap-2 pl-10 text-xs text-muted-foreground">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="animate-thinking-dot size-1.5 rounded-full bg-signal"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
      <span className="ml-1">Working on it</span>
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  busy,
  placeholder,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  busy: boolean;
  placeholder: string;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  return (
    <div className="border-t border-border bg-surface px-5 py-4">
      <form
        className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl border border-border bg-surface-raised p-2 focus-within:border-signal/40"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <textarea
          ref={inputRef}
          rows={1}
          value={value}
          placeholder={placeholder}
          onChange={(event) => {
            onChange(event.target.value);
            const el = event.target;
            el.style.height = "auto";
            el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSubmit();
            }
          }}
          className="max-h-[220px] min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
        />
        {busy ? (
          <Button type="button" size="icon" variant="secondary" onClick={onStop}>
            <Square className="size-3.5 fill-current" />
            <span className="sr-only">Stop</span>
          </Button>
        ) : (
          <Button type="submit" size="icon" disabled={!value.trim()}>
            <ArrowUp className="size-4" />
            <span className="sr-only">Send</span>
          </Button>
        )}
      </form>
      <p className="mx-auto mt-2 max-w-3xl text-[11px] text-muted-foreground">
        Enter to send · Shift + Enter for a new line · Review AI output before sending it
        onward.
      </p>
    </div>
  );
}

function textOf(message: { parts?: Array<{ type: string; text?: string }> }) {
  return (message.parts ?? [])
    .map((part) => (part.type === "text" ? (part.text ?? "") : ""))
    .join("");
}
