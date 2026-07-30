import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  File as FileIcon,
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderPlus,
  History,
  Loader2,
  Pencil,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { brandsApi, driveApi } from "@/lib/api";
import type {
  Brand,
  DriveFile,
  DriveFileVersion,
  DriveFolder,
  DriveTree,
  DriveTreeFile,
  DriveTreeFolder,
  UUID,
} from "@/lib/api/types";
import { PageHeader } from "@/components/brand/PageHeader";
import { useSessionStore } from "@/stores/session";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/drive/$")({
  head: () => {
    const lang = useSessionStore.getState().chatLanguage;
    return { meta: [{ title: lang === "es" ? "PKGD OS · Drive" : "PKGD OS · Drive" }] };
  },
  component: DrivePage,
});

/** Internal drag payload MIME — lets us tell "moving an item" apart from "dropping OS files". */
const DND_MIME = "application/x-pkgd-drive";
type DragItem = { kind: "folder" | "file"; id: UUID; name: string };

/** True when the drag comes from the OS file picker (upload) rather than from a Drive card. */
const isExternalFileDrag = (dt: DataTransfer) =>
  dt.types.includes("Files") && !dt.types.includes(DND_MIME);

/* ---------- splat helpers (splat = folder path, e.g. "Marketing/Campañas") ---------- */
const parseSegments = (splat: string | undefined): string[] =>
  (splat ?? "")
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);

/** Walk the nested tree to the folder addressed by `segments`. Returns root when empty. */
function resolveFolder(
  tree: DriveTree,
  segments: string[],
): {
  id: UUID | null;
  brand_id: UUID | null;
  brand_name: string | null;
  folders: DriveTreeFolder[];
  files: DriveTreeFile[];
} | null {
  let folders = tree.tree.folders;
  let files = tree.tree.files;
  let id: UUID | null = null;
  let brand_id: UUID | null = null;
  let brand_name: string | null = null;
  for (const seg of segments) {
    const next = folders.find((f) => f.name === seg);
    if (!next) return null; // stale path
    id = next.id;
    brand_id = next.brand_id;
    brand_name = next.brand_name;
    folders = next.folders;
    files = next.files;
  }
  return { id, brand_id, brand_name, folders, files };
}

