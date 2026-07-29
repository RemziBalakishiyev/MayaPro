# QA Report — FE#10: Gələcək tarixli xərc qarşısının alınması

**Tarix:** 2026-07-27
**QA Agent:** qa-tester
**Test edilən branch:** `task/FE#10-gelecek-tarixli-xerc`
**Base branch (stacked):** `task/FE#9-hesabat-xerc-bolgusu` (əvvəlki sessiyada Done edilib, bu sessiyada YENİDƏN test edilməyib)
**Test edilən commit-lər:** `cb071a4` (fix), `500c2b3` (review düzəlişləri)
**Issue:** #10
**Diff:** `git diff "task/FE#9-hesabat-xerc-bolgusu"..."task/FE#10-gelecek-tarixli-xerc"`
**Mühit:** Lokal, Windows, Node/npm (layihədə test framework yoxdur — yalnız `dev`/`build`/`preview` skriptləri var).

## Xülasə

| Göstərici | Dəyər |
|---|---|
| Ümumi AC | 4 |
| ✅ Pass | 3 (AC1, AC3, AC4) |
| ⚠️ Partial/Fail (kənar hal) | 1 (AC2) |
| Ümumi TC | 3 |
| ✅ Pass | 2 (TC-01, TC-02) |
| ⚠️ Partial | 1 (TC-03) |
| Yaradılan bug sayı | 0 (özüm task yaratmadım — tapşırığa görə yalnız report-da severity göstərilir) |
| Tapıntı sayı | 1 (Medium) |
| **Yekun qərar** | **Şərti PASS** — UI-form axını tam düzəldilib, AMMA AC2/TC-03-ün tam təmin edilməsi üçün backend validasiyası və/və ya Xərclər səhifəsinin dövr sərhədi əlavə edilməlidir (orchestrator qərar verməlidir: Done + təqib task, ya da In Progress) |

Build: `npm run build` (`tsc && vite build`) → **0 xəta**, `2772 modules transformed`, `built in 6.47s`. Ayrıca `npx tsc --noEmit` → 0 xəta. Yalnız pred-mövcud chunk-size xəbərdarlığı (`> 500 kB`) — bu PR-ə aid deyil.

## Test yanaşması

Layihədə heç bir test framework (`vitest`/`jest`/Playwright/Cypress) yoxdur və tapşırığa görə yenisi əlavə edilə bilməz. Bu sessiyada `npm run dev` işə salınmadı (tapşırıq təlimatına görə arxa planda uzun proses saxlanılmamalıdır); bütün AC/TC statik kod analizi (kod yolunun izlənməsi + `grep -rn "todayISO|daysAgoISO"` ilə HƏR istifadə yerinin gəzilməsi) ilə doğrulanıb, `npm run build` + `npx tsc --noEmit` ilə tip-təhlükəsizliyi təsdiqlənib. Bundan əlavə backend tərəfi (`CreateExpenseValidator.cs`, `CreateExpenseCommand.cs`) YALNIZ OXUNARAQ (dəyişdirilmədən) cross-check üçün araşdırıldı — AC2/TC-03-ün kök səbəbini müəyyənləşdirmək üçün vacib idi.

## Dəyişikliklərin baxışı

- `src/features/expenses/components/ExpenseForm.tsx`: `dateError` state; `<Input type="date" max={todayISO()}>`; submit-də `date > todayISO() && date !== initialDate` yoxlaması (redaktədə mövcud gələcək tarixi DƏYİŞDİRMƏDƏN saxlamağa icazə verir, YALNIZ yeni gələcək dəyərə keçidi bloklayır); boş tarix üçün ayrıca xəta; `onChange`-də keçərli seçimdə xəta təmizlənir.
- `src/lib/format.ts`: `todayISO()`/`daysAgoISO()` `toISOString()` (UTC) əvəzinə `date-fns` `format(new Date(), "yyyy-MM-dd")` (LOKAL təqvim günü) istifadə edir — Bakı UTC+4 olduğu üçün gecə 00:00–04:00 arası əvvəlki "dünənin tarixi" bug-ı düzəldilib.

## Acceptance Criteria nəticələri

