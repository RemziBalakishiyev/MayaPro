import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./DataTable";

/**
 * FE#134 — `DataTable` arxa-fon (background) refetch xətası ilə uğursuz
 * olduqda, əgər artıq göstəriləcək DOĞRU (köhnə/keçərli) `data` mövcuddursa,
 * onu tam `InlineError` ekranı ilə ƏVƏZ ETMƏMƏLİDİR — mövcud cədvəl qalmalı,
 * üstündə yalnız kiçik "yenilənmə uğursuz oldu" xəbərdarlıq zolağı
 * göstərilməlidir. Tam `InlineError` YALNIZ `data` heç olmadıqda (ilk
 * yükləmə xətası, `data.length === 0`) görünməlidir (FE#127 TC-32.8
 * edge-case-inin həlli).
 */

interface Row {
  id: string;
  name: string;
}

const columns: ColumnDef<Row, unknown>[] = [
  { accessorKey: "name", header: "Ad" },
];

const rows: Row[] = [
  { id: "1", name: "Birinci" },
  { id: "2", name: "İkinci" },
];

describe("DataTable — arxa-fon refetch xətası (FE#134)", () => {
  it("isError=true, data BOŞDUR (ilk yükləmə xətası) → tam InlineError göstərir", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        isError
        onRetry={vi.fn()}
        errorMessage="Siyahı yüklənmədi"
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Siyahı yüklənmədi")).toBeInTheDocument();
    // Cədvəl/sətirlər render olunmayıb
    expect(screen.queryByText("Birinci")).not.toBeInTheDocument();
  });

  it("isError=true, AMMA əvvəl uğurla yüklənmiş data MÖVCUDDUR → cədvəl qalır, tam InlineError göstərilmir, xəbərdarlıq zolağı görünür", () => {
    const onRetry = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={rows}
        isError
        onRetry={onRetry}
        errorMessage="Siyahı yüklənmədi"
      />,
    );

    // Mövcud cədvəl sətirləri görünməyə davam edir
    expect(screen.getByText("Birinci")).toBeInTheDocument();
    expect(screen.getByText("İkinci")).toBeInTheDocument();

    // Tam InlineError mesajı YOX (data itmir/tam error ekranı göstərilmir)
    expect(screen.queryByText("Siyahı yüklənmədi")).not.toBeInTheDocument();

    // Əvəzinə kiçik xəbərdarlıq zolağı var
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/yenilənmə uğursuz oldu/i);
  });

  it("xəbərdarlıq zolağındakı 'Yenidən cəhd et' klik onRetry-ni çağırır", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={rows} isError onRetry={onRetry} />);

    await user.click(screen.getByRole("button", { name: /yenidən cəhd et/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("isError=false, data mövcuddur → normal cədvəl, alert YOX (regressiya)", () => {
    render(<DataTable columns={columns} data={rows} />);

    expect(screen.getByText("Birinci")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("isError=false, data=[] → normal EmptyState, alert YOX (regressiya)", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        emptyState={{ title: "Məlumat yoxdur" }}
      />,
    );

    expect(screen.getByText("Məlumat yoxdur")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  /**
   * FE#138 — `data` tipcə həmişə array olduğu üçün, uğurla yüklənmiş legitim
   * BOŞ siyahı + sonrakı arxa-fon (background) refetch xətası da `data=[]`
   * verir — köhnə `data.length === 0` proxy-si bunu "heç vaxt yüklənməyib"
   * halı ilə qarışdırıb tam `InlineError` göstərirdi. `hasLoadedOnce` prop-u
   * çağıran tərəfdən `true` ötürüldükdə düzgün nəticə: `EmptyState` +
   * kiçik `StaleDataBanner`, tam `InlineError` YOX.
   */
  it("isError=true, data=[] AMMA hasLoadedOnce=true (uğurla yüklənmiş boş nəticə) → EmptyState + StaleDataBanner, tam InlineError YOX", () => {
    const onRetry = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={[]}
        isError
        hasLoadedOnce
        onRetry={onRetry}
        errorMessage="Siyahı yüklənmədi"
        emptyState={{ title: "Məlumat yoxdur" }}
      />,
    );

    // Tam InlineError mesajı YOX
    expect(screen.queryByText("Siyahı yüklənmədi")).not.toBeInTheDocument();

    // EmptyState görünür
    expect(screen.getByText("Məlumat yoxdur")).toBeInTheDocument();

    // Kiçik xəbərdarlıq zolağı görünür
    expect(screen.getByRole("alert")).toHaveTextContent(
      /yenilənmə uğursuz oldu/i,
    );
  });

  it("isError=true, data=[], hasLoadedOnce ötürülməyib (undefined) → köhnə fallback davranışı: tam InlineError (geriyə uyğunluq)", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        isError
        onRetry={vi.fn()}
        errorMessage="Siyahı yüklənmədi"
        emptyState={{ title: "Məlumat yoxdur" }}
      />,
    );

    expect(screen.getByText("Siyahı yüklənmədi")).toBeInTheDocument();
    expect(screen.queryByText("Məlumat yoxdur")).not.toBeInTheDocument();
  });
});
