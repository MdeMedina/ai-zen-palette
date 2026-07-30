import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, KeyRound, Loader2, Trash2, Upload, UserRound } from "lucide-react";
import { toast } from "sonner";
import { authApi, usersApi } from "@/lib/api";
import type { MyProfile } from "@/lib/api/users";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Extensiones que el backend sabe leer (Tika + texto plano). Es también el `accept` del input. */
const ACCEPT = ".pdf,.doc,.docx,.odt,.rtf,.txt,.md,.markdown";

const STATUS_LABEL: Record<string, string> = {
  Pending: "Vectorizando…",
  Embedded: "En pgvector",
  Error: "Falló la vectorización",
};

/**
 * Panel del operador, detrás de su nombre en el riel lateral. Dos cosas, y sólo dos:
 * cambiar la contraseña y mantener el "about me" que el agente lee en cada interacción.
 */
export function OperatorPanel({
  user,
  open,
  onClose,
}: {
  /** Sólo la identidad que se muestra en el encabezado — sirve igual para User o SessionUser. */
  user: { full_name?: string; email?: string; global_role?: string } | null;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[560px] gap-0 border-border bg-[var(--card)] p-0">
        {/* pr-14 deja libre la esquina del botón de cierre del propio diálogo. */}
        <DialogHeader className="border-b border-border px-6 py-4 pr-14 text-left">
          <DialogTitle className="flex items-center gap-2 text-[15px] text-foreground">
            <UserRound className="size-4 shrink-0 text-[var(--accent)]" strokeWidth={1.5} />
            <span className="truncate">{user?.full_name ?? "Operador"}</span>
          </DialogTitle>
          <DialogDescription className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">
            {user?.email}
            {user?.global_role ? ` · ${user.global_role}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-auto">
          <AboutMeSection />
          <PasswordSection />
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- about me ---------- */

function AboutMeSection() {
  const qc = useQueryClient();
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const profileQ = useQuery<MyProfile | null>({
    queryKey: ["me", "profile"],
    queryFn: usersApi.getMyProfile,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["me", "profile"] });

  const uploadM = useMutation({
    mutationFn: (file: File) => usersApi.uploadMyProfile(file),
    onSuccess: () => {
      invalidate();
      toast.success("About me guardado · el agente ya lo lee en cada interacción");
    },
    onError: (e: Error) => toast.error(e.message || "No se pudo guardar el about me"),
  });
  const deleteM = useMutation({
    mutationFn: usersApi.deleteMyProfile,
    onSuccess: () => {
      invalidate();
      toast.success("About me retirado · el agente deja de leerlo");
    },
    onError: (e: Error) => toast.error(e.message || "No se pudo retirar el about me"),
  });

  const profile = profileQ.data ?? null;
  const busy = uploadM.isPending || deleteM.isPending;

  /** Un solo archivo: el about me es un estado presente, no una carpeta de documentos. */
  const take = (files: FileList | null) => {
    const file = files?.[0];
    if (file) uploadM.mutate(file);
  };

  return (
    <section className="border-b border-border px-6 py-5">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/45">
        About me
      </h3>
      <p className="mt-2 text-[12px] leading-relaxed text-foreground/60">
        Un archivo sobre ti: quién eres, tus pasatiempos, a qué te dedicas dentro de la empresa y
        cómo te gustaría que se te trate. El agente lo lee en cada interacción.
      </p>

      <div
        onDragOver={(e) => {
          if (!e.dataTransfer.types.includes("Files") || busy) return;
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) setOver(false);
        }}
        onDrop={(e) => {
          if (!e.dataTransfer.types.includes("Files") || busy) return;
          e.preventDefault();
          setOver(false);
          take(e.dataTransfer.files);
        }}
        onClick={() => !busy && inputRef.current?.click()}
        className={`mt-3 grid cursor-pointer place-items-center rounded-[3px] border-2 border-dashed px-4 py-7 text-center transition-colors ${
          over
            ? "border-[var(--accent)] bg-[var(--accent)]/[0.06]"
            : "border-foreground/15 hover:border-[var(--accent)]/60"
        } ${busy ? "pointer-events-none opacity-50" : ""}`}
      >
        {uploadM.isPending ? (
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/70">
            <Loader2 className="size-3.5 animate-spin text-[var(--accent)]" strokeWidth={2} />
            Leyendo y vectorizando…
          </div>
        ) : (
          <>
            <Upload className="size-5 text-[var(--accent)]" strokeWidth={1.5} />
            <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/70">
              {profile ? "Suelta un archivo para reemplazarlo" : "Arrastra tu archivo aquí"}
            </div>
            <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-foreground/30">
              PDF · Word · ODT · RTF · TXT · MD
            </div>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        hidden
        onChange={(e) => {
          take(e.target.files);
          e.target.value = ""; // permite volver a elegir el mismo archivo
        }}
      />

      {profileQ.isLoading ? (
        <div className="mt-3 h-16 animate-pulse rounded-[3px] border border-border bg-foreground/[0.03]" />
      ) : profile ? (
        <div className="mt-3 border border-border bg-foreground/[0.02] p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <FileText className="size-4 shrink-0 text-foreground/45" strokeWidth={1.5} />
              <span
                className="truncate text-[12px] text-foreground"
                title={profile.source_file_name}
              >
                {profile.source_file_name}
              </span>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (window.confirm("¿Retirar tu about me? El agente dejará de leerlo."))
                  deleteM.mutate();
              }}
              className="shrink-0 text-foreground/30 transition-colors hover:text-destructive disabled:opacity-30"
              title="Retirar el about me"
            >
              {deleteM.isPending ? (
                <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
              ) : (
                <Trash2 className="size-3.5" strokeWidth={1.5} />
              )}
            </button>
          </div>
          <div className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-foreground/35">
            {STATUS_LABEL[profile.status] ?? profile.status} · {profile.char_count} caracteres
          </div>
          {/* El extracto es la prueba de que se leyó el archivo correcto y no una cáscara vacía. */}
          <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-[11px] leading-relaxed text-foreground/55 [overflow-wrap:anywhere]">
            {profile.excerpt}
          </p>
        </div>
      ) : null}
    </section>
  );
}

/* ---------- contraseña ---------- */

function PasswordSection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const changeM = useMutation({
    mutationFn: () => authApi.changePassword({ current_password: current, new_password: next }),
    onSuccess: () => {
      setCurrent("");
      setNext("");
      setConfirm("");
      toast.success("Contraseña actualizada");
    },
    onError: (e: Error) => toast.error(e.message || "No se pudo cambiar la contraseña"),
  });

  // La confirmación se valida aquí; el largo mínimo lo valida también el backend.
  const mismatch = confirm.length > 0 && next !== confirm;
  const ready = current.length > 0 && next.length >= 8 && next === confirm;

  return (
    <section className="px-6 py-5">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/45">
        Contraseña
      </h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (ready && !changeM.isPending) changeM.mutate();
        }}
        className="mt-3"
      >
        <PasswordField label="Actual" value={current} onChange={setCurrent} autoComplete="current-password" />
        <PasswordField
          label="Nueva (mínimo 8 caracteres)"
          value={next}
          onChange={setNext}
          autoComplete="new-password"
          className="mt-3"
        />
        <PasswordField
          label="Repetir la nueva"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          className="mt-3"
        />
        {mismatch ? (
          <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-destructive">
            Las dos claves nuevas no coinciden.
          </p>
        ) : null}

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={!ready || changeM.isPending}
            className="inline-flex items-center gap-2 border border-[var(--accent)] px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] disabled:opacity-30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {changeM.isPending ? (
              <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
            ) : (
              <KeyRound className="size-3.5" strokeWidth={1.5} />
            )}
            Cambiar contraseña
          </button>
        </div>
      </form>
    </section>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-foreground/45">
        {label}
      </span>
      <div className="mt-1 flex items-center gap-1 rounded-[3px] border border-border bg-foreground/[0.01] px-2 transition-colors focus-within:border-[var(--accent)]">
        <span className="select-none pr-1 font-mono text-[13px] text-foreground/30">[</span>
        <input
          type="password"
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 bg-transparent py-2 text-[13px] text-foreground outline-none"
        />
        <span className="select-none pl-1 font-mono text-[13px] text-foreground/30">]</span>
      </div>
    </label>
  );
}
