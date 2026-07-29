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
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { useToast } from "@/components/ui/toast-store";
import { ApiError } from "@/lib/api-client";
import { downloadFile } from "@/lib/download";
import { cn } from "@/lib/cn";
import {
  useImportPreview,
  useImportCommit,
  useInvalidateAfterImport,
} from "../queries";
import type { ImportPreviewResponse, ImportRowStatus } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Sətir statusuna görə rəng — create=yaşıl, update=mavi, error=qırmızı. */
const ROW_STATUS: Record<ImportRowStatus, { label: string; className: string }> = {
  create: {
    label: "Yeni",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200/70",
  },
  update: {
    label: "Yenilənəcək",
    className: "bg-sky-50 text-sky-700 ring-sky-200/70",
  },
  error: {
    label: "Xəta",
    className: "bg-red-50 text-red-700 ring-red-200/70",
  },
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

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [commitResult, setCommitResult] = useState<{
    created: number;
    updated: number;
  } | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  const previewMut = useImportPreview();
  const commitMut = useImportCommit();
  const invalidateAfterImport = useInvalidateAfterImport();

  // Modal hər açılışda təmiz vəziyyətdən başlasın.
  useEffect(() => {
    if (!open) return;
    setStep(1);
    setFileError(null);
    setDragActive(false);
    setPreview(null);
    setCommitResult(null);
    previewMut.reset();
    commitMut.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const resetToStep1 = () => {
    setStep(1);
    setFileError(null);
    setPreview(null);
    previewMut.reset();
    commitMut.reset();
  };

  const handleClose = () => {
    // AC-11: nəticə uğurla göstərilib bağlanandan sonra keş təzələnir.
    if (step === 3 && commitResult) {
      invalidateAfterImport();
    }
    resetToStep1();
    setCommitResult(null);
    onClose();
  };

  const runPreview = async (file: File) => {
    try {
      const res = await previewMut.mutateAsync(file);
      setPreview(res);
      setStep(2);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Fayl oxunmadı, yenidən cəhd edin";
      toast.error(message);
    }
  };

  const handleFileSelected = (file: File | null) => {
    setFileError(null);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setFileError("Yalnız .xlsx faylları qəbul olunur");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError("Fayl 5MB-dan böyük ola bilməz");
      return;
    }
    void runPreview(file);
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = ""; // eyni faylı təkrar seçməyə imkan ver
    handleFileSelected(file);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
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
      setCommitResult(res);
      setStep(3);
    } catch (e) {
      if (e instanceof ApiError && e.status === 410) {
        toast.error(e.message);
        resetToStep1();
        return;
      }
      toast.error(e instanceof Error ? e.message : "İdxal tamamlanmadı");
    }
  };

  const title =
    step === 1
      ? "Excel ilə mal idxalı — Addım 1/3"
      : step === 2
        ? "Excel ilə mal idxalı — Addım 2/3"
        : "Excel ilə mal idxalı — Addım 3/3";

  return (
    <Modal open={open} onClose={handleClose} title={title} wide>
      {step === 1 && (
        <div>
          <div
            onClick={() => !previewMut.isPending && fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              if (!previewMut.isPending) setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
              dragActive
                ? "border-emerald-400 bg-emerald-50/40"
                : "border-stone-300 bg-stone-50 hover:border-emerald-400 hover:bg-emerald-50/40",
              previewMut.isPending && "pointer-events-none opacity-60",
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={onInputChange}
            />
            {previewMut.isPending ? (
              <>
                <Loader2 size={28} className="animate-spin text-emerald-600" />
                <p className="text-sm font-semibold text-stone-600">
                  Fayl yoxlanılır...
                </p>
              </>
            ) : (
              <>
                <UploadCloud size={28} className="text-stone-400" />
                <p className="text-sm font-semibold text-stone-700">
                  Faylı bura sürüşdürün və ya seçmək üçün klikləyin
                </p>
                <p className="text-xs text-stone-400">
                  Yalnız .xlsx formatı, maksimum 5MB
                </p>
              </>
            )}
          </div>

          {fileError && (
            <p role="alert" className="mt-2 text-sm font-medium text-red-600">
              {fileError}
            </p>
          )}

          <button
            type="button"
            onClick={() => void downloadTemplate()}
            disabled={downloadingTemplate || previewMut.isPending}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            {downloadingTemplate ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
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
              tone="indigo"
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

          <div className="mt-4 max-h-72 overflow-y-auto rounded-2xl border border-stone-200">
            <table className="min-w-full divide-y divide-stone-200 text-sm">
              <thead className="sticky top-0 bg-stone-50">
                <tr>
                  <th className="px-3 py-2 text-left font-bold text-stone-500">
                    Sətir
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-stone-500">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-stone-500">
                    Mal
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-stone-500">
                    Qeyd
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {preview.rows.map((row) => (
                  <tr
                    key={row.rowNumber}
                    className={row.status === "error" ? "bg-red-50/30" : undefined}
                  >
                    <td className="px-3 py-2 tabular-nums text-stone-500">
                      {row.rowNumber}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                          ROW_STATUS[row.status].className,
                        )}
                      >
                        {ROW_STATUS[row.status].label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-stone-700">
                      {rowDisplayName(row.data)}
                    </td>
                    <td className="px-3 py-2">
                      {row.status === "error" && row.error ? (
                        <span className="font-medium text-red-600">
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

          {preview.summary.errors > 0 && (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 ring-1 ring-inset ring-amber-200/70">
              Xətalı sətirlər ötürüləcək — istəsən faylı düzəldib yenidən yüklə
            </p>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={resetToStep1}>
              Geri
            </Button>
            <Button
              onClick={() => void handleCommit()}
              disabled={
                commitMut.isPending ||
                preview.summary.creates + preview.summary.updates === 0
              }
              icon={
                commitMut.isPending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Upload size={15} />
                )
              }
            >
              {preview.summary.creates + preview.summary.updates} sətri idxal
              et
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={30} />
          </div>
          <p className="text-lg font-bold text-stone-900">İdxal tamamlandı</p>
          <p className="text-sm text-stone-600">
            {commitResult?.created ?? 0} yeni mal, {commitResult?.updated ?? 0}{" "}
            yenilənmə
          </p>
          <Button onClick={handleClose} className="mt-2">
            Bağla
          </Button>
        </div>
      )}
    </Modal>
  );
}
