# Hesabatlar sehifesi -- dizayn sistemine kecid (FE#78)

Bu senad FE#78 cerciivesinde yalniz "Hesabatlar" sehifesinde aparilan
deyisiklikleri ve esaslandirmalarini qeyde alir. Asilidir: FE#77 (Done,
main-e merge -- "Gun Sonu" sehifesi). Referans: docs/design-system.md
(FE#69), docs/ui-refactor-roadmap.md (Merhele 2A, is bendi 2A.3 --
"Hesabatlar PeriodFilter-e kecirilsin" -- bu task onu tamamlayir; Merhele
3, is bendi 3.3 -- "Hesabatlar KPI sirasi eyni dile getirilsin" -- bu task
onu da tamamlayir), docs/pages/day-closing-ui-refactor.md (format numunesi).

TOXUNULMAZ qalib (deyerleri/hesablama mentiqi/API sorgusu deyismeyib):
butun hesabat hesablamalari (src/features/reports/lib.ts -- sumBy,
frozenProducts, topProductsByQty, expenseByCategory, paymentBreakdown,
lossSellers), tarix araligi qaydalari (inPeriod-un today/week/month/all
pencereleri, bax bolme 2.1, bu qaydalar isoInRange ile eyni neticeni
verir), chart data destleri (dailySeries/weeklySeries-in satis/qazanc
deyerleri -- yalniz etiket saheleri ve (bax bolme 2.7) opsional xerc
cemi elave olundu, movcud deyerler/pencereler DEYISMEDI), API sorgulari
(reportsApi.getAll, reportsApi.getSummary -- endpoint yolu/parametr
adlari deyismeyib). Yeni analitika icad olunmayib -- butun elaveler
artiq movcud deyerlerin yeniden teqdimatidir (reng, etiket, cedvel
gorunusu).

## 1. Deyisen/yeni fayllar

| Fayl | Ne deyisdi |
|---|---|
| src/routes/_app.hesabatlar.tsx | Tam UI refactor: kohne dugme qrupu evezine standart PeriodFilter/SegmentedDateFilter (bolme 2.1); 6 StatCard evezine 6 KpiCard responsiv grid-de (bolme 2.2/2.3); kohne ?period= linki mount zamani from/to-ya cevrilir, race-siz (bolme 2.1.2); chart basliqlarina oxunan dovr adi (bolme 2.5); dailySeries(sales, 14, expenses) -- xam expenses massivi da otürülür (bolme 2.7) |
| src/routes/_app.hesabatlar.test.tsx | Movcud FE#142 testleri yeni from/to search modeline uygunlasdirildi; FE#78 ucun 4 yeni test |
| src/features/reports/lib.ts | REPORT_COLORS (semantik reng xeritesi, bolme 2.9); DailyPoint-e fullDateIso + opsional xerc (bolme 2.7), WeekPoint-e label (bolme 2.6) elave saheler; dailySeries opsional 3-cu parametr (expenses) qebul edir; nonZeroCount/MIN_CHART_POINTS (bolme 2.8) |
| src/features/reports/queries.ts | useSummary(period) -> useSummary(period optional) (enabled ile, bolme 2.1.3); assembleDashboardStats-da daily mapping-e fullDateIso elave olundu |
| src/components/ui/KpiCard.tsx | tone propuna green/red elave olundu (movcud default/amber deyismeyib) |
| src/components/ui/KpiCard.test.tsx | 2 yeni test (green/red ton) |
| src/features/reports/components/DailyBarChart.tsx | Semantik rengler; xususi tooltip (tam tarix, satis, qazanc, xerc mövcud olduqda -- bolme 2.7); seyrek-data mesaji; ChartDataTable |
| src/features/reports/components/TrendLineChart.tsx | Semantik reng; xususi tooltip; seyrek-data mesaji; opsional wideLabels; ChartDataTable |
| src/features/reports/components/ExpensePie.tsx | Legend elave olundu; EmptyState embedded; ChartDataTable |
| src/features/reports/components/TopProductsBar.tsx | Semantik reng; EmptyState embedded; ChartDataTable |
| src/features/reports/components/PaymentBreakdown.tsx | Reng indeksden ada esaslanan semantik xeriteye kecdi (bug duzelisi); bos veziyyet; ChartDataTable |
| src/features/reports/components/ChartDataTable.tsx | YENI -- her chartin altinda yigilan "Cedvel kimi bax" elcatan cedveli |
| 7 test fayli | YENI |

