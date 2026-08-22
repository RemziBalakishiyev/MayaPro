# QA Report — FE#81 (Yekun UI/UX regressiya və ardıcıllıq yoxlaması)

| | |
|---|---|
| Task | FE#81 — https://github.com/RemziBalakishiyev/MayaPro/issues/81 |
| PR | https://github.com/RemziBalakishiyev/MayaPro/pull/176 |
| Branch | `task/FE81-final-ui-ux-regression` (9 commit: 8 × `fix(ui)` + 1 × `docs(ui)`) |
| QA dövrü | 1-ci |
| Yekun qərar | **KƏSİLDİ** — 3 bug (1 orta, 1 orta, 1 aşağı); əsas dəyər itkisi hesabatın dürüstlüyündədir |

---

## 1. İcra xülasəsi

| Yoxlama | Nəticə |
|---|---|
| `npx vitest run` | ✅ **47 test faylı / 354 test — 0 fail** (baza ilə eyni, reqressiya yoxdur) |
| `npm run build` (`tsc && vite build`) | ✅ **0 xəta** (2818 modul, 5.36s; yalnız mövcud chunk-size xəbərdarlığı) |
| `git diff origin/main...HEAD -- package.json package-lock.json` | ✅ **boş** — yeni framework/paket quraşdırılmayıb |
| Diff həcmi | 36 fayl (33 kod + 3 sənəd), +1098 / −46 |
| Screenshot / vizual regressiya | ⚠️ **alət yoxdur** — Playwright/Cypress/Puppeteer repoda mövcud deyil, task qaydasına görə quraşdırılmadı |
| Canlı backend | ⚠️ **əlçatmazdır** — şəbəkə əmrləri bu mühitdə bloklanıb (AC18 · TC24–TC29 icra edilə bilmədi) |

**AC yekunu:** ✅ 15 keçdi · ❌ 4 kəsildi · ⚠️ 1 icra edilə bilmədi (cəmi 20)
**TC yekunu:** ✅ 19 keçdi · ❌ 4 kəsildi · ⚠️ 6 icra edilə bilmədi (cəmi 29)

---

## 2. Düzəlişlərin doğruluğu (8 `fix(ui)` kateqoriyası)

Hər kateqoriya tam diff ilə oxundu; iddia edilən problemi həll edib-etmədiyi və reqressiya
yaradıb-yaratmadığı ayrıca yoxlandı.

| # | Kateqoriya | Doğrudurmu? | Reqressiya? | Qeyd |
|---|---|---|---|---|
| 1 | tooltip (`title`) + fokus tokeni | ✅ | ✅ yox | 15 xam ikon düyməsinə `title`; `QtyStepper`-də `outline-none` → `focus-ring-inset`, input-a `aria-label="Miqdar"`. Deaktiv hallarda `title` səbəb izah edir. |
| 2 | `PageHead` → `PageHeader` (4 route) | ✅ | ✅ yox | `PageHead.tsx:16` sırf `PageHeader`-ə yönləndirən alias-dır → **render nəticəsi bayt-bayt eynidir**, davranış neytral. `PageHead` faylı geriyə uyğunluq üçün saxlanılıb, artıq 0 istifadəçisi var. |
| 3 | `Button` `loading` propu (12 düymə) | ✅ | ✅ yox | `Button.tsx:74` `disabled={disabled \|\| loading}` → **deaktivlik davranışı 1:1 eynidir**. Validasiya şərtləri (`!name.trim()`, `!valid`, `debtInvalid`, `importCount === 0`) `disabled`-də saxlanılıb, `isPending` `loading`-ə köçüb. `aria-busy` əlavə dəyərdir. **LAKIN əhatə tam deyil → BUG-1.** |
| 4 | `.money` tokeni ilə daşma həlli (`DebtsKpiCards`) | ✅ | ✅ yox | `.money` = `min-w-0 overflow-hidden truncate tabular-nums` (`index.css:85-87`). Silinən `tabular-nums` tokenin içindədir → itki yoxdur. Sarğı `div`-lərə `min-w-0`; «Ümumi qalıq» üçün tam dəyər `title`-də qalır. `whitespace-nowrap` ilə konflikt yoxdur (`truncate` onsuz da nowrap-dır). |
| 5 | Rəng semantikası — Gün Sonu xərcləri | ✅ | ✅ yox | `text-red-600/500` yalnız `Row`-ların `tone` propundan çıxarıldı; istiqamət `«−»` prefiksi ilə qalır, `ClosingHistory`-də sütun başlığı kontekst verir. `cash-diff-presentation.ts` (müsbət fərq = amber) **toxunulmayıb**. |
| 6 | POS başlığının tipoqrafiya/boşluq uyğunlaşdırması | ✅ | ✅ yox | `mb-4` → `mb-6`, `leading-tight` əlavə — `PageHeader.tsx:56,61` ilə eyni. Yalnız CSS sinfi. |
| 7 | **Gün Sonu xəta vəziyyəti (kritik)** | ✅ | ✅ yox | **Xüsusi diqqətlə yoxlandı:** diff YALNIZ `isError`/`refetch` destrukturlaşdırması + `InlineError` bannerini əlavə edir. `expectedCash` / `difference` düsturları, `todayExpenses`/`salaryExpenses` oxunuşu, bağlanış şərtləri (`canClose`, `disabled` səbəbləri), `closeDay` mutasiyası və 409 emalı **DƏYİŞMƏYİB**. Hook sırası pozulmayıb (banner erkən `return` deyil, JSX daxilində şərtlidir). |
| 8 | Fəaliyyət jurnalı vəziyyətləri | ✅ | ✅ yox | DS §3.5 prioriteti düzgün: `isError && length===0` → `InlineError`, sonra `isLoading` → `TableSkeleton`, sonra boş → `EmptyState`. Bütün hook-lar (`useState`, `useMemo`) erkən `return`-lardan ƏVVƏLdir → hook-order pozuntusu yoxdur. `InlineError.embedded` və `className` propları mövcuddur (build təsdiqləyir). |

