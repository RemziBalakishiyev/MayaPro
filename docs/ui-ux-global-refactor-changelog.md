# Qlobal UI/UX Refactor — Dəyişiklik Jurnalı (FE#69)

Branch: `task/FE#69-ui-primitives` (baza: `task/FE#68-ui-ux-audit`, çünki
FE#68 sənədləri hələ `main`-ə merge olunmayıb).

Hər addım ayrıca commit-dir; hər commit-də `npm run build` (`tsc && vite
build`) və `npm test` (vitest) **exit 0** ilə keçib. Sınıq aralıq commit
yoxdur.

| Addım | Commit | Mövzu |
|---|---|---|
| 1/6 | `6f75b27` | Dizayn token-ları |
| 2/6 | `7fe993a` | Button + IconButton + forma kontrolları |
| 3/6 | `eb031f4` | AppShell / Sidebar / TopHeader / PageHeader layout standartı |
| 4/6 | `221f144` | Cədvəl qatı və vəziyyət dili |
| 5/6 | `c2ed226` | KPI/pul təqdimatı, overlay dili, kassa fərqi semantikası |
| 6/6 | *(bu commit)* | Sənədlər |

---

## Addım 1 — `refactor(ui): vahid dizayn token-lari (spacing, radius, kolge, fokus)`

**Nə dəyişdi**
- `tailwind.config.ts`: radius şkalası (`card` 16 / `control` 12 / `chip` 8 /
  `tag` 6), kölgə 3 pilləyə salındı (`card` incəldildi, `overlay`, `panel`
  əlavə olundu), `sidebar` (16rem) / `header` (4rem) / `control` spacing
  token-ları.
- `src/index.css`: `--app-sidebar-w`, `--app-header-h`, `--space-*`,
  `--radius-*` dəyişənləri; `focus-ring` / `focus-ring-inset` /
  `focus-ring-dark` (R-15); `money` sinfi (R-04); `surface-card`; qlobal
  `prefers-reduced-motion` bloku.
- `src/lib/ui-tokens.ts` (yeni): `SPACE`, `RADIUS`, `CONTROL_H`, `TEXT`,
  `MONEY`, `SemanticTone`, `TONE_SURFACE`, `TONE_TEXT`.

**Toxunulan səhifələr:** yoxdur (yalnız təməl qatı). Görünüşdə yeganə fərq —
kart kölgəsi bir qədər incələşdi (bütün səhifələrdə eyni).

**Build:** ✅ · **Test:** ✅ 63/63

---

## Addım 2 — `refactor(ui): button ve icon-button standartlasdirilmasi`

**Nə dəyişdi**
- `Button`: `loading` propu (spinner + `disabled` + `aria-busy`, F-42);
  `focus-ring`; `active:scale-[0.99]` basma hissi; `sm` ölçüsü 38px → **40px**
  (AC-8); radius token-ları. **Mövcud proplar dəyişməyib.**
- `IconButton` (yeni): `label` **məcburi** → `aria-label` + `title` birlikdə
  (AC-15); `tone` = neutral/primary/danger; ölçülər 40/44px; `loading`.
- `Input` / `Textarea` / `Select`: eyni fokus dili (`focus-visible`), hover və
  disabled vəziyyətləri, `rounded-control`.
- `ActionMenu`: trigger 32px → **40px** (F-38), `focus-ring`, menyu bəndləri
  ≥40px; yeni `triggerLabel` propu (mətnli «Digər əməliyyatlar» düyməsi).
- Yeni test: `src/components/ui/Button.test.tsx` (7 test).

**Toxunulan səhifələr:** Login (xam submit düyməsi → `Button loading`),
Mallar (Excel export → `loading`), Satış (`PaymentConfirmModal` təsdiq
düyməsi → `loading`).

**Build:** ✅ · **Test:** ✅ 70/70

---

## Addım 3 — `refactor(ui): appshell, sidebar, topheader ve pageheader layout standarti`

**Nə dəyişdi**
- `AppShell` (yeni): sidebar eni, header hündürlüyü və səhifə padding-i TƏK
  yerdə (AC-16); mobil drawer + Escape idarəsi; mobil tab bar slotu və
  `pb-safe-bottom` olduğu kimi saxlanıldı.
- `Sidebar` (yeni): naviqasiya bəndləri 44px, `focus-ring-dark`, say nişanı
  tooltip-lə.
- `TopHeader` (yeni): `h-header` sticky zolaq.
- `GlobalProductSearch` (yeni): «Bütün sistemdə mal axtar...», yumru/dolu fon,
  «Mallar səhifəsi» ipucu (R-17). `submitSearch` naviqasiyası və URL sxemi
  **dəyişməyib**.
- `PageHeader` (yeni fayl, `PageHead`-in standartlaşdırılmış hali):
  `primaryAction` / `secondaryActions` / `moreActions`; `actions` propu
  `@deprecated` alias kimi işləyir.
- `PageHead` → `PageHeader`-ə yönləndirildi (silinmədi).
- `PageToolbar` (yeni): dövr/filtr kontrolları üçün vahid yer.

**Toxunulan səhifələr:** bütün route-lar (ortaq karkas vasitəsilə);
Mallar — 3 ikinci dərəcəli əməliyyat «Digər əməliyyatlar» menyusuna keçdi,
səhifədə bir əsas əməliyyat qaldı (AC-13).

**Build:** ✅ · **Test:** ✅ 70/70

---

## Addım 4 — `refactor(ui): cedvel qati ve vaziyyet dili (skeleton, xeta, lokal axtaris)`

**Nə dəyişdi**
- `LoadingSkeleton` (yeni): `Skeleton`, `SkeletonText`, `TableSkeleton` (F-41).
- `InlineError` (yeni): ikon + mətn + «Yenidən», `role="alert"` (F-44).
- `StatusBadge` (yeni): semantik ton + məcburi ikon → rəng tək siqnal deyil.
- `LocalTableSearch` (yeni): «Bu siyahıda axtar...» + təmizləmə düyməsi.
- `TableToolbar` (yeni) və `TablePagination` (yeni — `DataTable`-dan ayrıldı;
  düymələr 44px, istiqamət ikonu, deaktiv səbəbi `title`-də).
- `DataTable`: `isError` / `onRetry` / `errorMessage` / `toolbar` propları
  (hamısı opsional — mövcud çağırışlar dəyişmir); yüklənmədə skeleton;
  `embedded` halda iç-içə çərçivə aradan qalxdı; vahid fokus tokeni.
  Vəziyyət prioriteti: xəta → yüklənmə → boş → məlumat.
- `EmptyState`: `embedded` propu (kart içində ikinci kəsikli çərçivə yoxdur).
- Yeni test: `src/components/ui/DataTable.test.tsx` (7 test).

**Toxunulan səhifələr:** Müştərilər (xam axtarış inputu → `LocalTableSearch`,
`PageHeader`), Nisyə Borclar («Borclar» rejimi axtarışı → `LocalTableSearch`,
`PageHeader`). `DataTable` dolayısı ilə 9 siyahı səhifəsinə təsir edir
(davranış geriyə uyğundur).

**Build:** ✅ · **Test:** ✅ 77/77

---

## Addım 5 — `refactor(ui): kpi/pul teqdimati, overlay dili ve kassa ferqi semantikasi`

**Nə dəyişdi**
- `StatCard` / `KpiCard` / `StatCluster`: `money` sinfi + tam dəyər `title`-də
  (R-04); radius/kölgə token-ları; `StatCard`-a opsional `valueIcon` və
  `valueTitle`.
- `PeriodFilter` → `SegmentedDateFilter` alias; çiplər 40px, vahid fokus.
- `ConfirmModal` → `ConfirmDialog` alias; `isPending` / `error` propları
  (F-43); `onConfirm` `Promise` qaytardıqda modal yalnız uğurda bağlanır
  (sinxron çağırışların davranışı dəyişmir).
- `Drawer` → `DetailDrawer` alias; arxa fon kilidi (`dialog-layer.ts`, Modal
  ilə ortaq sayğac); bağlama düyməsi `IconButton`; `shadow-panel`.
- `Modal`: ortaq arxa fon kilidi, `IconButton` bağlama, `rounded-card`.
- `FilterBar` → `FilterPopover` / `FilterDrawer` alias; axtarış hissəsi
  `LocalTableSearch`-ə keçdi; yeni `hideSearch` propu (köhnə `FilterPanel`
  rejimi); vahid fokus halqası.
- `Toast`: `role="status"` + `aria-live="polite"`, növ adı ekran oxuyucusu
  üçün, bağlama düyməsində `aria-label` + `title` (F-39).
- **AC-12 (bloklayıcı):** müsbət kassa fərqi artıq yaşıl «uğur» DEYİL —
  kəhrəba «yoxlanmalı uyğunsuzluq» + xəbərdarlıq ikonu + izah mətni. Üç yerdə:
  gün sonu bannerı, bağlanmış gün xülasəsi (`StatCard tone="amber"`),
  `ClosingHistory` «Fərq» sütunu. Qayda tək mənbədədir:
  `cash-diff-presentation.ts` (+ 3 test). `difference()` / `expectedCash()`
  düsturlarına **toxunulmayıb**.

**Toxunulan səhifələr:** Gün Sonu (banner, xülasə, bağlanış tarixçəsi),
Dashboard və Hesabatlar (`StatCard`/`KpiCard` təqdimatı), bütün
modal/drawer-li səhifələr.

**Build:** ✅ · **Test:** ✅ 80/80

---

## Addım 6 — `docs: dizayn sistemi, terminologiya ve refactor changelog`

**Nə dəyişdi**
- `docs/design-system.md` — token-lar, 22 primitivin statusu (normallaşdırıldı
  / yeni yaradıldı + fayl yolu + inventar qarşılığı), istifadə qaydaları,
  deprecated alias cədvəli.
- `docs/ui-terminology.md` — 22 sətirlik köhnə → yeni etiket cədvəli
  (`E-xx` / task tələbi / `AC-xx` istinadları ilə) + qəsdən dəyişməyənlər.
- `docs/ui-ux-global-refactor-changelog.md` — bu sənəd.

**Toxunulan səhifələr:** yoxdur (yalnız sənəd).

---

## Yekun

**Normallaşdırılan primitivlər (12):** Button · Input · Textarea · Select ·
ActionMenu · DataTable · EmptyState · FilterBar (→ FilterPopover/FilterDrawer) ·
PeriodFilter (→ SegmentedDateFilter) · StatCard · KpiCard/StatCluster/AlertPill ·
Modal · Drawer (→ DetailDrawer) · ConfirmModal (→ ConfirmDialog) · Toast ·
PageHead (→ PageHeader).

**Yeni yaradılan primitivlər (11):** AppShell · Sidebar · TopHeader ·
PageHeader · PageToolbar · GlobalProductSearch · LocalTableSearch ·
IconButton · StatusBadge · TableToolbar · TablePagination · LoadingSkeleton ·
InlineError (+ köməkçi modullar: `ui-tokens.ts`, `dialog-layer.ts`,
`cash-diff-presentation.ts`).

**Köçürülən səhifələr:** bütün route-lar (AppShell/TopHeader/Sidebar) ·
Mallar · Müştərilər · Nisyə Borclar · Gün Sonu · Login · Satış (ödəniş
təsdiqi).

**Qalan işlər (sonrakı mərhələ):** yol xəritəsinin Mərhələ 1–6 səhifə-səviyyəli
işləri — `MobileCard` (F-48), `DetailCard`/`DetailRow` (F-49), ölü kodun
silinməsi (F-46), Hesabatların dövr filtri (F-26), terminologiyanın qalan
sətirləri (F-52), rol badge-ləri (F-29), Ayarlar sticky zolağı (F-32),
Dashboard/Hesabatlar KPI kompozisiyası (F-05, F-28), kassa tempi (F-11, F-12).

**Silinən komponent / prop:** 0 · **Yeni paket:** 0 · **API/route/icazə
dəyişikliyi:** 0.