Toxunulmayib: src/features/reports/api.ts, src/features/expenses/lib.ts,
src/features/sales/lib.ts, src/mocks/handlers.ts, src/routes/_app.index.tsx
(Dashboard -- davranisi deyismeyib, bax bolme 2.13), PIE_COLORS
(kateqoriyali palet, ExpensePie ucun, semantik xeriteden ayri, bolme 2.9).

## 2. Bend-bend qerarlar (task teleblari 1-14)

### 2.1 Dovr secimi standart toolbar-da (bend 4)

Kohne kod PageHead.actions-da xam button qrupu render edirdi ve
period: BasePeriod URL sahesi ile isleyirdi. Indi Mallar/Xercler/Satis/
Nisye Borclar sehifeleri ile eyni PeriodFilter/SegmentedDateFilter
(from/to araligi) istifade olunur -- PageHeader-den derhal sonra.

#### 2.1.1 Model kecidi: period (enum) -> from/to (aralig)

inPeriod(iso, period) cagirislari isoInRange(iso, from, to) ile evez
olundu. Bu deyerleri deyismir, cunki her kohne period acari yeni
from/to cutu ile eyni pencereni tesvir edir:

| Kohne period | quickPeriodRange | inPeriod penceresi | Uygunluq |
|---|---|---|---|
| today | from: bu gun, to: bu gun | yalniz bu gun | eyni |
| week | from: bu gunden 6 gun evvel, to: bu gun | son 7 gun (bu gun daxil) | eyni |
| month | from: ayin 1-i, to: bu gun | teqvim ayinin 1-i ... bu gun | eyni |
| all | bosh (serhedsiz) | her zaman true | eyni |

Bu, docs/ui-refactor-roadmap.md-in 2A.3 is bendindeki "inPeriod vs
isoInRange serhed gunleri" yoxlama telebini qarsilayir -- lib.test.ts-de
unit testle de tesdiqlenib.

#### 2.1.2 Kohne ?period= linkleri (geriye uygunluq)

searchSchema-da period sahesi saxlanilib (optional, catch undefined) --
kohne paylasilmis link (/hesabatlar?period=week) sinmir. Mount zamani
URL-de from/to yoxdursa bu acar oxunur, quickPeriodRange ile araliga
cevrilir ve URL-den silinir (replace: true).

Diqqet -- dueling-effects riski ve helli: evvelce bu cevirmeni ayrica
effektle etmisdik ve PeriodFilter-e defaultKey="month" oturmusduk.
Testde uze cixdi ki, her iki komponentin oz mount-effekti eyni "araliq
bosdur" sertini gorduyunden her ikisi navigate cagirir -- netice
hansinin qazanacagi komponent agacindaki effekt sirasina bagli yaris
veziyyetidir. Hell: range deyeri artiq render zamani (effektden asili
olmadan) tam hell olunur -- search.from/to, yoxdursa search.period,
yoxdursa quickPeriodRange("month"). Bu sayede PeriodFilter-e defaultKey
oturulmur (component oz daxili defoltu "all"da qalir, bu ise onun mount
effektini deaktiv edir). Yegane effekt bizim oz effektimizdir ve o,
artiq render zamani hesablanmis range-i sadece URL-e yazir.

#### 2.1.3 useSummary -- server sorgusu yalniz sabit acarlarla