**Nəticə:** 8 kateqoriyanın hamısı iddia edilən problemi həll edir; heç birində davranış/biznes
məntiqi reqressiyası yoxdur. Yeganə problem **3-cü kateqoriyanın natamam əhatəsidir** (BUG-1).

---

## 3. AC cədvəli (AC1–AC20)

| AC | Mövzu | Nəticə | Müstəqil sübut |
|---|---|---|---|
| AC1 | Vahid AppShell | ✅ keçdi | `index.css:11-12` `--app-sidebar-w:16rem` / `--app-header-h:4rem`; `AppShell.tsx:85` `w-sidebar`, `:90` `<main className="... px-4 pb-28 pt-6 lg:px-8 lg:pb-10">` **tək mənbə**; `TopHeader.tsx:26` `h-header`. `grep "px-4 lg:px-8\|container mx-auto\|max-w-screen"` src/routes → **0**. Hardcoded `w-64`/`h-16` layout-da → **0**. |
| AC2 | Vahid PageHeader | ✅ keçdi | `grep "PageHead\b"` src → yalnız sənəd şərhi qalıb, **0 istifadə**. Route-larda deprecated `actions=` propu → **0**. İstisnalar (satış POS, mal detalı) hesabatda əsaslandırılıb. |
| AC3 | Səhifədə BİR dominant əməliyyat | ✅ keçdi | `primaryAction=` → 5 route (borclar, mallar, musteriler, tedarukculer, xercler), hər birində **1 ədəd**; qalan 5 route-da 0. |
| AC4 | Vahid dövr filtri | ✅ keçdi | `PeriodFilter` 6 render yeri (mallar:218, xercler:148, borclar:351, hesabatlar:235, SalesJournal:440), hamısı `components/ui/PeriodFilter.tsx`-dən. Paralel/ad-hoc dövr seçicisi **0**. |
| AC5 | Qlobal vs lokal axtarış fərqi | ❌ **kəsildi** | Qlobal (`GlobalProductSearch:46,48` `rounded-full`) və lokal (`Bu siyahıda axtar...` 6 yerdə) naxışları düzgündür, LAKİN **3 xam axtarış input-u qalıb**: `ExpenseForm.tsx:357,360` «Mal axtar» / «Mal axtar...», `LabelPrintModal.tsx:153` «Mal axtar (ad və ya barkod)...». AC5 mətni: «…və ya **digər xam axtarış input-u** QALMAYIB». Hesabat bu bəndi KEÇDİ elan edir və bu 3 halı heç yerdə (§5 və ya known-limitations) sadalamır → **BUG-2**. |
| AC6 | Cədvəl boşluqları və sıralama | ✅ keçdi | Yeganə qeyri-`DataTable` cədvəl `ChartDataTable.tsx:46` — `overflow-auto` sarğısında, sənədləşdirilmiş istisna. Sıralama tək yerdə (`DataTable.tsx:250` `aria-sort`). Padding sapması (`py-3.5`/`py-2.5`) hesabatda F-3 kimi **düzgün açıqlanıb**. |
| AC7 | Düymə iyerarxiyası | ❌ **kəsildi** | `ConfirmModal.tsx:74-85` ardıcıllığı və `variant="danger"`-in yalnız 2 dağıdıcı yerdə olması ✅ təsdiqləndi. LAKİN «Əl ilə `Loader2` naxışı düymə daxilində qalmayıb» iddiası **YANLIŞDIR** — 4 paylaşılan `<Button>` hələ də qadağan olunmuş `icon={pending ? <Loader2/> : …}` + `disabled` naxışını işlədir → **BUG-1**. |
| AC8 | İkon düymələrinin etiketi/tooltip-i | ✅ keçdi | **Müstəqil skript ilə skan edildi** (bütün `src/**/*.tsx`, `<button>` bloklarının atributu + gövdə mətni): 24 namizədin hamısı `{children}`/`{label}` səbəbli **saxta müsbətdir**; həqiqi mətnsiz düymələrdə `aria-label` **və** `title` var. `IconButton.label` məcburidir (build təsdiqləyir). Kritik əməliyyatlar mətnli `Button`-dur. |
| AC9 | Maliyyə rəng semantikası | ✅ keçdi | (a) müsbət fərq amber, TƏK mənbədə (`cash-diff-presentation.ts`, toxunulmayıb) ✅; (b) `text-red-*` Gün Sonu/Xərclər pul dəyərlərində **0** ✅; (c) rəng heç yerdə yeganə siqnal deyil (ikon/mətn/prefiks) ✅. |
| AC10 | Loading / boş / xəta / deaktiv | ✅ keçdi | 13 sətirli matris nöqtəvi yoxlandı (`ProductsTable:363-375`, `OpenDebtsTable:214-230` və s.) — `isLoading`/`isError`/`onRetry`/`errorMessage`/`emptyState` hamısı mövcuddur. `DayEndCard` və `ActivityLog` bu PR-da tamamlandı. Prioritet `DataTable`-da mərkəzləşib. |
| AC11 | Təsdiq dialoqları | ✅ keçdi (sənədləşdirilmiş boşluqla) | 10 dağıdıcı/maliyyə faylının hamısında `ConfirmModal`/`ConfirmDialog` istinadı təsdiqləndi. 4 maliyyə modalında (`PaymentModal`, `PayModal`, `DebtModal`, `StockAdjustModal`) təsdiq **yoxdur** — `grep` ilə 0 nəticə ilə təsdiqləndi; hesabat bunu F-1 / L-11 kimi **düzgün, fayl:sətir sübutu ilə** açıqlayır və davranış dəyişikliyi kimi ayrıca taska köçürür (task qaydasına uyğun). |
| AC12 | Azərbaycanca terminologiya | ✅ keçdi | `ui-terminology.md` §1-in 70 sətrindən yüksək riskli 12-si nöqtəvi yoxlandı: «Pul ver», «Kassada olmalı məbləğ», «Tutulma yaz», «Bugünkü qazanc», «N mal azalır», «Qazanc %» (ProductsTable), «Xərc yoxdur — maya alış qiymətinə» → hamısı yeni formadadır; qalıqlar yalnız **kod şərhlərində/JSDoc-da** («əvvəlki adı …») və `lib.ts` sənəd şərhlərindədir. |
| AC13 | Pul formatı | ✅ keçdi | `"AZN"` → yalnız 7 icazəli yer (currency defoltu ×3, WhatsApp şablonu ×2, `ProductForm` option ×2). `toFixed(2)` → **yeganə** `customers/lib.ts:16` (WhatsApp `{debt}` əvəzlənməsi). Ad-hoc `toFixed(2) + ₼` naxışı **0**. |
| AC14 | Responsive + üfüqi daşma | ✅ keçdi (yalnız statik) | `w-screen`/`100vw`/`min-w-max` → **0**. Sabit `min-w-[…]`: 112px, 220px (≤1280px). `-mx-` yalnız 2 sticky zolaqda, hər ikisi eyni ölçülü `px-*` ilə kompensasiya olunub. `DebtsKpiCards` daşma riski `.money` ilə həll olunub. **Piksel təsdiqi icra edilə bilmədi** (alət yoxdur) — hesabat bunu düzgün «qismən (statik)» kimi elan edir. |
| AC15 | Klaviatura naviqasiyası | ✅ keçdi | `outline-none`-ın **hər 28 istifadəsi tək-tək yoxlandı** — hamısında `focus-visible:ring` / `focus:ring` əvəzləməsi var (`GlobalProductSearch:53-55`, `Select:376-378` daxil); `QtyStepper` bu PR-da düzəldilib. Müsbət `tabIndex` (>0) → **0**. Escape 8 overlay-də; ortaq kilid sayğacı `dialog-layer.ts`-də. |
| AC16 | Barkod skaner və Enter axını | ❌ kəsildi (sənədləşdirilmiş) | `QuickSaleScreen.tsx:443-450` — axtarış input-unda `onKeyDown` **yoxdur**; faylda ümumiyyətlə heç bir `onKeyDown` yoxdur, `searchRef.focus()` yalnız `:113`-dədir. Hesabatın F-2 / L-12 iddiası **doğrudur**; yeni funksiya olduğu üçün deferral qaydaya uyğundur. |
| AC17 | Test və build reqressiyası yoxdur | ✅ keçdi | vitest 47/354 → 0 fail · build 0 xəta · `package.json`/lock diff **boş**. |
| AC18 | API və route regressiyası | ⚠️ **icra edilə bilmədi** | Canlı backend əlçatmazdır (şəbəkə bloklanıb). «Kəsildi» SAYILMIR. Hesabat və `ui-ux-known-limitations.md` (L-04) bunu səbəbi ilə sənədləşdirir. |
| AC19 | Üç sənəd yaradılıb və doludur | ❌ **kəsildi** | Struktur tam: hər 3 sənəd mövcuddur, AC19-un tələb etdiyi bütün bölmələr var (§4-ə bax), screenshot bölməsi «alət yoxdur» + tövsiyə ilə bağlanıb, «icra edilə bilmədi» bəndləri **«keçdi» kimi göstərilməyib**. LAKİN məzmun dürüstlüyü pozulub: 2 yanlış «KEÇDİ» iddiası (BUG-1, BUG-2) + daxili ziddiyyətli say cədvəli (BUG-3). |
| AC20 | Düzəliş və commit qaydası | ✅ keçdi | 8 ayrıca `fix(ui):` commit + 1 `docs(ui):`, hər kateqoriya təmiz ayrılıb. Backend kontraktı / domen davranışı / query açarları / mutasiya imzaları **toxunulmayıb** (diff ilə təsdiqləndi). Branch təzə `origin/main`-dən, PR açıqdır. |

