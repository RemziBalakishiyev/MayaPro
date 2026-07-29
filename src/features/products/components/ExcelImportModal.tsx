import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import {
  UploadCloud,
  Download,
  Loader2,
  PlusCircle,
  RefreshCcw,
  AlertTriangle,
  Tags,
  CheckCircle2,
  Upload,
  FileSpreadsheet,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/toast-store";
import { ApiError } from "@/lib/api-client";
import { downloadFile } from "@/lib/download";
import { cn } from "@/lib/cn";
import {
  useImportPreview,
  useImportCommit,
  useInvalidateAfterImport,
} from "../queries";
import type {
  ImportCommitResponse,
  ImportPreviewResponse,
  ImportRowStatus,
} from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Backend limiti ilə eyni: 5 MB. */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** .xlsx faylının MIME tipi — fayl seçim dialoqunda filtr üçün. */
const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Sətir statusu → Az etiket + Badge rəng açarı (yaşıl / mavi / qırmızı). */
const ROW_STATUS: Record<ImportRowStatus, { label: string; tone: string }> = {
  create: { label: "Yeni", tone: "İdxal: Yeni" },
  update: { label: "Yenilənəcək", tone: "İdxal: Yenilənəcək" },
  error: { label: "Xəta", tone: "İdxal: Xəta" },
};

/** Önizləmə sətrindəki geniş `data` obyektindən göstərmək üçün mal adını çıxarır. */
const rowDisplayName = (data: Record<string, unknown>): string => {
  const candidate = data.name ?? data.Name ?? data["Mal adı"] ?? data.title;
  return typeof candidate === "string" && candidate.trim() ? candidate : "—";
};

/**
 * Excel ilə mal idxalı — 3 addımlı modal.
 * 1) Fayl seç/sürüşdür → avtomatik önizləmə sorğusu
 * 2) Önizləmə: xülasə kartları + sətir cədvəli → təsdiq
 * 3) Nəticə: uğur ekranı, bağlananda keş invalidasiyası
 */
export function ExcelImportModal({ open, onClose }: Props) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** Modal bağlandıqdan sonra gələn cavab state-i yenidən yazmasın. */
  const closedRef = useRef(false);
  /** Yalnız ən son fayl seçiminin cavabı qəbul edilsin (köhnə cavab atılır). */
  const requestIdRef = useRef(0);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [commitResult, setCommitResult] = useState<ImportCommitResponse | null>(
    null,
  );
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  const previewMut = useImportPreview();
  const commitMut = useImportCommit();
  const invalidateAfterImport = useInvalidateAfterImport();

  /** Addım 1-ə tam sıfırlama: fayl, önizləmə və gözləyən cavablar ləğv olunur. */
  const resetToStep1 = () => {
    requestIdRef.current += 1;
    setStep(1);
    setFileError(null);
    setDragActive(false);
    setPreview(null);
    previewMut.reset();
    commitMut.reset();
  };

  // Modal hər açılışda təmiz vəziyyətdən başlasın.
  useEffect(() => {
    if (!open) return;
    closedRef.current = false;
    resetToStep1();
    setCommitResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = () => {
    closedRef.current = true;
    // AC-11: yalnız uğurlu idxaldan (Addım 3) sonra keş təzələnir —
    // uğursuz commit-dən sonra bağlananda lazımsız invalidasiya olmur.
    if (step === 3 && commitResult) invalidateAfterImport();
    resetToStep1();
    setCommitResult(null);
    onClose();
  };

  const runPreview = async (file: File) => {
    const reqId = ++requestIdRef.current;
    /** Cavab köhnədirsə (modal bağlanıb / yeni fayl seçilib) state-ə yazılmır. */
    const stale = () => closedRef.current || reqId !== requestIdRef.current;
    try {
      const res = await previewMut.mutateAsync(file);
      if (stale()) return;
      setPreview(res);
      setStep(2);
    } catch (e) {
      if (stale()) return;
      // 400 (boş fayl / 1000+ sətir / yanlış başlıqlar) və 410 mesajları
      // backend-dən gəlir — həm inline, həm toast kimi göstərilir.
      const message =
        e instanceof Error ? e.message : "Fayl oxunmadı, yenidən cəhd edin";
      setFileError(message);
      toast.error(message);
    }
  };

  const handleFileSelected = (file: File | null) => {
    setFileError(null);
    if (!file) return;
    // AC-5: uzantı yoxlanışı hərf registrindən asılı deyil (.XLSX də keçir).
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setFileError("Yalnız .xlsx faylları qəbul olunur");
      return;
    }
    // AC-4: limitdən böyük fayl üçün şəbəkə sorğusu getmir.
    if (file.size > MAX_FILE_SIZE) {
      setFileError("Fayl 5 MB-dan böyük ola bilməz");
      return;
    }
    // Qeyd: boş fayl / 1000+ sətir / yanlış başlıq yoxlanışları backend-dədir,
    // mesajlar 400 cavabından gəldiyi kimi göstərilir.
    void runPreview(file);
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = ""; // eyni faylı təkrar seçməyə imkan ver
    handleFileSelected(file);
  };

  const onDrop = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (previewMut.isPending) return;
    handleFileSelected(e.dataTransfer.files?.[0] ?? null);
  };

  const downloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      await downloadFile(
        "/api/exports/products-template.xlsx",
        "mallar-shablon.xlsx",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Şablon endirilmədi");
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleCommit = async () => {
    if (!preview) return;
    try {
      const res = await commitMut.mutateAsync(preview.importToken);
      if (closedRef.current) {
        // İstifadəçi gözləmə anında modalı bağladı: nəticə ekranı göstərilmir,
        // amma məlumat dəyişdiyi üçün keş yenə də təzələnməlidir.
        invalidateAfterImport();
        return;
      }
      setCommitResult(res);
      setStep(3);
    } catch (e) {
      if (closedRef.current) return;
      // AC-12: token vaxtı keçib → avtomatik Addım 1, state sıfırlanır.
      if (e instanceof ApiError && e.status === 410) {
        toast.error(e.message);
        resetToStep1();
        setFileError(e.message);
        return;
      }
      toast.error(e instanceof Error ? e.message : "İdxal tamamlanmadı");
    }
  };

  /** AC-9: yalnız yaradılacaq/yenilənəcək sətirlər idxal olunur. */
  const importableCount = preview
    ? preview.summary.creates + preview.summary.updates
    : 0;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Excel ilə mal idxalı — Addım ${step}/3`}
      wide
    >
      {step === 1 && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept={`.xlsx,${XLSX_MIME}`}
            className="hidden"
            onChange={onInputChange}
          />

          {/* Klaviatura ilə əlçatan olsun deyə div yox, real <button>. */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={previewMut.isPending}
            aria-busy={previewMut.isPending}
            aria-describedby="import-file-hint"
            onDragOver={(e) => {
              e.preventDefault();
              if (!previewMut.isPending) setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            className={cn(
              "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20",
              "disabled:cursor-not-allowed disabled:opacity-60",
              dragActive
                ? "border-emerald-400 bg-emerald-50/40"
                : "border-stone-300 bg-stone-50 hover:border-emerald-400 hover:bg-emerald-50/40",
            )}
          >
            {previewMut.isPending ? (
              <>
                <Loader2
                  size={28}
                  aria-hidden
                  className="animate-spin text-emerald-600"
                />
                <span
                  role="status"
                  className="text-sm font-semibold text-stone-600"
                >
                  Fayl yoxlanılır...
                </span>
              </>
            ) : (
              <>
                <UploadCloud size={28} aria-hidden className="text-stone-400" />
                <span className="text-sm font-semibold text-stone-700">
                  Faylı bura sürüşdürün və ya seçmək üçün klikləyin
                </span>
              </>
            )}
            <span id="import-file-hint" className="text-xs text-stone-400">
              Yalnız .xlsx formatı, maksimum 5 MB
            </span>
          </button>

          {fileError && (
            <p role="alert" className="mt-2 text-sm font-medium text-red-600">
              {fileError}
            </p>
          )}

          <button
            type="button"
            onClick={() => void downloadTemplate()}
            disabled={downloadingTemplate || previewMut.isPending}
            className="mt-4 inline-flex min-h-[38px] items-center gap-1.5 rounded-lg px-1 text-sm font-semibold text-emerald-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {downloadingTemplate ? (
              <Loader2 size={14} aria-hidden className="animate-spin" />
            ) : (
              <Download size={14} aria-hidden />
            )}
            Şablonu endir
          </button>
        </div>
      )}

      {step === 2 && preview && (
        <div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Yeni"
              value={preview.summary.creates}
              tone="green"
              icon={PlusCircle}
            />
            <StatCard
              label="Yenilənəcək"
              value={preview.summary.updates}
              tone="sky"
              icon={RefreshCcw}
            />
            <StatCard
              label="Xətalı"
              value={preview.summary.errors}
              tone="red"
              icon={AlertTriangle}
            />
            <StatCard
              label="Yeni kateqoriyalar"
              value={preview.summary.newCategories.length}
              sub={
                preview.summary.newCategories.length
                  ? preview.summary.newCategories.join(", ")
                  : "Yoxdur"
              }
              tone="amber"
              icon={Tags}
            />
          </div>

          {preview.rows.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={FileSpreadsheet}
                title="Faylda sətir tapılmadı"
                hint="Şablonu endirib məlumatları doldurun, sonra yenidən yükləyin."
              />
            </div>
          ) : (
            // Uzun cədvəl: hər iki oxda sürüşdürmə + sabit başlıq (mobil daşma olmasın).
            <div className="mt-4 max-h-72 overflow-auto rounded-2xl border border-stone-200">
              <table className="min-w-full divide-y divide-stone-200 text-sm">
                <caption className="sr-only">
                  İdxal önizləməsi: sətir nömrəsi, status, mal adı və qeyd
                </caption>
                <thead className="sticky top-0 z-10 bg-stone-50">
                  <tr>
                    <th
                      scope="col"
                      className="whitespace-nowrap border-b border-stone-200 px-3 py-2 text-left font-bold text-stone-500"
                    >
                      Sətir
                    </th>
                    <th
                      scope="col"
                      className="whitespace-nowrap border-b border-stone-200 px-3 py-2 text-left font-bold text-stone-500"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="whitespace-nowrap border-b border-stone-200 px-3 py-2 text-left font-bold text-stone-500"
                    >
                      Mal
                    </th>
                    <th
                      scope="col"
                      className="whitespace-nowrap border-b border-stone-200 px-3 py-2 text-left font-bold text-stone-500"
                    >
                      Qeyd
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {preview.rows.map((row) => (
                    <tr
                      key={row.rowNumber}
                      className={
                        row.status === "error" ? "bg-red-50/30" : undefined
                      }
                    >
                      <td className="px-3 py-2 align-top tabular-nums text-stone-500">
                        {row.rowNumber}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <Badge tone={ROW_STATUS[row.status].tone}>
                          {ROW_STATUS[row.status].label}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 align-top text-stone-700">
                        {rowDisplayName(row.data)}
                      </td>
                      <td className="px-3 py-2 align-top">
                        {row.status === "error" && row.error ? (
                          <span className="font-medium break-words text-red-600">
                            {row.error}
                          </span>
                        ) : (
                          <span className="text-stone-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {preview.summary.errors > 0 && (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 ring-1 ring-inset ring-amber-200/70">
              Xətalı sətirlər ötürüləcək — istəsən faylı düzəldib yenidən yüklə
            </p>
          )}

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            {/* Commit gedərkən geri qayıtmaq state-i pozar → deaktiv. */}
            <Button
              variant="secondary"
              onClick={resetToStep1}
              disabled={commitMut.isPending}
            >
              Geri
            </Button>
            <Button
              onClick={() => void handleCommit()}
              disabled={commitMut.isPending || importableCount === 0}
              icon={
                commitMut.isPending ? (
                  <Loader2 size={15} aria-hidden className="animate-spin" />
                ) : (
                  <Upload size={15} aria-hidden />
                )
              }
            >
              {importableCount > 0
                ? `${importableCount} sətri idxal et`
                : "İdxal et"}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={30} aria-hidden />
          </div>
          <div role="status">
            <p className="text-lg font-bold text-stone-900">İdxal tamamlandı</p>
            <p className="mt-1 text-sm text-stone-600">
              {commitResult?.created ?? 0} yeni mal,{" "}
              {commitResult?.updated ?? 0} yenilənmə
            </p>
          </div>
          <Button onClick={handleClose} className="mt-2">
            Bağla
          </Button>
        </div>
      )}
    </Modal>
  );
}