Backend /api/reports/summary?period= yalniz today/week/month/year/all
qebul edir (ReportPeriod.cs, backend kontrakti deyismeyib). PeriodFilter
ise serbest tarix araligi ve "Kecen ay" secimini de destekleyir.
useSummary(period) -> useSummary(period optional) -- matchQuickPeriod
secilmis araligin sabit acarlardan birine uygun gelib-gelmediyini
yoxlayir; uygun gelmirse sorgu enabled: false ile kecilir ve movcud
lokal fallback (expenseBySource, deyismeyib) isledilir. DayEndCard.tsx-in
useSummary("today") cagirisi davranisca deyismeyib (additiv, geriye uygun).

### 2.2/2.3 KPI kart dasmasi + pul deyeri adaptasiyasi + kompozisiya dili (bend 1/2/3)

Kohne kod 6 StatCard-i (p-5, text-2xl lg:text-3xl) grid-cols-2
md:grid-cols-3 xl:grid-cols-6 grid-de gosterirdi. xl (1280px) serhedinde
6 sutuna kecid + boyuk srift + boyuk padding kicik kart eni daxilinde
vizual sixliq yaradirdi.

Hell: KpiCard (movcud, dizayn sisteminin 10a primitivi) -- kompakt
padding (p-4) ve srift (text-xl lg:text-2xl). 6 KpiCard tek responsiv
grid-de: grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4.

| Enlik | Sutun | Sira bolgusu |
|---|---|---|
| 375px (mobil) | 2 | 3+3 |
| 640px+ (sm) | 3 | 3+3 |
| 1024px+ (lg, 1280/1366/1440/1920 daxil) | 4 | 4+2 |

Hec bir en araliginda bir kart digerinin ustune minmir. KpiCard-in deyer
paraqrafi money sinfindedir (min-w-0 + overflow-hidden + truncate +
tabular-nums) ve tam deyer title atributunda saxlanilir.

KpiCard.tone-a green/red elave edildi (movcud default/amber deyismedi --
geriye uygun genislendirme). Tonlar kohne koddaki ile eynidir: Satis
default, Xalis qazanc green, Xerc red, Anbar deyeri default, Nagd satis
default, Nisye satis amber.

### 2.4 Redakte oluna bilen sahe

Hesabatlar sehifesinde evvelden hec bir redakte oluna bilen sahe yoxdur
(sirf oxunan hesabat) -- bu bend tetbiq olunmur.

### 2.5 Chart basliqlari + Azerbaycanca tarix etiketleri (bend 5)

Ox etiketleri artiq (deyismeyib) "01.08" formatindadir. Dovrden asili
chartlarin basligina secilmis dovrun oxunan adi elave olundu -- mes.
"Xerc kateqoriyalari (Bu ay)". Gunluk/Heftelik trend chartlari dovrden
asili olmadigi ucun (hemise son 14 gun/6 hefte) basliqlarina "(son 14
gun)"/"(son 6 hefte)" elave olundu. Ay adi abbreviaturasi ("Avq") bu
sehifedeki hec bir chart-a aid deyil (yalniz Dashboard-un ayliq trendi
ay gosterir, ehateden kenar).

### 2.6 Real tarix araliqlari -- H1, H2, H3 evezi (bend 6)

WeekPoint.week ("H1"..."H6") daxili siralama acari kimi qaldi, yeni
WeekPoint.label sahesi elave olundu: "28.07 - 03.08" formatinda. qazanc
deyerine toxunulmayib. Route faylinda xKey "week"den "label"e deyisdi.

### 2.7 Hover/focus tooltip-ler (bend 9)

Gunluk chart-da xususi tooltip -- tam tarix (yeni DailyPoint.fullDateIso
sahesi), Satis, Qazanc, **Xerc**, fmtMoney formatinda. Heftelik trend-de
xususi tooltip -- dovr araligi, Qazanc. Pie/bar tooltip-leri movcud
formatlarini saxladi.

