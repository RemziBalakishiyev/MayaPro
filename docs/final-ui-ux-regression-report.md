# Yekun UI/UX regressiya və ardıcıllıq hesabatı (FE#81)

Silsilənin bağlanış taskı. **Yeni funksiya ƏLAVƏ OLUNMAYIB, biznes məntiqi
DƏYİŞMƏYİB.** Yoxlama meyarları: `docs/design-system.md` ·
`docs/ui-terminology.md` · `docs/pages/*-ui-refactor.md` (12 sənəd).

| | |
|---|---|
| Branch | `task/FE81-final-ui-ux-regression` (təzə `origin/main`-dən) |
| Baza (dəyişiklikdən ƏVVƏL) | `npx vitest run` → **47 fayl / 354 test, 0 fail** |
| Yekun (bütün düzəlişlərdən SONRA) | `npx vitest run` → **47 fayl / 354 test, 0 fail** · `npm run build` → **0 xəta** |
| `package.json` / lock | **DƏYİŞMƏYİB** — yeni framework/paket quraşdırılmayıb |

---

## 1. Yekun say

| Status | Say |
|---|---|
| **KEÇDİ** | 12 YOXLA bəndi · AC1, AC3, AC4, AC5, AC6, AC11(qismən), AC12, AC13, AC15, AC17, AC19, AC20 |
| **KƏSİLDİ (düzəldilib)** | 7 tapıntı — AC2, AC8, AC9b, AC10 (×2), AC14, AC15 |
| **KƏSİLDİ (düzəldilməyib — davranış/backend tələb edir)** | 4 tapıntı — AC11 (təsdiqsiz maliyyə modal-ları), AC16 (Enter/barkod), AC6 (padding şkalası), AC9 (palitradan kənar rənglər) |
| **İCRA EDİLƏ BİLMƏDİ** | AC18 + 6 TC (TC24–TC29) — canlı backend əlçatmazdır |

**AC-lər üzrə:** 20 AC-dən 14-ü tam keçdi, 5-i düzəlişdən sonra keçdi,
1-i (AC18) icra edilə bilmədi.
**TC-lər üzrə:** 29 TC-dən 23-ü icra olundu (18 statik + 5 vitest), 6-sı
icra edilə bilmədi.

---

## 2. Keçən yoxlamalar (sübutla)

