# Sədərək Sistem — Frontend Arxitekturası

**Stack:** React 18 + Vite + Tailwind CSS + TanStack (Router, Query, Table) + Zustand + React Hook Form + Zod + Recharts

Bu sənəd tək-fayl MVP-ni (sederek-sistem.jsx) real, miqyaslana bilən lokal layihəyə çevirmək üçün tam yol xəritəsidir. Arxitektura **feature-based** prinsipi üzərində qurulub — hər biznes modulu (mallar, satış, borclar...) öz qovluğunda yaşayır, backend gələndə yalnız `api/` qatı dəyişir.

---

## 1. Layihənin yaradılması

```bash
npm create vite@latest sederek-sistem -- --template react-ts
cd sederek-sistem

# Əsas paketlər
npm i @tanstack/react-router @tanstack/react-query @tanstack/react-table
npm i zustand react-hook-form zod @hookform/resolvers
npm i recharts lucide-react clsx date-fns

# Tailwind
npm i -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Dev alətləri
npm i -D @tanstack/router-plugin @tanstack/react-query-devtools
npm i -D eslint prettier prettier-plugin-tailwindcss
```

> **Qeyd:** TypeScript template seçdim — data modelləri (Product, Sale, Customer...) artıq spec-də dəqiq müəyyən olunduğu üçün TS pulsuz təhlükəsizlik verir. İstəsəniz `--template react` ilə JS də ola bilər, struktur eynidir.

---

## 2. Qovluq strukturu (tam)

