# UI/UX Mövcud Vəziyyət Auditi — Sədərək Anbar (FE#68)

## Məqsəd və əhatə

Bu sənəd `sederek-sistem` frontend tətbiqinin **mövcud** vəziyyətini pərakəndə anbar / POS / CRM meyarları ilə qiymətləndirir. Hədəf istifadəçi: Sədərək tipli bazar mühitində mağaza sahibi, satıcı, anbar işçisi və menecer — rəqəmsal savadı aşağı ola bilər. Ona görə qiymətləndirmə meyarları: **sadəlik, açıq-aydınlıq, sürət, səhvə dözümlülük, öyrənilə bilənlik**.

Bu task **kod dəyişmir**. Bütün tapıntılar yalnız sənədləşdirilir; implementasiya `docs/ui-refactor-roadmap.md` üzrə ayrıca tasklarla aparılacaq.

**Toxunulmayan sərhədlər (analiz boyu qorunub):** biznes məntiqi, düsturlar, API kontraktları, backend davranışı, route-lar, icazələr, data modelləri, mövcud iş axınları. Təklif olunan hər UI mətn dəyişikliyi yalnız «Etiket və mətn dəyişiklikləri» cədvəlində sənədləşdirilib.

### Audit metodologiyası

| Mənbə | İstifadə |
|---|---|
| `.claude/skills/design-taste-frontend/SKILL.md` | audit-first yanaşma, mövcud dizayn sisteminə sadiqlik, "template görünüşdən" qaçmaq |
| `.claude/skills/apple-design/SKILL.md` | cavab sürəti (pointer-down feedback), fasiləsiz geri-bildiriş, məkan ardıcıllığı, `prefers-reduced-motion` |
| `.claude/skills/emil-design-eng/SKILL.md` | görünməyən detalların toplanması, vəziyyət (state) tamlığı, fokus/hover/disabled keyfiyyəti |
| `.claude/skills/review-animations/STANDARDS.md` | hərəkət tezliyi cədvəli, easing seçimi, modal/drawer/toast üçün "standart animasiya" gözləntisi |
| Real kod | `src/routes/`, `src/features/*/components/`, `src/components/ui/`, `src/lib/`, `src/mocks/` |

### Texniki stack (`package.json`)

React 18.3 · TypeScript 5.7 · Vite 6 · TanStack Router 1.87 (file-based) · TanStack Query 5.62 · TanStack Table 8.20 · Tailwind CSS 3.4 · zustand 5 · react-hook-form 7 + zod 3 · recharts 2.15 · lucide-react 0.468 · date-fns 4 · vitest 4 + Testing Library.

Tema: `tailwind.config.ts` — yalnız `fontFamily` (Inter), 2 kölgə tokeni (`shadow-soft`, `shadow-card`) və `spacing.safe-bottom`. **Rəng tokenləri yoxdur** — brend rəngi hər faylda birbaşa `emerald-*` / `stone-*` sinifləri ilə yazılır (`src/index.css` yalnız baza tipoqrafiya + sidebar scrollbar üslubu verir).

### Ciddilik şkalası

| Səviyyə | Meyar |
|---|---|
| **Kritik** | İstifadəçi pul/uçot barədə YANLIŞ qərar verə bilər, yaxud ekran istifadə olunmaz vəziyyətə düşür |
| **Yüksək** | Gündəlik axını əhəmiyyətli yavaşladır və ya mənanı çaşdırır; əlçatanlıq baryeri yaradır |
| **Orta** | Ardıcıllıq/öyrənilə bilənlik problemi; işi bloklamır |
| **Aşağı** | Cilalanma, ölü kod, incə detal |

### Tapıntıların yekun bölgüsü

| Ciddilik | Say | ID-lər |
|---|---|---|
| Kritik | 3 | F-01, F-02, F-03 |
| Yüksək | 14 | F-04, F-07, F-09, F-11, F-12, F-13, F-22, F-26, F-27, F-34, F-37, F-38, F-44, F-50 |
| Orta | 28 | F-05, F-06, F-08, F-14, F-15, F-16, F-17, F-18, F-19, F-21, F-24, F-25, F-28, F-29, F-30, F-31, F-32, F-35, F-36, F-39, F-40, F-41, F-42, F-43, F-47, F-48, F-51, F-52 |
| Aşağı | 7 | F-10, F-20, F-23, F-33, F-45, F-46, F-49 |
| **Cəmi** | **52** | F-01 … F-52 |

### Necə oxumalı

| Əgər sən… | Bunu oxu |
|---|---|
| tapşırıqdakı 8 konkret suala cavab axtarırsansa | **Bölmə 1** — hər bənd üçün açıq qərar + kod sübutu |
| səhifə üzrə iş planı qurursansa | **Bölmə 2** — 12 səhifə, hər tapıntı 9 sahə ilə |
| yalnız ən vacibini görmək istəyirsənsə | **Aşağıdakı «10 ən vacib tapıntı»** və **Bölmə 10** (eyni siyahı, izahlı) |
| komponent səviyyəsində işləyirsənsə | `docs/ui-component-inventory.md` |
| risk/prioritet qərarı verirsənsə | `docs/ui-ux-risk-register.md` (`R-01` … `R-52`) |
| implementasiyaya başlayırsansa | `docs/ui-refactor-roadmap.md` (Mərhələ 1 … 6) |

**Oxu açarları:** `F-xx` — tapıntı ID-si (bu sənəddə təyin olunur) · `E-xx` — etiket/mətn dəyişikliyi (bölmə 8) · `R-xx` — risk (risk reyestri) · Mərhələ — yol xəritəsindəki icra mərhələsi.

### 10 ən vacib tapıntı — tez baxış

Tam izah və 9 sahəli təsvir üçün bax: müvafiq bölmə və sənədin sonundakı **bölmə 10**.

| # | ID | Ciddilik | Bir cümlə ilə | Mərhələ |
|---|---|---|---|---|
| 1 | `F-01` | Kritik | «Kassada olmalı» Sidebar-da və Gün Sonunda fərqli mənbədən hesablanır və eyni gündə fərqli rəqəm göstərə bilər | 1 |
| 2 | `F-02` | Kritik | Müsbət kassa fərqi («artıq pul») uğur kimi yaşıl göstərilir, halbuki bu uçot xətasıdır | 1 |
| 3 | `F-03` | Kritik | Dashboard və Hesabatlar sorğu xətasında sonsuz spinner-də donur | 1 |
| 4 | `F-22` | Yüksək | Xərc məbləği 7 yerdə gah mənfi işarəli, gah işarəsiz göstərilir | 1 |
| 5 | `F-04` | Yüksək | Böyük məbləğlərdə KPI rəqəmləri kartdan daşır | 1 |
| 6 | `F-27` | Yüksək | «Xalis qazanc» əslində xərc çıxılmamış satış qazancıdır | 1 |
| 7 | `F-13` | Yüksək | Qismən ödənişli satış 4 yerdə 4 fərqli çərçivədə göstərilir | 2A |
| 8 | `F-11` | Yüksək | Barkod skanerinin `Enter`-i kassa ekranında idarə olunmur | 2B |
| 9 | `F-50` | Yüksək | Tətbiqdə 6 fərqli axtarış davranışı var; topbar axtarışı gizli şəkildə səhifə dəyişir | 2B |
| 10 | `F-38` | Yüksək | Çiplər, cədvəl düymələri və bağlama düymələri 44px toxunma minimumundan kiçikdir | 2B |

---

## 1. Xüsusi yoxlanılmalı məsələlər üzrə yekun qərarlar

Aşağıdakı 8 bənd tapşırıqda ayrıca soruşulub. Hər biri üçün: **yekun qərar**, **sübut faylı**, **bağlı tapıntı**.

### 1.1 «Kassada olmalı» Sidebar-da və Gün Sonu səhifəsində fərqli dəyər göstərə bilərmi

**Qərar: Təsdiqləndi** → `F-01`

Sübut:
- `src/routes/_app.tsx:167-172` — sidebar-ın alt bloku `useDashboardStats()` cavabındakı `stats.expectedCash` sahəsini göstərir.
- `src/features/reports/queries.ts:263-271` — `getDashboardStats()`: **real rejimdə** `expectedCash` birbaşa serverin `/api/reports/dashboard` cavabından (`d.expectedCash`, `assembleDashboardStats`, sətir 238) gəlir; **mock rejimdə** isə client-də hesablanır: `expectedCash = openingCash + todayCash − todayExpenses` (`computeDashboardStats`, sətir 95-97), burada `openingCash` **bütün** bağlanışların ən sonuncusunun `actualCash`-idir.
- `src/features/day-end/components/DayEndCard.tsx:63, 74-92` — Gün Sonu ekranı **başqa endpoint-dən** (`useSummary("today")` → `/api/reports/summary?period=today`) `cashSales`/`expenses` alır, açılış kassasını isə **yalnız bugündən ƏVVƏLKİ** bağlanışlardan seçir (`closings.filter(c => c.date < t)`, sətir 80-85) və `expectedCash()` təmiz funksiyası ilə (`src/features/day-end/lib.ts:4-11`) yenidən hesablayır.

