# Gün Sonu Bağlanış səhifəsi — dizayn sisteminə keçid (FE#77)

Bu sənəd FE#77 çərçivəsində **yalnız "Gün Sonu"** səhifəsində aparılan
dəyişiklikləri, terminologiya qərarını (xüsusən sidebar/Gün Sonu "Kassada
olmalı" ambiqivliyi, `R-01`/`F-01`) və əsaslandırmalarını qeydə alır.
Asılılıq: FE#76 (Done, `main`-ə merge — "Xərclər" səhifəsi). Referans:
`docs/design-system.md` (FE#69), `docs/ui-ux-risk-register.md` (`R-01`,
`R-02` — kassa fərqi tapıntısı), `docs/ui-refactor-roadmap.md` (Mərhələ 1,
iş bəndi 1.1/1.2 — bu task onları TAMAMLAYIR), `docs/ui-ux-current-state-audit.md`
(`E-01`, `E-02`, `E-03`, `E-22`).

**Bu, MALİYYƏ BAXIMINDAN HƏSSAS bir iş axınıdır.** TOXUNULMAZ qalıb
(dəyərləri/hesablama məntiqi/API sorğusu DƏYİŞMƏYİB): kassa hesablamaları
(`src/features/day-end/lib.ts` — `expectedCash()`/`difference()`), açılış
qalığının seçilmə qaydası (son bağlanışın faktiki məbləği), satış cəmləri
(`useSummary("today")`), xərclər, maaş ödənişləri inteqrasiyası (backend
BE#28/BE#33), bağlanış məntiqi (`useCloseDay` → `POST /api/closings`
payload-u: `openingCash`/`actualCash`/`note`, dəyişməyib), API sorğuları
(`src/features/day-end/api.ts`, `src/features/reports/api.ts` — heç bir
endpoint yolu/parametr dəyişməyib) və tarixi qeydlər (`useClosings()`,
`ClosingHistory`-nin göstərdiyi məlumat). Bütün dəyişikliklər YALNIZ
təqdimat (UI) qatındadır.

---

## 1. Dəyişən komponentlər

| Fayl | Nə dəyişdi |
|---|---|
| `src/features/day-end/components/DayEndCard.tsx` | Tam UI refactor: iş axını 3 nömrələnmiş mərhələ kartına bölündü (§2.2); "Kassada olmalı məbləğ" → "Bu günün sonunda kassada olmalı" (qabarıq, böyük rəqəm, §2.1/§2.4); işçi maaş ödənişləri sətri əlavə olundu (§2.5, informativ, hesablamaya toxunmur); "Faktiki sayım" kartı ikiyə bölündü (② yalnız input, ③ fərq+qeyd+düymə); "Fərqin səbəbini qeyd et" **istəyə bağlı** `Textarea` əlavə olundu (§2.9); "Günü bağla" deaktivdirsə səbəb yazılır (§2.7); `ConfirmModal.message` strukturlaşdırıldı (Olmalı idi/Sayıldı/Fərq/Tarix + "dəyişdirilə bilməz" xəbərdarlığı, §2.8); `doClose()` artıq xətanı UDMUR — `ConfirmModal`-ın `error`/`isPending` proplarından istifadə edir, 409 "artıq bağlanıb" halında `todayClosing` sorğusu yenilənir (§2.12); "Gözlənilən"/"Faktiki" → "Olmalı idi"/"Sayıldı" (`E-22`, §2.11) |
| `src/features/day-end/components/DayEndCard.test.tsx` | **YENİ** — 11 test: 3 mərhələli struktur, oxunan dəyərlərin input olmaması, deaktiv səbəbi, fərq semantikası (müsbət/mənfi/sıfır), `ConfirmModal` strukturlaşdırılmış mesajı, istəyə bağlı qeyd, 409 xəta axını, artıq-bağlanıb xülasə kartı, icazəsiz istifadəçi kilidi |
| `src/features/day-end/components/ClosingHistory.tsx` | Sütun başlıqları `E-22`: "Gözlənilən" → "Olmalı idi", "Faktiki" → "Sayıldı" (§2.11). `expectedCash`/`actualCash` sahələri, sıralama və fərq rəngi (FE#69, dəyişməyib) |
| `src/features/reports/api.ts` | `SummaryData` interfeysinə **OPTIONAL** `salaryExpenses?: number` sahəsi əlavə olundu — backend `SummaryDto.salaryExpenses`-i (BE#33, artıq mövcud, additiv sahə) frontend tipinə açır, `generalExpenses`/`productExpenses` ilə EYNİ fallback qaydası. Heç bir sorğu/URL/parametr dəyişməyib, YALNIZ artıq qayıdan bir sahə oxunur (§2.5) |
| `src/routes/_app.tsx` | Sidebar "Kassada olmalı" → "Kassada olmalı (ümumi)" + "Son bağlanışdan bəri" izah sətri (§3 — terminologiya qərarı). `useDashboardStats()` sorğusu və `stats.expectedCash` dəyəri dəyişməyib |
| `docs/ui-terminology.md` | Bu taskın etiket qərarları qeydə alındı (§3) |

**Toxunulmayıb:** `src/features/day-end/api.ts`, `src/features/day-end/lib.ts`,
`src/features/day-end/queries.ts`, `src/features/reports/queries.ts`
(`useSummary`/`useDashboardStats` hook-larının özləri — yalnız `api.ts`-dəki
TİP genişləndirildi), `src/mocks/handlers.ts` (`closingHandlers.closeDay` —
mock hesablama məntiqi TOXUNULMADI, çünki maaş inteqrasiyası TOXUNULMAZ
siyahısındadır), `ConfirmModal`/`Card`/`Field`/`Input`/`Textarea`/`StatCard`/
`Button` primitivlərinin özləri, `src/routes/_app.gun-sonu.tsx` (dəyişiklik
tələb etmədi — `DayEndCard`/`ClosingHistory`-ni olduğu kimi render edir).

---

## 2. Bənd-bənd qərarlar (task tələbləri #1–#12)

### 1. Terminologiya qərarı — "Kassada olmalı" ambiqivliyi (bənd #1)

Bax §3 (aşağıda) — ayrıca bölmədə ətraflı əsaslandırma.

### 2. Üç mərhələli iş axını (bənd #2)

`DayEndCard` iki `Card` (① solda, ②+③ sağda `flex flex-col` yığında) əvəzinə
indi başlıqlarında nömrələnmiş dairə (`StepHeading`, yalnız təqdimat, yeni
paylaşılan primitiv DEYİL, feature-daxili köməkçi funksiyadır) olan 3 kart
göstərir:

1. **"① Bugünkü hesabı yoxla"** — açılış kassası (input) + nağd/kart/nisyə
   satış + günlük xərclər (+ maaş ödənişləri, varsa) + qabarıq yekun.
2. **"② Kassadakı faktiki pulu yaz"** — YEGANƏ input (`canClose` yoxdursa
   bunun yerinə kilid mesajı).
3. **"③ Fərqi yoxla və günü bağla"** — canlı fərq banneri, istəyə bağlı
   qeyd, "Günü bağla" düyməsi.

Responsive: `grid lg:grid-cols-2` qorunub (① solda, ②+③ sağ sütunda
`flex flex-col gap-5` ilə üst-üstə) — 1280/1440/1920px-də 2 sütun, `lg`-dən
aşağı (375px daxil) tək sütun, mərhələlər nömrə sırası ilə aşağı-aşağı düzülür.

### 3. Redaktə oluna bilməyən oxunan dəyərlər (bənd #3)

Açılış kassası **hələ də input**-dur (mövcud davranış — task tələbi #3
bunu açıq saxlayır), lakin indi xam `<input>` əvəzinə `Field` + `Input`
(dizayn sistemi) daxilindədir — implisit `<label>` assosiasiyası ilə (əvvəl
sol tərəfdəki mətn sadə `<span>` idi, indi `Field`-in `<label>` sarğısı
sayəsində `aria-label` verilmədən ekran oxuyucusu üçün adlandırılıb, bu, eyni
zamanda `docs/ui-ux-risk-register.md`-dəki `R-32`/`F-25`-i erkən həll edir —
task əhatəsi Gün Sonu səhifəsi olduğu üçün ziyanı yoxdur). Nağd satış, kart
satış, nisyə satış, günlük xərclər sətirləri sadə mətndir (`Row` köməkçisi)
— HEÇ BİRİ input DEYİL, HEÇ BİRİ redaktə oluna bilmir.

### 4. Qabarıq gözlənilən məbləğ (bənd #4)

Mərhələ ①-in sonunda ayrıca kəhrəba-yaşıl fonlu blok: kiçik uppercase
etiket ("Bu günün sonunda kassada olmalı") + böyük (`text-3xl font-bold`)
rəqəm. `expectedCash()` düsturuna (`../lib.ts`) TOXUNULMAYIB — yalnız
render böyüdülüb.

### 5. Canlı fərq (bənd #5) + işçi maaş ödənişləri şəffaflığı

Fərq banneri (`diff !== null` şərti ilə) `actualCash` state-i dəyişən kimi
YENİDƏN RENDER olunur — bu, əvvəlki koddan da mövcud idi (React-in adi
render axını), dəyişməyib.

Əlavə olaraq, köhnə FE#57 şərhi (DayEndCard.tsx-də: "maaş ödənişləri bu
önizləməyə DAXİL DEYİL") **köhnəlmiş** olduğu üçün düzəldildi: backend
BE#33 ilə `GetSummaryHandler` artıq maaş ödənişlərini `expenses` cəminə
qatır (bax `backend/docs/flows/DAYEND-FLOW.md`, sətir 23: "`GetSummaryHandler`
... `SummaryDto.SalaryExpenses`-ə cəmləyir və `Expenses`/`NetProfit`-ə
daxil edir"). Yəni `expected` düsturu artıq faktiki bağlanışla EYNİ nəticəni
verir — köhnə uyğunsuzluq HƏLL OLUNUB, bunu YENİDƏN YARATMAQ ƏVƏZİNƏ şərh
düzəldildi. `SummaryData.salaryExpenses` (yeni, OPTIONAL sahə) yalnız bu
artıq-mövcud cəmin bir hissəsini "O cümlədən: işçi maaş ödənişləri" kimi
AYRICA sətirdə göstərmək üçün oxunur — `expected` düsturuna HEÇ NƏ ƏLAVƏ
OLUNMUR (artıq `todayExpenses` daxilindədir, təkrar çıxılmır). Mock rejimdə
bu sahə YOXDUR (`mockSummary` maaş inteqrasiyasını simulyasiya etmir —
TOXUNULMAZ siyahısına görə bu, QƏSDƏN dəyişdirilməyib), ona görə sətir
şərti (`typeof salaryExpenses === "number"`) ilə YALNIZ real backend-də
göstərilir — `generalExpenses`/`productExpenses` ilə eyni OPTIONAL-sahə
qaydası (FE#9, AC3 presedenti).

### 6. Fərq semantikası (bənd #6)

Bu, artıq FE#69 ilə (`cash-diff-presentation.ts`, `R-02`) həll olunub və
DƏYİŞDİRİLMƏDİ: sıfır → yaşıl "Kassa düz gəlir"; mənfi → qırmızı
"Kassada çatışmayan məbləğ"; MÜSBƏT → kəhrəba "Kassa uyğun gəlmir — X
artıq çıxdı, yoxlayın" (uğur DEYİL). Hər ikisi (mənfi/müsbət) ikon + mətn
daşıyır (rəng tək siqnal deyil). FE#77 bu qaydanı "artıq bağlanıb" xülasə
kartına da TAM tətbiq etdi: əvvəl orada ayrıca inline ternar var idi
(`tone={diff<0?"red":diff>0?"amber":"green"}`), indi `cashDiffPresentation()`-un
özü çağırılır (`STAT_TONE` xəritəsi ilə) — DRY, davranış EYNİ qalıb (test
`bənd #12: artıq bağlanıbsa ...` bunu təsdiqləyir).

### 7. Deaktiv düymənin səbəbi (bənd #7)

"Günü bağla" deaktiv olduqda düymənin altında kiçik mətn:
`ac === null` → "Faktiki məbləği yazın"; 409 cavabından sonra (aşağı §12)
→ "Bu gün artıq bağlanıb" (`todayClosing` sorğusu arxa fonda yenilənənə
qədər qısa pəncərə — sonra bütün komponent avtomatik "artıq bağlanıb"
xülasə kartına keçir).

### 8. ConfirmModal — strukturlaşdırılmış son təsdiq (bənd #8)

`ConfirmModal.message` (bir `<p>` daxilindədir — buna görə `div` YOX, yalnız
`span` node-ları istifadə olunur ki, HTML valid qalsın) indi 4 sətir göstərir:
"Olmalı idi" (`expected`), "Sayıldı" (`actualCash`), "Fərq" (rənglə —
`cashDiffPresentation` tonu), "Tarix" (`fmtDate(todayISO())`) + aşağıda
kəhrəba xəbərdarlıq zolağı: "Bu qeyd dəyişdirilə bilməz — gün bağlandıqdan
sonra heç bir rəqəm redaktə oluna bilməz." `ConfirmModal` primitivinin özü
DƏYİŞMƏYİB (mövcud `message: ReactNode` propu istifadə olunur).

### 9. İstəyə bağlı qeyd (bənd #9)

Backend `Closing.Note` sahəsini artıq dəstəkləyir və `CloseDayInput.note`
(`src/features/day-end/api.ts`) onsuz da mövcud idi, lakin heç bir UI onu
göndərmirdi. İndi ③-cü mərhələdə `Textarea` ("Qeyd (istəyə bağlı)") əlavə
olundu — placeholder/hint fərq varkən ("Fərqin səbəbini qeyd et — məcburi
deyil, amma faydalıdır") dəyişir, lakin sahə HEÇ VAXT `required` deyil və
boş göndərilə bilər (`note: note.trim() || undefined`). `CloseDayInput`
tipinə/`closingsApi.closeDay`-ə TOXUNULMAYIB — mövcud opsional sahə
sadəcə İSTİFADƏ OLUNMAĞA başladı.

### 10. Əvvəlki bağlanışlar cədvəli (bənd #10)

`ClosingHistory.tsx`-dəki hər-qeyri-sıfır-fərq-uyğunsuzluqdur qaydası artıq
FE#69 ilə mövcud idi (`cashDiffPresentation` + `AlertTriangle`) — DƏYİŞMƏYİB,
YALNIZ sütun başlıqları (§2.11) yeniləndi.

### 11. Sadə bazar dili (bənd #11) — `E-22`

Audit sənədi (`docs/ui-ux-current-state-audit.md`, sətir 1039) bu tövsiyəni
əvvəldən qeydə almışdı, lakin "sonrakı mərhələ" kimi təxirə salınmışdı
(`docs/ui-terminology.md`, bölmə 2: "`Gözlənilən` / `Faktiki` / `Fərq` —
`E-22` sonrakı mərhələdə"). FE#77 məhz bu "sonrakı mərhələ"dir (Gün Sonu
səhifəsinin tam refactor-u), ona görə tətbiq edildi:

- "Gözlənilən" → **"Olmalı idi"**
- "Faktiki" → **"Sayıldı"**
- "Fərq" → dəyişmədi (artıq sadə söz)

Tətbiq olunan yerlər: "artıq bağlanıb" xülasə kartı (`StatCard` etiketləri),
`ConfirmModal` təsdiq mesajı, `ClosingHistory` sütun başlıqları — HAMISI
EYNİ 2 sözlə, səhifə daxilində terminologiya vahid qalır.

### 12. Vəziyyətlər (bənd #12)

- **Göndərilir** — `Button loading={closeDay.isPending}` (mövcud F-42
  naxışı) + `ConfirmModal isPending` (F-43) — dəyişməyib.
- **Uğur** — `toast.success("Gün sonu bağlandı")` + `useCloseDay`-in
  `onSuccess`-i (`closings`/`dashboard`/`summary`/`activity` sorğularını
  invalidasiya edir, dəyişməyib) → komponent `todayClosing` dolu olan kimi
  avtomatik "artıq bağlanıb" xülasə kartına keçir.
- **Artıq-bağlanıb (409)** — ƏSAS DƏYİŞİKLİK: əvvəlki `doClose()` xətanı
  `catch` daxilində UDURDU (`toast.error(...)`, sonra HEÇ NƏ) — bu, `onConfirm`-in
  qaytardığı `Promise`-in HEÇ VAXT rədd olunmaması demək idi, ona görə
  `ConfirmModal` HƏMİŞƏ bağlanırdı (uğur/xəta fərqi yox idi) — bu, `F-43`-ün
  məqsədini (gün bağlanışı kimi geri alınmayan əməliyyatda modal xəta
  halında AÇIQ QALMALIDIR) faktiki YERİNƏ YETİRMİRDİ. İndi `doClose()` xətanı
  `setCloseError`-a yazır, `toast.error` göstərir VƏ xətanı YENİDƏN ATIR
  (`throw e`) — `ConfirmModal` bunu tutub AÇIQ QALIR, `error` propu ilə
  səbəbi göstərir. 409 (`ApiError.status === 409` və ya mock-un plain
  `Error("Bu gün artıq bağlanıb")` mesajı) ayrıca aşkarlanır: bu halda
  `todayClosing` sorğusu dərhal `refetch()` edilir ki, komponent (istifadəçi
  dialoqu bağlayan kimi, ya da avtomatik) "artıq bağlanıb" xülasə kartına
  keçsin. `closeDay.mutateAsync` çağırışının PAYLOAD-U (`openingCash`/
  `actualCash`/`note`) DƏYİŞMƏYİB.
- **API xətası (409 xaric)** — eyni `setCloseError`/`throw e` yolu ilə,
  mesaj `e.message`-dən gəlir (mövcud `ApiError` konvensiyası, dəyişməyib).

---

## 3. Terminologiya qərarı — "Kassada olmalı" (bənd #1, `R-01`/`F-01`)

### Kod səviyyəsində yoxlama

- **Sidebar** (`src/routes/_app.tsx`, `stats.expectedCash`,
  `useDashboardStats()` → real rejimdə `GET /api/reports/dashboard`):
  backend `DashboardCalculator.ExpectedCash()`
  (`backend/src/Modules/.../GetDashboard/DashboardCalculator.cs`, sətir
  87–110) düsturu — **son bağlanışın faktiki məbləğindən (`lastClosing.ActualCash`)
  bəri, bir neçə gün ötmüş olsa belə**, yığılan bütün nağd satışları cəmləyir,
  xərcləri/maaş ödənişlərini çıxır: `openingCash + cashSince − expensesSince
  − salaryPaidSince`, burada `since = lastClosing.Date + 1`. Yəni bu, **ÜMUMİ,
  bağlanışdan bəri yığılan** rəqəmdir — "bu gün" ilə MƏHDUDLAŞMIR (əgər gün
  sonu bir neçə gün bağlanmayıbsa, bir neçə günün cəmini göstərir).
- **Gün Sonu səhifəsi** (`DayEndCard.tsx`, `expected` = `calcExpected(oc,
  cashSales, todayExpenses)`): `cashSales`/`todayExpenses` `useSummary("today")`-dən
  gəlir — **yalnız BUGÜNKÜ** (`period=today`) əməliyyatlar. `oc`
  (`openingCash`) defolt olaraq son bağlanışın faktiki məbləğidir
  (`defaultOpening`, `closings` siyahısından), YALNIZ BİR GÜN geriyə baxır —
  əgər son bağlanış bir neçə gün əvvəldirsə, aralıq günlərin satışı/xərci bu
  hesaba DAXİL DEYİL.

**Nəticə:** iki rəqəm YALNIZ eyni gündə (dünən bağlanıb, bu gün hələ
bağlanmayıb) EYNİ olur. Əgər gün sonu bir neçə gün bağlanmayıbsa, sidebar
ÜMUMİ (bir neçə günün cəmi), Gün Sonu səhifəsi isə YALNIZ BUGÜNKÜ rəqəmi
göstərir — bu, real, TƏSDİQLƏNMİŞ fərqdir (audit tapıntısı `F-01`/`R-01`-in
təsvir etdiyi problem doğrudur), lakin audit sənədinin öz təklif etdiyi
etiketlər (`E-01`: sidebar → "Kassada olmalı (bu gün)"; `E-02`: səhifə →
"Kassada olmalı (bağlanışa qədər)") əslində **TƏRSİNƏ** yazılıb — sidebar
"bu gün" DEYİL, ÜMUMİDİR; Gün Sonu səhifəsi isə "bağlanışa qədər" (bütün
aralıq) DEYİL, YALNIZ bugünküdür.

### Qərar

Task təsvirindəki (FE#77 issue mətni) düzəldilmiş etiketlər qəbul edildi —
bunlar kod yoxlamasına uyğundur:

- **Sidebar:** "Kassada olmalı" → **"Kassada olmalı (ümumi)"** + kiçik
  köməkçi sətir "Son bağlanışdan bəri" (yeni, izahedici).
- **Gün Sonu səhifəsi:** "Kassada olmalı məbləğ" → **"Bu günün sonunda
  kassada olmalı"**.

Bu qərar audit sənədinin (`docs/ui-ux-current-state-audit.md`, `E-01`/`E-02`)
orijinal təklifini ƏVƏZ EDİR — audit sətirlərinin özü DƏYİŞDİRİLMƏYİB (tarixi
sənəd olaraq qalır), lakin bu sənəd (və bu tapşırığın icrası) real koda əsasən
DÜZƏLDİLMİŞ etiketi tətbiq edir. Hər iki yerdə düstura/sorğuya TOXUNULMAYIB —
YALNIZ etiket və izah mətni.

---

## 4. Yekun (build/test/responsive)

- `npm run build` (`tsc && vite build`) — **0 xəta**.
- `npx vitest run` — bütün mövcud testlər YAŞIL (34 fayl, 270 test — bu
  taskda əlavə olunan `DayEndCard.test.tsx` (11 test) daxil). Qeyd:
  `src/components/ui/PeriodFilter.test.tsx`-dəki 1 test bu taskdan ASILI
  OLMAYARAQ uğursuzdur (`PeriodFilter.tsx` bu PR-da toxunulmayıb — `main`
  budağında da eyni uğursuzluq təsdiqləndi, `git stash` ilə yoxlanıldı;
  FE#75/FE#76-da da eyni qeyd edilib) — bu regressiya bu PR-ın əhatəsində
  DEYİL.
- Responsive: kod səviyyəsində 1280/1440/1920px üçün `grid lg:grid-cols-2`
  (2 sütun) və 375px üçün tək sütun (`lg:` breakpoint-dən aşağı) təsdiqləndi
  — mərhələ kartları `flex flex-col gap-5` ilə düzgün sırada yığılır. Bütün
  yeni kontrollar (`Field`+`Input`, `Textarea`) dizayn sisteminin mövcud
  `h-12`/`min-h-[96px]` (≥44px toxunma hədəfi) siniflərini istifadə edir —
  yeni ölçü tokeni əlavə olunmayıb. Headless brauzer mühiti mövcud olmadığı
  üçün (əvvəlki FE#70/…/FE#76-da da qeyd olunan məhdudiyyət) piksel-səviyyəli
  skrinşot yoxlaması aparılmayıb.
- `git diff main --stat` — yalnız yuxarıdakı fayllar (4 dəyişən fayl + 1
  yeni test faylı + bu sənəd); `src/features/day-end/api.ts`,
  `src/features/day-end/lib.ts`, `src/features/day-end/queries.ts`,
  `src/mocks/handlers.ts` dəyişməyib.

## 5. Tam icra edilə bilməyən/güzəştə gedilən tələblər

- **Vizual (piksel-səviyyəli) skrinşot yoxlaması** aparılmadı — headless
  brauzer mühiti mövcud deyil (əvvəlki tasklarda da eyni məhdudiyyət);
  responsive yoxlama kod/CSS səviyyəsindədir.
- **Mock rejimdə "işçi maaş ödənişləri" sətri** görünmür — `mockSummary`
  (`src/features/reports/api.ts`) maaş inteqrasiyasını simulyasiya etmir.
  Bu, TOXUNULMAZ siyahısına görə (maaş ödənişləri inteqrasiyası) QƏSDƏN
  dəyişdirilməyib; real backend (BE#33) sətri göstərir. Demo/mock mühitdə
  bu sətir sadəcə görünməz qalır (mövcud `generalExpenses`/`productExpenses`
  optional-sahə qaydası ilə eynidir).