| AC | Təsvir | Nəticə | Sübut |
|---|---|---|---|
| AC1 | Gələcək tarixli xərc UI-dan yaradıla bilmir | ✅ PASS | `ExpenseForm.tsx:307` `max={todayISO()}` native təqvimi bloklayır; `ExpenseForm.tsx:212-216` submit validasiyası klaviatura ilə yazılan/`max`-ı keçən tarixi də tutur (`date > todayISO()`) — hər iki yol örtülüb. |
| AC2 | Cari ayda gələcək tarixli xərc mövcud olduqda Hesabatlar və Xərclər rəqəmləri eynidir | ⚠️ PARTIAL — yalnız "bu PR-dan sonra YARADILAN" data üçün doğrudur, MÖVCUD/kənar yolla yaradılan gələcək tarixli data üçün DEYİL | Bax aşağıda "Tapıntı T-1". Qısaca: bu PR YALNIZ frontend formunu dəyişir; backend (`CreateExpenseValidator.cs`) tarixi HEÇ VALIDASIYA ETMİR, `_app.xercler.tsx:64-66`-dakı "Bu ay üzrə cəmi xərc" isə HƏLƏ DƏ bütün təqvim ayını (bu gündən sonrakı tarixlər daxil) toplayır, backend `summary`/`ReportPeriod.Month` isə `To=bu gün` ilə bitir. Deməli əgər gələcək tarixli xərc SİSTEMDƏ MÖVCUDDURSA (məs. bu PR-dan ƏVVƏL yaradılıb, ya da API-dən birbaşa — Postman/inteqrasiya — göndərilib), iki səhifənin rəqəmi HƏLƏ DƏ fərqli olacaq — bu, məhz FE#10-un düzəltmək istədiyi orijinal bug-ın özüdür, sadəcə YENİ belə data yaradılmasının qarşısı alınıb. |
| AC3 | Mövcud (keçmiş/bugünkü) xərclərin yaradılması/redaktəsi pozulmur | ✅ PASS | `dateErr` yalnız `date > todayISO()` olduqda işə düşür; keçmiş/bugünkü tarix üçün həmişə `""`. Redaktədə `initialDate` istisnası (`date !== initialDate`) mövcud gələcək tarixli qeydin YALNIZ tarix sahəsi TOXUNULMADAN saxlanmasına icazə verir — digər sahələr (ad, məbləğ, qeyd və s.) sərbəst redaktə edilə bilir, forma kilidlənmir. |
| AC4 | `npm run build` xətasız | ✅ PASS | `tsc && vite build` → `✓ 2772 modules transformed`, `built in 6.47s`, 0 error. `npx tsc --noEmit` də ayrıca 0 xəta verdi. |

## Test Case nəticələri

| # | Ad | Nəticə | Metod | Qeyd |
|---|---|---|---|---|
| TC-01 | Sabahkı tarix seçilməyə çalışılır → seçilmir/rədd olunur | ✅ PASS | Statik | `max={todayISO()}` native təqvimdə sabahı disable edir; klaviatura ilə yazılsa belə (`max` atributu klaviaturanı bloklamır — komment kodda da qeyd olunub) submit-də `dateErr` işə düşür, `if (... || dateErr) return` xərci göndərmir, `Field`-də qırmızı xəta mətni göstərilir (`error={dateError}`). |
| TC-02 | Bugünkü/keçmiş tarixli xərc əvvəlki kimi yaradılır/redaktə olunur | ✅ PASS | Statik | `date <= todayISO()` olduqda `dateErr=""`; yaradılma/redaktə axını (payload, `createMut`/`updateMut`) dəyişməyib. |
| TC-03 | Cari ayda gələcək tarixli xərc datası VARSA, Hesabatlar/Xərclər rəqəmləri eynidir | ⚠️ PARTIAL/FAIL (kənar hal) | Statik | Bax AC2 və Tapıntı T-1 — real backend rejimində (adi/production ssenari) server `summary.generalExpenses/productExpenses` `To=bu gün` sərhədi ilə gələcək tarixli xərci XARİC edir, Xərclər səhifəsi isə HEÇ BİR sərhəd olmadan bütün ayı toplayır → mövcud gələcək tarixli data üçün rəqəmlər HƏLƏ DƏ fərqlənə bilər. Yalnız fallback (server sahələri yoxdursa, lokal `expenseBySource(periodExpenses)`) yolunda hər iki səhifə eyni (sərhədsiz) məntiqi istifadə etdiyi üçün TƏSADÜFƏN uyğunlaşır — bu, adi/production axını deyil. |

