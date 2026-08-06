# QA Hesabatı — FE#73 (Müştərilər səhifəsi — dizayn sisteminə keçid, mərhələ 4)

| | |
|---|---|
| **Task** | FE#73 |
| **Issue** | https://github.com/RemziBalakishiyev/MayaPro/issues/73 |
| **PR** | https://github.com/RemziBalakishiyev/MayaPro/pull/166 |
| **Branch** | `task/FE73-musteriler-refactor` |
| **HEAD commit** | `725c529` — "refactor(ui): musteriler sehifesi dizayn sistemine kecid" |
| **QA tarixi** | 2026-08-06 |
| **Mühit** | Windows 11 · Node/Vite 6.4.3 · Vitest 4.1.10 · statik kod analizi (headless brauzer mühiti mövcud deyil — əvvəlki FE#69/70/71/72 QA dövrlərində istifadə olunan eyni metodologiya) |

---

## 1. Yekun verdikt

> ### ✅ PASS

13/13 acceptance criteria (issue #73 body-də sadalanan tələblər) kod
səviyyəsində müstəqil təsdiqləndi, mövcud + yeni test dəsti (194/194) yaşıldır,
`npm run build` 0 xəta ilə bitir. Nisyə Borclar səhifəsində (`_app.borclar.tsx`)
paylaşılan komponentlər üzərindən aparılan MÜSTƏQİL regressiya yoxlaması bug
tapmadı. Bug tapılmadı — heç bir bug taskı yaradılmadı.

| Kateqoriya | Keçdi | Keçmədi |
|---|---|---|
| Acceptance Criteria (13) | 13 | 0 |
| Nisyə Borclar regressiya | ✅ PASS | — |

---

## 2. Build və test nəticəsi

```
npm run build   → ✅ tsc && vite build, exit 0 (built in 5.15s, 2813 modul)
npx vitest run  → ✅ 25 test faylı / 194 test, hamısı yaşıl (10.21s)
```

`git diff origin/main...task/FE73-musteriler-refactor --stat` → 9 fayl
dəyişib: `src/routes/_app.musteriler.tsx`,
`src/features/customers/components/{CustomersTable.tsx,CustomersTable.test.tsx,
CustomerDrawer.tsx,debt-presentation.ts (yeni),debt-presentation.test.ts (yeni)}`,
`src/components/ui/Badge.tsx`, `docs/pages/customers-ui-refactor.md`,
`docs/ui-terminology.md`. `PaymentModal.tsx`, `NewCustomerModal.tsx`,
`EditCustomerModal.tsx`, `src/routes/_app.borclar.tsx`,
`OpenDebtsTable.tsx`/`OpenDebtsView.tsx`/`DebtsKpiCards.tsx`/`DebtViewToggle.tsx`
— DİFF-DƏ YOXDUR (dəyişməyib), müstəqil `git diff` ilə birbaşa təsdiqləndi.

---

## 3. Acceptance Criteria nəticələri (issue #73 body, 13 bənd)

| AC | Nəticə | Sübut |
|---|---|---|
| **AC-1** — "Yeni müştəri" əsas əməliyyat qalır | ✅ Keçdi | `_app.musteriler.tsx:117-129` — `PageHeader.primaryAction` olaraq dəyişməyib. |
| **AC-2** — Axtarış + sürətli filtrlər bir standart toolbar-da | ✅ Keçdi | `_app.musteriler.tsx:137-189` — tək `<TableToolbar search={...} actions={...} />`, `search` slotunda `LocalTableSearch`, `actions` slotunda seqment düymələri. |
| **AC-3** — Checkbox → [Hamısı]/[Borcu olanlar] seqment, URL-də əks olunur | ✅ Keçdi | `_app.musteriler.tsx:150-187` — `role="tablist"`/`role="tab"` + `aria-selected`, `onlyDebtors` URL parametri (`searchSchema`, sətir 31) ilə naviqasiya edir; köhnə checkbox tam silinib. |
| **AC-4** — Ad/telefon axtarışı qorunur | ✅ Keçdi | `_app.musteriler.tsx:66-80` — `filtered` `useMemo`-da `c.name`/`c.phone` + `phoneDigits` normalizasiyası ilə filtrasiya dəyişməyib (yalnız görünüş — bənd 3 — dəyişib). |
| **AC-5** — Ad sahəsinin bütövü kliklənən → CustomerDrawer | ✅ Keçdi | `CustomersTable.tsx:190-203` (desktop) və `:330-339` (mobil) — ad indi `<button onClick={() => onView(c)}>`, `aria-label`/`title` ilə. Unit testlə təsdiqləndi: `CustomersTable.test.tsx` "ad sahəsinə klik onView-i çağırır" → ✅ yaşıl. |
| **AC-6** — Mövcud CustomerDrawer detal kimi (yenisi yaradılmayıb), 4 bölmə standart kart üslubunda | ✅ Keçdi | `CustomerDrawer.tsx` — eyni fayl/komponent (yeni fayl yaradılmayıb). 4 bölmə mövcuddur: "Əlaqə" (sətir 196-215, indi başlıqlı `rounded-card` panel), "Aldığı mallar" = alış tarixçəsi (sətir 224-294, `rounded-card`), "Borc / ödəniş tarixçəsi" = vahid xronoloji borc+ödəniş tarixçəsi (sətir 296-411, `rounded-card`), "Qalıq borc" əsas panel 4-dərəcəli tonda (sətir 166-194). Ayrılmamış vahid tarixçə qərarı sənədləşdirilib və əsaslandırılıb (`customers-ui-refactor.md` §2 bənd 6) — hər qeyd artıq ikon+rəng+badge ilə növünə görə fərqlənir (DS 9-cu qaydaya uyğun). |
| **AC-7** — "Ödəniş" → "Borc ödənişi al" | ✅ Keçdi | `CustomersTable.tsx:150-159` (desktop sətir düyməsi) və `:361-368` (mobil kart) — mətn "Borc ödənişi al", `aria-label`/`title` = `"{ad} — borc ödənişi al"`. Test: "'Ödəniş' sözü artıq görünmür" (`queryByText("Ödəniş")` → not in document) → ✅ yaşıl. |
| **AC-8** — Yeni ödəniş axını yaradılmayıb, mövcud PaymentModal | ✅ Keçdi | `git diff origin/main...task/FE73-musteriler-refactor -- src/features/customers/components/PaymentModal.tsx` → **BOŞ ÇIXIŞ** (fayl heç toxunulmayıb). `onPay(customer)` çağırışı `_app.musteriler.tsx:200` (`setPayFor`) → `<PaymentModal open={!!payFor} customer={livePayFor} />` (sətir 244-248), dəyişməyib. |
| **AC-9** — Borc rəngi: neytral/tünd + "borclu" badge, GECİKMİŞ narıncı, qırmızı yalnız kritik, rəng tək göstərici deyil | ✅ Keçdi | `debt-presentation.ts` — 4 dərəcəli `debtTone()`: `none` (boz), `normal` (tünd neytral `text-stone-800` + "Borclu" sakit sky badge, **qırmızı DEYİL**), `overdue` (60-119 gün, kəhrəba/`TONE_TEXT.warning` + "Gecikmiş borc" badge), `critical` (120+ gün, qırmızı/`TONE_TEXT.danger` + "Kritik borc" badge — **YALNIZ bu halda qırmızı**). Rəng HEÇ VAXT yeganə siqnal deyil — hər tonda fərqli mətnli badge də var (`DEBT_TONE_LABEL`). Unit testlərlə (`debt-presentation.test.ts`, 10 test) və inteqrasiya testləri ilə (`CustomersTable.test.tsx` — "adi borclu... rəqəm QIRMIZI DEYİL", "60+ gün... 'Gecikmiş borc'", "120+ gün... 'Kritik borc' (qırmızı YALNIZ bu halda)") təsdiqləndi. **Qeyd (bug deyil, §4-OBS-1-ə bax):** "60+ gün" yaş hesablaması müştəri-aqreqat sahələrindən (son ödəniş/alış/yaradılma tarixi) təxmini hesablanır, backend-in mənbə-üzrə dəqiq `OpenDebt.daysOld`-undan deyil — sənədləşdirilib, PM təsdiqi tövsiyə olunur. |
| **AC-10** — Sıfır ("0.00 ₼") ilə mövcud olmayan ("—") dəyərlər vizual fərqli | ✅ Keçdi | `CustomersTable.tsx:75-77` — `tone === "none"` (borc ≤ 0) halında `fmtMoney(debt)` → **"0.00 ₼"** göstərir (boz `text-stone-500`), "—" YOX. Həqiqətən mövcud olmayan tarix xanaları (`lastPurchaseDate`/`lastActivity`) `EmptyValue` (`—` + `sr-only` `aria-label`) ilə göstərilir (sətir 253, 263). Test: "borcu 0 olan müştəri '0.00 ₼' göstərir, '—' YOX" → ✅ yaşıl. |
| **AC-11** — Hər üç-nöqtə menyusu/ikon əməliyyatı əlçatan etiketli | ✅ Keçdi | "Borc ödənişi al" düyməsi: `aria-label`+`title` (sətir 153-154, 363-364); ad düyməsi: `aria-label`+`title` (sətir 196-197, 334-335); mobil "Detal" düyməsi: `aria-label`+`title` (sətir 371-372); WhatsApp qaimə düyməsi (`CustomerDrawer.tsx:272`): `aria-label`; "Nisyə borcu sil" düyməsi (`CustomerDrawer.tsx:399`): `aria-label`. `ActionMenu` triqqeri: `aria-label={"{ad} əməliyyatları"}` ötürülür (`CustomersTable.tsx:160`, `:409`), `ActionMenu.tsx:199` daxili qaydası ilə `title` avtomatik eyni mətnlə dolur (`triggerLabel` verilmədikdə `title = ariaLabel`) — kod oxunaraq təsdiqləndi. |
| **AC-12** — Səhifələmə/nəticə sayı standartlaşıb | ✅ Keçdi | `DataTable.tsx` — `TablePagination` avtomatik render olunur (`hidePagination` `CustomersTable`-dan ötürülmür → defolt `false`, sətir 347-348). Əlavə olaraq `_app.musteriler.tsx:216-230` — cari filtrə uyğun "Görünən: N müştəri · X ₼" xülasə sətri (Nisyə Borclar səhifəsi ilə eyni üslubda), `TablePagination`-ın ÜMUMİ sayından fərqli yerdə/mənada (qarışdırılmır). |
| **AC-13** — Loading/boş/nəticəsiz/xəta paylaşılan primitivlərlə | ✅ Keçdi | `DataTable.tsx` — `TableSkeleton` (loading), `InlineError`+"Yenidən" (`isError`), `EmptyState` (boş/nəticəsiz) — `CustomersTable`-dan heç bir yeni/təkrar primitiv yaradılmayıb, mövcud olanlar çağırılır. Regressiya testləri (`CustomersTable.test.tsx` "şəbəkə xətası (FE#87)" bloku, 3 test) yaşıl qalıb. |

---

## 4. Nisyə Borclar (`_app.borclar.tsx`) — MÜSTƏQİL regressiya yoxlaması

Developer/Senior sənədində (`customers-ui-refactor.md` §3) iddia edilən
"toxunulmayıb" statusunu **özüm təkrar yoxladım** (kodu təkrar oxumaqla, developer
qeydinə etibar etmədən), aşağıdakı 4 addımla:

1. **Route faylının özü dəyişməyib:**
   `git diff origin/main...task/FE73-musteriler-refactor -- src/routes/_app.borclar.tsx`
   → **BOŞ ÇIXIŞ**. Faylın tam məzmunu oxundu (640 sətir) — `mode="borclar"`
   görünüşü (`OpenDebtsView`) və `mode="musteri"` görünüşü (`CustomersTable`,
   `variant` prop-u ötürülmür → defolt `"debtors"`) strukturu, filtrasiya
   məntiqi (`status`/`minDebt`/`maxDebt`/`activity`/`phone`/`initial`),
   `DebtsKpiCards`, `DebtViewToggle`, `PaymentModal`/`CustomerDrawer` çağırışları
   FE#73-dən ƏVVƏLKİ İLƏ EYNİDİR.
2. **Paylaşılan komponentlərə birbaşa bağlı fayllar toxunulmayıb:**
   `git diff origin/main...task/FE73-musteriler-refactor -- OpenDebtsTable.tsx DebtsKpiCards.tsx DebtViewToggle.tsx OpenDebtsView.tsx`
   → **BOŞ ÇIXIŞ** (4 fayl da). `OpenDebtsTable.tsx`-də "Ödəniş al" mətni
   (sətir 142, 232) — Müştərilər səhifəsindəki yeni "Borc ödənişi al"-dan
   TƏSİRLƏNMƏYİB, ayrıca sabit qalıb (`onPay` çağırışı dəyişməyib).
3. **`CustomersTable`/`CustomerDrawer` prop kontraktı qorunub:** `_app.borclar.tsx`-in
   `CustomersTable`-a ötürdüyü bütün proplar (`customers`, `isLoading`, `isError`,
   `onRetry`, `canEdit`, `canDelete`, `embedded`, `onView`, `onPay`, `onEdit`,
   `onDelete`, `emptyState`) dəyişməz qalıb; `variant` prop-u ötürülmədiyi üçün
   defolt `"debtors"` istifadə olunur → "Qalıq borc" sütununda badge
   TƏKRARLANMIR (`withBadge={variant === "all"}` → Borclar-da həmişə `false`),
   Status sütunu ayrıca göstərir — bu, `CustomersTable.test.tsx`-dəki
   `"'debtors' variantında... TƏKRARLANMIR"` testi ilə (mənim tərəfimdən ayrıca
   `npx vitest run --reporter=verbose src/features/customers` icra edilərək)
   ✅ yaşıl təsdiqləndi.
4. **Test suite:** `src/features/customers/` altındakı bütün 4 test faylı
   (`debt-presentation.test.ts`, `DebtsKpiCards.test.tsx`,
   `CustomersTable.test.tsx`, `OpenDebtsView.test.tsx`) — 38/38 test yaşıl,
   o cümlədən `OpenDebtsView.test.tsx` (Nisyə Borclar "Borclar" görünüşünün
   birbaşa test faylı: "Ümumi qalıq borc" göstəricisi, axtarış+cəm sətri,
   telefonu olmayan müştəri sətri, şəbəkə xətası halları) — **hamısı
   regressiyasız keçdi**.

**Nəticə: PASS.** Nisyə Borclar səhifəsinin funksionallığı (borc siyahısı,
ödəniş qəbulu axını `onPay`→`PaymentModal`, filtrlər, KPI-lar) kod
səviyyəsində pozulmayıb. Vizual (piksel-səviyyəli, real brauzerdə) yoxlama bu
mühitdə mümkün olmadı (§5-ə bax) — bu, FE#69-dan bəri təkrarlanan məhdudiyyətdir,
FE#73-ə xas deyil.

---

## 5. Qeydlər (bug deyil)

### OBS-1 — "60+ gün gecikmiş" hesablamasının mənbəyi PM tələbindəki dəqiq mənbədən fərqlidir (developer tərəfindən artıq sənədləşdirilib)

- **Status:** Bug DEYİL — funksional qırılma yoxdur, yalnız "dəqiqlik dərəcəsi"
  fərqi. `debt-presentation.ts`-də `debtAgeDays()` müştəri-səviyyəli **son
  ödəniş/son alış/yaradılma tarixindən** ən yenisini istifadə edir; backend-in
  mənbə-üzrə dəqiq `OpenDebt.daysOld`-u (`GET /api/customers/open-debts`) bu
  hesablamaya qatılmayıb (yeni API sorğusu əlavə etməmək üçün şüurlu qərar,
  `customers-ui-refactor.md` §2 bənd 9-da ətraflı izah olunub).
- **Təsir:** Az sayda kənar halda (məs. müştərinin son ödənişi köhnə, lakin
  YENİ nisyə borcu təzə yaranıbsa) "Gecikmiş"/"Kritik" ton, faktiki ən yeni
  borcun yaşından fərqli görünə bilər. Bu, PM-in hərfi tələbini ("GECİKMİŞ
  60+ gün") 1:1 əvəz etmir, TƏXMİNİ formasıdır.
- **Tövsiyə:** PM-dən konkret təsdiq alınsın — ya bu təxmini qəbul edilir
  (mövcud limitasiya kimi sənədləşdirilmiş vəziyyətdə qalır), ya da gələcək
  bir taskda `useOpenDebts` sorğusu müştəri-aqreqat səviyyəsinə də bağlanıb
  dəqiq `daysOld` istifadə olunur. Bu, FE#73-ü BLOKLAMIR (developer artıq
  şüurlu, sənədləşdirilmiş güzəşt kimi qeyd edib, DS-in "danger yalnız ən ağır
  halda" prinsipinə hələ də uyğundur).

### OBS-2 — "120 gün kritik" həddi PM tələbində rəqəm kimi verilməyib

- **Status:** Bug DEYİL — DS-in "qırmızı yalnız kritik hallarda" prinsipinə
  uyğun, 60 günün qatı olaraq seçilib (`debt-presentation.ts` şərhi,
  sətir 156-161). Sərbəst seçilmiş həddir, PM-in konkret bir rəqəm verməməsi
  səbəbilə. QA/PM-in gələcəkdə bu rəqəmi bir daha təsdiqləməsi tövsiyə olunur.

### OBS-3 — Vizual (piksel-səviyyəli) skrinşot yoxlaması aparılmadı

- Bu mühitdə headless brauzer/Playwright quraşdırılmayıb (FE#69/70/71/72
  QA dövrlərində də eyni məhdudiyyət qeyd olunub). Bütün AC-lər kod
  səviyyəsində (Tailwind sinifləri, komponent strukturu, `git diff`) və unit/
  inteqrasiya testləri ilə təsdiqləndi. Responsive (375px mobil kart, 1280+
  desktop cədvəl) breakpoint məntiqi kod səviyyəsində düzgün görünür, lakin
  real brauzerdə piksel-dəqiq təsdiq gələcək dövrə saxlanılır (developer
  sənədində də eyni tövsiyə var).
- Bu, FE#73-ə xas yeni risk deyil — mövcud metodologiya davam etdirilib.

---

## 6. Yekun qərar

Bütün 13 AC PASS, Nisyə Borclar regressiyası PASS, build/test təmiz.
Bug tapılmadı → bug taskı yaradılmadı.

**Tövsiyə:** Task **Done** statusuna keçirilə bilər, PR #166 `main`-ə merge
edildikdən sonra (Qızıl qayda #5 — "Merge qapısı": issue yalnız PR MERGED
olduqdan sonra Done olmalıdır).
