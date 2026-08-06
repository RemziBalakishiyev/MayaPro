import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./DataTable";
import { LocalTableSearch } from "./LocalTableSearch";

interface Row {
  ad: string;
  qiymet: string;
}

const columns: ColumnDef<Row, unknown>[] = [
  { accessorKey: "ad", header: "Ad" },
  { accessorKey: "qiymet", header: "Qiymət" },
];

describe("DataTable — vəziyyət dili", () => {
  it("yüklənərkən skeleton göstərir, sonsuz spinner yoxdur (F-41)", () => {
    render(<DataTable columns={columns} data={[]} isLoading />);
    expect(screen.getByRole("status")).toHaveAccessibleName("Məlumat yüklənir");
  });

  it("xəta halında InlineError + «Yenidən» göstərir, «boş siyahı» mesajı YOX (F-44)", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={[]}
        isError
        onRetry={onRetry}
        emptyState={{ title: "Mal yoxdur" }}
      />,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Siyahı yüklənmədi")).toBeInTheDocument();
    expect(screen.queryByText("Mal yoxdur")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /yenidən/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("boş nəticədə EmptyState göstərir", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        emptyState={{ title: "Mal yoxdur", description: "Filtri dəyişin" }}
      />,
    );
    expect(screen.getByText("Mal yoxdur")).toBeInTheDocument();
    expect(screen.getByText("Filtri dəyişin")).toBeInTheDocument();
  });

  it("məlumat olduqda sətirləri və səhifələmə düymələrini göstərir", () => {
    render(
      <DataTable
        columns={columns}
        data={[{ ad: "Sement", qiymet: "12,00 ₼" }]}
      />,
    );
    expect(screen.getByText("Sement")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /əvvəlki/i })).toBeDisabled();
  });
});

/**
 * FE#142 — `DataTable` arxa-fon (background) refetch xətası ilə uğursuz
 * olduqda, əgər artıq göstəriləcək DOĞRU (köhnə/keçərli) `data` mövcuddursa,
 * onu tam `InlineError` ekranı ilə ƏVƏZ ETMƏMƏLİDİR — mövcud cədvəl qalmalı,
 * üstündə yalnız kiçik "yenilənmə uğursuz oldu" xəbərdarlıq zolağı
 * göstərilməlidir. Tam `InlineError` YALNIZ göstəriləcək data heç uğurla
 * yüklənməyibsə görünməlidir. `hasLoadedOnce` prop-u "uğurla yüklənmiş BOŞ
 * siyahı + arxa-fon xətası" ilə "heç vaxt yüklənməyib" hallarını ayırd edir.
 */
describe("DataTable — arxa-fon refetch xətası (FE#142)", () => {
  const rows = [
    { ad: "Birinci", qiymet: "1,00 ₼" },
    { ad: "İkinci", qiymet: "2,00 ₼" },
  ];

  it("isError=true, AMMA əvvəl uğurla yüklənmiş data MÖVCUDDUR → cədvəl qalır, tam InlineError göstərilmir, xəbərdarlıq zolağı görünür", () => {
    render(
      <DataTable
        columns={columns}
        data={rows}
        isError
        onRetry={vi.fn()}
        errorMessage="Siyahı yüklənmədi"
      />,
    );

    expect(screen.getByText("Birinci")).toBeInTheDocument();
    expect(screen.getByText("İkinci")).toBeInTheDocument();
    expect(screen.queryByText("Siyahı yüklənmədi")).not.toBeInTheDocument();

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/yenilənmə uğursuz oldu/i);
  });

  it("xəbərdarlıq zolağındakı 'Yenidən' klik onRetry-ni çağırır", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={rows} isError onRetry={onRetry} />);

    await user.click(screen.getByRole("button", { name: /yenidən/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("isError=true, data=[], hasLoadedOnce=true (uğurla yüklənmiş boş nəticə) → EmptyState + StaleDataBanner, tam InlineError YOX", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        isError
        hasLoadedOnce
        onRetry={vi.fn()}
        errorMessage="Siyahı yüklənmədi"
        emptyState={{ title: "Məlumat yoxdur" }}
      />,
    );

    expect(screen.queryByText("Siyahı yüklənmədi")).not.toBeInTheDocument();
    expect(screen.getByText("Məlumat yoxdur")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      /yenilənmə uğursuz oldu/i,
    );
  });

  it("isError=true, data=[], hasLoadedOnce=false (heç vaxt yüklənməyib) → tam InlineError", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        isError
        hasLoadedOnce={false}
        onRetry={vi.fn()}
        errorMessage="Siyahı yüklənmədi"
        emptyState={{ title: "Məlumat yoxdur" }}
      />,
    );

    expect(screen.getByText("Siyahı yüklənmədi")).toBeInTheDocument();
    expect(screen.queryByText("Məlumat yoxdur")).not.toBeInTheDocument();
  });

  it("isError=true, data=[], hasLoadedOnce ötürülməyib → köhnə fallback davranışı: tam InlineError (geriyə uyğunluq)", () => {
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

describe("LocalTableSearch", () => {
  it("lokal axtarış placeholder-i qlobal axtarışdan fərqlidir (AC-14)", () => {
    render(<LocalTableSearch value="" onChange={() => {}} />);
    const input = screen.getByRole("textbox", { name: "Bu siyahıda axtar" });
    expect(input).toHaveAttribute("placeholder", "Bu siyahıda axtar...");
  });

  it("dəyər varsa təmizləmə düyməsi görünür", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<LocalTableSearch value="sement" onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Axtarışı təmizlə" }));
    expect(onChange).toHaveBeenCalledWith("");
  });
});
