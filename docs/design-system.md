# Dizayn Sistemi — Sədərək Anbar (FE#69)

Bu sənəd FE#69 ilə qurulmuş **qlobal UI/UX təməlini** təsvir edir: token-lar,
paylaşılan primitivlərin siyahısı (normallaşdırıldı / yeni yaradıldı), variant
qaydaları və istifadə nümunələri.

Mənbələr: `docs/ui-ux-current-state-audit.md` (F-01…F-52) ·
`docs/ui-component-inventory.md` (31 modul + `PageHead`) ·
`docs/ui-ux-risk-register.md` (R-01…R-52) · `docs/ui-refactor-roadmap.md`.

**Əsas qayda:** mövcud primitivlər YENİDƏN YAZILMIR — variant/prop/CSS
səviyyəsində normallaşdırılır; heç bir mövcud prop silinmir, ad dəyişirsə
köhnə ad deprecated alias kimi işləməyə davam edir. Yeni UI framework, yeni
ikon dəsti və ya yeni paket ƏLAVƏ EDİLMİR (Tailwind 3.4 + lucide-react +
TanStack + zustand).

---

## 1. Token-lar

Token-lar iki yerdə yaşayır və eyni dəyərləri göstərir:
`tailwind.config.ts` (sinif adları) və `src/index.css` (CSS dəyişənləri);
TypeScript tərəfi üçün adlandırılmış sinif sətirləri: `src/lib/ui-tokens.ts`.

### 1.1 Spacing

Vahid şkala — **4 / 8 / 12 / 16 / 20 / 24 / 32 px** (Tailwind: `1 2 3 4 5 6 8`).

| İstifadə | Dəyər |
|---|---|
| Kart daxili padding | `p-4` (16px) — sıx panellər · `p-5` (20px) — ölçülü kartlar |
| Grid/flex aralığı | `gap-2` (8) · `gap-3` (12) · `gap-4` (16) |
| Səhifə kənar padding-i | `px-4 lg:px-8` — `AppShell` içində TƏK yerdə |
| Səhifə blokları arası | `space-y-5` (20px) |
| Başlıq altı boşluq | `mb-6` (24px) — `PageHeader` |

CSS dəyişənləri: `--space-1 … --space-8` (`src/index.css`).

### 1.2 Radius

| Token | Sinif | Dəyər | İstifadə |
|---|---|---|---|
| card | `rounded-card` | 16px | Kart, panel, drawer, modal |
| control | `rounded-control` | 12px | Düymə (md/lg), input, select, textarea |
| chip | `rounded-chip` | 8px | Çip, kiçik düymə (sm), menyu bəndi |
| tag | `rounded-tag` | 6px | Badge |
| — | `rounded-full` | ∞ | Qlobal axtarış, AlertPill, sayğac nişanı |

### 1.3 Kölgə (3 pillə)