```
sederek-sistem/
├── index.html
├── vite.config.ts              # TanStack Router plugin burada qoşulur
├── tailwind.config.ts
├── .env                        # VITE_API_URL=... (gələcək backend üçün)
│
└── src/
    ├── main.tsx                # Root: QueryClientProvider + RouterProvider
    ├── index.css               # Tailwind directives + CSS dəyişənləri
    │
    ├── routes/                 # TanStack Router — file-based routing
    │   ├── __root.tsx          # Root layout: auth yoxlaması + <Outlet/>
    │   ├── login.tsx           # /login
    │   ├── _app.tsx            # Qorunan layout: Sidebar + Topbar + <Outlet/>
    │   ├── _app.index.tsx      # /            → Dashboard
    │   ├── _app.mallar.tsx     # /mallar      → Məhsullar cədvəli
    │   ├── _app.satis.tsx      # /satis       → Sürətli satış ekranı
    │   ├── _app.borclar.tsx    # /borclar     → Nisyə borclar (müştərilər)
    │   ├── _app.tedarukculer.tsx
    │   ├── _app.xercler.tsx
    │   ├── _app.gun-sonu.tsx
    │   ├── _app.hesabatlar.tsx
    │   ├── _app.iscilər.tsx    # /iscilər (və ya /workers)
    │   └── _app.ayarlar.tsx
    │
    ├── features/               # ⭐ Hər biznes modulu öz qovluğunda
    │   ├── auth/
    │   │   ├── api.ts          # login mock → sonra real API
    │   │   ├── store.ts        # Zustand: user, token, logout
    │   │   └── components/
    │   │       └── LoginForm.tsx
    │   │
    │   ├── products/
    │   │   ├── api.ts          # getProducts, createProduct, updateProduct, adjustStock
    │   │   ├── queries.ts      # useProducts(), useCreateProduct() — TanStack Query hooks
    │   │   ├── types.ts        # Product interface
    │   │   ├── lib.ts          # calcRealCost, productStatus, profitPercent
    │   │   └── components/
    │   │       ├── ProductsTable.tsx      # TanStack Table
    │   │       ├── ProductFilters.tsx     # axtarış, kateqoriya, status, anbar
    │   │       ├── ProductForm.tsx        # RHF + Zod, canlı maya hesablaması
    │   │       ├── ProductStatusBadge.tsx
    │   │       └── StockAdjustModal.tsx
    │   │
    │   ├── sales/
    │   │   ├── api.ts
    │   │   ├── queries.ts      # useSales(), useCreateSale() → invalidates products+customers
    │   │   ├── types.ts
    │   │   ├── lib.ts          # satış hesablamaları, ziyan yoxlaması
    │   │   └── components/
    │   │       ├── QuickSaleScreen.tsx
    │   │       ├── SaleCalculator.tsx     # live cəm, endirim, qazanc
    │   │       ├── LossWarning.tsx        # "Bu qiymətə satsan ziyana düşürsən"
    │   │       └── TodaySalesList.tsx
    │   │
    │   ├── customers/
    │   │   ├── api.ts / queries.ts / types.ts
    │   │   ├── lib.ts          # waLink(phone, debt) — WhatsApp linki
    │   │   └── components/
    │   │       ├── CustomersTable.tsx
    │   │       ├── CustomerDrawer.tsx     # detal: mallar, borc tarixçəsi
    │   │       ├── PaymentModal.tsx
    │   │       └── NewCustomerModal.tsx
    │   │
    │   ├── suppliers/          # customers ilə eyni struktur
    │   ├── expenses/
    │   │   └── ...             # xərc mala bağlıdırsa → products query invalidate
    │   ├── day-end/
    │   │   ├── lib.ts          # expectedCash, difference hesablamaları
    │   │   └── components/DayEndCard.tsx, ClosingHistory.tsx
    │   ├── reports/
    │   │   └── components/     # SalesChart, ProfitChart, ExpensePie, TopProductsBar
    │   ├── employees/
    │   └── settings/
    │       └── store.ts        # Zustand persist: valyuta, minStok, dil, mağaza adı
    │
    ├── components/             # Feature-dən asılı olmayan paylaşılan UI
    │   ├── ui/                 # Primitivlər (MVP-dəki hazır komponentlər)
    │   │   ├── Button.tsx
    │   │   ├── Input.tsx / Select.tsx / Textarea.tsx / Field.tsx
    │   │   ├── Modal.tsx / Drawer.tsx / ConfirmModal.tsx
    │   │   ├── Badge.tsx
    │   │   ├── Card.tsx / StatCard.tsx
    │   │   ├── EmptyState.tsx / Spinner.tsx
    │   │   ├── Toast.tsx       # + useToast hook (və ya sonner paketi)
    │   │   └── DataTable.tsx   # ⭐ TanStack Table üzərində generik wrapper
    │   └── layout/
    │       ├── Sidebar.tsx     # nav + azalan stok badge + "Kassada olmalı"
    │       ├── Topbar.tsx
    │       └── PageHead.tsx
    │
    ├── lib/                    # Qlobal utility-lər
    │   ├── format.ts           # fmtMoney → "1,250.00 AZN", fmtDate
    │   ├── api-client.ts       # fetch wrapper (baseURL, error handling)
    │   └── cn.ts               # clsx helper
    │
    ├── mocks/                  # ⭐ Mock data qatı — backend gələnə qədər
    │   ├── db.ts               # localStorage-da saxlanılan "verilənlər bazası"
    │   ├── seed.ts             # MVP-dəki mock data (10 məhsul, satışlar...)
    │   └── handlers.ts         # süni gecikməli CRUD funksiyaları
    │
    └── types/
        └── index.ts            # Ortaq tiplər: PaymentType, Role, ActivityLog...
```

---

## 3. Arxitektura qərarları və səbəbləri

### 3.1 Feature-based, layer-based deyil

Bütün `components/`, `hooks/`, `api/` qovluqlarını qlobal etmək əvəzinə hər modul öz içində tam yaşayır. Səbəb: "Satış" səhifəsində dəyişiklik etmək istəyəndə **bir qovluq** açırsınız. Modullar arası asılılıq yalnız `types/` və `components/ui/` üzərindən gedir.

**Qızıl qayda:** bir feature başqa feature-in daxilinə import etmir. Satış müştəri borcunu dəyişirsə, bunu API/mock qatında edir və TanStack Query cache invalidation ilə bildirir (aşağıda).

### 3.2 State-in bölünməsi — kim nəyə cavabdehdir

