# Qlobal UI/UX Refactor — Dəyişiklik Jurnalı (FE#69)

Branch: `task/FE#69-ui-primitives` (baza: `task/FE#68-ui-ux-audit`, çünki
FE#68 sənədləri hələ `main`-ə merge olunmayıb).

Hər addım ayrıca commit-dir; hər commit-də `npm run build` (`tsc && vite
build`) və `npm test` (vitest) **exit 0** ilə keçib. Sınıq aralıq commit
yoxdur — **istisna: Addım 9.2 (`a6330ae`)**, bax həmin bölmə; HEAD-də
(`30f592c`) hər üç yoxlama yenidən yaşıldır.

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

QA-nın 5-ci dövründən (`agents/qa-reports/FE#69-qa-report-round5.md`) sonra
aşkarlanan üç YENİ uyğunsuzluq — o cümlədən elə bu sənədin özünün natamamlığı
(§7.3, AC-24/TC-29 regresiyası) — "Addım 9"-da düzəldilir.

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

## Addım 9 — FE#122 (`TableToolbar`), `origin/main` sinxronizasiyası (konflikt həlli) və test uyğunlaşdırılması

QA 5-ci dövründən (`agents/qa-reports/FE#69-qa-report-round5.md`, §7.3 /
AC-24 / TC-29 — **regresiya:** bu changelog 4-cü dövrdə tam idi, 5-ci dövrə
qədər 3 commit sənədləşməmiş qalmışdı) sonra əlavə olunan bu 3 commit `main`-in
mövcud işini (FE#69 branch-ı ilə paralel inkişaf edən 40px toxunma hədəfi
düzəlişləri — FE#84/86/88/92/94/95/97/98/101/102/104/105/106/109 PR-ları
vasitəsilə artıq `main`-ə merge olunmuşdu) branch-a daxil edir. `4131114` və
`a6330ae` ardıcıldır (`a6330ae`-nin birinci valideyni `4131114`-dür), üçü
birlikdə bir bölmədə sənədləşdirilir.

### 9.1 — `4131114` — `feat(FE#122): TableToolbar-i musteriler sehifesinde real istifadeye qosdur`

**Nə dəyişdi**
- QA-da BUG-3 (AC-16/AC-3) kimi qeyd olunmuşdu: `PageToolbar`/`TableToolbar`/
  `StatusBadge` Addım 4-də yaradılıb, amma heç bir real route-da istifadə
  olunmurdu (yalnız test/JSDoc-da adları çəkilirdi).
- `src/routes/_app.musteriler.tsx:129`: manual `<div>` ilə yığılmış axtarış
  və "yalnız borclular" filtri paylaşılan `TableToolbar`-a köçürüldü
  (`search` və `actions` slot-ları). Funksionallıq və URL search sxemi
  **dəyişməyib**.
- `docs/design-system.md:192-197`: `TableToolbar`-ın real istifadə yeri
  (`_app.musteriler.tsx`) qeyd olundu; `PageToolbar`/`StatusBadge`-in kod
  bazasında MÖVCUD olduğu, lakin qalan səhifələrə köçürülməsinin gələcək
  tapşırıq olduğu aydınlaşdırıldı.

**Toxunulan səhifə/komponentlər:** Müştərilər (`_app.musteriler.tsx`) —
`TableToolbar` ilk dəfə real istifadəyə qoşuldu. `docs/design-system.md`
(sənəd).

**⚠️ Qeyd — AC-16 tam bağlanmayıb:** bu commit `PageToolbar` və
`StatusBadge`-i **hələ heç bir yerdə** işə salmır — hər ikisi 0 real route
istifadəsi ilə ölü kod olaraq qalır (bax aşağıda "Açıq qalan işlər").
Yalnız `TableToolbar` 1 səhifədə (Müştərilər) istifadəyə qoşulub. Bu commit
AC-16-nı **tam deyil, qismən** həll edir — bu sənəd bunu "tamamlandı" kimi
təqdim etmir.

**Build:** ✅ · **Test:** ✅ (91/91, dəyişməyib)

### 9.2 — `a6330ae` — `Merge origin/main into task/FE#69-ui-primitives, resolve conflicts preserving both sides' AC`

**Nə dəyişdi**
- Branch-ın merge-bazası artıq `origin/main`-in özüdür (`e1e6670`) — yəni
  FE#69 branch-ı `main`-ə əvvəllər merge olunmuş bütün digər PR-ların işini
  bu commit-lə daxil edir.
- **29 fayl dəyişdi (+169/−50)** — 5-i **konfliktli** (aşağıda ətraflı), 24-ü
  `main`-in müstəqil (FE#69 branch-ının toxunmadığı sətirlərdə) 40px toxunma
  hədəfi düzəlişlərinin **konfliktsiz** avtomatik birləşməsi (`h-8`/`h-9` →
  `h-10`, yəni 32/36px → 40px tipli sinif dəyişiklikləri, davranış eyni
  qalıb): `docs/ui-terminology.md`, `CopyablePhone.tsx` (+ test),
  `ExpenseRows.tsx`, `ImageUpload.tsx`, `CustomerDrawer.tsx`,
  `CustomersTable.tsx`, `OpenDebtsTable.tsx`, `DayEndCard.tsx`,
  `SalaryCard.tsx`, `SalaryHistoryDrawer.tsx`, `SalaryMonthSwitcher.tsx`,
  `ExpenseFilters.tsx`, `ExpensesTable.tsx`, `LabelPrintModal.tsx`,
  `ProductFilters.tsx` (+ test), `ProductsTable.tsx`, `QuickSaleScreen.tsx`,
  `SalesJournal.tsx`, `SuppliersTable.tsx`, `_app.borclar.tsx`,
  `_app.hesabatlar.tsx`.

**Toxunulan səhifə/komponentlər:** Mallar, Müştərilər, Nisyə Borclar,
Təchizatçılar, Xərclər, Satış (jurnal + tez satış), Gün Sonu, İşçilər,
Hesabatlar — demək olar bütün siyahı səhifələri (dolayısı ilə, ortaq
primitivlər vasitəsilə).

#### Konflikt həlli auditi — 5 UI primitivi

`agents/qa-reports/FE#69-qa-report-round5.md` §4-də ayrıca audit edilib:
**hər 5 faylda da hər iki tərəfin AC tələbi qəsdən saxlanılıb** — sadəcə
birini seçmək o biri tərəfin bir AC-sini pozardı.

| Fayl | `main` tərəfinin tələbi | FE#69 tərəfinin tələbi | Real nəticə (`a6330ae`) | Niyə sadəcə bir tərəf seçilmədi |
|---|---|---|---|---|
| `Toast.tsx` (`:53-55`) | `h-10 w-10` (40px bağlama düyməsi) | `role="status"`/`aria-live` (F-39), `aria-label`+`title="Bildirişi bağla"`, `KIND_LABEL` sr-only mətni, `focus-ring`, `rounded-chip`/`shadow-overlay` token-ları | Hər ikisi birləşdi: FE#69-un bütün əlçatanlıq işi qalıb, YALNIZ `className`-dəki ölçü `h-8 w-8` (32px) → **`h-10 w-10`** (40px) `main`-dən götürülüb | `main` tam seçilsəydi → `aria-live`/`title`/`KIND_LABEL` (AC-9/AC-15) itərdi. FE#69 tam seçilsəydi → düymə 32px qalıb **AC-8**-i pozardı |
| `PeriodFilter.tsx` (`:48,206,262` + tarix input-ları) | tarix giriş sahələri `h-9` (36px) → **`h-10`** (40px) | `focus-ring-inset`, `rounded-chip`/`rounded-control` token-ları, FE#86 qeydi (`PageToolbar` heç vaxt mövcud olmayıb şərhi), `SegmentedDateFilter` alias | Hər ikisi birləşdi: FE#69-un bütün token/alias/şərh işi qalıb, YALNIZ tarix giriş sahələrinin hündürlüyü `h-9` → **`h-10`** `main`-dən götürülüb | `main` tam seçilsəydi → `focus-ring-inset`/alias (AC-9) itərdi. FE#69 tam seçilsəydi → tarix sahələri 36px qalıb **AC-8**-i pozardı |
| `ActionMenu.tsx` (`:139,194,199,204,206-207`) | `h-10 w-10` trigger, sadə `rounded-lg` sinifləri (FE#69-un token/access-lik işindən **əvvəlki** paralel versiya) | `min-h-[40px]` menyu bəndləri, `focus-ring`/`focus-ring-inset` (R-15), trigger `title`+`aria-label`, mətnli `triggerLabel` propu, token-lar (`rounded-chip`) | **Tamamilə FE#69 tərəfi saxlanıldı**, `main`-in dəyişikliyi diskart edildi | `main` tərəfi bu komponentə FE#69-dan asılı olmayaraq öz xəttində, FE#69-un Addım 2 işindən **əvvəlki** vəziyyəti daşıyırdı — onu seçmək **AC-8/AC-9/AC-15**-in hamısını itirərdi (FE#69 tərəfi bu tələblərin hamısını onsuz da 40px ilə ödəyirdi) |
| `Button.tsx` (`:37-39,79`) | `min-h-[40px]` (`sm` ölçüsü) — eyni FE#69-dan əvvəlki paralel versiya | `loading` propu (F-42, `aria-busy` + spinner), `focus-ring`, `active:scale-[0.99]`, radius token-ları (FE#69-un `sm` ölçüsü onsuz da 40px idi) | **Tamamilə FE#69 tərəfi saxlanıldı** | Eyni səbəb — `main`-in versiyası Addım 2-dən əvvəlki sadə hal idi; onu seçmək **AC-9/AC-15**-i itirərdi, FE#69 tərəfi onsuz da **AC-8**-i ödəyirdi |
| `DataTable.tsx` (`:16,36-38,61-63,94-101`) | — (bu fayla `main`-də ayrıca dəyişiklik yox idi, FE#87-dən əvvəlki hal) | `isError`/`onRetry`/`errorMessage` + `InlineError` (FE#87/Addım 7.1, TC-32), `TableSkeleton`, `TablePagination`, `focus-ring-inset` | **Tamamilə FE#69 tərəfi saxlanıldı** | `main`-in versiyası Addım 7.1 düzəlişindən **əvvəlki** hal idi — onu seçmək TC-32-nin artıq düzəldilmiş 6 səthini geri qaytarardı |

> Qeyd: `docs/ui-terminology.md` da texniki konfliktli idi (hər iki tərəf eyni
> cədvələ fərqli sətirlər əlavə edirdi) — sətirlər sadəcə birləşdirildi,
> məzmun itkisi yoxdur (`agents/qa-reports/FE#69-qa-report-round5.md` §4.1
> ilə təsdiqləndi).

**Build:** ✅ (8.57s, 2812 modul) · **Test:** ❌ **bu commit-in özündə exit 1**
(bax aşağıdakı qeyd — HEAD-də düzəlib)

**⚠️ Bilinən qüsur (bu commit-in özündə, növbəti commit-də düzəldi):**
`main`-dən gələn `Toast.test.tsx` `Toast.tsx`-in köhnə `aria-label="Bağla"`
mətnini gözləyirdi, konflikt həllində isə FE#69-un `"Bildirişi bağla"` mətni
saxlanıldı — nəticədə **bu commit-in özündə** `npm test` 2 sınıq test ilə
**exit 1** verir (`Test Files 1 failed | 14 passed`). Düzəliş dərhal növbəti
commit-də (`30f592c`) edilib və branch HEAD-i yaşıldır, amma bu aralıq
commit-i ayrıca `checkout` edən üçün test sınıqdır (`agents/qa-reports/FE#69-qa-report-round5.md`
§2.2/§7.1).

### 9.3 — `30f592c` — `fix(test): align Toast.test.tsx close-button name with merged aria-label`

**Nə dəyişdi**
- 9.2-də `main`-dən gələn `Toast.test.tsx` close-button assertion-u köhnə
  `"Bağla"` adını axtarırdı; `Toast.tsx`-in konflikt həllində qalan faktiki
  mətn `"Bildirişi bağla"`-dır (AC-15).
- `src/components/ui/Toast.test.tsx`: sorğu `"Bağla"` → `"Bildirişi bağla"`
  ilə əvəz olundu; əlavə olaraq `title` atributu üçün ayrıca assertion
  əlavə edildi (AC-15 sübutu).

**Toxunulan səhifə/komponentlər:** yoxdur (yalnız test faylı).

**Build:** ✅ · **Test:** ✅ 15 fayl / 98 test (9.2-dəki sınıq vəziyyət
düzəldi, branch HEAD-i yaşıldır)

---

## Açıq qalan işlər (branch HEAD `30f592c` vəziyyətinə görə)

`agents/qa-reports/FE#69-qa-report-round5.md`-in tam auditinə əsasən,
aşağıdakılar bu branch-da **hələ açıqdır** — bu sənəd onları "tamamlandı"
kimi təqdim etmir.

### AC-8 / TC-6 — 5 kontrol hələ 40px-dən aşağıdır

Addım 9.2-nin `main`-dən gətirdiyi düzəlişlərlə 25+ pozuntudan 5-ə düşüb;
qalan 5-i FE#69 branch-ının əhatəsindən kənar, ayrıca açıq PR-lardadır:

| # | Fayl:sətir | Element | Effektiv hündürlük | Açıq PR |
|---|---|---|---|---|
| 1 | `PeriodFilter.tsx:328` | «Tarix aralığını təmizlə» (`role="button"`) | 16px | #107 (FE#100) |
| 2 | `FilterBar.tsx:127` | filtr çipinin × düyməsi | 24px | #108 (FE#99, qismən) |
| 3 | `DebtsKpiCards.tsx:56` | «Yenidən» (xəta bloku) | ~26px | #114 (FE#113) |
| 4 | `ProductForm.tsx:419` | «Xüsusiyyəti sil» | 32px | #118 (FE#117) |
| 5 | `login.tsx:80,97` | e-poçt / şifrə input-ları | ~38px | #120 (FE#119) |

### AC-16 — `PageToolbar` və `StatusBadge` hələ real istifadə olunmur

Addım 9.1 (`4131114`) yalnız `TableToolbar`-ı 1 səhifəyə qoşdu:

| Primitiv | Real route istifadəsi |
|---|---|
| `PageToolbar` (`src/components/layout/PageToolbar.tsx`) | **0** |
| `StatusBadge` (`src/components/ui/StatusBadge.tsx`) | **0** (yeganə çağırış `DataTable.test.tsx`-dədir, test) |
| `TableToolbar` (`src/components/ui/TableToolbar.tsx`) | **1** — `_app.musteriler.tsx:129` |

### TC-32 — şəbəkə xətası 4 səthdə hələ «boş nəticə»/sonsuz spinner kimi göstərilir

Addım 7.1 (`f120226`) yalnız 6 səhifəni düzəltdi (Mallar, Müştərilər, Nisyə
Borclar, Təchizatçılar, Satış jurnalı, Xərclər). Aşağıdakı 4 səth həll
olunmayıb (düzəliş `PR #110`-dadır, FE#103, base `task/FE#104-docs-sync`,
açıq — bu branch-a merge olunması üçün yenidən bazalanmalıdır):

| Səth | Fayl:sətir | Faktiki davranış |
|---|---|---|
| Ana səhifə (Dashboard) | `_app.index.tsx:35,37` | `isLoading=false, d=undefined` → sonsuz spinner |
| Hesabatlar | `_app.hesabatlar.tsx:51,118` | eyni naxış → sonsuz spinner |
| İşçilər | `EmployeesTable.tsx:53-59` | şəbəkə xətası «İşçi tapılmadı» kimi görünür |
| Gün Sonu → Bağlanış tarixçəsi | `ClosingHistory.tsx:12,96-101` | şəbəkə xətası «Bağlanış yoxdur» kimi görünür (maliyyə-həssas) |

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

**Qalan işlər — bu branch-ın HEAD-i üçün konkret açıq bəndlər:** bax yuxarı
"Açıq qalan işlər" bölməsi (AC-8 qalan 5 kontrol · AC-16 `PageToolbar`/
`StatusBadge` 0 istifadə · TC-32 qalan 4 səth).

**Qalan işlər (sonrakı mərhələ, bu branch-ın əhatəsindən kənar):** yol
xəritəsinin Mərhələ 1–6 səhifə-səviyyəli işləri — `MobileCard` (F-48),
`DetailCard`/`DetailRow` (F-49), ölü kodun silinməsi (F-46), Hesabatların
dövr filtri (F-26), terminologiyanın qalan sətirləri (F-52), rol badge-ləri
(F-29), Ayarlar sticky zolağı (F-32), Dashboard/Hesabatlar KPI kompozisiyası
(F-05, F-28), kassa tempi (F-11, F-12).

**Silinən komponent / prop:** 0 · **Yeni paket:** 0 · **API/route/icazə
dəyişikliyi:** 0.
