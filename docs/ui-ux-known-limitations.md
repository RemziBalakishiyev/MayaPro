# Bilinən UI/UX məhdudiyyətləri (FE#81 yekunu)

Bu sənəd FE#69…FE#81 refactor silsiləsinin sonunda **bilə-bilə açıq
saxlanılan** məhdudiyyətləri və hər birinin **səbəbini** qeydə alır.
Burada sadalananlar «unudulmuş iş» DEYİL — hər biri şüurlu qərardır və
düzəlişi üçün ayrıca task tələb olunur.

Əlaqəli: `docs/final-ui-ux-regression-report.md` · `docs/ui-ux-final-changelog.md`
· `docs/design-system.md` · `docs/ui-terminology.md`

---

## 1. Yoxlama alətləri ilə bağlı məhdudiyyətlər

### L-01 — Vizual regressiya / screenshot aləti YOXDUR

**Nədir:** layihədə Playwright, Cypress, Puppeteer və ya hər hansı vizual
regressiya aləti quraşdırılmayıb. Test stack-i yalnız `vitest` +
`@testing-library/react` + `happy-dom`-dur.

**Səbəb:** FE#69-un **AC-20** meyarı (stack toxunulmazlığı) və FE#81 taskının
açıq göstərişi yeni test framework quraşdırılmasını qadağan edir. Yeni
dev-asılılıq `package.json`/lock faylını dəyişər və AC17-nin «package.json
dəyişməyib» şərtini pozardı.

**Nəticəsi:**
- Heç bir səhifənin screenshot-u yoxdur.
- Piksel səviyyəsində «əvvəl/sonra» müqayisəsi mümkün deyil.
- Vizual regressiya iddiaları yalnız statik analiz + `vitest` əsaslıdır.

**Aradan qaldırma yolu:** ayrıca task — `@playwright/test` dev-asılılığı,
`tests/visual/` qovluğu, 13 route × 5 viewport baseline seti.

---

### L-02 — Real viewport ölçülməsi (1280/1366/1440/1920 + 375px) icra edilmədi

**Nədir:** FE#81 taskının tələb etdiyi 4 desktop + 1 mobil viewport-da faktiki
render yoxlanılmadı. AC14 hesabatda **«qismən (statik)»** statusundadır.

**Səbəb:** L-01 (alət yoxdur) + `happy-dom` real layout hesablamır
(`getBoundingClientRect` faktiki ölçü qaytarmır), ona görə mövcud vitest
suite ilə də daşma ölçülə bilməz.