function DrivePage() {
  const { _splat } = Route.useParams();
  const segments = parseSegments(_splat);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const treeQ = useQuery<DriveTree>({ queryKey: ["drive"], queryFn: driveApi.getTree });
  const brandsQ = useQuery({ queryKey: ["brands"], queryFn: brandsApi.listBrands });

  const current = useMemo(
    () => (treeQ.data ? resolveFolder(treeQ.data, segments) : null),
    [treeQ.data, segments],
  );
  const currentFolderId = current?.id ?? null;
  const invalidate = () => qc.invalidateQueries({ queryKey: ["drive"] });
  const goTo = (segs: string[]) =>
    navigate({ to: "/drive/$", params: { _splat: segs.join("/") } });

  // ---- mutations ----
  const createFolderM = useMutation({
    mutationFn: (input: { name: string; brand_id?: string | null }) =>
      driveApi.createFolder({ name: input.name, parent_id: currentFolderId, brand_id: input.brand_id }),
    onSuccess: () => {
      invalidate();
      toast.success("Carpeta creada");
    },
    onError: (e: Error) => toast.error(e.message || "No se pudo crear la carpeta"),
  });
  const uploadM = useMutation({
    mutationFn: (file: File) => driveApi.uploadFile({ file, folder_id: currentFolderId }),
    onSuccess: (f) => {
      invalidate();
      toast.success(`"${f.name}" subido · vectorizando en segundo plano`);
    },
    onError: (e: Error) => toast.error(e.message || "Falló la subida"),
  });
  const updateFolderM = useMutation({
    mutationFn: (v: { id: UUID; name?: string; brand_id?: string | null }) =>
      driveApi.updateFolder(v.id, { name: v.name, brand_id: v.brand_id }),
    onSuccess: () => {
      invalidate();
      toast.success("Carpeta actualizada");
    },
    onError: (e: Error) => toast.error(e.message || "No se pudo actualizar la carpeta"),
  });
  const deleteFolderM = useMutation({
    mutationFn: (id: UUID) => driveApi.deleteFolder(id),
    onSuccess: () => {
      invalidate();
      toast.success("Carpeta eliminada");
    },
    onError: () => toast.error("No se pudo eliminar la carpeta"),
  });
  const deleteFileM = useMutation({
    mutationFn: (id: UUID) => driveApi.deleteFile(id),
    onSuccess: () => {
      invalidate();
      toast.success("Archivo eliminado");
    },
    onError: () => toast.error("No se pudo eliminar el archivo"),
  });

  // Moving an item re-brands it: the backend makes it adopt the destination folder's related
  // brand (PKGD at root), cascading to whatever inherited the old brand.
  const brandNameOf = (id: string | null | undefined) =>
    (brandsQ.data ?? []).find((b) => b.id === id)?.name ?? null;
  const moveM = useMutation<
    DriveFile | DriveFolder,
    Error,
    { item: DragItem; targetId: UUID | null; targetLabel: string }
  >({
    mutationFn: (v) =>
      v.item.kind === "file"
        ? driveApi.updateFile(v.item.id, { folder_id: v.targetId })
        : driveApi.updateFolder(v.item.id, { parent_id: v.targetId }),
    onSuccess: (moved, v) => {
      invalidate();
      const brand = brandNameOf(moved?.brand_id);
      toast.success(
        `"${v.item.name}" movido a ${v.targetLabel}${brand ? ` · marca: ${brand}` : ""}`,
      );
    },
    onError: (e: Error) => toast.error(e.message || "No se pudo mover"),
  });

  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [editFolder, setEditFolder] = useState<DriveTreeFolder | null>(null);
  const [preview, setPreview] = useState<DriveTreeFile | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /** Wires any element as a move target (folder card, breadcrumb crumb). */
  const dropTargetProps = (targetId: UUID | null, targetLabel: string) => ({
    activeItem: dragItem,
    targetId,
    onDropItem: (item: DragItem) => {
      setDragItem(null);
      if (item.kind === "folder" && item.id === targetId) return; // no-op: into itself
      moveM.mutate({ item, targetId, targetLabel });
    },
  });

  const uploadFiles = (files: FileList | File[]) => Array.from(files).forEach((f) => uploadM.mutate(f));
  const stalePath = treeQ.data && !current;
  const here = segments.length ? segments[segments.length - 1] : "Drive";

  return (
    <div className="flex h-screen flex-col">
      <PageHeader
        eyebrow="PKGD OS · Almacén"
        title="Drive"
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setNewFolderOpen(true)}
              className="inline-flex items-center gap-2 border border-foreground/15 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-foreground/80 transition-colors hover:border-[var(--accent)] hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <FolderPlus className="size-3.5" strokeWidth={1.5} /> Nueva carpeta
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 border border-[var(--accent)] px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-foreground transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <Upload className="size-3.5" strokeWidth={1.5} /> Subir archivo
            </button>
          </div>
        }
      />

      {/* Breadcrumb — also a drop target: suelta aquí para mover hacia un ancestro */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border bg-foreground/[0.02] px-8 py-3 font-mono text-[11px]">
        <CrumbDropZone {...dropTargetProps(null, "Drive")}>
          <button
            type="button"
            onClick={() => goTo([])}
            className={`transition-colors hover:text-foreground ${segments.length === 0 ? "text-[var(--accent)]" : "text-foreground/60"}`}
          >
            Drive
          </button>
        </CrumbDropZone>
        {segments.map((seg, i) => {
          const crumbId = treeQ.data
            ? resolveFolder(treeQ.data, segments.slice(0, i + 1))?.id ?? null
            : null;
          return (
            <span key={i} className="flex items-center gap-1 whitespace-nowrap">
              <ChevronRight className="size-3 text-foreground/25" strokeWidth={1.5} />
              <CrumbDropZone {...dropTargetProps(crumbId, seg)}>
                <button
                  type="button"
                  onClick={() => goTo(segments.slice(0, i + 1))}
                  className={`transition-colors hover:text-foreground ${i === segments.length - 1 ? "text-[var(--accent)]" : "text-foreground/60"}`}
                >
                  {seg}
                </button>
              </CrumbDropZone>
            </span>
          );
        })}
      </div>

      <input
        ref={fileRef}
        type="file"
        hidden
        multiple
        onChange={(e) => {
          if (e.target.files?.length) uploadFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Drop zone / grid */}
      <div
        onDragOver={(e) => {
          // Internal card drags are handled by the folder/breadcrumb targets, not by the uploader.
          if (!isExternalFileDrag(e.dataTransfer)) return;
          e.preventDefault();
          if (!dragging) setDragging(true);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) setDragging(false);
        }}
        onDrop={(e) => {
          if (!isExternalFileDrag(e.dataTransfer)) return;
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
        }}
        className={`relative flex-1 overflow-auto px-8 py-6 transition-colors ${dragging ? "bg-[var(--accent)]/[0.06]" : ""}`}
      >
        {dragging ? (
          <div className="pointer-events-none absolute inset-4 z-10 grid place-items-center border-2 border-dashed border-[var(--accent)] bg-background/60 backdrop-blur-sm">
            <div className="text-center">
              <Upload className="mx-auto size-6 text-[var(--accent)]" strokeWidth={1.5} />
              <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.24em] text-foreground/80">
                Suelta para subir a {here}
              </div>
            </div>
          </div>
        ) : null}

        {uploadM.isPending ? (
          <div className="mb-4 inline-flex items-center gap-2 border border-[var(--accent)]/40 bg-[var(--accent)]/[0.05] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/70">
            <Loader2 className="size-3 animate-spin text-[var(--accent)]" strokeWidth={2} /> Subiendo…
          </div>
        ) : null}

        {treeQ.isLoading ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-[3px] border border-border bg-foreground/[0.03]" />
            ))}
          </div>
        ) : treeQ.isError ? (
          <div className="py-16 text-center text-[13px] text-destructive">
            No se pudo cargar el Drive.{" "}
            <button onClick={() => treeQ.refetch()} className="underline hover:text-foreground">
              Reintentar
            </button>
          </div>
        ) : stalePath ? (
          <div className="py-16 text-center text-[13px] text-foreground/50">
            Esta carpeta ya no existe.{" "}
            <button onClick={() => goTo([])} className="underline hover:text-foreground">
              Volver al inicio
            </button>
          </div>
        ) : current && current.folders.length === 0 && current.files.length === 0 ? (
          <EmptyFolder root={segments.length === 0} onUpload={() => fileRef.current?.click()} onNewFolder={() => setNewFolderOpen(true)} />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
            {current?.folders.map((f, i) => (
              <GridItem key={f.id} index={i}>
                <FolderCard
                  folder={f}
                  onOpen={() => goTo([...segments, f.name])}
                  onEdit={() => setEditFolder(f)}
                  onDelete={() => deleteFolderM.mutate(f.id)}
                  onDragStartItem={() => setDragItem({ kind: "folder", id: f.id, name: f.name })}
                  onDragEndItem={() => setDragItem(null)}
                  {...dropTargetProps(f.id, f.name)}
                />
              </GridItem>
            ))}
            {current?.files.map((f, i) => (
              <GridItem key={f.id} index={(current?.folders.length ?? 0) + i}>
                <FileCard
                  file={f}
                  onOpen={() => setPreview(f)}
                  onDelete={() => deleteFileM.mutate(f.id)}
                  onDragStartItem={() => setDragItem({ kind: "file", id: f.id, name: f.name })}
                  onDragEndItem={() => setDragItem(null)}
                />
              </GridItem>
            ))}
          </div>
        )}
      </div>

      {newFolderOpen ? (
        <NewFolderDialog
          submitting={createFolderM.isPending}
          brands={brandsQ.data ?? []}
          atRoot={segments.length === 0}
          inheritedBrandName={current?.brand_name ?? null}
          onClose={() => setNewFolderOpen(false)}
          onSubmit={(name, brandId) =>
            createFolderM.mutate(
              { name, brand_id: brandId || undefined },
              { onSuccess: () => setNewFolderOpen(false) },
            )
          }
        />
      ) : null}

      {editFolder ? (
        <EditFolderDialog
          folder={editFolder}
          brands={brandsQ.data ?? []}
          submitting={updateFolderM.isPending}
          onClose={() => setEditFolder(null)}
          onSubmit={(name, brandId) =>
            updateFolderM.mutate(
              { id: editFolder.id, name, brand_id: brandId },
              { onSuccess: () => setEditFolder(null) },
            )
          }
        />
      ) : null}

      <PreviewModal file={preview} onClose={() => setPreview(null)} onChanged={invalidate} />
    </div>
  );
}

