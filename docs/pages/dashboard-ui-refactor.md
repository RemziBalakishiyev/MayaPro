# Ana səhifə (Dashboard) — dizayn sisteminə keçid (FE#72, mərhələ 3)

Bu sənəd FE#72 çərçivəsində **yalnız Ana səhifədə (Dashboard,
`src/routes/_app.index.tsx`)** aparılan dəyişiklikləri, verilən qərarları
və onların əsaslandırmasını qeydə alır.

Referans: `docs/design-system.md` (FE#69), `docs/ui-ux-risk-register.md`
(`R-18`, `R-19` — F-05/F-06), `docs/ui-refactor-roadmap.md` (Mərhələ 3, iş
3.2/3.4), `docs/pages/sales-ui-refactor.md` (FE#71 — eyni `StatCluster`/
`KpiCard`/`AlertPill` dilinin ikinci tətbiqi), `docs/ui-terminology.md`.

**TOXUNULMAZ qalıb (dəyişməyib):** `useDashboardStats()` — bütün sahələr
(`expectedCash`, `todayTotal`, `todayProfit`, `todayExpenses`, `todayCash`,
`todayCard`, `todayCredit`, `stockValue`, `receivables`, `payables`,
`openingCash`, `unknownProfitSalesCount/Amount`, `topProducts`, `lowStock`,
`frozen`, `recentSales`, `recentPayments`, `daily`, `monthly`) — həm
`computeDashboardStats` (mock), həm `assembleDashboardStats` (real) —
`src/features/reports/queries.ts`; heç bir hesablama/düstur dəyişməyib,
yalnız NƏTİCƏLƏRİN göstərildiyi UI konteyneri və yerləşdirmə dəyişib.
Backend-ə heç bir yeni sorğu/sahə əlavə olunmayıb — bax bənd 4 (yalnız
mövcud, artıq başqa səhifələrdə istifadə olunan sorğular əlavə cəlb edilib).

---

## 1. Dəyişən fayllar

| Fayl | Nə dəyişdi |
|---|---|
| `src/routes/_app.index.tsx` | Tam iyerarxiya refactoru: ① əsas icmal (TƏK `StatCluster`, 4 göstərici), ② "İndi nə etməliyəm?" diqqət bölməsi (kliklənən xəbərdarlıq sırası), ③ ikinci dərəcəli detallar (2 kiçik panel), chartlar üçün "kifayət qədər data" gating-i, "Azalan stok"/"Satılmayan mallar" kartlarının diqqət bölməsinə köçürülməsi |
| `src/routes/_app.index.test.tsx` | Yeni `describe` bloku (FE#72) — ①/②/③ render davranışı, chart gating, boş vəziyyət; mövcud FE#142 testləri qorunub (yalnız yeni sorğuların mock-u əlavə olunub) |
| `docs/ui-terminology.md` | Bu taskda dəyişən/əlavə olunan mətnlər (48–53) cədvələ əlavə olundu |

`src/features/reports/queries.ts`, `src/features/reports/api.ts`,
`src/features/reports/components/DailyBarChart.tsx`,
`src/features/reports/components/TrendLineChart.tsx` **dəyişməyib** —
bunlar Hesabatlar səhifəsi ilə paylaşılır, "kifayət qədər data" qərarı
YALNIZ Dashboard-un öz faylında (lokal dəyişən + şərti render) tətbiq
olunub ki, Hesabatlar səhifəsinin davranışı toxunulmasın (task
məhdudiyyəti: "YALNIZ Ana səhifəni refactor et").

`src/features/reports/components/SignatureBand.tsx` **silinməyib, lakin
artıq heç bir yerdən import olunmur** (0 çağırış) — bax bənd 2.1. FE#69/
FE#143-ün etdiyi kimi ("`PageToolbar`/`StatusBadge`" — bir neçə QA
dövründən sonra sil), bu fayl indi eyni vəziyyətdədir: DƏRHAL silinməyib,
gələcək bir təmizlik taskında (0 istifadə təsdiqləndikdən sonra) silinməsi
tövsiyə olunur.

---

## 2. Bənd-bənd qərarlar

### 1–2. Tək mənbə: "Kassada olmalı" TƏK yerdə

Əvvəllər eyni `expectedCash` dəyəri İKİ yerdə görünürdü: nəhəng iç-içə
tünd-yaşıl `SignatureBand` kartının solunda ("Real pul — kassada olmalı")
VƏ aşağıdakı 10-kartlıq StatCard cərgəsində ("Kassada olmalı", sondan
əvvəl). Eyni rəqəm iki fərqli vizual dildə (böyük ağ mətn tünd-yaşıl fonda
vs adi `StatCard`) təkrarlanırdı.

**Qərar:** `SignatureBand` tamamilə silindi (istifadəsi dayandırıldı).
"Kassada olmalı" indi YALNIZ ① əsas icmalın (`StatCluster`) birinci
elementidir — panelin ən diqqətçəkən yeri (soldan birinci, `StatCluster`-in
`text-xl lg:text-2xl` tipoqrafiyası tətbiqin ən böyük rəqəm ölçüsüdür,
AC-1/AC-2). Əvvəlki izahlı alt sətir ("Başlanğıc X + nağd satış Y − xərc Z")
məlumat itkisi olmasın deyə `StatCluster` elementinin `sub` sahəsinə
köçürüldü — data GİZLƏDİLMİR, yalnız yeri dəyişib (FE#71-in "heç bir data
itmir" prinsipinin davamı).

### 3–4. "Real pul vs kağız üzərində qazanc" konsepti qorunur, TƏKRARLANMIR

PM-in tələbi aydın idi: konsepti SAXLA, amma ayrıca nəhəng kart kimi
TƏKRARLAMA. `paperProfit` sahəsi kodda `todayProfit`-lə EYNİ dəyərdir (bax
`computeDashboardStats`/`assembleDashboardStats`: `paperProfit:
todayProfit`) — iki fərqli adla (`Bugünkü qazanc` StatCard-da, `Kağız
üzərində qazanc` SignatureBand-da) göstərilməsi `R-19`-da qeydə alınmış
konkret tapıntı idi.

**Qərar:** TƏK ad seçildi — **"Bugünkü real qazanc"** (PM-in mətnindəki
hərfi ifadə, `E-06` adlandırma vahidləşməsi). Bu, ① əsas icmalın 4-cü (son)
elementidir. Konseptin özü (nisyə hissəsi hələ nağd deyil) İTMİR — elementin
`sub` sahəsində sadə bazar dilində izah olaraq qalır:

> Bunun {nisyə məbləği} hissəsi nisyədə — nisyə satdıqların hələ cibində
> deyil.

(yalnız `todayCredit > 0` olanda göstərilir). Naməlum qazanclı satışlar
xəbərdarlığı da (əvvəlki `StatCard.sub`-dakı kimi) eyni yerdə, ikinci sətir
kimi qalır — heç bir xəbərdarlıq itmir.

### 5. ② Diqqət bölməsi — "İndi nə etməliyəm?"

Yeni, PM-in tələb etdiyi ən böyük struktur dəyişikliyi: kliklənən
xəbərdarlıq sırası, `Card title="İndi nə etməliyəm?"` daxilində. Hər sətir
**mövcud** səhifə/filtrə keçiddir — YENİ məntiq/filter YOXDUR:

| Sətir | Şərt | Hədəf | Qeyd |
|---|---|---|---|
| `{N} malın stoku azalır` | `lowStock.length > 0` | `/mallar?status=Azalır` | Mətn `ProductsKpiCards`-dakı `AlertPill` ilə HƏRFİ eynidir (FE#70) |
| `Sizə borclu olanlar: {məbləğ}` | `receivables > 0` | `/borclar?status=borclu` | Alt sətirdə borclu sayı (mövcud `useDebtsKpi()`-dən, snapshot sahə) |
| `Təchizatçılara borcunuz: {məbləğ}` | `payables > 0` | `/tedarukculer` | Filtr yoxdur (səhifədə axtarış/filtr yoxdur) — sadəcə səhifəyə keçid kifayətdir |
| `Bu gün hələ bağlanmayıb` / `Gün bağlanıb` | həmişə (bağlanış sorğusu yüklənəndən sonra) | `/gun-sonu` | Bağlıdırsa fərqə görə ton (`Kassa düz gəlib` yaşıl, uyğunsuzluq kəhrəba) |
| `{N} mal aylardır satılmır` | `frozen.length > 0` | `/mallar` | Mallar səhifəsində ayrıca "donmuş" filtri yoxdur, ona görə sadə keçid (bax aşağı) |

Sıra PM-in mətnində verilən sıra ilə HƏRFİ eynidir. Heç bir xəbərdarlıq
yoxdursa (`attentionCount === 0`), müsbət boş vəziyyət göstərilir:
"Diqqət tələb edən heç nə yoxdur" (AC-5).

**Kliklənmə işarəsi (AC-5):** hər sətir `<Link>`-dir (kursor avtomatik
pointer olur), sağda `ChevronRight` oxu var, hover-də yüngül fon dəyişikliyi
və ox sağa sürüşməsi (`group-hover:translate-x-0.5`) var — rəng TƏK siqnal
deyil (ikon + mətn + ox birlikdə).

**Qərar — borclu sayı üçün əlavə sorğu:** PM konkret "açıq borclu müştəri
sayı" istədi. `useDashboardStats()`-un REAL rejim cavabı (`DashboardDto`)
müştəri sayını EHTİVA ETMİR (yalnız `totalCustomerDebt` cəmi) — yeni
backend sahəsi əlavə etmək TOXUNULMAZ qaydasını pozardı. Bunun əvəzinə,
artıq Nisyə Borclar səhifəsində istifadə olunan **mövcud**
`useDebtsKpi()` sorğusu (`GET /api/reports/debts-kpi`, `debtorCount`
sahəsi ilə) əlavə çağırılır — bu, yeni backend davranışı DEYİL (mövcud
endpoint), sadəcə Dashboard-un bunu da göstərməsidir. Sorğu əlavə
(bezel) siqnal sayılır: yüklənməmiş/uğursuz olsa belə əsas xəbərdarlıq
sətri (`receivables` məbləği ilə, artıq mövcud Dashboard sahəsi) YENƏ DƏ
göstərilir, yalnız alt sətirdəki dəqiq say gizlənir.

**Qərar — gün bağlanış statusu:** eyni səbəbdən, Gün Sonu səhifəsində
artıq istifadə olunan **mövcud** `useTodayClosing()` sorğusu
(`GET /api/closings/today`) əlavə çağırılır. Bu sətir yalnız sorğu
uğurla (`isSuccess`) nəticələnəndən sonra göstərilir; uğursuz olarsa
sadəcə görünmür (Dashboard-un qalan hissəsini bloklamır).

**Qərar — "donmuş mallar" üçün filtrsiz keçid:** Mallar səhifəsində
"neçə gündür satılmır" üzrə status filtri YOXDUR (yalnız
`Stokda var/Azalır/Bitib/Satılmır/Ziyana satılır`). Tələb #5 "mövcud
səhifə/filtr VARSA kliklənəndir" deyir — filtr olmasa da, mövcud SƏHİFƏ
var, ona görə sadə (filtrsiz) `/mallar` keçidi verilib. Yeni filtr
YARADILMAYIB (task məhdudiyyəti).

### 6. Azalan stok / Satılmayan mallar kartları ② bölməsinə köçdü

PM-in "Mövcud alt bölmələr... ③-dən sonra qalır" siyahısında YALNIZ "ən çox
satılanlar, son satışlar, son ödənişlər" adı çəkilir — "Azalan stok" və
"Satılmayan mallar (pul dondurur)" kartları bu siyahıda YOXDUR, çünki
onların funksiyası artıq ② diqqət bölməsindəki "{N} malın stoku azalır" və
"{N} mal aylardır satılmır" sətirləri ilə örtülür. Hər iki köhnə kart
(ayrıca `Card` + daxili siyahı, 5 elementə qədər) SİLİNDİ; heç bir data
itmir — `lowStock`/`frozen` massivləri ② bölməsində sayı+məbləğ olaraq
istifadə olunur (detallı siyahı YOX, çünki hədəf səhifəyə keçid artıq
detalları göstərir).

Nəticədə əvvəlki İKİ ayrı grid cərgəsi (3 kart: ən çox satılan/azalan
stok/donmuş + 2 kart: son satış/son ödəniş) TƏK cərgəyə (3 kart: ən çox
satılan, son satışlar, son ödənişlər) sadələşdi — PM-in verdiyi sıra ilə
HƏRFİ eyni.

### 7. ③ İkinci dərəcəli detallar — kiçik, sakit

`SalesKpiCards`-ın (FE#71) ikinci dərəcəli panel dili tətbiq olundu: iki
kiçik panel (`bg-stone-50/60`, `text-sm font-bold` — `StatCluster`-in
`text-xl/2xl`-dən DƏFƏLƏRLƏ kiçik), hər biri 3 göstərici, `grid-cols-3
divide-x`:

- "Ödəniş növü üzrə satış": Nağd satış · Kart satış · Nisyə satış
- "Anbar və borc göstəriciləri": Anbardakı malın dəyəri · Mənə borcu
  olanlar · Mənim borcum

Heç bir göstərici İTMİR — köhnə 10-StatCard cərgəsindəki BÜTÜN sahələr
(`todayCash`, `todayCard`, `todayCredit`, `stockValue`, `receivables`,
`payables`) burada, sadəcə kiçik vizual çəkidə qalır (tələb #1 — "eyni
kassa dəyərinin təkrarı aradan qalxır", tələb #2 — "bütün göstəricilər
qorunur").

### 8. Chartlar — "kifayət qədər data" gating-i

Əvvəllər `DailyBarChart`/`TrendLineChart` yalnız BÜTÜN nöqtələr sıfır
olanda öz daxili boş vəziyyətini göstərirdi ("Bu dövrdə satış yoxdur"/
"Qazanc datası yoxdur") — az (1-2 gün/ay) data ilə hələ də qrafik cızılırdı
(mənasız, demək olar boş bir xətt/sütun).

**Qərar:** Dashboard-un öz faylında (paylaşılan chart komponentləri
DƏYİŞMƏDƏN) yerli hədd yoxlaması əlavə olundu: `daily` massivində ən azı 3
gün (`MIN_DAILY_POINTS`) satışı sıfırdan böyük olmalıdır, `monthly`
massivində ən azı 2 ay (`MIN_MONTHLY_POINTS`) qazancı sıfırdan fərqli
olmalıdır — əks halda paylaşılan `EmptyState` PM-in dəqiq mətni ilə
göstərilir: **"Hələ kifayət qədər məlumat yoxdur — bir neçə gün satışdan
sonra burada qrafik görünəcək."** (AC-6, AC-7). Hədlər sırf TƏQDİMAT
qərarıdır (heç bir hesablama dəyişmir), sənədləşdirilib ki, gələcəkdə
lazım gələrsə asanlıqla tənzimlənsin.

`DailyBarChart`/`TrendLineChart` fayllarına TOXUNULMADI, çünki Hesabatlar
səhifəsi ilə paylaşılır (task əhatəsi: YALNIZ Dashboard).

### 8b. Chart etiketləri / tooltip / tarix formatı (tələb #8)

Yoxlanıldı — dəyişiklik tələb OLUNMADI: `Tooltip formatter={(v) =>
fmtMoney(Number(v))}` (`DailyBarChart`/`TrendLineChart`) artıq FE#69-dan
bəri `fmtMoney` istifadə edir; tarix oxu `assembleDashboardStats`-da
`fmtDate(x.date).slice(0, 5)` ("06.08") formatındadır, `Bar`/`Line`
elementlərinin `name="Satış"`/`name="Qazanc"` etiketləri artıq mövcuddur.
Bu, tələb #8-i əvvəldən qarşılayır — paylaşılan komponentə (Hesabatlarla
ortaq) TOXUNULMADAN status qorunur.

### 9. Pul dəyərləri daşmır

`StatCluster` (① və ③-də istifadə olunan) `.money` sinfini (tabular-nums +
min-w-0 + truncate + tam dəyər `title`-də, FE#69 R-04) artıq daxilində
tətbiq edir — böyük rəqəmlər avtomatik kəsilir, kartdan daşmır. ③-dəki
kiçik panellərdə də eyni `truncate`/`min-w-0` naxışı əl ilə tətbiq olundu
(`SalesKpiCards`-ın ikinci dərəcəli panelindən eyni klass adları
götürülüb).

### 10. Birinci ekran — ① və ② scroll olmadan görünür

10 bərabər `StatCard` + nəhəng `SignatureBand` + 2 qrafik + 3 kart yerinə,
indi birinci ekranda YALNIZ: `PageHead` + ① `StatCluster` (1 panel) + ②
`Card` (5-ə qədər yığcam sətir) var — hündürlük kəskin azaldı. ③, chartlar
və alt bölmələr bundan sonra gəlir (aşağı scroll tələb edə bilər, PM-in
tələbinə görə YALNIZ ① və ② birinci ekranda olmalıdır).

---

## 3. Yekun (build/test/responsive)

- `npm run build` (`tsc && vite build`) — **0 xəta**.
- `npx vitest run` — **176/176 test yaşıl** (mövcud 162 + bu taskda əlavə
  olunan 9 yeni test `_app.index.test.tsx`-də: ① tək mənbə/köhnə
  `SignatureBand` yoxluğu, "real qazanc" izahı, ② boş vəziyyət, azalan mal
  keçidi (href yoxlaması), gün bağlanışı iki halı, ③ data itməməsi, chart
  gating-in hər iki halı).
- Responsive: kod səviyyəsində 1280/1366/1440/1920px üçün Tailwind
  breakpoint sinifləri yoxlanıldı (`StatCluster`-in `sm:flex-row`/`lg:`
  tipoqrafiya artımı, ③-də `sm:grid-cols-2`, alt bölmələrdə
  `lg:grid-cols-3`); 375px üçün `StatCluster`/`Card`/kiçik panellər artıq
  mobile-first (`flex-col`/`grid-cols-2` defolt, `sm:`/`lg:`-dən etibarən
  genişlənir) — yeni pozucu dəyişiklik YOXDUR. Headless brauzer mühiti
  mövcud olmadığı üçün vizual skrinşot yoxlaması aparılmayıb — CSS/
  breakpoint səviyyəsində təsdiqləndi (FE#70/FE#71-də istifadə olunan eyni
  metodologiya).
- `useDashboardStats()`-un heç bir sahəsi/hesablaması dəyişmədi — yalnız
  NƏTİCƏLƏRİN göstərildiyi UI konteyneri dəyişdi (TOXUNULMAZ qaydası
  qorunub).