| Token | İstifadə |
|---|---|
| `shadow-card` | Kartlar və panellər — **çox incə** (FE#69-da azaldıldı) |
| `shadow-overlay` | Menyu, popover, toast |
| `shadow-panel` | Modal və drawer |

`shadow-soft` köhnə ad kimi qalır və `shadow-card` ilə eyni dəyərdədir.
İç-içə kart QADAĞANDIR: kart daxilindəki cədvəl `embedded`, kart daxilindəki
boş vəziyyət `EmptyState embedded`, kart daxilindəki xəta `InlineError
embedded` ilə çərçivəsiz göstərilir.

### 1.4 Tipoqrafiya iyerarxiyası

| Səviyyə | Sinif (`TEXT` tokeni) | Dəyər |
|---|---|---|
| Səhifə başlığı (h1) | `TEXT.pageTitle` | `text-2xl lg:text-3xl font-bold` |
| Səhifə alt yazısı | `TEXT.pageSubtitle` | `text-base text-stone-500` |
| Bölmə/kart başlığı | `TEXT.sectionTitle` | `text-lg font-bold` |
| KPI etiketi | `TEXT.label` | `text-xs font-semibold uppercase tracking-wide` |
| Gövdə mətni | `TEXT.body` | `text-base text-stone-700` |
| Köməkçi mətn | `TEXT.hint` | `text-sm text-stone-500` |
| KPI dəyəri | `TEXT.metric` | `text-xl lg:text-2xl font-bold tabular-nums` |

Baza ölçü: 16px mobil / 17px `lg`-dən (`src/index.css`) — dəyişməyib.

### 1.5 Maliyyə rəqəmləri (R-04)

```
.money = min-w-0 + overflow-hidden + truncate + tabular-nums
```

Hər pul/faiz dəyəri `money` sinfindədir və tam dəyər `title` atributunda
saxlanılır. Tətbiq olunduğu yerlər: `StatCard`, `KpiCard`, `StatCluster`,
sidebar «Kassada olmalı» rəqəmi, cədvəl pul sütunları.

### 1.6 Kontrol hündürlükləri (AC-8)

| Ölçü | Hündürlük | İstifadə |
|---|---|---|
| `sm` | ≥40px | Sıx kontekst (cədvəl toolbar-ı, menyu bəndləri, çiplər) |
| `md` | ≥44px | Defolt — toxunma hədəfi |
| `lg` | ≥52px | Səhifənin əsas əməliyyatı, login |

AC-8-in sadaladığı kontrol siniflərində (`sm`/`md`/`lg`) heç bir kontrol
40px-dən kiçik deyil. (Qeyd: bu, bütün interaktiv elementlərə deyil, yalnız
DS kontrol sinifindən istifadə edən elementlərə aiddir — məs.
`SalaryCard.tsx:125-137`-dəki ad-hoc mətn düyməsi `::before` hit-slop
naxışı ilə 40x40px toxunma hədəfini təmin edir və bu sinifdən kənardır,
bu iddiaya aid deyil.)

### 1.7 Vəziyyətlər və fokus (R-15)

Bütün interaktiv primitivlərdə beş vəziyyət: `hover` · `focus-visible` ·
`active/pressed` (`active:scale-[0.99]` + ton dəyişikliyi) · `disabled`
(`opacity-50` + `cursor-not-allowed` + səbəb `title`-də) · `loading`
(`Button loading` / `IconButton loading` → spinner + `aria-busy` + təkrar
klik bloklanır).

Fokus tokeni (`src/index.css` `@layer components`):

| Sinif | İstifadə |
|---|---|
| `focus-ring` | Açıq fonda (düymələr, kontrollar) |
| `focus-ring-inset` | Kart/sətir/cədvəl daxilində |
| `focus-ring-dark` | Tünd sidebar fonunda |

### 1.8 Semantik rənglər (AC-10, AC-11)

| Ton | Rəng | Nə üçün |
|---|---|---|
| `success` | emerald | Uğur · müsbət maliyyə nəticəsi · **əsas brend əməliyyatı** |
| `warning` | amber | Xəbərdarlıq · azalan stok · gecikmiş borc · **kassa fərqləri** |
| `danger` | red | Dağıdıcı əməliyyat · ziyan · kritik problem |
| `info` | sky | Neytral məlumat (kart satışı, məlumat toast-ı) |
| `neutral` | stone | Statussuz / arxiv |

**Rəng heç vaxt yeganə status siqnalı deyil** — `Badge`/`ProductStatusBadge`,
`InlineError`, `Toast` və kassa fərqi göstəriciləri həmişə ikon və/və ya
izahedici mətnlə müşayiət olunur.

**KRİTİK QAYDA (R-02):** müsbət kassa fərqi yaşıl «uğur» DEYİL — kəhrəba
«yoxlanmalı uyğunsuzluq»dur. Qayda tək yerdə yaşayır:
`src/features/day-end/components/cash-diff-presentation.ts`.

### 1.9 Layout standartı (AC-16)

| Ölçü | Token | Dəyər |
|---|---|---|
| Sidebar eni | `w-sidebar` / `--app-sidebar-w` | 16rem |
| Header hündürlüyü | `h-header` / `--app-header-h` | 4rem |
| Səhifə padding-i | `px-4 lg:px-8` | 16 / 32px |
| Kontent eni | `w-full` (sidebar-dan sonra) | ekranı tam istifadə edir |

Başlıq/alt-yazı solda, əsas əməliyyat başlıqla **eyni xətdə** sağda;
filtr və tarix kontrolları (`PeriodFilter` + `FilterBar`/səhifəyə xas filtr
komponenti) başlığın altında, kontentdən əvvəl render olunur (FE#143 —
istifadəsiz `PageToolbar` sarğı komponenti silinib, bu iki primitiv həmin
yerləşməni faktiki təmin edir).

### 1.10 Hərəkət

Yeni animasiya əlavə edilmir. `prefers-reduced-motion: reduce` qlobal blokla
bütün keçid/animasiyaları söndürür (`src/index.css`).

---

## 2. Paylaşılan primitivlərin statusu

Status: **N** = normallaşdırıldı (mövcud komponent, prop/variant səviyyəsində) ·
**Y** = yeni yaradıldı.

| # | Primitiv | Status | Fayl yolu | İnventardakı qarşılığı |
|---|---|---|---|---|
| 1 | **AppShell** | Y | `src/components/layout/AppShell.tsx` | yox — karkas `_app.tsx` içində inline idi |
| 2 | **Sidebar** | Y | `src/components/layout/Sidebar.tsx` | yox — `_app.tsx:134-185` `sidebarInner` |
| 3 | **TopHeader** | Y | `src/components/layout/TopHeader.tsx` | yox — `_app.tsx:224-260` inline `header` |
| 4 | **PageHeader** | N | `src/components/layout/PageHeader.tsx` | `PageHead` (inventar #32) — deprecated alias kimi qalır: `src/components/layout/PageHead.tsx` |
| 5 | **GlobalProductSearch** | Y | `src/components/layout/GlobalProductSearch.tsx` | yox — `_app.tsx:238-250` xam input (F-50 nüsxə 1) |
| 6 | **LocalTableSearch** | Y | `src/components/ui/LocalTableSearch.tsx` | yox — `FilterBar` daxilindəki input + 2 xam nüsxə (F-50) |
| 7 | **Button** (variantlar) | N | `src/components/ui/Button.tsx` | inventar #4 |
| 8 | **IconButton** | Y | `src/components/ui/IconButton.tsx` | yox |
| 9 | **SegmentedDateFilter** | N | `src/components/ui/PeriodFilter.tsx` (alias `SegmentedDateFilter`) | `PeriodFilter` (inventar #21) |
| 10 | **StatCard** | N | `src/components/ui/StatCard.tsx` | inventar #25 |
| 10a | **KpiCard / StatCluster / AlertPill** (birləşik KPI paneli) | N | `src/components/ui/KpiCard.tsx` | inventar #19, #19a, #19b |
| 11 | **DataTable** | N | `src/components/ui/DataTable.tsx` | inventar #9 |
| 12 | **TableToolbar** | Y | `src/components/ui/TableToolbar.tsx` | yox — real istifadə: `src/routes/_app.musteriler.tsx` (search + "yalnız borclular" filtri, FE#122) |
| 13 | **TablePagination** | Y | `src/components/ui/TablePagination.tsx` | `DataTable` daxilində inline idi |
| 14 | **FilterDrawer / FilterPopover** | N | `src/components/ui/FilterBar.tsx` (alias) | `FilterBar` (inventar #15) |
| 15 | **DetailDrawer** | N | `src/components/ui/Drawer.tsx` (alias `DetailDrawer`) | `Drawer` (inventar #10) |
| 16 | **ConfirmDialog** | N | `src/components/ui/ConfirmModal.tsx` (alias `ConfirmDialog`) | `ConfirmModal` (inventar #6) |
| 17 | **EmptyState** | N | `src/components/ui/EmptyState.tsx` | inventar #11 |
| 18 | **LoadingSkeleton** | Y | `src/components/ui/LoadingSkeleton.tsx` (`Skeleton`, `SkeletonText`, `TableSkeleton`) | yox — `Spinner` (inventar #24) qalır |
| 19 | **InlineError** | Y | `src/components/ui/InlineError.tsx` | yox (F-44) |
| 20 | **Toast** | N | `src/components/ui/Toast.tsx` | inventar #27 |

**Əlavə normallaşdırılanlar:** `Modal` (#20), `Input` (#18), `Textarea` (#26),
`Select` (#23), `ActionMenu` (#2) — fokus/hündürlük/radius token-larına
salındı; `ActionMenu`-ya `triggerLabel` propu əlavə edildi.

**Yeni köməkçi modullar:** `src/lib/ui-tokens.ts` (token-lar),
`src/components/ui/dialog-layer.ts` (Modal + Drawer üçün ortaq arxa fon
kilidi), `src/features/day-end/components/cash-diff-presentation.ts`
(kassa fərqi təqdimat qaydası).

**Əhatə yoxlaması:** FE#69 siyahısındakı 22 primitivdən 20-si yuxarıdakı
cədvəldədir — statusu olmayan primitiv: **0**. Qalan 2-si (`PageToolbar`,
`StatusBadge`) FE#143 ilə silinib, bax aşağı.

**Real səhifə istifadəsi / FE#143 nəticəsi:** `PageToolbar` və `StatusBadge`
FE#69 ilə yaradıldıqdan sonra 3 ardıcıl QA dövründə (FE#86 → FE#122 → FE#126)
də real səhifə istifadəsi qazanmadılar (0 çağırış — `PageToolbar` yalnız
JSDoc-larda adı çəkilirdi, `StatusBadge`-ə yeganə istinad test faylı idi).
`FE#143` ilə hər iki fayl silindi: `src/components/layout/PageToolbar.tsx`
və `src/components/ui/StatusBadge.tsx`. Onların oynamalı olduğu rolu artıq
`PeriodFilter` (dövr) + `FilterBar`/səhifəyə xas filtr komponenti (filtr) və
`Badge`/`ProductStatusBadge` (status nişanı) faktiki oynayır — bu iki primitiv
hər siyahı səhifəsində istifadədədir. `TableToolbar`-a TOXUNULMAYIB, çünki
real istifadədədir (`src/routes/_app.musteriler.tsx`) və keçir.

---

## 3. İstifadə qaydaları və nümunələr

### 3.1 Button

```tsx
// Səhifənin ƏSAS əməliyyatı (səhifədə BİR ədəd)
<Button icon={<Plus size={18} />} onClick={openNew}>Yeni mal</Button>

// İkinci dərəcəli
<Button variant="secondary" size="sm" icon={<Download size={14} />}>Excel</Button>

// Dağıdıcı
<Button variant="danger" icon={<Trash2 size={16} />}>Sil</Button>

// Gözləmə (əl ilə Loader2 YAZILMIR)
<Button loading={isPending}>Yadda saxla</Button>

// Deaktiv — səbəb HƏMİŞƏ izah olunur
<Button disabled title="Demo rejimdə işləmir">Excel export</Button>
```

### 3.2 IconButton (AC-15)

```tsx
<IconButton label="Bağla" icon={<X size={20} />} onClick={onClose} />
<IconButton label="Sil" tooltip="Silmək üçün icazə lazımdır" tone="danger" disabled icon={<Trash2 size={18} />} />
```

`label` **məcburidir** və həm `aria-label`, həm `title` verir — verilmədikdə
`npm run build` TypeScript xətası ilə dayanır.

**Qadağa:** sil · günü bağla · ödəniş təsdiqi · ziyana satış kimi kritik
əməliyyatlar yalnız-ikon düymə ilə TƏQDİM OLUNMUR — mətn etiketli `Button`
işlədilir.

### 3.3 PageHeader + dövr/filtr kontrolları

```tsx
<PageHeader
  title="Mallar / Anbar"
  subtitle="240 mal · Maya dəyəri: 12 400 ₼"
  moreActions={[{ label: "Excel import", icon: <Upload size={16} />, onClick: openImport }]}
  primaryAction={<Button icon={<Plus size={18} />}>Yeni mal</Button>}
/>

<PeriodFilter value={range} onChange={updateRange} defaultKey="all" />
<ProductFilters value={search} onChange={updateFilter} … />
```

(FE#143 — istifadəsiz `PageToolbar` sarğı komponenti silinib; `PeriodFilter`
və səhifəyə xas filtr komponenti birbaşa, ardıcıl render olunur.)

### 3.4 Qlobal vs lokal axtarış (AC-14)

| | GlobalProductSearch | LocalTableSearch |
|---|---|---|
| Yeri | Üst zolaq (`TopHeader`) | Səhifə/cədvəl daxilində |
| Görünüşü | Yumru (`rounded-full`), dolu fon | Düzbucaqlı (`rounded-control`), ağ fon |
| Mətni | «Bütün sistemdə mal axtar...» | «Bu siyahıda axtar...» |
| Davranışı | `Enter` → Mallar səhifəsinə keçid (ipucu ilə bildirilir) | Yazdıqca cari siyahını süzür |

### 3.5 DataTable vəziyyətləri

```tsx
<DataTable
  columns={columns}
  data={rows}
  isLoading={isLoading}      // → TableSkeleton (spinner deyil)
  isError={isError}          // → InlineError + «Yenidən» (boş siyahı DEYİL)
  onRetry={refetch}
  emptyState={{ title: "Mal yoxdur", description: "Filtri dəyişin" }}
  toolbar={<TableToolbar search={<LocalTableSearch … />} />}
/>
```

Vəziyyət prioriteti: **xəta → yüklənmə → boş → məlumat**.

### 3.6 Status nişanları (Badge / ProductStatusBadge)

```tsx
<Badge tone="Azalır">Azalır</Badge>
<Badge tone="Bitib">Bitib</Badge>
<Badge tone="Ödənilib">Ödənilib</Badge>
<ProductStatusBadge product={product} />
```

`Badge` mətn açarlı status nişanıdır və 11+ fayldan istifadə olunur (o
cümlədən `ProductStatusBadge` vasitəsilə). İstifadəsiz `StatusBadge`
primitivi FE#143 ilə silinib.

### 3.7 Overlay-lər

```tsx
<DetailDrawer open={open} onClose={close} title="Satış detalı" footer={…}>…</DetailDrawer>
<ConfirmDialog open={open} onClose={close} onConfirm={handleDelete}
  danger confirmText="Sil" isPending={mut.isPending} error={err} />
```

Hər ikisi arxa fon sürüşməsini ortaq sayğacla kilidləyir
(`dialog-layer.ts`) — üst-üstə açılan panellərdə kilid yalnız sonuncu
bağlananda açılır.

---

## 4. Geriyə uyğunluq (deprecated alias-lar)

| Köhnə ad / prop | Yeni ad | Vəziyyət |
|---|---|---|
| `PageHead` | `PageHeader` | İşləyir (`PageHead.tsx` → `PageHeader`) |
| `PageHeader.actions` | `primaryAction` / `secondaryActions` / `moreActions` | `actions` işləyir, `@deprecated` |
| `PeriodFilter` | `SegmentedDateFilter` | Hər ikisi eyni komponent |
| `FilterBar` | `FilterPopover` / `FilterDrawer` | Hər üçü eyni komponent |
| `Drawer` | `DetailDrawer` | Hər ikisi eyni komponent |
| `ConfirmModal` | `ConfirmDialog` | Hər ikisi eyni komponent |
| `shadow-soft` | `shadow-card` | Eyni dəyər |

Silinən prop: **0**. Silinən komponent (FE#143 — istifadəsiz, real səhifə
istifadəsi 0 olan primitivlər): **2** — `PageToolbar`
(`src/components/layout/PageToolbar.tsx`), `StatusBadge`
(`src/components/ui/StatusBadge.tsx`). Hər ikisi FE#69 ilə yaradılıb, 3
ardıcıl QA dövründə (FE#86 → FE#122 → FE#126) real səhifəyə köçürülmədiyi
üçün silinib; rolunu `PeriodFilter`/`FilterBar` və `Badge`/`ProductStatusBadge`
faktiki oynayır. `Badge` özü SİLİNMİR/dəyişmir.

---

## 5. Sonrakı mərhələ (bu taskın əhatəsindən kənar)

Yol xəritəsinin (`docs/ui-refactor-roadmap.md`) Mərhələ 1–6 işləri:
`MobileCard` karkası (F-48), `DetailCard`/`DetailRow` (F-49), ölü kodun
silinməsi (F-46), Hesabatların `PeriodFilter`-ə keçidi (F-26), terminologiya
sətirlərinin qalan hissəsi (F-52), rol badge-ləri (F-29), Ayarlar sticky
saxlama zolağı (F-32) və qalan səhifə-səviyyəli refactor-lar.