| # | YOXLA bəndi | Status | Sübut |
|---|---|---|---|
| 1 | Vahid AppShell (sidebar eni, header hündürlüyü, padding) | **KEÇDİ** | `src/index.css:11-12` (`--app-sidebar-w: 16rem`, `--app-header-h: 4rem`) · `AppShell.tsx:50` (`w-sidebar`), `:90` (`px-4 … lg:px-8`) · `TopHeader.tsx:26` (`h-header`) · `lib/ui-tokens.ts:27`. `grep` üzrə heç bir route faylında təkrar `px-*` / `max-w-screen` / `container mx-auto` sarğısı YOXDUR (tapılan `px-*` dəyərləri kart/zolaq daxili paddinglərdir: `_app.ayarlar.tsx:127,279`, `_app.borclar.tsx:366,594`, `login.tsx:59,92,113`). |
| 2 | Vahid PageHeader | **KƏSİLDİ → DÜZƏLDİLDİ** | Aşağı §3.1 |
| 3 | Səhifədə BİR dominant əməliyyat | **KEÇDİ** | Başlıq zonasında variant-sız (primary) `Button` sayı hər səhifədə **≤1**: mallar 1 (+`moreActions`), müştərilər 1, təchizatçılar 1, borclar 1, xərclər 1; index/hesabatlar/gün-sonu/işçilər/ayarlar 0. Deprecated `PageHeader.actions` propu **0 istifadə** (tapılan `actions=` çağırışları `TableToolbar`-ındır: `_app.musteriler.tsx:149`, `_app.tedarukculer.tsx:135`, `ProductFilters.tsx:82`, `ExpenseFilters.tsx:84`, `SalesJournal.tsx:461`). |
| 4 | Vahid tarix/dövr filtri | **KEÇDİ** | Dövr seçimi 6 səhifədə TƏK komponentdən (`components/ui/PeriodFilter.tsx`, alias `SegmentedDateFilter` `:356`): `_app.mallar.tsx:218`, `_app.xercler.tsx:148`, `_app.borclar.tsx:351`, `_app.hesabatlar.tsx:235`, `SalesJournal.tsx:440`. Paralel/ad-hoc dövr seçicisi **0**. `type="date"` yalnız 2 yerdə: `PeriodFilter.tsx:227,242` (komponentin öz aralıq sahələri) və `ExpenseForm.tsx:336` (forma sahəsi — dövr filtri deyil). |
| 5 | Qlobal vs lokal axtarış fərqi | **KEÇDİ (FE#178-də düzəldildi — bax qeyd)** | Qlobal: `GlobalProductSearch.tsx:46-54` — `aria-label="Bütün sistemdə mal axtar"`, `rounded-full`, `bg-stone-100`, Enter ipucu nişanı `:57-63`. Lokal: `LocalTableSearch` + «Bu siyahıda axtar...» (musteriler `:144`, tedarukculer `:130`, borclar `:379,397`, ExpenseFilters `:80`, SalesJournal `:457`). Xam `«Axtar...»` qalığı **0**. Bax §5-də ProductFilters qeydi. **Qeyd (FE#178):** bu sətir FE#81-də səhvən «KEÇDİ» yazılmışdı — yoxlama `LocalTableSearch`/`ExpenseFilters`/`SalesJournal` istifadəçilərini əhatə etmişdi, lakin `ExpenseForm.tsx:357,360` (forma daxilində mal seçimi, ayrıca `Input`) və `LabelPrintModal.tsx:153` (modal daxilində, ayrıca `input`) skan edilməmişdi — bunlar hələ köhnə `«Mal axtar...»` formasında qalmışdı, ona görə AC5 faktiki tam yoxlanmamışdı. FE#178-də hər üç yer `ui-terminology.md` §3-ə uyğunlaşdırıldı (`ExpenseForm.tsx` → `Bu siyahıda axtar...` / `Bu siyahıda axtar`, `LabelPrintModal.tsx` → `Bu siyahıda axtar (ad və ya barkod)...`), axtarış məntiqi/filtr/debounce toxunulmadı — indi «Xam `Mal axtar` qalığı» sayı **0**-dır. |
| 6 | Cədvəl boşluqları və sıralama | **QISMƏN KEÇDİ** | Bütün siyahı cədvəlləri paylaşılan `DataTable`-dandır (yeganə digər `<table>` — `ChartDataTable.tsx:46` — chart-ın "Cədvəl kimi bax" alternativi, `overflow-auto` sarğısındadır, sənədləşdirilmiş istisna). Sıralama TƏK yerdə: `DataTable.tsx:250` `aria-sort` + `:275-281` göstərici, `:269` `focus-ring-inset` + 40px. **Kəsilən alt-bənd:** `:261` `py-3.5` (14px) və `py-2.5` (10px) DS spacing şkalasında (4/8/12/16/20/24/32) yoxdur — bax §5. |
| 7 | Düymə iyerarxiyası | **KEÇDİ** | `ConfirmModal.tsx:74-85` — solda `variant="secondary"`, sağda `primary`/`danger`; eyni ardıcıllıq bütün `*Modal.tsx` footer-lərində. `variant="danger"` yalnız 2 dağıdıcı yerdə: `ExpenseDetailDrawer.tsx:122`, `SaleDetailDrawer.tsx:176`. Əl ilə `Loader2` naxışı düymə daxilində qalmayıb (bax §3.3). |
| 8 | İkon tooltip-ləri və aria-label-lar | **KƏSİLDİ → DÜZƏLDİLDİ** | §3.2 |
| 9 | Maliyyə rəng semantikası | **QISMƏN — bir hissəsi düzəldildi** | (a) Müsbət kassa fərqi kəhrəba, TƏK mənbədən: `cash-diff-presentation.ts:36-41` (`tone: "warning"`); istifadəçiləri `ClosingHistory.tsx:88`, `DayEndCard.tsx:210,247` — paralel hesablama YOXDUR. **KEÇDİ.** (b) Xərclər qırmızısız: Xərclər səhifəsində KEÇDİ (`amount-presentation.tsx:68` `text-stone-900`), Gün Sonunda KƏSİLMİŞDİ → §3.4-də düzəldildi. (c) Rəng heç vaxt yeganə siqnal deyil: `ClosingHistory.tsx:94-98` ikon + `title`, `DayEndCard.tsx:211-218` ikon + `sub` mətni, `InlineError.tsx:45,51`, `Badge.tsx`. **KEÇDİ.** |
| 10 | Loading / boş / xəta / deaktiv vəziyyətlər | **KƏSİLDİ (×2) → DÜZƏLDİLDİ** | §3.5, §3.6 + matris §4 |
| 11 | Təsdiq dialoqları | **QISMƏN KEÇDİ** | Bütün DAĞIDICI əməliyyatlar `ConfirmModal`/`ConfirmDialog` üzərindən keçir (16 istifadə yeri, §4.2). Maaş ödənişi/tutulması iki-addımlı təsdiqdədir (`SalaryPayModal.tsx:142`, `SalaryDeductionModal.tsx:150`). Gün bağlama `DayEndCard.tsx:441` + Promise-li F-43 naxışı. **Kəsilən alt-bənd:** 4 maliyyə modalı (borc ödənişi, təchizatçı ödənişi, təchizatçı borcu, stok düzəlişi) ayrıca təsdiq addımı olmadan birbaşa submit edir — bax §5. |
| 12 | Azərbaycanca terminologiya | **KEÇDİ** | `ui-terminology.md` 1-ci bölmənin **70 sətri** kodda üz-üzə yoxlandı → **qalıq köhnə etiket sayı 0**. Tapılan «Faktiki»/«Gözlənilən» qalıqları qəsdəndir və sənədin öz sətirləri ilə təsdiqlənir (`DayEndCard.tsx:156` «Faktiki məbləği yazın» = sətir #64; `:334` «Faktiki sayılan pul» = giriş sahəsi etiketi, sətir #62 yalnız xülasə kartı/sütun başlıqlarını əhatə edir; `ClosingHistory.tsx:62,71` şərhlərdir). UI-da ingiliscə qalıq mətn yoxdur. |
| 13 | Pul formatı | **KEÇDİ** | `"AZN"` sətri yalnız icazəli 5 kateqoriyada: currency defoltu (`products/types.ts:29`, `settings/store.ts:31`, `mocks/seed.ts:305`), **WhatsApp şablonu** (`settings/store.ts:6`, `_app.ayarlar.tsx:250`), `ProductForm.tsx:64,504` option-u, test fixture-ləri. Yeganə `toFixed(2)` — `customers/lib.ts:16` (WhatsApp `{debt}` əvəzlənməsi, icazəli). Ekranda göstərilən bütün pul dəyərləri `fmtMoney`/`fmtMoneySigned`-dandır; ad-hoc `toFixed(2) + ₼` naxışı **0**. |
| 14 | Responsive + üfüqi daşma | **QISMƏN (statik) — 1 tapıntı düzəldildi** | `w-screen` / `100vw` / `min-w-max` → **0 nəticə**. Sabit `min-w-[…]` dəyərləri: 112px, 144px, 220px (hamısı ≤ 1280px). Mənfi marjin yalnız 2 sticky zolaqda (`PaymentConfirmModal.tsx:287`, `_app.ayarlar.tsx:279`) və hər ikisi eyni ölçüdə `px-*` ilə kompensasiya olunub. Geniş cədvəllər `DataTable.tsx:228` `overflow-x-auto` içindədir. **Tapıntı:** `DebtsKpiCards` → §3.7. **Vizual təsdiq mümkün olmadı** — §7. |
| 15 | Klaviatura naviqasiyası | **KƏSİLDİ (1 yer) → DÜZƏLDİLDİ** | Escape bütün overlay-lərdə: `Modal.tsx:64`, `Drawer.tsx:59`, `AppShell.tsx:39`, `ActionMenu.tsx:98`, `Select.tsx:177`, `PeriodFilter.tsx:142`, `CustomerPicker.tsx:116`, `LabelPrintModal.tsx:126`. Üst-üstə panellərdə ortaq kilid sayğacı: `components/ui/dialog-layer.ts`. **Müsbət `tabIndex` (>0) → 0 nəticə** (bütün dəyərlər `0` və ya `-1`). `outline-none` hər yerdə fokus göstəricisi ilə əvəzlənib — YEGANƏ istisna `QtyStepper.tsx:52` idi → §3.2. |
| 16 | Barkod skaner və Enter axını | **KƏSİLDİ — düzəldilmədi (yeni funksiya)** | §5 |

---

## 3. Kəsilən və DÜZƏLDİLƏN yoxlamalar (commit-lər üzrə)

### 3.1 `fix(ui): deprecated PageHead alias evezine PageHeader` — AC2

**Tapıntı:** 4 route hələ də FE#69-da deprecated elan olunmuş `PageHead`
alias-ını çağırırdı: `_app.index.tsx:18,131,144,212` · `_app.gun-sonu.tsx:2,14`
· `_app.iscilar.tsx:3,51` · `_app.ayarlar.tsx:4,124`.
**Düzəliş:** birbaşa `PageHeader` idxalı. `PageHead` sadəcə `PageHeader`-ə
yönləndirir (`PageHead.tsx:16`) → görünüş/davranış **neytraldır**.
`PageHead.tsx` faylının özü geriyə uyğunluq üçün SİLİNMƏDİ.

### 3.2 `fix(ui): catismayan tooltip (title) ve fokus tokeni` — AC8, AC15

**Tapıntı A (15 yer):** xam ikon-yalnız `<button>` elementlərində `aria-label`
var idi, `title` (tooltip) YOX idi — AC8 hər ikisini tələb edir.
`ExpenseRows.tsx:156` · `FilterBar.tsx:138` · `CustomerDrawer.tsx:397` ·
`SalaryCard.tsx:119,128` · `SalaryHistoryDrawer.tsx:103` ·
`SalaryMonthSwitcher.tsx:26,37` · `ExpenseFilters.tsx:120` ·
`LabelPrintModal.tsx:555` · `ProductFilters.tsx:118` · `ProductForm.tsx:416` ·
`QtyStepper.tsx:35,56` · `SalesJournal.tsx:515`.
**Düzəliş:** hamısına `aria-label` ilə eyni mətnli `title`. Deaktiv ola
bilənlərdə `title` səbəbi izah edir (DS §1.7): `SalaryMonthSwitcher` →
«Gələcək ay seçilə bilməz», `QtyStepper` → «Minimum miqdar: N» /
«Anbarda daha çox qalıq yoxdur».

**Tapıntı B (AC15):** `QtyStepper.tsx:52` input-unda `outline-none` fokus
göstəricisini **əvəzsiz** silirdi (DS §1.7 pozuntusu); eyni komponentin iki
addım düyməsində də fokus tokeni yox idi; input **etiketsiz** idi.
**Düzəliş:** hər üç kontrolda `focus-ring-inset` + input-a `aria-label="Miqdar"`.

**Yoxlama:** düzəlişdən sonra avtomatik skan → *icon-only buttons missing
aria-label AND/OR title: **0***. `IconButton` istifadələri onsuz da tip
səviyyəsində qorunur (`IconButton.tsx:33` — `label` MƏCBURİ, `npm run build`
təsdiqləyir). Kritik əməliyyatlar (sil · günü bağla · ödəniş təsdiqi ·
ziyana satış) yalnız-ikon düymə ilə TƏQDİM OLUNMUR — hamısı mətnli `Button`-dur.

### 3.3 `fix(ui): catismayan loading veziyyeti (Button loading propu)` — AC7, AC10

**Tapıntı:** DS §3.1 gözləmə üçün `Button`-un `loading` propunu tələb edir
(spinner + `aria-busy` + təkrar klik bloku). **12 submit düyməsi** bunun
əvəzinə yalnız `disabled={mut.isPending}` işlədirdi → istifadəçi heç bir
görünən geri bildirim almırdı. `ExcelImportModal.tsx:438` isə DS-in qadağan
etdiyi əl ilə `Loader2` naxışını işlədirdi.
**Düzəliş:** `CategoryField:58` · `ExpenseTypeField:64` ·
`EditCustomerModal:79` · `NewCustomerModal:108` · `PaymentModal:115` ·
`suppliers/PayModal:78` · `suppliers/DebtModal:65` · `EditSupplierModal:79` ·
`NewSupplierModal:93` · `StockAdjustModal:87` · `SaleEditDrawer:200` ·
`ExcelImportModal:438`.
`Button.tsx:74` — `loading` avtomatik `disabled` verir, ona görə deaktivlik
davranışı **EYNİ** qalır; validasiya şərtləri `disabled`-də saxlanılıb.
İkinci dərəcəli «Geri»/«Ləğv et» düymələri toxunulmadı (gözləyən əməliyyat
deyillər).

### 3.4 `fix(ui): reng semantikasi — Gun Sonu xercleri artiq qirmizi deyil` — AC9b

**Tapıntı:** «xərc normal əməliyyatdır, ziyan/kritik deyil» qaydası FE#76 ilə
Xərclər səhifəsinə tətbiq olunmuşdu (`amount-presentation.tsx`,
`docs/pages/expenses-ui-refactor.md` §3), lakin **Gün Sonu səhifəsində qalıq
idi** → eyni anlayış iki səhifədə iki fərqli rəngdə görünürdü.
`DayEndCard.tsx:230,297` (`text-red-600`), `:303` (`text-red-500`),
`ClosingHistory.tsx:56` (`text-red-600`).
**Düzəliş:** qırmızı çıxarıldı. İstiqamət `«−»` prefiksi (DayEndCard) və sütun
başlığı (ClosingHistory) ilə onsuz da verilir; DS §1.8-ə görə qırmızı YALNIZ
dağıdıcı əməliyyat / ziyan / kritik problem üçündür.
**Toxunulmadı:** `cash-diff-presentation.ts` (müsbət fərq = kəhrəba) — tək
mənbədədir və doğrudur.

### 3.5 `fix(ui): Gun Sonu kartinda catismayan xeta veziyyeti` — AC10 (KRİTİK)

**Tapıntı:** bütün siyahı səhifələrində `isError → InlineError + «Yenidən»`
var idi, LAKIN `DayEndCard`-da **heç bir xəta və ya yüklənmə vəziyyəti yox
idi**. `useSummary("today")` uğursuz olduqda `cashSales`/`expenses` səssizcə
`0` kimi görünür (`DayEndCard.tsx:130-134` `?? 0`), «Bu günün sonunda kassada
olmalı» rəqəmi YANLIŞ hesablanır və sahibkar bu rəqəm üzərindən günü bağlaya
bilərdi — maliyyə baxımından ən həssas ekranda F-44 naxışı.
**Düzəliş:** xəta açıq elan olunur (`InlineError` «Bugünkü cəmlər yüklənmədi»
+ izah + «Yenidən»).
**ƏHATƏ MƏHDUDİYYƏTİ:** yalnız əlavə xəbərdarlıq. Düsturlar
(`expectedCash`/`difference`), bağlanış axını, düymə şərtləri və mutasiyalar
DƏYİŞMƏYİB. Xəta halında bağlanışın tam **bloklanması** davranış
dəyişikliyidir → §6-da ayrıca task kimi tövsiyə olunur.

### 3.6 `fix(ui): Fealiyyet jurnalinda xeta/yuklenme veziyyeti` — AC10

**Tapıntı:** `ActivityLog.tsx:45` YALNIZ boş vəziyyəti bilirdi — şəbəkə xətası
da, ilk yüklənmə də «Fəaliyyət yoxdur» kimi görünürdü (yanıldıcı boş nəticə).
**Düzəliş:** DS §3.5 prioriteti — xəta → yüklənmə → boş → data.
`InlineError` «Fəaliyyət jurnalı yüklənmədi» + `TableSkeleton` (spinner deyil).

### 3.7 `fix(ui): ufuqi dasma qorumasi — DebtsKpiCards money sinfi` — AC14

**Tapıntı** (issue #81-in birinci şərhindəki «prioritet nöqtə», FE#69-dan
ötürülən AC-17 qalığı): `DebtsKpiCards.tsx:111,126,140` — `whitespace-nowrap`
+ `text-2xl/3xl`, **`truncate`/`min-w-0` OLMADAN**; sarğı `div`-lərində də
`min-w-0` yox idi (`:104` `sm:w-40` yalnız ≥640px-də işləyir). 375px-də çox
uzun «Ümumi qalıq» məbləği səhifəni üfüqi sürüşdürə bilirdi. Eyni faylın
`:181` sətri artıq DÜZGÜN naxışı göstərirdi → qoruma qeyri-ardıcıl idi.
**Düzəliş:** hər üç rəqəm paylaşılan `.money` tokeninə keçdi
(`min-w-0 + overflow-hidden + truncate + tabular-nums`, DS §1.5); sarğılara
`min-w-0`; «Ümumi qalıq» üçün tam dəyər `title`-də.

### 3.8 `fix(ui): Satis basliginin tipoqrafiya/bosluq uygunlasdirmasi` — AC1

**Tapıntı:** `QuickSaleScreen.tsx:419` xam `<h1>`-də `leading-tight` yox idi
və alt boşluq `mb-4` idi, halbuki `PageHeader.tsx:56,61` bütün digər
səhifələrdə `mb-6` + `leading-tight` verir → səhifələr arası keçiddə başlıq
xətti sürüşürdü.
**Düzəliş:** eyni tipoqrafiya + eyni alt boşluq. Satışın `PageHeader`
işlətməməsi (tam-ekran POS) **qəsdən istisnadır** və saxlanılıb.

---

## 4. Matrislər

### 4.1 Vəziyyət matrisi (AC10) — düzəlişlərdən SONRA

| Səhifə / komponent | loading | boş | xəta + «Yenidən» | deaktiv səbəbi |
|---|---|---|---|---|
| Mallar — `ProductsTable` | ✅ `:367` | ✅ `:371` | ✅ `:368-369` | ✅ |
| Satış jurnalı — `SalesJournal` | ✅ `:680` | ✅ `:687` | ✅ `:681-682` | ✅ |
| Müştərilər — `CustomersTable` | ✅ `:311` | ✅ `:316` | ✅ `:312-313` | ✅ |
| Nisyə Borclar — `OpenDebtsTable` | ✅ `:217` | ✅ `:226` | ✅ `:218-219` | ✅ |
| Təchizatçılar — `SuppliersTable` | ✅ `:228` | ✅ `:232` | ✅ `:229-230` | ✅ |
| Xərclər — `ExpensesTable` | ✅ `:240` | ✅ `:245` | ✅ `:241-242` | ✅ |
| İşçilər — `EmployeesTable` | ✅ `:79` | ✅ `:84` | ✅ `:80-81` | ✅ |
| Maaşlar — `SalaryBoard` | ✅ `:43` | ✅ `:55` | ✅ `:49-52` | ✅ |
| Gün Sonu — `ClosingHistory` | ✅ `:113` | ✅ | ✅ `:114-115` | ✅ |
| **Gün Sonu — `DayEndCard`** | ⚠️ yalnız `summary` xətası | — | ✅ **FE#81-də əlavə olundu** | ✅ `:156-159` |
| **Fəaliyyət — `ActivityLog`** | ✅ **FE#81** | ✅ | ✅ **FE#81** | — |
| Dashboard — `_app.index` | ✅ `:112` | ✅ `:216` | ✅ `:128-135`, `:216-219` | ✅ |
| Hesabatlar — `_app.hesabatlar` | ✅ `:82` | ✅ | ✅ `:199-206`, `:239-242` | ✅ |

Vəziyyət prioriteti (xəta → yüklənmə → boş → məlumat) `DataTable.tsx:150-174`
səviyyəsində mərkəzləşdirilib; arxa-fon refetch xətası `StaleDataBanner`
(`:166,188`) ilə ayrıca idarə olunur (FE#142).
Səhifə-spesifik xəta mətnləri `ui-terminology.md` #24–#29 ilə üst-üstə düşür.

### 4.2 Təsdiq matrisi (AC11)

| Əməliyyat | Fayl | Təsdiq |
|---|---|---|
| Müştəri sil | `_app.musteriler.tsx:259` | ✅ `ConfirmModal` |
| Mal sil | `_app.mallar.tsx:279` | ✅ |
| Təchizatçı sil | `_app.tedarukculer.tsx:242` | ✅ |
| Xərc sil | `_app.xercler.tsx:215` | ✅ |
| Borc sətrini sil | `_app.borclar.tsx:679` | ✅ |
| Nisyə borcu sil | `CustomerDrawer.tsx:418` | ✅ |
| Satış sil | `SalesJournal.tsx:803` | ✅ |
| Maaş qeydini sil | `SalaryHistoryDrawer.tsx:120` | ✅ |
| **Günü bağla** | `DayEndCard.tsx:441` | ✅ + F-43 (xətada dialoq açıq qalır) |
| **Maaş ödə** | `SalaryPayModal.tsx:142` | ✅ iki-addımlı |
| **Tutulma əlavə et** | `SalaryDeductionModal.tsx:150` | ✅ iki-addımlı |
| **Ödəniş təsdiqi (satış)** | `PaymentConfirmModal.tsx` | ✅ ayrıca təsdiq modalı |
| **Ziyana satış** | `LossConfirmModal.tsx` | ✅ |
| Ayarları yadda saxla | `_app.ayarlar.tsx:309` | ✅ `ConfirmDialog` |
| **Borc ödənişi al** | `customers/PaymentModal.tsx:113` | ❌ birbaşa submit — §5 |
| **Təchizatçıya ödəniş** | `suppliers/PayModal.tsx:76` | ❌ birbaşa submit — §5 |
| **Təchizatçı borcu əlavə et** | `suppliers/DebtModal.tsx:63` | ❌ birbaşa submit — §5 |
| **Stok düzəlişi** | `StockAdjustModal.tsx:85` | ❌ birbaşa submit — §5 |

---

## 5. Kəsilən, LAKIN DÜZƏLDİLMƏYƏN tapıntılar (səbəbi ilə)

Bu bəndlərin hamısı **davranış/domen dəyişikliyi** tələb edir və taskın
«yeni funksiya əlavə etmə, biznes məntiqini dəyişmə» qaydasına görə burada
düzəldilmədi.

| # | Tapıntı | Yer | Niyə düzəldilmədi |
|---|---|---|---|
| F-1 | **4 maliyyə əməliyyatı ayrıca təsdiq addımı olmadan submit edir** (borc ödənişi, təchizatçıya ödəniş, təchizatçı borcu, stok düzəlişi). `PaymentModal.tsx:98` — üstəlik `Enter` birbaşa `save()` çağırır → təsadüfi Enter ödəniş yazır. | `customers/PaymentModal.tsx:113`, `suppliers/PayModal.tsx:76`, `suppliers/DebtModal.tsx:63`, `StockAdjustModal.tsx:85` | Təsdiq addımı əlavə etmək axını dəyişir (yeni addım, yeni state). `SalaryPayModal` iki-addımlı naxışı hazır presedentdir → ayrıca task. **Prioritet: yüksək** (geri alınmayan maliyyə əməliyyatı). |
| F-2 | **Satış ekranında Enter/barkod axını YOXDUR.** `QuickSaleScreen.tsx:435-442` — axtarış input-unda `onKeyDown` handler-i yoxdur; barkod skaneri simvolları + `Enter` göndərir, `Enter` heç nə etmir; tək nəticə avtomatik seçilmir, fokus geri qaytarılmır. `searchRef.current?.focus()` yalnız `:113`-də (satışdan sonra) çağırılır. | `QuickSaleScreen.tsx` | AC16 tələb etdiyi davranış **mövcud deyil** — əlavə edilməsi YENİ FUNKSİYADIR. **Prioritet: yüksək** (kassa iş sürəti). |
| F-3 | `DataTable` sütun padding-i (`py-3.5` = 14px, `py-2.5` = 10px) DS spacing şkalasında (4/8/12/16/20/24/32) yoxdur. | `DataTable.tsx:261` | Dəyişiklik BÜTÜN cədvəllərin sətir hündürlüyünü/sıxlığını dəyişir → vizual regressiya riski, vizual təsdiq aləti yoxdur. |
| F-4 | Palitradan kənar rənglər sistemli şəkildə işlədilir: `indigo` (Kart ödənişi kimliyi), `orange` (artıq ödəniş), `rose`, `violet`, `teal`, `green-700`. DS §1.8 semantik palitrası: emerald/amber/red/sky/stone. | `StatCard.tsx:11,18`, `Badge.tsx:10,15,37,44,47`, `PaymentConfirmModal.tsx:24`, `SaleEditDrawer.tsx:50`, `_app.index.tsx:46,51`, `ActivityLog.tsx:26-27`, `SalaryCard.tsx:201`, `DayEndCard.tsx:290` | Bunlar **status/kimlik** rəngləridir (ödəniş növü, rol, kateqoriya), semantik status DEYİL. Sistemli dəyişiklik geniş vizual refactordur → DS sənədinə palitra genişlənməsi kimi yazılmalı, ayrıca task. |
| F-5 | «Ləğv et» / «İmtina» ardıcıl deyil: 14 yerdə «İmtina», 3 yerdə «Ləğv et» (`ProductForm.tsx:330`, `PaymentConfirmModal.tsx:295`, `_app.ayarlar.tsx:295`). | — | «Ləğv et» `docs/pages/settings-ui-refactor.md:59` ilə **sənədləşdirilmiş qərardır** (dəyişikliyi ləğv etmək ≠ dialoqdan imtina) və `_app.ayarlar.test.tsx` ilə test-kilidlidir. Terminologiya sənədində qayda yoxdur → əvvəlcə qayda təsbit edilməlidir. |
| F-6 | `ProductFilters.tsx:78` placeholder-i «Bu siyahıda mal adı, kateqoriya və xüsusiyyət üzrə axtar» — `ui-terminology.md` §3-ün kanonik formasına («Bu siyahıda axtar... (əhatə mötərizədə)») uyğun deyil. | `ProductFilters.tsx:78` | Bu mətn `ui-terminology.md` sətir **#33** ilə (FE#70 AC-6) **qəsdən** təyin edilib və `ProductFilters.test.tsx:24` ilə test-kilidlidir. Meyar sənədinin daxili ziddiyyətidir → əvvəlcə sənəd düzəlməlidir. |
| F-7 | `.money` tokeni DS §1.5-in iddia etdiyi qədər geniş tətbiq olunmayıb: sənəd «cədvəl pul sütunları»nı da sadalayır, kodda isə cədvəl xanalarında yalnız `tabular-nums` var (6 istifadə: `KpiCard:93,179`, `StatCard:78`, `DayEndCard:315`, `_app.tsx:115` + FE#81-də əlavə olunan `DebtsKpiCards`). | — | Bütün cədvəl pul xanalarına `truncate` əlavə etmək daşma əvəzinə **kəsilmə** gətirir — vizual təsdiq olmadan risklidir. Sənəd/kod uyğunsuzluğu kimi qeyd olunur. |

---

## 6. «Backend tələb edir» / backend ilə doğrulanmalı

| # | Tapıntı | Detal |
|---|---|---|
| B-1 | **Borc ödənişi `["summary"]` keşini ləğv etmir.** `customers/queries.ts:117-121` — `useAddCustomerPayment` `customers`, `payments`, `history`, `dashboard`, `activity` açarlarını yeniləyir, `["summary"]`-ni YOX. Gün Sonu səhifəsi məhz `useSummary("today")` oxuyur. | Əgər backend `GetSummaryHandler` müştəri borc ödənişlərini `cashSales`-ə qatırsa, borc ödənişindən sonra Gün Sonu **köhnə rəqəm** göstərir. Cavab backend davranışından asılıdır (`backend/.../DashboardCalculator.cs`, `DAYEND-FLOW.md`) → frontend-də təxminlə düzəliş edilmədi. **Backend təsdiqi lazımdır.** |
| B-2 | Gün Sonunda xəta halında bağlanışın bloklanması | FE#81-də yalnız xəbərdarlıq əlavə olundu (§3.5). Tam blok = davranış dəyişikliyi + backend-in "stale summary" semantikası ilə razılaşdırma tələb edir. |
| B-3 | 409 emalı — **kod-oxuma ilə DOĞRU təsdiqləndi**, canlı sınaq mümkün olmadı | `DayEndCard.tsx:172-190`: `ApiError.status === 409` **və** mesaj regexi (`/artıq bağlanıb/i`, mock rejimi üçün) → azərbaycanca «Bu gün artıq bağlanıb», `setJustClosedElsewhere(true)` → düymə deaktiv + səbəb `:158`-də, `refetchTodayClosing()` ilə xülasə kartına keçid, xəta yenidən atılır ki, `ConfirmModal` açıq qalsın (F-43). Digər 409 yerləri: `SaleEditDrawer.tsx:175`, `SalesJournal.tsx:364`, `ExcelImportModal.tsx:217`. |

---

## 7. Screenshot bölməsi — **ALƏT YOXDUR**

Layihədə **Playwright / Cypress / Puppeteer və ya hər hansı vizual
regressiya aləti YOXDUR** (`package.json` → yalnız `vitest` +
`@testing-library` + `happy-dom`). Taskın açıq qaydasına görə (və AC17-nin
«package.json dəyişməyib» şərtinə görə) **yeni framework QURAŞDIRILMADI**.

Nəticə:
- Heç bir səhifə screenshot-u tutulmadı.
- **1280×720 · 1366×768 · 1440×900 · 1920×1080 · 375px** viewport-larında
  faktiki render ölçülməsi **icra edilə bilmədi**.
- AC14 (responsive/üfüqi daşma) yalnız **statik analizlə** yoxlandı və
  hesabatda «qismən (statik)» statusundadır. FE#69-dan ötürülən AC-17/AC-18
  qalığı da eyni səbəbdən yalnız statik olaraq bağlandı — §3.7-dəki tapıntı
  statik analizlə tapılıb və düzəldilib, **vizual təsdiqi qalır**.

**Tövsiyə (gələcək task):** ayrıca `@playwright/test` dev-asılılığı +
`tests/visual/` qovluğu ilə 13 route üçün 5 viewport-da baseline screenshot
seti. Bu, `AC-20` (stack toxunulmazlığı) qaydasını pozduğu üçün ÖZ taskında
və öz qərarı ilə edilməlidir — bu taskda deyil.

---

## 8. Vizual regressiyalar

**Aşkarlanan vizual regressiya: 0.**
FE#70…FE#80 silsiləsinin heç bir səhifəsində əvvəlki mərhələnin nailiyyəti
geri getməyib: `AppShell`/`PageHeader`/`PeriodFilter`/`DataTable`/
`TableToolbar` naxışları 10 route-da eynidir, `LocalTableSearch` 6 səhifədə
eyni mətn/görünüş dilindədir, `cash-diff-presentation` qaydası tək mənbədədir.

**Qeyd:** «vizual regressiya YOXDUR» iddiası **statik analiz + vitest**
əsaslıdır — piksel səviyyəsində təsdiq §7-yə görə mümkün deyil.

FE#81-in özünün gətirdiyi görünüş dəyişiklikləri (qəsdən, hamısı DS-ə
yaxınlaşdırır):
1. Gün Sonu «Günlük xərclər» / «Xərc» sütunu artıq qırmızı deyil (§3.4).
2. Satış başlığının alt boşluğu `mb-4` → `mb-6` (§3.8).
3. 12 submit düyməsində gözləmə zamanı spinner görünür (§3.3).
4. Nisyə Borclar KPI rəqəmləri dar ekranda kəsilir (əvvəl daşırdı) (§3.7).

## 9. Funksional regressiyalar

**Aşkarlanan funksional regressiya: 0.**
- `npx vitest run`: baza **354/354** → yekun **354/354** (yeni fail: 0).
- `npm run build` (`tsc && vite build`): **0 xəta**.
- Route sxemləri, URL search parametrləri, query açarları, mutasiya
  imzaları və `invalidateQueries` dəstləri **toxunulmayıb**.
- `git diff --stat package.json package-lock.json` → **boş**.

---

## 10. Həll olunmamış risklər

| ID | Risk | Ciddilik | Yer |
|---|---|---|---|
| R-A | Maliyyə əməliyyatları (borc/təchizatçı ödənişi, stok düzəlişi) təsdiqsiz submit olunur; `PaymentModal`-da Enter birbaşa yazır | **Yüksək** | §5 F-1 |
| R-B | Satışda barkod/Enter axını yoxdur — skaner ilə iş faktiki dəstəklənmir | **Yüksək** | §5 F-2 |
| R-C | Borc ödənişi `["summary"]` keşini ləğv etmir → Gün Sonu köhnə rəqəm göstərə bilər | **Orta** (backend asılı) | §6 B-1 |
| R-D | Gün Sonunda summary xətası bağlanışı bloklamır — yalnız xəbərdarlıq var | **Orta** | §3.5, §6 B-2 |
| R-E | Üfüqi daşma və 375px davranışı **piksel səviyyəsində ölçülməyib** | **Orta** | §7 |
| R-F | 5 kritik axın (satış 3 ödəniş variantı, borc ödənişi, xərc→maya, gün bağlama 409, maaş avansı→gün sonu) canlı rejimdə sınanmayıb | **Orta** | §11 |
| R-G | DS sənədi ilə kod arasında 3 uyğunsuzluq (padding şkalası, `.money` əhatəsi, palitra) | **Aşağı** | §5 F-3, F-4, F-7 |
| R-H | «Ləğv et»/«İmtina» və lokal axtarış placeholder-i üçün terminologiya qaydası tam təsbit olunmayıb | **Aşağı** | §5 F-5, F-6 |

---

## 11. İCRA EDİLƏ BİLMƏYƏN yoxlamalar (canlı backend əlçatmazdır)

Bu sessiyada **şəbəkə əmrləri bloklanıb** (curl / netstat / fetch) → canlı
`mayapro-warehouse-api`-yə heç bir sorğu göndərmək mümkün deyil.
Aşağıdakılar **«kəsildi» SAYILMIR** — icra edilə bilmədi.

| TC | Axın | Status | Kod-oxuma ilə nə təsdiqləndi |
|---|---|---|---|
| TC24 | Satış — 3 ödəniş variantı (Nağd/Kart/Nisyə) → qaimə | icra edilə bilmədi | `PaymentConfirmModal.tsx:24` üç variant · `sales/queries.ts:34-40` `invalidateSaleSideEffects` → `sales`+`products`+`customers`+`dashboard`+`summary`+`activity` (KPI/jurnal düzgün yenilənir) · qaimə `useInvoiceDownload.ts` |
| TC25 | Borc ödənişi (tam + qismən) | icra edilə bilmədi | `customers/queries.ts:112-121` mutasiya + keş ləğvi ✅, **lakin `summary` əskikdir** (§6 B-1) · qismən ödəniş validasiyası `PaymentModal.tsx:43-46` · **təsdiq dialoqu yoxdur** (§5 F-1) |
| TC26 | Xərc → «Real maya» təsiri | icra edilə bilmədi | `expenses/queries.ts:17-21` → `expenses`+**`products`**+`dashboard`+`summary`+`activity`; `products` ləğvi «Real maya» sütununun yenilənməsini təmin edir ✅ · tooltip mətnləri `ui-terminology.md` #36–#38 ilə uyğun |
| TC27 | Gün bağlama → təkrar bağlamada **409** | icra edilə bilmədi | **Kod-oxuma ilə TAM təsdiqləndi** — §6 B-3 |
| TC28 | Maaş avansı → gün sonu hesabına düşməsi | icra edilə bilmədi | `employees/queries.ts:51-57` → `salary-summary`+`salary-entries`+`employees`+`activity`+`dashboard`+**`summary`**+**`closings`**; hər iki kritik açar var ✅ · şəffaflıq sətri `DayEndCard.tsx:301-306` («O cümlədən: işçi maaş ödənişləri») |
| TC29 | Backend söndürülmüş halda hər səhifə | icra edilə bilmədi | Statik matris §4.1 — 13 səhifə/panelin hamısında `isError → InlineError + «Yenidən»` var (2-si FE#81-də əlavə olundu). Xam brauzer mətni (`Failed to fetch`) heç yerdə göstərilmir; `api-client.ts:88-96` `toApiError` azərbaycanca defolt verir. |

---

## 12. Toxunulan fayllar

**Kod (16 fayl):**

```
src/components/ui/ExpenseRows.tsx
src/components/ui/FilterBar.tsx
src/features/categories/components/CategoryField.tsx
src/features/customers/components/CustomerDrawer.tsx
src/features/customers/components/DebtsKpiCards.tsx
src/features/customers/components/EditCustomerModal.tsx
src/features/customers/components/NewCustomerModal.tsx
src/features/customers/components/PaymentModal.tsx
src/features/day-end/components/ClosingHistory.tsx
src/features/day-end/components/DayEndCard.tsx
src/features/employees/components/ActivityLog.tsx
src/features/employees/components/SalaryCard.tsx
src/features/employees/components/SalaryHistoryDrawer.tsx
src/features/employees/components/SalaryMonthSwitcher.tsx
src/features/expense-types/components/ExpenseTypeField.tsx
src/features/expenses/components/ExpenseFilters.tsx
src/features/products/components/ExcelImportModal.tsx
src/features/products/components/LabelPrintModal.tsx
src/features/products/components/ProductFilters.tsx
src/features/products/components/ProductForm.tsx
src/features/products/components/StockAdjustModal.tsx
src/features/sales/components/QtyStepper.tsx
src/features/sales/components/QuickSaleScreen.tsx
src/features/sales/components/SaleEditDrawer.tsx
src/features/sales/components/SalesJournal.tsx
src/features/suppliers/components/DebtModal.tsx
src/features/suppliers/components/EditSupplierModal.tsx
src/features/suppliers/components/NewSupplierModal.tsx
src/features/suppliers/components/PayModal.tsx
src/routes/_app.ayarlar.tsx
src/routes/_app.gun-sonu.tsx
src/routes/_app.index.tsx
src/routes/_app.iscilar.tsx
```

**Sənəd (3 yeni fayl):**

```
docs/final-ui-ux-regression-report.md   (bu fayl)
docs/ui-ux-known-limitations.md
docs/ui-ux-final-changelog.md
```

**TOXUNULMAYIB:** `package.json`, `package-lock.json`, `tailwind.config.ts`,
`vite.config.ts`, `src/index.css`, `src/mocks/**`, bütün `*.test.*` faylları,
bütün `api.ts` / `queries.ts` (keş və mutasiya qatı), `backend/` (bu agentin
iş sahəsindən kənardır).

---

## 13. Tövsiyə olunan növbəti addımlar (prioritetlə)

1. **[Yüksək]** Maliyyə əməliyyatlarına təsdiq addımı — borc ödənişi,
   təchizatçıya ödəniş, təchizatçı borcu, stok düzəlişi. Presedent:
   `SalaryPayModal` iki-addımlı naxışı. `PaymentModal.tsx:98`-dəki Enter
   qısayolu da təsdiq addımına yönləndirilməlidir. (§5 F-1)
2. **[Yüksək]** Satış ekranında barkod/Enter axını: Enter ilə tək nəticənin
   səbətə düşməsi, tam barkod uyğunluğu, tapılmayan barkodda anlaşıqlı mesaj,
   fokusun input-a qayıtması. (§5 F-2)
3. **[Orta]** `useAddCustomerPayment`-in `["summary"]` keşini ləğv edib-etməməsi
   backend `GetSummaryHandler` davranışı ilə doğrulansın. (§6 B-1)
4. **[Orta]** Gün Sonu: summary xətasında bağlanışın bloklanması qərarı
   (davranış dəyişikliyi → öz AC/TC-si ilə). (§6 B-2)
5. **[Orta]** Vizual regressiya alətinin (Playwright) ayrıca taskda
   qurulması + 13 route × 5 viewport baseline. (§7)
6. **[Aşağı]** `design-system.md` sinxronizasiyası: spacing şkalasına
   cədvəl padding dəyərləri, `.money` əhatəsinin real vəziyyəti, status/kimlik
   rəngləri üçün genişlənmiş palitra. (§5 F-3, F-4, F-7)
7. **[Aşağı]** `ui-terminology.md`-yə iki qayda: «Ləğv et» vs «İmtina» və
   lokal axtarış placeholder-inin kanonik forması (mövcud daxili ziddiyyət).
   (§5 F-5, F-6)
8. **[Aşağı]** `PageHead.tsx` deprecated alias-ının silinməsi — FE#81-dən
   sonra **0 istifadəçisi qalıb**.

---

## 14. Commit siyahısı

| Commit | Kateqoriya | AC |
|---|---|---|
| `fix(ui): catismayan tooltip (title) ve fokus tokeni` | tooltip / a11y | AC8, AC15 |
| `fix(ui): deprecated PageHead alias evezine PageHeader` | struktur / ardıcıllıq | AC2 |
| `fix(ui): catismayan loading veziyyeti (Button loading propu)` | vəziyyət | AC7, AC10 |
| `fix(ui): ufuqi dasma qorumasi - DebtsKpiCards money sinfi` | daşma | AC14 |
| `fix(ui): reng semantikasi - Gun Sonu xercleri artiq qirmizi deyil` | rəng semantikası | AC9 |
| `fix(ui): Satis basliginin tipoqrafiya/bosluq uygunlasdirmasi` | boşluq | AC1 |
| `fix(ui): Gun Sonu kartinda catismayan xeta veziyyeti` | vəziyyət | AC10 |
| `fix(ui): Fealiyyet jurnalinda xeta/yuklenme veziyyeti` | vəziyyət | AC10 |
| `docs(ui): yekun regressiya senedleri` | sənəd | AC19 |

---

## 15. FE#178 qeydi — bu sənədin özündə tapılan uyğunsuzluq

Bu fayl FE#81 PR-ında (#176, `task/FE81-final-ui-ux-regression`) yaradılıb,
lakin həmin PR **hələ `main`-ə merge olunmayıb**. FE#178 (bu sənədin §2
sətir 5-ni düzəldən bug-fix) `origin/main`-dən açılan ayrı branch-dədir və
bu fayl orada mövcud olmadığı üçün FE#81-in yaratdığı versiya əsas götürülüb
və üzərinə yalnız AC5 sətri düzəldilib. **PR-lar arasında merge ardıcıllığı
diqqətlə idarə olunmalıdır** (məs. #176 əvvəl merge olunsun, sonra bu PR
rebase edilsin, ya da əksinə — sənəd təkrarlanmasın).