## Tapıntı (bloklayıcı deyil, lakin AC2/TC-03-ə bilavasitə aiddir)

### T-1 (Severity: **Medium**) — Fix yalnız UI-form səviyyəsindədir; backend validasiyası və Xərclər səhifəsinin "Bu ay" sərhədi hələ də açıqdır

**Fayllar:**
- `frontend/src/features/expenses/components/ExpenseForm.tsx:205-222` (yalnız FE validasiyası — düzgün, amma tək başına kifayət deyil)
- `frontend/src/routes/_app.xercler.tsx:64-66` ("Bu ay üzrə cəmi xərc" — `e.date.slice(0,7)===month`, `today`-dan asılı DEYİL)
- `backend/src/Modules/MayaPro.WarehouseApi.Modules.Expenses/Application/UseCases/CreateExpense/CreateExpenseValidator.cs` — `Date` sahəsi üçün HEÇ BİR `RuleFor` YOXDUR (yalnız oxundu, dəyişdirilmədi)
- `backend/.../CreateExpense/CreateExpenseCommand.cs:14` — `DateTime? Date` — sərbəst, məhdudiyyətsiz

**Təsvir:** FE#10-un düzəlişi (`max` + submit validasiyası) YALNIZ brauzerdəki `ExpenseForm` vasitəsilə yaradılan/redaktə edilən xərcləri əhatə edir. Aşağıdakı yollarla gələcək tarixli xərc HƏLƏ DƏ sistemdə görünə bilər:
1. **Backend-ə birbaşa müraciət** (Postman, inteqrasiya, gələcək mobil client) — `CreateExpenseCommand.Date` heç vaxt validasiya olunmur, server istənilən tarixi qəbul edir.
2. **Mövcud (bu PR-dan ƏVVƏL yaradılmış) gələcək tarixli qeydlər** — redaktə zamanı `initialDate` istisnası bu qeydlərin tarixini DƏYİŞDİRMƏDƏN saxlamağa icazə verir (bu, düzgün UX qərarıdır — formu kilidləməmək üçün), lakin bu o deməkdir ki, belə qeydlər sistemdə QALMAĞA davam edə bilər.

Bu iki halda, real backend rejimində (production-un tipik axını): `_app.xercler.tsx`-dəki "Bu ay üzrə cəmi xərc" bu qeydi DAXİL edir (heç bir `today` sərhədi yoxdur), Hesabatlar səhifəsindəki `useSummary("month")` isə server `ReportPeriod.Month` (`To=bu gün`) sərhədinə görə bu qeydi XARİC edir → **AC2/TC-03-ün tələb etdiyi bərabərlik pozulur** — dəqiq FE#10 issue-də təsvir olunan orijinal simptom.

**Gözlənilən (AC2):** Cari ayda gələcək tarixli xərc mövcud olduqda iki səhifə eyni rəqəmi göstərməlidir.
**Faktiki:** Yalnız "bu PR-dan sonra, formdan yaradılan" data üçün təmin olunur; kənar yollarla yaranan/mövcud gələcək tarixli data üçün fərq davam edir.

**Qeyd:** Bu, FE#10-un işini FAIL ETMİR ("gələcək tarixli xərc UI-dan yaradıla bilmir" AC1 tam doğrudur, bu da issue-nun əsas tələbidir) — lakin AC2-nin HƏR SSENARİDƏ (o cümlədən mövcud/kənar data ilə) tam təmin olunduğunu iddia etmək YANLIŞDIR. Tövsiyə: (a) backend `CreateExpenseValidator`/`UpdateExpenseValidator`-a `Date <= today (Asia/Baku)` qaydası əlavə etmək (əsl fix, UI-dan asılı olmayan), və/və ya (b) `_app.xercler.tsx`-dəki "Bu ay üzrə cəmi xərc" hesablamasını da `today`-a qədər məhdudlaşdırmaq ki, backend `summary` ilə struktur olaraq HƏMİŞƏ uyğun olsun (mövcud kənar data olsa belə).