| State növü                             | Alət                          | Nümunə                                         |
| -------------------------------------- | ----------------------------- | ---------------------------------------------- |
| **Server state** (bütün biznes datası) | TanStack Query                | mallar, satışlar, müştərilər, borclar, xərclər |
| **Qlobal client state** (az, davamlı)  | Zustand + persist             | auth user, ayarlar (valyuta, min stok, dil)    |
| **Lokal UI state**                     | useState                      | modal açıq/bağlı, seçilmiş sətir, form draft   |
| **Form state**                         | React Hook Form + Zod         | ProductForm, SaleForm, ExpenseForm             |
| **URL state**                          | TanStack Router search params | cədvəl filterləri, səhifələmə                  |

MVP-dəki tək böyük reducer-in yerini bu bölgü tutur. Ən vacib dəyişiklik: **mallar/satışlar artıq client state deyil** — mock olsa belə "server datası" kimi Query üzərindən keçir. Backend gələndə komponentlərdə heç nə dəyişmir.

### 3.3 Mock API qatı — backend-ə keçidin sığortası

```ts
// features/products/api.ts
import { db } from "@/mocks/db";

const USE_MOCK = !import.meta.env.VITE_API_URL;

export const productsApi = {
  list: () => (USE_MOCK ? db.products.list() : apiClient.get("/products")),
  create: (p: NewProduct) =>
    USE_MOCK ? db.products.create(p) : apiClient.post("/products", p),
  // ...
};
```

`mocks/db.ts` localStorage-da saxlayır (səhifə yenilənəndə data itmir) və `await sleep(300)` ilə real şəbəkə hissi verir — loading/error state-ləri əvvəldən düzgün test olunur.

### 3.4 Biznes qaydaları harada yaşayır

MVP-dəki 9 qayda iki yerə bölünür:

**Təmiz hesablamalar → `features/*/lib.ts`** (test yazmaq asan):

```ts
// features/products/lib.ts
export const calcRealCost = (
  purchase: number,
  qty: number,
  expenses: ExpenseBreakdown,
) => (qty > 0 ? (purchase * qty + totalExpenses(expenses)) / qty : 0);

// features/day-end/lib.ts
export const expectedCash = (
  opening: number,
  cashSales: number,
  expenses: number,
) => opening + cashSales - expenses;
```

**Yan təsirli qaydalar → mutation + invalidation:**

```ts
// features/sales/queries.ts
export const useCreateSale = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: salesApi.create, // mock qatı stoku azaldır, nisyədirsə borcu artırır
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["products"] }); // stok dəyişdi
      qc.invalidateQueries({ queryKey: ["customers"] }); // borc dəyişə bilər
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};
```

Beləliklə "satış → stok azalır → müştəri borcu artır" zənciri komponentlərdə deyil, data qatında yaşayır — backend gələndə bu məntiq serverə köçür, frontend-də yalnız invalidation qalır.

### 3.5 TanStack Router — niyə file-based

`routes/` qovluğundakı fayl adları avtomatik route ağacına çevrilir (vite plugin ilə). `_app.tsx` **pathless layout**-dur: sidebar+topbar burada render olunur, bütün qorunan səhifələr onun `<Outlet/>`-inə düşür. Auth yoxlaması:

```ts
// routes/_app.tsx
export const Route = createFileRoute("/_app")({
  beforeLoad: () => {
    if (!useAuthStore.getState().user) throw redirect({ to: "/login" });
  },
  component: AppLayout,
});
```

Cədvəl filterləri URL-də saxlanır (`/mallar?status=azalir&kat=geyim`) — səhifəni paylaşmaq/yeniləmək filterləri itirmir:

```ts
export const Route = createFileRoute("/_app/mallar")({
  validateSearch: z.object({
    q: z.string().optional(),
    status: z
      .enum(["stokda", "azalir", "bitib", "satilmir", "ziyan"])
      .optional(),
    kat: z.string().optional(),
  }),
});
```

### 3.6 TanStack Table — bir generik `DataTable`