/* ---------- grid pieces ---------- */
function GridItem({ children, index }: { children: React.ReactNode; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.025, 0.3), ease: [0.25, 1, 0.5, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ---------- drag & drop plumbing ---------- */
/** Shared shape for anything that accepts a dropped Drive item. */
type DropTarget = {
  activeItem: DragItem | null;
  targetId: UUID | null;
  onDropItem: (item: DragItem) => void;
};

/** Read the dragged item off the event (race-free), falling back to the tracked state. */
function readDragItem(e: React.DragEvent, fallback: DragItem | null): DragItem | null {
  try {
    const raw = e.dataTransfer.getData(DND_MIME);
    if (raw) return JSON.parse(raw) as DragItem;
  } catch {
    /* ignore malformed payloads */
  }
  return fallback;
}

/** Props for a card the user can pick up. */
function draggableProps(item: DragItem, onStart: () => void, onEnd: () => void) {
  return {
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.setData(DND_MIME, JSON.stringify(item));
      e.dataTransfer.effectAllowed = "move";
      onStart();
    },
    onDragEnd: onEnd,
  };
}

/** Breadcrumb crumb wrapper — drop here to move an item up to that ancestor (root included). */
function CrumbDropZone({
  activeItem,
  targetId,
  onDropItem,
  children,
}: DropTarget & { children: React.ReactNode }) {
  const [over, setOver] = useState(false);
  const eligible = !!activeItem && !(activeItem.kind === "folder" && activeItem.id === targetId);
  return (
    <span
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes(DND_MIME)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        if (!e.dataTransfer.types.includes(DND_MIME)) return;
        e.preventDefault();
        setOver(false);
        const item = readDragItem(e, activeItem);
        if (item) onDropItem(item);
      }}
      className={`rounded-[2px] px-1 py-0.5 transition-colors ${
        over && eligible
          ? "bg-[var(--accent)]/20 ring-1 ring-[var(--accent)]"
          : eligible
            ? "ring-1 ring-dashed ring-foreground/15"
            : ""
      }`}
    >
      {children}
    </span>
  );
}

function BrandTag({ name }: { name: string | null }) {
  if (!name) return null;
  return (
    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-foreground/35" title={`Marca relacionada: ${name}`}>
      · {name}
    </span>
  );
}

function FolderCard({
  folder,
  onOpen,
  onEdit,
  onDelete,
  onDragStartItem,
  onDragEndItem,
  activeItem,
  targetId,
  onDropItem,
}: DropTarget & {
  folder: DriveTreeFolder;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDragStartItem: () => void;
  onDragEndItem: () => void;
}) {
  const [over, setOver] = useState(false);
  const dragged = activeItem?.kind === "folder" && activeItem.id === folder.id;
  const eligible = !!activeItem && !dragged;
  return (
    <div
      {...draggableProps({ kind: "folder", id: folder.id, name: folder.name }, onDragStartItem, onDragEndItem)}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes(DND_MIME) || dragged) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        if (!e.dataTransfer.types.includes(DND_MIME) || dragged) return;
        e.preventDefault();
        setOver(false);
        const item = readDragItem(e, activeItem);
        if (item) onDropItem(item);
      }}
      title={eligible ? `Suelta aquí para mover a "${folder.name}" (adopta su marca)` : undefined}
      className={`group relative flex cursor-grab flex-col border bg-card p-4 shadow-sm transition-all active:cursor-grabbing rounded-[3px] ${
        over
          ? "border-[var(--accent)] bg-[var(--accent)]/[0.08] shadow-md ring-1 ring-[var(--accent)]"
          : eligible
            ? "border-dashed border-foreground/25 hover:border-[var(--accent)]"
            : "border-border hover:border-[var(--accent)] hover:shadow-md"
      } ${dragged ? "opacity-40" : ""}`}
    >
      <button type="button" onClick={onOpen} className="flex w-full min-w-0 flex-1 flex-col items-start gap-3 text-left focus-visible:outline-none">
        <Folder className="size-7 text-[var(--accent)]" strokeWidth={1.5} />
        {/* w-full + overflow-wrap:anywhere: sin esto un nombre largo sin espacios toma su
            ancho max-content como flex item y se sale de la tarjeta. */}
        <span className="line-clamp-2 w-full [overflow-wrap:anywhere] text-[13px] text-foreground" title={folder.name}>
          {folder.name}
        </span>
      </button>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/50 pt-2">
        <span className="min-w-0 truncate font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/35">
          {folder.folders.length + folder.files.length} elementos
          <BrandTag name={folder.brand_name} />
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="text-foreground/30 opacity-0 transition-all hover:text-[var(--accent)] group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none"
            title="Editar carpeta"
          >
            <Pencil className="size-3.5" strokeWidth={1.5} />
          </button>
          <DeleteBtn onDelete={onDelete} confirmLabel={`¿Eliminar la carpeta "${folder.name}" y todo su contenido?`} />
        </div>
      </div>
    </div>
  );
}

