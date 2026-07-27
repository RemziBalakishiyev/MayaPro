# QA Report — FE#11: Ay toplamı bu günlə məhdudlaşsın (Xərclər ↔ Hesabatlar uyğunluğu)

**Tarix:** 2026-07-27
**QA Agent:** qa-tester
**Test edilən branch:** `task/FE#11-ay-toplami-bugunle`
**Base branch (stacked):** `task/FE#10-gelecek-tarixli-xerc` (əvvəlki sessiyada "Şərti PASS" olub, bu sessiyada YENİDƏN test edilmədi — yalnız fərq diff-i test edildi)
**Test edilən commit-lər:** `bc44f07` (fix), `5294cba` (senior review refaktoru)
**Issue:** #11
**Diff:** `git -C frontend diff "origin/task/FE#10-gelecek-tarixli-xerc"...HEAD`
**Mühit:** Lokal, Windows, Node/npm. Layihədə test framework (`vitest`/`jest`) yoxdur, brauzer/Playwright yoxdur — statik kod analizi + təcrid olunmuş məntiq doğrulaması (bax aşağıda) + `npm run build`/`tsc --noEmit` istifadə olundu.

## Xülasə

| Göstərici | Dəyər |
|---|---|
| Ümumi AC | 4 |
| ✅ Pass | 4 (AC1, AC2, AC3, AC4) |
| Ümumi TC | 3 |
| ✅ Pass | 3 (TC-01, TC-02, TC-03) |
| Yaradılan bug sayı | 0 |
| Tapıntı sayı | 0 blocker/high, 1 informativ qeyd (scope-dan kənar, senior tərəfindən əvvəlcədən qeyd edilib) |
| **Yekun qərar** | **PASS — Done-a hazırdır** |

Build: `npm run build` (`tsc && vite build`) → **0 xəta**, `2772 modules transformed`, `built in 5.19s`. Əlavə olaraq `npx tsc --noEmit` → 0 xəta.

## Test yanaşması

Layihədə runtime test framework yoxdur və QA-ya tətbiq kodunu dəyişmək qadağandır, ona görə iki üsul paralel işlədildi:

1. **Statik kod analizi** — dəyişdirilmiş hər iki faylın (`src/routes/_app.xercler.tsx`, `src/features/reports/lib.ts`) məntiqi sətir-sətir izlənildi, backend `ReportPeriod.cs` və `ExpensesModuleContract.GetExpensesAsync` ilə sərhəd-sərhədə (inclusive/exclusive) müqayisə edildi.
2. **Təcrid olunmuş funksional doğrulama** — `frontend/` daxilində müvəqqəti `tmp-fe11-verify.mjs` skripti yaradıldı; bu skript `_app.xercler.tsx`-dəki `summaryExpenses`/`monthTotal`/`futureCount` hesablama məntiqini VƏ `reports/lib.ts`-dəki yenilənmiş `inPeriod`-u SÖZBƏSÖZ (dəyişiklik edilmədən) kopyalayaraq 19 konkret ssenaridə (TC-01/02/03 + 6 sərhəd halı) rəqəmsal nəticələri yoxladı. Skript `npx --yes node tmp-fe11-verify.mjs` ilə işlədildi, **19/19 PASS** verdi, sonra **silindi** (repo-da iz qalmadı — `git status` təmiz, aşağıda təsdiqlənib). Tətbiq kodu bu proses boyu HEÇ dəyişdirilmədi.

## Dəyişikliklərin baxışı

- `src/routes/_app.xercler.tsx`: `monthExpenses` (cədvəl üçün, filtrsiz qalır) → yeni `summaryExpenses` memo (yalnız CARİ ay seçilibsə `e.date.slice(0,10) <= today` filtri tətbiq olunur, keçmiş aylarda `summaryExpenses === monthExpenses`) → `monthTotal`/`sourceTotals` bunun üzərində hesablanır. `futureCount` (`monthExpenses.length - summaryExpenses.length`) StatCard `sub`-unda kəhrəba rəngli xəbərdarlıq kimi göstərilir.
- `src/features/reports/lib.ts`: `inPeriod`-un `"week"`/`"month"` qollarına yuxarı sərhəd (`day <= today`) əlavə olunub — əvvəllər bu iki qol gələcək tarixli qeydi də sayırdı, bu isə `mockSummary()` (mock rejimdə Hesabatlar səhifəsinin server-summary əvəzedicisi) vasitəsilə Hesabatlar səhifəsini Xərclər səhifəsindən sistematik BÖYÜK göstərirdi.

