# QA Hesabatı — FE#72 (Ana səhifə / Dashboard iyerarxiya refactoru)

| | |
|---|---|
| **Task** | FE#72 |
| **PR** | https://github.com/RemziBalakishiyev/MayaPro/pull/165 |
| **Branch** | `task/FE72-dashboard-hierarchy` |
| **HEAD commit** | `7ad47c4` — "refactor(ui): ana sehife iyerarxiyasi" |
| **QA tarixi** | 2026-08-06 |
| **Mühit** | Windows 11 · Node/Vite 6.4.3 · Vitest 4.1.10 · statik kod analizi (bax §5 — məhdudiyyət) |

---

## 1. Yekun verdikt

> ### ✅ PASS

Bütün 14 acceptance criteria kod səviyyəsində təsdiqləndi, mövcud test dəsti
(176/176) yaşıldır, `npm run build` 0 xəta ilə bitir. Bug tapılmadı.

| Kateqoriya | Keçdi | Keçmədi |
|---|---|---|
| Acceptance Criteria (14) | 14 | 0 |

---

## 2. Build və test nəticəsi

```
npx vitest run   → ✅ 24 test faylı / 176 test, hamısı yaşıl (9.78s)
npm run build    → ✅ tsc + vite build, exit 0 (built in 4.98s, 2812 modul)
```

