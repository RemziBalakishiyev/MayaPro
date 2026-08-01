# QA Report — FE#41: Xərclər səhifəsi (FilterBar, tarix aralığı, detal draweri, form drawer-ə keçid)

**Tarix:** 2026-08-01
**QA Agent:** qa-tester
**Test edilən PR:** https://github.com/RemziBalakishiyev/MayaPro/pull/46 (branch `task/FE#41-xercler-filterbar`, base `task/FE37-filter-blok`)
**Commitlər:** `9339cf2` (developer — "feat: xercler filterbar, detal draweri"), `e07e13a` (senior review — "refactor(expenses): FE#41 review duzelisleri")
**Dəyişən fayllar (14):** `src/features/expenses/api.ts`, `src/features/expenses/lib.ts`, `src/features/expenses/queries.ts`, `src/features/expenses/components/{ExpenseDetailDrawer.tsx (yeni), ExpenseFilters.tsx (yeni), ExpenseForm.tsx, ExpensesTable.tsx}`, `src/features/reports/lib.ts`, `src/features/sales/components/SalesJournal.tsx`, `src/mocks/handlers.ts`, `src/routes/{_app.borclar.tsx, _app.hesabatlar.tsx, _app.xercler.tsx}`, `src/types/index.ts`
**Backend:** `backend/` YALNIZ oxundu (`src/Modules/…Expenses/Endpoints/ExpensesEndpoints.cs` — FE↔BE kontraktını təsdiqləmək üçün). Heç bir backend faylı dəyişdirilmədi. Real backend (`https://localhost:7088`) üzərində yalnız **read-only GET** sorğuları icra olundu.

---

## Test metodologiyası və məhdudiyyət (AÇIQ QEYD)

Layihədə test runner (Vitest/Jest) və brauzer avtomatlaşdırması (Playwright/Cypress, jsdom/happy-dom) **yoxdur** və QA rolunda yeni asılılıq quraşdırmaq icazəm yoxdur. Ona görə 4 səviyyəli yanaşma tətbiq etdim:

| Səviyyə | Nə edildi | Nəyi təsdiqləyir |
|---|---|---|
| **1. Build** | `npm run build` (tsc + vite) | AC-20 / TC-28 |
| **2. Xalis funksiya icrası** | Real mənbə modulları (`expenses/lib.ts`, `reports/lib.ts`, `lib/format.ts`) esbuild ilə bundle edilib Node-da **faktiki icra olundu** — 810 günlük pəncərədə `expensePeriodToRange` ↔ `inPeriod` uyğunluğu, maya təsiri düsturunun bütün sərhəd halları | AC-2/3/4, AC-13 (düstur), TC-2/3/4/5/18 |
| **3. Faktiki React render (SSR)** | `renderToStaticMarkup` ilə **real komponentlər** (`XerclerPage` route komponenti, `ExpenseFilters`, `ExpenseDetailDrawer`, `ExpensesTable`, `ExpenseForm`) seed edilmiş QueryClient ilə render edilib, çıxan HTML üzərində ~90 assertion icra olundu | AC-1/2/5..14/16, TC-1/2/3/4/5/7/8/9/10/13/14/15/16/17/18/21 |
| **4. Real backend API testi** | `https://localhost:7088` işlək idi: `sahib` rolu ilə login + `GET /api/expenses` müxtəlif parametrlərlə (read-only) | AC-21, TC-27 və **BUG-1** |

**Aparıla BİLMƏYƏN:** faktiki klik/toxunma/fokus keçidi, drawer açılış-bağlanış animasiyaları, 375px vizual render (skrinşot), toast-ların ekranda görünməsi. Bu tip TC-lər `⚠️ Blocked (canlı)` və ya `✅ Pass (kod trace)` kimi ayrıca işarələnib — **uydurma nəticə yazılmayıb.**

---

## Xülasə

