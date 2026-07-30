import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable } from "@/components/ui/DataTable";
import { useToast } from "@/components/ui/toast-store";
import { ApiError } from "@/lib/api-client";
import { downloadFile } from "@/lib/download";
import { cn } from "@/lib/cn";
import {
  usePreviewProductsImport,
  useCommitProductsImport,
} from "../queries";
import type {
  ImportPreviewResponse,
  ImportRowResult,
  ImportRowStatusValue,
} from "../types";

/** Backend limiti ilə bit-bitə üst-üstə düşməli — `ImportTemplate.MaxFileBytes`. */
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const TEMPLATE_URL = "/api/exports/products-template.xlsx";

/** Summary kartında tam siyahı əvəzinə göstərilən yeni kateqoriya sayı. */
const MAX_SHOWN_CATEGORIES = 3;

type Step = "file" | "preview" | "result";

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Sətir statusu → mətn. Açarlar backend-in `ImportRowStatus` sabitləri ilə eynidir;
 * mətnlər isə `Badge`-in `STATUS_STYLE` açarlarıdır — rəng ailəsi summary kartları
 * ilə eyni (yaşıl / indiqo / qırmızı).
 */
const ROW_LABEL: Record<ImportRowStatusValue, string> = {
  create: "Yeni",
  update: "Yenilənəcək",
  error: "Xətalı",
};

const STEP_TITLE: Record<Step, string> = {
  file: "Excel idxalı — Fayl",
  preview: "Excel idxalı — Önizləmə",
  result: "Excel idxalı — Nəticə",
};

/** Fayl uzantısı .xlsx-dirmi (böyük/kiçik hərf fərq etmir). */
const hasXlsxExtension = (name: string) => /\.xlsx$/i.test(name);

/**
 * Yeni kateqoriyaların qısa siyahısı — onlarla ad kartı şişirtməsin deyə ilk
 * bir neçəsi göstərilir, tam siyahı hover-də (`title`) görünür.
 */
function newCategoriesSub(names: string[]) {
  if (names.length === 0) return "yoxdur";
  const rest = names.length - MAX_SHOWN_CATEGORIES;
  return (
    <span title={names.join(", ")}>
      {names.slice(0, MAX_SHOWN_CATEGORIES).join(", ")}
      {rest > 0 && ` +${rest}`}
    </span>
  );
}

/**
 * Excel idxalı — 3 addımlı axın: fayl → önizləmə → nəticə.
 * Yalnız real backend rejimində açılır — mock rejimdə `_app.mallar.tsx`
 * modalı heç açmır (info toast qalır).
 */
