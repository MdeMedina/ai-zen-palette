import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { BrainCircuit, Hexagon, LibraryBig, ShieldCheck, LogOut, Sun, Moon } from "lucide-react";
import { useSessionStore, isAdmin } from "@/stores/session";
import { authApi } from "@/lib/api";
import { useState, type ReactNode } from "react";
import { oracleCopy } from "@/lib/i18n/oracle";

const NAV = [
  { to: "/oracle", label: "Oracle", icon: BrainCircuit, adminOnly: false },
  { to: "/hive", label: "Hive Matrix", icon: Hexagon, adminOnly: true },
  { to: "/knowledge", label: "Knowledge", icon: LibraryBig, adminOnly: true },
  { to: "/audit", label: "Audit", icon: ShieldCheck, adminOnly: true },
] as const;

function RailTooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="group relative flex">
      {children}
      <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 max-w-48 whitespace-normal break-words rounded-[3px] border border-border bg-[var(--popover)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/80 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
        {label}
      </span>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const user = useSessionStore((s) => s.user);
  const clear = useSessionStore((s) => s.clear);
  const language = useSessionStore((s) => s.chatLanguage);
  const theme = useSessionStore((s) => s.theme);
  const setTheme = useSessionStore((s) => s.setTheme);
  const navigate = useNavigate();
  const loc = useLocation();
  const admin = isAdmin(user);
  const t = oracleCopy(language);

  const [loggingOut, setLoggingOut] = useState(false);

  const onLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await authApi.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      clear();
      navigate({ to: "/login" });
    }
  };

  const initials = (user?.full_name ?? "··")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside className="sticky top-0 flex h-screen w-16 flex-col items-center border-r border-sidebar-border bg-sidebar py-5">
        <div aria-hidden className="mb-6 flex size-8 items-center justify-center">
          <span className="inline-block size-2.5 rounded-[2px] bg-[var(--accent)] glow-accent" />
        </div>
        <nav className="flex flex-1 flex-col items-center gap-1">
          {NAV.filter((n) => !n.adminOnly || admin).map((n) => {
            const Icon = n.icon;
            const active = loc.pathname.startsWith(n.to);
            const label =
              n.to === "/oracle" ? t.workspaceTitle :
              n.to === "/hive" ? t.userManagement :
              n.to === "/knowledge" ? t.knowledgeBases :
              n.to === "/audit" ? t.auditSpace :
              n.label;
            return (
              <RailTooltip key={n.to} label={label}>
                <Link
                  to={n.to}
                  aria-label={label}
                  className={[
                    "grid size-11 place-items-center rounded-[3px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring",
                    active
                      ? "bg-sidebar-foreground/10 text-[var(--accent)]"
                      : "text-sidebar-foreground/50 hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground",
                  ].join(" ")}
                >
                  <Icon className="size-4" strokeWidth={1.5} />
                </Link>
              </RailTooltip>
            );
          })}
        </nav>
        <div className="flex flex-col items-center gap-2 border-t border-sidebar-border pt-4">
          <RailTooltip label={theme === "dark" ? t.themeLight : t.themeDark}>
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="grid size-9 place-items-center rounded-[3px] text-sidebar-foreground/50 transition-colors hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? (
                <Sun className="size-4" strokeWidth={1.5} />
              ) : (
                <Moon className="size-4" strokeWidth={1.5} />
              )}
            </button>
          </RailTooltip>
          <RailTooltip label={`${user?.full_name ?? ""} · ${user?.global_role ?? ""}`}>
            <div className="grid size-9 place-items-center rounded-[3px] border border-sidebar-border font-mono text-[11px] text-[var(--accent)]">
              {initials}
            </div>
          </RailTooltip>
          <RailTooltip label="Logout">
            <button
              type="button"
              onClick={onLogout}
              className="grid size-9 place-items-center rounded-[3px] text-sidebar-foreground/50 transition-colors hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring"
              aria-label="Logout"
            >
              <LogOut className="size-4" strokeWidth={1.5} />
            </button>
          </RailTooltip>
        </div>
      </aside>
      <main className="flex min-h-screen flex-1 flex-col">{children}</main>
    </div>
  );
}