## Regressiya (`todayISO`/`daysAgoISO` qlobal təsiri)

`grep -rn "todayISO|daysAgoISO" src/` ilə BÜTÜN istifadə yerləri gəzildi:

- **`daysBetween()`** (`format.ts:47-53`): `new Date(todayISO())` — `todayISO()` yalnız `"YYYY-MM-DD"` sətri qaytarır, `new Date(sətir)` HƏMİŞƏ (həm köhnə, həm yeni versiyada) bu sətri UTC gecəyarı kimi parse edir. Dəyişən TƏK ŞEY hansı təqvim gününün seçildiyidir (əvvəl UTC günü, indi lokal gün) — parse REJİMİ eyni qalıb, ona görə YENİ UTC/lokal qarışıqlığı YARANMIR. ✅ Regressiya yoxdur.
- **`routes/_app.xercler.tsx:60`** (`month` default = `todayISO().slice(0,7)`): Bakı UTC+4-də gecə 00:00–04:00 arası indi DÜZGÜN cari ayı göstərir (əvvəl bəzən keçən ayın son günü UTC-də "dünən" sayılıb səhv ay seçilə bilərdi ay sərhədində). ✅ Düzəliş, regressiya yoxdur.
- **`features/reports/lib.ts`** (`inPeriod`, `monthlySeries`, `dailySeries`, `weeklySeries`): hamısı NİSBİ hesablamalardır (`todayISO()`-a görə sürüşən pəncərələr) — lokal/UTC keçidi pəncərələri bir neçə saat sürüşdürə bilər (gecəyarı ətrafında), amma DAXİLİ TUTARLILIQ pozulmur (bütün funksiyalar eyni `todayISO()`-dan istifadə edir). Yalnız "month" AC2/T-1-də qeyd olunan kənar halla bağlıdır (yuxarıda). ✅ Əlavə regressiya yoxdur.
- **`features/reports/queries.ts:62`** (`computeDashboardStats`, mock rejim): `t = todayISO()` — `todaySales`/`todayExpenses` filtrləri bu günə görə, MOCK data-da (`seed.ts`) gələcək tarix yoxdur (yalnız `daysAgoISO`/`todayISO`), test edilə bilməz amma strukturca risk yoxdur.
- **`features/sales/lib.ts`** (`periodToRange`): `daysAgoISO`/`todayISO`-dan API `from/to` parametrləri qurulur — server öz tərəfində gün sərhədini bilir, bu sadəcə range təklifidir, kritik deyil.
- **`features/day-end/components/DayEndCard.tsx:47`**: `t = todayISO()`, `defaultOpening` üçün `closings.filter(c => c.date < t)` — dəqiq lokal günə uyğunlaşma DÜZGÜNdür (dünənki bağlanışı düzgün tapmaq üçün bu, AZ VACİB deyil, MÜHÜM düzəlişdir — köhnə UTC versiyası gecə saatlarında SƏHV "dünənki" bağlanışı seçə bilərdi).
- **`mocks/seed.ts`, `mocks/handlers.ts`**: yalnız mock/dev data generasiyası, prod-a təsir etmir, MSW handler-lərində `todayISO()` server-tərəf tarix möhürü kimi istifadə olunur — davranış eynidir (sadəcə hansı təqvim günü "bu gün" sayılır dəyişir), funksional risk yoxdur.
- **`features/customers/api.ts`**: `updatedAt`/`date` möhürləri — audit/görünüş məqsədli, biznes məntiqinə təsir etmir.