Mallar, müştərilər, təchizatçılar, xərclər, işçilər — hamısı eyni `DataTable` komponentindən istifadə edir; hər feature yalnız öz `columns` tərifini verir:

```ts
// features/products/components/ProductsTable.tsx
const columns: ColumnDef<Product>[] = [
  { accessorKey: "name", header: "Mal adı" },
  { accessorKey: "realCost", header: "Real maya", cell: c => fmtMoney(c.getValue()) },
  { id: "status", header: "Status", cell: c => <ProductStatusBadge product={c.row.original} /> },
  // ...
];
```

Sorting, filtering, pagination — hamısı Table-ın öz API-si ilə, bir dəfə wrapper-də yazılır.

---

## 4. MVP kodunun köçürülmə xəritəsi

Tək fayldakı şərh bölmələri birbaşa bu struktura uyğundur:

| MVP-dəki bölmə                   | Yeni yeri                                                                  |
| -------------------------------- | -------------------------------------------------------------------------- |
| helpers (fmtMoney, fmtDate, uid) | `src/lib/format.ts`                                                        |
| calcRealCost, productStatus      | `features/products/lib.ts`                                                 |
| mock data                        | `src/mocks/seed.ts`                                                        |
| reducer action-ları              | hər feature-in `api.ts` (mock handler) + `queries.ts` mutation-ları        |
| useDerived (dashboard rəqəmləri) | `features/reports/queries.ts` → `useDashboardStats()` (Query `select` ilə) |
| UI primitivləri                  | `components/ui/*` — demək olar dəyişməz köçür                              |
| Sidebar/Topbar                   | `components/layout/*`                                                      |
| Səhifə komponentləri             | `routes/_app.*.tsx` (nazik) + `features/*/components/*` (əsas məntiq)      |

**Köçürmə ardıcıllığı (tövsiyə):**

1. Skelet: Vite + Tailwind + Router qurulur, boş layout işləyir
2. `components/ui` + `lib/format` köçür (asılılıqsızdır)
3. `mocks/` + `features/products` tam dövrə (list → form → stock adjust)
4. `features/sales` (ən mürəkkəb invalidation zənciri burada)
5. customers → suppliers → expenses → day-end → reports → qalanlar

---

## 5. Konvensiyalar

- **Adlandırma:** komponentlər `PascalCase.tsx`, hər şey qalan `camelCase.ts`; route faylları TanStack konvensiyası ilə
- **Import alias:** `@/` → `src/` (vite.config + tsconfig `paths`)
- **Query key-lər:** `["products"]`, `["products", id]`, `["dashboard"]` — hər feature-in `queries.ts`-nin başında sabit kimi
- **Zod sxemləri** form validation üçün `types.ts`-də tip ilə yanaşı (`z.infer` ilə tip çıxarılır) — bir mənbə, iki istifadə
- **Pul:** həmişə `fmtMoney()` — heç vaxt inline `.toFixed(2)`
- **Tailwind:** rəng palitrası MVP-dəki kimi (emerald + stone), status rəngləri `ProductStatusBadge` daxilində mərkəzləşir; class birləşdirmə yalnız `cn()` ilə

---

## 6. main.tsx — hər şeyin qoşulması

```tsx
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

const router = createRouter({ routeTree });

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
    <Toaster />
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>,
);
```

---

## 7. Gələcəyə hazırlıq

- **Backend gələndə:** `.env`-ə `VITE_API_URL` yazılır → mock qatı avtomatik sönür; komponentlərə toxunulmur
- **Rol icazələri:** `features/auth/store.ts`-də `can(permission)` helper — Satıcı endirim edə bilmirsə, düymə buradan gizlənir
- **Dil dəstəyi:** bütün mətnlər hələlik komponentlərdə Azərbaycanca; i18n lazım olsa `lib/i18n.ts` + açar faylları əlavə olunur
- **Offline / PWA:** bazar şəraitində internet kəsilə bilər — TanStack Query persist + service worker sonradan asan əlavə olunur, çünki server state onsuz da mərkəzləşib