**Yekun:** ✅ **15** · ❌ **4** (AC5, AC7, AC16, AC19) · ⚠️ **1** (AC18)
*Qeyd: AC16 pre-mövcud boşluqdur və hesabatda düzgün açıqlanıb — ona görə yeni bug açılmır.*

---

## 4. TC nəticələri (TC1–TC29)

### A qrupu — statik / kod-oxuma

| TC | Nəticə | Qeyd |
|---|---|---|
| TC1 | ✅ | Səhifə padding-i yalnız `AppShell.tsx:90`; route-larda təkrar sarğı 0. |
| TC2 | ✅ | `--app-sidebar-w: 16rem` / `--app-header-h: 4rem`; hardcoded paralel yoxdur. |
| TC3 | ✅ | 10 route `PageHeader`; `PageHead` = 0; deprecated `actions=` = 0. |
| TC4 | ✅ | Hər səhifədə primary düymə ≤ 1 (5 `primaryAction`, digərləri `secondaryActions`/`moreActions`). |
| TC5 | ✅ | Dövr seçimi tək komponentdən; `type="date"` yalnız `PeriodFilter` daxili + `ExpenseForm` forma sahəsi. |
| TC6 | ❌ | «Axtar...» literal qalığı 0 ✅, LAKİN `Mal axtar...` (ExpenseForm:360), `Mal axtar` (:357), `Mal axtar (ad və ya barkod)...` (LabelPrintModal:153) üç kanonik naxışdan **heç birinə uyğun deyil** → BUG-2. |
| TC7 | ✅ | Ad-hoc `<table>` yalnız `ChartDataTable` (sənədləşdirilmiş); sıralama + `aria-sort` tək mənbədə. |
| TC8 | ❌ | Footer ardıcıllığı və `danger` istifadəsi ✅; **əl ilə `Loader2` 4 `<Button>`-da qalıb** → BUG-1. |
| TC9 | ✅ | Müstəqil skan: mətnsiz düymələrdə `aria-label` + `title` çatışmazlığı **0**. |
| TC10 | ✅ | Müsbət fərq amber və tək mənbədən; xərclər qırmızısız; hər rəngin yanında izah. |
| TC11 | ✅ | 13 sətirli matris nöqtəvi yoxlandı, uyğundur. |
| TC12 | ❌ | Təsdiqsiz maliyyə əməliyyatı = **4** (gözlənilən 0). Hesabatda F-1/L-11 kimi düzgün açıqlanıb, davranış dəyişikliyi → ayrıca task. |
| TC13 | ✅ | Nöqtəvi 12 «Köhnə» mətn yoxlandı → UI-da qalıq 0 (yalnız kod şərhlərində tarixçə qeydləri). |
| TC14 | ✅ | `AZN` yalnız icazəli yerlərdə; `toFixed(2)` 1 icazəli yer. |
| TC15 | ✅ | Sabit enlər ≤220px; `overflow-x-auto` cədvəllərdə; `-mx-` kompensasiyalı. |
| TC16 | ✅ | `outline-none` 28 istifadənin hamısında əvəzlənib; müsbət `tabIndex` 0; Escape hər overlay-də. |
| TC17 | ❌ | Barkod/Enter axını **mövcud deyil** (F-2/L-12 kimi düzgün sənədləşdirilib). |
| TC18 | ✅ | `package.json` / `package-lock.json` diff-i boş. |