**Maaş ödənişləri sualına birbaşa cavab:** `src/features/day-end/components/DayEndCard.tsx:50-62` şərhində açıq yazılıb — bugünkü işçi maaş **ödənişləri** (BE#28) kassadan çıxan puldur və backend onları `CloseDayHandler`-də `expenses`-ə əlavə edir, lakin `GetSummaryHandler` (`SummaryData.expenses`) BE#28 ilə yenilənməyib. Nəticə: **Dashboard/Sidebar rəqəmi maaş ödənişini nəzərə alır, Gün Sonu ekranındakı bağlanışdan-əvvəlki önizləmə isə ETMİR.** Yəni eyni etiketli iki rəqəm eyni gündə fərqlənə bilər. Bu, mövcud kodda **bilərəkdən** buraxılmış fərqdir (workaround qadağan olub) — amma UI-da heç bir yerdə izah edilmir.

### 1.2 Hesabat/KPI rəqəmlərinin kartdan daşması

**Qərar: Təsdiqləndi** → `F-04`

Sübut: `src/components/ui/StatCard.tsx:40-47` — dəyər `<p>` elementi `whitespace-nowrap` ilə verilib, lakin nə `truncate`, nə `overflow-hidden`, nə də konteyner `min-w-0` var. Eyni naxış: `src/components/ui/KpiCard.tsx:66-73` (KpiCard), `:147` (StatCluster), `src/features/customers/components/DebtsKpiCards.tsx:111, 126, 140, 181`. Dashboard-da kartlar `grid-cols-2` ilə mobil ekrana yığılır (`src/routes/_app.index.tsx:59`) — 375px-də bir kart ≈ 163px enindədir, `fmtMoney` isə 2 onluq + qırılmaz boşluq + «₼» verir (`src/lib/format.ts:10-17`), yəni 6 rəqəmli məbləğ ("1,234,567.00 ₼") `lg:text-3xl`-dən əvvəl belə sığmır.

### 1.3 «Qazanc %» — maya üzərindən faiz vs satış marjası

**Qərar: Təsdiqləndi** → `F-07`

Sübut: `src/features/products/lib.ts:56-58` — `profitPercent = ((salePrice − realCost) / realCost) × 100`, yəni **mayaya görə əlavə (markup)**, satış marjası deyil. Etiket üç yerdə eynidir və heç birində izah/tooltip yoxdur: `src/features/products/components/ProductsTable.tsx:214`, `src/features/products/components/ProductForm.tsx:317`, `src/routes/_app.mallar_.$id.tsx:202`. Üstəlik format da vahid deyil: `ProductsTable` → `{pct.toFixed(1)} %` (1 onluq, boşluqlu), `ProductForm` → `` `${percent.toFixed(0)}%` `` (0 onluq, boşluqsuz), mal detalı → `` `${pct.toFixed(1)} %` ``.

### 1.4 Xərc məbləğlərinin işarə təqdimatının vahidliyi

**Qərar: Təsdiqlənmədi (vahid DEYİL)** → `F-22`

Eyni məlumat 5 fərqli şəkildə göstərilir:

| Yer | Fayl:sətir | Təqdimat |
|---|---|---|
| Xərclər cədvəli | `src/features/expenses/components/ExpensesTable.tsx:139-141` | qırmızı + **mənfi işarə** (`−`) |
| Xərclər mobil kart | `src/features/expenses/components/ExpensesTable.tsx:198-200` | qırmızı + **mənfi işarə** |
| Xərc detal draweri | `src/features/expenses/components/ExpenseDetailDrawer.tsx:154-158` | qırmızı, **işarəsiz** |
| Xərclər səhifəsi alt cəmi | `src/routes/_app.xercler.tsx:192-194` | qırmızı, **işarəsiz** |
| Dashboard «Bugünkü xərc» | `src/routes/_app.index.tsx:72` | `tone="red"`, **işarəsiz** |
| Gün sonu «Günlük xərclər» | `src/features/day-end/components/DayEndCard.tsx:183` | qırmızı + **mənfi işarə** |
| Bağlanış tarixçəsi «Xərc» | `src/features/day-end/components/ClosingHistory.tsx:43-45` | qırmızı, **işarəsiz** |

### 1.5 Gün sonunda MÜSBƏT kassa fərqinin yaşıl/uğur kimi göstərilməsi

**Qərar: Təsdiqləndi** → `F-02`

Müsbət fərq (kassada gözləniləndən **çox** pul olması) uçot xətasıdır — satış yazılmayıb, artıq pul qoyulub və ya səhv açılış girilib. Hazırda üç yerdə **uğur** kimi kodlanıb:
- `src/features/day-end/components/DayEndCard.tsx:216-238` — `diff > 0` → `bg-emerald-50 text-emerald-700 ring-emerald-200` fonu + **`TrendingUp`** (yüksəliş) ikonu.
- `src/features/day-end/components/DayEndCard.tsx:120-129` — bağlanmış gün xülasəsində `difference > 0` → `StatCard tone="green"`.
- `src/features/day-end/components/ClosingHistory.tsx:65-80` — tarixçə cədvəlində `d > 0` → `text-emerald-700`.

Müqayisə üçün: mənfi fərq qırmızı + `TrendingDown` ilə düzgün şəkildə problem kimi göstərilir. Yəni **iki simmetrik uçot xətasından biri problem, digəri uğur kimi rənglənib.**

### 1.6 Nisyə Borclarda ümumi rəqəmlərin çoxmənbəliliyi

**Qərar: Qismən (əsas ziddiyyət həll olunub, üç paralel mənbə hələ qalır)** → `F-18`

FE#63 ilə cədvəl üstündəki «Ümumi qalıq borc» StatCard-ı silinib və ümumi rəqəm yalnız KPI panelində saxlanılıb — bu, kod şərhində açıq sənədləşdirilib: `src/features/customers/components/OpenDebtsView.tsx:18-29`. Amma eyni səhifədə hələ də **üç fərqli hesablama** görünə bilər:

1. `src/features/customers/components/DebtsKpiCards.tsx:112` — «Ümumi qalıq» = `useDebtsKpi().totalOutstanding` (server `/api/reports/debts-kpi`; mock qolu `src/features/reports/api.ts:300` — `Σ customers.remainingDebt`).
2. `src/features/customers/components/OpenDebtsView.tsx:55-58, 89-91` — «Görünən: N borc · X» = `Σ` **mənbə-üzrə açıq borc** sətirləri (`/api/customers/open-debts`, `src/features/customers/api.ts:396-399`).
3. `src/routes/_app.borclar.tsx:188-191, 571-585` — «Müştəri üzrə» rejimində «Görünən: N müştəri · X» = filtrlənmiş müştərilərin `remainingDebt` cəmi.

Hər üçü fərqli qaydayla toplanır və eyni ekranda yan-yana görünə bilər; yalnız 2 və 3 «Görünən:» prefiksi ilə fərqləndirilib, 1-də isə heç bir qeyd yoxdur.

### 1.7 Qismən ödənişli satışların jurnal/detal/qaimə ardıcıllığı

**Qərar: Təsdiqlənmədi (ardıcıl DEYİL)** → `F-13`

Eyni fakt (satışın bir hissəsi ödənilib, qalığı borcdur) dörd yerdə fərqli çərçivədə təqdim olunur:

| Yer | Fayl:sətir | Göstərilən |
|---|---|---|
| Jurnal cədvəli | `src/features/sales/components/SalesJournal.tsx:269-274` | yalnız **ödənilən** məbləğ («X ödənilib»), qalıq yoxdur |
| Jurnal mobil kart | `src/features/sales/components/SalesJournal.tsx:639-643` | eyni — yalnız ödənilən |
| Satış detal draweri | `src/features/sales/components/SaleDetailDrawer.tsx:259-264` + `355-382` | YEKUN altında «X ödənilib» **və** ayrıca narıncı blokda «Ödənilib» + «Bu satışdan borc» + «Cari ümumi qalıq borc» — **yalnız `customerId` varsa və `paymentType === "Nisyə"` isə** |
| Satış uğur ekranı | `src/features/sales/components/QuickSaleScreen.tsx:322-327` | yalnız **qalıq borc** («Qalıq borc: X — Nisyə Borclarda görünəcək») |

Əlavə: jurnalda ödəniş badge-i `s.paymentType`-dır (`SalesJournal.tsx:280-285`), qismən ödənişdə isə backend qaydası ilə tip həmişə «Nisyə»yə çevrilir (`src/features/sales/lib.ts:45-72`) — yəni nağd alınan hissə badge-də ümumiyyətlə görünmür. **Qaimə PDF-i backend tərəfindən yaradılır** (`src/features/sales/useInvoiceDownload.ts:10-12` — `GET /api/exports/sales/{id}/invoice.pdf`), ona görə onun məzmunu frontend-dən yoxlana bilməz; frontend yalnız endirmə düyməsini verir. Bu, sənəddə iddia edilməyən yeganə hissədir.

### 1.8 Mock rejim (`USE_MOCK`) vs real rejim görünüş fərqləri

**Qərar: Təsdiqləndi** → `F-09` (funksional düymələr), `F-29` (rol etiketi)

`USE_MOCK = !API_URL` (`src/lib/api-client.ts:17-20`). Görünüşə təsir edən fərqlər:

| Fərq | Fayl:sətir | Mock rejimdə | Real rejimdə |
|---|---|---|---|
| Excel import | `src/routes/_app.mallar.tsx:139-145` | düymə görünür, klik → info toast | 3 addımlı modal |
| Excel export | `src/routes/_app.mallar.tsx:157-161` | düymə görünür, klik → info toast | fayl endirilir |
| Barkod/QR çap | `src/routes/_app.mallar.tsx:149-155` | düymə görünür, klik → info toast | `LabelPrintModal` |
| Qaimə (PDF) | `src/features/sales/useInvoiceDownload.ts:21-24` | düymə görünür, klik → info toast | PDF endirilir |
| WhatsApp göndərmə | `src/features/sales/useInvoiceWhatsApp.ts:48-51` | düymə görünür, klik → info toast | `wa.me` linki açılır |
| Satış PDF hesabatı | `src/features/sales/components/SalesJournal.tsx:392-395` | düymə görünür, klik → info toast | PDF endirilir |
| **İstifadəçi rolu** | `src/features/auth/api.ts:32-42` | **həmişə `role: "sahib"`** | serverdən gələn rol |
| Login demo ipucları | `src/routes/login.tsx:122` | **gizlidir** (`DEV && !USE_MOCK`) | DEV-də görünür |
| Müştəri siyahısı zənginləşdirməsi | `src/features/customers/api.ts:376-394` | `totalPurchases`/`purchaseCount`/`lastPurchaseDate` client-də hesablanır | serverdən gəlir |
| Hesabatlar ödəniş datası | `src/features/reports/api.ts:401` | `payments` dolu | `payments: []` — «Son ödənişlər» boşalır |

**Ən ağır nəticə:** mock rejimdə rol həmişə `sahib` olduğu üçün **bütün icazə əsaslı UI vəziyyətləri demo-da heç vaxt görünmür** — `«Günü yalnız sahibkar bağlaya bilər»` bloku (`DayEndCard.tsx:194-199`), `«Ayarları yalnız sahibkar dəyişə bilər»` (`_app.ayarlar.tsx:93-97`), satıcıdan gizlədilən maaş tabı (`_app.iscilar.tsx:42-43`), `canWrite`/`canManage` ilə gizlədilən bütün düymələr. Demo-da öyrənilən ekran real mühitdə fərqli görünür.

---

## 2. Səhifə-səhifə tapıntılar

Hər tapıntı 9 tələb olunan sahə ilə verilib. **Etiket dəyişikliyi tələb edən tövsiyələr `E-xx` ilə «Etiket və mətn dəyişiklikləri» cədvəlinə istinad edir** — cədvəldən kənar yeni etiket mətni bu sənəddə təklif olunmur.

---

### 2.1 Ana səhifə / Dashboard — `src/routes/_app.index.tsx`

Yoxlanılan: `SignatureBand`, 10 `StatCard`, 2 recharts qrafiki, 5 `Card` bloku, yükləmə/boş/xəta vəziyyətləri, mobil grid, sidebar ilə əlaqə.

#### F-01 — «Kassada olmalı» iki müstəqil mənbədən hesablanır və eyni gündə fərqlənə bilər

| Sahə | Məzmun |
|---|---|
| Səhifə | Dashboard + Sidebar (bütün səhifələrdə görünür) + Gün Sonu |
| Komponent | `AppLayout` sidebar alt bloku, `SignatureBand`, `DayEndCard` |
| Hazırkı problem | Sidebar/Dashboard `stats.expectedCash` (real rejimdə `/api/reports/dashboard`), Gün Sonu isə `/api/reports/summary?period=today` + client-side `expectedCash()` istifadə edir. Açılış kassası da fərqli seçilir (dashboard mock qolu: bütün bağlanışların sonuncusu; gün sonu: yalnız bugündən əvvəlkilər). Maaş ödənişləri Dashboard/CloseDay hesabına daxildir, gün sonu önizləməsinə isə DAXİL DEYİL (`DayEndCard.tsx:50-62`) |
| İstifadəçiyə təsiri | Mağaza sahibi eyni etiketli iki rəqəm görür və hansına inanacağını bilmir; gün sonunda kassa fərqi süni şəkildə yaranır və işçiyə əsassız şübhə düşə bilər |
| Ciddilik | **Kritik** |
| Tövsiyə olunan həll | Hər iki yerdə rəqəmin altında mənbə/əhatə izahı (`SignatureBand`-dakı «Başlanğıc + nağd satış − xərc» sətri kimi) göstərilsin; etiketlər `E-01` və `E-02` ilə fərqləndirilsin; Gün Sonu kartında maaş ödənişlərinin daxil olmadığını bildirən statik qeyd sətri əlavə olunsun. Hesablama düsturuna və endpoint seçiminə TOXUNULMUR |
| Toxunulacaq fayllar | `src/routes/_app.tsx`, `src/features/day-end/components/DayEndCard.tsx`, `src/features/reports/components/SignatureBand.tsx` |
| Biznes məntiqi riski | **Yoxdur** — yalnız etiket və izah sətri əlavə olunur; `expectedCash` düsturu, `useSummary`/`useDashboardStats` sorğuları və `closeDay` payload-u dəyişmir |
| İmplementasiya zəhməti | S |

#### F-03 — Dashboard və Hesabatlar sorğu xətasında sonsuz spinner göstərir

| Sahə | Məzmun |
|---|---|
| Səhifə | Dashboard, Hesabatlar |
| Komponent | `DashboardPage`, `HesabatlarPage`, `Spinner` |
| Hazırkı problem | `src/routes/_app.index.tsx:37-44` → `if (isLoading \|\| !d) return <Spinner/>`. Sorğu **xəta ilə** bitəndə `isLoading === false`, `d === undefined` olur → şərt yenə doğrudur və ekranda **əbədi fırlanan spinner** qalır. `isError` budağı ümumiyyətlə yoxdur. Eyni naxış: `src/routes/_app.hesabatlar.tsx:118-125` (`isLoading \|\| !view`) |
| İstifadəçiyə təsiri | İnternet kəsiləndə və ya backend cavab verməyəndə iki əsas ekran «yüklənir» vəziyyətində donur; istifadəçi nə baş verdiyini bilmir, «yenidən cəhd» yolu yoxdur, səhifəni əl ilə yeniləməkdən başqa çıxış qalmır |
| Ciddilik | **Kritik** |
| Tövsiyə olunan həll | Hər iki səhifədə `isError` budağı əlavə edilsin — `Xərclər` səhifəsindəki mövcud naxış (`src/routes/_app.xercler.tsx:164-167`) və `KpiCard`-ın `isError`+`onRetry` naxışı (`src/components/ui/KpiCard.tsx:45-58`) təkrar istifadə olunsun; `refetch()` ilə «Yenidən» düyməsi verilsin |
| Toxunulacaq fayllar | `src/routes/_app.index.tsx`, `src/routes/_app.hesabatlar.tsx` |
| Biznes məntiqi riski | **Yoxdur** — `useQuery` çağırışları və hesablamalar toxunulmur, yalnız render budağı əlavə olunur |
| İmplementasiya zəhməti | S |

#### F-04 — KPI/StatCard rəqəmləri kartdan daşır (`whitespace-nowrap`, overflow idarəsi yoxdur)

| Sahə | Məzmun |
|---|---|
| Səhifə | Dashboard, Mallar, Satış, Nisyə Borclar, Hesabatlar, Mal detalı, Gün Sonu |
| Komponent | `StatCard`, `KpiCard`, `StatCluster`, `DebtsKpiCards` daxili panelləri |
| Hazırkı problem | `src/components/ui/StatCard.tsx:40-47` və `src/components/ui/KpiCard.tsx:66-73, 143-152` dəyəri `whitespace-nowrap` ilə verir, lakin `truncate`/`overflow-hidden`/`min-w-0` yoxdur. Dashboard-da 10 kart 375px-də `grid-cols-2` ilə ≈163px enə düşür (`_app.index.tsx:59`); `fmtMoney` 2 onluq + «₼» əlavə edir (`src/lib/format.ts:10-17`) |
| İstifadəçiyə təsiri | Böyük məbləğlərdə rəqəm kartın kənarından çıxır və qonşu kartın üstünə düşür; istifadəçi rəqəmi tam oxuya bilmir və ya səhv oxuyur — pul rəqəminin yarısını görmək yanlış qərara aparır |
| Ciddilik | **Yüksək** |
| Tövsiyə olunan həll | Dəyər konteynerinə `min-w-0` + `overflow-hidden`, dəyər elementinə isə `truncate` (və ya `text-[clamp(...)]` ilə mütənasib kiçilmə) əlavə olunsun; tam dəyər `title` atributunda saxlanılsın ki, kəsilmiş rəqəm hover/uzun basmada görünsün. `fmtMoney` çıxışı DƏYİŞMİR |
| Toxunulacaq fayllar | `src/components/ui/StatCard.tsx`, `src/components/ui/KpiCard.tsx`, `src/features/customers/components/DebtsKpiCards.tsx` |
| Biznes məntiqi riski | **Yoxdur** — yalnız CSS sinifləri; formatlaşdırma funksiyaları və dəyər mənbələri toxunulmur |
| İmplementasiya zəhməti | S |

#### F-05 — Dashboard-da KPI kompozisiya dili tətbiq olunmayıb; ekran informasiya ilə yüklənib

| Sahə | Məzmun |
|---|---|
| Səhifə | Dashboard |
| Komponent | `StatCard` ×10, `SignatureBand`, `Card` ×5 |
| Hazırkı problem | FE#61 ilə gətirilən KPI dili (`StatCluster` — bir panel içində əlaqəli rəqəmlər, `KpiCard` — tək ulduz rəqəm, `AlertPill` — kliklənə bilən xəbərdarlıq) Mallar (`ProductsKpiCards`), Satış (`SalesKpiCards`) və Nisyə Borclar (`DebtsKpiCards`) səhifələrinə tətbiq olunub, **Dashboard-a isə YOX**. Dashboard hələ də 10 bərabər çəkili `StatCard` göstərir (`_app.index.tsx:59-80`); üstəlik ekranda əlavə 2 qrafik + 5 kart var — bir ekranda ≈20 informasiya bloku |
| İstifadəçiyə təsiri | Rəqəmsal savadı aşağı istifadəçi üçün iyerarxiya yoxdur: «bugün nə vacibdir?» sualına cavab görünmür; bütün rəqəmlər eyni ölçüdə qışqırır və gözü ekranda dolandırır |
| Ciddilik | Orta |
| Tövsiyə olunan həll | Dashboard KPI sırası `StatCluster` + `KpiCard` + `AlertPill` ilə yenidən qruplaşdırılsın: (a) real pul (`SignatureBand` saxlanılır), (b) bugünkü satış/qazanc/xərc bir `StatCluster`-də, (c) ödəniş bölgüsü ayrı `StatCluster`-də, (d) anbar/borc sahələri ikinci sıraya. Kart SAYI və göstərilən sahələr eyni qalır — yalnız qruplaşma və vizual çəki dəyişir |
| Toxunulacaq fayllar | `src/routes/_app.index.tsx` |
| Biznes məntiqi riski | **Yoxdur** — `useDashboardStats()` sahələri və dəyərləri olduğu kimi göstərilir, yalnız yerləşdirmə dəyişir |
| İmplementasiya zəhməti | M |

#### F-06 — Eyni rəqəm ekranda iki fərqli adla görünür («Bugünkü qazanc» / «Kağız üzərində qazanc»)

| Sahə | Məzmun |
|---|---|
| Səhifə | Dashboard |
| Komponent | `SignatureBand`, `StatCard` |
| Hazırkı problem | `src/features/reports/queries.ts:128` — `paperProfit: todayProfit`, yəni tam eyni ədəd. `SignatureBand` onu «Kağız üzərində qazanc (bu gün)» adı ilə (`src/features/reports/components/SignatureBand.tsx:37-42`), 30 piksel aşağıda isə `StatCard` «Bugünkü qazanc» adı ilə (`_app.index.tsx:61-71`) göstərir |
| İstifadəçiyə təsiri | İstifadəçi iki fərqli göstərici olduğunu düşünür və onları müqayisə etməyə çalışır; eyni olduqlarını görəndə isə hansının «doğru» olduğuna şübhə edir |
| Ciddilik | Orta |
| Tövsiyə olunan həll | Bir ad seçilsin, ikinci yer eyni adı təkrarlasın (etiket `E-06`); `StatCard`-ın `sub` sahəsində nisyə payı barədə qısa qeyd verilsin (məlumat artıq `d.todayCredit`-dədir) |
| Toxunulacaq fayllar | `src/routes/_app.index.tsx`, `src/features/reports/components/SignatureBand.tsx` |
| Biznes məntiqi riski | **Yoxdur** — `paperProfit`/`todayProfit` sahələrinin adı və hesablanması dəyişmir |
| İmplementasiya zəhməti | S |

---

### 2.2 Mallar / Anbar — `src/routes/_app.mallar.tsx` və `src/routes/_app.mallar_.$id.tsx`

Yoxlanılan: `PeriodFilter`, `ProductsKpiCards`, `ProductFilters` (`FilterBar`), `ProductsTable` (mobil kartlı), `ProductForm` (Drawer), `StockAdjustModal`, `LabelPrintModal`, `ExcelImportModal`, mal detalı səhifəsi.

#### F-07 — «Qazanc %» maya üzərindən əlavədir, izah yoxdur; format 3 yerdə fərqlidir

| Sahə | Məzmun |
|---|---|
| Səhifə | Mallar (cədvəl), Mal detalı, Mal forması |
| Komponent | `ProductsTable`, `ProductForm` footer `ResultCell`, `StatCard` (mal detalı) |
| Hazırkı problem | `src/features/products/lib.ts:56-58` — düstur mayaya görə əlavəni (markup) verir. `ProductsTable.tsx:214` başlığında `title` tooltip-i belə yoxdur (halbuki qonşu sütunlarda var — `SalesJournal.tsx:209, 220, 230, 238, 261`). Format: `1 onluq + boşluq` / `0 onluq, boşluqsuz` / `1 onluq + boşluq` |
| İstifadəçiyə təsiri | Satıcı 50%-i «satışın yarısı qazancdır» kimi başa düşür, halbuki maya 100-dürsə satış 150-dir və satış üzrə pay 33%-dir. Qiymət qoyarkən sistematik səhv qərar riski |
| Ciddilik | **Yüksək** |
| Tövsiyə olunan həll | Etiket `E-04` ilə dəqiqləşdirilsin; üç yerdə eyni format (1 onluq, boşluqsuz) tətbiq edilsin; cədvəl başlığına digər pul sütunlarındakı kimi `title` izahı əlavə olunsun. `profitPercent` düsturu TOXUNULMUR |
| Toxunulacaq fayllar | `src/features/products/components/ProductsTable.tsx`, `src/features/products/components/ProductForm.tsx`, `src/routes/_app.mallar_.$id.tsx` |
| Biznes məntiqi riski | **Yoxdur** — hesablama `src/features/products/lib.ts`-də qalır, yalnız təqdimat dəyişir |
| İmplementasiya zəhməti | S |

#### F-08 — Mallar səhifəsində `PeriodFilter` cədvələ təsir etmir, yalnız KPI-a

| Sahə | Məzmun |
|---|---|
| Səhifə | Mallar / Anbar |
| Komponent | `PeriodFilter`, `ProductsKpiCards`, `ProductsTable` |
| Hazırkı problem | `src/routes/_app.mallar.tsx:220-233` — `PeriodFilter` səhifənin ən üstündə, `ProductsKpiCards`-dan ƏVVƏL yerləşir və vizual olaraq bütün səhifəyə aid görünür. Amma `filtered` (`:91-104`) `range`-i ümumiyyətlə istifadə etmir — dövr yalnız `useProductsKpi(range)` sorğusuna gedir və orada da yalnız `soldUnits`/`purchasedUnits` sahələrini dəyişir (`src/features/reports/api.ts:181-183`) |
| İstifadəçiyə təsiri | İstifadəçi «Bu gün» seçib cədvəlin filtrlənməsini gözləyir, cədvəl isə dəyişmir → filtrin işləmədiyini düşünür və ya cədvəldəki bütün malların bu gün satıldığını zənn edir |
| Ciddilik | Orta |
| Tövsiyə olunan həll | `Nisyə Borclar` səhifəsindəki mövcud həll təkrarlansın (`src/routes/_app.borclar.tsx:309-322`): `PeriodFilter` və dövrdən asılı olan «Bu dövrdə…» sətri **eyni konteynerdə**, «Dövr:» etiketi ilə birlikdə göstərilsin; cədvəl və snapshot KPI-lar bu konteynerdən kənarda qalsın |
| Toxunulacaq fayllar | `src/routes/_app.mallar.tsx`, `src/features/products/components/ProductsKpiCards.tsx` |
| Biznes məntiqi riski | **Yoxdur** — `filtered` məntiqi və `useProductsKpi` sorğusu dəyişmir, yalnız düzülüş qruplaşdırılır |
| İmplementasiya zəhməti | S |

#### F-09 — Mock rejimdə işləməyən funksiyalar tam aktiv düymə kimi görünür

| Sahə | Məzmun |
|---|---|
| Səhifə | Mallar (Excel import/export, Barkod/QR çap), Satış (Qaimə PDF, WhatsApp, PDF hesabat) |
| Komponent | `PageHead` actions, `SalesJournal` sətir düymələri, `SaleDetailDrawer` footer, `QuickSaleScreen` uğur ekranı |
| Hazırkı problem | `src/routes/_app.mallar.tsx:135-170`, `src/features/sales/useInvoiceDownload.ts:21-24`, `src/features/sales/useInvoiceWhatsApp.ts:48-51`, `src/features/sales/components/SalesJournal.tsx:392-395` — düymələr normal (aktiv) görünüşdədir, yalnız kliklədikdən sonra info toast çıxır. `USE_MOCK` vəziyyəti ekranda heç bir yerdə bildirilmir |
| İstifadəçiyə təsiri | Demo/oflayn rejimdə istifadəçi 6 fərqli düyməni sınayır və hər dəfə «işləmir» cavabı alır → sistemin nasaz olduğunu düşünür. Toast 3 saniyəyə itir (`src/components/ui/toast-store.ts:23`), səbəb yadda qalmır |
| Ciddilik | **Yüksək** |
| Tövsiyə olunan həll | `USE_MOCK` rejimində bu düymələr `aria-disabled` + `title` səbəbi ilə görünsün (mövcud naxış: `SaleDetailDrawer.tsx:130-149` WhatsApp düyməsi) və ya səhifə başında bir dəfəlik «demo rejimi» zolağı göstərilsin; toast mətni `E-21` ilə dəqiqləşdirilsin |
| Toxunulacaq fayllar | `src/routes/_app.mallar.tsx`, `src/features/sales/useInvoiceDownload.ts`, `src/features/sales/useInvoiceWhatsApp.ts`, `src/features/sales/components/SalesJournal.tsx` |
| Biznes məntiqi riski | **Yoxdur** — `USE_MOCK` şərtləri və endpoint yolları dəyişmir, yalnız düymənin vizual vəziyyəti və izahı əlavə olunur |
| İmplementasiya zəhməti | M |

#### F-10 — Mal detalında sorğu xətası ilə «mal silinib» eyni ekranı verir

| Sahə | Məzmun |
|---|---|
| Səhifə | Mal detalı (`/mallar/$id`) |
| Komponent | `EmptyState` |
| Hazırkı problem | `src/routes/_app.mallar_.$id.tsx:94-119` — `isLoading` keçəndən sonra `!product` olarsa həmişə «Mal tapılmadı · Bu mal silinmiş və ya mövcud deyil» göstərilir. Sorğu xətası (`isError`) ayrıca yoxlanılmır, ona görə şəbəkə problemi «mal silinib» kimi təqdim olunur |
| İstifadəçiyə təsiri | İstifadəçi malın silindiyini düşünüb yenidən yaratmağa cəhd edə bilər — bu, real anbar məlumatını təkrarlayan qeydə gətirib çıxarır |
| Ciddilik | Aşağı |
| Tövsiyə olunan həll | `isError` halı ayrılsın və `Xərclər` səhifəsindəki xəta zolağı naxışı (`_app.xercler.tsx:164-167`) təkrar istifadə olunsun; boş vəziyyət yalnız sorğu uğurlu olub nəticə boş olduqda göstərilsin |
| Toxunulacaq fayllar | `src/routes/_app.mallar_.$id.tsx` |
| Biznes məntiqi riski | **Yoxdur** — məhsul axtarışı və route parametri dəyişmir |
| İmplementasiya zəhməti | S |

---

### 2.3 Satış — `src/routes/_app.satis.tsx` (kassa + jurnal + detal)

Yoxlanılan: `QuickSaleScreen` (mal seçimi, sərbəst satış, cəmi paneli), `PaymentConfirmModal`, `LossConfirmModal`, `SalesJournal` (`PeriodFilter` + `SalesKpiCards` + `FilterBar` + `DataTable` + mobil kart), `SaleDetailDrawer`, `SaleEditDrawer`, uğur ekranı, barkod/klaviatura davranışı.

#### F-11 — Barkod skaneri üçün `Enter` idarəsi və avtomatik seçim yoxdur

| Sahə | Məzmun |
|---|---|
| Səhifə | Satış (kassa) |
| Komponent | `QuickSaleScreen` axtarış inputu |
| Hazırkı problem | `src/features/sales/components/QuickSaleScreen.tsx:423-430` — inputda yalnız `onChange` var; `onKeyDown`/`Enter` idarəsi yoxdur. `searchProducts` (`:290-298`) barkodu **da** axtarır, amma nəticə həmişə kart şəbəkəsi kimi göstərilir və istifadəçi kartı **əlavə olaraq toxunmalıdır**. Müqayisə: topbar-dakı qlobal axtarışda `Enter` idarə olunur (`src/routes/_app.tsx:246`) |
| İstifadəçiyə təsiri | Barkod skaneri adətən barkodu yazıb `Enter` göndərir. Hazırda `Enter` heç nə etmir → hər skandan sonra əl ilə ekrana toxunmaq lazımdır. Sürətli kassa axınında hər satışa 1 əlavə hərəkət və göz təması əlavə olunur |
| Ciddilik | **Yüksək** |
| Tövsiyə olunan həll | Axtarış inputuna `onKeyDown` əlavə olunsun: `Enter` basıldıqda süzülmüş nəticə **tam olaraq 1 mal** olduqda o mal `selectProduct` ilə seçilsin (mövcud funksiya, `:248-258`), əks halda heç nə etməsin. Barkod üzrə tam uyğunluq varsa nəticə sayından asılı olmayaraq həmin mal seçilsin. Yeni endpoint/kitabxana ƏLAVƏ OLUNMUR |
| Toxunulacaq fayllar | `src/features/sales/components/QuickSaleScreen.tsx` |
| Biznes məntiqi riski | **Yoxdur** — `selectProduct` və `createSale` payload-u dəyişmir; yalnız mövcud seçim funksiyası klaviatura ilə də çağırılır |
| İmplementasiya zəhməti | S |

#### F-12 — Bir satış ən azı 5 toxunuş tələb edir; ən çox yayılan hal defolt deyil

| Sahə | Məzmun |
|---|---|
| Səhifə | Satış (kassa) |
| Komponent | `QuickSaleScreen`, `TotalContent`, `PaymentConfirmModal` |
| Hazırkı problem | Katalog malının nağd, tam ödənişli satışı: (1) mal kartına toxun → (2) «SATIŞI TAMAMLA» (`QuickSaleScreen.tsx:895-902`) → (3) «Tam ödədi» (`PaymentConfirmModal.tsx:189-205`) → (4) «Nağd» (`ViaToggle`, `:350-364`) → (5) «Təsdiqlə» (`:298-308`). Modal hər açılışda bütün seçimləri sıfırlayır (`:98-104`), yəni ardıcıl 50 nağd satışda eyni 2 seçim 100 dəfə təkrarlanır |
| İstifadəçiyə təsiri | Bazar mühitində növbə uzananda kassa tempi düşür; təkrarlanan mexaniki toxunuşlar yorucu olur və səhv toxunma riskini artırır |
| Ciddilik | **Yüksək** |
| Tövsiyə olunan həll | `choice`/`via` üçün **sonuncu istifadə edilmiş seçim** modal açılanda ilkin dəyər kimi qoyulsun (zustand store, `drawer-store.ts` naxışı ilə) — istifadəçi yenə də dəyişə bilər, sadəcə ən çox yayılan hal hazır gəlir; modalda `Enter` təsdiqi bütün hallarda işləsin (hazırda yalnız qismən ödəniş inputunda var, `:226-231`). Backend payload-u və validasiya qaydaları eyni qalır |
| Toxunulacaq fayllar | `src/features/sales/components/PaymentConfirmModal.tsx`, `src/features/sales/components/QuickSaleScreen.tsx` |
| Biznes məntiqi riski | **Var (aşağı)** — defolt seçim istifadəçinin diqqətsiz təsdiqi ilə yanlış ödəniş növü yaza bilər. Azaldıcı tədbir: defolt yalnız `via` üçün tətbiq edilsin, `choice` («Tam/Qismən/Ödəmədi») həmişə boş qalsın — belədə pul məbləği ilə bağlı qərar həmişə şüurlu olur |
| İmplementasiya zəhməti | M |

#### F-13 — Qismən ödənişli satış 4 yerdə 4 fərqli çərçivədə göstərilir

| Sahə | Məzmun |
|---|---|
| Səhifə | Satış (jurnal, mobil kart, detal draweri, uğur ekranı) |
| Komponent | `SalesJournal`, `SaleDetailDrawer`, `QuickSaleScreen` uğur ekranı |
| Hazırkı problem | Bax bölmə 1.7 cədvəli. Jurnalda yalnız «ödənilib», uğur ekranında yalnız «qalıq borc», detal draweri isə ikisini iki ayrı blokda göstərir və qalıq bloku yalnız `customerId` + `paymentType === "Nisyə"` şərti ilə render olunur (`SaleDetailDrawer.tsx:330, 355`) |
| İstifadəçiyə təsiri | İstifadəçi eyni satışı jurnalda və detalda müqayisə edərkən fərqli rəqəm görür və hansının borc, hansının alınan pul olduğunu ayırd edə bilmir; nisyə borcun izlənməsi çətinləşir |
| Ciddilik | **Yüksək** |
| Tövsiyə olunan həll | Hər üç yerdə eyni cüt təqdim olunsun («ödənilib» + «qalıq»), etiket `E-10` ilə vahidləşdirilsin; jurnal badge-inin yanında qismən ödənişi bildirən kiçik nişan (mövcud `Badge` komponentinin ikinci nüsxəsi) göstərilsin. `paidAmount`/`remainingAmount` sahələri və `resolveSalePaymentPlan` məntiqi TOXUNULMUR |
| Toxunulacaq fayllar | `src/features/sales/components/SalesJournal.tsx`, `src/features/sales/components/SaleDetailDrawer.tsx`, `src/features/sales/components/QuickSaleScreen.tsx` |
| Biznes məntiqi riski | **Yoxdur** — göstərilən sahələr artıq mövcuddur (`Sale.paidAmount`, `Sale.remainingAmount`); yeni hesablama aparılmır |
| İmplementasiya zəhməti | M |

#### F-14 — Kassa ekranı boş axtarışda tam satış jurnalını (KPI + filtrlər + cədvəl) göstərir

| Sahə | Məzmun |
|---|---|
| Səhifə | Satış |
| Komponent | `QuickSaleScreen` → `SalesJournal` |
| Hazırkı problem | `src/features/sales/components/QuickSaleScreen.tsx:511-514` — axtarış boş olanda birbaşa `<SalesJournal />` render olunur. `SalesJournal` isə `PeriodFilter` + 7 KPI sahəsi + 5 filtrli `FilterBar` + PDF düyməsi + 10 sütunlu cədvəl gətirir (`SalesJournal.tsx:434-611`). Yəni satış ekranının **defolt görünüşü** analitik hesabat ekranıdır |
| İstifadəçiyə təsiri | Satıcı satış etmək üçün girdiyi ekranda əvvəlcə hesabat divarı görür; rəqəmsal savadı aşağı istifadəçi üçün əsas hərəkət (axtar → sat) informasiya içində itir |
| Ciddilik | Orta |
| Tövsiyə olunan həll | Boş axtarışda jurnal **yığcam** başlasın: KPI sırası və filtr paneli defolt bağlı (mövcud `FilterBar` artıq `activeCount > 0` şərtinə görə açılır — `FilterBar.tsx:57`), yalnız son N satış sətri göstərilsin, «Bütün jurnalı aç» keçidi ilə tam görünüşə keçilsin. Jurnalın özü və sorğuları dəyişmir |
| Toxunulacaq fayllar | `src/features/sales/components/QuickSaleScreen.tsx`, `src/features/sales/components/SalesJournal.tsx` |
| Biznes məntiqi riski | **Yoxdur** — `useSalesJournal` parametrləri və URL search sxemi (`_app.satis.tsx:11-21`) dəyişmir |
| İmplementasiya zəhməti | M |

#### F-15 — Uğur ekranı 5 saniyəyə xəbərdarlıqsız bağlanır

| Sahə | Məzmun |
|---|---|
| Səhifə | Satış (uğur ekranı) |
| Komponent | `QuickSaleScreen` success bloku |
| Hazırkı problem | `src/features/sales/components/QuickSaleScreen.tsx:109-114` — `setTimeout(closeSuccess, 5000)`. Ekranda yalnız mətn var: «Bir neçə saniyəyə avtomatik satış səhifəsinə qayıdılacaq» (`:392-396`) — nə qədər qaldığı görünmür, dayandırma yalnız qaimə/WhatsApp düyməsinə basmaqla mümkündür (`holdSuccess`) |
| İstifadəçiyə təsiri | İstifadəçi qalıq borc xəbərdarlığını (`:322-327`) və məbləği oxuyub qurtarmamış ekran itir; xüsusən yavaş oxuyan istifadəçi üçün mühüm məlumat gözdən qaçır |
| Ciddilik | Orta |
| Tövsiyə olunan həll | Görünən geri sayım göstəricisi (incə proqres zolağı — `SalaryCard.tsx:166-171`-dəki mövcud zolaq naxışı) əlavə olunsun; ekranın istənilən yerinə toxunma/klaviatura hərəkəti sayımı dayandırsın; qalıq borc olan satışlarda avtomatik bağlanma ümumiyyətlə tətbiq edilməsin |
| Toxunulacaq fayllar | `src/features/sales/components/QuickSaleScreen.tsx` |
| Biznes məntiqi riski | **Yoxdur** — satış artıq yaradılıb; ekran yalnız təsdiq göstəricisidir |
| İmplementasiya zəhməti | S |

---

### 2.4 Müştərilər — `src/routes/_app.musteriler.tsx`

Yoxlanılan: axtarış naxışı, «yalnız borclular» filtri, `CustomersTable` (`variant="all"`), `CustomerDrawer`, `PaymentModal`, `NewCustomerModal`, `EditCustomerModal`, boş/xəta vəziyyətləri.

#### F-16 — Səhifədə ayrıca (dördüncü) axtarış naxışı var; KPI və dövr dili tətbiq olunmayıb

| Sahə | Məzmun |
|---|---|
| Səhifə | Müştərilər |
| Komponent | Xam `<input>` + `inputCls`, `<label><input type=checkbox>` |
| Hazırkı problem | `src/routes/_app.musteriler.tsx:118-159` — səhifə nə `FilterBar`, nə `PeriodFilter`, nə də KPI komponentlərindən istifadə edir; axtarış xam input (`inputCls` + `pl-8`), filtr isə çərçivəli checkbox etiketidir. Ümumi rəqəmlər yalnız `subtitle` mətnindədir (`:81`) |
| İstifadəçiyə təsiri | İstifadəçi Mallar/Satış/Borclar səhifələrində öyrəndiyi «axtarış + Filterlər düyməsi + çiplər» naxışını burada tapmır; «Ümumi alış» rəqəmi başlıq mətninin içində itir və gözə çarpmır |
| Ciddilik | Orta |
| Tövsiyə olunan həll | `FilterBar` tətbiq edilsin («yalnız borclular» panel içindəki filtr kimi, aktiv olduqda çip göstərilsin); `subtitle`-dakı iki rəqəm `StatCluster`-ə köçürülsün. Filtrləmə məntiqi (`filtered`, `:60-74`) və URL search sxemi eyni qalır |
| Toxunulacaq fayllar | `src/routes/_app.musteriler.tsx` |
| Biznes məntiqi riski | **Yoxdur** — süzgəc şərtləri və `useCustomers()` sorğusu toxunulmur |
| İmplementasiya zəhməti | M |

#### F-17 — `CustomersTable` mobil kartı natamamdır və sıfır borcu desktop-dan fərqli göstərir

| Sahə | Məzmun |
|---|---|
| Səhifə | Müştərilər, Nisyə Borclar («Müştəri üzrə» rejimi) |
| Komponent | `CustomersTable` |
| Hazırkı problem | `src/features/customers/components/CustomersTable.tsx:249-329` — mobil kart `variant`-dan asılı deyil: `variant="all"` üçün olan «Ümumi alış», «Alış sayı», «Son alış» sütunları (`:165-190`) mobil kartda ÜMUMİYYƏTLƏ yoxdur. Həmçinin desktop-da `remainingDebt <= 0` üçün boz «—» göstərilir (`:153-156`), mobil kartda isə yaşıl «0.00 ₼» (`:271-277`) |
| İstifadəçiyə təsiri | Telefonla işləyən istifadəçi müştərinin alış tarixçəsini ümumiyyətlə görmür — eyni səhifə iki cihazda fərqli məlumat verir. «0.00 ₼» yaşıl rəqəm isə «bu müştəri sıfır alıb» kimi də oxuna bilər |
| Ciddilik | Orta |
| Tövsiyə olunan həll | `mobileCard` `variant` propuna reaksiya versin və `variant="all"`-da alış sütunlarını göstərsin; sıfır borc üçün hər iki görünüşdə mövcud `EmptyValue` komponenti (`src/components/ui/EmptyValue.tsx`) istifadə olunsun |
| Toxunulacaq fayllar | `src/features/customers/components/CustomersTable.tsx` |
| Biznes məntiqi riski | **Yoxdur** — `Customer` sahələri artıq mövcuddur, yeni sorğu yoxdur |
| İmplementasiya zəhməti | S |

---

### 2.5 Nisyə Borclar — `src/routes/_app.borclar.tsx` (2 görünüş)

Yoxlanılan: `DebtViewToggle` (Borclar / Müştəri üzrə), `PeriodFilter` + `DebtsPeriodLine`, `DebtsKpiCards`, `OpenDebtsView` + `OpenDebtsTable`, `CustomersTable`, `CustomerDrawer`, `PaymentModal`, filtr paneli.

#### F-18 — Ümumi borc rəqəmi hələ də üç fərqli mənbədən gələ bilər

| Sahə | Məzmun |
|---|---|
| Səhifə | Nisyə Borclar |
| Komponent | `DebtsKpiCards`, `OpenDebtsView`, `BorclarPage` alt cəm sətri |
| Hazırkı problem | Bax bölmə 1.6. FE#63 ilə ən kəskin ziddiyyət aradan qaldırılıb, lakin panel rəqəmi (müştəri-üzrə cəm), «Borclar» görünüşünün alt cəmi (mənbə-üzrə cəm) və «Müştəri üzrə» görünüşünün alt cəmi (filtrlənmiş müştəri cəmi) hələ də eyni ekranda görünə bilir. Yalnız sonuncu ikisi «Görünən:» prefiksi ilə fərqləndirilib |
| İstifadəçiyə təsiri | Görünüş rejimini dəyişəndə alt cəm dəyişir, üstdəki panel isə eyni qalır — istifadəçi bunu səhv/nasazlıq kimi qavraya bilər |
| Ciddilik | Orta |
| Tövsiyə olunan həll | `DebtsKpiCards`-dakı «Ümumi qalıq» dəyərinin altına mənbəni bildirən kiçik statik `sub` sətri əlavə olunsun (komponentdə artıq `sub` naxışı var — `KpiCard.tsx:74`); hər iki görünüşün alt sətri eyni sözlərlə yazılsın. Hesablama mənbələri DƏYİŞMİR |
| Toxunulacaq fayllar | `src/features/customers/components/DebtsKpiCards.tsx`, `src/features/customers/components/OpenDebtsView.tsx`, `src/routes/_app.borclar.tsx` |
| Biznes məntiqi riski | **Yoxdur** — `useDebtsKpi` / `useOpenDebts` / `useCustomers` sorğuları və cəm düsturları toxunulmur |
| İmplementasiya zəhməti | S |

#### F-19 — İki görünüş rejimi iki fərqli axtarış/filtr modeli işlədir; köhnə dövr filtri qalıb

| Sahə | Məzmun |
|---|---|
| Səhifə | Nisyə Borclar |
| Komponent | `DebtViewToggle`, `FilterBar`, xam axtarış inputu, «Son əməliyyat» tab qrupu |
| Hazırkı problem | `src/routes/_app.borclar.tsx:332-536` — `mode === "borclar"` olduqda sadə xam `<input>` (heç bir filtr paneli yoxdur), `mode === "musteri"` olduqda isə tam `FilterBar` (status, son əməliyyat, min/max qalıq, telefon, ilkin borclu). Üstəlik panel içindəki «Son əməliyyat» filtri **köhnə** `BasePeriod` sistemindən istifadə edir (`inPeriod`, `PERIOD_LABELS` — `src/features/reports/lib.ts`), halbuki səhifənin yuxarısında yeni paylaşılan `PeriodFilter` var → **eyni səhifədə iki fərqli dövr filtri konsepsiyası** |
| İstifadəçiyə təsiri | Görünüş dəyişəndə filtrlər «yox olur»; iki dövr seçimi arasında hansının nəyə təsir etdiyi aydın deyil |
| Ciddilik | Orta |
| Tövsiyə olunan həll | Hər iki rejimdə eyni `FilterBar` istifadə olunsun (borclar rejimində yalnız uyğun filtrlər göstərilsin); «Son əməliyyat» filtri `PeriodFilter` çipləri ilə eyni vizual dilə gətirilsin (mövcud `chipCls` naxışı) və ya adı ilə əhatəsi aydınlaşdırılsın. `search` sxemi və `filtered` məntiqi TOXUNULMUR |
| Toxunulacaq fayllar | `src/routes/_app.borclar.tsx` |
| Biznes məntiqi riski | **Yoxdur** — `inPeriod`, `lastActivityDate` və zod search sxemi eyni qalır |
| İmplementasiya zəhməti | M |

#### F-20 — WhatsApp üçün iki fərqli ikon istifadə olunur

| Sahə | Məzmun |
|---|---|
| Səhifə | Nisyə Borclar, Müştərilər, Satış |
| Komponent | `OpenDebtsTable`, `CustomersTable`, `SalesJournal`, `SaleDetailDrawer` |
| Hazırkı problem | `src/features/customers/components/OpenDebtsTable.tsx:3, 147, 233` və `src/features/customers/components/CustomersTable.tsx:3, 81, 307` — lucide `MessageCircle` (ümumi mesaj balonu) istifadə edir; `src/features/sales/components/SalesJournal.tsx:24, 127` və `SaleDetailDrawer.tsx:9, 154` isə real `WhatsAppIcon` (`src/components/ui/icons/WhatsAppIcon.tsx`) işlədir |
| İstifadəçiyə təsiri | Eyni əməliyyat üçün iki fərqli işarə — istifadəçi bunları ayrı funksiya sanır; ümumi balon ikonu «SMS» kimi də başa düşülə bilər |
| Ciddilik | Aşağı |
| Tövsiyə olunan həll | Bütün WhatsApp keçidlərində mövcud `WhatsAppIcon` istifadə olunsun |
| Toxunulacaq fayllar | `src/features/customers/components/OpenDebtsTable.tsx`, `src/features/customers/components/CustomersTable.tsx` |
| Biznes məntiqi riski | **Yoxdur** — `waLink()` və şablon (`whatsappTemplate`) toxunulmur |
| İmplementasiya zəhməti | S |

---

### 2.6 Təchizatçılar — `src/routes/_app.tedarukculer.tsx`

Yoxlanılan: `PageHead`, `SuppliersTable` (mobil kartlı), `SupplierDrawer`, `NewSupplierModal`, `EditSupplierModal`, `DebtModal`, `PayModal`.

#### F-21 — Səhifədə axtarış, filtr və KPI dili ümumiyyətlə yoxdur; ümumi borc başlıq mətnində itir

| Sahə | Məzmun |
|---|---|
| Səhifə | Təchizatçılar |
| Komponent | `PageHead`, `SuppliersTable` |
| Hazırkı problem | `src/routes/_app.tedarukculer.tsx:60-83` — səhifədə heç bir axtarış inputu, `FilterBar`, `PeriodFilter` və ya KPI komponenti yoxdur. Ümumi borc yalnız `subtitle` sətrində düz mətn kimi verilir (`:64`): «N təchizatçı · Mənim qalıq borcum: X». Cədvəl `DataTable`-ın daxili 10-luq səhifələməsi ilə göstərilir |
| İstifadəçiyə təsiri | Təchizatçı sayı artdıqca konkret təchizatçını tapmaq üçün səhifə-səhifə gəzmək lazım gəlir; ödəniləcək ümumi borc — sahibkarın ən vacib rəqəmlərindən biri — kiçik boz mətn içində itir |
| Ciddilik | Orta |
| Tövsiyə olunan həll | `FilterBar` (ad/telefon üzrə axtarış, borclu/borcsuz filtri) və ümumi borc üçün `KpiCard` və ya `StatCluster` əlavə olunsun — Nisyə Borclar səhifəsi ilə eyni kompozisiya |
| Toxunulacaq fayllar | `src/routes/_app.tedarukculer.tsx`, `src/features/suppliers/components/SuppliersTable.tsx` |
| Biznes məntiqi riski | **Yoxdur** — `useSuppliers()` və `remainingDebt` sahəsi olduğu kimi qalır; süzgəc client-side, mövcud `filtered` naxışı ilə |
| İmplementasiya zəhməti | M |

---

### 2.7 Xərclər — `src/routes/_app.xercler.tsx`

Yoxlanılan: `PeriodFilter`, `ExpenseFilters` (`FilterBar`), `ExpensesTable` (mobil kartlı), `ExpenseDetailDrawer`, `ExpenseForm`, xəta zolağı, alt cəm.

#### F-22 — Xərc məbləğinin işarə/rəng təqdimatı 7 yerdə vahid deyil

| Sahə | Məzmun |
|---|---|
| Səhifə | Xərclər, Dashboard, Gün Sonu, Hesabatlar |
| Komponent | `ExpensesTable`, `ExpenseDetailDrawer`, `ClosingHistory`, `DayEndCard`, `StatCard` |
| Hazırkı problem | Bax bölmə 1.4 cədvəli — eyni məlumat gah `−X ₼` qırmızı, gah `X ₼` qırmızı kimi verilir. Layihədə işarəli format üçün hazır helper var (`fmtMoneySigned`, `src/lib/format.ts:44-52`), lakin xərclərdə istifadə olunmur — bunun əvəzinə mətn içində əl ilə `−` yazılır |
| İstifadəçiyə təsiri | İstifadəçi «−123» ilə «123» arasında məna fərqi axtarır (bəlkə biri qaytarılıb?); rəqəmləri cəmləyərkən işarəni yanlış tətbiq edə bilər |
| Ciddilik | **Yüksək** |
| Tövsiyə olunan həll | Vahid qayda seçilsin (tövsiyə: cədvəl/siyahı sətirlərində və cəmlərdə **həmişə** mənfi işarə + qırmızı, tək başına xərc detalında isə işarəsiz + qırmızı + `sr-only` izah) və bütün 7 yerdə mövcud `fmtMoneySigned` helper-i ilə tətbiq edilsin |
| Toxunulacaq fayllar | `src/features/expenses/components/ExpensesTable.tsx`, `src/features/expenses/components/ExpenseDetailDrawer.tsx`, `src/routes/_app.xercler.tsx`, `src/routes/_app.index.tsx`, `src/features/day-end/components/ClosingHistory.tsx` |
| Biznes məntiqi riski | **Yoxdur** — `Expense.amount` işarəsi backend-də müsbət saxlanılır və dəyişmir; yalnız göstərilmə formatı vahidləşir |
| İmplementasiya zəhməti | S |

#### F-23 — «Cəmi (filtrlənmiş)» zolağı digər səhifələrdəki «Görünən: …» sətrindən fərqlidir

| Sahə | Məzmun |
|---|---|
| Səhifə | Xərclər (vs Nisyə Borclar, Müştərilər) |
| Komponent | Xərclər alt cəm bloku vs `OpenDebtsView` / `BorclarPage` alt sətirləri |
| Hazırkı problem | `src/routes/_app.xercler.tsx:187-196` — böyük çərçivəli zolaq: sol «Cəmi (filtrlənmiş):», sağ `text-lg` qırmızı rəqəm. `src/features/customers/components/OpenDebtsView.tsx:79-96` və `src/routes/_app.borclar.tsx:571-585` — çərçivəsiz, sağa yaslanmış `text-xs` boz sətir «Görünən: N · X (filtrə uyğun)» |
| İstifadəçiyə təsiri | Eyni funksiya (filtrlənmiş cəm) iki fərqli vizual çəkidə görünür; istifadəçi birində bunun vacib göstərici, digərində köməkçi qeyd olduğunu düşünür |
| Ciddilik | Aşağı |
| Tövsiyə olunan həll | Bir «filtrlənmiş cəm» naxışı seçilib paylaşılan kiçik komponentə çıxarılsın və hər üç yerdə istifadə olunsun; etiket `E-11` ilə vahidləşdirilsin |
| Toxunulacaq fayllar | `src/routes/_app.xercler.tsx`, `src/features/customers/components/OpenDebtsView.tsx`, `src/routes/_app.borclar.tsx`, `src/components/ui/` (yeni paylaşılan komponent) |
| Biznes məntiqi riski | **Yoxdur** — cəm hesablamaları (`filteredTotal`, `visibleTotal`, `filteredDebt`) öz yerlərində qalır |
| İmplementasiya zəhməti | S |

---

### 2.8 Gün Sonu — `src/routes/_app.gun-sonu.tsx`

Yoxlanılan: `DayEndCard` (bugünkü hesab, faktiki sayım, fərq bannerı, bağlanmış gün xülasəsi, icazə bloku), `ConfirmModal`, `ClosingHistory`.

#### F-02 — MÜSBƏT kassa fərqi uğur (yaşıl + yüksəliş ikonu) kimi göstərilir

| Sahə | Məzmun |
|---|---|
| Səhifə | Gün Sonu |
| Komponent | `DayEndCard` fərq bannerı, `StatCard` (bağlanmış gün), `ClosingHistory` «Fərq» sütunu |
| Hazırkı problem | Bax bölmə 1.5. `DayEndCard.tsx:216-238` — `diff > 0` → yaşıl fon + `TrendingUp`; `:120-129` — `tone="green"`; `ClosingHistory.tsx:73` — `text-emerald-700`. Halbuki müsbət fərq də uçot pozuntusudur (yazılmamış satış, artıq qoyulmuş pul, səhv açılış) |
| İstifadəçiyə təsiri | «Artıq pul» yaşıl uğur kimi göründüyü üçün araşdırılmır; yazılmamış satış və ya səhv açılış aylarla üzə çıxmır, anbar–kassa uyğunluğu pozulur. Bu, birbaşa maliyyə itkisi riskidir |
| Ciddilik | **Kritik** |
| Tövsiyə olunan həll | Sıfırdan fərqli **hər iki** istiqamət diqqət tonunda göstərilsin (məs. mənfi → qırmızı, müsbət → kəhrəba/amber + xəbərdarlıq ikonu; yalnız `diff === 0` yaşıl/uğur qalsın). Etiket `E-03` ilə dəqiqləşdirilsin. Eyni qayda `ClosingHistory` sütununa və bağlanmış gün xülasəsinə də tətbiq edilsin. `difference()` düsturu (`src/features/day-end/lib.ts:14-15`) və `closeDay` payload-u TOXUNULMUR |
| Toxunulacaq fayllar | `src/features/day-end/components/DayEndCard.tsx`, `src/features/day-end/components/ClosingHistory.tsx` |
| Biznes məntiqi riski | **Yoxdur** — yalnız rəng, ikon və mətn; hesablama, bağlama əməliyyatı və saxlanılan dəyərlər eyni qalır |
| İmplementasiya zəhməti | S |

#### F-24 — `ClosingHistory` mobil kart görünüşünə malik deyil; 7 sütun 375px-də üfüqi sürüşür

| Sahə | Məzmun |
|---|---|
| Səhifə | Gün Sonu |
| Komponent | `ClosingHistory` → `DataTable` |
| Hazırkı problem | `src/features/day-end/components/ClosingHistory.tsx:86-93` — `DataTable`-a `mobileCard` verilmir. `DataTable` `mobileCard` yoxdursa bütün ekran ölçülərində cədvəli göstərir (`src/components/ui/DataTable.tsx:135-142`), hüceyrələr isə `whitespace-nowrap`-dır (`:238`). 7 sütun (Tarix, Açılış, Nağd satış, Xərc, Gözlənilən, Faktiki, Fərq) 375px-də sağa doğru sürüşür. Eyni problem: `EmployeesTable`, `ExcelImportModal` önizləmə cədvəli |
| İstifadəçiyə təsiri | Telefonda bağlanış tarixçəsini oxumaq üçün üfüqi sürüşmək lazımdır; «Fərq» — ən vacib sütun — ən sağdadır və ilk baxışda görünmür |
| Ciddilik | Orta |
| Tövsiyə olunan həll | `mobileCard` əlavə olunsun (mövcud `ExpensesTable.tsx:189-245` naxışı ilə): tarix + fərq kartın başında, qalan 5 rəqəm alt sətirdə. «Xərc» sütunu `F-22` qaydasına salınsın |
| Toxunulacaq fayllar | `src/features/day-end/components/ClosingHistory.tsx` |
| Biznes məntiqi riski | **Yoxdur** — `useClosings()` və `Closing` sahələri dəyişmir |
| İmplementasiya zəhməti | S |

#### F-25 — «Başlanğıc kassa» sahəsi dizayn sistemindən kənar, etiketsiz xam inputdur

| Sahə | Məzmun |
|---|---|
| Səhifə | Gün Sonu |
| Komponent | `DayEndCard` → `Row` daxilindəki `<input type="number">` |
| Hazırkı problem | `src/features/day-end/components/DayEndCard.tsx:154-164` — `w-28` enində, `h` təyin edilməmiş, `rounded-lg`, `text-sm` xam input. Dizayn sistemi `Input` (`h-12`, `rounded-xl`, `focus:ring-4`) və `Field` istifadə olunmur; `aria-label` yoxdur — ekran oxuyucusu üçün sahə adsızdır. Sətrin sol tərəfindəki «Başlanğıc kassa» mətni `<span>`-dır, `<label>` deyil, yəni proqram təminatı baxımından inputla bağlı deyil |
| İstifadəçiyə təsiri | Redaktə oluna bilən sahə oxunan sətir kimi görünür — istifadəçi onu dəyişə biləcəyini başa düşmür; halbuki bu rəqəm bütün gün sonu hesabına təsir edir. Klaviatura və ekran oxuyucusu istifadəçiləri üçün sahə tanınmır |
| Ciddilik | Orta |
| Tövsiyə olunan həll | Sahə `Field` + `Input` ilə əvəz olunsun və ya ən azı `aria-label`, `h-12`, `inputMode="decimal"` və görünən redaktə nişanı əlavə edilsin (mövcud naxış: `SalaryCard.tsx:125-143` — redaktə oluna bilən rəqəm + karandaş) |
| Toxunulacaq fayllar | `src/features/day-end/components/DayEndCard.tsx` |
| Biznes məntiqi riski | **Yoxdur** — `openingCash` state-i, `defaultOpening` məntiqi və `closeDay` payload-u dəyişmir |
| İmplementasiya zəhməti | S |

---

### 2.9 Hesabatlar — `src/routes/_app.hesabatlar.tsx`

Yoxlanılan: dövr tab-ları, 6 `StatCard`, 8 recharts bloku (`DailyBarChart`, `TrendLineChart`, `ExpensePie`, `TopProductsBar`, `PaymentBreakdown`), donmuş mallar qruplaşması, ziyana satılan mallar.

#### F-26 — Hesabatlar hələ də köhnə `period` tab filtrini işlədir; paylaşılan `PeriodFilter` tətbiq olunmayıb

| Sahə | Məzmun |
|---|---|
| Səhifə | Hesabatlar |
| Komponent | `PageHead` actions içindəki tab qrupu |
| Hazırkı problem | `src/routes/_app.hesabatlar.tsx:37-46, 132-150` — səhifə `?period=today\|week\|month\|all` URL sxemi və `PERIOD_LABELS` mətnləri ilə öz tab qrupunu qurur (`rounded-lg bg-stone-100 p-0.5`, `rounded-md px-3 py-1.5`). FE#56 ilə gətirilən paylaşılan `PeriodFilter` (`?from`/`?to`, 6 çip + «Tarix seç» popover, `rounded-xl border p-1`) Mallar, Satış, Nisyə Borclar və Xərclər səhifələrində istifadə olunur — **Hesabatlar bu dilin tətbiq olunmadığı yeganə dövr-əsaslı səhifədir** |
| İstifadəçiyə təsiri | İstifadəçi 4 səhifədə «Bu gün · Bu həftə · Bu ay · Keçən ay · Bu il · Hamısı + Tarix seç» görür, Hesabatlarda isə cəmi 4 seçim və fərqli vizual — sərbəst tarix aralığı seçmək mümkün deyil; öyrənilmiş naxış pozulur |
| Ciddilik | **Yüksək** |
| Tövsiyə olunan həll | Səhifə `PeriodFilter`-ə keçirilsin (`defaultKey="month"` — mövcud defolt davranış qorunur); `inPeriod(...)` client-side süzgəci `isoInRange(...)` ilə əvəz olunsun (`src/components/ui/period-filter-lib.ts` artıq ixrac edir); `useSummary(period)` çağırışı üçün köhnə `period` dəyəri saxlanıla və ya aralıqdan çıxarıla bilər. Köhnə URL-lər üçün `period` parametri zod sxemində qəbul edilməkdə davam etsin |
| Toxunulacaq fayllar | `src/routes/_app.hesabatlar.tsx` |
| Biznes məntiqi riski | **Var (orta)** — `inPeriod` və `isoInRange` sərhəd davranışları eyni olmalıdır, əks halda hesabat rəqəmləri sürüşə bilər. Azaldıcı tədbir: dəyişiklikdən əvvəl hər iki funksiyanın eyni giriş üçün eyni nəticə verdiyini təsdiqləyən unit test yazılsın (`period-filter-lib.test.ts` artıq mövcuddur) |
| İmplementasiya zəhməti | M |

#### F-27 — «Xalis qazanc» etiketi xərc çıxılmamış qazancı göstərir

| Sahə | Məzmun |
|---|---|
| Səhifə | Hesabatlar |
| Komponent | `StatCard` |
| Hazırkı problem | `src/routes/_app.hesabatlar.tsx:97` — `profit: sumBy(periodSales, (s) => s.profit ?? 0)`, yəni **satış qazancı** (maya çıxılıb, xərclər ÇIXILMAYIB). `:154` isə bunu «Xalis qazanc» adı ilə göstərir və yanındakı ayrıca kartda «Xərc» rəqəmi durur. Müqayisə: `SummaryData` tipində `netProfit` adlı **ayrı** sahə var (`src/features/reports/api.ts:113`, mock hesablaması `:164` — `profit − exp`) və o istifadə olunmur |
| İstifadəçiyə təsiri | «Xalis» sözü mühasibat dilində «bütün xərclər çıxıldıqdan sonra» deməkdir. Sahibkar bu rəqəmi son qazanc sanır və üzərinə bir daha xərci çıxarmadan qərar verir → real qazanc olduğundan yüksək qiymətləndirilir |
| Ciddilik | **Yüksək** |
| Tövsiyə olunan həll | Etiket `E-05` ilə dəqiqləşdirilsin; kartın `sub` sahəsində xərcin çıxılmadığı bildirilsin. Hesablama TOXUNULMUR — `netProfit`-ə keçid ayrıca biznes qərarı tələb edir və bu taskın əhatəsindən kənardır |
| Toxunulacaq fayllar | `src/routes/_app.hesabatlar.tsx` |
| Biznes məntiqi riski | **Yoxdur** — yalnız etiket və köməkçi mətn; `view.profit` düsturu eyni qalır |
| İmplementasiya zəhməti | S |

#### F-28 — Hesabatlarda KPI kompozisiya dili tətbiq olunmayıb (6 bərabər `StatCard`)

| Sahə | Məzmun |
|---|---|
| Səhifə | Hesabatlar |
| Komponent | `StatCard` ×6 |
| Hazırkı problem | `src/routes/_app.hesabatlar.tsx:152-164` — `grid-cols-2 md:grid-cols-3 xl:grid-cols-6` daxilində 6 bərabər `StatCard`. FE#61 KPI dili (`StatCluster`/`KpiCard`/`AlertPill`) tətbiq olunmayıb; əlaqəli rəqəmlər (Nağd/Nisyə satış) ayrı-ayrı kartlarda dağınıq durur |
| İstifadəçiyə təsiri | Hansı rəqəmin əsas nəticə, hansının bölgü detalı olduğu görünmür; `xl` ekranda 6 kart bir sırada sıxılır və F-04 daşma problemi güclənir |
| Ciddilik | Orta |
| Tövsiyə olunan həll | Satış/Qazanc/Xərc bir `StatCluster`-də, Nağd/Nisyə bölgüsü ikinci `StatCluster`-də, Anbar dəyəri isə ayrı `KpiCard`-da göstərilsin — `SalesKpiCards.tsx:47-104` naxışı ilə eyni |
| Toxunulacaq fayllar | `src/routes/_app.hesabatlar.tsx` |
| Biznes məntiqi riski | **Yoxdur** — `view` obyektinin sahələri və hesablamaları eyni qalır |
| İmplementasiya zəhməti | M |

---

### 2.10 İşçilər — `src/routes/_app.iscilar.tsx` (Maaşlar + Fəaliyyət)

Yoxlanılan: tab qrupu, `SalaryBoard` + `SalaryMonthSwitcher` + `SalaryCard`, `SalaryPayModal`, `SalaryDeductionModal`, `SalaryHistoryDrawer`, `EmployeesTable`, `ActivityLog`, rol əsaslı gizlətmə.

#### F-29 — Rol etiketi normalizasiya olunmur: badge boz düşür, mətn rejimdən asılı olaraq dəyişir

| Sahə | Məzmun |
|---|---|
| Səhifə | İşçilər (hər iki tab) |
| Komponent | `EmployeesTable` «Rol» sütunu, `SalaryCard` başlıq badge-i |
| Hazırkı problem | `src/features/employees/components/EmployeesTable.tsx:30-33` — `<Badge>{role}</Badge>`; `src/features/employees/components/SalaryCard.tsx:85` — `<Badge tone={summary.role}>{summary.role}</Badge>`. `Badge`-in `STATUS_STYLE` xəritəsində (`src/components/ui/Badge.tsx:5-30`) heç bir rol açarı yoxdur → həmişə boz `FALLBACK` tətbiq olunur. Göstərilən mətn serverin qaytardığı xam sətirdir: mock seed-də «Sahibkar/Menecer/Satıcı» (`src/mocks/seed.ts:386, 394, 402`), `Role` tipi isə `"sahib" \| "menecer" \| "satici"` kodlarını təyin edir (`src/types/index.ts:19`) və icazə xəritəsi (`CAPABILITIES`, `src/features/auth/store.ts:29-41`) məhz bu kodlarla işləyir |
| İstifadəçiyə təsiri | Rol badge-i heç bir rəng məlumatı vermir (hamısı boz) — sahibkarı satıcıdan ayırmaq üçün mətni oxumaq lazımdır; mətn isə rejimə görə fərqli görünə bilər |
| Ciddilik | Orta |
| Tövsiyə olunan həll | Frontend-də rol → görünən ad xəritəsi qurulsun (`E-18`) və `Badge.STATUS_STYLE`-a üç rol tonu əlavə edilsin. **Backend sahə adı və dəyəri dəyişmir** — yalnız göstərilən mətn və rəng normalizə olunur |
| Toxunulacaq fayllar | `src/components/ui/Badge.tsx`, `src/features/employees/components/EmployeesTable.tsx`, `src/features/employees/components/SalaryCard.tsx` |
| Biznes məntiqi riski | **Yoxdur** — `useCan()`/`CAPABILITIES` xam `role` dəyəri ilə işləməyə davam edir; xəritə yalnız təqdimat qatındadır |
| İmplementasiya zəhməti | S |

#### F-30 — `SalaryCard`-da 3 düymə 375px-də sıxılır; maaş redaktəsi zəif kəşf olunur

| Sahə | Məzmun |
|---|---|
| Səhifə | İşçilər → Maaşlar |
| Komponent | `SalaryCard` |
| Hazırkı problem | `src/features/employees/components/SalaryCard.tsx:180-216` — `grid-cols-3` daxilində 3 `Button size="sm"` (`min-h-[38px]`, `text-xs`, `px-1.5`, mətn `truncate`). 375px-də kart eni ≈343px → hər düymə ≈108px, ikonla birlikdə mətn kəsilir. Maaş redaktəsi isə rəqəmin yanındakı 12px `Pencil` ikonudur (`:136-141`) və yalnız hover-də rəng dəyişir — toxunma cihazında hover yoxdur |
| İstifadəçiyə təsiri | Mobil istifadəçi düymələrin nə etdiyini mətndən başa düşmür; maaş məbləğinin redaktə oluna bildiyini isə ümumiyyətlə görmür (`title` tooltip-i toxunma cihazında görünmür) |
| Ciddilik | Orta |
| Tövsiyə olunan həll | Mobil ölçüdə düymələr 2+1 və ya şaquli düzülsün (`grid-cols-2 sm:grid-cols-3`) və `size="md"` (44px) istifadə olunsun; maaş sahəsi üçün görünən redaktə göstəricisi (nöqtəli alt xətt və ya kiçik «dəyiş» mətni) əlavə edilsin |
| Toxunulacaq fayllar | `src/features/employees/components/SalaryCard.tsx` |
| Biznes məntiqi riski | **Yoxdur** — `useSetEmployeeSalary`, `salaryProgressPercent` və icazə yoxlamaları (`canRecord`, `canSetSalary`) dəyişmir |
| İmplementasiya zəhməti | S |

#### F-31 — `EmployeesTable` mobil kart görünüşünə malik deyil

| Sahə | Məzmun |
|---|---|
| Səhifə | İşçilər → Fəaliyyət |
| Komponent | `EmployeesTable` → `DataTable` |
| Hazırkı problem | `src/features/employees/components/EmployeesTable.tsx:52-59` — `mobileCard` verilmir; 4 sütunlu cədvəl `lg:col-span-3` sahəsində 375px-də sıxılır. Telefon sütunu `text-xs`-dir (`:37`) və `CopyablePhone` istifadə etmir — yəni digər cədvəllərdən fərqli olaraq nömrəyə zəng/kopyalama mümkün deyil |
| İstifadəçiyə təsiri | Telefonda işçi siyahısı sıxışır; işçiyə zəng etmək üçün nömrəni əl ilə köçürmək lazımdır |
| Ciddilik | Orta |
| Tövsiyə olunan həll | `mobileCard` əlavə olunsun (mövcud naxış: `SuppliersTable.tsx:173-243`), telefon sütununda `CopyablePhone` istifadə edilsin, rol badge-i `F-29` ilə birlikdə düzəldilsin |
| Toxunulacaq fayllar | `src/features/employees/components/EmployeesTable.tsx` |
| Biznes məntiqi riski | **Yoxdur** — `Employee` sahələri və `useEmployees()` sorğusu dəyişmir |
| İmplementasiya zəhməti | S |

---

### 2.11 Ayarlar — `src/routes/_app.ayarlar.tsx`

Yoxlanılan: `PageHead` + «Yadda saxla», icazə bloku, `fieldset disabled`, `Card`/`Field`/`Input`/`Select`/`Textarea`, icazə izah kartları.

#### F-32 — «Yadda saxla» yalnız yuxarıdadır; dəyişiklik və gözləmə vəziyyəti zəif göstərilir

| Sahə | Məzmun |
|---|---|
| Səhifə | Ayarlar |
| Komponent | `PageHead` actions → `Button size="sm"` |
| Hazırkı problem | `src/routes/_app.ayarlar.tsx:79-91` — yeganə saxlama düyməsi səhifənin başındadır və `size="sm"`-dir. Forma 3 `Card` və ≈8 sahədən ibarətdir; mobil ekranda aşağıya sürüşdükdə düymə görünmür (`PageHead` sticky deyil). `disabled={updateSettings.isPending}` var, amma nə spinner, nə mətn dəyişikliyi göstərilir; dəyişiklik olub-olmadığı (dirty state) heç yerdə bildirilmir və səhifədən çıxarkən xəbərdarlıq yoxdur |
| İstifadəçiyə təsiri | İstifadəçi ayarları dəyişir, aşağı sürüşür, saxlama düyməsini tapa bilmir və dəyişikliklər itir; klik edəndə isə nə baş verdiyini yalnız 3 saniyəlik toast-dan bilir |
| Ciddilik | Orta |
| Tövsiyə olunan həll | Formanın altında sticky saxlama zolağı əlavə olunsun (mövcud naxış: `Drawer` footer-i, `src/components/ui/Drawer.tsx:160-164`); `isPending` halında `Loader2` və mətn dəyişikliyi (bax `F-42`); dəyişiklik varsa düymə vurğulansın, yoxdursa deaktiv olsun |
| Toxunulacaq fayllar | `src/routes/_app.ayarlar.tsx` |
| Biznes məntiqi riski | **Yoxdur** — `useUpdateSettings` payload-u və `Settings` sahələri dəyişmir |
| İmplementasiya zəhməti | S |

#### F-33 — Deaktiv «Valyuta» və «Dil» seçimləri işlək nəzarət kimi görünür

| Sahə | Məzmun |
|---|---|
| Səhifə | Ayarlar |
| Komponent | `Select` (disabled) + `Field` hint |
| Hazırkı problem | `src/routes/_app.ayarlar.tsx:150-170` — hər iki `Select` `disabled`-dır və izah yalnız `hint` mətnindədir («Digər valyutalar tezliklə», «Hazırda yalnız Azərbaycanca»). Vizual olaraq isə tam açılan siyahı kimi görünür — istifadəçi ox işarəsini görüb toxunur, heç nə olmur |
| İstifadəçiyə təsiri | Rəqəmsal savadı aşağı istifadəçi bunu nasazlıq kimi qavrayır; «sistem cavab vermir» hissi yaranır |
| Ciddilik | Aşağı |
| Tövsiyə olunan həll | Tək variantlı, dəyişməyən sahələr açılan siyahı yerinə statik dəyər sətri kimi göstərilsin (məs. `Badge` və ya sadə mətn + kilid ikonu — `Lock` artıq səhifədə istifadə olunur, `:95`) |
| Toxunulacaq fayllar | `src/routes/_app.ayarlar.tsx` |
| Biznes məntiqi riski | **Yoxdur** — `Settings.currency` / `Settings.language` sahələri və göndərilən payload dəyişmir |
| İmplementasiya zəhməti | S |

---

### 2.12 Login — `src/routes/login.tsx`

Yoxlanılan: forma sahələri, validasiya mesajları, server xətası bloku, gözləmə vəziyyəti, demo ipucları, brendlənmə.

#### F-34 — Login səhifəsi dizayn sistemindən tamamilə kənardadır

| Sahə | Məzmun |
|---|---|
| Səhifə | Login |
| Komponent | Xam `<input>` ×2, xam `<button>`, xam mətn blokları |
| Hazırkı problem | `src/routes/login.tsx:67-120` — səhifə nə `Field`, nə `Input`, nə `PhoneInput`, nə də `Button` komponentlərindən istifadə edir. Fərqlər: input `px-3 py-2 text-sm` (≈36px hündürlük) vs dizayn sistemi `inputCls` `h-12 text-base` (48px); `rounded-lg` vs `rounded-xl`; `focus:ring-2` vs `focus:ring-4`; düymə `py-2 text-sm` (≈36px) vs `Button size="md"` `min-h-[44px]`. Telefon sahəsi `+994` maskası olmadan xam `type="tel"`-dir, halbuki `PhoneInput` komponenti mövcuddur (`src/components/ui/PhoneInput.tsx`). Başlıq «Sədərək Sistem» sabit mətndir (`:62`), sidebar isə `settings.storeName` göstərir (`_app.tsx:149`) |
| İstifadəçiyə təsiri | Sistemlə **ilk** təmas nöqtəsi qalan tətbiqdən fərqli görünür; 36px toxunma sahələri barmaqla dəqiq basmaq üçün kiçikdir (WCAG 2.5.5 minimumu 44×44px); telefon nömrəsi formatı öyrədilmir və istifadəçi «+994»-lə/onsuz yazmaqda tərəddüd edir |
| Ciddilik | **Yüksək** |
| Tövsiyə olunan həll | `Field` + `Input`/`PhoneInput` + `Button size="lg"` komponentlərinə keçirilsin; başlıq `useSettingsStore().storeName`-ə bağlansın (`E-17`). `react-hook-form` sxemi, `authApi.login` çağırışı və xəta idarəsi TOXUNULMUR |
| Toxunulacaq fayllar | `src/routes/login.tsx` |
| Biznes məntiqi riski | **Var (aşağı)** — `PhoneInput` saxlanılan dəyəri `994XXXXXXXXX` formatına çevirir (`src/lib/phone.ts` → `toStoredPhone`), hazırkı forma isə istifadəçinin yazdığını olduğu kimi göndərir. Azaldıcı tədbir: bu addımda yalnız `Input`+`Field`+`Button` tətbiq edilsin, `PhoneInput`-a keçid backend giriş formatı təsdiqləndikdən sonra ayrıca aparılsın |
| İmplementasiya zəhməti | S |

---

## 3. Responsive davranış (mobil-first, 375px)

Breakpoint-lər layihə konfiqurasiyasından: Tailwind defoltu (`sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280) — `tailwind.config.ts`-də `screens` override edilməyib. Layout sərhədləri: sidebar `lg`-dən görünür (`_app.tsx:190`), mobil tab bar `lg:hidden` (`:271`), `DataTable` mobil kart `md`-dən aşağı (`DataTable.tsx:101, 141`).

#### F-35 — Satış cəmi paneli mobil tab bar hündürlüyünə sabit ədədlə bağlıdır və safe-area tətbiq etmir

| Sahə | Məzmun |
|---|---|
| Səhifə | Satış (mobil) |
| Komponent | `QuickSaleScreen` sabit alt panel, `AppLayout` mobil tab bar |
| Hazırkı problem | `src/features/sales/components/QuickSaleScreen.tsx:773` — `fixed inset-x-0 bottom-[72px]`. Tab bar-ın real hündürlüyü isə məzmundan asılıdır: `py-2.5` + 24px ikon + `text-[11px]` mətn + `pb-safe-bottom` (`_app.tsx:271-273`). Yəni `72px` təxmini sabitdir və `env(safe-area-inset-bottom)` dəyəri sıfırdan böyük olan cihazlarda (jest/home indikatoru olan telefonlar) panel tab bar-ın üstünə düşür |
| İstifadəçiyə təsiri | Bəzi telefonlarda «SATIŞI TAMAMLA» düyməsi qismən tab bar altında qalır və ya cəmi rəqəmi kəsilir — kassanın ən vacib düyməsi |
| Ciddilik | Orta |
| Tövsiyə olunan həll | Tab bar hündürlüyü CSS dəyişəni ilə verilsin (`--tabbar-h`) və hər iki yer ondan istifadə etsin; panelə `pb-[env(safe-area-inset-bottom)]` (mövcud `spacing.safe-bottom` tokeni ilə) əlavə olunsun |
| Toxunulacaq fayllar | `src/features/sales/components/QuickSaleScreen.tsx`, `src/routes/_app.tsx`, `src/index.css` |
| Biznes məntiqi riski | **Yoxdur** — yalnız düzülüş ölçüləri |
| İmplementasiya zəhməti | S |

#### F-36 — `md`–`lg` aralığında (planşet) geniş cədvəllər üfüqi daşır

| Sahə | Məzmun |
|---|---|
| Səhifə | Satış (jurnal), Mallar, Nisyə Borclar, Müştərilər |
| Komponent | `DataTable` |
| Hazırkı problem | `src/components/ui/DataTable.tsx:141` — `mobileCard` **yalnız `md`-dən aşağıda** işləyir; `:238` — bütün hüceyrələr `whitespace-nowrap`. Satış jurnalında 10 sütun var, onlardan yalnız 3-ü `hidden lg:table-cell`-dir (`SalesJournal.tsx:211, 221, 290`) — yəni 768–1023px aralığında 7 sütun tam enində göstərilməyə çalışır və `overflow-x-auto` (`DataTable.tsx:137`) üfüqi sürüşməyə keçir |
| İstifadəçiyə təsiri | Planşetdə (bazar mağazalarında geniş yayılmış cihaz) jurnalın sağ hissəsi — «Əməliyyat» sütunu daxil — görünmür; istifadəçi sürüşdürməli olur |
| Ciddilik | Orta |
| Tövsiyə olunan həll | `mobileCard` sərhədi `lg`-yə qaldırılsın (opsional prop ilə, mövcud davranış defolt qalsın) və ya `md`–`lg` aralığında daha çox sütun `hidden lg:table-cell` ilə gizlədilsin. Sütun məzmunu və sıralama dəyişmir |
| Toxunulacaq fayllar | `src/components/ui/DataTable.tsx`, `src/features/sales/components/SalesJournal.tsx` |
| Biznes məntiqi riski | **Yoxdur** — `ColumnDef` massivləri və data axını toxunulmur |
| İmplementasiya zəhməti | M |

Digər responsive tapıntılar: `F-04` (KPI daşması), `F-17` (mobil kart natamamlığı), `F-24` və `F-31` (mobil kartı olmayan cədvəllər), `F-30` (sıxılan düymələr).

---

## 4. Əlçatanlıq (accessibility)

#### F-37 — Dizayn sistemində vahid fokus göstəricisi yoxdur

| Sahə | Məzmun |
|---|---|
| Səhifə | Bütün səhifələr |
| Komponent | `Button`, `Input`, `Textarea`, `Select` trigger, `PeriodFilter` çipləri, `DataTable` səhifələmə düymələri, `StatCard`/`KpiCard` daxilindəki düymələr |
| Hazırkı problem | `focus-visible` bütün `src/` boyu cəmi **11 faylda** istifadə olunur (`Accordion`, `CopyablePhone`, `DataTable` sətirləri, `FilterBar`, `FilterPanel`, `DebtViewToggle`, `ExpenseForm`, `ExcelImportModal`, `LabelPrintModal`, `PaymentConfirmModal`, `_app.tsx`). Dizayn sisteminin əsas primitivləri — `src/components/ui/Button.tsx:44-49` və `src/components/ui/Input.tsx:6-7` — heç bir `focus-visible` sinfi təyin etmir; `Input` isə `outline-none` qoyub yerinə yalnız `focus:` (mouse daxil) halqası verir. Nəticədə fokus görünüşü brauzer defoltuna və ya təsadüfi sinifə qalır |
| İstifadəçiyə təsiri | Klaviatura ilə işləyən istifadəçi (barkod skaneri + klaviatura kassa mühitində adi haldır) hansı elementin seçildiyini izləyə bilmir; Tab ilə naviqasiya praktiki olaraq mümkünsüzləşir |
| Ciddilik | **Yüksək** |
| Tövsiyə olunan həll | `src/index.css`-də vahid fokus tokeni (`--focus-ring`) təyin edilsin və `Button`/`Input`/`Textarea`/`Select`/`PeriodFilter` çipləri/`DataTable` səhifələməsi eyni `focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2` naxışına gətirilsin (mövcud `_app.tsx:114` naxışı ilə eyni) |
| Toxunulacaq fayllar | `src/index.css`, `src/components/ui/Button.tsx`, `src/components/ui/Input.tsx`, `src/components/ui/Textarea.tsx`, `src/components/ui/Select.tsx`, `src/components/ui/PeriodFilter.tsx`, `src/components/ui/DataTable.tsx` |
| Biznes məntiqi riski | **Yoxdur** — yalnız CSS |
| İmplementasiya zəhməti | M |

#### F-38 — Çoxlu interaktiv element 44×44px toxunma minimumundan kiçikdir

| Sahə | Məzmun |
|---|---|
| Səhifə | Bütün səhifələr (xüsusən cədvəllər və filtr sıraları) |
| Komponent | `PeriodFilter` çipləri, `FilterBar` çip «×» düymələri, cədvəl sətir düymələri, `ActionMenu` trigger, `SalaryCard` düymələri, `Modal`/`Drawer` bağlama düyməsi, `CopyablePhone` zəng ikonu |
| Hazırkı problem | Ölçülər: `PeriodFilter` çipi `px-3 py-1.5 text-sm` ≈ 30px (`PeriodFilter.tsx:34-40`); status/«Son əməliyyat» çipləri eyni (`_app.borclar.tsx:385, 421`); cədvəl sətir düymələri `h-8` = 32px (`SalesJournal.tsx:323, 334`, `CustomersTable.tsx:104`, `OpenDebtsTable.tsx:131, 145`, `ExpensesTable.tsx:63`); `Modal`/`Drawer` bağlama `h-10 w-10` = 40px (`Modal.tsx:117`, `Drawer.tsx:130`); `SalaryCard` düymələri 38px (`Button size="sm"`); `CopyablePhone` zəng linki `h-6 w-6` = 24px (`CopyablePhone.tsx:57`) |
| İstifadəçiyə təsiri | Barmaqla dəqiq basmaq çətindir — səhv düyməyə toxunma riski artır (məs. «Detal» əvəzinə «Qaimə» və ya çipin «×»-i). Yaşlı və ya iri barmaqlı istifadəçilər üçün gündəlik maneə |
| Ciddilik | **Yüksək** |
| Tövsiyə olunan həll | Mobil ölçüdə (`md`-dən aşağı) bütün əsas toxunma hədəfləri ən azı 44px-ə çatdırılsın — vizual ölçünü böyütmədən `::after` ilə genişləndirilmiş toxunma sahəsi və ya `min-h-[44px]` + azaldılmış `py`. `DataTable` mobil kartlarındakı düymələr artıq `h-11` (44px) — bu naxış cədvəl sətirlərinə də gətirilsin |
| Toxunulacaq fayllar | `src/components/ui/PeriodFilter.tsx`, `src/components/ui/Modal.tsx`, `src/components/ui/Drawer.tsx`, `src/components/ui/CopyablePhone.tsx`, `src/components/ui/ActionMenu.tsx`, `src/features/sales/components/SalesJournal.tsx`, `src/features/customers/components/CustomersTable.tsx`, `src/features/customers/components/OpenDebtsTable.tsx`, `src/features/expenses/components/ExpensesTable.tsx`, `src/features/employees/components/SalaryCard.tsx` |
| Biznes məntiqi riski | **Yoxdur** — yalnız ölçü sinifləri; `onClick` idarəçiləri dəyişmir |
| İmplementasiya zəhməti | L |

#### F-39 — `Toasts` ekran oxuyucusuna elan olunmur və 3 saniyəyə itir

| Sahə | Məzmun |
|---|---|
| Səhifə | Bütün səhifələr |
| Komponent | `Toasts`, `toast-store` |
| Hazırkı problem | `src/components/ui/Toast.tsx:20-46` — konteynerdə nə `role="status"`, nə `role="alert"`, nə də `aria-live` var; `src/components/ui/toast-store.ts:23, 28` — `AUTO_DISMISS_MS = 3000` bütün növlər üçün eynidir, yəni **xəta mesajları da** 3 saniyəyə itir. Bağlama düyməsində `aria-label` yoxdur (`Toast.tsx:38-43`) |
| İstifadəçiyə təsiri | Ekran oxuyucusu istifadəçisi əməliyyatın uğurlu/uğursuz olduğunu ümumiyyətlə eşitmir; yavaş oxuyan istifadəçi xəta səbəbini oxuya bilmir və eyni səhvi təkrarlayır |
| Ciddilik | Orta |
| Tövsiyə olunan həll | Konteynerə `aria-live="polite"` (xətalar üçün `assertive`) və `role="status"` əlavə edilsin; xəta toast-larının avtomatik bağlanma müddəti uzadılsın və ya əl ilə bağlanana qədər saxlanılsın; bağlama düyməsinə `aria-label` verilsin |
| Toxunulacaq fayllar | `src/components/ui/Toast.tsx`, `src/components/ui/toast-store.ts` |
| Biznes məntiqi riski | **Yoxdur** — `useToast()` API-si və çağırış yerləri dəyişmir |
| İmplementasiya zəhməti | S |

#### F-40 — Əsas məlumat çox zəif kontrastlı boz tonlarla verilir

| Sahə | Məzmun |
|---|---|
| Səhifə | Bütün cədvəllər, kartlar, drawer-lər |
| Komponent | `EmptyValue`, `SalesJournal` mobil kart, `SaleDetailDrawer`, `ExpensesTable`, `_app.index.tsx` siyahıları |
| Hazırkı problem | `text-stone-400` (#a8a29e) ağ fonda ≈2.5:1 kontrast verir (WCAG AA normal mətn üçün 4.5:1 tələb edir). Bu ton **köməkçi bəzək** deyil, **əsas məlumat** üçün istifadə olunur: satış tarixi və kateqoriya (`_app.index.tsx:152, 195, 226`), «X ödənilib» qismən ödəniş sətri (`SalesJournal.tsx:271, 640`; `SaleDetailDrawer.tsx:261`), xərc qeydi (`ExpensesTable.tsx:152`), donmuş mal sayı (`_app.hesabatlar.tsx:226`). `EmptyValue` isə daha da açıq `text-stone-300` işlədir (`src/components/ui/EmptyValue.tsx:17`) |
| İstifadəçiyə təsiri | Günəş işığı altında (bazar şəraiti) və ya yaşlı istifadəçi üçün bu mətnlər praktiki olaraq oxunmur; qismən ödəniş qeydi — pul barədə mühüm məlumat — gözdən qaçır |
| Ciddilik | Orta |
| Tövsiyə olunan həll | Əsas məlumat daşıyan mətnlər ən azı `text-stone-500` (#78716c ≈ 4.6:1) tonuna qaldırılsın; `text-stone-400`/`text-stone-300` yalnız həqiqətən ikinci dərəcəli dekorativ elementlərdə (ikon fonu, ayırıcı nöqtə) saxlanılsın |
| Toxunulacaq fayllar | `src/components/ui/EmptyValue.tsx`, `src/features/sales/components/SalesJournal.tsx`, `src/features/sales/components/SaleDetailDrawer.tsx`, `src/features/expenses/components/ExpensesTable.tsx`, `src/routes/_app.index.tsx`, `src/routes/_app.hesabatlar.tsx` |
| Biznes məntiqi riski | **Yoxdur** — yalnız rəng sinifləri |
| İmplementasiya zəhməti | M |

---

## 5. Vəziyyətlər: loading · boş · xəta · deaktiv

#### F-41 — İki paralel yükləmə dili: tam ekran `Spinner` vs skeleton

| Sahə | Məzmun |
|---|---|
| Səhifə | Bütün cədvəlli və KPI-lı səhifələr |
| Komponent | `Spinner`, `DataTable`, `KpiCard`/`StatCluster` skeletonları |
| Hazırkı problem | `src/components/ui/DataTable.tsx:74-80` — `isLoading` olduqda **bütün cədvəl** (başlıqlar daxil) `Spinner`-lə əvəz olunur, yəni sütun konteksti itir və düzülüş sıçrayır. Eyni zamanda `KpiCard.tsx:59-63`, `StatCluster.tsx:143-145`, `DebtsKpiCards.tsx:108-113`, `ProductsKpiCards.tsx:39-42` müasir `animate-pulse` skeleton göstərir. Səhifə səviyyəsində isə üçüncü variant var: `_app.index.tsx:37-44` və `_app.hesabatlar.tsx:118-125` — bütün səhifə yerinə tək `Spinner` |
| İstifadəçiyə təsiri | Yükləmə hər ekranda fərqli görünür; cədvəl yüklənəndə səhifə «sıçrayır» və istifadəçi yerini itirir |
| Ciddilik | Orta |
| Tövsiyə olunan həll | `DataTable` üçün skeleton sətirləri (başlıqlar yerində qalmaqla) tətbiq edilsin — KPI komponentlərindəki `animate-pulse` naxışı ilə eyni; səhifə səviyyəsində tam ekran `Spinner` yalnız ilk yüklənmədə saxlanılsın |
| Toxunulacaq fayllar | `src/components/ui/DataTable.tsx`, `src/components/ui/Spinner.tsx` |
| Biznes məntiqi riski | **Yoxdur** — `isLoading` propunun mənbəyi və `useQuery` davranışı dəyişmir |
| İmplementasiya zəhməti | M |

#### F-42 — `Button`-da `loading` vəziyyəti yoxdur; `Loader2` naxışı 9 faylda əl ilə təkrarlanır

| Sahə | Məzmun |
|---|---|
| Səhifə | Mallar, Satış, Müştərilər, Login, modal/drawer-lər |
| Komponent | `Button` |
| Hazırkı problem | `src/components/ui/Button.tsx:29-34` — props yalnız `variant`, `size`, `icon`. Gözləmə vəziyyəti hər çağırış yerində əl ilə qurulur: `icon={pending ? <Loader2 className="animate-spin"/> : <X/>}` + `disabled={pending}` (+ bəzən mətn dəyişikliyi). `Loader2` istifadə edən fayllar: `_app.mallar.tsx`, `login.tsx`, `SalesJournal.tsx`, `SaleDetailDrawer.tsx`, `QuickSaleScreen.tsx`, `PaymentConfirmModal.tsx`, `CustomerDrawer.tsx`, `ExcelImportModal.tsx`, `LabelPrintModal.tsx` |
| İstifadəçiyə təsiri | Gözləmə göstəricisi hər yerdə eyni deyil — bəzi düymələr yalnız solğunlaşır, bəziləri fırlanan ikon göstərir, bəziləri mətnini dəyişir. İstifadəçi əməliyyatın davam etdiyini həmişə başa düşmür və ikinci dəfə klikləyir |
| Ciddilik | Orta |
| Tövsiyə olunan həll | `Button`-a `loading?: boolean` propu əlavə olunsun: `loading` → `icon` yerinə `Loader2 animate-spin`, `disabled` avtomatik, `aria-busy="true"`. Mövcud çağırış yerləri mərhələli şəkildə köçürülsün (geriyə uyğunluq pozulmur — yeni prop opsionaldır) |
| Toxunulacaq fayllar | `src/components/ui/Button.tsx` + yuxarıdakı 9 fayl |
| Biznes məntiqi riski | **Yoxdur** — `onClick` idarəçiləri və mutation çağırışları dəyişmir |
| İmplementasiya zəhməti | M |

#### F-43 — `ConfirmModal` async əməliyyat bitmədən bağlanır; daxili gözləmə/xəta vəziyyəti yoxdur

| Sahə | Məzmun |
|---|---|
| Səhifə | Mallar, Satış, Müştərilər, Təchizatçılar, Xərclər, Nisyə Borclar, Gün Sonu |
| Komponent | `ConfirmModal` |
| Hazırkı problem | `src/components/ui/ConfirmModal.tsx:32-40` — `onClick={() => { onConfirm(); onClose(); }}`. `onConfirm` async olsa belə modal dərhal bağlanır. Nəticədə silmə/bağlama əməliyyatının nəticəsi yalnız 3 saniyəlik toast ilə bildirilir; xəta halında istifadəçi modalda deyil, boş ekranda qırmızı toast görür və nə edəcəyini bilmir |
| İstifadəçiyə təsiri | «Sil» basandan sonra ekran dərhal normal görünür, amma sətir hələ də yerindədir → istifadəçi ikinci dəfə silməyə çalışır. Gün bağlanışı kimi geri alına bilməyən əməliyyatda bu xüsusilə təhlükəlidir |
| Ciddilik | Orta |
| Tövsiyə olunan həll | `ConfirmModal`-a `isPending?: boolean` və opsional `error?: string` propları əlavə edilsin; `onConfirm` `Promise` qaytardıqda modal yalnız uğurlu bitişdə bağlansın. Bütün mövcud çağırışlar (10+ yer) geriyə uyğun qalır — yeni proplar opsionaldır |
| Toxunulacaq fayllar | `src/components/ui/ConfirmModal.tsx` + çağıran səhifələr (mərhələli) |
| Biznes məntiqi riski | **Yoxdur** — silmə/bağlama mutation-ları və `queryClient` invalidasiyası dəyişmir |
| İmplementasiya zəhməti | M |

#### F-44 — Səhifə səviyyəsində xəta vəziyyəti yalnız 2 səhifədə var; qalanlarda xəta «boş nəticə» kimi görünür

| Sahə | Məzmun |
|---|---|
| Səhifə | Mallar, Müştərilər, Nisyə Borclar, Təchizatçılar, İşçilər/Fəaliyyət, Gün Sonu |
| Komponent | Route komponentləri, `DataTable` `EmptyState` |
| Hazırkı problem | Xəta budağı yalnız `src/routes/_app.xercler.tsx:164-167` və `src/features/employees/components/SalaryBoard.tsx:44-47`-də var. Digər səhifələrdə `useQuery` xəta versə `data = []` defolt dəyəri işə düşür (məs. `const { data: products = [] } = useProducts()` — `_app.mallar.tsx:53`) və `DataTable` boş vəziyyət göstərir: «Mal yoxdur», «Hələ müştəri yoxdur», «Açıq borc yoxdur» |
| İstifadəçiyə təsiri | Şəbəkə problemi «anbarınız boşdur» kimi təqdim olunur. İstifadəçi malların silindiyini düşünüb təkrar daxil etməyə başlaya bilər — bu, real data korlanmasına aparır |
| Ciddilik | **Yüksək** |
| Tövsiyə olunan həll | Paylaşılan `ErrorState` komponenti yaradılsın (`EmptyState` naxışı + «Yenidən» düyməsi, `KpiCard.tsx:45-58`-dəki `onRetry` dili ilə); bütün siyahı səhifələrində `isError` budağı əlavə edilsin. Boş vəziyyət yalnız uğurlu, lakin boş cavabda göstərilsin |
| Toxunulacaq fayllar | `src/components/ui/` (yeni `ErrorState`), `src/routes/_app.mallar.tsx`, `src/routes/_app.musteriler.tsx`, `src/routes/_app.borclar.tsx`, `src/routes/_app.tedarukculer.tsx`, `src/features/employees/components/EmployeesTable.tsx`, `src/features/day-end/components/ClosingHistory.tsx` |
| Biznes məntiqi riski | **Yoxdur** — sorğular və defolt dəyərlər dəyişmir, yalnız render budağı əlavə olunur |
| İmplementasiya zəhməti | M |

---

## 6. Hərəkət (motion)

#### F-45 — Modal/Drawer/Toast açılış-bağlanış keçidi yoxdur; `prefers-reduced-motion` heç yerdə idarə olunmur

| Sahə | Məzmun |
|---|---|
| Səhifə | Bütün səhifələr |
| Komponent | `Modal`, `Drawer`, `Toasts` |
| Hazırkı problem | `src/components/ui/Modal.tsx:88` və `src/components/ui/Drawer.tsx:79` — `if (!open) return null`, yəni panel ani olaraq DOM-a girib-çıxır; `Modal`-da ümumiyyətlə heç bir `transition` sinfi yoxdur, `Drawer`-də isə yalnız `transition-[max-width]` (genişlət/daralt üçün) var (`:152`). `Toasts` də animasiyasız görünüb itir (`Toast.tsx:29-35`). `prefers-reduced-motion` / `motion-reduce:` bütün `src/` boyu **heç bir faylda** yoxdur; buna baxmayaraq `animate-spin` və `animate-pulse` 20+ yerdə işlədilir |
| İstifadəçiyə təsiri | Panel ani «peyda olur» — məkan əlaqəsi yaranmır və istifadəçi haradan gəldiyini anlamır (`review-animations/STANDARDS.md` cədvəlinə görə modal/drawer/toast «standart animasiya» sinfindədir). Hərəkətə həssas istifadəçilər üçün isə fasiləsiz fırlanan/pulsasiya edən elementlər dayandırıla bilmir |
| Ciddilik | Aşağı |
| Tövsiyə olunan həll | `Modal`/`Drawer` üçün qısa `ease-out` giriş (150–200ms; drawer üçün `cubic-bezier(0.32, 0.72, 0, 1)`), `Toasts` üçün yumşaq giriş/çıxış əlavə edilsin; `src/index.css`-də qlobal `@media (prefers-reduced-motion: reduce)` bloku ilə bütün keçidlər və `animate-*` sıfıra endirilsin |
| Toxunulacaq fayllar | `src/components/ui/Modal.tsx`, `src/components/ui/Drawer.tsx`, `src/components/ui/Toast.tsx`, `src/index.css` |
| Biznes məntiqi riski | **Yoxdur** — yalnız CSS və mount/unmount vaxtlaması |
| İmplementasiya zəhməti | M |

---

## 7. Təkrarlanma, ölü kod və terminologiya

#### F-46 — Ölü kod: iki komponent heç yerdən import olunmur

| Sahə | Məzmun |
|---|---|
| Səhifə | — (heç bir səhifədə istifadə olunmur) |
| Komponent | `SaleCalculator`, `FilterPanel` |
| Hazırkı problem | `src/features/sales/components/SaleCalculator.tsx` (96 sətir) və `src/components/ui/FilterPanel.tsx` (90 sətir) `src/` boyu heç bir fayldan import edilmir (yalnız öz fayllarında adı keçir). `FilterPanel` funksional olaraq `FilterBar` ilə əvəz olunub (`FilterBar` axtarış + panel + çipləri birləşdirir) |
| İstifadəçiyə təsiri | Birbaşa yoxdur — lakin sonrakı işçilər səhvən köhnə komponenti istifadə edə və uyğunsuz filtr naxışını geri gətirə bilər |
| Ciddilik | Aşağı |
| Tövsiyə olunan həll | Hər iki fayl silinsin; silinmədən əvvəl `FilterPanel`-in `FilterBar`-da olmayan yeganə üstünlüyü (axtarışsız, yalnız panel rejimi) `FilterBar`-a opsional prop kimi əlavə edilsin |
| Toxunulacaq fayllar | `src/features/sales/components/SaleCalculator.tsx`, `src/components/ui/FilterPanel.tsx`, `src/components/ui/FilterBar.tsx` |
| Biznes məntiqi riski | **Yoxdur** — heç bir istifadə yeri olmadığı üçün davranış dəyişmir; `npm run build` (`tsc`) silinmiş importu dərhal aşkarlayardı |
| İmplementasiya zəhməti | S |

#### F-47 — Dörd paralel KPI implementasiyası mövcuddur

| Sahə | Məzmun |
|---|---|
| Səhifə | Dashboard, Mallar, Satış, Nisyə Borclar, Hesabatlar, Mal detalı, Gün Sonu |
| Komponent | `StatCard`, `KpiCard`, `StatCluster`, `DebtsKpiCards` daxili inline panelləri |
| Hazırkı problem | (1) `StatCard` — ikonlu, `tone` variantlı, `text-2xl/3xl`, `p-5` (`src/components/ui/StatCard.tsx`); (2) `KpiCard` — ikonsuz, `uppercase` etiket, `text-xl/2xl`, `p-4`, `isLoading`/`isError`/`onRetry` (`src/components/ui/KpiCard.tsx:21-79`); (3) `StatCluster` — bir panel içində `divide`-lı çoxlu dəyər (`:105-163`); (4) `DebtsKpiCards` — `KpiCard`/`StatCluster` istifadə etmədən eyni vizual dili **əl ilə təkrarlayan** inline JSX (`src/features/customers/components/DebtsKpiCards.tsx:98-191`, o cümlədən öz `ErrorBlock` nüsxəsi `:49-63`) |
| İstifadəçiyə təsiri | Rəqəm bloklarının ölçüsü, etiket üslubu (böyük hərf vs adi) və yükləmə davranışı səhifədən səhifəyə dəyişir; tətbiq «bir məhsul» kimi hiss olunmur |
| Ciddilik | Orta |
| Tövsiyə olunan həll | `KpiCard`+`StatCluster` **əsas dil** elan edilsin; `DebtsKpiCards`-dakı inline panellər bu komponentlərlə əvəz olunsun (`ErrorBlock` `KpiCard`-ın daxili xəta bloku ilə); `StatCard` mərhələli şəkildə `KpiCard`-a köçürülsün və ya rəsmi olaraq «ikonlu variant» kimi sənədləşdirilsin. `KpiCard.test.tsx`, `DebtsKpiCards.test.tsx`, `ProductsKpiCards.test.tsx` mövcud testləri qorunur |
| Toxunulacaq fayllar | `src/components/ui/KpiCard.tsx`, `src/components/ui/StatCard.tsx`, `src/features/customers/components/DebtsKpiCards.tsx` |
| Biznes məntiqi riski | **Yoxdur** — göstərilən sahələr və sorğular dəyişmir |
| İmplementasiya zəhməti | L |

#### F-48 — `mobileCard` naxışı 5 cədvəldə əl ilə təkrarlanır

| Sahə | Məzmun |
|---|---|
| Səhifə | Satış, Mallar, Müştərilər, Nisyə Borclar, Xərclər, Təchizatçılar |
| Komponent | `SalesJournal`, `ProductsTable`, `CustomersTable`, `OpenDebtsTable`, `ExpensesTable`, `SuppliersTable` |
| Hazırkı problem | Hər `mobileCard` eyni skeleti sıfırdan yazır: `rounded-2xl border border-stone-200 bg-white p-4 shadow-card` → başlıq sətri (ad solda, məbləğ sağda) → orta məlumat → `border-t border-stone-100 pt-3` daxilində `h-11` düymələr + `ActionMenu`. Fərqlər isə təsadüfidir: `SalesJournal` `rounded-xl p-3.5` (`:630`), digərləri `rounded-2xl p-4`; `stopPropagation` bəzilərində var, bəzilərində yox |
| İstifadəçiyə təsiri | Mobil kartların hündürlüyü, kənar boşluğu və düymə sırası cədvəldən cədvələ dəyişir — mobil təcrübə «yamaq» kimi hiss olunur |
| Ciddilik | Orta |
| Tövsiyə olunan həll | Paylaşılan `MobileCard` karkası (slot-lu: `title`, `amount`, `meta`, `actions`) yaradılsın və 6 cədvəl ona köçürülsün; ölçülər tək yerdən idarə olunsun |
| Toxunulacaq fayllar | `src/components/ui/` (yeni `MobileCard`) + yuxarıdakı 6 cədvəl faylı |
| Biznes məntiqi riski | **Yoxdur** — göstərilən sahələr eyni qalır, yalnız karkas ortaqlaşır |
| İmplementasiya zəhməti | L |

#### F-49 — Lokal `Card`/`Row` helper-ləri iki drawer-də eyni koddur

| Sahə | Məzmun |
|---|---|
| Səhifə | Satış (detal draweri), Xərclər (detal draweri), Gün Sonu |
| Komponent | `SaleDetailDrawer`, `ExpenseDetailDrawer`, `DayEndCard` |
| Hazırkı problem | `src/features/sales/components/SaleDetailDrawer.tsx:31-64` və `src/features/expenses/components/ExpenseDetailDrawer.tsx:35-68` — eyni adlı `Card` və `Row` funksiyaları demək olar ki, hərfi-hərfinə təkrarlanır (yeganə fərq: `Row`-da `shrink-0`/`min-w-0` sinifləri). `DayEndCard.tsx:16-43` isə üçüncü, fərqli `Row` variantını (bold/tone proplu) saxlayır. Paylaşılan `src/components/ui/Card.tsx` isə başqa (başlıqlı panel) semantikadadır |
| İstifadəçiyə təsiri | Detal panellərində sətir aralıqları və etiket üslubu incə şəkildə fərqlənir; dəyişiklik üç yerdə ayrıca aparılmalı olur |
| Ciddilik | Aşağı |
| Tövsiyə olunan həll | `DetailCard` + `DetailRow` paylaşılan komponentləri `src/components/ui/`-yə çıxarılsın; hər üç istifadəçi ona keçirilsin. Mövcud `Card` komponentinin adı və davranışı DƏYİŞMİR |
| Toxunulacaq fayllar | `src/components/ui/` (yeni), `src/features/sales/components/SaleDetailDrawer.tsx`, `src/features/expenses/components/ExpenseDetailDrawer.tsx`, `src/features/day-end/components/DayEndCard.tsx` |
| Biznes məntiqi riski | **Yoxdur** — yalnız təqdimat komponentləri |
| İmplementasiya zəhməti | M |

#### F-50 — Altı fərqli axtarış təcrübəsi var; topbar qlobal axtarışının davranışı gizlidir

| Sahə | Məzmun |
|---|---|
| Səhifə | Bütün səhifələr |
| Komponent | topbar axtarışı, `FilterBar` axtarışı, `BorclarPage` sadə inputu, `MusterilerPage` sadə inputu, `CustomerPicker`, `QuickSaleScreen` axtarışı |
| Hazırkı problem | Altı ayrı implementasiya: (1) `src/routes/_app.tsx:238-250` — topbar, `sm`-dən görünür, `Enter` ilə **/mallar səhifəsinə naviqasiya edir** (`submitSearch`, `:84-86`), placeholder «Mal axtar... (Enter)»; (2) `FilterBar` axtarışı — anlıq süzgəc, `h-12 pl-8 text-sm` (`FilterBar.tsx:74-81`); (3) `_app.borclar.tsx:333-345` — xam input, `inputCls h-12 pl-8`; (4) `_app.musteriler.tsx:119-134` — xam input, `inputCls pl-8` (hündürlük təyin edilməyib); (5) `CustomerPicker` — ↑↓/Enter naviqasiyalı autocomplete (`src/components/ui/CustomerPicker.tsx`); (6) `QuickSaleScreen.tsx:417-440` — `h-11`, çərçivəsiz, `focus-within` halqalı xüsusi qutu. Topbar axtarışının **naviqasiya etdiyi** heç bir vizual göstərici ilə bildirilmir — istifadəçi cari səhifədə süzgəc gözləyir, amma başqa səhifəyə atılır |
| İstifadəçiyə təsiri | «Axtarış» hər ekranda başqa cür işləyir: bəzən yazdıqca süzür, bəzən `Enter` gözləyir, bəzən səhifəni dəyişir. Bu, sistemə etibarı azaldan ən çox təkrarlanan çaşqınlıq mənbəyidir |
| Ciddilik | **Yüksək** |
| Tövsiyə olunan həll | (a) Bütün səhifədaxili axtarışlar `FilterBar` (və ya onun axtarış hissəsini ixrac edən paylaşılan `SearchInput`) üzərindən keçsin — eyni hündürlük, ikon, placeholder qaydası; (b) topbar axtarışı vizual olaraq fərqləndirilsin (fərqli placeholder qaydası + naviqasiya nişanı) ki, «qlobal» olduğu görünsün; (c) `CustomerPicker` və kassa axtarışı ixtisaslaşmış qalsın, lakin eyni ölçü/ikon dilini işlətsin |
| Toxunulacaq fayllar | `src/components/ui/FilterBar.tsx`, `src/routes/_app.tsx`, `src/routes/_app.borclar.tsx`, `src/routes/_app.musteriler.tsx`, `src/features/sales/components/QuickSaleScreen.tsx` |
| Biznes məntiqi riski | **Yoxdur** — süzgəc şərtləri, URL search sxemləri və `submitSearch` naviqasiyası dəyişmir |
| İmplementasiya zəhməti | L |

#### F-51 — `Modal` və `Drawer` eyni «üst qat» rolunu fərqli davranışla oynayır

| Sahə | Məzmun |
|---|---|
| Səhifə | Bütün səhifələr |
| Komponent | `Modal`, `Drawer` |
| Hazırkı problem | `src/components/ui/Modal.tsx` — arxa fon sürüşməsini bloklayır (`:30-42`), yığın idarəsi var (`openStack`), **fokus tələsi** var (Tab dövr edir, `:67-83`), `role="dialog" aria-modal="true"`. `src/components/ui/Drawer.tsx` — body scroll bloku **YOXDUR**, yığın idarəsi **YOXDUR**, fokus tələsi **YOXDUR** (yalnız açılışda fokusu panelə keçirir, `:66-77`), buna baxmayaraq `aria-modal="true"` elan edir |
| İstifadəçiyə təsiri | Drawer açıqkən arxa səhifə sürüşür (mobil «scroll chaining»), Tab isə arxadakı gizli elementlərə keçir və fokus itir. `aria-modal="true"` deklarasiyası ekran oxuyucusuna arxa məzmunun bağlı olduğunu bildirir — davranış isə buna uyğun deyil |
| Ciddilik | Orta |
| Tövsiyə olunan həll | `Modal`-dakı body scroll kilidi, `openStack` və fokus tələsi məntiqi ortaq hook-a (`useDialogLayer`) çıxarılsın və `Drawer` də onu istifadə etsin — hər ikisinin davranışı `aria-modal="true"` vədinə uyğunlaşsın |
| Toxunulacaq fayllar | `src/components/ui/Modal.tsx`, `src/components/ui/Drawer.tsx`, `src/components/ui/` (yeni hook) |
| Biznes məntiqi riski | **Yoxdur** — `open`/`onClose` API-si və çağırış yerləri dəyişmir |
| İmplementasiya zəhməti | M |

#### F-52 — Bazar dili ilə sistem dili qarışıqdır; orfoqrafiya vahid deyil

| Sahə | Məzmun |
|---|---|
| Səhifə | Bütün səhifələr |
| Komponent | `PageHead` başlıqları, `FilterBar`, cədvəl başlıqları, boş vəziyyət mətnləri |
| Hazırkı problem | Nümunələr: (a) sidebar bəndi «Ana səhifə» (`_app.tsx:52`), səhifə başlığı isə «Dashboard» (`_app.index.tsx:40, 48`) — eyni ekranın iki adı, biri ingiliscə; (b) «Filterlər»/«Filterləri təmizlə» (`FilterBar.tsx:52-53`) yanında «filtrlər»/«Filtrə uyğun» (`_app.xercler.tsx:178`, `_app.borclar.tsx:582`) — eyni sözün iki yazılışı; (c) «Maya qiyməti» sütunu əslində alış qiymətidir (`SalesJournal.tsx:209` tooltip-i bunu təsdiqləyir), halbuki «real maya» başqa anlayışdır (`realCostPerUnit`); (d) «naməlum» sözü qazanc üçün üç yerdə istifadə olunur (`SalesJournal.tsx:245`, `QuickSaleScreen.tsx:876, 882`) — istifadəçi üçün «sistem bilmir» yoxsa «hesablanmayıb» olduğu aydın deyil; (e) «Mənə borclular» / «Mənim borclarım» (`_app.index.tsx:77-78`) — yan-yana duran, bir-birinə çox oxşayan iki etiket |
| İstifadəçiyə təsiri | Rəqəmsal savadı aşağı istifadəçi eyni anlayışın iki adını iki fərqli şey sanır; «Dashboard» sözü ümumiyyətlə tanış deyil |
| Ciddilik | Orta |
| Tövsiyə olunan həll | Terminlər lüğəti sənədləşdirilsin və etiketlər `E-07`, `E-08`, `E-12`, `E-13`, `E-14`, `E-16` sətirləri üzrə vahidləşdirilsin. **Yalnız görünən mətn dəyişir** — API sahə adları, tip adları və kod identifikatorları toxunulmur |
| Toxunulacaq fayllar | `src/routes/_app.index.tsx`, `src/components/ui/FilterBar.tsx`, `src/features/sales/components/SalesJournal.tsx`, `src/features/sales/components/QuickSaleScreen.tsx`, `src/routes/_app.xercler.tsx`, `src/routes/_app.borclar.tsx` |
| Biznes məntiqi riski | **Yoxdur** — heç bir sahə adı, düstur və ya sorğu parametri dəyişmir |
| İmplementasiya zəhməti | M |

---

## 8. Etiket və mətn dəyişiklikləri (task məhdudiyyəti #5)

Aşağıda təklif olunan **bütün** UI mətn dəyişiklikləri sadalanıb. Bu cədvəldən kənarda, sərbəst mətn içində qalan etiket təklifi yoxdur. Heç bir sətir API sahə adına, tip adına və ya kod identifikatoruna toxunmur.

| ID | Hazırkı etiket | Təklif olunan etiket | Səbəb | Fayl |
|---|---|---|---|---|
| E-01 | `Kassada olmalı` | `Kassada olmalı (bu gün)` | Sidebar rəqəminin dövrü və mənbəyi görünsün; Gün Sonu rəqəmindən fərqlənsin (`F-01`) | `src/routes/_app.tsx:168` |
| E-02 | `Kassada olmalı məbləğ` | `Kassada olmalı (bağlanışa qədər)` | Gün sonu önizləməsinin dashboard rəqəmindən fərqli əhatəsi olduğu bildirilsin (`F-01`) | `src/features/day-end/components/DayEndCard.tsx:187` |
| E-03 | `Kassada artıq məbləğ: X` | `Kassa uyğun gəlmir — X artıq çıxdı, yoxlayın` | Müsbət fərq uğur deyil, uçot xətasıdır (`F-02`) | `src/features/day-end/components/DayEndCard.tsx:236` |
| E-04 | `Qazanc %` | `Qazanc % (mayaya görə)` | Maya üzərindən əlavə ilə satış marjasının qarışdırılmasının qarşısını alır (`F-07`) | `src/features/products/components/ProductsTable.tsx:214`, `src/features/products/components/ProductForm.tsx:317`, `src/routes/_app.mallar_.$id.tsx:202` |
| E-05 | `Xalis qazanc` | `Satış qazancı (xərc çıxılmayıb)` | Rəqəm xərc çıxılmamış qazancdır; «xalis» sözü yanıldır (`F-27`) | `src/routes/_app.hesabatlar.tsx:154` |
| E-06 | `Bugünkü qazanc` | `Kağız üzərində qazanc (bu gün)` | `SignatureBand`-dakı eyni rəqəmlə vahid adlandırma (`F-06`) | `src/routes/_app.index.tsx:63` |
| E-07 | `Dashboard` (səhifə başlığı və `PageHead` subtitle) | `Ana səhifə` | Sidebar bəndi ilə eyni ad; ingilis sözü aradan qaldırılır (`F-52`) | `src/routes/_app.index.tsx:40, 48` |
| E-08 | `Filterlər` / `Filterləri təmizlə` / `Filterlər paneli` | `Süzgəclər` / `Süzgəcləri təmizlə` | Layihədə «filtr»/«filter» yazılışları qarışır; tək forma seçilir (`F-52`) | `src/components/ui/FilterBar.tsx:52-53`, `src/features/sales/components/SalesJournal.tsx:465-466`, `src/routes/_app.borclar.tsx:356-357` |
| E-09 | `Yekun` (jurnal sütun başlığı) | `Satış məbləği` | «Yekun» qismən ödənişdə alınan pul kimi başa düşülür; sütun isə tam satış məbləğidir (`F-13`) | `src/features/sales/components/SalesJournal.tsx:261` |
| E-10 | `X ödənilib` | `X ödənilib · Y qalıq` | Qismən ödənişin hər iki tərəfi eyni yerdə görünsün (`F-13`) | `src/features/sales/components/SalesJournal.tsx:272, 641`, `src/features/sales/components/SaleDetailDrawer.tsx:262` |
| E-11 | `Cəmi (filtrlənmiş):` | `Görünən xərclər cəmi` | Nisyə Borclar/Müştərilər səhifələrindəki «Görünən: …» dili ilə vahidləşir (`F-23`) | `src/routes/_app.xercler.tsx:190` |
| E-12 | `Maya qiyməti` (jurnal sütunu) | `Alış qiyməti (1 əd.)` | Sütun `purchasePricePerUnit`-i göstərir; «maya» real maya ilə qarışır (`F-52`) | `src/features/sales/components/SalesJournal.tsx:209` |
| E-13 | `Mənə borclular` | `Müştərilər mənə borcludur` | Qonşu etiketlə oxşarlıq azaldılır, istiqamət aydınlaşır (`F-52`) | `src/routes/_app.index.tsx:77` |
| E-14 | `Mənim borclarım` | `Mən təchizatçılara borcluyam` | Yuxarıdakı ilə cüt; kimə borc olduğu göstərilir (`F-52`) | `src/routes/_app.index.tsx:78` |
| E-15 | `Satılmayan mallar (pul dondurur)` | `Satılmayan mallar — pul burada donub` | Mötərizəli sistem dili əvəzinə sadə bazar dili (`F-52`) | `src/routes/_app.index.tsx:142` |
| E-16 | `naməlum` (qazanc dəyəri) | `hesablanmayıb` | «Naməlum» sistemin bilmədiyi kimi başa düşülür; səbəb mayanın girilməməsidir (`F-52`) | `src/features/sales/components/SalesJournal.tsx:245`, `src/features/sales/components/QuickSaleScreen.tsx:876, 882` |
| E-17 | `Sədərək Sistem` (login başlığı) | mağaza adı — `settings.storeName` dəyəri | Login ilə sidebar-dakı brend adı eyni olsun (`F-34`) | `src/routes/login.tsx:62` |
| E-18 | Xam `role` dəyəri (`sahib` / `Sahibkar` və s.) | `Sahibkar` / `Menecer` / `Satıcı` — sabit görünən adlar | Rejimdən asılı olmayan, vahid Azərbaycanca ad (`F-29`) | `src/features/employees/components/EmployeesTable.tsx:32`, `src/features/employees/components/SalaryCard.tsx:85` |
| E-19 | `Tarix seç` | `Başqa tarix` | Çipin digər çiplərdən (hazır dövrlər) fərqli davrandığı aydın olsun | `src/components/ui/PeriodFilter.tsx:299` |
| E-20 | `Detal` | `Ətraflı` | «Detal» texniki səslənir; sadə söz seçilir | `src/features/sales/components/SalesJournal.tsx:326, 695`, `src/features/customers/components/CustomersTable.tsx:64, 290` |
| E-21 | `Bu funksiya backend ilə əlavə olunacaq` | `Bu funksiya demo rejimində işləmir` | Toast mətni istifadəçiyə səbəbi izah etsin, texniki termindən qaçsın (`F-09`) | `src/routes/_app.mallar.tsx:135` |
| E-22 | `Gözlənilən` / `Faktiki` / `Fərq` | `Olmalı idi` / `Sayıldı` / `Fərq` | Mühasibat terminləri əvəzinə gündəlik dil (`F-02` konteksti) | `src/features/day-end/components/DayEndCard.tsx:116, 118, 121` |

---

## 9. Səhifələr üzrə tapıntı xəritəsi

| Səhifə | Route faylı | Tapıntılar |
|---|---|---|
| Ana səhifə (Dashboard) | `src/routes/_app.index.tsx` | F-01, F-03, F-04, F-05, F-06, F-22, F-40, F-52 |
| Mallar / Anbar | `src/routes/_app.mallar.tsx`, `src/routes/_app.mallar_.$id.tsx` | F-04, F-07, F-08, F-09, F-10, F-36, F-42, F-44, F-48 |
| Satış (kassa + jurnal + detal) | `src/routes/_app.satis.tsx` | F-04, F-09, F-11, F-12, F-13, F-14, F-15, F-36, F-38, F-40, F-48, F-49, F-50 |
| Müştərilər | `src/routes/_app.musteriler.tsx` | F-16, F-17, F-20, F-38, F-44, F-48, F-50 |
| Nisyə Borclar (2 görünüş) | `src/routes/_app.borclar.tsx` | F-04, F-18, F-19, F-20, F-23, F-38, F-44, F-47, F-48, F-50 |
| Təchizatçılar | `src/routes/_app.tedarukculer.tsx` | F-21, F-44, F-48 |
| Xərclər | `src/routes/_app.xercler.tsx` | F-22, F-23, F-40, F-48, F-49, F-52 |
| Gün Sonu | `src/routes/_app.gun-sonu.tsx` | F-01, F-02, F-22, F-24, F-25, F-44, F-49 |
| Hesabatlar | `src/routes/_app.hesabatlar.tsx` | F-03, F-04, F-26, F-27, F-28, F-40 |
| İşçilər (Maaşlar + Fəaliyyət) | `src/routes/_app.iscilar.tsx` | F-29, F-30, F-31, F-44 |
| Ayarlar | `src/routes/_app.ayarlar.tsx` | F-32, F-33 |
| Login | `src/routes/login.tsx` | F-34, F-37, F-42 |
| Qlobal (layout / dizayn sistemi) | `src/routes/_app.tsx`, `src/components/ui/*` | F-35, F-37, F-38, F-39, F-41, F-43, F-45, F-46, F-47, F-51 |

---

## 10. 10 ən vacib tapıntı (xülasə)

| # | ID | Ciddilik | İstifadəçi təsiri (bir cümlə) | Risk | Mərhələ | Tam təsvir |
|---|---|---|---|---|---|---|
| 1 | **F-01** | Kritik | Sidebar-dakı və Gün Sonu səhifəsindəki «Kassada olmalı» eyni gündə fərqli rəqəm göstərə bilər (fərqli endpoint, fərqli açılış qaydası, maaş ödənişlərinin yalnız birində nəzərə alınması) — sahibkar hansı rəqəmə inanacağını bilmir. | `R-01` | **1** | bölmə 2.1 |
| 2 | **F-02** | Kritik | Gün sonunda MÜSBƏT kassa fərqi yaşıl fon və yüksəliş ikonu ilə uğur kimi göstərilir, halbuki bu uçot xətasıdır — yazılmamış satış aylarla üzə çıxmır. | `R-02` | **1** | bölmə 2.8 |
| 3 | **F-03** | Kritik | Dashboard və Hesabatlar sorğu xətasında sonsuz spinner-də donur (`isError` budağı yoxdur) — istifadəçi üçün tətbiq «asılmış» görünür. | `R-03` | **1** | bölmə 2.1 |
| 4 | **F-22** | Yüksək | Eyni xərc məbləği 7 yerdə gah `−123` gah `123` kimi qırmızı verilir — istifadəçi işarə fərqində gizli məna axtarır və cəmləyərkən səhv edir. | `R-05` | **1** | bölmə 2.7 |
| 5 | **F-04** | Yüksək | Böyük məbləğlərdə KPI rəqəmləri kartdan daşır (`whitespace-nowrap`, `truncate` yoxdur) — pul rəqəmi yarımçıq oxunur. | `R-04` | **1** | bölmə 2.1 |
| 6 | **F-27** | Yüksək | Hesabatlardakı «Xalis qazanc» əslində xərc çıxılmamış satış qazancıdır — sahibkar real qazancı olduğundan yüksək qiymətləndirir. | `R-06` | **1** | bölmə 2.9 |
| 7 | **F-13** | Yüksək | Qismən ödənişli satış jurnalda, detalda və uğur ekranında 4 fərqli çərçivədə göstərilir — nisyə borcun izlənməsi çaşdırıcı olur. | `R-09` | **2A** | bölmə 2.3 |
| 8 | **F-11** | Yüksək | Barkod skanerinin `Enter`-i satış ekranında idarə olunmur — hər skandan sonra əlavə toxunuş tələb olunur və kassa tempi düşür. | `R-13` | **2B** | bölmə 2.3 |
| 9 | **F-50** | Yüksək | Tətbiqdə 6 fərqli axtarış davranışı var (topbar `Enter` ilə başqa səhifəyə keçir, digərləri yazdıqca süzür) — «axtarış» anlayışı hər ekranda başqa cür işləyir. | `R-17` | **2B** | bölmə 7 |
| 10 | **F-38** | Yüksək | Çiplər (≈30px), cədvəl düymələri (32px) və bağlama düymələri (40px) 44px toxunma minimumundan kiçikdir — barmaqla səhv düyməyə basma riski yüksəkdir. | `R-16` | **2B** | bölmə 4 |

Bu 10 bəndin hamısı yuxarıdakı əsas tapıntı siyahısında tam 9 sahə ilə mövcuddur və eyni siyahı sənədin əvvəlində «10 ən vacib tapıntı — tez baxış» başlığı altında da verilib. Hər 10 bənd yol xəritəsinin **ilk üç mərhələsində** (1, 2A, 2B) bağlanır — yəni ən vacib tapıntıların heç biri sonrakı mərhələlərə qalmır.

---

## 11. Problem aşkarlanmayan sahələr (nə yoxlanıldı)

Bu bölmə auditin əhatəsini tamamlayır — aşağıdakı sahələr yoxlanılıb və **yaxşı vəziyyətdə** qiymətləndirilib:

| Sahə | Nə yoxlanıldı | Nəticə |
|---|---|---|
| `PaymentConfirmModal` əlçatanlığı | `role="group"` + `aria-labelledby`, `aria-pressed`, `aria-invalid`, `aria-describedby`, `role="status" aria-live="polite"` qalıq borc bannerı, `focus-visible:ring-4` | Layihədə ən yüksək keyfiyyətli forma — digər komponentlər üçün etalon ola bilər |
| `PeriodFilter` popover davranışı | Portal + `role="dialog"`, fokusun popover-ə keçməsi və trigger-ə qayıtması, `Escape`, kənara klik, `resize`/`scroll` ilə mövqe yenilənməsi, `validateRange` xətası `role="alert"` ilə | Klaviatura və mövqe idarəsi düzgün qurulub |
| `Modal` fokus tələsi və yığın idarəsi | `openStack` simvol yığını, body scroll kilidi, Tab dövrü, `prevActive.focus()` bərpası | Düzgün; problem yalnız `Drawer`-in eyni davranışı təkrarlamamasıdır (`F-51`) |
| Pul formatlaşdırması | `fmtMoney`/`fmtMoneySigned`/`roundMoney`/`parseMoneyInput` (`src/lib/format.ts`), `tabular-nums` sinfinin cədvəllərdə ardıcıl istifadəsi | Tək mənbədən idarə olunur, qırılmaz boşluqla «₼» düzgün saxlanılır |
| Tarix hesablamaları | `todayISO()` lokal təqvim gününə keçirilib (UTC sürüşməsi şərhdə sənədləşdirilib), `period-filter-lib.ts` React-dən asılı deyil və test olunub | Düzgün; `period-filter-lib.test.ts` mövcuddur |
| URL-də vəziyyət saxlanması | Bütün əsas səhifələrdə zod `validateSearch` sxemləri; filtr, dövr, tab, drawer deep-link-ləri URL-dədir | Güclü tərəf — F5 sonrası vəziyyət itmir |
| Cədvəl sətir klikinin klaviatura dəstəyi | `DataTable.tsx:110-120, 215-227` — `Enter`/`Space` idarəsi + `e.target !== e.currentTarget` qoruyucusu (daxili düymələr öz funksiyasını icra edir) | Düzgün həll edilib |
| Rol əsaslı gizlətmə | `useCan()` + `CAPABILITIES` xəritəsi, `_app.iscilar.tsx`-də maaş bölməsinin tam gizlədilməsi, `DayEndCard`/`AyarlarPage` icazə blokları | Məntiq düzgün; yeganə problem mock rejimdə görünməməsidir (`F-09` konteksti) |
| `ExpenseRows` / `Accordion` | `grid-template-rows` keçidi ilə açılma, məzmunun DOM-da qalması (RHF sahələri sıfırlanmır), `aria-expanded`/`aria-controls` | Düzgün qurulub |
| `Select` xüsusi listbox | Portal, klaviatura naviqasiyası (`%` ilə dövrləmə), `aria` atributları | İşlək; yalnız fokus halqası `F-37` çərçivəsində vahidləşdirilməlidir |
