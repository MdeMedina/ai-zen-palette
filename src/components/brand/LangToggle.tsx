import { useSessionStore, type ChatLanguage } from "@/stores/session";

const LANGS: ChatLanguage[] = ["en", "es"];

export function LangToggle() {
  const lang = useSessionStore((s) => s.chatLanguage);
  const setLanguage = useSessionStore((s) => s.setLanguage);
  return (
    <div className="inline-flex items-center gap-0.5 rounded-[3px] border border-border p-0.5 text-[10px] uppercase tracking-[0.22em]">
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLanguage(l)}
          className={[
            "px-2 py-1 transition-colors",
            l === lang
              ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
              : "text-foreground/60 hover:text-foreground",
          ].join(" ")}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