### B qrupu — vitest

| TC | Nəticə | Qeyd |
|---|---|---|
| TC19 | ✅ | Baza (`origin/main` üzərində qeyd edilmiş): 47 fayl / 354 test, 0 fail. |
| TC20 | ✅ | Düzəlişlərdən sonra: **47 fayl / 354 test, 0 fail** — yeni fail 0. |
| TC21 | ✅ | `npm run build` → 0 TypeScript xətası (AC8-in `IconButton.label` hissəsini avtomatik təsdiqləyir). |
| TC22 | ✅ | Mətn iddiası olan testlər (ayarlar, SalaryCard, CustomersTable, ProductsTable, SalesJournal) keçir — bu PR-da UI mətni dəyişmədiyi üçün test yeniləməsi tələb olunmayıb. |
| TC23 | ✅ | Suite heç bir commit-də qırılmayıb; qırıq vəziyyətdə PR açılmayıb. |

### C qrupu — canlı backend

| TC | Nəticə |
|---|---|
| TC24–TC29 | ⚠️ **icra edilə bilmədi** — şəbəkə əmrləri bloklanıb, canlı `mayapro-warehouse-api`-yə sorğu mümkün deyil. Bu, «kəsildi» SAYILMIR və bug açılmır. Hesabat §11 hər TC üçün kod-oxuma sübutu verir. |