**Əvəzinə nə edildi:** statik daşma analizi —
`w-screen` / `100vw` / `min-w-max` axtarışı (0 nəticə), bütün sabit
`min-w-[…]` dəyərlərinin 1280px-ə qarşı yoxlanması (ən böyüyü 220px), mənfi
marjinlərin (`-mx-`) kompensasiyasının yoxlanması, `overflow-x-auto`
sarğılarının təsdiqi. Bu analizlə **bir real risk tapıldı və düzəldildi**
(`DebtsKpiCards` — bax changelog FE#81).

**Qalan risk:** düzəlişin özünün 375px-də vizual təsdiqi yoxdur.

---

### L-03 — FE#69-dan ötürülən AC-17 / AC-18 yalnız statik bağlandı

**Nədir:** FE#69 («Qlobal UI/UX təməli») `Done` bağlananda AC-17 (üfüqi daşma)
və AC-18 (375px mobil regressiya) **ölçülməmiş** qalmışdı və issue #81-in
şərhi ilə bu taska ötürülmüşdü.

**Səbəb:** eyni — L-01 / L-02.

**Nə edildi:** şərhdə göstərilən «prioritet nöqtə»
(`DebtsKpiCards.tsx:104,111,126,140` — `truncate`/`min-w-0` çatışmazlığı)
təsdiqləndi və düzəldildi. Digər statik sübutlar (`DataTable` `overflow-x-auto`,
`mobileCard` ayrımı, `AppShell` drawer `max-w-[85%]`) yenidən yoxlandı və
qüvvədədir.

**Qalan risk:** AC-17/AC-18-in **faktiki** (render əsaslı) təsdiqi hələ də
yoxdur.

---

## 2. Mühitlə bağlı məhdudiyyətlər

### L-04 — Canlı backend əlçatmazdır (şəbəkə bloklanıb)

**Nədir:** bu sessiyada bütün şəbəkə əmrləri (`curl`, `netstat`, `fetch`)
bloklanıb. `mayapro-warehouse-api`-yə heç bir sorğu göndərilə bilməz.

**Səbəb:** agent mühitinin təhlükəsizlik siyasəti.

**Nəticəsi — 6 test case icra edilə bilmədi (TC24–TC29):**

| TC | Axın |
|---|---|
| TC24 | Satış — Nağd / Kart / Nisyə → qaimə |
| TC25 | Borc ödənişi (tam + qismən) |
| TC26 | Xərc → «Real maya» təsiri |
| TC27 | Gün bağlama → təkrar bağlamada 409 |
| TC28 | Maaş avansı → gün sonu hesabına düşməsi |
| TC29 | Backend söndürülmüş halda hər səhifənin xəta vəziyyəti |

**Vacib:** bunlar **«kəsildi» SAYILMIR** — «icra edilə bilmədi» statusundadır.

**Əvəzinə nə edildi:** hər 6 axın **kod-oxuma** ilə yoxlandı — mutasiya
imzaları, `invalidateQueries` dəstləri, `ApiError` emalı, 409 branch-ı və
xəta vəziyyətləri. Nəticələr `final-ui-ux-regression-report.md` §11-də
cədvəl kimidir. 409 emalı (TC27) kod səviyyəsində **tam doğru** təsdiqləndi.

**Aradan qaldırma yolu:** QA dövrü canlı backend ilə (real rejim) təkrarlansın.

---

### L-05 — Mock rejimi bəzi real halları simulyasiya etmir

**Nədir:** `VITE_API_URL` boş olanda (`api-client.ts:20` `USE_MOCK`) tətbiq
`src/mocks/**` qatına düşür. Mock qatı **qəsdən** bəzi real davranışları
təkrarlamır.

**Səbəb:** sənədləşdirilmiş qərar —
`docs/pages/day-closing-ui-refactor.md` (`SummaryData.salaryExpenses`
mock rejimdə YOXDUR, «TOXUNULMAZ siyahısına görə qəsdən dəyişdirilməyib»).

**Nəticəsi:**
- Maaş ödənişlərinin gün sonu cəminə inteqrasiyası (TC28) yalnız real
  backend-də görünür.
- Mock qatı 409-u `Error("Bu gün artıq bağlanıb")` kimi atır
  (`mocks/handlers.ts:787`), HTTP statusu ilə yox — ona görə `DayEndCard.tsx:174`
  həm `status === 409`, həm də mesaj regexi yoxlayır. Real rejimdə yalnız
  status yolu işləyəcək.
- Şəbəkə xətası (TC29) mock rejimində heç vaxt baş vermir → xəta vəziyyətləri
  yalnız kod-oxuma və unit testlərlə yoxlana bilir.

---

## 3. Dizayn sistemi ilə kod arasındakı bilinən uyğunsuzluqlar

### L-06 — Cədvəl padding dəyərləri spacing şkalasında deyil

`DataTable.tsx:261` — `py-3.5` (14px) və `py-2.5` (10px). DS §1.1 şkalası:
4 / 8 / 12 / 16 / 20 / 24 / 32.

**Səbəb (niyə düzəldilmədi):** dəyişiklik BÜTÜN siyahı cədvəllərinin sətir
hündürlüyünü və sıxlığını dəyişir. Vizual təsdiq aləti olmadan (L-01) bu,
nəzarətsiz vizual regressiya riskidir. Rəqəmlər həm də mövcud toxunma hədəfi
qaydası ilə uyğunlaşdırılıb (`:269` `min-h-[40px]`).

---

### L-07 — Semantik palitradan kənar rənglər sistemli işlədilir

`indigo` (Kart ödənişi kimliyi), `orange` (artıq ödəniş), `rose`, `violet`,
`teal`, `green-700` — DS §1.8 palitrası isə emerald / amber / red / sky / stone.

Yerlər: `StatCard.tsx:11,18`, `Badge.tsx:10,15,37,44,47`,
`PaymentConfirmModal.tsx:24`, `SaleEditDrawer.tsx:50`, `_app.index.tsx:46,51`,
`ActivityLog.tsx:26-27`, `SalaryCard.tsx:201`, `DayEndCard.tsx:290`.

**Səbəb (niyə düzəldilmədi):** bunlar **status/kimlik** rəngləridir (ödəniş
növü, işçi rolu, fəaliyyət kateqoriyası) — DS-in tənzimlədiyi **semantik
status** rəngləri DEYİL. Ödəniş növü rəngi 3 ekranda ardıcıl işlədilir
(`PaymentConfirmModal`, `SaleEditDrawer`, `StatCard`), yəni daxilən
tutarlıdır. Düzgün həll — DS-ə «kimlik palitrası» bölməsi əlavə etmək, kodu
dəyişmək yox.

**DİQQƏT:** DS-in **KRİTİK** rəng qaydası (R-02, müsbət kassa fərqi = kəhrəba)
tam qüvvədədir və tək mənbədədir (`cash-diff-presentation.ts`).

---

### L-08 — `.money` tokeni sənəddə iddia olunan qədər geniş tətbiq olunmayıb

DS §1.5 `.money`-nin tətbiq yerləri kimi «cədvəl pul sütunları»nı da sadalayır,
lakin cədvəl xanalarında faktiki olaraq yalnız `tabular-nums` var. `.money`
6 yerdə işlədilir: `KpiCard.tsx:93,179`, `StatCard.tsx:78`,
`DayEndCard.tsx:315`, `_app.tsx:115`, `DebtsKpiCards.tsx` (FE#81-də əlavə).

**Səbəb (niyə düzəldilmədi):** `.money` `truncate` daxil edir — bütün cədvəl
pul xanalarına tətbiq etmək daşma əvəzinə **kəsilmə** gətirər. Kəsilmənin
harada məqbul olduğunu (KPI kartı = bəli, cədvəl xanası = şübhəli) vizual
təsdiq olmadan qərara almaq olmaz (L-01).

---

## 4. Terminologiya ilə bağlı açıq suallar

### L-09 — «Ləğv et» vs «İmtina» qaydası təsbit olunmayıb

14 yerdə «İmtina» (`ConfirmModal.tsx:76` və bütün form modalları), 3 yerdə
«Ləğv et» (`ProductForm.tsx:330`, `PaymentConfirmModal.tsx:295`,
`_app.ayarlar.tsx:295`).

**Səbəb:** «Ləğv et» `docs/pages/settings-ui-refactor.md:59` ilə
**sənədləşdirilmiş qərardır** — orada məna fərqlidir («edilmiş dəyişikliyi
ləğv et», dialoqdan imtina deyil) və `_app.ayarlar.test.tsx` ilə test-kilidlidir.
`ui-terminology.md`-də isə bu iki söz üçün qayda YOXDUR.

**Nə lazımdır:** əvvəlcə `ui-terminology.md`-yə qayda əlavə olunsun (məs.
«dialoqdan çıxış = İmtina», «dəyişikliyi geri al = Ləğv et»), sonra kod
uyğunlaşdırılsın. Qayda olmadan kodu dəyişmək təsadüfi seçim olardı.

---

### L-10 — Lokal axtarış placeholder-i üçün meyar sənədində daxili ziddiyyət

`ui-terminology.md` §3: «Səhifədaxili axtarış → *Bu siyahıda axtar...* (əhatə
mötərizədə)».
`ui-terminology.md` sətir **#33** isə `ProductFilters` üçün açıq şəkildə
«Bu siyahıda mal adı, kateqoriya və xüsusiyyət üzrə axtar» təyin edir
(FE#70 AC-6) və `ProductFilters.test.tsx:24` bunu test-kilidləyir.

**Səbəb (niyə düzəldilmədi):** hər iki forma **eyni sənəddə** təsdiqlənib.
Kodu birinə uyğunlaşdırmaq digərini pozar. Əvvəlcə sənəddəki ziddiyyət həll
olunmalıdır.

---

## 5. Davranış dəyişikliyi tələb edən, ona görə açıq qalan tapıntılar

Bunlar **real UI/UX çatışmazlıqlarıdır**, lakin FE#81-in «yeni funksiya əlavə
etmə, biznes məntiqini dəyişmə» qaydası altına düşmür.

### L-11 — 4 maliyyə əməliyyatı ayrıca təsdiq addımı olmadan submit olunur

`customers/PaymentModal.tsx:113` (borc ödənişi) ·
`suppliers/PayModal.tsx:76` (təchizatçıya ödəniş) ·
`suppliers/DebtModal.tsx:63` (təchizatçı borcu) ·
`products/StockAdjustModal.tsx:85` (stok düzəlişi).

Üstəlik `PaymentModal.tsx:98` — `Enter` birbaşa `save()` çağırır, yəni
məbləğ sahəsində təsadüfi Enter ödənişi yazır.

**Səbəb:** təsdiq addımı əlavə etmək axını dəyişir (yeni state, yeni addım) —
FE#81-in əhatəsindən kənardır. Hazır presedent var:
`SalaryPayModal` / `SalaryDeductionModal` iki-addımlı naxışı.
**Prioritet: yüksək** (geri alınmayan maliyyə əməliyyatları).

---

### L-12 — Satış ekranında barkod skaner / Enter axını mövcud deyil

`QuickSaleScreen.tsx:435-442` — axtarış input-unda `onKeyDown` handler-i
YOXDUR. Barkod skaneri simvolları yazıb `Enter` göndərir, `Enter` isə heç nə
etmir: tək nəticə avtomatik seçilmir, tam barkod uyğunluğu ayrıca emal
olunmur, `Enter`-dən sonra fokus input-a qaytarılmır
(`searchRef.current?.focus()` yalnız `:113`-də — satış tamamlandıqdan sonra).

**Səbəb:** AC16-nın tələb etdiyi davranış kodda ümumiyyətlə yoxdur —
əlavə edilməsi **yeni funksiyadır**, FE#81-də qadağandır.
**Prioritet: yüksək** (kassa iş sürəti; barkod skaneri əsas giriş üsuludur).

---

### L-13 — Gün Sonunda summary xətası bağlanışı bloklamır

FE#81 ilə `DayEndCard`-a xəta xəbərdarlığı əlavə olundu (əvvəl heç nə yox
idi), lakin xəta halında «Günü bağla» düyməsi **hələ də aktivdir**.

**Səbəb:** düymənin bloklanması davranış dəyişikliyidir və backend-in «stale
summary» semantikası ilə razılaşdırma tələb edir (bağlanışda cəmləri server
özü hesablayır — `DayEndCard.tsx:164` şərhi). Öz AC/TC-si ilə ayrıca task
olmalıdır.

---

### L-14 — Borc ödənişi `["summary"]` keşini ləğv etmir

`customers/queries.ts:117-121` — `useAddCustomerPayment` `customers`,
`payments`, `history`, `dashboard`, `activity` açarlarını yeniləyir,
`["summary"]`-ni YOX. Gün Sonu səhifəsi məhz `useSummary("today")` oxuyur.

**Səbəb:** düzgün cavab **backend davranışından** asılıdır — `GetSummaryHandler`
müştəri borc ödənişlərini `cashSales`-ə qatırsa, bu, real keş nasazlığıdır;
qatmırsa, mövcud kod doğrudur. Bu agentin `backend/` qovluğuna baxmaq/dəyişmək
səlahiyyəti bu taskda yoxdur və canlı yoxlama da mümkün deyil (L-04).
**Backend təsdiqi tələb olunur.**

---

## 6. Arxitektura səviyyəsində qalan məhdudiyyətlər

### L-15 — `PageHead` deprecated alias-ı hələ də repodadır

`src/components/layout/PageHead.tsx` — FE#81-dən sonra **0 istifadəçisi qalıb**
(bütün 10 route birbaşa `PageHeader` işlədir).

**Səbəb:** faylın silinməsi bu taskın əhatəsi (regressiya yoxlaması) deyil,
təmizlik işidir. Silinməsi FE#143 («istifadəsiz primitivlərin silinməsi»)
naxışı ilə ayrıca task olmalıdır.

---

### L-16 — Bundle ölçüsü xəbərdarlığı

`npm run build` → `dist/assets/index-*.js` **1 281 kB** (gzip 358 kB), Vite
500 kB həddini aşır.

**Səbəb:** kod bölgüsü (`manualChunks` / dinamik `import()`) performans
taskıdır, UI/UX regressiyası deyil. Bu, FE#81-də yaranmış problem DEYİL —
baza vəziyyətdə də mövcuddur.

---

## 7. Xülasə cədvəli

| ID | Məhdudiyyət | Kateqoriya | Prioritet |
|---|---|---|---|
| L-01 | Vizual/screenshot aləti yoxdur | Alət | Orta |
| L-02 | Real viewport ölçülməsi icra edilmədi | Alət | Orta |
| L-03 | FE#69 AC-17/AC-18 yalnız statik bağlandı | Alət | Orta |
| L-04 | Canlı backend əlçatmazdır (6 TC) | Mühit | Orta |
| L-05 | Mock rejimi bəzi real halları vermir | Mühit | Aşağı |
| L-06 | Cədvəl padding-i spacing şkalasında deyil | DS drift | Aşağı |
| L-07 | Palitradan kənar kimlik rəngləri | DS drift | Aşağı |
| L-08 | `.money` əhatəsi sənəddəkindən dardır | DS drift | Aşağı |
| L-09 | «Ləğv et» / «İmtina» qaydası yoxdur | Terminologiya | Aşağı |
| L-10 | Axtarış placeholder-i — sənəddə ziddiyyət | Terminologiya | Aşağı |
| L-11 | 4 maliyyə əməliyyatı təsdiqsiz | Davranış | **Yüksək** |
| L-12 | Barkod / Enter axını yoxdur | Davranış | **Yüksək** |
| L-13 | Gün Sonu xətası bağlanışı bloklamır | Davranış | Orta |
| L-14 | Borc ödənişi `summary` keşini ləğv etmir | Backend asılı | Orta |
| L-15 | `PageHead` alias-ı istifadəsiz qalıb | Təmizlik | Aşağı |
| L-16 | Bundle 1.28 MB | Performans | Aşağı |