## Backend ilə sərhəd müqayisəsi (AC1 üçün kritik)

| | Backend (`ReportPeriod.Month` + `ExpensesModuleContract.GetExpensesAsync`) | Frontend (bu PR-dan sonra) |
|---|---|---|
| Aşağı sərhəd | `new DateOnly(y, m, 1)` — `Date >= LocalDayRangeUtc(from).StartUtc` (daxil) | `day.slice(0,7) === today.slice(0,7)` (ayın 1-dən başlayır, daxil) |
| Yuxarı sərhəd | `today` — `Date < LocalDayRangeUtc(to).EndUtc` → praktikada bugünkü GÜN TAM daxildir (00:00–23:59:59 lokal) | `day <= today` (`day` = `slice(0,10)`) — bugünkü gün TAM daxildir |
| Nəticə | **Hər iki sərhəd inclusive, eyni pəncərə** | ✅ uyğun |

`ExpenseDto.Date` `DateTime` sahəsidir və `"2026-07-27T00:00:00"` formatında serialize olunur (offset-siz) — `ExpenseMapping.cs` və `ExpenseDto.cs` təsdiqlədi. Kod şərhində iddia edilən `slice(0,10)` zərurəti DOĞRUDUR: tam sətir müqayisəsi (`"2026-07-27T14:30:00" <= "2026-07-27"`) `false` qaytarardı və bugünkü, gündüz saatında yaradılmış xərc SƏHVƏN cəmdən çıxardılardı. Bu, təcrid olunmuş skriptdə "Edge: naive full-string compare (no slice) WOULD wrongly exclude" testi ilə RƏQƏMSAL təsdiqləndi (nəticə `false` — yəni skip olunardı, deməli `slice(0,10)` doğrudan da zəruridir).

## Mock vs Real backend qolu (senior-frontend-in xüsusi qeydinə görə)