---

## 5. Tapılan buglar

### BUG-1 — «Əl ilə Loader2 naxışı qalmayıb» iddiası yanlışdır: 4 `<Button>` hələ də qadağan olunmuş naxışdadır (prioritet: **orta**)

**Təsvir.** `docs/final-ui-ux-regression-report.md:42` (YOXLA #7 / AC7) bu bəndi **KEÇDİ** elan edir
və «Əl ilə `Loader2` naxışı düymə daxilində qalmayıb» yazır; `docs/ui-ux-final-changelog.md:185` isə
«əl ilə `Loader2` naxışı **silindi**» iddia edir. §3.3 yalnız `ExcelImportModal.tsx:438`-i bu naxışın
daşıyıcısı kimi göstərir. Faktiki olaraq paylaşılan `Button` primitivinin **4 ayrı istifadəsi** eyni
qadağan olunmuş naxışı (`icon={pending ? <Loader2/> : <Icon/>}` + əl ilə `disabled`) saxlayır —
yəni `ExcelImportModal` tək hal deyildi. Bu düymələrdə `aria-busy` yoxdur (DS §3.1 pozuntusu).

**Reproduksiya (statik).**
1. `git checkout task/FE81-final-ui-ux-regression`
2. `grep -rn "Loader2" src/ | grep -v '\.test\.'`
3. Hər tapıntının kontekstini oxu → aşağıdakı 4 hal `<Button>` (DS primitivi) daxilindədir.

**Gözlənilən.** Ya bu 4 düymə də `loading={…}` propuna keçirilməli idi (eyni «təhlükəsiz düzəliş»
kateqoriyası — `disabled` şərti dəyişmədən), ya da AC7 KEÇDİ yox, «qismən» kimi qeyd olunub
`§5`/`ui-ux-known-limitations.md`-də səbəbi ilə sadalanmalı idi.

**Faktiki.** Nə düzəldilib, nə də sənədləşdirilib; əksinə, hər iki sənəd problemin tam həll
olunduğunu iddia edir.

**Fayl:sətir.**
- `src/features/sales/components/QuickSaleScreen.tsx:341-352` — «Qaimə» düyməsi, `icon={invoicePending ? <Loader2 …/> : <Receipt/>}` + `disabled`
- `src/features/sales/components/SalesJournal.tsx:485-499` — «PDF hesabat», `icon={exportingPdf ? <Loader2 …/> : <FileText/>}` + `disabled={exportingPdf}`
- `src/features/products/components/LabelPrintModal.tsx:452-465` — «PDF hazırla», `icon={submitting ? <Loader2 …/> : <Printer/>}`
- `src/features/sales/components/SaleDetailDrawer.tsx:111-125` — «Qaiməni PDF kimi yüklə», `icon={invoicePending ? <Loader2 …/> : <Receipt/>}` + `disabled`

**Yanlış iddianın yeri:** `docs/final-ui-ux-regression-report.md:42`, `:97` · `docs/ui-ux-final-changelog.md:185`

> Qeyd: xam `<button>` elementlərindəki `Loader2` istifadələri (`QuickSaleScreen:390`,
> `SalesJournal:330,775`, `CustomerDrawer:284`, `SaleDetailDrawer:152` — WhatsApp/brend rəngli
> düymələr) bu buga daxil edilmir, çünki onlar `Button` primitivini işlətmirlər. Lakin hesabatın
> iddiası onları da əhatə edəcək şəkildə mütləq formadadır.

---

### BUG-2 — AC5 «xam axtarış input-u qalmayıb» iddiası yanlışdır: 3 xam axtarış placeholder-i qalıb və heç yerdə sənədləşdirilməyib (prioritet: **orta**)

**Təsvir.** AC5 tələbi: «kodda «Axtar...» **və ya digər xam axtarış input-u** QALMAYIB».
TC6 daha da dəqiqdir: «axtar» üzrə **hər** tapıntı üç kanonik naxışdan birinə uyğun olmalıdır.
Hesabat (`:40`) bu bəndi **KEÇDİ** elan edir və yeganə sapma kimi `ProductFilters` (F-6) qeyd olunur.
Faktiki olaraq daha 3 xam axtarış girişi var və heç biri nə §5-də (düzəldilməyən tapıntılar),
nə də `ui-ux-known-limitations.md`-də sadalanmır.

Ən əhəmiyyətlisi: `ExpenseForm.tsx:360`-dakı mətn **`Mal axtar...`**, yəni `ui-terminology.md`
sətir #1-in məhz **«Köhnə»** sütunundakı formadır (`Mal axtar... (Enter)` → `Bütün sistemdə mal axtar...`).
Qlobal axtarış bu ifadədən qəsdən uzaqlaşdırılıb, forma daxilindəki mal seçici isə həmin ifadəni
saxlayır → istifadəçi üçün eyni mətn iki fərqli əhatəli axtarışı bildirir.

**Reproduksiya (statik).**
1. `grep -rniE 'placeholder="[^"]*axtar|aria-label="[^"]*axtar' src/ --include=*.tsx | grep -v '\.test\.'`
2. Nəticələri `ui-terminology.md` §3-ün üç kanonik forması ilə üz-üzə qoy.

**Gözlənilən.** Ya kanonik formaya uyğunlaşdırılmalı (etiket dəyişikliyi = **təhlükəsiz düzəliş**,
task qaydasına tam uyğun), ya da «picker girişi — lokal cədvəl axtarışı deyil» əsaslandırması ilə
hesabatda/known-limitations-da qeyd olunmalı idi.

**Faktiki.** Bənd tam KEÇDİ elan olunub, bu 3 hal heç bir sənəddə görünmür.

**Fayl:sətir.**
- `src/features/expenses/components/ExpenseForm.tsx:357` — `aria-label="Mal axtar"`
- `src/features/expenses/components/ExpenseForm.tsx:360` — `placeholder="Mal axtar..."`
- `src/features/products/components/LabelPrintModal.tsx:153` — `placeholder="Mal axtar (ad və ya barkod)..."`

**Yanlış iddianın yeri:** `docs/final-ui-ux-regression-report.md:40`

---

### BUG-3 — Hesabatın §1 «Yekun say» cədvəli daxilən ziddiyyətlidir (prioritet: **aşağı**)

**Təsvir.** Bağlanış taskının baş rəqəmləri (istifadəçiyə/PM-ə ötürülən yeganə xülasə) öz sənədinin
qalan hissəsi ilə uyğun gəlmir:

1. `:22` — «KƏSİLDİ (düzəldilməyib) — **4 tapıntı**», halbuki §5 **7 tapıntı** (F-1…F-7) sadalayır
   və developer/senior şərhləri də «7» deyir.
2. `:20` KEÇDİ sətri **12 AC** sadalayır, `:25` mətni isə «**14-ü tam keçdi**» deyir.
3. Eyni AC-lər həm KEÇDİ, həm KƏSİLDİ sətrində görünür: **AC6** və **AC9** hər iki sətirdə;
   **AC5** KEÇDİ sətrində, buna baxmayaraq F-6 (və BUG-2) onun pozuntularıdır;
   **AC11** «(qismən)» qeydi ilə KEÇDİ sətrindədir, halbuki F-1 onun kəsilən alt-bəndidir.

**Gözlənilən.** Xülasə cədvəli §2/§5 ilə hərfi uyğun olsun; qismən keçən AC-lər ayrıca sətirdə.

**Faktiki.** «14 AC tam keçdi / 4 tapıntı düzəldilməyib» rəqəmləri həqiqi vəziyyəti optimist
göstərir; oxucu §5-i açmadan neçə açıq tapıntı olduğunu yanlış başa düşür.

**Fayl:sətir.** `docs/final-ui-ux-regression-report.md:18-28`

---

## 6. Hesabatın dürüstlük auditi

Hesabatın **hər** «KEÇDİ» bəndi müstəqil grep/skript/fayl-oxuma ilə təkrar yoxlandı (təsadüfi
seçim deyil). Nəticə:

| Audit sualı | Nəticə |
|---|---|
| «KEÇDİ» bəndlərinin sübutu doğrudurmu? | **14/16 doğrudur.** 2 bənd yanlışdır: YOXLA #7 (Loader2 → BUG-1), YOXLA #5 (xam axtarış → BUG-2). |
| Sübut kimi verilən fayl:sətir istinadları həqiqətənmi mövcuddur? | ✅ Yoxlanan 40+ istinadın hamısı doğrudur (AppShell:90, index.css:11-12, DataTable:250, cash-diff-presentation, ConfirmModal:74-85, matris sətirləri və s.). |
| «İcra edilə bilmədi» bəndləri «keçdi» kimi göstərilibmi? | ✅ **XEYR.** AC18 və TC24–TC29 §11-də ayrıca cədvəldə, açıq statusla; §1-də də ayrıca sətir. Kod-oxuma sübutu «canlı təsdiq» kimi təqdim edilmir. |
| Düzəldilməyən tapıntılar (F-1…F-7) həqiqətənmi mövcuddur? | ✅ **HAMISI mövcuddur** və doğru təsvir olunub: F-1 (4 modal, `grep ConfirmModal` → 0; `PaymentModal.tsx:98` Enter → `save()`), F-2 (`QuickSaleScreen`-də `onKeyDown` yoxdur), F-3 (`DataTable:261` `py-3.5`), F-4 (palitradan kənar rənglər), F-5 (3 «Ləğv et» / 16 «İmtina» — hesabat 14 deyir, cüzi say fərqi), F-6 (`ProductFilters:78`), F-7 (`.money` 8 istifadə). |
| L-11…L-16 məhdudiyyətləri doğrudurmu? | ✅ Bəli; L-15 (`PageHead` alias-ı repoda, 0 istifadəçi ilə) da təsdiqləndi. |
| «Backend tələb edir» iddiası doğrudurmu? | ⚠️ **Qismən.** B-1 (`customers/queries.ts:117-121`-də `["summary"]` invalidasiyası yoxdur) faktiki olaraq **doğrudur** və digər maliyyə mutasiyalarından fərqlənir. Lakin düzəlişin ÖZÜ frontend-dədir (bir sətir `invalidateQueries`) — «backend tələb edir» deyil, «**backend davranışı ilə doğrulanmalıdır**». Bunu bu taskda etməmək yenə də müdafiə olunandır (query açarları «təhlükəsiz düzəliş» siyahısında deyil, senior da toxunmamağı təsdiqləyib) → **bug elan edilmir**, §8-də tövsiyə kimi verilir. B-2 (bağlanışın bloklanması) həqiqətən davranış qərarıdır. B-3 (409 emalı) kod-oxuma ilə düzgün təsdiqlənib. |
| Səhv kateqoriyaya salınmış («backend» adı ilə gizlədilmiş) təhlükəsiz düzəliş varmı? | ⚠️ Birbaşa yoxdur, LAKİN **BUG-1 və BUG-2 məhz bu tipdir**: hər ikisi təmiz təhlükəsiz frontend düzəlişidir (prop dəyişimi / etiket mətni), qaçırılıb və heç bir kateqoriyaya salınmayıb — nə düzəldilib, nə də açıq tapıntı kimi qeyd olunub. |
| Say cədvəli §2/§5 ilə uyğundurmu? | ❌ **XEYR** → BUG-3. |

---

## 7. İcra edilə bilməyənlər

| Bənd | Səbəb | Statusu |
|---|---|---|
| **AC18** — API və route regressiyası | Şəbəkə əmrləri (curl / netstat / node fetch) bu mühitdə bloklanıb; canlı `mayapro-warehouse-api`-yə heç bir sorğu göndərilə bilməz | icra edilə bilmədi — «kəsildi» SAYILMIR, bug açılmır |
| **TC24** — satış 3 ödəniş variantı → qaimə | eyni | icra edilə bilmədi |
| **TC25** — borc ödənişi (tam + qismən) | eyni | icra edilə bilmədi |
| **TC26** — xərc → real maya təsiri | eyni | icra edilə bilmədi |
| **TC27** — gün bağlama → təkrar bağlamada 409 | eyni (kod-oxuma ilə `DayEndCard.tsx:172-190` düzgün təsdiqləndi) | icra edilə bilmədi |
| **TC28** — maaş avansı → gün sonu | eyni | icra edilə bilmədi |
| **TC29** — backend söndürülmüş halda hər səhifə | eyni (statik matris §4.1 ilə qismən əvəzlənib) | icra edilə bilmədi |
| **Screenshot / viewport ölçüsü** (1280×720 · 1366×768 · 1440×900 · 1920×1080 · 375px) | Repoda Playwright / Cypress / Puppeteer və ya hər hansı vizual regressiya aləti **yoxdur**; task qaydası və AC17 («package.json dəyişməyib») yeni framework quraşdırmağı qadağan edir | **alət yoxdur** — icra edilə bilmədi |

---

## 8. Bug olmayan tövsiyələr («yaxşı olardı»)

1. **`SignatureBand.tsx` ölü koddur** — heç bir yerdən import olunmur (`_app.index.tsx:157,225` şərhləri onun SİLİNDİYİNİ deyir), amma fayl repoda qalır və `:38`-də terminologiya #48-in ləğv etdiyi «Kağız üzərində qazanc» mətnini daşıyır. UI-a təsiri **yoxdur**; təmizlik üçün silinməsi tövsiyə olunur.
2. **`ExpenseForm.tsx:360` / `LabelPrintModal.tsx:153` üçün üçüncü kanonik naxış** — `ui-terminology.md` §3-ə «Seçici (picker) girişi» sətri əlavə olunsa, BUG-2-nin təkrarı qarşısı alınar.
3. **B-1 (`["summary"]` invalidasiyası)** — düzəliş frontend-dədir (bir sətir), yalnız zərurəti backend `GetSummaryHandler` davranışından asılıdır. Backend cavabından sonra ayrıca kiçik taskla bağlanması tövsiyə olunur; «backend tələb edir» ifadəsi «backend ilə doğrulanmalıdır»a dəyişdirilsin.
4. **`PageHead.tsx` alias-ı** — bu PR-dan sonra 0 istifadəçisi var; silinməsi üçün ayrıca kiçik təmizlik taskı (hesabat da §13.8-də bunu tövsiyə edir).
5. **F-5 say dəqiqliyi** — hesabat «14 «İmtina»» deyir, faktiki grep 16 verir (test faylları xaric). Bloklamayan sənəd dəqiqliyi.
6. **Vizual regressiya aləti** — hesabatın §7 tövsiyəsi (ayrıca taskda `@playwright/test` + 13 route × 5 viewport baseline) dəstəklənir; AC14/AC18 və FE#69-un AC-17/AC-18 qalığı yalnız bununla real bağlana bilər.

---

## 9. Yekun qərar

**KƏSİLDİ.** PR-ın **kod hissəsi təmiz və reqressiyasızdır** — 8 `fix(ui)` kateqoriyasının hamısı
iddia etdiyi problemi doğru həll edir, maliyyə düsturları/bağlanış şərtləri/mutasiyalar/query
açarları toxunulmayıb, build və 354 test yaşıldır. Bloklayan səbəb **kod deyil, yekun hesabatın
dürüstlüyüdür**: bu, silsilənin bağlanış taskıdır və onun əsas məhsulu hesabatın özüdür — iki bənd
səhvən «KEÇDİ» elan olunub (hər ikisi əslində bu taskda düzəldilməli olan **təhlükəsiz** frontend
düzəlişidir və heç bir açıq tapıntı siyahısına da salınmayıb), üstəlik baş say cədvəli daxilən
ziddiyyətlidir.

| | Say |
|---|---|
| AC keçdi | **15** |
| AC kəsildi | **4** (AC5, AC7, AC16*, AC19) |
| AC icra edilə bilmədi | **1** (AC18) |
| TC keçdi | **19** |
| TC kəsildi | **4** (TC6, TC8, TC12*, TC17*) |
| TC icra edilə bilmədi | **6** (TC24–TC29) |
| Yeni bug | **3** (2 orta · 1 aşağı) |

`*` — AC16 / TC12 / TC17 pre-mövcud boşluqlardır, hesabatda **düzgün** açıqlanıb və deferral task
qaydasına uyğundur → bunlara görə yeni bug açılmır.

**Tövsiyə olunan növbəti addım:** task «In Progress»-ə qaytarılsın; BUG-1 və BUG-2 ya
düzəldilsin (hər ikisi kiçik, təhlükəsiz `fix(ui)` commit-idir), ya da hesabat + known-limitations
sənədlərində açıq tapıntı kimi sadalansın; BUG-3 üçün §1 say cədvəli §2/§5 ilə uzlaşdırılsın.
Sonra 2-ci QA dövrü.