/* ---------- edit folder dialog (rename + re-brand with cascade) ---------- */
function EditFolderDialog({
  folder,
  brands,
  submitting,
  onClose,
  onSubmit,
}: {
  folder: DriveTreeFolder;
  brands: Brand[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (name: string, brandId: string) => void;
}) {
  const [name, setName] = useState(folder.name);
  const [brandId, setBrandId] = useState(folder.brand_id ?? "");
  const brandChanged = (brandId || null) !== (folder.brand_id ?? null);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 motion-safe:animate-in motion-safe:fade-in">
      <div className="w-full max-w-[420px] border border-border bg-[var(--card)] shadow-xl rounded-[4px] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] motion-safe:animate-in motion-safe:zoom-in-95">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/40">Drive</div>
            <div className="text-[15px] text-foreground">Editar carpeta</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[3px] p-1.5 text-foreground/40 hover:bg-foreground/5 hover:text-foreground"
          >
            <X className="size-4" strokeWidth={1.5} />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) onSubmit(name.trim(), brandId);
          }}
          className="px-6 py-5"
        >
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/45">Nombre</span>
            <div className="mt-1 flex items-center gap-1 border border-border bg-foreground/[0.01] px-2 focus-within:border-[var(--accent)] transition-colors rounded-[3px]">
              <span className="select-none pr-1 font-mono text-[13px] text-foreground/30">[</span>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent py-2 text-[13px] text-foreground outline-none"
              />
              <span className="select-none pl-1 font-mono text-[13px] text-foreground/30">]</span>
            </div>
          </label>

          <label className="mt-4 block">
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/45">Marca relacionada</span>
            <div className="mt-1 flex items-center gap-1 border border-border bg-foreground/[0.01] px-2 focus-within:border-[var(--accent)] transition-colors rounded-[3px]">
              <span className="select-none pr-1 font-mono text-[13px] text-foreground/30">[</span>
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="w-full cursor-pointer bg-transparent py-2 text-[13px] text-foreground outline-none"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id} className="bg-background text-foreground">
                    {b.name}
                  </option>
                ))}
              </select>
              <span className="select-none pl-1 font-mono text-[13px] text-foreground/30">]</span>
            </div>
            {brandChanged ? (
              <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--accent)]/80">
                Se propagará a lo que hereda esta marca (las subcarpetas con otra marca se respetan).
              </p>
            ) : null}
          </label>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="border border-border px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-foreground/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="border border-[var(--accent)] px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] disabled:opacity-30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {submitting ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FileCard({
  file,
  onOpen,
  onDelete,
  onDragStartItem,
  onDragEndItem,
}: {
  file: DriveTreeFile;
  onOpen: () => void;
  onDelete: () => void;
  onDragStartItem: () => void;
  onDragEndItem: () => void;
}) {
  const Icon = iconFor(file.mime_type, file.name);
  const [dragged, setDragged] = useState(false);
  return (
    <div
      {...draggableProps(
        { kind: "file", id: file.id, name: file.name },
        () => {
          setDragged(true);
          onDragStartItem();
        },
        () => {
          setDragged(false);
          onDragEndItem();
        },
      )}
      className={`group relative flex cursor-grab flex-col border border-border bg-card p-4 shadow-sm transition-all hover:border-foreground/25 hover:shadow-md active:cursor-grabbing rounded-[3px] ${
        dragged ? "opacity-40" : ""
      }`}
    >
      <button type="button" onClick={onOpen} className="flex w-full min-w-0 flex-1 flex-col items-start gap-3 text-left focus-visible:outline-none">
        <Icon className="size-7 text-foreground/45" strokeWidth={1.5} />
        <span className="line-clamp-2 w-full [overflow-wrap:anywhere] text-[13px] text-foreground" title={file.name}>
          {file.name}
        </span>
      </button>
      {/* Files with history wear the size of that history (not the current version number,
          which can be any of them after a rollback); a single upload stays unmarked. */}
      {file.version_count > 1 ? (
        <span
          className="pointer-events-none absolute right-2 top-2 flex items-center gap-1 border border-border px-1.5 py-0.5 font-mono text-[9px] text-foreground/45"
          title={`${file.version_count} versiones`}
        >
          <History className="size-2.5" strokeWidth={1.5} />
          {file.version_count}
        </span>
      ) : null}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/50 pt-2">
        <span className="min-w-0 truncate font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/35">
          {kindLabel(file.mime_type, file.name)}
          <BrandTag name={file.brand_name} />
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          {/* Download straight from the grid, without opening the preview. */}
          <a
            href={driveApi.fileUrl(file.url)}
            download={file.name}
            draggable={false}
            onClick={(e) => e.stopPropagation()}
            className="text-foreground/30 opacity-0 transition-all hover:text-[var(--accent)] group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none"
            title={`Descargar "${file.name}"`}
          >
            <Download className="size-3.5" strokeWidth={1.5} />
          </a>
          <DeleteBtn onDelete={onDelete} confirmLabel={`¿Eliminar "${file.name}"?`} />
        </div>
      </div>
    </div>
  );
}

function DeleteBtn({ onDelete, confirmLabel }: { onDelete: () => void; confirmLabel: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (window.confirm(confirmLabel)) onDelete();
      }}
      className="shrink-0 text-foreground/30 opacity-0 transition-all hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none"
      title="Eliminar"
    >
      <Trash2 className="size-3.5" strokeWidth={1.5} />
    </button>
  );
}