**Nəticə:** `todayISO()`/`daysAgoISO()` UTC→lokal keçidi ÖZÜ regressiya yaratmır (bütün istifadələr ya nisbi/daxili-tutarlı, ya da audit xarakterlidir); əksinə `DayEndCard` və `_app.xercler.tsx` ay/gün sərhədi seçimini DÜZƏLDİR. Yeganə açıq qalan risk T-1-dir (AC2/TC-03) və birbaşa `todayISO()` dəyişikliyinə DEYİL, formun future-date bloklamasının yalnız UI səviyyəsində olmasına aiddir.

## İşlədilən əmrlər

```bash
git -C ".../frontend" branch --show-current
git -C ".../frontend" diff "task/FE#9-hesabat-xerc-bolgusu"..."task/FE#10-gelecek-tarixli-xerc"
grep -rn "todayISO|daysAgoISO" src/
npm run build      # tsc && vite build → 0 error, built in 6.47s
npx tsc --noEmit   # 0 error
git -C ".../frontend" log --oneline -5
git -C ".../frontend" status
```

## İşlədilə bilməyən testlər

- Runtime (brauzerdə) vizual/interaktiv yoxlama (native `<input type=date>` təqviminin faktiki sabahı disable etdiyini gözlə görmək, toast/error mesajlarının render olunması) — tapşırıq təlimatına görə `npm run dev` arxa planda uzun müddət saxlanılmadı, bu sessiyada icra edilmədi. Kod yolu tam statik təhlil edilib, amma brauzer-DOM davranışı (məs. Chrome/Firefox-un `max` atributunu necə tətbiq etdiyi) vizual təsdiqlənmədi.
- Real backend/mock ilə canlı `summary` cavabının AC2/T-1 ssenarisində FAKTİKİ ədədi fərqinin ölçülməsi (server işə salınmadı) — tapıntı yalnız kod oxunması ilə (backend validator + FE filtr məntiqi) sübut olundu, canlı ədədlə YOX.

## Tövsiyələr

1. AC1/AC3/AC4 tam PASS — issue-nun əsas tələbi ("UI-dan gələcək tarixli xərc yaradıla bilməsin") həll olunub, mövcud data axını pozulmayıb, build təmizdir.
2. AC2/TC-03 üçün T-1 tapıntısı (Medium) izlənməlidir: backend `Date` validasiyası (`<= bu gün, Asia/Baku`) əlavə edilməsi tövsiyə olunur — bu, HƏM API-dən birbaşa yaradılan gələcək tarixli xərcin qarşısını alar, HƏM DƏ FE-dəki validasiyanın "təkcə UI qoruması" olmaqdan çıxıb əsl invariant halına gəlməsini təmin edər. Alternativ/əlavə: `_app.xercler.tsx`-in "Bu ay" cəmini `today`-a qədər məhdudlaşdırmaq.
3. Növbəti sessiyada mümkünsə `npm run dev` + headless brauzer (əgər əlavə edilərsə) ilə TC-01/TC-02-nin vizual (DOM) doğrulanması tövsiyə olunur.

## Yekun verdikt

**Şərti PASS.** AC1, AC3, AC4 və TC-01/TC-02 tam təsdiqlənib, `npm run build`/`tsc --noEmit` 0 xəta, `todayISO()`/`daysAgoISO()` qlobal dəyişikliyi geniş yoxlanılıb — heç bir YENİ regressiya tapılmadı (əksinə, `DayEndCard`/`_app.xercler.tsx` ay/gün sərhədini düzəldir). AC2/TC-03 isə YALNIZ "bu PR-dan sonra, formdan yaradılan" data üçün tam təmin olunur — backend validasiyası olmadığı və Xərclər səhifəsinin "Bu ay" hesablaması `today`-a bağlı olmadığı üçün, mövcud/kənar yolla yaranan gələcək tarixli data ilə orijinal bug (Hesabatlar ≠ Xərclər) HƏLƏ DƏ TƏKRARLANA bilər (T-1, Medium severity). Bloklayıcı (blocker/high) bug tapılmadı — orchestrator qərar verməlidir: issue-nun əsas tələbini (UI-dan yaradılmasın) tam qarşıladığı üçün Done-a keçirmək VƏ T-1 üçün ayrıca backend task açmaq, YA DA T-1-i bu task daxilində tam bağlamaq üçün In Progress-də saxlamaq.