**Senior-frontend review duzelisi (bu tapinti ile bagli):** ilk versiyada
gunluk chart tooltip-inde "Xerc" YOX idi -- inkisafci bunu "bu data
seriyada movcud deyil, elave etmek yeni analitika olardi" kimi
esaslandirmisdi. Kod oxunarkan aydin oldu ki, bu, YARIM dogru idi:
`dailySeries` funksiyasina xerc CƏMİ hec vaxt hesablanmirdi (`DailyPoint`
sahesi yox idi) -- AMMA xam `Expense[]` massivi (`date` saheli qeydler)
artiq `useReportsData()`-dan gelen `data.expenses`-de movcud idi (Hesabatlar
sehifesi onu `periodExpenses` ucun onsuz da filtreleyirdi). Yeni "analitika"
(yeni hesablama MENTIQI/formula) yaratmaq EVEZINE, artiq `satis`/`qazanc`
ucun istifade olunan EYNI gun-bazali qruplasdirma naxisi (`createdAt`/`date`
sliced-e gore filtr + `sumBy`) `dailySeries`-e OPSIONAL 3-cu parametr
(`expenses?: Expense[]`) kimi elave olundu -- `DailyPoint.xerc` YALNIZ bu
parametr oturulende hesablanir (Dashboard-un kohne cagirisi `expenses`
otürmür, `xerc` o zaman `undefined` qalir -- geriye uygun, Dashboard-un
davranisi/gorunusu deyismir). Hesabatlar sehifesi (`_app.hesabatlar.tsx`)
indi `dailySeries(sales, 14, expenses)` cagirir. `satis`/`qazanc`
deyerlerine VE tarix pencerelerine TOXUNULMAYIB -- yalniz artiq movcud xam
xerc qeydlerinin eyni gunun ekvivalenti kimi cemlenmesi elave olundu.
Heftelik trend TEK-seriyali ("Qazanc trendi") olaraq qaldi -- bend 9-un
sxemi ("tarix * satis * qazanc * xerc") esas Gunluk kombinasiya chart-ina
aiddir, tek-seriyali trend chart-a satis/xerc elave etmek onun dizayn
meqsedini (yalniz qazanc trendi) deyisdirerdi.

### 2.8 Seyrek data mesaji + oxunaqliliq (bend 8/11)

nonZeroCount < MIN_CHART_POINTS (hedd=2) gunluk ve heftelik chart-larda
tetbiq olundu: 0 ve ya 1 qeyri-sifir noqte varsa "Bu dovrde kifayet qeder
melumat yoxdur" gosterilir. Dashboard-un oz musteqil heddi
(_app.index.tsx) bundan tesirlenmir, cunki Dashboard chart-i yalniz
kifayet data olduqda render edir. Ox tick srift olcusu 11px -> 12px;
heftelik trend-in genis etiketleri ucun wideLabels propu.

### 2.9 Semantik ardicil rengler (bend 13)

REPORT_COLORS (reports/lib.ts) tek yerde sabitlendi: satis/nagd
(emerald), qazanc (teal), xerc (narinci), nisye (amber), kart (mavi).
PaymentBreakdown-da bug duzeldildi: evvelki kod indeksle (PIE_COLORS[i])
renglendirirdi, neticede Kart narinci-kimi, Nisye goy reng alirdi --
semantik xeriteye ters idi. Indi ada gore axtarilir. ExpensePie
kateqoriyalari (dinamik adlar) PIE_COLORS (kateqoriyali palet) ile qalir
-- ferqli meqsedli iki palet.

### 2.10 Elcatan cedvel alternativi (bend 12)

Yeni ChartDataTable -- her chartin altinda yigilan "Cedvel kimi bax"
acilisi, eyni datanin sade HTML cedveli. 5 chart komponentine elave
olundu.

**Senior-frontend review duzelisi:** 4 SVG-esasli chart-in (DailyBarChart,
TrendLineChart, ExpensePie, TopProductsBar) `ResponsiveContainer`-i
`aria-hidden="true"` olan bir div-e alindi -- dekorativ SVG-nin ekran
oxuyucusuna qismen/qarisiq oxunmasinin qarsisini alir, ekvivalent
melumat onsuz da yuxaridaki ChartDataTable-da tam movcuddur. PaymentBreakdown
buna daxil deyil -- o, SVG chart deyil, birbasa metn/DOM sesli barlardir
(onsuz da ekran oxuyucusu ucun oxunan).

