import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./DataTable";
import { LocalTableSearch } from "./LocalTableSearch";
import { StatusBadge } from "./StatusBadge";

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

describe("StatusBadge", () => {
  it("rəngdən əlavə ikon + mətn verir (AC-10)", () => {
    const { container } = render(
      <StatusBadge tone="warning">Yoxlanmalıdır</StatusBadge>,
    );
    expect(screen.getByText("Yoxlanmalıdır")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeTruthy();
  });
});