function EmptyFolder({
  root,
  onUpload,
  onNewFolder,
}: {
  root: boolean;
  onUpload: () => void;
  onNewFolder: () => void;
}) {
  return (
    <div className="mx-auto max-w-[440px] py-16 text-center motion-safe:animate-in motion-safe:fade-in">
      <pre className="mb-6 select-none text-center font-mono text-[10px] leading-tight tracking-wider text-foreground/30">
        {`   [ archivo ] ──► [ ingesta ]
                        │
                        ▼
     [ pgvector ] ◄── [ embeddings ]`}
      </pre>
      <h3 className="font-display text-[14px] uppercase tracking-[0.06em] text-foreground">
        {root ? "El Drive está vacío" : "Carpeta vacía"}
      </h3>
      <p className="mt-2 text-[12px] leading-relaxed text-foreground/50">
        {root
          ? "Crea carpetas para organizar la información (por departamento, proyecto, etc.). Al crear una carpeta puedes indicar una marca relacionada opcional."
          : "Arrastra archivos aquí o súbelos. Cada documento se vectoriza automáticamente para que los agentes puedan encontrarlo."}
      </p>
      <div className="mt-5 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={onNewFolder}
          className="inline-flex items-center gap-2 border border-foreground/15 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-foreground/80 transition-colors hover:border-[var(--accent)] hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <FolderPlus className="size-3.5" strokeWidth={1.5} /> Nueva carpeta
        </button>
        <button
          type="button"
          onClick={onUpload}
          className="inline-flex items-center gap-2 border border-[var(--accent)] px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-foreground transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <Upload className="size-3.5" strokeWidth={1.5} /> Subir archivo
        </button>
      </div>
    </div>
  );
}