### 2.11 Chart legend-leri (bend 7)

DailyBarChart-in movcud legend-i saxlanildi. ExpensePie-a legend elave
olundu (evvel yox idi). PaymentBreakdown setirleri onsuz da legend
rolunu oynayir. TopProductsBar-da kateqoriya oxu bunu artiq gosterir.

### 2.12 Loading/bos/xeta veziyyetleri (bend 14)

Sehife seviyyesi deyismeyib (FE#142). Butun EmptyState cagirislari
embedded oldu (ic-ice kart qaydasi). PaymentBreakdown cem 0 olduqda
evvelki aldadici "hamisi 0%" gorunusu evezine bos veziyyet gosterir.

### 2.13 Dashboard-a tesir yoxlamasi

DailyBarChart/TrendLineChart Dashboard-da da istifade olunur. Semantik
rengler deyer olaraq movcud sabit renglerle eynidir; seyrek-data
yoxlamasi Dashboard-da reachable deyil (ozu evvelceden filtreleyir);
yeni mecburi fullDateIso sahesi Dashboard-un mapping-ine elave olundu,
deyer movcud x.date-den gelir.

## 3. Dogrulama

tsc --noEmit ve npm run build (tsc && vite build) sehvsiz kecir.
vitest run tam paketde yalniz src/components/ui/PeriodFilter.test.tsx
faylindaki 1 test ("AC3 -- bir cipe kliklyende yalniz o aktiv olur")
ugursuzdur -- bu, PeriodFilter.tsx/period-filter-lib.ts bu PR-da
DEYISMEDIYI (git diff origin/main ile tesdiqlendi) ucun, bu taskdan
asili olmayan movcud reqressiyadir (FE#75/76/77-de de qeyd edilib).
Bu taskda elave olunan 30 yeni test (lib.test.ts (+ senior-frontend
review-de elave olunan 3 xerc testi), ChartDataTable.test.tsx,
DailyBarChart.test.tsx (+ review-de elave olunan 2 xerc testi),
TrendLineChart.test.tsx, PaymentBreakdown.test.tsx, ExpensePie.test.tsx,
KpiCard.test.tsx +2, _app.hesabatlar.test.tsx +4) yasildir.

Responsive yoxlama kod/CSS seviyyesindedir (headless brauzer muhiti
movcud deyil, evvelki FE#70-77-de de qeyd olunan mehdudiyyet): 375px-de
KPI grid 2 sutun (3 sira), chart grid tek sutun; 1280/1366/1440/1920px-de
(lg serhedi 1024px-den yuxari sabit) KPI grid 4 sutun (4+2), chart grid
2 sutun. PeriodFilter ozu ufuqi surusmeye dusur (movcud davranis).
KpiCard deyerleri money sinfi ile hec vaxt kartdan cixmir, tam deyer
title-de.

## 4. Tam icra edile bilmeyen tebeler

Piksel-seviyyeli skrinsot yoxlamasi aparilmadi (yuxari bax -- evvelki
tasklarla eyni mehdudiyyet). Bend 5-in "ay adlari lazimda Avq" hissesi
bu sehifedeki hec bir chart-a aid deyil (N/A).

Bend 9-un "xerc" hissesi -- bax 2.7-de senior-frontend review duzelisi:
gunluk chart tooltip-ine (ve onun elcatan cedveline) xerc ELAVE OLUNDU
(mövcud xam `Expense[]` datasindan, yeni hesablama MENTIQI icad
olunmadan). Heftelik trend TEK-seriyali qazanc chart-i olaraq qaldi --
ona satis/xerc elave etmek onun mövcud dizayn meqsedini deyisdirerdi,
bu sebeble bilercekden elave olunmadi.
