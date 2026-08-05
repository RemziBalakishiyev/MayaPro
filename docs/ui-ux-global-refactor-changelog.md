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
| 6/6 | `110fbde` | Sənədlər |

QA-dan (`docs/qa-report-FE69.md`, commit `b591e45`) sonra aşkarlanan
uyğunsuzluqlar aşağıdakı əlavə commit-lərlə düzəldildi (bax "Addım 7"):

| Commit | Mövzu |
|---|---|
| `f120226` | `DataTable.isError`/`InlineError`/`onRetry` real sorğu vəziyyətinə qoşulması (FE#87, TC-32) |
| `c772418` | `xercler.tsx` InlineError mesajının digər səhifələrlə uyğunlaşdırılması (FE#87) |
| `204ab55` | Borclar "Müştəri üzrə" rejiminin lokal axtarış placeholder-i (FE#94, AC-14/TC-15) |

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

## Addım 7 — QA-dan sonrakı düzəlişlər (FE#87, FE#94)

`docs/qa-report-FE69.md` (commit `b591e45`) 6 addımlıq refactordan sonra iki
uyğunsuzluq aşkarladı. Aşağıdakı 3 commit bu uyğunsuzluqları düzəldir; hər
biri ayrıca PR ilə `task/FE#69-ui-primitives`-a merge olunub (#92, #95).

### 7.1 — `f120226` — `fix(FE#87): sebeke xetasi bos siyahi kimi gorunmesin — InlineError/onRetry qosulmasi`

**Nə dəyişdi**
- Addım 4-də hazırlanan `DataTable.isError` / `onRetry` / `errorMessage`
  propları və `InlineError` komponenti mövcud idi, lakin heç bir siyahı
  səhifəsi bunları real React Query `isError`/`refetch` dəyərlərinə
  qoşmamışdı (TC-32) — şəbəkə xətası boş siyahı mesajı kimi görünürdü.
- `ProductsTable` (Mallar), `CustomersTable` (Müştərilər + Nisyə Borclar
  → "müştəri" rejimi), `SuppliersTable` (Təchizatçılar): `isError` /
  `onRetry` / `errorMessage` `DataTable`-a ötürüldü.
- `OpenDebtsTable` / `OpenDebtsView` (Nisyə Borclar → "borclar" rejimi):
  `useOpenDebts().isError` / `.refetch` qoşuldu.
- `SalesJournal` (Satış jurnalı): `journal.isError` / `journal.refetch`
  `DataTable`-a ötürüldü.
- `_app.xercler.tsx` (Xərclər): əl ilə yazılmış xəta bloku `InlineError` +
  `onRetry` ilə əvəz olundu.
- Yeni component testlər: `ProductsTable.test.tsx`, `CustomersTable.test.tsx`,
  `SuppliersTable.test.tsx`, `OpenDebtsView.test.tsx` — `isError`/`onRetry`
  davranışı və regressiya (boş nəticə halında normal `EmptyState`) yoxlanılır.

**Toxunulan səhifələr:** Mallar, Müştərilər, Nisyə Borclar (hər iki rejim),
Təchizatçılar, Satış jurnalı, Xərclər.

**Merge:** PR #92 (`task/FE87-network-error-inline` → `task/FE#69-ui-primitives`).

### 7.2 — `c772418` — `refactor(FE87): xercler.tsx-də InlineError mesajını digər səhifələrlə uyğunlaşdır`

**Nə dəyişdi**
- 7.1-də Xərclər səhifəsinə qoşulan `InlineError` hələ `error.message`-i
  birbaşa göstərirdi — şəbəkə xətasında bu, xam brauzer mətni (məs.
  "Failed to fetch") ola bilər və istifadəçiyə mənasız görünür.
- Mallar/Müştərilər/Təchizatçılar/Satış səhifələrindəki sabit, mənalı
  Azərbaycanca mesaj naxışı ilə uyğunlaşdırıldı: `message="Xərclər
  yüklənmədi"` (sabit mətn), istifadəsiz `error` destructure də silindi.

**Toxunulan səhifələr:** Xərclər.

### 7.3 — `204ab55` — `fix(borclar): standartlaşdır musteri rejiminin lokal axtarış placeholder-i (FE#94)`

**Nə dəyişdi**
- QA (AC-14/TC-15) aşkarladı ki, Nisyə Borclar səhifəsinin "müştəri"
  rejimindəki `FilterBar` hələ köhnə "Ad və ya telefon üzrə axtar..."
  mətnini istifadə edir; "borclar" rejimi Addım 4-də artıq düzəldilmişdi,
  lakin bu fayl həmin dəyişikliyin əhatəsində deyildi.
- `src/routes/_app.borclar.tsx`: "müştəri" rejiminin `FilterBar`
  `searchPlaceholder`-i `musteriler.tsx`-dəki eyni standarta —
  "Bu siyahıda axtar... (ad və ya telefon)" — uyğunlaşdırıldı. Axtarış
  davranışı, filtr məntiqi və URL sxemi dəyişməyib, yalnız placeholder mətni.

**Toxunulan səhifələr:** Nisyə Borclar ("müştəri" rejimi).

**Merge:** PR #95 (`task/FE#94-borclar-search-placeholder` → `task/FE#69-ui-primitives`).

---

## Addım 8 — FE#123: `ui-terminology.md`-də səhifə-spesifik xəta mətnlərinin sənədləşdirilməsi

**Nə dəyişdi**
- QA/audit zamanı aşkarlandı ki, `docs/ui-terminology.md`-nin 1-ci cədvəlində
  yalnız `DataTable`-ın ümumi xəta mətni (sətir 18: `Siyahı yüklənmədi`) var
  idi — Addım 7.1/7.2-də (FE#87) 6 səhifəyə əlavə olunan səhifə-spesifik
  `errorMessage`/`message` mətnləri cədvələ düşməmişdi.
- `docs/ui-terminology.md` 1-ci cədvəlinə 6 yeni sətir (24–29) əlavə olundu:
  Mallar (`ProductsTable.tsx:294`), Müştərilər (`CustomersTable.tsx:126`),
  Nisyə Borclar (`OpenDebtsTable.tsx:172`), Təchizatçılar
  (`SuppliersTable.tsx:180`), Satış jurnalı (`SalesJournal.tsx:621`), Xərclər
  (`_app.xercler.tsx:171`) — hər sətirdə mətnin işlədiyi fayl:sətir göstərilir.
- Yalnız sənəd düzəlişidir, `src/` toxunulmayıb, kodda dəyişiklik yoxdur.

**Toxunulan səhifələr:** yoxdur (yalnız sənəd).

**Build:** ✅

---

## Yekun

**Normallaşdırılan primitivlər (16):** Button · Input · Textarea · Select ·
ActionMenu · DataTable · EmptyState · FilterBar (→ FilterPopover/FilterDrawer) ·
PeriodFilter (→ SegmentedDateFilter) · StatCard · KpiCard/StatCluster/AlertPill ·
Modal · Drawer (→ DetailDrawer) · ConfirmModal (→ ConfirmDialog) · Toast ·
PageHead (→ PageHeader).

**Yeni yaradılan primitivlər (13):** AppShell · Sidebar · TopHeader ·
PageHeader · PageToolbar · GlobalProductSearch · LocalTableSearch ·
IconButton · StatusBadge · TableToolbar · TablePagination · LoadingSkeleton ·
InlineError (+ köməkçi modullar: `ui-tokens.ts`, `dialog-layer.ts`,
`cash-diff-presentation.ts`).

**Köçürülən səhifələr:** bütün route-lar (AppShell/TopHeader/Sidebar) ·
Mallar · Müştərilər · Nisyə Borclar · Təchizatçılar · Xərclər · Satış jurnalı ·
Gün Sonu · Login · Satış (ödəniş təsdiqi).

**Qalan işlər (sonrakı mərhələ):** yol xəritəsinin Mərhələ 1–6 səhifə-səviyyəli
işləri — `MobileCard` (F-48), `DetailCard`/`DetailRow` (F-49), ölü kodun
silinməsi (F-46), Hesabatların dövr filtri (F-26), terminologiyanın qalan
sətirləri (F-52), rol badge-ləri (F-29), Ayarlar sticky zolağı (F-32),
Dashboard/Hesabatlar KPI kompozisiyası (F-05, F-28), kassa tempi (F-11, F-12).

**Silinən komponent / prop:** 0 · **Yeni paket:** 0 · **API/route/icazə
dəyişikliyi:** 0.