- **Mock rejim** (`VITE_API_URL` boş): Hesabatlar səhifəsi `useSummary(period)` → `mockSummary()` → `inPeriod(e.date, "month")` istifadə edir. Bu funksiya FE#11-də düzəldilib (yuxarı sərhəd əlavə olundu) → Xərclər səhifəsi ilə **indi eyni** ədəd. Əvvəl (FE#10 QA-da T-1 kimi qeyd olunmuş boşluq) bu qolda uyğunsuzluq VAR idi — FE#11 məhz bunu bağlayır.
- **Real backend qolu**: Hesabatlar səhifəsi `srvGeneral`/`srvProduct` (server `/api/reports/summary`) mövcud olduqda ONLARI istifadə edir — bu, `ReportPeriod.Month` ilə artıq düzgün idi (FE#11-dən ƏVVƏL də). FE#11-in bu qoldakı töhfəsi Xərclər səhifəsinin ÖZ hesablamasını server pəncərəsi ilə uyğunlaşdırmaqdır (`_app.xercler.tsx`-dəki dəyişiklik) — bu, backend-dən asılı olmadan, TAMAMİLƏ client-side işləyir, ona görə mock/real fərqi Xərclər tərəfində YOXDUR.
- **Nəticə:** hər iki qol üçün AC1 təmin olunur — mock qolunda `inPeriod` düzəlişi ilə, real qolda isə Xərclər səhifəsinin öz filtri backend pəncərəsini əks etdirdiyi üçün.

## Acceptance Criteria nəticələri

| AC | Təsvir | Nəticə | Sübut |
|---|---|---|---|
| AC1 | Cari ayda gələcək tarixli xərc datası olduqda Hesabatlar və Xərclər "Xərc" rəqəmləri eynidir | ✅ PASS | Sərhəd-sərhədə müqayisə (yuxarıda) + TC-01 rəqəmsal doğrulama (`120 === 120`, mock qolu daxil). Vacib: bu, FE#10 QA-dakı T-1 tapıntısını (mövcud/kənar yolla yaranan gələcək tarixli data) HƏLL edir — çünki `summaryExpenses` filtri `expenses` siyahısının ÖZÜNƏ tətbiq olunur, formdan necə yarandığından ASILI DEYİL. |
| AC2 | Keçmiş aylar üçün toplam dəyişmir (regressiya yoxdur) | ✅ PASS | Kod: `summaryExpenses = month === today.slice(0,7) ? filter(...) : monthExpenses` — keçmiş ay seçildikdə şərt `false`, `summaryExpenses === monthExpenses` (filtrsiz, əvvəlki davranışın EYNİSİ). TC-02 rəqəmsal doğrulama: `230 === 230`, `futureCount === 0`. |
| AC3 | Xərclər cədvəlindəki sətirlərin göstərilməsi pozulmur | ✅ PASS | `visibleExpenses` HƏLƏ DƏ `monthExpenses`-dən (filtrsiz) qurulur (`_app.xercler.tsx:98-104`) — `summaryExpenses` yalnız StatCard kartında istifadə olunur. Gələcək tarixli sətir cədvəldə görünməyə davam edir, `futureCount` isə StatCard-da izahedici mətn kimi göstərilir ("N gələcək tarixli xərc cəmə daxil deyil") — istifadəçi fərqi izahsız görmür. |
| AC4 | `npm run build` xətasız | ✅ PASS | `tsc && vite build` → `✓ 2772 modules transformed`, `built in 5.19s`, 0 xəta. `npx tsc --noEmit` ayrıca 0 xəta. |

## Test Case nəticələri

| # | Ad | Nəticə | Metod | Qeyd |
|---|---|---|---|---|
| TC-01 | Cari ayda gələcək tarixli xərc datası → Hesabatlar və Xərclər "Xərc" rəqəmləri eynidir | ✅ PASS | Statik + təcrid olunmuş rəqəmsal skript | `today=2026-07-27`, xərclər: bugünkü (100, in), gələcək 07-30 (50, OUT), keçmiş 07-05 (20, in) → Xərclər `monthTotal=120`, mock Hesabatlar `expenses total=120`, bərabər. `sourceTotals` (`general+product`) cəmi `monthTotal`-a bərabər (invariant qorunur). Cədvəldə 3 sətir (hamısı) görünür, `futureCount=1`. |
| TC-02 | Keçmiş ay seçilir → toplam əvvəlki kimi qalır | ✅ PASS | Statik + rəqəmsal skript | `month="2026-06"` seçilib, `today` iyulda — `summaryExpenses` filtri tətbiq OLUNMUR (ternary `false` qolu), toplam ham xərclərin cəminə bərabər (`230`), `futureCount=0`. |
| TC-03 | Gələcək tarixli data olmayan normal hal → hər iki səhifə əvvəlki kimi işləyir | ✅ PASS | Statik + rəqəmsal skript | Bütün xərclər `<= today` — `summaryExpenses === monthExpenses`, filtr davranışsız qalır (`futureCount=0`), Xərclər/Hesabatlar(mock) `25 === 25`. |

## Kənar hallar (edge cases)

| Hal | Nəticə | Qeyd |
|---|---|---|
| Ay sərhədi — ayın 1-i, `today` = ayın 1-i | ✅ PASS | Ayın 1-də olan xərc daxil (`40`), ertəsi gün (2-si) xaric (`futureCount=1`) — aşağı və yuxarı sərhəd hər ikisi düzgün işləyir. |
| Boş data | ✅ PASS | `monthTotal=0`, `futureCount=0`, xəta/undefined yoxdur. |
| Timezone / ISO datetime formatı (`"2026-07-27T14:30:00"`) | ✅ PASS | `slice(0,10)` sayəsində gündüz saatı olan bugünkü xərc DAXİL qalır; naiv tam-sətir müqayisəsi bunu SƏHVƏN xaric edərdi (rəqəmsal təsdiq edildi) — kommentdəki izah düzgündür. |
| `inPeriod("week")`/`("today")` gələcək tarixi xaric edir | ✅ PASS | Hesabatlar səhifəsinin digər dövr tabları (Bu gün/Bu həftə) da eyni prinsiplə düzəlib — yalnız "month" deyil. |
| `sourceTotals` (Ümumi/Mala bağlı) bölgüsünün cəmi `monthTotal` ilə üst-üstə düşür | ✅ PASS | Hər iki halda (TC-01, TC-03) `bySource.general + bySource.product === monthTotal` — struktur invariant qorunub (StatCard `sub`-undakı mətn ilə əsas ədəd arasında ziddiyyət yoxdur). |

## Scope-dan kənar qeyd (bug DEYİL, sadəcə qeyd — senior-frontend əvvəlcədən işarə edib)

`src/features/sales/lib.ts` → `periodToRange("month")` HƏLƏ DƏ `daysAgoISO(29)` (son 30 gün) qaytarır, `reports/lib.ts`-dəki `inPeriod("month")` (təqvim ayı) ilə UYĞUN DEYİL. Bu, Satış səhifəsinin `period=month` API sorğusuna aiddir, FE#11-in əhatə etdiyi Xərclər/Hesabatlar səhifə cütünə TƏSİR ETMİR — ona görə FE#11 üçün bug sayılmadı, gələcək bir Satış səhifəsi task-ında nəzərə alına bilər.

## İşlədilən əmrlər

```bash
git -C ".../frontend" status
git -C ".../frontend" log --oneline -10
git -C ".../frontend" diff "origin/task/FE#10-gelecek-tarixli-xerc"...HEAD
# (backend, yalnız oxundu, dəyişdirilmədi)
# ReportPeriod.cs, GetSummaryHandler.cs, ExpensesModuleContract.cs, ExpenseDto.cs, ExpenseMapping.cs

npx --yes node tmp-fe11-verify.mjs   # müvəqqəti doğrulama skripti — 19/19 PASS, sonra silindi
rm tmp-fe11-verify.mjs

npm run build       # tsc && vite build → 0 xəta, built in 5.19s
npx tsc --noEmit    # 0 xəta
git -C ".../frontend" status   # təsdiq: iş ağacı təmiz, tmp fayldan iz qalmayıb
```

## İşlədilə bilməyən testlər

- Runtime/brauzer vizual yoxlaması (StatCard-dakı kəhrəba xəbərdarlıq mətninin faktiki render olunması, native `input[type=month]` davranışı) — layihədə brauzer/Playwright test infrastrukturu yoxdur, `npm run dev` bu sessiyada arxa planda saxlanılmadı. Bütün nəticələr statik kod izlənməsi + təcrid olunmuş (kopyalanmış, dəyişdirilməmiş) məntiqin rəqəmsal icrası ilə doğrulanıb.
- Real backend serverinə qarşı canlı `/api/reports/summary?period=month` sorğusu — server bu sessiyada işə salınmadı; real qol üçün nəticə kod-səviyyəsində (backend faylların OXUNMASI, dəyişdirilmədən) çıxarılıb, canlı HTTP cavabı ilə YOX.

## Yekun verdikt

**PASS — Done-a hazırdır.** AC1–AC4 və TC-01/02/03 tam təsdiqlənib (FE#10 QA-da qeyd olunmuş T-1 boşluğu bu PR ilə bağlanıb — fərq forma-validasiyası deyil, mövcud `expenses` siyahısının özü üzərində hesablanan client-side sərhəd olduğu üçün datanın necə yarandığından asılı deyil). `npm run build`/`npx tsc --noEmit` 0 xəta. Blocker/high severity bug tapılmadı. Scope-dan kənar bir qeyd (`sales/lib.ts` → `periodToRange("month")`) sənədləşdirildi, amma bug task-ı kimi açılmadı (orchestrator qərar versin).
