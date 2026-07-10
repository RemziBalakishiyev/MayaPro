import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, Wallet, TrendingUp, Package } from "lucide-react";
import { PageHead } from "@/components/layout/PageHead";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { Drawer } from "@/components/ui/Drawer";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable } from "@/components/ui/DataTable";
import { useToast } from "@/components/ui/toast-store";
import { fmtMoney } from "@/lib/format";

export const Route = createFileRoute("/_app/ui-demo")({
  component: UiDemoPage,
});

interface DemoRow {
  id: number;
  name: string;
  category: string;
  qty: number;
  price: number;
  status: string;
}

const STATUSES = ["Stokda var", "Azalır", "Bitib", "Satılmır", "Ziyana satılır"];
const CATEGORIES = ["Geyim", "Ayaqqabı", "Aksesuar", "Ev əşyaları"];

function makeRows(): DemoRow[] {
  return Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    name: `Məhsul ${i + 1}`,
    category: CATEGORIES[i % CATEGORIES.length],
    qty: ((i * 7) % 40) + 1,
    price: ((i * 13) % 90) + 10 + i / 10,
    status: STATUSES[i % STATUSES.length],
  }));
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wide text-stone-400">
        {title}
      </h2>
      {children}
    </section>
  );
}

function UiDemoPage() {
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const rows = useMemo(makeRows, []);

  const columns = useMemo<ColumnDef<DemoRow, unknown>[]>(
    () => [
      { accessorKey: "name", header: "Mal adı" },
      { accessorKey: "category", header: "Kateqoriya" },
      { accessorKey: "qty", header: "Say" },
      {
        accessorKey: "price",
        header: "Qiymət",
        cell: (c) => fmtMoney(c.getValue() as number),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: (c) => <Badge>{c.getValue() as string}</Badge>,
      },
    ],
    [],
  );

  return (
    <div className="space-y-8 pb-16">
      <PageHead
        title="UI Demo"
        subtitle="Bütün paylaşılan UI primitivlərinin vizual nümayişi"
        actions={<Button icon={<Plus size={16} />}>Nümunə düymə</Button>}
      />

      <Section title="Düymələr — variantlar">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="warn">Warn</Button>
          <Button disabled>Deaktiv</Button>
        </div>
      </Section>

      <Section title="Düymələr — ölçü və ikon">
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" icon={<Plus size={14} />}>
            Kiçik
          </Button>
          <Button size="md" icon={<Pencil size={16} />}>
            Orta
          </Button>
          <Button size="lg" icon={<Wallet size={18} />}>
            Böyük
          </Button>
          <Button variant="danger" size="sm" icon={<Trash2 size={14} />}>
            Sil
          </Button>
        </div>
      </Section>

      <Section title="Badge-lər">
        <div className="flex flex-wrap items-center gap-2">
          {STATUSES.map((s) => (
            <Badge key={s}>{s}</Badge>
          ))}
          <Badge>Nağd</Badge>
          <Badge>Kart</Badge>
          <Badge>Nisyə</Badge>
          <Badge>Borclu</Badge>
          <Badge>Ödənilib</Badge>
        </div>
      </Section>

      <Section title="StatCard-lar">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Bugünkü satış"
            value={fmtMoney(1250)}
            sub="12 əməliyyat"
            icon={TrendingUp}
            tone="green"
          />
          <StatCard
            label="Kassada nağd"
            value={fmtMoney(3480)}
            icon={Wallet}
            tone="default"
          />
          <StatCard
            label="Ümumi borc"
            value={fmtMoney(8400)}
            sub="6 müştəri"
            tone="red"
          />
          <StatCard
            label="Azalan stok"
            value="4 mal"
            icon={Package}
            tone="amber"
          />
        </div>
      </Section>

      <Section title="Form sahələri">
        <Card className="max-w-xl">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mal adı" required>
              <Input placeholder="məs. Kişi köynəyi" />
            </Field>
            <Field label="Kateqoriya">
              <Select defaultValue="">
                <option value="" disabled>
                  Seçin
                </option>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Qiymət" hint="AZN ilə daxil edin">
              <Input type="number" placeholder="0.00" />
            </Field>
            <Field label="Miqdar" error="Bu sahə mütləqdir">
              <Input type="number" placeholder="0" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Qeyd">
                <Textarea placeholder="Əlavə qeydlər..." />
              </Field>
            </div>
          </div>
        </Card>
      </Section>

      <Section title="Overlay-lar">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            Modal aç
          </Button>
          <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
            Drawer aç
          </Button>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            Təsdiq modalı
          </Button>
        </div>
      </Section>

      <Section title="Toast bildirişləri">
        <div className="flex flex-wrap gap-3">
          <Button
            variant="primary"
            onClick={() => toast.success("Uğurla yadda saxlanıldı")}
          >
            Success toast
          </Button>
          <Button
            variant="danger"
            onClick={() => toast.error("Xəta baş verdi")}
          >
            Error toast
          </Button>
          <Button variant="secondary" onClick={() => toast.info("Məlumat mesajı")}>
            Info toast
          </Button>
        </div>
      </Section>

      <Section title="EmptyState">
        <EmptyState
          title="Heç bir mal tapılmadı"
          hint="Filtrləri dəyişin və ya yeni mal əlavə edin"
          action={<Button icon={<Plus size={16} />}>Yeni mal</Button>}
        />
      </Section>

      <Section title="DataTable — sıralama və səhifələmə (15 sətir)">
        <DataTable
          columns={columns}
          data={rows}
          emptyState={{ title: "Məlumat yoxdur" }}
        />
      </Section>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nümunə modal"
      >
        <p className="text-sm text-stone-600">
          Bu modal overlay klik və ya Escape ilə bağlanır.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>
            Bağla
          </Button>
          <Button
            onClick={() => {
              setModalOpen(false);
              toast.success("Modal təsdiqləndi");
            }}
          >
            Təsdiq et
          </Button>
        </div>
      </Modal>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Nümunə drawer"
      >
        <p className="text-sm text-stone-600">
          Sağdan açılan panel — detal görünüşləri üçün istifadə olunur.
        </p>
      </Drawer>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => toast.success("Silindi")}
        title="Silinməni təsdiqləyin"
        message="Bu əməliyyatı geri qaytarmaq mümkün deyil. Davam edilsin?"
        confirmText="Sil"
        danger
      />
    </div>
  );
}
