import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { BrainCircuit, Hexagon, LibraryBig, ShieldCheck, LogOut } from "lucide-react";
import { useSessionStore, isAdmin } from "@/stores/session";
import { authApi } from "@/lib/api";
import { BrandLogo } from "./Logo";
import type { ReactNode } from "react";

const NAV = [
  { to: "/oracle", label: "Oracle", icon: BrainCircuit, adminOnly: false },
  { to: "/hive", label: "Hive Matrix", icon: Hexagon, adminOnly: true },
  { to: "/knowledge", label: "Knowledge", icon: LibraryBig, adminOnly: true },
  { to: "/audit", label: "Audit", icon: ShieldCheck, adminOnly: true },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const user = useSessionStore((s) => s.user);
  const clear = useSessionStore((s) => s.clear);
  const navigate = useNavigate();
  const loc = useLocation();
  const admin = isAdmin(user);

  const onLogout = async () => {
    await authApi.logout();
    clear();
    navigate({ to: "/login" });
  };

  const initials = (user?.full_name ?? "··")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside className="sticky top-0 flex h-screen w-[220px] flex-col border-r border-foreground/5 bg-[var(--sidebar)]">
        <div className="px-5 py-6">
          <BrandLogo />
        </div>
        <nav className="mt-2 flex flex-1 flex-col gap-0.5 px-2">
          {NAV.filter((n) => !n.adminOnly || admin).map((n) => {
            const Icon = n.icon;
            const active = loc.pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={[
                  "flex items-center gap-3 rounded-[3px] px-3 py-2 text-[13px] tracking-wide transition-colors",
                  active
                    ? "bg-foreground/5 text-foreground"
                    : "text-foreground/55 hover:bg-foreground/[0.03] hover:text-foreground",
                ].join(" ")}
              >
                <Icon
                  className={`size-4 ${active ? "text-[var(--accent)]" : ""}`}
                  strokeWidth={1.5}
                />
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-foreground/5 px-3 py-4">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="grid size-8 place-items-center rounded-[3px] border border-foreground/10 font-mono text-[11px] text-[var(--accent)]">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] text-foreground">{user?.full_name}</div>
              <div className="truncate text-[10px] uppercase tracking-[0.22em] text-foreground/40">
                {user?.global_role}
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-[3px] p-1.5 text-foreground/40 transition-colors hover:bg-foreground/5 hover:text-foreground"
              aria-label="Logout"
            >
              <LogOut className="size-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </aside>
      <main className="flex min-h-screen flex-1 flex-col">{children}</main>
    </div>
  );
}