/* ---------- new folder dialog (with optional related brand) ---------- */
function NewFolderDialog({
  brands,
  submitting,
  atRoot,
  inheritedBrandName,
  onClose,
  onSubmit,
}: {
  brands: Brand[];
  submitting: boolean;
  atRoot: boolean;
  inheritedBrandName: string | null;
  onClose: () => void;
  onSubmit: (name: string, brandId: string) => void;
}) {
  const [name, setName] = useState("");
  const [brandId, setBrandId] = useState(""); // "" => inherit (parent folder brand, or PKGD at root)
  // What "leave empty" resolves to, for the label.
  const inherited = atRoot ? "PKGD" : inheritedBrandName ?? "PKGD";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 motion-safe:animate-in motion-safe:fade-in">
      <div className="w-full max-w-[420px] border border-border bg-[var(--card)] shadow-xl rounded-[4px] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] motion-safe:animate-in motion-safe:zoom-in-95">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/40">Drive</div>
            <div className="text-[15px] text-foreground">Nueva carpeta</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[3px] p-1.5 text-foreground/40 hover:bg-foreground/5 hover:text-foreground"
          >
            <X className="size-4" strokeWidth={1.5} />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) onSubmit(name.trim(), brandId);
          }}
          className="px-6 py-5"
        >
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/45">
              Nombre
            </span>
            <div className="mt-1 flex items-center gap-1 border border-border bg-foreground/[0.01] px-2 focus-within:border-[var(--accent)] transition-colors rounded-[3px]">
              <span className="select-none pr-1 font-mono text-[13px] text-foreground/30">[</span>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre de la carpeta"
                className="w-full bg-transparent py-2 text-[13px] text-foreground outline-none placeholder:text-foreground/30"
              />
              <span className="select-none pl-1 font-mono text-[13px] text-foreground/30">]</span>
            </div>
          </label>

          <label className="mt-4 block">
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/45">
              Marca relacionada (opcional)
            </span>
            <div className="mt-1 flex items-center gap-1 border border-border bg-foreground/[0.01] px-2 focus-within:border-[var(--accent)] transition-colors rounded-[3px]">
              <span className="select-none pr-1 font-mono text-[13px] text-foreground/30">[</span>
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="w-full cursor-pointer bg-transparent py-2 text-[13px] text-foreground outline-none"
              >
                <option value="" className="bg-background text-foreground/70">
                  {atRoot ? `— ${inherited} (por defecto)` : `— ${inherited} (heredada)`}
                </option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id} className="bg-background text-foreground">
                    {b.name}
                  </option>
                ))}
              </select>
              <span className="select-none pl-1 font-mono text-[13px] text-foreground/30">]</span>
            </div>
            <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/30">
              {atRoot
                ? "Si lo dejas vacío, se relaciona con PKGD."
                : `Si lo dejas vacío, hereda la marca de la carpeta actual (${inherited}).`}
            </p>
          </label>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="border border-border px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-foreground/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="border border-[var(--accent)] px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] disabled:opacity-30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {submitting ? "Creando…" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- preview modal ---------- */
/** Styles Tika's converted document HTML to the PKGD reading voice. */
const DOC_HTML_CLASS = [
  // overflow-wrap:anywhere en la raíz: las hojas de cálculo traen cadenas largas sin espacios
  // (URLs, SKUs, hashes) que de otro modo empujan el contenido fuera de la caja.
  "text-[13px] leading-relaxed text-foreground/85 [overflow-wrap:anywhere]",
  "[&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:font-display [&_h1]:text-[16px] [&_h1]:uppercase [&_h1]:tracking-[0.04em] [&_h1]:text-foreground",
  "[&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-[14px] [&_h2]:font-medium [&_h2]:text-foreground",
  "[&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-[13px] [&_h3]:font-medium [&_h3]:text-foreground",
  "[&_p]:my-2 [&_p:empty]:hidden",
  "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1",
  "[&_a]:text-[var(--accent)] [&_a]:underline",
  "[&_strong]:font-medium [&_strong]:text-foreground",
  "[&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--accent)]/50 [&_blockquote]:pl-3 [&_blockquote]:text-foreground/70",
  "[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-border [&_pre]:bg-background [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-[11px]",
  // Spreadsheets/slides come out as tables — keep them scrollable, never break the layout.
  // w-auto + min-w-full: una hoja ancha se lee y se desplaza dentro del scroll del modal,
  // en vez de aplastar 30 columnas a 20px cada una (que es lo que hace w-full a secas).
  "[&_table]:my-4 [&_table]:w-auto [&_table]:min-w-full [&_table]:border-collapse [&_table]:text-[12px]",
  "[&_th]:border [&_th]:border-border [&_th]:bg-foreground/[0.04] [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-medium",
  // max-w por celda: una celda con un párrafo entero no debe estirar la tabla al infinito.
  "[&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1.5 [&_td]:align-top [&_td]:max-w-[420px]",
  "[&_th]:max-w-[420px]",
  // Tika wraps each unit in a div: .page (docx), .sheet (xlsx tab), .slide-content (pptx).
  // Draw the seam between consecutive units so a workbook/deck reads as sections.
  "[&_.page+.page]:mt-6 [&_.page+.page]:border-t [&_.page+.page]:border-dashed [&_.page+.page]:border-border [&_.page+.page]:pt-6",
  "[&_.sheet+.sheet]:mt-6 [&_.sheet+.sheet]:border-t [&_.sheet+.sheet]:border-dashed [&_.sheet+.sheet]:border-border [&_.sheet+.sheet]:pt-6",
  "[&_.slide-content+.slide-content]:mt-6 [&_.slide-content+.slide-content]:border-t [&_.slide-content+.slide-content]:border-dashed [&_.slide-content+.slide-content]:border-border [&_.slide-content+.slide-content]:pt-6",
].join(" ");

function PreviewModal({
  file,
  onClose,
  onChanged,
}: {
  file: DriveTreeFile | null;
  onClose: () => void;
  /** Called after a version upload/restore/delete so the grid picks up the new state. */
  onChanged: () => void;
}) {
  // Which point of the history is on screen. null = whatever is current.
  const [viewingId, setViewingId] = useState<UUID | null>(null);
  useEffect(() => setViewingId(null), [file?.id]);

  const historyQ = useQuery({
    queryKey: ["drive", "versions", file?.id],
    queryFn: () => driveApi.getVersions(file!.id),
    enabled: !!file,
  });
  const versions = historyQ.data?.versions ?? []; // newest first
  const currentId = historyQ.data?.current_version_id ?? null;
  const viewing = versions.find((v) => v.id === (viewingId ?? currentId)) ?? null;

  // The preview always renders the bytes of the version being viewed — not the file row —
  // so stepping through the history shows each version's own content and format.
  const shown = viewing
    ? { url: viewing.url, mime_type: viewing.mime_type, name: viewing.name }
    : file;

  const isImage = !!shown && shown.mime_type.startsWith("image/");
  const isPdf = !!shown && shown.mime_type === "application/pdf";
  const isVideo = !!shown && shown.mime_type.startsWith("video/");
  const isAudio = !!shown && shown.mime_type.startsWith("audio/");
  const isText =
    !!shown &&
    (shown.mime_type.startsWith("text/") ||
      shown.mime_type === "application/json" ||
      /\.(md|txt|csv|json)$/i.test(shown.name));
  // Office documents: the backend converts them to sanitized HTML with Tika.
  const isDoc = !!shown && !isText && driveApi.isConvertible(shown.mime_type, shown.name);

  const textQ = useQuery({
    queryKey: ["drive-preview", file?.id, viewing?.id],
    queryFn: () => driveApi.fetchText(shown!.url),
    enabled: !!shown && isText,
  });
  const docQ = useQuery({
    queryKey: ["drive-doc-preview", file?.id, viewing?.id],
    queryFn: () => driveApi.getPreviewHtml(file!.id, viewing?.id),
    enabled: !!file && isDoc,
    staleTime: Infinity, // a version's bytes never change
    retry: false,
  });

  return (
    <Dialog open={!!file} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[880px] gap-0 border-border bg-[var(--card)] p-0">
        {/* pr-14 keeps the title clear of the dialog's own close button (absolute right-4). */}
        <DialogHeader className="flex-row items-start justify-between gap-4 border-b border-border px-6 py-4 pr-14">
          <div className="min-w-0">
            <DialogTitle className="flex items-center gap-2 text-[15px] text-foreground">
              {file ? <FilePreviewIcon mime={file.mime_type} name={file.name} /> : null}
              <span className="truncate">{file?.name}</span>
            </DialogTitle>
            <DialogDescription className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/40">
              {file?.full_path}
              {file?.brand_name ? ` · ${file.brand_name}` : ""}
            </DialogDescription>
          </div>
          {/* Previewing is not a substitute for having the file: always offer the download —
              of the version on screen, not necessarily the current one. */}
          {shown ? <DownloadLink url={shown.url} name={file?.name ?? shown.name} /> : null}
        </DialogHeader>

        {/* Version rail: step back and forward through the history, restore, add a version. */}
        {file ? (
          <VersionRail
            fileId={file.id}
            versions={versions}
            currentId={currentId}
            viewing={viewing}
            loading={historyQ.isLoading}
            onView={setViewingId}
            onChanged={() => {
              setViewingId(null); // after a change, follow whatever is current
              onChanged();
            }}
          />
        ) : null}

        <div className="max-h-[70vh] overflow-auto p-6">
          {!shown ? null : isImage ? (
            <img
              src={driveApi.fileUrl(shown.url)}
              alt={shown.name}
              className="mx-auto max-h-[60vh] max-w-full rounded-[3px] border border-border"
            />
          ) : isPdf ? (
            <iframe
              src={driveApi.fileUrl(shown.url)}
              title={shown.name}
              className="h-[60vh] w-full rounded-[3px] border border-border bg-white"
            />
          ) : isVideo ? (
            <video
              src={driveApi.fileUrl(shown.url)}
              controls
              className="mx-auto max-h-[60vh] w-full rounded-[3px] border border-border bg-black"
            />
          ) : isAudio ? (
            <audio src={driveApi.fileUrl(shown.url)} controls className="w-full" />
          ) : isText ? (
            textQ.isLoading ? (
              <PreviewLoading />
            ) : textQ.isError ? (
              <p className="text-[12px] text-destructive">No se pudo leer el archivo.</p>
            ) : (
              <pre className="whitespace-pre-wrap break-words border border-border bg-background p-4 font-mono text-[12px] leading-relaxed text-foreground/85 rounded-[3px]">
                {textQ.data}
              </pre>
            )
          ) : isDoc ? (
            docQ.isLoading ? (
              <PreviewLoading label="Convirtiendo documento…" />
            ) : docQ.isError ? (
              <PreviewFallback
                url={shown.url}
                message={(docQ.error as Error)?.message || "No se pudo convertir el documento."}
              />
            ) : (
              <div
                className={DOC_HTML_CLASS}
                // Sanitized server-side (allowlist in drive-preview.service.ts) before it ships.
                dangerouslySetInnerHTML={{ __html: docQ.data ?? "" }}
              />
            )
          ) : (
            <PreviewFallback url={shown.url} message="Vista previa no disponible para este tipo de archivo." />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Download a stored file under its display name. The stored filename is prefixed with a
 * timestamp, so `download` is given the Drive name; it works because /uploads is same-origin.
 * `url` is the version on screen, so downloading from an old version gets THAT binary.
 */
function DownloadLink({ url, name }: { url: string; name: string }) {
  return (
    <a
      href={driveApi.fileUrl(url)}
      download={name}
      className="inline-flex shrink-0 items-center gap-2 self-center border border-[var(--accent)] px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      title={`Descargar "${name}"`}
    >
      <Download className="size-3.5" strokeWidth={1.5} /> Descargar
    </a>
  );
}

/* ---------- versions ---------- */

const VERSION_DATE = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const formatVersionDate = (iso: string) => VERSION_DATE.format(new Date(iso));
const formatSize = (bytes: number) =>
  bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/**
 * The version rail of the preview modal.
 *
 * Uploading over a file never overwrites it: it adds a version and that version becomes the
 * current one. The arrows walk the history (← older, → newer) WITHOUT changing anything;
 * "Restaurar" is what moves the current pointer — and that pointer is also what the agent
 * searches and reads, so restoring an old version rolls back what the OS knows about the file.
 */
function VersionRail({
  fileId,
  versions,
  currentId,
  viewing,
  loading,
  onView,
  onChanged,
}: {
  fileId: UUID;
  versions: DriveFileVersion[]; // newest first
  currentId: UUID | null;
  viewing: DriveFileVersion | null;
  loading: boolean;
  onView: (id: UUID | null) => void;
  onChanged: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);

  const uploadM = useMutation({
    mutationFn: (v: { file: File; note?: string }) => driveApi.uploadVersion(fileId, v.file, v.note),
    onSuccess: ({ version }) => {
      onChanged();
      toast.success(`v${version.version} subida · vectorizando en segundo plano`);
    },
    onError: (e: Error) => toast.error(e.message || "No se pudo subir la nueva versión"),
  });
  const restoreM = useMutation({
    mutationFn: (versionId: UUID) => driveApi.restoreVersion(fileId, versionId),
    onSuccess: ({ version }) => {
      onChanged();
      toast.success(`v${version.version} es ahora la versión vigente · el agente ya lee esta`);
    },
    onError: (e: Error) => toast.error(e.message || "No se pudo restaurar la versión"),
  });
  const deleteM = useMutation({
    mutationFn: (versionId: UUID) => driveApi.deleteVersion(fileId, versionId),
    onSuccess: () => {
      onChanged();
      toast.success("Versión eliminada del historial");
    },
    onError: (e: Error) => toast.error(e.message || "No se pudo eliminar la versión"),
  });
  const busy = uploadM.isPending || restoreM.isPending || deleteM.isPending;

  // versions[0] is the newest: "older" walks forward in the array, "newer" walks back.
  const idx = viewing ? versions.findIndex((v) => v.id === viewing.id) : -1;
  const older = idx >= 0 ? versions[idx + 1] : undefined;
  const newer = idx > 0 ? versions[idx - 1] : undefined;
  const isCurrent = !!viewing && viewing.id === currentId;

  const pickVersion = () => inputRef.current?.click();
  const onPicked = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const note = window.prompt("¿Qué cambia en esta versión? (opcional)") ?? undefined;
    uploadM.mutate({ file, note: note || undefined });
    if (inputRef.current) inputRef.current.value = ""; // allow re-picking the same file
  };

  return (
    <div className="border-b border-border bg-foreground/[0.02] px-6 py-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <button
          type="button"
          onClick={() => older && onView(older.id)}
          disabled={!older || busy}
          className="text-foreground/40 transition-colors hover:text-foreground disabled:opacity-25 disabled:hover:text-foreground/40"
          title={older ? `Ver v${older.version}` : "No hay versión anterior"}
        >
          <ChevronLeft className="size-4" strokeWidth={1.5} />
        </button>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/60 transition-colors hover:text-foreground"
          title="Ver el historial completo"
        >
          <History className="size-3.5" strokeWidth={1.5} />
          {loading ? "Cargando…" : viewing ? `v${viewing.version} de ${versions.length}` : "—"}
        </button>

        <button
          type="button"
          onClick={() => newer && onView(newer.id)}
          disabled={!newer || busy}
          className="text-foreground/40 transition-colors hover:text-foreground disabled:opacity-25 disabled:hover:text-foreground/40"
          title={newer ? `Ver v${newer.version}` : "No hay versión posterior"}
        >
          <ChevronRight className="size-4" strokeWidth={1.5} />
        </button>

        {viewing ? (
          <span className="min-w-0 truncate font-mono text-[10px] tracking-[0.08em] text-foreground/35">
            {formatVersionDate(viewing.created_at)}
            {viewing.uploader_name ? ` · ${viewing.uploader_name}` : ""}
            {viewing.note ? ` · ${viewing.note}` : ""}
          </span>
        ) : null}

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {isCurrent ? (
            <span className="border border-[var(--accent)]/60 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--accent)]">
              Vigente
            </span>
          ) : viewing ? (
            <button
              type="button"
              onClick={() => restoreM.mutate(viewing.id)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 border border-border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-foreground/70 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-40"
            >
              {restoreM.isPending ? (
                <Loader2 className="size-3 animate-spin" strokeWidth={2} />
              ) : (
                <RotateCcw className="size-3" strokeWidth={1.5} />
              )}
              Restaurar
            </button>
          ) : null}
          <button
            type="button"
            onClick={pickVersion}
            disabled={busy}
            className="inline-flex items-center gap-1.5 border border-border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-foreground/70 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-40"
            title="Subir una versión nueva de este archivo"
          >
            {uploadM.isPending ? (
              <Loader2 className="size-3 animate-spin" strokeWidth={2} />
            ) : (
              <Upload className="size-3" strokeWidth={1.5} />
            )}
            Nueva versión
          </button>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => onPicked(e.target.files)}
          />
        </div>
      </div>

      {open && versions.length ? (
        <ul className="mt-2 border-t border-border/60 pt-2">
          {versions.map((v) => {
            const current = v.id === currentId;
            return (
              <li
                key={v.id}
                className={`flex items-center gap-3 py-1 ${
                  viewing?.id === v.id ? "text-foreground" : "text-foreground/50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onView(v.id)}
                  className="flex min-w-0 flex-1 items-baseline gap-2 text-left hover:text-foreground"
                >
                  <span className="font-mono text-[10px] tracking-[0.18em]">v{v.version}</span>
                  <span className="truncate text-[11px]">{v.name}</span>
                  <span className="shrink-0 font-mono text-[9px] tracking-[0.08em] text-foreground/30">
                    {formatVersionDate(v.created_at)} · {formatSize(v.size)}
                  </span>
                </button>
                {current ? (
                  <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--accent)]">
                    Vigente
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`¿Eliminar la versión v${v.version} del historial?`))
                        deleteM.mutate(v.id);
                    }}
                    disabled={busy}
                    className="shrink-0 text-foreground/25 transition-colors hover:text-destructive disabled:opacity-30"
                    title={`Eliminar v${v.version}`}
                  >
                    <Trash2 className="size-3" strokeWidth={1.5} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function PreviewLoading({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/50">
      <Loader2 className="size-3 animate-spin text-[var(--accent)]" strokeWidth={2} /> {label}
    </div>
  );
}

/** Shown when a format has no preview, or the conversion failed — always offer the download. */
function PreviewFallback({ url, message }: { url: string; message: string }) {
  return (
    <div className="py-10 text-center">
      <FileIcon className="mx-auto size-8 text-foreground/30" strokeWidth={1.5} />
      <p className="mt-3 text-[13px] text-foreground/60">{message}</p>
      <a
        href={driveApi.fileUrl(url)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-2 border border-[var(--accent)] px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
      >
        <Download className="size-3.5" strokeWidth={1.5} /> Descargar
      </a>
    </div>
  );
}

/* ---------- icon helpers ---------- */
/**
 * Etiqueta corta del tipo de archivo. La extensión gana porque el mime de Office es
 * kilométrico ("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") y
 * desbordaba el pie de la tarjeta; el subtipo del mime queda como respaldo, recortado.
 */
function kindLabel(mime: string, name: string) {
  const ext = name.split(".").pop();
  if (ext && ext !== name && ext.length <= 5) return ext.toUpperCase();
  const sub = mime.split("/")[1]?.split(/[.+;]/).pop();
  return (sub ? sub.slice(0, 12) : "archivo").toUpperCase();
}

function iconFor(mime: string, name = "") {
  if (mime.startsWith("image/")) return FileImage;
  if (/spreadsheet|ms-excel|\.(xlsx?|ods|csv)$/i.test(mime + name)) return FileSpreadsheet;
  if (mime === "application/pdf" || mime.startsWith("text/")) return FileText;
  if (driveApi.isConvertible(mime, name)) return FileText;
  return FileIcon;
}
function FilePreviewIcon({ mime, name }: { mime: string; name: string }) {
  const Icon = iconFor(mime, name);
  return <Icon className="size-4 shrink-0 text-foreground/50" strokeWidth={1.5} />;
}
