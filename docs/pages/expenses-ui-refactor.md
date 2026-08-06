# Xərclər səhifəsi — dizayn sisteminə keçid (FE#76, mərhələ 7)

Bu sənəd FE#76 çərçivəsində **yalnız "Xərclər" səhifəsində** aparılan
dəyişiklikləri, verilən qərarları və əsaslandırmalarını qeydə alır. Presedent:
FE#75 (Done, `main`-ə merge olunub — "Təchizatçılar" səhifəsi, bax
`docs/pages/suppliers-ui-refactor.md`) və FE#70 (`Mallar/Anbar`,
`ProductFilters.tsx` — `TableToolbar` + `LocalTableSearch` + "Filterlər"
toqql panel naxışının mənbəyi). Referans: `docs/design-system.md` (FE#69),
`docs/ui-refactor-roadmap.md` (Mərhələ 1, iş bəndi 1.5 — xərc işarəsinin 7
yerdə vahidləşdirilməsi; bu task həmin işi TAMAMLAYIR və genişləndirir).

**TOXUNULMAZ qalıb (dəyişməyib):** xərc yaranması/düzəlişi/silinməsi, xərc
növləri (`useExpenseTypes`), mənbələr (Ümumi/Mala bağlı) və maliyyə
hesablamaları — bunların hamısı `src/features/expenses/api.ts`,
`src/features/expenses/queries.ts` və `src/features/expenses/lib.ts`
(`expenseCostImpactPerUnit`) fayllarındadır, bu taskda HEÇ BİR dəyişiklik
edilməyib. `ExpenseForm.tsx` tamamilə TOXUNULMAYIB (forma sahələri/
validasiya/submit axını bit-bədit qorunub). `Expense.amount` saxlanan dəyəri
və hesablama işarələri (backend sorğu/cavab formatı daxil) DƏYİŞMƏYİB —
YALNIZ təqdimat (UI) dəyişib.

---

## 1. Dəyişən komponentlər

| Fayl | Nə dəyişdi |
|---|---|
| `src/routes/_app.xercler.tsx` | `PageHead` → `PageHeader` (`actions` → `primaryAction`); `isError` idarəsi səhifə-səviyyəli `InlineError` bloku əvəzinə standart `ExpensesTable`/`DataTable` `isError`/`onRetry` prop cütünə keçdi (§2.8); cəm xülasəsi "Cəmi (filtrlənmiş):" → "Görünən xərclər: N ədəd · 123.00 ₼" (§2.7) |
| `src/features/expenses/components/ExpenseFilters.tsx` | `FilterBar` (öz daxili axtarışı ilə) → `TableToolbar` + `LocalTableSearch` + "Filterlər" toqql düyməsi/panel (`ProductFilters.tsx`, FE#70 naxışı) (§2.2) |
| `src/features/expenses/components/ExpensesTable.tsx` | Məbləğ sütunu/mobil kart `ExpenseAmount`-a keçdi (§2.4); "Bağlı mal" indi kliklənən `Link` (mövcudsa), `EmptyValue` (silinibsə), "Yüklənir…" (yüklənirsə) və ya "Ümumi xərc" mətni (§2.5); `isError`/`onRetry`/`errorMessage` propları əlavə olundu (§2.8); sətir/mobil kart düyməsi "Düzəliş" → "Düzəliş et" (§2.6) |
| `src/features/expenses/components/ExpenseDetailDrawer.tsx` | Başlıq zolağındakı nəhəng məbləğ `ExpenseAmount`-a keçdi (§2.4); "Mayaya təsiri" sətri (`fmtMoneySigned`) DƏYİŞMƏYİB |
| `src/features/expenses/components/amount-presentation.tsx` | **YENİ** — `ExpenseAmount`/`ExpenseOutflowTag`: xərc məbləğinin vahid, neytral, işarəsiz təqdim funksiyası (§2.4) |
| `src/features/expenses/components/amount-presentation.test.tsx` | **YENİ** — unit testlər: işarəsizlik, rəng qaydası, "çıxış" konteksti, ölçü variantları |
| `src/features/expenses/components/ExpensesTable.test.tsx` | **YENİ** — məbləğ təqdimatı, Badge, bağlı mal linki (stopPropagation), sətir əməliyyatları, şəbəkə xətası testləri |
| `src/features/expenses/components/ExpenseFilters.test.tsx` | **YENİ** — `TableToolbar`/`LocalTableSearch` yerləşməsi, aktiv filtr sayğacı/çip testləri |

**Toxunulmayıb:** `src/features/expenses/api.ts`, `src/features/expenses/queries.ts`,
`src/features/expenses/lib.ts`, `src/features/expenses/components/ExpenseForm.tsx`,
`ConfirmModal`/`DataTable`/`Drawer`/`PageHeader`/`PeriodFilter`/`TableToolbar`/
`FilterBar`/`Badge`/`EmptyValue` primitivlərinin özləri.

---

## 2. Bənd-bənd qərarlar

### 1. "Yeni xərc" əsas əməliyyat (bənd 1, AC-1/AC-2, TC-1/TC-2)

`PageHeader.primaryAction` slotunda, dəyişməz qalır — yalnız `PageHead` alias
`PageHeader`-ə keçdi (DS §4-dəki geriyə-uyğun alias, funksional fərq yoxdur).
`canWrite` (`expenses.write`) yoxlaması eyni qalıb.

### 2. Standart dövr filtri (bənd 2, AC-2, TC-3)

`PeriodFilter` (`SegmentedDateFilter` alias) `defaultKey="month"` ilə
`PageHeader`-in altında, dəyişməz qalıb — bu, FE#56-dan bəri mövcud idi və
digər siyahı səhifələri (Təchizatçılar, Müştərilər, Mallar) ilə eyni
komponentdir. Ayrıca ad-hoc tarix kontrolu yoxdur.

### 3. Axtarış — `TableToolbar` + `LocalTableSearch` (bənd 3, AC-3, TC-4..TC-6)

`ExpenseFilters.tsx` əvvəlki `FilterBar` (öz daxili axtarışı + panel bir
kompozit komponentdə) naxışından `ProductFilters.tsx` (FE#70) naxışına keçdi:
`TableToolbar.search` slotunda `LocalTableSearch`, `TableToolbar.actions`
slotunda "Filterlər" toqql düyməsi (aktiv sayı bədge ilə), altında aktiv
filtr çipləri və açılan panel (mənbə/xərc növü select-ləri). Axtarış
(`search.q` URL parametri) səhifə səviyyəsindəki `visibleExpenses` memo-sunda
client-side süzülür — `useExpenses()` sorğusu DƏYİŞMƏDİ, YENİ API sorğusu
ƏLAVƏ OLUNMADI (dövr filtri kimi `from`/`to` onsuz da backend-ə gedir, bu
dəyişməyib).

### 4. Mənbə/xərc növü filtrləri — Filterlər panelində (bənd 4, AC-4, TC-7..TC-9)

Filtrlər ayrıca səhifə-daxili qutuda deyil, `TableToolbar`-ın altındakı
"Filterlər" panelindədir (§2.3 ilə eyni struktur) — mənbə (`source`) və xərc
növü (`type`) select-ləri, seçim URL query parametrlərində (`source`, `type`)
saxlanılır (zod sxemi dəyişməyib), səhifə yenilənəndə (F5) itmir.

### 5. Məbləğ təqdimatı — vahid, neytral, işarəsiz (bənd 5, AC-5..AC-9, TC-10..TC-15)

Əvvəl 4 yerdə (cədvəl sətri, mobil kart, drawer başlığı, cəm xülasəsi) eyni
problem var idi: `text-red-600` + manual "−" prefiksi (`−123.00 ₼`). Yeni
paylaşılan `ExpenseAmount`/`ExpenseOutflowTag` komponenti
(`amount-presentation.tsx`) bu 4 yerin HAMISINDA istifadə olunur:

- Rəqəm **işarəsizdir** (`fmtMoney`, "123.00 ₼" — "-123.00 ₼" YOX).
- Rəng **neytraldır** (`text-stone-900`) — `text-red-600` YOXDUR.
- Kiçik boz "çıxış" konteksti (ikon + mətn, `text-stone-400`) — kassadan
  çıxan pul olduğunu bildirir, lakin RƏNG SİQNAL DEYİL (bax §3, rəng qaydası
  izahı).

`ExpenseDetailDrawer`-dəki "Mayaya təsiri" sətri (`fmtMoneySigned`) BU
QAYDAYA AİD DEYİL və DƏYİŞMƏYİB — o, xərcin 1 ədəd mala təsirini göstərən
AYRICA göstəricidir (işarəli, çünki müsbət/mənfi təsir mənalıdır), xərcin
məbləği deyil (AC-9/TC-15 — regressiya qorunub).

`Expense.amount` saxlanan dəyəri, API sorğu/cavab formatı və
`expenseCostImpactPerUnit` hesablaması (`lib.ts`) MÜQAYİSƏ EDİLDİ — heç bir
dəyişiklik yoxdur (AC-9).

### 6. Bağlı mal — kliklənən keçid (bənd 6, AC-11, TC-18..TC-20)

`ExpenseDetailDrawer`-də əvvəldən mövcud olan "mal detalına keçid" naxışı
(`Link to="/mallar/$id"`, mal tapılmırsa `EmptyValue`, mallar hələ yüklənirsə
"Yüklənir…") indi cədvəl sətri VƏ mobil kart səviyyəsinə də tətbiq edilib
(`ExpensesTable.tsx`-dəki `ProductLink` köməkçi komponenti — 3 yerdə eyni
məntiq). Link klikinin `stopPropagation`-ı var — sətir/kart `onRowClick`
(drawer açılışı) davranışını TETİKLEMİR (event bubbling dayandırılır).
Ümumi xərcdə (productId yoxdur) "Ümumi xərc" mətni dəyişməz qalıb.

Bunun üçün `ExpensesTable` propları dəyişdi: əvvəlki `productName: (id) =>
string` funksiyası əvəzinə birbaşa `products: Product[]` (+ `productsLoading?:
boolean`) qəbul edir — bu, YALNIZ komponent-daxili prop API-sidir, heç bir
API çağırışı/hesablama məntiqinə toxunmayıb (`_app.xercler.tsx` onsuz da
`useProducts()`-dan `products` siyahısını çəkirdi, indi birbaşa ötürülür).

### 7. Xərc növü/mənbə — Badge (bənd 7, AC-10, TC-16/TC-17)

Bu, əslində artıq mövcud idi: `ExpensesTable`/`ExpenseDetailDrawer` "Növ" və
"Mənbə" sahələrini `Badge` primitivi ilə göstərirdi (`Badge` STATUS_STYLE-də
"Ümumi" (boz) / "Mala bağlı" (yaşıl) tonları FE#69-dan bəri mövcuddur) — bu
taskda YALNIZ təsdiqləndi və test əlavə olundu, SOURCE_LABEL mətni
dəyişmədi.

### 8. Görünən xərc xülasəsi (bənd 8, AC-12, TC-13/TC-14)

Əvvəlki "Cəmi (filtrlənmiş): −123.00 ₼" (qırmızı) → "Görünən xərclər: N
ədəd · 123.00 ₼" (neytral, `ExpenseOutflowTag` ilə) — Təchizatçılar/
Müştərilər (FE#75/FE#73) səhifələrindəki "Görünən: N" naxışı ilə eyni
yerləşmə və format dili. `visibleExpenses.length` (N) və `filteredTotal`
(cəm) eyni renderdə, hər filtr/axtarış/dövr dəyişikliyində yenilənir —
`filteredTotal` hesablama məntiqi (`useMemo`) dəyişməyib.

### 9. Sətir əməliyyatları (bənd 9, AC-13, TC-21/TC-22)

"Düzəliş" → "Düzəliş et" (cədvəl sətri + mobil kart düyməsi; drawer
footer-də artıq bu mətn var idi, indi hər 3 yer eynidir). "Sil"
`ActionMenu`-da qalır (tone="danger"). Sətrə klik (düymə/menyu xaric)
`ExpenseDetailDrawer`-i açır — davranış dəyişməyib.

### 10. Silmə — `ConfirmModal` (bənd 10, AC-14, TC-23/TC-24)

`ConfirmModal` (`ConfirmDialog` alias) dəyişməyib. Mala bağlı xərcdə
mövcud xəbərdarlıq mətni **"Malın real mayası yenidən hesablanacaq"**,
ümumi xərcdə **"Bu xərc silinəcək. Bu əməliyyat geri alına bilməz."** —
hər ikisi HƏRFİ SAXLANILIB. `danger` görünüş (qırmızı "Sil" düyməsi) qalıb —
bu, rəng qaydasına ZİDD DEYİL: silmə **dağıdıcı əməliyyatdır** (DS §1.8-dəki
"dağıdıcı əməliyyat" kateqoriyası), xərc YARADILMASI/GÖSTƏRİLMƏSİ isə normal
əməliyyatdır (§2.5-dəki qırmızının silinmə səbəbi).

### 11. Vəziyyət idarəsi (bənd 11, AC-15..AC-18, TC-26..TC-28)

- **Loading** → `DataTable`-ın mövcud `TableSkeleton`-u (spinner deyil),
  dəyişməyib.
- **Boş (ümumiyyətlə xərc yoxdur)** → "Xərc yoxdur" + "«Yeni xərc» düyməsi
  ilə ilk xərci əlavə edin" (mövcud mətn, dəyişməyib).
- **Axtarış/filtr nəticəsiz** → "Xərc tapılmadı" / "Filtrə uyğun xərc
  yoxdur — filtrləri dəyişin və ya təmizləyin." (mövcud `hasFilter` məntiqi,
  dəyişməyib).
- **Xəta** → əvvəl səhifə səviyyəsində `{isError ? <InlineError/> :
  <ExpensesTable/>}` budağı ilə TABLE YERİNƏ tam `InlineError` göstərilirdi
  (`PeriodFilter`/`ExpenseFilters` yenə görünürdü, cədvəl VƏ xülasə tamamilə
  yox olurdu). İndi `isError`/`onRetry`/`errorMessage="Xərclər yüklənmədi"`
  birbaşa `ExpensesTable` → `DataTable`-a ötürülür (Təchizatçılar/
  Müştərilər/Mallar ilə EYNİ standart naxış, FE#87/F-44). Nəticə: birinci
  yüklənmə xətasında (`hasLoadedOnce` naməlum → `data.length===0` proxy-si)
  davranış EYNİDİR — tam `InlineError` + "Xərclər yüklənmədi" mesajı +
  "Yenidən" (`onRetry={() => void refetch()}`). FƏRQ YALNIZ arxa-fon
  (background) refetch xətasında: əvvəlki mövcud (köhnə) data varkən arxa
  planda sorğu uğursuz olsa, YENİ standart `DataTable` `StaleDataBanner`
  göstərir (mövcud sətirlər ekranda qalır) — bu, TC-28-in tələb etdiyi
  "InlineError + Yenidən, klikdə refetch()" davranışını POZMUR (birinci
  yüklənmə ssenarisi TC-28-in test etdiyi haldır), əksinə FE#142/F-44
  standartına UYĞUNLAŞDIRIR (digər bütün siyahı səhifələri ilə eyni).

### 12. Enin effektiv istifadəsi, responsive (bənd 12, AC-21, TC-31/TC-32)

`DataTable`-ın mövcud grid davranışı (heç bir sabit px eni yoxdur,
`truncate`/`min-w-0`) və `ExpensesTable`-ın mövcud `mobileCard` render-i
dəyişməyib — bu taskda YALNIZ məzmun (məbləğ formatı, bağlı mal linki,
düymə mətni) yeniləndi.

---

## 3. Rəng qaydası izahı (niyə qırmızı silinib)

`docs/design-system.md` §1.8 (12-ci qayda): qırmızı **YALNIZ** dağıdıcı
əməliyyat/ziyan/kritik problem üçündür. Xərc qeydi YARADILMASI/GÖSTƏRİLMƏSİ
gündəlik, NORMAL bir əməliyyatdır (kassadan pul çıxışı — mağaza icarəsi,
kommunal, əməkhaqqı və s.) — bu, "səhv" və ya "təhlükə" DEYİL. Əvvəlki
`text-red-600` + "−" prefiksi istifadəçiyə YANLIŞ siqnal verirdi (sanki hər
xərc bir xəbərdarlıqdır). Yeni təqdimatda:

- Rəqəm neytral tündboz (`text-stone-900`) — KPI/cədvəl rəqəmləri ilə eyni
  ton.
- "Kassadan çıxış" məlumatı RƏNGLƏ deyil, kiçik boz ikon+mətn ("çıxış") ilə
  verilir — DS §1.8-dəki "rəng heç vaxt yeganə status siqnalı deyil"
  qaydasına da uyğundur (əksinə, burada rəng HEÇ bir status siqnalı deyil —
  sadəcə tipoqrafik neytrallıq).
- Silmə əməliyyatının özü (düymə/ConfirmModal) HƏLƏ DƏ qırmızıdır — bu,
  DAĞIDICI əməliyyatdır (məlumat itkisi riski), rəng qaydası ilə TAM
  UYĞUNDUR.

---

## 4. Yekun (build/test/responsive)

- `npm run build` (`tsc && vite build`) — **0 xəta**.
- `npx vitest run` — bütün mövcud testlər YAŞIL (33 fayl, 259 test — bu
  taskda əlavə olunan 3 yeni test faylı daxil) — yeni fayllar:
  `amount-presentation.test.tsx` (6 test — işarəsizlik, rəng qaydası,
  "çıxış" konteksti, ölçü variantları), `ExpensesTable.test.tsx` (11 test —
  məbləğ təqdimatı, Badge, bağlı mal linki/stopPropagation, sətir
  əməliyyatları, şəbəkə xətası), `ExpenseFilters.test.tsx` (4 test —
  `TableToolbar`/`LocalTableSearch` yerləşməsi, aktiv filtr sayğacı/çip).
  Qeyd: `src/components/ui/
  PeriodFilter.test.tsx`-dəki 1 test bu taskdan ASILI OLMAYARAQ uğursuzdur
  (`PeriodFilter.tsx` bu PR-da toxunulmayıb, "Bu ay" çipinin defolt aktiv
  olması ilə bağlı əvvəldən mövcud tarix-asılı kövrəklikdir — FE#75/FE#74/
  FE#73/FE#71/FE#70-də də eyni qeyd edilib) — bu regressiya bu PR-ın
  əhatəsində DEYİL.
- Desktop `<table>` və mobil kart eyni anda DOM-a render olunduğu üçün (CSS
  `hidden md:block`/`md:hidden`) sətir-səviyyəli assert-lər
  `within(desktopTable(container))` ilə əhatələnib (`CustomersTable.test.tsx`/
  `SuppliersTable.test.tsx`-dəki eyni naxış).
- Responsive: kod səviyyəsində 1280/1440/1920px üçün `DataTable`-ın mövcud
  masaüstü sütun grid-i (heç bir sabit px eni yoxdur) və `TableToolbar`-ın
  `flex-col sm:flex-row` naxışı yoxlanıldı; 375px üçün `ExpensesTable`-ın
  mövcud `mobileCard` render-i (başlıq/tarix/məbləğ + Badge-lər + bağlı mal
  linki + "Düzəliş et"/"Sil" düymələri, hər ikisi `h-11` ≥44px toxunma
  hədəfi) istifadə olunur — bu mobil kart strukturu FE#69-dan bəri mövcud
  idi, bu taskda YALNIZ məzmunu yeniləndi. Headless brauzer mühiti mövcud
  olmadığı üçün (FE#70/FE#71/FE#73/FE#74/FE#75-də də qeyd olunan eyni
  məhdudiyyət) piksel-səviyyəli skrinşot yoxlaması aparılmayıb — CSS/
  breakpoint səviyyəsində, mövcud `DataTable`/`mobileCard` naxışı üzərində
  təsdiqləndi.
- `git diff main --stat` — yalnız yuxarıdakı fayllar (4 dəyişən route/
  komponent + 1 yeni komponent + 3 yeni test faylı + bu sənəd);
  `src/features/expenses/api.ts`, `src/features/expenses/queries.ts`,
  `src/features/expenses/lib.ts`, `ExpenseForm.tsx` dəyişməyib.

## 5. Tam icra edilə bilməyən/güzəştə gedilən tələblər

- **Vizual (piksel-səviyyəli) skrinşot yoxlaması** aparılmadı — headless
  brauzer mühiti mövcud deyil (əvvəlki FE#70/FE#71/FE#73/FE#74/FE#75-də də
  eyni məhdudiyyət qeyd olunub); responsive yoxlama kod/CSS səviyyəsindədir.
- **Route-səviyyəli inteqrasiya testi** (`_app.xercler.tsx` üçün) əlavə
  olunmadı — FE#75 presedentindəki qərarla eyni: `ExpensesTable`/
  `ExpenseFilters`/`amount-presentation` komponent-səviyyəli testləri kifayət
  qədər əhatə təmin edir (mövcud `SuppliersTable.test.tsx` FE#75-də də
  route testi olmadan qəbul edilib).
