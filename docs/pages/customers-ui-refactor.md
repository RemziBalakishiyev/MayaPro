# Müştərilər səhifəsi — dizayn sisteminə keçid (FE#73, mərhələ 4)

Bu sənəd FE#73 çərçivəsində **yalnız "Müştərilər" səhifəsində** aparılan
dəyişiklikləri, verilən qərarları və onların əsaslandırmasını qeydə alır.
Asılılıq: FE#72 (Done, `main`-ə merge olunub). Referans:
`docs/design-system.md` (FE#69), `docs/pages/inventory-ui-refactor.md` (FE#70),
`docs/pages/sales-ui-refactor.md` (FE#71), `docs/ui-terminology.md`.

**TOXUNULMAZ qalıb (dəyişməyib):** müştəri/borc/ödəniş HESABLAMALARI və API
çağırışları — `remainingDebt`, `totalDebt`, `paidAmount`, `initialDebt`,
`totalPurchases`, `purchaseCount` (backend-dən gəlir, `src/features/customers/api.ts`);
`useCustomers`, `useOpenDebts`, `useCustomerHistory`, `useCustomerPayments`,
`useCreateCustomer`, `useUpdateCustomer`, `useDeleteCustomer`,
`useDeleteCustomerCredit`, `useAddCustomerPayment` sorğuları
(`src/features/customers/queries.ts`); `waLink()` (`lib.ts`); ödəniş axını
(`PaymentModal.tsx` — YENİDƏN YAZILMAYIB, olduğu kimi çağırılır);
`NewCustomerModal.tsx`, `EditCustomerModal.tsx`; `useCan("customers.write"
/ "customers.delete")` icazə şərtləri. `OpenDebtsTable.tsx`, `OpenDebtsView.tsx`,
`DebtsKpiCards.tsx`, `DebtViewToggle.tsx` və `src/routes/_app.borclar.tsx`-in
JSX-i **DƏYİŞMƏYİB** — bu fayllar "Nisyə Borclar" səhifəsinə aiddir və bu
taskın əhatəsindən kənardadır (bax aşağı "Nisyə Borclara təsiri").

---

## 1. Dəyişən fayllar

| Fayl | Nə dəyişdi |
|---|---|
| `src/routes/_app.musteriler.tsx` | Kiçik checkbox ("Yalnız borclular") → seqment düymələri ([Hamısı] / [Borcu olanlar], `role="tablist"`), eyni `TableToolbar` daxilində (AC-2, AC-3); cədvəlin altında "Nisyə Borclar"la eyni üslubda "Görünən: N müştəri · X ₼" xülasə sətri əlavə olundu (AC-12) |
| `src/features/customers/components/CustomersTable.tsx` | Müştəri adı sahəsi bütövlüklə kliklənən düyməyə çevrildi → `onView` (AC-5); sətir/mobil "Ödəniş" düyməsi → "Borc ödənişi al" (aria-label + title ilə, AC-7, AC-11); borc rəqəmi/status badge-i 4 dərəcəli tona keçdi (AC-9); sıfır borc "0.00 ₼" göstərir, "—" YOX (AC-10); "Son alış"/"Son əməliyyat" xanalarında boş dəyər `EmptyValue` (aria-label ilə) istifadə edir (AC-10, AC-11) |
| `src/features/customers/components/debt-presentation.ts` | **YENİ** — borc rənginin/badge-inin TƏQDİMAT qaydası (`cash-diff-presentation.ts` naxışı) — `remainingDebt` hesablamasına toxunmadan yalnız RƏNGLƏNDİRMƏNİ təyin edir |
| `src/features/customers/components/debt-presentation.test.ts` | **YENİ** — `debtTone`/`debtAgeDays` üçün unit testlər |
| `src/features/customers/components/CustomerDrawer.tsx` | Daxili tərkib standart kart üslubuna keçdi: "Əlaqə" bölməsi başlıqlı `rounded-card` panelə alındı, "Aldığı mallar"/"Tarixçə" siyahıları `rounded-xl`(12px) → `rounded-card`(16px); "Qalıq borc" panelinin rəngi və başlıqdakı status badge-i eyni 4 dərəcəli tona keçdi (AC-6, AC-9) |
| `src/components/ui/Badge.tsx` | `STATUS_STYLE.Borclu` qırmızıdan sakit (sky) tona dəyişdi; 2 yeni açar əlavə olundu: `"Gecikmiş borc"` (kəhrəba) və `"Kritik borc"` (qırmızı — indi YALNIZ bu ən ağır tərzdə) (AC-9) |
| `src/features/customers/components/CustomersTable.test.tsx` | Yeni testlər: ad kliki, "Borc ödənişi al" etiketi, borc tonu/badge qaydası, sıfır dəyər göstərimi |

`docs/design-system.md`-də (§2, cədvəl #12) qeyd olunan "`TableToolbar`-ın real
istifadəsi: `src/routes/_app.musteriler.tsx` (search + «yalnız borclular»
filtri, FE#122)" — bu deməkdir ki, axtarış+filtr artıq FE#122 ilə **BİR**
`TableToolbar`-da idi (bənd 2 əvvəlcədən ödənilmişdi); bu taskda YALNIZ
filtrin özü (checkbox → seqment) və rəng/etiket qaydaları dəyişdi.

---

## 2. Bənd-bənd qərarlar

### 1. "Yeni müştəri" — əsas əməliyyat

Dəyişmədi — `PageHeader.primaryAction` olaraq tək qalır, yoxlanıldı.

### 2. Axtarış + sürətli filtrlər — bir toolbar

FE#122 ilə artıq `TableToolbar`-ın `search`/`actions` sıxaclarında idi —
bu taskda struktur dəyişmədi, YALNIZ `actions` sıxacındakı kontrol (bənd 3)
yeniləndi.

### 3. Checkbox → seqment düymələri, URL-də

`<input type="checkbox">` "Yalnız borclular" ƏVƏZİNƏ `role="tablist"` ilə iki
düymə: **[Hamısı]** / **[Borcu olanlar]** — Nisyə Borclar səhifəsindəki
status/fəaliyyət seqment düymələri ilə eyni vizual dil (`bg-emerald-700`
aktiv, `rounded-chip`, `min-h-[40px]`). URL sxemi **DƏYİŞMƏDİ**:
`?onlyDebtors=true/false` — köhnə deep-link-lər işləməyə davam edir, yalnız
görünüş dəyişdi.

### 4. Ad/telefon axtarışı

`LocalTableSearch` və filtrasiya məntiqi (`c.name`/`c.phone` üzrə, `phoneDigits`
normalizasiyası ilə) **dəyişməyib** — yalnız yoxlanıldı.

### 5. Müştəri adı → CustomerDrawer

Əvvəllər ad xanası sadə mətn idi, detal yalnız "⋯" menyusundakı "Detal"
bəndindən və ya sətir düymələrindən açılırdı. İndi ad sahəsinin BÜTÖVÜ
`<button onClick={() => onView(c)}>`-dir (`aria-label`/`title`:
`"{ad} — müştəri detalına bax"`), həm desktop cədvəldə, həm mobil kartda.
`ActionMenu`-dəki "Detal" bəndi və mobil "Detal" düyməsi əlavə/alternativ yol
kimi qalır (Mallar səhifəsindəki FE#70 AC-16 naxışı ilə eyni).

### 6. CustomerDrawer → standart kart üslubu, VAHİD tarixçə saxlanıldı

Dörd bölmə tələb olunurdu: əlaqə məlumatı · alış tarixçəsi · borc tarixçəsi ·
ödəniş tarixçəsi. Mövcud drawer strukturu bunlara belə uyğunlaşdırıldı:

- **Əlaqə** — əvvəllər başlıqsız, sadə boz zolaq idi; indi digər bölmələrlə
  eyni başlıq üslubunda (`text-xs font-bold uppercase`) və `rounded-card`
  (16px) panel daxilində.
- **Alış tarixçəsi** — mövcud "Aldığı mallar" bölməsi (bütün satışlar, ödəniş
  növündən asılı olmayaraq) — dəyişməyib, YALNIZ konteyner radiusu
  `rounded-xl`(12px) → `rounded-card`(16px).
- **Borc tarixçəsi + Ödəniş tarixçəsi** — **QƏSDƏN AYRI-AYRI SİYAHILARA
  PARÇALANMADI**, mövcud VAHİD xronoloji "Borc / ödəniş tarixçəsi" siyahısı
  saxlanıldı (yalnız konteyner radiusu yeniləndi). **Səbəb:** bir borc qeydi
  (ilkin borc və ya nisyə satış) və onu söndürən ödəniş(lər) vaxt oxunda
  bir-birinin davamıdır; iki ayrı siyahıya bölünsəydi, istifadəçi "bu borc
  artıq ödənilibmi?" sualına cavab tapmaq üçün iki siyahı arasında əl ilə
  tarix müqayisə etməli olardı — bu, PM-in "heç nə itmir/çaşdırılmır"
  prinsipini pozardı. Hər qeyd artıq NÖVÜNƏ görə vizual fərqlənir (ikon +
  fon rəngi + `paymentType` badge-i: ödəniş = yaşıl enmə oxu, ilkin borc =
  kəhrəba kitab ikonu, nisyə satış = qırmızı qalxma oxu) — DS 9-cu qaydaya
  (rəng tək göstərici deyil) artıq uyğun idi, dəyişməyib.
- **"Qalıq borc" əsas panel** — rəngi (border/fon gradient) və başlıqdakı
  status badge-i indi 2 dərəcəli (Borclu/Ödənilib) ƏVƏZİNƏ eyni 4 dərəcəli
  tondadır (bax bənd 9) — `CustomersTable`-la EYNİ qayda.

### 7. "Ödəniş" → "Borc ödənişi al"

Sətir səviyyəsindəki qeyri-müəyyən "Ödəniş" düyməsi (həm desktop, həm mobil
kart) **"Borc ödənişi al"** oldu — mövcud davranış dəyişmədi (klik
`onPay(customer)` çağırır, `PaymentModal` açılır). `aria-label`/`title`
`"{ad} — borc ödənişi al"` əlavə olundu (bənd 11 ilə üst-üstə).

`OpenDebtsTable.tsx`-dəki (yalnız "Nisyə Borclar → Borclar" görünüşündə
istifadə olunan, ayrıca komponent) "Ödəniş al" mətni artıq kifayət qədər
aydın idi və bu taskın əhatəsində DEYİL (yalnız Müştərilər səhifəsi
refactor olunur) — TOXUNULMAYIB. Nəticədə iki səhifə arasında incə
terminoloji fərq qalır ("Borc ödənişi al" / "Ödəniş al") — hər ikisi eyni
əməliyyatı (borc ödənişi qəbulu) göstərir, çaşdırıcı deyil, lakin gələcək
bir mərhələdə tam unifikasiya üçün namizəddir.

### 8. Yeni ödəniş axını yaradılmadı

`PaymentModal.tsx` FAYLINA HEÇ BİR TOXUNUŞ EDİLMƏYİB — həm "Borc ödənişi al"
sətir düyməsi, həm `CustomerDrawer`-in "Ödəniş əlavə et" düyməsi eyni,
mövcud modalı açır.

### 9. Borc rəngi — HƏR borclu "dağıdıcı xəta" kimi görünmür

Yeni `debt-presentation.ts` modulu (`cash-diff-presentation.ts` naxışı,
bax `docs/design-system.md` §2) 4 dərəcəli ton təyin edir:

| Ton | Şərt | Rəqəm rəngi | Badge |
|---|---|---|---|
| `none` | `remainingDebt <= 0` | boz (`text-stone-500`) | `Ödənilib` (yaşıl) |
| `normal` | borc var, < 60 gün hərəkətsiz | tünd neytral (`text-stone-800`) | `Borclu` (sakit sky — **artıq qırmızı DEYİL**) |
| `overdue` | 60–119 gün hərəkətsiz | kəhrəba (`text-amber-700`, DS `warning` tonu) | `Gecikmiş borc` (kəhrəba) |
| `critical` | 120+ gün hərəkətsiz | qırmızı (`text-red-600`, DS `danger` tonu) | `Kritik borc` (qırmızı — **YALNIZ bu halda**) |

**"Hərəkətsizlik yaşı" necə hesablanır:** son ödəniş tarixi, yoxdursa son
alış tarixi, o da yoxdursa müştərinin yaradılma tarixi (`createdAt`). Heç
biri yoxdursa (nadir/köhnə data), yaş NAMƏLUM sayılır və ən sakit ("normal")
tona düşür — məlumat çatışmazlığı YANLIŞLIQLA "kritik" kimi göstərilməsin
deyə.

**Nəyə görə "60/120 gün" və "son ödəniş/alış tarixi"?** PM tələbi hərfi
"GECİKMİŞ (60+ gün)" dedi, lakin dəqiq mənbə göstərmədi. `remainingDebt`
müştəri-üzrə **cəm** dəyərdir (mənbə-üzrə deyil) — dəqiq "bu konkret borc
neçə gündür açıqdır" məlumatı yalnız `GET /api/customers/open-debts`
(`OpenDebt.daysOld`) sətirlərində var və artıq "Nisyə Borclar → Borclar"
görünüşündə (`OpenDebtsTable`, dəyişməyib, öz 60+/30+ qırmızı/kəhrəba
qaydası ilə) göstərilir. Müştəri-aqreqat səviyyəsində YENİ API sorğusu
əlavə etmək (`useOpenDebts`-i `_app.musteriler.tsx`-ə də bağlamaq) bu
taskın əhatəsini genişləndirib əlavə şəbəkə asılılığı yaradardı; ona görə
mövcud `Customer` sahələrindən (son ödəniş/son alış/yaradılma tarixi) İSTİFADƏ
OLUNDU — bu, "borc nə vaxtdan hərəkətsizdir" sualına yaxın, lakin
"mənbə-üzrə DƏQİQ yaş" ilə EYNİ DEYİL. Fərq aydın sənədləşdirilib (kodda və
burada) ki, gələcək QA/inkişaf bunu bilə bilsin. **120 gün "kritik"
həddi** PM tələbində rəqəm kimi verilməyib — DS-in "qırmızı yalnız kritik
hallarda" prinsipinə (danger yalnız ən ağır say ilə) uyğun, 60 günün
qatı (2 dəfə) olaraq seçilib; bu, sərbəst/sübut olunmamış bir hədd olduğu
üçün QA-da PM ilə bir daha təsdiqlənməlidir.

**`STATUS_STYLE.Borclu` qlobal dəyişikliyi:** `Badge` primitivinin
`Borclu`/`Ödənilib` tonları YALNIZ `CustomersTable`/`CustomerDrawer`-dən
istifadə olunur (kod bazasında yoxlanıldı) — dəyişiklik bu iki komponentdən
kənara SIZMIR.

### 10. Sıfır ilə mövcud olmayan dəyər fərqi

Əvvəllər `remainingDebt <= 0` "—" (boz tire) göstərirdi — bu, PAID-UP
müştərinin borcunu "naməlum dəyər" kimi göstərirdi (yanlış). İndi
**"0.00 ₼"** göstərir (boz, sakit rəngdə, amma real dəyər). Həqiqətən
MÖVCUD OLMAYAN dəyərlər (məs. "Son alış"/"Son əməliyyat" tarixi heç vaxt
olmayıbsa) `EmptyValue` (`—` + `aria-label`) ilə göstərilir — bu iki hal
artıq vizual/semantik olaraq fərqlənir.

Telefon xanasında boş dəyər hələ də HEÇ NƏ göstərmir (nə "0", nə "—") —
bu, FE#63-dən qalma QƏSDƏN qərardır (`CopyablePhone.tsx` şərhi: "telefonu
olmayan müştəri sətrində "—" əvəzinə heç nə göstərilmir") və bu taskın
əhatəsində DEYİL, TOXUNULMAYIB.

### 11. Əlçatanlıq etiketləri

- Ad düyməsi: `aria-label`/`title` = `"{ad} — müştəri detalına bax"`.
- "Borc ödənişi al" düyməsi: `aria-label`/`title` = `"{ad} — borc ödənişi al"`.
- "⋯" `ActionMenu` triqqeri: `aria-label={"{ad} əməliyyatları"}` — artıq
  mövcud idi (`ActionMenu`-nun öz daxili qaydası triqqerin `title`-ni də
  eyni mətnlə doldurur, `ActionMenu.tsx:199`) — yoxlanıldı, dəyişməyib.
- Mobil "Detal" düyməsi: `aria-label`/`title` = `"{ad} — detala bax"` (əlavə
  olundu).

### 12. Səhifələmə və nəticə sayı

`TablePagination` artıq (FE#69) `DataTable` daxilində AVTOMATİK işləyir —
`CustomersTable` heç bir dəyişiklik tələb etmirdi (`hidePagination`
verilmir). Əlavə olaraq, "Nisyə Borclar" səhifəsindəki eyni "Görünən: N
müştəri · X ₼" xülasə sətri (cari filtrə uyğun say, `TablePagination`-ın
göstərdiyi ÜMUMİ say ilə QARIŞDIRILMASIN deyə fərqli yerdə — cədvəlin
altında) Müştərilər səhifəsinə də əlavə olundu ki, iki səhifə eyni
vizual dilə tam uyğunlaşsın.

### 13. Loading/boş/xəta vəziyyətləri

`DataTable`-ın paylaşılan `TableSkeleton`/`InlineError`/`EmptyState`
primitivləri artıq istifadə olunurdu (FE#69/FE#87) — dəyişiklik edilmədi,
yoxlanıldı.

---

## 3. Nisyə Borclara təsiri

`CustomersTable`, `CustomerDrawer` və `PaymentModal` Müştərilər VƏ Nisyə
Borclar səhifələri arasında paylaşılır. Bu taskda **`PaymentModal`-a HEÇ
TOXUNULMAYIB** (ən yüksək risk sıfır). `CustomersTable`/`CustomerDrawer`-ə
edilən HƏR dəyişikliyin Nisyə Borclar-a təsiri:

| Dəyişiklik | Harada görünür (Borclar) | Təsir |
|---|---|---|
| Ad sahəsi → kliklənən düymə (bənd 5) | `mode="musteri"` cədvəli | Müsbət — əvvəllər ad sahəsi kliklənmirdi (yalnız "⋯"/mobil "Detal" düyməsi işləyirdi), indi Borclar-ın "Müştəri üzrə" görünüşündə də eyni qısayol əlavə olundu. `mode="borclar"` (`OpenDebtsTable`) TƏSİRLƏNMİR — ayrıca komponentdir, artıq öz `onRowClick`-i var (dəyişməyib) |
| "Ödəniş" → "Borc ödənişi al" (bənd 7) | `mode="musteri"` cədvəli | Mətn dəyişikliyi — `onPay` çağırışı, `PaymentModal` eyni. `mode="borclar"` (`OpenDebtsTable`, "Ödəniş al") TƏSİRLƏNMİR |
| Borc rəngi/badge 4 dərəcəli ton (bənd 9) | `mode="musteri"` cədvəli, HƏM `CustomerDrawer` (hər iki səhifədə paylaşılır) | Vizual — "Borclu" statusu artıq qırmızı yox, sakit tondadır; `Kritik borc`/`Gecikmiş borc` yeni etiketlər əlavə olundu. `status` URL filtri (`?status=borclu/odenilib/all`) HƏLƏ DƏ `remainingDebt` üzərindən işləyir (route faylı dəyişməyib) — YALNIZ görünüş dəyişdi, filtrasiya məntiqi EYNİDİR. `mode="borclar"` (`OpenDebtsTable`) öz ayrıca rəng qaydasını (60+/30+ qırmızı/kəhrəba) saxlayır, TƏSİRLƏNMİR |
| "0.00 ₼" vs "—" (bənd 10) | `mode="musteri"` cədvəli | Vizual — ödənilmiş müştəri artıq "—" yox, "0.00 ₼" göstərir |
| `EmptyValue` — "Son əməliyyat" xanası (bənd 11) | `mode="musteri"` cədvəli (`lastActivityCol`) | Vizual — boş sahə indi `aria-label` ilə |
| `STATUS_STYLE.Borclu` qlobal rəng dəyişikliyi | `CustomerDrawer` başlığı (hər iki səhifədən açılır) | Yuxarıdakı borc rəngi sətri ilə eyni — `Badge` başqa heç bir modulda `Borclu`/`Ödənilib` tonu ilə çağırılmır (kod bazasında yoxlanıldı, bax bənd 9) |
| `CustomerDrawer` kart üslubu (bənd 6) | Hər iki səhifədən açılan drawer | Vizual/struktur — data/sorğular dəyişməyib, yalnız konteyner radiusu və "Əlaqə" başlığı |

**Necə yoxlanıldı:** headless brauzer mühiti mövcud olmadığı üçün (əvvəlki
FE#70/FE#71 taskları ilə eyni məhdudiyyət) vizual skrinşot alınmadı — kod
səviyyəsində yoxlama aparıldı:

1. `src/routes/_app.borclar.tsx` faylının özünə (route JSX-i) HEÇ BİR sətir
   dəyişməyib — `git diff` ilə təsdiqlənə bilər.
2. `CustomersTable`/`CustomerDrawer`-ə edilən propların (interfeysin) heç
   biri silinməyib/adı dəyişməyib — `Borclar` səhifəsinin bu komponentlərə
   ötürdüyü bütün proplar (`customers`, `isLoading`, `isError`, `onRetry`,
   `canEdit`, `canDelete`, `embedded`, `onView`, `onPay`, `onEdit`,
   `onDelete`, `emptyState`, `customer`, `onClose`) **DƏYİŞMƏDƏN** qalıb.
3. `variant` prop-unun defolt dəyəri (`"debtors"`) dəyişməyib — Borclar
   səhifəsi `variant` prop-unu ötürmür, ona görə həmişəki kimi "debtors"
   sütun dəstini (Qalıq borc · Son əməliyyat · Status · Əməliyyat) alır;
   `withBadge={variant === "all"}` şərti Borclar-da HEÇ VAXT `true` olmur —
   yəni Qalıq borc sütununda badge TƏKRARLANMIR (Status sütunu onsuz da
   göstərir) — bu, `CustomersTable.test.tsx`-dəki yeni testlə (bənd "'debtors'
   variantında... TƏKRARLANMIR") təsdiqlənib.
4. `npx vitest run` — bütün 194 test (mövcud 176 + bu taskda əlavə olunan
   18 yeni) YAŞIL, o cümlədən `CustomersTable.test.tsx`-in mövcud (FE#87)
   xəta-vəziyyəti testləri (regressiya yoxlaması) və `debt-presentation.test.ts`.
5. `npm run build` — 0 TypeScript xətası, `vite build` uğurlu.

Bu yoxlama metodologiyası Nisyə Borclar səhifəsinin **kodca pozulmadığını**
yüksək etibarla göstərir, lakin PİKSEL-səviyyəli vizual QA (real brauzerdə)
gələcək QA dövründə əlavə təsdiqlənməlidir — xüsusilə `Kritik borc`/`Gecikmiş
borc` badge-lərinin "Müştəri üzrə" cədvəlində sütun enini pozmadığından əmin
olmaq üçün.

---

## 4. Yekun (build/test/responsive)

- `npm run build` (`tsc && vite build`) — **0 xəta**.
- `npx vitest run` — **194/194 test yaşıl** (mövcud 176 + bu taskda əlavə
  olunan 18 yeni: `CustomersTable.test.tsx` — ad kliki (AC-5), "Borc ödənişi
  al" etiketi (AC-7/AC-11), borc rəngi/badge qaydası (AC-9/AC-10), "debtors"
  variantında badge təkrarlanmaması; `debt-presentation.test.ts` — `debtTone`/
  `debtAgeDays` pure funksiyaları).
- Responsive: kod səviyyəsində 1280/1366/1440/1920px üçün mövcud
  `DataTable`/`mobileCard` breakpoint-i (`md:hidden`/`hidden md:block`,
  FE#69-dan bəri dəyişməyib) və yeni seqment düymələrinin/xülasə sətrinin
  `TableToolbar`-ın mövcud `flex-col sm:flex-row` naxışı ilə uyğunluğu
  yoxlanıldı; 375px üçün mobil kart (yalnız ad indi düymə, badge/rəqəm
  rəngi dəyişib, düymə mətni uzanıb — "Borc ödənişi al" `flex-1` daxilində
  sərbəst sətirlənə bilər, layout pozulmur) nəzərdən keçirildi. Headless
  brauzer mühiti mövcud olmadığı üçün vizual skrinşot yoxlaması aparılmayıb
  — CSS/breakpoint səviyyəsində təsdiqləndi (FE#70/FE#71-də istifadə olunan
  eyni metodologiya).
- Nisyə Borclar səhifəsi: bax yuxarı §3 — route faylı dəyişməyib, paylaşılan
  komponentlərin prop kontraktı qorunub, mövcud + yeni testlər yaşıl.

## 5. Tam icra edilə bilməyən/güzəştə gedilən tələblər

- **"GECİKMİŞ (60+ gün)" hesablama mənbəyi** — dəqiq "mənbə-üzrə borc yaşı"
  (`OpenDebt.daysOld`, backend-dən) əvəzinə müştəri-aqreqat sahələrindən
  (son ödəniş/son alış/yaradılma tarixi) TƏXMİNİ yaş hesablanıb — yeni API
  sorğusu əlavə etməmək üçün şüurlu güzəşt (bax bənd 9, ətraflı izah).
- **"Kritik borc" 120 gün həddi** — PM tələbində rəqəm verilməyib, DS
  prinsipinə əsasən (60 günün qatı) seçilib — QA/PM təsdiqi tövsiyə olunur.
- **`OpenDebtsTable`-in "Ödəniş al" mətni** `CustomersTable`-ın yeni "Borc
  ödənişi al" mətni ilə TAM unifikasiya EDİLMƏDİ (bənd 7-də izah olunub) —
  bu taskın əhatəsi ciddi şəkildə "yalnız Müştərilər səhifəsi" olduğu üçün
  qəsdən toxunulmayıb.
- Vizual (piksel-səviyyəli) skrinşot yoxlaması aparılmadı — headless brauzer
  mühiti mövcud deyil (əvvəlki FE#70/FE#71-də də eyni məhdudiyyət qeyd
  olunub).