export function ExcelImportModal({ open, onClose }: Props) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("file");
  const [file, setFile] = useState<File | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [templateDownloading, setTemplateDownloading] = useState(false);
  const [result, setResult] = useState<{
    creates: number;
    updates: number;
  } | null>(null);

  const previewMut = usePreviewProductsImport();
  const commitMut = useCommitProductsImport();

  /** Preview sorğusu gedirkən Addım 1-in bütün elementləri deaktivdir (AC-7). */
  const previewing = previewMut.isPending;

  /**
   * Hər preview sorğusuna sıra nömrəsi verilir: modal bağlanıb-açılanda, "Geri"
   * basılanda və ya yeni fayl seçiləndə nömrə artır, ona görə köhnə sorğunun
   * gec gələn cavabı aktual vəziyyəti (fayl/önizləmə/addım) əzə bilmir.
   */
  const previewSeq = useRef(0);
  const nextPreviewSeq = () => (previewSeq.current += 1);

  const resetInputValue = () => {
    if (inputRef.current) inputRef.current.value = "";
  };

  // Modal hər açılışda təzə vəziyyətdən başlayır — köhnə fayl/önizləmə
  // görünməsin (AC-13/TC-7).
  useEffect(() => {
    if (!open) return;
    nextPreviewSeq();
    setStep("file");
    setFile(null);
    setBanner(null);
    setPreview(null);
    setResult(null);
    setDragActive(false);
    resetInputValue();
  }, [open]);

  const backToStepOne = (message: string | null) => {
    nextPreviewSeq();
    setStep("file");
    setFile(null);
    setPreview(null);
    setBanner(message);
    resetInputValue();
  };

  const validateFile = (f: File): string | null => {
    if (!hasXlsxExtension(f.name)) return "Yalnız .xlsx faylı qəbul olunur";
    if (f.size > MAX_FILE_BYTES)
      return "Fayl çox böyükdür — ən çoxu 5 MB";
    return null;
  };

  const startPreview = async (f: File) => {
    // Sıra nömrəsi validasiyadan əvvəl artır ki, əvvəlki sorğu hər halda köhnəlsin.
    const seq = nextPreviewSeq();

    const clientError = validateFile(f);
    if (clientError) {
      setBanner(clientError);
      setFile(null);
      resetInputValue();
      return;
    }

    setBanner(null);
    setFile(f);
    try {
      const data = await previewMut.mutateAsync(f);
      if (seq !== previewSeq.current) return;
      setPreview(data);
      setStep("preview");
    } catch (e) {
      if (seq !== previewSeq.current) return;
      const message = e instanceof Error ? e.message : "Fayl oxunmadı";
      setBanner(message);
      toast.error(message);
      setFile(null);
      resetInputValue();
    }
  };

  const onPickFile = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) void startPreview(picked);
  };

  /**
   * Drop həmişə `preventDefault` edilir — sorğu davam edərkən handler tamam
   * çıxarılsaydı, hadisə document-ə qalxıb brauzerin defolt davranışını
   * (faylı yeni səhifədə açmaq) işə salar və istifadəçi tətbiqdən çıxardı.
   */
  const onDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (previewing) return;
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) void startPreview(dropped);
  };

  const handleBack = () => backToStepOne(null);

  const handleCommit = async () => {
    if (!preview) return;
    try {
      await commitMut.mutateAsync(preview.importToken);
      setResult({
        creates: preview.summary.creates,
        updates: preview.summary.updates,
      });
      setStep("result");
    } catch (e) {
      // 410 (token tapılmadı/vaxtı keçib) — AC-16: faylı yenidən yükləmək lazımdır.
      if (
        e instanceof ApiError &&
        (e.code === "Imports.TokenNotFound" || e.code === "Imports.TokenExpired")
      ) {
        toast.error(e.message);
        backToStepOne(e.message);
        return;
      }
      // 409 (barkod konflikti) — AC-17: token etibarlıdır, amma məlumat
      // kohnəlib (paralel dəyişiklik) — 410 axını ilə qarışdırılmır.
      if (e instanceof ApiError && e.code === "Imports.BarcodeConflict") {
        toast.error(e.message);
        backToStepOne(e.message);
        return;
      }
      toast.error(e instanceof Error ? e.message : "İdxal alınmadı");
    }
  };

  const downloadTemplate = async () => {
    setTemplateDownloading(true);
    try {
      await downloadFile(TEMPLATE_URL, "mehsullar-idxal-sablonu.xlsx");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Şablon endirilmədi");
    } finally {
      setTemplateDownloading(false);
    }
  };

  const columns = useMemo<ColumnDef<ImportRowResult, unknown>[]>(
    () => [
      {
        accessorKey: "rowNumber",
        header: "Sətir",
        meta: { className: "w-16" },
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (r) => r.status,
        cell: ({ row }) => {
          const label = ROW_LABEL[row.original.status] ?? row.original.status;
          return <Badge tone={label}>{label}</Badge>;
        },
      },
      {
        id: "name",
        header: "Mal adı",
        accessorFn: (r) => r.data?.name ?? "",
        meta: { className: "max-w-[220px]" },
        cell: ({ row }) => (
          <span
            className="block truncate"
            title={row.original.data?.name ?? undefined}
          >
            {row.original.data?.name ?? "—"}
          </span>
        ),
      },
      {
        id: "error",
        header: "Xəta səbəbi",
        enableSorting: false,
        accessorFn: (r) => r.error ?? "",
        cell: ({ row }) =>
          row.original.error ? (
            <span className="block whitespace-normal break-words text-sm font-semibold text-red-600">
              {row.original.error}
            </span>
          ) : (
            <span className="text-stone-400">—</span>
          ),
      },
    ],
    [],
  );

  const importCount = preview
    ? preview.summary.creates + preview.summary.updates
    : 0;

  return (
    <Modal open={open} onClose={onClose} title={STEP_TITLE[step]} wide>
      {step === "file" && (
        <div className="space-y-4">
          {banner && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
            >
              {banner}
            </p>
          )}

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              if (!previewing) setDragActive(true);
            }}
            onDragLeave={(e) => {
              // Daxili elementə keçəndə "dragleave" də atılır — sahədən tam
              // çıxılmayıbsa vurğu sönməsin (yanıb-sönmə effekti olmasın).
              if (e.currentTarget.contains(e.relatedTarget as Node | null))
                return;
              setDragActive(false);
            }}
            onDrop={onDrop}
            disabled={previewing}
            aria-busy={previewing}
            aria-label="Excel faylı seç və ya bura sürüklə (.xlsx, ən çoxu 5 MB)"
            className={cn(
              "flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20",
              dragActive
                ? "border-emerald-500 bg-emerald-50"
                : "border-stone-300 bg-stone-50 hover:border-stone-400",
              previewing && "cursor-not-allowed opacity-60",
            )}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm">
              <FileSpreadsheet size={28} />
            </span>
            <span className="text-base font-bold text-stone-800">
              Excel faylını bura sürüklə və ya klikləyib seç
            </span>
            <span className="text-sm text-stone-500">
              .xlsx faylı, ən çoxu 5 MB
            </span>
          </button>

          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={onPickFile}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
          />

          {previewing && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center justify-center gap-2 rounded-xl bg-stone-50 py-4 text-sm font-semibold text-stone-600"
            >
              <Loader2 size={18} className="animate-spin" aria-hidden />
              {file ? `Yoxlanılır: ${file.name}` : "Fayl yoxlanılır..."}
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-stone-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-stone-500">
              Şablonu istifadə edərək faylı hazırlayın
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={
                templateDownloading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )
              }
              onClick={() => void downloadTemplate()}
              disabled={previewing || templateDownloading}
            >
              Şablonu endir
            </Button>
          </div>
        </div>
      )}

      {step === "preview" && preview && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Yeni"
              value={preview.summary.creates}
              tone="green"
            />
            <StatCard
              label="Yenilənəcək"
              value={preview.summary.updates}
              tone="indigo"
            />
            <StatCard
              label="Xətalı"
              value={preview.summary.errors}
              tone="red"
            />
            <StatCard
              label="Yeni kateqoriyalar"
              value={preview.summary.newCategories.length}
              sub={newCategoriesSub(preview.summary.newCategories)}
            />
          </div>

          {preview.summary.errors > 0 && (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 ring-1 ring-inset ring-amber-200/70">
              Xətalı sətirlər ötürüləcək — istəsəniz faylı düzəldib yenidən
              yükləyin
            </p>
          )}

          {preview.rows.length === 0 ? (
            <EmptyState
              icon={FileSpreadsheet}
              title="Faylda sətir tapılmadı"
              hint="Şablona uyğun faylı yenidən yükləyin."
            />
          ) : (
            <DataTable columns={columns} data={preview.rows} />
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-stone-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={handleBack}
              disabled={commitMut.isPending}
            >
              Geri
            </Button>
            <Button
              type="button"
              onClick={() => void handleCommit()}
              disabled={importCount === 0 || commitMut.isPending}
              icon={
                commitMut.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : undefined
              }
            >
              {commitMut.isPending
                ? "İdxal olunur..."
                : `${importCount} sətri idxal et`}
            </Button>
          </div>
        </div>
      )}

      {step === "result" && (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 size={32} />
          </span>
          <div>
            <p className="text-lg font-bold text-stone-900">
              İdxal tamamlandı
            </p>
            <p className="mt-1 text-base text-stone-600">
              {result?.creates ?? 0} yeni mal, {result?.updates ?? 0} yenilənmə
            </p>
          </div>
          <Button type="button" onClick={onClose}>
            Bağla
          </Button>
        </div>
      )}
    </Modal>
  );
}