| Göstərici | Dəyər |
|---|---|
| Ümumi AC | 21 |
| Ümumi TC | 28 |
| ✅ AC Pass | **20** (AC-1…AC-18, AC-20, AC-21) |
| ⚠️ AC Qismən | **1** (AC-19 — toxunma hədəfi 44px bəndi; qalan bütün bəndləri keçir) |
| ❌ AC Fail | **0** |
| ✅ TC Pass | **26** (TC-1…TC-24, TC-27, TC-28) |
| ⚠️ TC Blocked (canlı brauzer tələb edir; kod səviyyəsində PASS) | **2** (TC-25, TC-26) |
| ❌ TC Fail | **0** |
| `npm run build` | ✅ Xətasız (5.87s) |
| Tapılan problemlər | 1 × Orta (**backend asılılığı — FE#41 scope-undan kənar**), 2 × Aşağı (kosmetik), 2 × Məlumat |
| **Yekun qərar** | **PASS** — FE#41 scope-unda bloklayıcı bug yoxdur. Tövsiyəm: task **"Done"**, BUG-1 üçün AYRICA backend taskı açılsın (BE#22 `?from=&to=` real olaraq tətbiq olunmayıb). |

---

## Acceptance Criteria nəticələri

| AC | Təsvir | Nəticə | Sübut / qeyd |
|---|---|---|---|
| **AC-1** | Ay input-u silinir, FilterBar gəlir | ✅ Pass (render) | Səhifə HTML-ində `type="month"` **yoxdur**. `FilterBar` render olunur: `aria-label="Xərc axtar"` + `h-12` klaslı axtarış input-u, sağda "Filterlər" toqql düyməsi (`h-12`). `ExpenseFilters.tsx` `ProductFilters.tsx` ilə eyni `Select className="h-9 w-full text-sm"` naxışını işlədir. |
| **AC-2** | Dövr tabları paneldə (5 tab), `Period` + `year`, `inPeriod` case year | ✅ Pass (render + icra) | Render: `role="tablist"` + **dəqiq 5** `role="tab"` — Bu gün / Bu həftə / Bu ay / Bu il / Hamısı; aktiv tabda `aria-selected="true"` + `bg-emerald-700`. Markup `SalesJournal.tsx:470-498` ilə **sətir-sətir eynidir**. `reports/lib.ts`: `Period` genişləndi (`year` əlavə), `PERIOD_LABELS.year="Bu il"`, `inPeriod` `case "year"` əlavə olundu. `tsconfig.json:20` `noFallthroughCasesInSwitch: true` — build yaşıl olduğu üçün pozulmayıb. Digər səhifələr (`satis`, `borclar`, `hesabatlar`) yeni `BasePeriod = Exclude<Period,"year">` tipinə keçirilib → onların z.enum sxemləri toxunulmadı. |
| **AC-3** | Defolt dövr = Bu ay (təqvim ayı) | ✅ Pass (icra) | `Route.validateSearch({})` → `{"period":"month","source":"all"}`. Səhifə renderində alt cəm = **340.00 ₼** = yalnız cari təqvim ayının sətirlərinin cəmi (test datasetində 18 sətirdən 15-i uyğun gəldi; keçən aylıq/illik sətirlər çıxarıldı). `expensePeriodToRange("month")` → `from=2026-08-01, to=2026-08-01` (ayın 1-i…bu gün) — `periodToRange` (son 30 gün) İSTİFADƏ OLUNMUR. |
| **AC-4** | Dövr → from/to → API + URL | ✅ Pass (FE) — bax **BUG-1** (BE) | `expensesApi.list()` fetch-i intercept edilərək **faktiki URL-lər** yoxlanıldı:<br>`today` → `/api/expenses?from=2026-08-01&to=2026-08-01`<br>`week` → `?from=2026-07-26&to=2026-08-01`<br>`month` → `?from=2026-08-01&to=2026-08-01`<br>`year` → **`?from=2026-01-01&to=2026-08-01`** ✔<br>`all` → `/api/expenses` (parametrsiz) ✔<br>`from/to`+`month` birlikdə verilsə `month` düşür ✔. Query key `["expenses", params]` → `invalidateQueries(["expenses"])` prefiksi hələ də hamısını tutur. `?period=year` URL-də saxlanılır. **Qeyd:** işlək backend bu parametrləri hazırda nəzərə almır → BUG-1. |
| **AC-5** | Mənbə filtri panelə köçdü | ✅ Pass (render) | Köhnə `SOURCE_FILTERS` tablist-i `_app.xercler.tsx`-dən silinib. Paneldə `aria-label="Mənbə"` select-i (Hamısı/Ümumi/Mala bağlı). `source=product` → alt cəm 570.00 ₼ (yalnız mala bağlı sətirlər); çip `aria-label="Mala bağlı sil"` render olunur; `handleRemoveFilter("source")` → `{source:"all"}`. zod sxemi `all/general/product` + `.default("all").catch("all")` qorunub. |
| **AC-6** | Xərc növü select-i | ✅ Pass (render) | Panel select-i `aria-label="Xərc növü"`, ilk seçim `Bütün növlər` (`value=""`), qalanları `useExpenseTypes()`-dan (`>Yol pulu<` render olundu). `type="Digər"` → alt cəm 1,249.00 ₼ (yalnız həmin kateqoriya). Çip `aria-label="Yol pulu sil"`. |
| **AC-7** | Axtarış (ad + qeyd, registrdən asılı deyil) | ✅ Pass (render) | `q="KARQO"` (böyük hərf) → "KARQO ödənişi" tapıldı (200.00 ₼); `q="böyük qeyd"` (yalnız `note`-da var) → eyni sətir tapıldı. Boş sətir: `onSearchChange={(q) => onChange({ q: q \|\| undefined })}` → URL-dən silinir (sxem testi: `type/q` `undefined` olanda açar URL obyektində qalmır). |
| **AC-8** | Aktiv say, çiplər, təmizləmə | ✅ Pass (render) | Defoltda (`period=month, source=all`) badge **yoxdur** və çip **yoxdur** (defolt "Bu ay" sayılmır) ✔. `period=year + source=product + type=Yol pulu` → badge **3**, 3 çip (`Bu il sil`, `Mala bağlı sil`, `Yol pulu sil`), "Filterləri təmizlə" düyməsi görünür. `clearFilters()` payload-u sxemdən keçirildi → `{"period":"month","source":"all"}` (type və q açarları URL-də qalmır). |
| **AC-9** | Üst StatCard tam silindi + istifadəsiz importlar | ✅ Pass (render + build) | Render: `Bu ay üzrə` mətni **yoxdur**, `gələcək tarixli` xəbərdarlığı **yoxdur**. `_app.xercler.tsx`-də `StatCard`/`Receipt`/`expenseBySource` importları yoxdur; `noUnusedLocals+noUnusedParameters` aktivdir (tsconfig:18-19) və build yaşıldır. `expenseBySource`/`expenseSourceSummaryText` **silinməyib** — `reports/api.ts:20,151` və `_app.hesabatlar.tsx:28,29,71,158`-də işləməyə davam edir ✔. |
| **AC-10** | Cədvəl altında canlı cəm | ✅ Pass (render) | `Cəmi (filtrlənmiş):` + `fmtMoney` + `tabular-nums` klası render olunur. Cəm `visibleExpenses`-dən (BÜTÜN filtrlənmiş sətirlər) hesablanır → 15 sətir / 10-luq səhifə halında da 340.00 ₼ göstərdi (bax TC-14). Boş nəticədə komponent gizlənmir, `0.00 ₼` göstərir ✔. Hər filtr dəyişikliyi eyni renderdə əks olunur (`useMemo([visibleExpenses])`). |
| **AC-11** | Sətrə klik → drawer; düymələrdə stopPropagation | ✅ Pass (render + kod) | `DataTable` sətirləri `role="button"` + `tabIndex=0` + `onClick`/Enter-Space handler (`DataTable.tsx:105-122` desktop, `208-230` mobil kart). `ExpensesTable.tsx:55-58` (desktop `ExpenseRowActions`) və `:215-218` (mobil kart əməliyyat zolağı) `onClick={(e) => e.stopPropagation()}` ilə əhatələnib → Düzəliş/ActionMenu drawer açmır. |
| **AC-12** | Başlıq bloku | ✅ Pass (render) | `truncate text-xl font-bold` başlıq; `text-2xl font-extrabold tabular-nums text-red-600` məbləğ; `<span class="sr-only">Xərc məbləği: </span>` ekran oxuyucusu izahı; altında `Badge` — `Ümumi` / `Mala bağlı` (hər ikisi render testində təsdiqləndi). |
| **AC-13** | Məlumat kartı (növ, tarix, mal linki, maya təsiri, qeyd, kim yazıb) | ✅ Pass (render + icra) | Sətirlər: Növ, Tarix (`11.07.2026`), Qeyd, Kim yazıb. Boş `note`/`category` → `EmptyValue` (`məlum deyil` sr-only) ✔. Mala bağlıda `href="/mallar/p1"` emerald link + `onClick={onClose}` ✔ (route `_app.mallar_.$id.tsx` mövcuddur). Maya təsiri: `50/80 = 0.625 → +0.63 ₼/ədəd` (`Math.round(x*100)/100`, backend `CalculateRealCost` ilə eyni məxrəc `initialQuantity`). `nameOf` `ActivityLog.tsx:39-43` ilə eyni naxış — employees → cari user → `Naməlum` (hər üç hal render testində yoxlanıldı). `general` xərcdə nə mal, nə maya sətri render olunmur ✔. |
| **AC-14** | Alt sticky panel + icazələr + silmə | ✅ Pass (render + kod trace) | `canWrite=true` → `Düzəliş et` (secondary+Pencil) və `Sil` (danger+Trash2), `grid grid-cols-2` + `pb-[calc(env(safe-area-inset-bottom)+0.75rem)]` ✔. `canWrite=false` → **footer ümumiyyətlə render olunmur** (render testi: "Düzəliş et"/"Sil" HTML-də yoxdur), detal isə oxunaqlı qalır ✔. `_app.xercler.tsx:210-222` ConfirmModal mesajı mala bağlıda "Malın real mayası yenidən hesablanacaq" ✔; `handleDelete` uğurda `toast.success("Xərc silindi")` + `if (detailId === deleteFor.id) setDetailId(null)` ✔. Əlavə təhlükəsizlik: `detailExpense` `expenses.find(...)` ilə hesablandığı üçün sətir siyahıdan çıxanda drawer onsuz da bağlanır. |
| **AC-15** | Genişlənmə | ✅ Pass (render) / ⚠️ canlı toqql yoxlanmadı | Drawer başlığında `Genişlət` düyməsi `hidden … sm:flex` klasları ilə render olunur (mobil gizli, desktop görünür) ✔. `Drawer.tsx:46` `expandable = true` defolt; vəziyyət ortaq `useDrawerExpandStore`-dadır → digər drawer-lərlə paylaşılır (kod). Faktiki klik keçidi canlı brauzer tələb edir. |
| **AC-16** | ExpenseForm Modal → Drawer | ✅ Pass (render) | `role="dialog"` + `aria-modal="true"` + başlıq `Yeni xərc` / `Xərci düzəliş et` ✔. Footer scroll sahəsindən KƏNARDADIR: `flex-1 overflow-y-auto p-5` (məzmun) + `shrink-0` (footer) ✔, `safe-area-inset-bottom` ✔. Kart üslubu qorunub: `role="radiogroup"` + **2** `role="radio"` (Ümumi xərc / Mala bağlı xərc), roving `tabindex="0"/"-1"`, ox düymələri handler-i (`ExpenseForm.tsx:93-101`) ✔. `autofocus` Xərc adında ✔, `ExpenseTypeField`, `Məbləğ+Tarix` cütü (`grid-cols-2`), `type="date" max=<bu gün>`, Qeyd `<textarea>` ✔. Validasiya mətnləri (`save()`, sətir 196-222) **dəyişməyib**. |
| **AC-17** | Formada genişlənmə | ✅ Pass (kod) — bax **BUG-2** (kosmetik) | Render-prop `(isExpanded) => …` işlədilir; `isExpanded && "lg:grid-cols-2"`, `ExpenseTypeField` və `Qeyd` `lg:col-span-2` ilə tam sətir qalır ✔ (inline "yeni növ" forması sığır). Daşma/kəsilmə yoxdur. Kosmetik: 2 sütunlu düzülüşdə `col-span-2` elementin auto-placement-i səbəbindən 1-ci sətirdə "Xərc adı"-nın yanında boş xana qalır — BUG-2. |
| **AC-18** | Detal → düzəliş axını | ✅ Pass (kod trace) | `ExpenseDetailDrawer.tsx:112-115`: `onClick={() => { onClose(); onEdit(expense); }}` — hər ikisi EYNİ event handler-dədir, React 18 avtomatik batching ilə tək renderdə `setDetailId(null)` + `setEditing(e)` + `setFormOpen(true)` tətbiq olunur → **iki drawer heç vaxt eyni anda render olunmur**. `ExpenseForm` `useEffect([open, initial])` ilə sahələri `initial`-dan doldurur (`ExpenseForm.tsx:161-185`). Yaddaşdan sonra `onClose()` + `invalidateExpenseSideEffects` (`queries.ts:14-22`) → `["expenses"]` prefiksi yenilənir → siyahı və alt cəm eyni anda yenilənir. |
| **AC-19** | Mobil 375px | ⚠️ **Qismən** — bax **BUG-3** | Keçən bəndlər: dövr tabları `overflow-x-auto flex-nowrap shrink-0 whitespace-nowrap` ✔; drawer paneli `w-full` (yalnız `sm:` breakpoint-dən sonra dar) ✔; `Genişlət` düyməsi `hidden … sm:flex` → mobildə görünmür ✔; detal footer `grid-cols-2` + `min-w-0 px-3 text-sm` + `<span class="truncate">` ✔; `Qeyd` sütunu `hidden xl:table-cell` ✔; mobil kart Düzəliş düyməsi `h-11` (44px) ✔. **Keçməyən bənd:** dövr tabları `px-3 py-1.5 text-sm` (≈30px hündürlük) və `Mənbə`/`Xərc növü` select-ləri `h-9` (36px) — 44px hədəfindən aşağı. Qeyd: bu, AC-2-nin tələb etdiyi paylaşılan naxışın (SalesJournal/ProductFilters) EYNİ klaslarıdır → AC-2 ilə AC-19 arasında ziddiyyət var. Faktiki 375px vizual render (üfüqi scroll) skrinşotla yoxlanmadı. |
| **AC-20** | `npm run build` | ✅ Pass | `tsc && vite build` → exit 0, 5.87s, 2782 modul. Yalnız mövcud "chunk > 500 kB" xəbərdarlığı (bu PR-a aid deyil). |
| **AC-21** | Real backend rejimi | ✅ Pass (FE) — bax **BUG-1** (BE) | `USE_MOCK=false` (`.env.local: VITE_API_URL=https://localhost:7088`). Faktiki fetch URL-ləri AC-4-dəki kimi **düzgün** göndərilir və `Authorization: Bearer` başlığı qoşulur. Nəticə alt cəmlə uyğundur: real DB-də 2 xərc var (`2026-08-01: 123 ₼ general/Digər`, `2026-07-11: 50 ₼ product/Yol pulu`) → "Bu ay" = 123.00 ₼, "Bu il"/"Hamısı" = 173.00 ₼ (əl hesabı ilə uyğun). Mock rejim də sınmır: `expenseHandlers.list()` bütün siyahını qaytarır, dövr süzgəci client-side `inPeriod` ilə tətbiq olunur. |

---

## Test case nəticələri

| TC | Ssenari | Nəticə | Sübut |
|---|---|---|---|
| **TC-1** | /xercler parametrsiz | ✅ Pass (render) | `type="month"` yoxdur; FilterBar var; `validateSearch({}) = {period:"month", source:"all"}`; alt cəm = 340.00 ₼ = cari təqvim ayının sətirlərinin cəmi (əl hesabı ilə uyğun); "Bu ay üzrə"/"gələcək tarixli" mətnləri yoxdur. |
| **TC-2** | Bu il | ✅ Pass (icra) | URL `?period=year`; faktiki sorğu `GET /api/expenses?from=2026-01-01&to=2026-08-01`; render testində il cəmi **940.00 ₼** (əvvəlki ayların sətirləri daxil), keçən ilin 999 ₼-lıq sətri **çıxarıldı** (1939 − 940 = 999 ✔). |
| **TC-3** | Bu gün | ✅ Pass (icra) | `from=to=2026-08-01`; render testində yalnız bugünkü tarixli sətirlər (cəm 340.00 ₼ — dataset-də bugünkü 14×10 + 200); `inPeriod("today")` sabahkı tarixi rədd edir. |
| **TC-4** | Bu həftə | ✅ Pass (icra) | `from=2026-07-26&to=2026-08-01` (son 7 gün, bu gün daxil). Sərhəd testi: d0 ✔ daxil, d6 (2026-07-26) ✔ daxil, **d7 (2026-07-25) ✘ xaric**, sabah ✘ xaric. Render cəmi 440.00 ₼ — `inPeriod("week")` ilə hərfi bərabər. |
| **TC-5** | Hamısı | ✅ Pass (icra) | Sorğuda from/to **YOXDUR** (`/api/expenses`); render cəmi 1,939.00 ₼ = bütün datasetin cəmi. |
| **TC-6** | F5 sonrası | ✅ Pass (sxem) | `validateSearch({period:"year",source:"product",type:"Yol pulu",q:"kar"})` → dördü də olduğu kimi qayıdır; `q` dəyəri render zamanı axtarış input-una bağlanır (`value="kar"`). |
| **TC-7** | Mənbə = Mala bağlı | ✅ Pass (render) | Cəm 570.00 ₼ (yalnız `source=product`); `aria-label="Mala bağlı sil"` çipi görünür; `handleRemoveFilter("source")` → `{source:"all"}` (kod). |
| **TC-8** | Xərc növü filtri | ✅ Pass (render) | `type="Digər"` → cəm 1,249.00 ₼ (yalnız həmin kateqoriya); real backend-də mövcud növlər: `["Digər","Yol pulu"]`. |
| **TC-9** | BÖYÜK hərflə axtarış + note üzrə | ✅ Pass (render) | `"KARQO"` → "KARQO ödənişi" tapıldı; `"böyük qeyd"` (yalnız `note`-da) → eyni sətir tapıldı. Filtr: `` `${e.title} ${e.note ?? ""}`.toLowerCase().includes(needle) ``. |
| **TC-10** | Dövr+mənbə+növ+axtarış birlikdə | ✅ Pass (render) | `year + product + "Yol pulu" + "İlin"` → **AND** məntiqi ilə tək sətir qaldı, cəm 500.00 ₼; badge sayı **3** (q sayılmır — defolt qayda). |
| **TC-11** | Filterləri təmizlə | ✅ Pass (sxem + render) | Düymə aktiv filtr olduqda render olunur ✔. `clearFilters()` → `{period:"month", source:"all", type:undefined, q:undefined}`; sxemdən keçirildikdə nəticə `{"period":"month","source":"all"}` — `type`/`q` açarları URL-də qalmır ✔. |
| **TC-12** | `?period=xyz&source=abc` | ✅ Pass (sxem icra) | `validateSearch({period:"xyz", source:"abc"})` **xəta atmır** → `{"period":"month","source":"all"}` (`.catch()` işləyir). |
| **TC-13** | Nəticə boş | ✅ Pass (render) | `q="zzz-yoxdur"` → "Xərc tapılmadı" boş vəziyyəti + filtrli mətn; alt cəm sətri **qalır** və `0.00 ₼` göstərir. |
| **TC-14** | Pagination (>10 sətir) | ✅ Pass (render) | 15 filtrlənmiş sətir → cədvəldə **10** `role="button"` sətir render olundu, alt cəm isə **340.00 ₼** = 15 sətrin hamısının cəmi. Cəm `visibleExpenses`-dən hesablandığı üçün səhifə dəyişməsindən **struktur olaraq asılı deyil** (DataTable pagination `table` state-ində qalır, `visibleExpenses`-ə toxunmur). |
| **TC-15** | Sətrə klik → detal | ✅ Pass (render + kod) | Sətirlər `role="button"`+`tabIndex=0`+Enter/Space handler; `onRowClick={(e) => setDetailId(e.id)}`. Drawer HTML-i: ad, nəhəng məbləğ (`123.50 ₼`), mənbə badge, Növ/Tarix/Qeyd/Kim yazıb ("Rəşad Məmmədov") — hamısı təsdiqləndi. |
| **TC-16** | Mala bağlı xərcin detalı | ✅ Pass (render + real data) | `href="/mallar/p1"` + `text-emerald-700` link (`onClick={onClose}` → drawer bağlanır); `Mayaya təsiri: +0.63 ₼/ədəd` (50/80). **Real backend datası ilə də uyğun:** "Test yol xerci" 50 ₼ → "Qadın bluz ipək" (`initialQuantity=80`) → 0.63 ₼/ədəd. |
| **TC-17** | Ümumi (general) xərcin detalı | ✅ Pass (render) | `Bağlı mal` və `Mayaya təsiri` sətirləri HTML-də **yoxdur**; Növ/Tarix/Qeyd/Kim yazıb normal görünür. |
| **TC-18** | Mal silinib / `initialQuantity=0` | ✅ Pass (render + icra) | Mal tapılmayanda: maya sətri yoxdur, `EmptyValue label="mal tapılmadı"` göstərilir, HTML-də `NaN/Infinity/undefined` **yoxdur**. `initialQuantity=0`: maya sətri yoxdur, mal linki qalır, `NaN/Infinity` yoxdur. Funksiya icrası: `100/0 → null`, `100/null → null`, `100/undefined → null`, `100/(-5) → null`, `100/8 → 12.5` ✔. Senior-un əlavə etdiyi `productsLoading` → "Yüklənir…" göstəricisi "mal tapılmadı" flash-ını aradan qaldırır ✔. |
| **TC-19** | Detal → Düzəliş → Yadda saxla | ✅ Pass (kod trace) | `onClose(); onEdit(expense);` eyni handler-də → batched → **üst-üstə iki drawer yoxdur**; `ExpenseForm` `useEffect` ilə sahələri doldurur (SSR-də effekt işləmədiyi üçün render testi ilə deyil, kod izləməsi ilə təsdiqləndi); `updateMut.onSuccess` → `invalidateQueries(["expenses"])` → siyahı + alt cəm yenilənir; `toast.success("Xərc yeniləndi…")`. Canlı klik yoxlanmadı. |
| **TC-20** | Detalda Sil → təsdiq | ✅ Pass (kod trace) | `onDelete(expense)` → `setDeleteFor` → `ConfirmModal open` (mala bağlıda "Malın real mayası yenidən hesablanacaq"); təsdiq → `deleteMut.mutateAsync` → `toast.success("Xərc silindi")` → `setDetailId(null)` (drawer bağlanır) → `invalidate` → sətir siyahıdan çıxır → alt cəm avtomatik azalır (`visibleExpenses`-dən hesablandığı üçün). Canlı klik yoxlanmadı. |
| **TC-21** | `expenses.write` icazəsi olmayan rol (satıcı) | ✅ Pass (render) | `canWrite=false` → cədvəldə `Düzəliş` düyməsi və `… əməliyyatları` ActionMenu-su HTML-də **yoxdur** (həm desktop sütunu, həm mobil kart); detal draweri açılır və tam oxunaqlıdır, footer render olunmur. `useCan()("expenses.write")` qaydası dəyişməyib (`auth/store.ts` `satici` rolunda bu icazə yoxdur). |
| **TC-22** | Silmədə backend 4xx/5xx | ✅ Pass (kod trace) | `handleDelete` `try/catch` → `toast.error(e.message ?? "Xərc silinmədi")`; `deleteMut` uğursuz olduğu üçün `invalidate` işə düşmür → **sətir siyahıdan itmir**; `setDetailId(null)` yalnız uğur budağındadır → **detal draweri açıq qalır** ✔. (Qeyd: `ConfirmModal` özü bağlanır — bu, paylaşılan komponentin bütün tətbiqdəki davranışıdır, FE#41-ə xas deyil; bax QEYD-2.) |
| **TC-23** | Boş ad / 0 məbləğ / növ seçilməyib / sabahkı tarix | ✅ Pass (kod trace) | `save()` (sətir 196-222): `catErr`, `prodErr`, `dateErr` **eyni anda** hesablanıb `setState` ilə yazılır; `baseInvalid` → `toast.error("Xərc adı və məbləğ mütləqdir")`; `if (baseInvalid \|\| catErr \|\| prodErr \|\| dateErr) return;` → **mutation çağırılmır (sorğu getmir)** ✔. Mətnlər dəyişməyib. `type="date" max={todayISO()}` da UI-da gələcək tarixi bloklayır. |
| **TC-24** | Mala bağlıda mal seçilmədən yadda saxlama | ✅ Pass (kod trace) | `prodErr = source==="product" && !productId ? "Mal seçimi mütləqdir" : ""` → `return` (sorğu getmir); xəta `Field error` ilə göstərilir. |
| **TC-25** | Desktop Genişlət (hər iki drawer) | ⚠️ **Blocked (canlı)** / ✅ Pass (kod) | Kod: `Drawer.tsx:85-89` `isExpanded → "sm:max-w-[min(85vw,72rem)]"` (~85%), `transition-[max-width] duration-[250ms] ease-out` (yumşaq keçid); vəziyyət ortaq `useDrawerExpandStore`-dadır → digər drawer-lərdə də yadda qalır; forma `lg:grid-cols-2` + `lg:col-span-2` ilə düzülüşü saxlayır. **Canlı toqql yoxlanmadı** (zustand SSR-də `getInitialState` qaytardığı üçün render testi ilə təsdiqlənə bilmədi; brauzer avtomatlaşdırması yoxdur). Kosmetik qeyd: BUG-2. |
| **TC-26** | 375px mobil (səhifə + hər iki drawer) | ⚠️ **Blocked (canlı vizual)** / ⚠️ Qismən (kod) | Kod/markup: dövr tabları `overflow-x-auto` ilə sürüşür ✔; drawer-lər `w-full` ✔; `Genişlət` `hidden … sm:flex` → görünmür ✔; footer düymələri `min-w-0 px-3 text-sm` + `truncate` ilə sığır ✔; mobil kart `role="button"` ilə detal açır ✔; `Qeyd` sütunu `hidden xl:table-cell` ✔. **Faktiki 375px render / üfüqi scroll skrinşotla yoxlanmadı.** Toxunma hədəfi bəndi: bax BUG-3. |
| **TC-27** | Real backend: Bu il + növ filtri | ✅ Pass (API testi) — bax **BUG-1** | Real `https://localhost:7088` (sahib rolu ilə login, read-only GET): FE-nin qurduğu URL `?from=2026-01-01&to=2026-08-01` düzgündür; cavabda `source` və `createdByUserId` sahələri mövcuddur ✔; DB-dəki 2 xərcin əl hesabı (123 + 50 = 173 ₼) alt cəmlə uyğundur. **Amma:** backend `from/to` parametrlərini nəzərə almır (bax BUG-1) — nəticə yalnız FE-nin client-side `inPeriod` süzgəci sayəsində düzgün çıxır. |
| **TC-28** | `npm run build` | ✅ Pass | Aşağıda tam çıxış. |

---

## Xalis funksiya icra nəticələri (real modullar, Node)

`expensePeriodToRange` ↔ `inPeriod` **810 gün × 5 dövr = 4050 müqayisə → 0 uyğunsuzluq.**
Bu, AC-4-ün əsas riskini bağlayır: real backend (from/to pəncərəsi) və mock/client-side (`inPeriod` pəncərəsi) **eyni sətir dəstini** verir, ay/il/həftə sərhədlərində sürüşmə yoxdur.

```
today = 2026-08-01
PERIOD_LABELS = {"today":"Bu gün","week":"Bu həftə","month":"Bu ay","year":"Bu il","all":"Hamısı"}
range today -> {"from":"2026-08-01","to":"2026-08-01"}
range week  -> {"from":"2026-07-26","to":"2026-08-01"}
range month -> {"from":"2026-08-01","to":"2026-08-01"}
range year  -> {"from":"2026-01-01","to":"2026-08-01"}
range all   -> {}
range/inPeriod mismatches: 0

week: d0 2026-08-01 true | d6 2026-07-26 true | d7 2026-07-25 false | tomorrow 2026-08-02 false

impact 100/8  = 12.5      impact 100/0  = null
impact 100/null = null    impact 100/undefined = null
impact 100/-5 = null      impact 10/3   = 3.33  → "+3.33 ₼"
fmtMoney(0) = "0.00 ₼"
```

**Timezone qeydi:** `todayISO()`/`daysAgoISO()` `date-fns format` (LOKAL gün) işlədir, `daysBetween()` isə ISO gün sətirlərini UTC gecəyarısı kimi parse edir → fərq həmişə 86400000-in tam misli olur, yay/qış saatı sürüşməsi yoxdur. `from/to` API-yə `YYYY-MM-DD` (saatsız) gedir → backend `DateOnly` ilə uyğundur.

## Faktiki fetch URL-ləri (interceptor ilə)

```
USE_MOCK = false
today  -> https://localhost:7088/api/expenses?from=2026-08-01&to=2026-08-01  [auth=yes]
week   -> https://localhost:7088/api/expenses?from=2026-07-26&to=2026-08-01  [auth=yes]
month  -> https://localhost:7088/api/expenses?from=2026-08-01&to=2026-08-01  [auth=yes]
year   -> https://localhost:7088/api/expenses?from=2026-01-01&to=2026-08-01  [auth=yes]
all    -> https://localhost:7088/api/expenses                                [auth=yes]
from/to + month birlikdə -> ?from=2026-01-01&to=2026-08-01   (month düşür ✔)
```

## Real backend API testi (read-only)

```
login (0501112233 / demo123) -> 200, role=sahib

no params                 GET /api/expenses                              -> 200 rows=2  2026-08-01:123, 2026-07-11:50
month=2026-08             GET /api/expenses?month=2026-08                -> 200 rows=1  2026-08-01:123      ✔ süzülür
month=2026-07             GET /api/expenses?month=2026-07                -> 200 rows=1  2026-07-11:50       ✔ süzülür
from/to = today only      GET /api/expenses?from=2026-08-01&to=2026-08-01 -> 200 rows=2 ✘ SÜZÜLMÜR
from/to = 2020 window     GET /api/expenses?from=2020-01-01&to=2020-01-02 -> 200 rows=2 ✘ SÜZÜLMÜR
from only                 GET /api/expenses?from=2026-08-01               -> 200 rows=2 ✘ SÜZÜLMÜR
to only                   GET /api/expenses?to=2026-01-01                 -> 200 rows=2 ✘ SÜZÜLMÜR

Cavab sxemi: id, title, category, source, amount, date, productId, productName, note, createdByUserId, createdAt  ✔
```

Backend mənbəyi (yalnız oxundu):
`backend/src/Modules/MayaPro.WarehouseApi.Modules.Expenses/Endpoints/ExpensesEndpoints.cs:23`
```csharp
group.MapGet("/", async (string? month, string? source, GetExpensesHandler handler, CancellationToken ct) =>
```
→ `from`/`to` parametrləri endpoint imzasında **ümumiyyətlə yoxdur**.

## `npm run build`

```
> sederek-sistem@0.0.0 build
> tsc && vite build

vite v6.4.3 building for production...
✓ 2782 modules transformed.
dist/index.html                     0.83 kB │ gzip:   0.45 kB
dist/assets/index-BjKeJSZw.css     45.80 kB │ gzip:   8.17 kB
dist/assets/index-CE6O8y6G.js   1,187.08 kB │ gzip: 332.73 kB
✓ built in 5.87s
```
(Yeganə xəbərdarlıq — "chunk > 500 kB" — bu PR-dan əvvəl də mövcuddur, FE#41-ə aid deyil.)

Dev server sanity: `npm run dev` qalxır, `/xercler` və dəyişən modulların hamısı 200 ilə transform olunur (Vite pre-transform xətası yoxdur).

---

## Tapılan problemlər

### BUG-1 — [Orta] Backend `GET /api/expenses` `?from=&to=` parametrlərini nəzərə almır (BE#22 tətbiq olunmayıb)

- **Severity:** Medium
- **Scope:** **BACKEND** — FE#41 kodunda deyil, asılılıqda. FE#41 öz tərəfini düzgün icra edib.
- **Aidiyyatı:** AC-4, AC-21, TC-2, TC-27
- **Reproduksiya:**
  1. Backend işlək olsun (`https://localhost:7088`), DB-də ən azı 2 fərqli aya aid xərc olsun.
  2. `POST /api/auth/login` (0501112233 / demo123) → token.
  3. `GET /api/expenses?from=2020-01-01&to=2020-01-02` (Bearer token ilə).
- **Gözlənilən:** 0 sətir (aralıqda xərc yoxdur) — BE#22-nin vəd etdiyi `from`/`to` süzgəci.
- **Faktiki:** 200 + **bütün** xərclər (2 sətir). `from` only, `to` only, `startDate/endDate`, `dateFrom/dateTo` variantları da eynidir. Yalnız `?month=YYYY-MM` işləyir.
- **Kök səbəb:** `ExpensesEndpoints.cs:23` — `MapGet("/", async (string? month, string? source, …))`; `from`/`to` binding parametrləri yoxdur. Backend repo `task/BE21-open-debts-fifo` branch-ındadır, BE#22 heç bir commitdə görünmür.
- **İstifadəçiyə təsiri:** **Görünən nəticə düzgündür** — FE əlavə olaraq client-side `inPeriod` süzgəcini tətbiq edir (`_app.xercler.tsx:73-86`), ona görə cədvəl və alt cəm doğru çıxır. Risk: server hər dəfə BÜTÜN xərcləri qaytarır → xərc sayı artdıqca şəbəkə/yaddaş yükü və "Bu gün" filtrinin mənasız trafiki.
- **Tövsiyə:** AYRICA backend taskı (`[BUG][FE#41] GET /api/expenses ?from=&to= dəstəyi (BE#22)`), priority: medium. FE#41 bloklanmamalıdır.

### BUG-2 — [Aşağı] Genişləndirilmiş forma draweri: 2 sütunlu gridin 1-ci sətrində boş xana qalır

- **Severity:** Low (kosmetik)
- **Aidiyyatı:** AC-17, TC-25
- **Reproduksiya:** Desktop (lg+) → "Yeni xərc" → drawer başlığında "Genişlət".
- **Gözlənilən:** 2 sütunlu düzülüş boşluqsuz doldurulur.
- **Faktiki:** CSS grid auto-placement: `Xərc adı` (1 sütun) → r1c1; növbəti element `lg:col-span-2` (Xərc növü) olduğu üçün r1c2-yə sığmır və r2-yə keçir → **r1c2 boş qalır**. Eyni səbəbdən `general` mənbədə r3c2 də boş qalır (`Məbləğ+Tarix`-dən sonra `Qeyd` da `col-span-2`-dir).
- **Təsir:** Yalnız vizual boşluq; daşma, kəsilmə və ya funksional problem yoxdur.
- **Tövsiyə (məcburi deyil):** `Xərc adı`-nı da `lg:col-span-2` etmək, və ya sahələrin sırasını dəyişmək (`Xərc adı` + `Məbləğ/Tarix` yan-yana).

### BUG-3 — [Aşağı] Toxunma hədəfləri 44px-dən kiçikdir (dövr tabları ~30px, select-lər 36px)

- **Severity:** Low
- **Aidiyyatı:** AC-19, TC-26
- **Reproduksiya:** 375px mobil → "Filterlər" panelini aç → dövr tablarına və Mənbə/Xərc növü select-lərinə bax.
- **Gözlənilən (AC-19):** toxunma hədəfləri ≥ 44px.
- **Faktiki:** dövr tabları `px-3 py-1.5 text-sm` ≈ 30px; select-lər `h-9` = 36px.
- **Vacib qeyd:** Bu, AC-2-nin açıq tələbidir — "SalesJournal-dakı **eyni markup və klasslar**" (`SalesJournal.tsx:487-492`) və `ProductFilters.tsx:82` ilə eynidir. Yəni **AC-2 ilə AC-19 bir-birinə ziddir** və developer AC-2-ni izləyib. Düzəliş edilərsə, paylaşılan naxış (mallar + satış + xərclər) BİRLİKDƏ dəyişməlidir — FE#41-ə tək başına yamaq vurulması dizayn tutarlılığını pozar.
- **Tövsiyə:** Ayrıca dizayn-sistemi taskı (bütün filter panellərində tab/select hündürlüyü), FE#41-i bloklamamalı.

### QEYD-1 — [Məlumat] Köhnə `?month=` bookmark-ları artıq oxunmur

`validateSearch({month:"2026-07"})` → `{"period":"month","source":"all"}` (`month` sükutla atılır). Senior review-da da qeyd olunub; AC/TC-lərdə bu barədə tələb yoxdur, semantik dəyişiklik (ay filtri → dövr filtri) qəbul ediləndir. Bug sayılmır.

### QEYD-2 — [Məlumat] `ConfirmModal` silmə xətasında bağlanır

`ConfirmModal.tsx:33-36` — `onConfirm()` çağırıldıqdan dərhal sonra `onClose()` icra olunur, async nəticə gözlənilmir. Bu, paylaşılan komponentin bütün tətbiqdəki (mallar, satış, xərclər) davranışıdır, FE#41-də yaranmayıb. TC-22-nin tələbləri (xəta toast-ı, sətrin qalması, detal drawerinin açıq qalması) buna baxmayaraq təmin olunur. Bug sayılmır — istənilsə, ayrıca UX taskı.

---

## Senior-un işarə etdiyi risk nöqtələri — nəticə

| Nöqtə | Nəticə |
|---|---|
| TC-2 / TC-4 — "Bu il" / "Bu həftə" tarix sərhədləri, timezone/ISO | ✅ Təmiz. 4050 müqayisədə `range` ↔ `inPeriod` uyğunsuzluğu 0; həftə sərhədi d6 daxil / d7 xaric; "Bu il" `2026-01-01…bu gün`; timezone sürüşməsi yoxdur (lokal gün + UTC-normalizə edilmiş fərq). |
| TC-16 / TC-18 — maya təsiri sətri, mal tapılmama | ✅ Təmiz. `initialQuantity` 0/mənfi/yox və mal tapılmayan hallarda sətir render olunmur; HTML-də `NaN/Infinity/undefined` yoxdur; `productsLoading` → "Yüklənir…" flash-ı aradan qaldırır. |
| TC-19 / TC-20 — Detal → Düzəliş axını, silmədən sonra drawer | ✅ Təmiz (kod trace). `onClose(); onEdit(e);` eyni handler-də batch olunur → üst-üstə iki drawer yoxdur. Silmə uğurunda `setDetailId(null)` + `detailExpense`-in siyahıdan törəməsi ikiqat qoruma verir. |
| TC-26 — 375px, hər iki drawer, dövr tablarının sürüşməsi | ⚠️ Struktur PASS (overflow-x-auto, w-full, truncate, gizli Genişlət), **canlı vizual BLOCKED**; 44px toxunma hədəfi bəndi → BUG-3. |
| Alt "Cəmi (filtrlənmiş)" — canlı və pagination-dan asılı olmayan | ✅ Təmiz. 15 sətirdən 10-u göstərilən halda cəm bütün 15 sətrin cəmini verdi; 8 fərqli filtr kombinasiyasında dəyər əl hesabı ilə üst-üstə düşdü; boş nəticədə `0.00 ₼`. |

---

## Yekun

**Nəticə: PASS.** FE#41 scope-unda ❌ Fail yoxdur — 21 AC-dən 20-si tam, 1-i qismən (AC-19, AC-2 ilə ziddiyyətli 44px bəndi); 28 TC-dən 26-sı Pass, 2-si yalnız canlı brauzer olmadığı üçün Blocked (kod səviyyəsində düzgündür). `npm run build` yaşıldır.

Tapılan 3 problemdən **heç biri FE#41-i bloklamır**: BUG-1 backend asılılığıdır (istifadəçiyə görünən nəticə düzgündür), BUG-2 və BUG-3 kosmetikdir və BUG-3 mövcud dizayn sistemindən irəli gəlir.

**Tövsiyə:** FE#41 → **Done**; BUG-1 üçün ayrıca backend taskı açılsın (medium), BUG-2/BUG-3 backlog-a (low).