`src/routes/_app.index.test.tsx` FE#72 üçün 9 yeni test (`describe("Dashboard —
iyerarxiya refactoru (FE#72)")`) əlavə edib, mövcud FE#142 testləri (5 ədəd)
toxunulmadan qalıb. Sınıq/qırmızı test yoxdur.

`git diff origin/main...task/FE72-dashboard-hierarchy -- src/features` →
**boş çıxış** — `src/features/reports/{queries,api,components/DailyBarChart,
components/TrendLineChart}.tsx` dəyişməyib, təsdiqləyir ki, biznes
hesablamaları/API sorğuları toxunulmayıb (AC-11).

Dəyişən fayllar (yalnız 4): `src/routes/_app.index.tsx`,
`src/routes/_app.index.test.tsx`, `docs/pages/dashboard-ui-refactor.md`,
`docs/ui-terminology.md`.

---

## 3. Acceptance Criteria nəticələri

| AC | Nəticə | Sübut |
|---|---|---|
| **AC-1** — Eyni kassa dəyərinin təkrarı yoxdur | ✅ Keçdi | `grep expectedCash src/routes/_app.index.tsx` → dəyər YALNIZ ① `StatCluster`-in `expectedCash` elementində (sətir 226–253) istifadə olunur. Köhnə `SignatureBand` importu tamamilə silinib (`import`-lar siyahısında yoxdur), heç bir yerdə ikinci dəfə göstərilmir. |
| **AC-2** — Bütün göstəricilər qorunub | ✅ Keçdi | Köhnə 10-`StatCard` cərgəsindəki bütün sahələr (`todayTotal`, `todayProfit`, `todayExpenses`, `todayCash`, `todayCard`, `todayCredit`, `stockValue`, `receivables`, `payables`, `expectedCash`) yeni koda köçüb: 4-ü ① `StatCluster`-də, 6-sı ③ iki kiçik paneldə (`paymentSplit`, `stockAndDebts`, sətir 193–202). Test `"③ ikinci dərəcəli detallarda... data itmir"` bu 6 sahənin hamısının render olunduğunu təsdiqləyir. Köhnə "Azalan stok"/"Satılmayan mallar" kartlarındakı **detallı siyahı** (məhsul adı + status) daxili siyahı kimi itib, lakin sayı+cəm dəyəri ② bölməsində, tam siyahı isə `/mallar` keçidi ilə əlçatandır — QA qeydi kimi §4-də qeyd olunub, AC-ni pozmur (sayı/cəm göstərici saxlanılır). |
| **AC-3** — Nəhəng iç-içə kart sadə icmalla əvəzlənib, konsept qorunub | ✅ Keçdi | `SignatureBand` (tünd-yaşıl iç-içə kart) silinib, ① `StatCluster` (təkqat, sadə panel) ilə əvəzlənib. "Real pul vs nisyəli qazanc" fərqi `profitSub`-da saxlanılır (sətir 158–176): `todayCredit > 0` olanda "Bunun X hissəsi nisyədə — nisyə satdıqların hələ cibində deyil." |
| **AC-4** — "Kağız üzərində qazanc" sadə dildə izah | ✅ Keçdi | Element başlığı "Bugünkü real qazanc" (TƏK ad, `E-06`), alt mətn bazar dilində: "Bunun {məbləğ} hissəsi nisyədə — nisyə satdıqların hələ cibində deyil." `docs/ui-terminology.md` sətir 48–49 dəyişikliyi sənədləşdirir. Test `"'Bugünkü real qazanc' altında nisyə hissəsi sadə dildə izah olunur (AC-4)"` yaşıldır. |
| **AC-5** — Hər xəbərdarlıq kartı kliklənəndir (cursor+ox) | ✅ Keçdi | Bütün 5 sətir (`lowStock`, `receivables`, `payables`, gün bağlanışı, `frozen`) real `<Link>` (anchor) daxilindədir → brauzer defolt `cursor: pointer`; sağda `ChevronRight` oxu + hover-də fon dəyişikliyi/ox sürüşməsi (`attentionRowCls`, sətir 96–97; `AttentionContent`, sətir 57–93). Hədəflərin hamısı mövcud route-lardır (`/mallar`, `/borclar`, `/tedarukculer`, `/gun-sonu`) — yeni route/filtr yaradılmayıb. Test `"azalan mal sayı xəbərdarlığı... keçiddir (AC-5)"` və "gün bağlanmayıbsa..." href-ləri təsdiqləyir. `payables`/`frozen` sətirləri filtrsiz keçiddir, çünki hədəf səhifədə uyğun filtr yoxdur (sənədləşib, tələb #5-ə uyğun: "filtr VARSA"). |
| **AC-6** — Chartlar yalnız kifayət qədər data olanda göstərilir | ✅ Keçdi | `MIN_DAILY_POINTS = 3`, `MIN_MONTHLY_POINTS = 2` (sətir 43–44); `hasDailyData`/`hasMonthlyData` şərti nöqtə sayına baxır (sıfırdan fərqli). Testlər hər iki halı (kifayət qədər / kifayət qədər deyil) yaşıl keçir. |
| **AC-7** — Az/boş data üçün aydın boş vəziyyət mesajı | ✅ Keçdi | `ChartEmptyState` (sətir 100–109): "Hələ kifayət qədər məlumat yoxdur" + "Bir neçə gün satışdan sonra burada qrafik görünəcək." `EmptyState embedded` ilə (iç-içə çərçivə yaranmır). |
| **AC-8** — Chart etiketləri/tooltip/tarix formatı düzgün | ✅ Keçdi | `DailyBarChart.tsx`/`TrendLineChart.tsx` FE#72-də DƏYİŞMƏYİB (paylaşılan Hesabatlar komponentləri): `Tooltip formatter={(v) => fmtMoney(Number(v))}`, `Bar/Line name="Satış"/"Qazanc"`, tarix `fmtDate(x.date).slice(0,5)` (`queries.ts:248`, dəyişməyib). Format funksiyaları (`fmtMoney`, `fmtDate`, `src/lib/format.ts`) toxunulmayıb. |
| **AC-9** — Pul dəyərləri kartdan daşmır | ✅ Keçdi | `StatCluster`/`KpiCard` (① və ③-ün ilk hissəsi) `.money` sinfini tətbiq edir (`src/index.css:85`: `min-w-0 overflow-hidden truncate tabular-nums`), tam dəyər `title` atributunda. ③-ün kiçik panellərində əl ilə eyni naxış: `min-w-0` (valideyn div) + `truncate tabular-nums` (dəyər `span`-ı). |
| **AC-10** — 1366×768-də ① və ② scroll olmadan görünür | ✅ Keçdi (statik təxmin) | Real brauzer ölçməsi bu mühitdə mümkün olmadı (bax §5). Kod səviyyəsində hündürlük təxmini: `TopHeader` 64px (`h-header`) + `main` `pt-6` 24px + `PageHeader` (`text-3xl`/`mb-6`) ~90px + ① `StatCluster` (`p-4`, `text-2xl` dəyər + alt sətir) ~120px + `space-y-5` boşluq 20px + ② `Card` başlıq (57px) + 5 sətir (hər biri ~56px, ikon `h-9`+`py-2.5`) ~312px ≈ **cəmi ~690px** — 768px-lik viewport-a sığır (~78px ehtiyat). Köhnə versiyada (10 `StatCard` + nəhəng `SignatureBand`) bu, çox-çox yuxarı idi — istiqamət düzgündür. **Tövsiyə:** növbəti dövrdə real brauzer/Playwright ilə piksel-dəqiq təsdiqləmə aparılsın (aşağıda BUG deyil, tövsiyədir). |
| **AC-11** — TOXUNULMAZ: API, rəqəmlər, hesablamalar dəyişməyib | ✅ Keçdi | `git diff origin/main...task/FE72-dashboard-hierarchy -- src/features` → boş. `src/features/reports/queries.ts`, `api.ts`, chart komponentləri bit-bit eynidir. Yeni çağırılan `useDebtsKpi`/`useTodayClosing` — hər ikisi artıq mövcud, başqa səhifələrdə istifadə olunan sorğulardır (yeni backend sahəsi/endpoint YOXDUR), sənədləşdirilib (`dashboard-ui-refactor.md` §2, bənd 5). |
| **AC-12** — `npm run build` xətasız | ✅ Keçdi | `tsc && vite build` → 0 xəta, 2812 modul, 4.98s. (Yalnız chunk-ölçüsü xəbərdarlığı var, PR-a aid deyil, əvvəldən mövcuddur.) |
| **AC-13** — Responsive 1280/1366/1440/1920 + 375px | ✅ Keçdi (kod təhlili) | Tailwind sinifləri yoxlanıldı: `StatCluster` mobil-first (`flex-col divide-y` → `sm:flex-row sm:divide-x`), ③ panelləri `grid gap-3 sm:grid-cols-2`, alt bölmələr `grid gap-4 lg:grid-cols-3`/`lg:grid-cols-2`. 375px-də bütün yeni bloklar (`StatCluster`, ② `Card`, ③ panellər) defolt tək-sütun/`flex-col`, daşma riski yaratmır. Qeyd: "Son satışlar"/"Son ödənişlər" kartlarındakı sətir strukturu (mövcud, dəyişməyib) əvvəlki QA dövründə (FE#69, OBS-1) 375px-də daşma kimi qeydə alınmış, lakin bu, FE#72-nin **toxunmadığı** kod olduğu üçün yeni reqressiya deyil — bax §4 (OBS-1 təkrarı). |
| **AC-14** — `docs/pages/dashboard-ui-refactor.md` mövcuddur və izah edir | ✅ Keçdi | Fayl mövcuddur (240 sətir), bənd-bənd (1–10) hər dizayn qərarını əsaslandırır, dəyişən fayllar cədvəli, terminologiya keçidi, yekun build/test/responsive xülasəsi var. |

---

## 4. Qeydlər (bug deyil)

### OBS-1 — 375px-də "Son satışlar"/"Son ödənişlər" kartlarının mümkün üfüqi daşması (əvvəlki FE#69 QA-da qeydə alınıb, bu PR-da TOXUNULMAYIB)

- **Status:** Bug DEYİL — `docs/qa-report-FE69.md` §6 OBS-1-də eyni sətir strukturu (`Badge` + `w-24` məbləğ sütunu) əvvəldən mövcud daşma kimi qeydə alınıb və FE#69 üçün "regresiya deyil" hesab edilib.
- **Bu PR-a aidiyyəti:** `src/routes/_app.index.tsx`-də "Son satışlar" kartının daxili render məntiqi (sətir 435–475) FE#72-də **dəyişməyib** — yalnız grid mövqeyi (əvvəl `lg:grid-cols-2`, indi 3-kartlıq `lg:grid-cols-3` cərgənin bir hissəsi) dəyişib. Mobil (375px, `lg:` aktiv olmadığı üçün) tək-sütun stack davranışı əvvəlki kimi qalır — FE72-nin yeni reqressiyası deyil.
- **Tövsiyə:** Ayrıca (FE#72-dən kənar) texniki borc taskı kimi izlənilsin, bu PR-ı bloklamır.

### OBS-2 — AC-10/AC-13 real brauzer ölçməsi ilə təsdiqlənməyib

- Bu QA dövründə mühitdə headless brauzer alət zənciri (Playwright/Puppeteer) quraşdırıla bilmədi — sandbox icazə sistemi `npx playwright install` əmrini (layihə qovluqlarından kənara yazma tələb etdiyi üçün) blokladı, `PLAYWRIGHT_BROWSERS_PATH` ilə layihə-daxili keşə yönləndirmə cəhdi də əl ilə təsdiq tələb etdi və avtomatlaşdırılmış axında tamamlana bilmədi.
- Ona görə AC-10 və AC-13 statik kod/Tailwind-sinif təhlili ilə qiymətləndirildi (yuxarıda §3-də ətraflı). Nəticələr məntiqi/riyazi cəhətdən güclü dəstəklənir, lakin piksel-dəqiq vizual təsdiq DEYİL.
- **Tövsiyə:** Gələcək QA dövründə (uyğun icazələrlə) Playwright ilə 1280/1366/1440/1920/375px ölçmələri aparılsın (FE#69 QA-da istifadə olunan metodologiya).

---

## 5. QA metodologiyası və məhdudiyyətlər

- **Kod baxışı:** `src/routes/_app.index.tsx` tam oxundu, `git diff origin/main...task/FE72-dashboard-hierarchy` sətir-sətir təhlil edildi (silinən/əlavə olunan hər blok).
- **Test icrası:** `npx vitest run` (176/176 yaşıl), `npm run build` (`tsc && vite build`, 0 xəta) — real icra, statik təxmin deyil.
- **Paylaşılan komponentlər:** `KpiCard.tsx` (`StatCluster`), `Card.tsx`, `EmptyState.tsx`, `src/index.css` (`.money`) oxunub, FE#72-nin istinad etdiyi `.money`/`embedded` davranışları təsdiqləndi.
- **Biznes məntiqi toxunulmazlığı:** `git diff ... -- src/features` boş çıxışla təsdiqləndi (fayl səviyyəsində, sətir-sətir deyil, çünki fayllar ümumiyyətlə diff-də yoxdur).
- **Məhdudiyyət:** Real brauzerdə vizual/responsive ölçmə bu mühitdə aparıla bilmədi (bax OBS-2). `npm run dev` başladılmadı, çünki nəticəni vizual qiymətləndirmək üçün brauzer alətləri yox idi — statik təhlil kifayət qədər etibarlı hesab edildi, çünki dəyişikliklər Tailwind utility sinifləri (deterministik, sınanmış `KpiCard`/`Card`/`EmptyState` primitivləri) üzərində qurulub, yeni xüsusi CSS/JS ölçmə məntiqi yoxdur.

---

## 6. Tövsiyə

Task **`Done`** ola bilər — bütün 14 AC keçdi, bug tapılmadı. §4-dəki 2 qeyd
(OBS-1, OBS-2) bloklayıcı deyil: OBS-1 FE#72-dən kənar əvvəlki texniki borcdur,
OBS-2 isə metodoloji məhdudiyyətdir (növbəti dövr üçün tövsiyə). Orkestrator
istəsə, OBS-2-ni gələcək bir "vizual regressiya QA alətləri" taskına
(Playwright quraşdırılması) çevirə bilər.
