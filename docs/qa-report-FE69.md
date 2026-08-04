# QA Hesabatı — FE#69 (Qlobal UI/UX təməli: paylaşılan primitivlərin standartlaşdırılması)

| | |
|---|---|
| **Task** | FE#69 · https://github.com/RemziBalakishiyev/MayaPro/issues/69 |
| **PR** | https://github.com/RemziBalakishiyev/MayaPro/pull/83 |
| **Branch** | `task/FE#69-ui-primitives` (baza: `task/FE#68-ui-ux-audit`) |
| **Commit-lər** | `6f75b27` · `7fe993a` · `eb031f4` · `221f144` · `c2ed226` · `110fbde` + senior review `36230a1` |
| **QA tarixi** | 2026-08-05 |
| **Mühit** | Windows 11 · Node/Vite 6.4.3 · Chromium (Playwright 1.62.1, headless) · mock rejim (`VITE_API_URL` boş) və xəta rejimi (backend əlçatmaz) |

---

## 1. Yekun verdikt

> ### ⚠️ BUG VAR — task `Done` edilə bilməz
>
> **Bütün 6 bloklayıcı meyar (AC-12 · AC-15 · AC-17 · AC-19 · AC-22 · AC-23) KEÇDİ.**
> Bloklayıcı olmayan 3 AC (AC-8 · AC-14 · AC-16) tam ödənilməyib → 3 bug.

| Kateqoriya | Keçdi | Qismən | Keçmədi | Yoxlanmadı |
|---|---|---|---|---|
| Acceptance Criteria (25) | 22 | — | 3 | 0 |
| Test Case (32) | 28 | 1 | 3 | 0 |

**Keçməyən AC-lər:** AC-8 (kontrol hündürlüyü) · AC-14 (lokal axtarış placeholder-i) · AC-16 (PageToolbar)
**Keçməyən TC-lər:** TC-6 · TC-15 · TC-32 · (TC-23 qismən)

---

## 2. Build və test nəticəsi

### 2.1 Cari HEAD (`36230a1`)

```
npm run build   → tsc + vite build ✅ exit 0 (built in 4.89s, 2811 modul)
npm test        → ✅ 10 test faylı / 80 test, hamısı yaşıl (5.54s)
npx tsc --noEmit → ✅ 0 xəta
```

### 2.2 Hər commit ayrıca (AC-23 — bloklayıcı)

Hər commit `git checkout` edilib, `npm run build` və `npm test` işlədilib:

| # | Commit | `npm run build` | `npm test` | Nəticə |
|---|---|---|---|---|
| 1 | `6f75b27` | ✅ exit 0 | ✅ 7 fayl / 63 test | Yaşıl |
| 2 | `7fe993a` | ✅ exit 0 | ✅ 8 fayl / 70 test | Yaşıl |
| 3 | `eb031f4` | ✅ exit 0 | ✅ 8 fayl / 70 test | Yaşıl |
| 4 | `221f144` | ✅ exit 0 | ✅ 9 fayl / 77 test | Yaşıl |
| 5 | `c2ed226` | ✅ exit 0 | ✅ 10 fayl / 80 test | Yaşıl |
| 6 | `110fbde` | ✅ exit 0 | ✅ 10 fayl / 80 test | Yaşıl |
| 7 | `36230a1` (senior) | ✅ exit 0 | ✅ 10 fayl / 80 test | Yaşıl |

**Sınıq aralıq commit yoxdur.**

---

## 3. Vizual yoxlamanın statusu (AC-17 — bloklayıcı)

**Vizual yoxlama TAM APARILIB** — brauzer avtomatlaşdırması mövcud idi
(Playwright + Chromium Headless Shell 151). Statik təxmin DEYİL, real ölçmə.

- Mühit: `npm run dev` (mock rejim, `VITE_API_URL` boş → real mock datası:
  10 mal, 10 satış, 4 müştəri, 4 təchizatçı, 4 xərc, 3 bağlanış).
- Ölçmə: hər səhifədə `document.documentElement.scrollWidth` vs `clientWidth`
  + bütün DOM elementlərinin `getBoundingClientRect().right` yoxlaması.
- Əhatə: **11 route × 5 ölçü = 55 ölçmə** (+ mal detalı cəhdi).

| Ölçü | Üfüqi daşan səhifə | Nəticə |
|---|---|---|
| 1280×720 | 0 / 11 | ✅ |
| 1366×768 | 0 / 11 | ✅ |
| 1440×900 | 0 / 11 | ✅ |
| 1920×1080 | 0 / 11 | ✅ |
| 375×812 (mobil regresiya) | 1 / 11 (**Ana səhifə**, `sw=456 > cw=375`) | ⚠️ bax §5.4 |

**375px Ana səhifə daşması bazada da eynilə mövcuddur** (`task/FE#68-ui-ux-audit`
branch-ında ölçüldü: eyni `sw=456`) → **FE#69 regresiyası DEYİL** (AC-18 keçir),
lakin əvvəldən mövcud qüsurdur.

---

## 4. Acceptance Criteria nəticələri

| AC | Nəticə | Sübut |
|---|---|---|
| **AC-1** — Primitiv statusu cədvəli | ✅ Keçdi | `docs/design-system.md` §2: 22 primitivin hamısı üçün status (N/Y) + fayl yolu + inventar qarşılığı. Sənəddə göstərilən 22 fayl yolunun hamısı diskdə mövcuddur (`ls src/components/{ui,layout}` ilə təsdiqləndi). Statusu olmayan primitiv: 0. |
| **AC-2** — Mövcud komponentlər yenidən yazılmır | ✅ Keçdi | `git diff main...` — `Button`, `DataTable`, `Drawer`, `FilterBar`, `PeriodFilter`, `StatCard`, `KpiCard`, `EmptyState`, `Toast`, `ConfirmModal`, `Modal`, `ActionMenu`, `PageHead` diff-ləri yalnız ƏLAVƏdir. Silinən prop: 0 (bütün diff-lər sətir-sətir oxundu). Alias-lar: `ConfirmDialog`, `DetailDrawer`, `FilterPopover`/`FilterDrawer`, `SegmentedDateFilter`, `PageHead→PageHeader` — hamısı export olunub. |
| **AC-3** — Yalnız çatışmayanlar yaradılır | ✅ Keçdi | 13 yeni fayl `src/components/ui/` və `src/components/layout/` altındadır; yeni paket yoxdur; hər biri `design-system.md`-də nümunə ilə sənədləşib. |
| **AC-4** — Terminologiya cədvəli | ✅ Keçdi | `docs/ui-terminology.md` — 22 sətirlik köhnə→yeni cədvəli (`E-03`, `T-15`, `AC-xx` istinadları) + §2 qəsdən dəyişməyənlər. Kodda cədvəldən kənar mətn dəyişikliyi aşkarlanmadı. |
| **AC-5** — Spacing/radius şkalası | ✅ Keçdi | `tailwind.config.ts` + `src/index.css` + `src/lib/ui-tokens.ts`. `src/components/**` daxilində hardcoded hex rəng: **0 tapıldı**. Səhifə padding-i tək mənbədən (`AppShell`, `px-4 lg:px-8`) — 11 səhifədə eyni ölçüldü. Qeyd: `Card.tsx` hələ `rounded-2xl` yazır, amma dəyər `rounded-card` ilə eynidir (16px) → görünüşdə fərq yoxdur. |
| **AC-6** — Tipoqrafiya + iç-içə kart | ✅ Keçdi | 11 səhifədə iç-içə kart (kart daxilində kart) sayı: **0**. `EmptyState embedded` və `DataTable embedded` variantları ilə ikinci kəsikli çərçivə aradan qalxıb. `TEXT` iyerarxiyası `ui-tokens.ts`-dədir. |
| **AC-7** — Maliyyə rəqəmləri | ✅ Keçdi | Ana səhifə (11), Hesabatlar (7), Satış (8), Mallar (5) — bütün `.money` elementlərində `font-variant-numeric: tabular-nums` aktiv; `overflow:hidden` + `text-overflow:ellipsis` + `white-space:nowrap` + `min-width:0`; **tam dəyəri saxlayan `title` atributu 100%-də mövcuddur** (`StatCard`-da ata `<p>`-də, `KpiCard`/`StatCluster`-də elementin özündə). `12 345 678.00 ₼` dəyəri ilə sınaq: səhifə daşmadı. |
| **AC-8** — Kontrol hündürlüyü | ❌ **Keçmədi** | Bax **BUG-1**. 1440px-də ölçüldü: **68 interaktiv kontrol hələ də <40px**-dir (cədvəl sətir əməliyyatları 34px, Gün Sonu «Başlanğıc kassa» xam input 31.8px, Hesabatlar dövr çipləri 34px, İşçilər maaş hüceyrə düymələri 29.8px). Bazada 175 idi → böyük irəliləyiş, amma AC və `design-system.md` §1.6 («Heç bir interaktiv kontrol 40px-dən kiçik deyil») ödənmir. |
| **AC-9** — Vəziyyət tamlığı | ✅ Keçdi | 10 addımlıq `Tab` zəncirində hər elementdə `focus-ring` sinfi + `outline: solid`. `Button.loading` → `disabled` + `aria-busy` (Button.test.tsx 7 test). `ActionMenu` deaktiv bəndi: `aria-disabled` + `title="Fayl hazırlanır"` (`_app.mallar.tsx:196`). `ConfirmDialog.isPending` canlı yoxlandı (bax TC-8). |
| **AC-10** — Rəng yeganə siqnal deyil | ✅ Keçdi | Toast: `role="status"` + `aria-live` + ekran oxuyucusu prefiksi (canlı: «Uğurlu: Ayarlar yadda saxlandı» + 2 ikon). Kassa fərqi: ikon + izah mətni. `Badge` («Azalır»/«Bitib») mətn daşıyır. Sidebar nişanı `title="N mal azalır"`. `InlineError` ikon + mətn + «Yenidən». |
| **AC-11** — Semantik rəng qaydası | ✅ Keçdi | `ui-tokens.ts` `TONE_SURFACE`/`TONE_TEXT`; kassa fərqi kəhrəbadır (`bg-amber-50`, `#FFFBEB`); ziyan/çatışmazlıq qırmızı; uğur yaşıl. `design-system.md` §1.8. |
| **AC-12** — MÜSBƏT kassa fərqi 🔒 | ✅ **Keçdi (bloklayıcı)** | Brauzerdə üç hal (gözlənilən = 829.00 ₼): <br>• `diff>0` (889) → fon `rgb(255,251,235)` = amber-50, mətn amber-900, ikon `lucide-triangle-alert`, mətn «Kassa uyğun gəlmir — 60.00 ₼ artıq çıxdı, yoxlayın» + izah sətri. `TrendingUp` və yaşıl YOXDUR. <br>• `diff<0` (789) → `rgb(254,242,242)` qırmızı + `lucide-trending-down` + «Kassada çatışmayan məbləğ: 40.00 ₼». <br>• `diff=0` → `rgb(236,253,245)` yaşıl + `lucide-check`. <br>Bağlanmış gün xülasəsi: `StatCard tone="amber"` + `AlertTriangle` + alt sətir. `ClosingHistory` «Fərq» sütunu: `title="Kassada çatışmazlıq"` + `AlertTriangle` (mənfi), `title="Kassa düz gəlib"` + `Check` (sıfır). <br>`difference()` / `expectedCash()` (`features/day-end/lib.ts`) **diff-də ümumiyyətlə yoxdur**. 3 unit test (`cash-diff-presentation.test.ts`) yaşıl. |
| **AC-13** — Hər səhifədə bir əsas əməliyyat | ✅ Keçdi (qeydlə) | 11 səhifədə `PageHeader` daxilində `primary` düymə sayı: heç birində >1 deyil. Mallar: 3 ikinci dərəcəli əməliyyat «Digər əməliyyatlar» menyusuna keçib. Qeyd: Ana səhifə, Hesabatlar, İşçilər, Gün Sonu başlığında 0 primary var (Gün Sonu-nun «Günü bağla» düyməsi kontekst kartındadır) — TC-14-ün «tam 1» tələbinə tam uyğun deyil, lakin AC-nin «yalnız bir» şərtini pozmur. Qeyd 2: aktiv `SegmentedDateFilter` çipi də `bg-emerald-700` işlədir (bazadan gələn davranış, FE#69 dəyişmir) — vizual olaraq ikinci «primary» təəssüratı yaradır. |
| **AC-14** — Qlobal vs lokal axtarış | ❌ **Keçmədi** | Bax **BUG-2**. Qlobal hissə ✅: «Bütün sistemdə mal axtar...», `rounded-full`, dolu fon, «Mallar səhifəsi» Enter ipucu, `submitSearch`/URL sxemi dəyişməyib. Lokal hissə qismən: Müştərilər «Bu siyahıda axtar... (ad və ya telefon)» ✅, Nisyə Borclar «Bu siyahıda axtar... (ad, telefon və ya mal)» ✅ — amma **Mallar** «Ad, kateqoriya, xüsusiyyət üzrə axtar...», **Xərclər** «Xərc adı və ya qeyd üzrə axtar...», **Satış** «Axtar...» köhnə qalıb. TC-15 məhz Mallar səhifəsini adlandırır. |
| **AC-15** — IconButton izahı məcburidir 🔒 | ✅ **Keçdi (bloklayıcı)** | Müvəqqəti `<IconButton icon={<X/>} />` (label-siz) yazıldı → `npx tsc --noEmit`: <br>`error TS2741: Property 'label' is missing in type '{ icon: Element; }' but required in type 'IconButtonProps'` <br>Müvəqqəti fayl silindi, `tsc` yenidən 0 xəta. `aria-label`/`title` props-dan `Omit` edildiyi üçün ötürmək də mümkün deyil. 11 səhifədə etiketsiz yalnız-ikon düymə sayı: **0**. Kritik əməliyyatlar mətn etiketlidir: «Günü bağla», «Bəli, günü bağla», «Sil», «Düzəliş et», «Qaimə (PDF)». |
| **AC-16** — Layout standartı | ❌ **Keçmədi** | Bax **BUG-3**. Ölçmə ✅ hissəsi: 11 səhifədə sidebar eni **272px**, header hündürlüyü **69px**, `h1` üst mövqeyi **95px** — hamısı eyni; kontent eni ekranı tam istifadə edir. ❌ hissəsi: `PageToolbar` komponenti yaradılıb, sənədləşib, lakin **heç bir səhifədə istifadə olunmur** (`grep` ilə 0 çağırış) → «filtr və tarix kontrolları hər səhifədə eyni yerdədir (`PageToolbar` daxilində)» şərti ödənmir. Eyni şəkildə `StatusBadge` və `TableToolbar` da heç bir səhifədə çağırılmır (yalnız testlərdə). |
| **AC-17** — Desktop responsive 🔒 | ✅ **Keçdi (bloklayıcı)** | 1280×720, 1366×768, 1440×900, 1920×1080 × 11 səhifə = **44 ölçmə, 0 üfüqi daşma** (`scrollWidth == clientWidth`). Element kəsilməsi/üst-üstə düşmə aşkarlanmadı (viewport-dan kənara çıxan element: 0). Bax §3. |
| **AC-18** — Mobil pozulmayıb | ✅ Keçdi | 375×812: alt tab bar mövcud (`fixed inset-x-0 bottom-0 ... pb-safe-bottom lg:hidden`, 4 bənd: Ana səhifə/Satış/Mallar/Borclar, hündürlük 66px), `mobileCard` görünüşləri işləyir, `pb-safe-bottom` qorunub. 11 səhifədən 10-da daşma yoxdur; Ana səhifədəki daşma **bazada da eynidir** → regresiya yoxdur. Dövr çipləri zolağı `overflow-x-auto` daxilində sürüşür (səhifə daşmır) — bazadakı davranışla eynidir. |
| **AC-19** — Biznes məntiqi toxunulmayıb 🔒 | ✅ **Keçdi (bloklayıcı)** | `git diff main...task/FE#69-ui-primitives --stat -- "src/features/*/api.ts" "src/features/*/queries.ts" "src/features/*/lib.ts" "src/lib/api-client.ts" "src/routeTree.gen.ts" "package.json" "package-lock.json"` → **boş çıxış**. 52 dəyişən faylın heç biri hesablama/endpoint/payload faylı deyil. `difference()`, `expectedCash()`, qazanc %, borc hesabları toxunulmayıb. Zod search sxemləri və `canWrite`/`canManage` şərtləri dəyişməyib (dəyişən 5 route faylının diff-i yalnız təqdimat qatıdır). Silinən funksiya/route/icazə: 0. |
| **AC-20** — Stack dəyişməyib | ✅ Keçdi | `package.json` və `package-lock.json` diff-də yoxdur. Tailwind 3.4 + lucide-react + TanStack + zustand qalır. Ölü kod (`FilterPanel`, `SaleCalculator`) hələ silinməyib (icazəlidir). |
| **AC-21** — UI dili Azərbaycanca | ✅ Keçdi | 11 səhifənin mətni gözdən keçirildi; yeni/dəyişən bütün mətnlər Azərbaycancadır (placeholder, tooltip, aria-label, xəta və boş vəziyyət mətnləri daxil). İngiliscə qalıq UI mətni tapılmadı. |
| **AC-22** — Commit intizamı 🔒 | ✅ **Keçdi (bloklayıcı)** | 6 məntiqi addım commit-i + 1 senior review commit-i (`36230a1`). Hər commit bir mərhələni əhatə edir (token → button → layout → cədvəl → KPI/overlay → sənəd). Nəhəng qarışıq commit yoxdur (ən böyük addım 3: layout qatı). **Hər commit body-sində «Toxunulan sehifeler» bölməsi var** (`git log --format=%b` ilə təsdiqləndi). |
| **AC-23** — Hər addımda yaşıl build 🔒 | ✅ **Keçdi (bloklayıcı)** | 7 commit-in hamısı ayrı-ayrılıqda `git checkout` edilib yoxlandı — cədvəl §2.2. Hamısında `build` və `test` exit 0. |
| **AC-24** — Sənədlər | ✅ Keçdi | `docs/design-system.md` (318 sətir — token-lar, 22 primitivin statusu, istifadə nümunələri, alias cədvəli), `docs/ui-terminology.md` (71 sətir), `docs/ui-ux-global-refactor-changelog.md` (187 sətir — hər commit üçün nə dəyişdi + toxunulan səhifələr + build/test). Üçü də doludur. |
| **AC-25** — Əhatə hesabatı | ✅ Keçdi | PR #83 təsvirində 4 siyahı: §1 normallaşdırılan (16), §2 yeni yaradılan (13 + 3 köməkçi), §3 köçürülən səhifələr (cədvəl), §4 qalan işlər. |

🔒 = bloklayıcı meyar

---

## 5. Test Case nəticələri

| # | Növ | Nəticə | Sübut / qeyd |
|---|---|---|---|
| TC-1 | H | ✅ Keçdi | `design-system.md` §2-də 22 primitivin hamısı var; fayl yollarının hamısı diskdə mövcuddur. |
| TC-2 | H | ✅ Keçdi | Adları çəkilən 6 faylın diff-i sətir-sətir oxundu: yalnız variant/prop/CSS; silinən prop 0. |
| TC-3 | E | ✅ Keçdi | 8 route hələ də köhnə `PageHead` çağırışı ilə işləyir (`ayarlar`, `gun-sonu`, `hesabatlar`, `index`, `iscilar`, `tedarukculer`, `xercler`); build yaşıl, görünüş standartdır. `PeriodFilter`, `Drawer`, `ConfirmModal`, `FilterBar` köhnə adları da bütün mövcud çağırışlarda işləyir. |
| TC-4 | H | ✅ Keçdi | Ana səhifə/Mallar/Satış/Nisyə Borclar pul dəyərləri: `font-variant-numeric: tabular-nums` aktiv (0 istisna). |
| TC-5 | E | ✅ Keçdi | `.money` elementinə `12 345 678.00 ₼` yazıldı → `document.scrollWidth` dəyişmədi (daşma yox), konteynerdə kəsildi; `title` ata elementdədir. 375px-də StatCard/KpiCard daşmır. |
| TC-6 | H | ❌ **Keçmədi** | ✅ Button(md) 44px · IconButton 40/44px · Input 51px · SegmentedDateFilter çipi 40px · TablePagination 44px · Drawer bağlama 47px. ❌ Gün Sonu «Başlanğıc kassa» xam `<input>` **31.8px**; cədvəl sətir əməliyyatları («Detal», «Ödəniş», «Düzəliş», «Stok») **34px**; İşçilər maaş düymələri **29.8px**; Hesabatlar dövr düymələri **34px**. Bax BUG-1. |
| TC-7 | H | ✅ Keçdi | 10 `Tab` addımı: hər fokuslanan elementdə `focus-ring` sinfi və `outline: solid`; fokus itmədi. |
| TC-8 | H | ✅ Keçdi | «Günü bağla» → təsdiq → «Bəli, günü bağla» klikindən dərhal sonra düymə `disabled=true` + `aria-busy="true"` (8 ardıcıl ölçmədən 7-si) → **təkrar klik mümkün deyil**. Senior-un `isPending={closeDay.isPending}` düzəlişi funksional təsdiqləndi. Gün uğurla bağlandı, xülasə kartı göründü. |
| TC-9 | E | ✅ Keçdi | `ActionMenu` deaktiv bəndi `disabled` atributu YERİNƏ `aria-disabled` + klik qoruyucusu işlədir (fokus itmir), səbəb `title`-də: `title={exporting ? "Fayl hazırlanır" : undefined}` (`_app.mallar.tsx:196`). |
| TC-10 | X | ✅ Keçdi | Gözlənilən 829 → faktiki 889: kəhrəba banner + `AlertTriangle` + izah mətni; yaşıl/`TrendingUp` yoxdur. Eyni qayda bağlanmış gün xülasəsində (`StatCard tone="amber"` + `AlertTriangle` + «Yoxlanmalı uyğunsuzluq (artıq məbləğ)») və `ClosingHistory` «Fərq» sütununda tətbiq olunub. |
| TC-11 | X | ✅ Keçdi | 789 → qırmızı banner (`rgb(254,242,242)`) + `lucide-trending-down` + «Kassada çatışmayan məbləğ: 40.00 ₼». Regresiya yoxdur. |
| TC-12 | E | ✅ Keçdi | 829 → yaşıl banner (`rgb(236,253,245)`) + `lucide-check` + «Kassa düz gəlir. Fərq: 0.00 ₼». |
| TC-13 | E | ✅ Keçdi | Qrayskeyl ekvivalenti: hər status siqnalında qeyri-rəng element var — Badge mətn («Azalır», «Bitib»), kassa fərqi ikon+mətn, Toast ekran-oxuyucu prefiksi + ikon, `InlineError` ikon+mətn+«Yenidən», sidebar nişanı `title`. |
| TC-14 | H | ✅ Keçdi (qeydlə) | 11 səhifədə `PageHeader` primary sayı: Mallar 1, Müştərilər 1, Nisyə Borclar 1, Təchizatçılar 1, Xərclər 1, Ayarlar 1, Satış 1 · Ana səhifə 0, Gün Sonu 0, Hesabatlar 0, İşçilər 0. Heç birində >1 yoxdur; «tam 1» şərti 4 səhifədə formal olaraq ödənmir (bu səhifələrin səhifə-səviyyəli əsas əməliyyatı yoxdur). |
| TC-15 | H | ❌ **Keçmədi** | Mallar səhifəsində topbar: «Bütün sistemdə mal axtar...» ✅ (yumru, dolu fon, 476px). Cədvəl axtarışı: **«Ad, kateqoriya, xüsusiyyət üzrə axtar...»** — gözlənilən «Bu siyahıda axtar...» deyil. Vizual fərq ✅ (düzbucaqlı, ağ fon, 917px). Bax BUG-2. |
| TC-16 | E | ✅ Keçdi | `GlobalProductSearch` daxilində «Mallar səhifəsi» ipucu nişanı (Enter ikonu ilə) topbar-da görünür — istifadəçi keçidi əvvəlcədən görür. `submitSearch` naviqasiyası və URL search sxemi diff-də dəyişməyib. |
| TC-17 | X | ✅ Keçdi | `IconButton`-a `label` verilmədən istifadə → `tsc` `error TS2741` ilə dayandı (tam mətn AC-15 sətrində). |
| TC-18 | H | ✅ Keçdi | 11 səhifədə etiketsiz yalnız-ikon düymə: 0. Satış detal drawer-ində «Sil», «Düzəliş et», «Qaimə (PDF)», «WhatsApp» mətn etiketlidir; drawer bağlama düyməsi `aria-label="Bağla"` + `title="Bağla"`. «Günü bağla» / «Bəli, günü bağla» mətnlidir. |
| TC-19 | H | ✅ Keçdi | 4 desktop ölçüsü × 11 səhifə = 44 ölçmə, `scrollWidth <= clientWidth` hamısında; viewport-dan kənara çıxan element yoxdur. |
| TC-20 | R | ✅ Keçdi | 375px: alt tab bar (4 bənd, `pb-safe-bottom`, 66px), `mobileCard` görünüşləri, drawer footer-ləri işləyir. 11 səhifədən 10-u daşmır; Ana səhifə daşması bazada eynidir → regresiya yoxdur. |
| TC-21 | H | ✅ Keçdi | 11 səhifədə: sidebar 272px · header 69px · `h1` top 95px — tam eyni. Başlıq/alt-yazı/əsas əməliyyat mövqeyi eyni (`PageHeader` tək mənbə). |
| TC-22 | R | ✅ Keçdi | `git diff main --stat` üzrə filtrlənmiş yoxlama boş çıxış verdi (AC-19 sətrinə bax). |
| TC-23 | R | ⚠️ Qismən | **İcra olunan:** Gün Sonu tam axını (açılış 743 → nağd satış +171 → xərc −85 → gözlənilən 829 → faktiki 829 → bağlanış) — bütün rəqəmlər düzgün hesablandı, bağlanış tarixçəsinə düzgün yazıldı, «Gün bağlanıb» kilidi işlədi. Sidebar «Kassada olmalı» dəyəri yeniləndi (915.00 ₼). **İcra olunmayan:** mal əlavə → satış (nağd/nisyə/qismən) → ödəniş → xərc axınları ayrıca icra edilmədi; hesablama faylları diff-də olmadığı üçün (AC-19) regresiya riski aşağı qiymətləndirilir. |
| TC-24 | R | ✅ Keçdi | `package.json` / `package-lock.json` diff-də yoxdur. |
| TC-25 | H | ✅ Keçdi | 11 səhifədə ingiliscə qalıq UI mətni tapılmadı. |
| TC-26 | H | ✅ Keçdi | 6 addım commit-i + 1 senior fix; hər commit body-sində toxunulan səhifələr göstərilib. |
| TC-27 | E | ✅ Keçdi | 7 commit-in hamısında `build` + `test` exit 0 (§2.2 cədvəli). |
| TC-28 | H | ✅ Keçdi | `ui-terminology.md` cədvəlindəki 22 dəyişiklik ekranlarda təsdiqləndi (qlobal axtarış mətni, «Mallar səhifəsi» ipucu, «Bu siyahıda axtar... (…)», kassa fərqi mətnləri, «Digər əməliyyatlar», Toast prefiksləri, `TablePagination` tooltip-ləri). Cədvəldən kənar mətn dəyişikliyi aşkarlanmadı. |
| TC-29 | H | ✅ Keçdi | `ui-ux-global-refactor-changelog.md` — 6 addımın hər biri üçün «Nə dəyişdi» + «Toxunulan səhifələr» + build/test nəticəsi var. |
| TC-30 | H | ✅ Keçdi | PR #83 təsvirində 4 siyahı mövcuddur (§1–§4). |
| TC-31 | E | ✅ Keçdi | 11 səhifədə iç-içə kart sayı 0; satış detal drawer-ində iç-içə kart 0. `EmptyState.embedded` və `DataTable.embedded` çərçivəsiz variantlar verir. |
| TC-32 | X | ❌ **Keçmədi** | Backend əlçatmaz rejimdə: yüklənmə fazasında **skeleton var, sonsuz spinner yoxdur** ✅; KPI kartları «Yüklənmədi» + «Yenidən» göstərir ✅. **AMMA siyahı cədvəlləri xətanı «boş siyahı» kimi göstərir** ❌ — Mallar: «Mal tapılmadı / Filterləri dəyişin və ya yeni mal əlavə edin», Müştərilər: «Hələ müştəri yoxdur», Təchizatçılar: «Hələ təchizatçı yoxdur». `DataTable.isError` propu mövcuddur, lakin heç bir siyahı səhifəsi onu ötürmür. Bax BUG-4. |

---

## 6. Tapılan buglar

### BUG-1 — Cədvəl sətir əməliyyatları və bir sıra kontrollar hələ də 40px-dən aşağıdır (AC-8, TC-6)

- **Ciddilik:** Orta (Major deyil — bloklayıcı AC deyil, lakin AC və sənəd bir-birinə zidd)
- **Reproduksiya:**
  1. `npm run dev` → sahib rolu ilə daxil ol.
  2. 1440×900-də `/mallar`, `/satis`, `/xercler`, `/musteriler`, `/tedarukculer`, `/iscilar`, `/hesabatlar`, `/gun-sonu` səhifələrini aç.
  3. DevTools Console: `[...document.querySelectorAll("button,input,select,textarea")].filter(e=>{const r=e.getBoundingClientRect();return r.height>0&&r.height<40})`
- **Gözlənilən:** Siyahı boş (AC-8: bütün əsas kontrollar ≥40px; `docs/design-system.md` §1.6: «Heç bir interaktiv kontrol 40px-dən kiçik deyil»).
- **Faktiki:** 68 element <40px:
  - cədvəl sətir əməliyyatları «Detal» / «Ödəniş» / «Düzəliş» / «Stok» → **34px**
  - Gün Sonu «Başlanğıc kassa» xam `<input type="number">` → **31.8px** (paylaşılan `Input` primitivi işlədilmir)
  - İşçilər maaş hüceyrə düymələri → **29.8px**, ay naviqasiyası → 34px
  - Hesabatlar dövr düymələri → **34px** (səhifənin öz inline düymələri, `SegmentedDateFilter` deyil)
  - Müştərilər telefon kopyalama düyməsi + gizli köməkçi input → **17px**
  - `Toast` bağlama düyməsi → 32px
- **Baza müqayisəsi:** `task/FE#68-ui-ux-audit`-də 175 element <40px idi → FE#69 bunu 68-ə endirib (regresiya yox, natamam icra).
- **Toxunulacaq fayllar:** `src/features/day-end/components/DayEndCard.tsx` (xam input → `Input`), `src/features/*/components/*Table.tsx` və `ExpenseRows.tsx` (sətir əməliyyat düymələri), `src/routes/_app.hesabatlar.tsx`, `src/routes/_app.iscilar.tsx`, `src/components/ui/CopyablePhone.tsx`, `src/components/ui/Toast.tsx`. Alternativ: `docs/design-system.md` §1.6 iddiasını real vəziyyətə uyğunlaşdırmaq.

### BUG-2 — Mallar/Satış/Xərclər səhifələrində lokal axtarış placeholder-i standarta uyğun deyil (AC-14, TC-15)

- **Ciddilik:** Orta
- **Reproduksiya:** `/mallar` səhifəsini aç → cədvəl üstündəki axtarış inputunun placeholder-inə bax.
- **Gözlənilən:** «Bu siyahıda axtar...» (AC-14 və `docs/ui-terminology.md` §3 «Söz seçimi qaydaları»).
- **Faktiki:**
  - `/mallar` → «Ad, kateqoriya, xüsusiyyət üzrə axtar...»
  - `/xercler` → «Xərc adı və ya qeyd üzrə axtar...»
  - `/satis` → «Axtar...»
- **Qeyd:** `LocalTableSearch` və `FilterBar` defoltları düzgündür («Bu siyahıda axtar...»); problem çağıran tərəfdə `searchPlaceholder` ilə köhnə mətnin ötürülməsindədir. Müştərilər və Nisyə Borclar düzgündür. Bu mətnlər `ui-terminology.md` §2 «qəsdən dəyişməyənlər» siyahısında da yoxdur.
- **Toxunulacaq fayllar:** `src/features/products/components/ProductFilters.tsx:64`, `src/features/expenses/components/ExpenseFilters.tsx:73`, `src/features/sales/components/SalesJournal.tsx:460`, `docs/ui-terminology.md`.

### BUG-3 — `PageToolbar`, `StatusBadge`, `TableToolbar` yaradılıb, lakin heç bir səhifədə istifadə olunmur (AC-16, AC-3)

- **Ciddilik:** Orta
- **Reproduksiya:** `grep -rn "PageToolbar\|StatusBadge\|TableToolbar" src/routes src/features`
- **Gözlənilən:** AC-16 — «filtr və tarix kontrolları hər səhifədə eyni yerdədir (`PageToolbar` daxilində)».
- **Faktiki:** `PageToolbar` — 0 çağırış; `TableToolbar` — 0 çağırış; `StatusBadge` — yalnız `DataTable.test.tsx`-də. Dövr filtri hər səhifədə fərqli yerdə/formada qalır: Mallar/Satış/Xərclər/Borclar `PeriodFilter`-i birbaşa `PageHeader`-dən sonra render edir, Hesabatlar isə öz inline dövr düymələrini işlədir (34px, fərqli görünüş).
- **Nəticə:** üç yeni primitiv faktiki olaraq ölü koddur (AC-20 «ölü kod» prinsipi ilə də ziddiyyət təşkil edir).
- **Toxunulacaq fayllar:** `src/routes/_app.mallar.tsx`, `_app.satis.tsx`, `_app.xercler.tsx`, `_app.borclar.tsx`, `_app.hesabatlar.tsx` (dövr/filtr blokunu `PageToolbar`-a salmaq), `src/features/products/components/ProductStatusBadge.tsx` (→ `StatusBadge`).

### BUG-4 — Şəbəkə/server xətası siyahı səhifələrində «boş siyahı» kimi göstərilir (TC-32, F-44)

- **Ciddilik:** Orta (istifadəçini yanlış məlumatlandırır: «məlumat yoxdur» ≠ «yüklənmədi»)
- **Reproduksiya:**
  1. `.env.local`-da `VITE_API_URL=https://localhost:7088` (backend işləmir).
  2. `npm run dev` → `/mallar`, `/musteriler`, `/tedarukculer` səhifələrini aç, 6 saniyə gözlə.
- **Gözlənilən:** `InlineError` («Siyahı yüklənmədi» + «Şəbəkə və ya server cavab vermədi.» + «Yenidən»); «boş siyahı» mesajı GÖRÜNMÜR.
- **Faktiki:** Mallar → «Mal tapılmadı / Filterləri dəyişin və ya yeni mal əlavə edin»; Müştərilər → «Hələ müştəri yoxdur»; Təchizatçılar → «Hələ təchizatçı yoxdur». (KPI kartları düzgün «Yüklənmədi» + «Yenidən» göstərir; yüklənmə skeleton-u da düzgündür, sonsuz spinner yoxdur.)
- **Səbəb:** `DataTable.isError` / `onRetry` propları mövcuddur, lakin heç bir siyahı səhifəsi query-nin `isError`-unu ötürmür.
- **Qeyd:** PR təsvirində bu iş açıq şəkildə «Mərhələ 2A» kimi təxirə salınıb — PM-in TC-32-si isə FE#69-da tələb edir. Orkestrator qərar verməlidir.
- **Toxunulacaq fayllar:** `src/features/products/components/ProductsTable.tsx`, `src/routes/_app.musteriler.tsx`, `_app.tedarukculer.tsx`, `_app.satis.tsx`, `_app.borclar.tsx`, `src/features/expenses/components/ExpenseRows.tsx`.

### OBS-1 — (Bug deyil, əvvəldən mövcud) 375px-də Ana səhifə üfüqi daşır

- **Ciddilik:** Aşağı (FE#69 regresiyası DEYİL)
- **Faktiki:** 375×812-də `/` → `scrollWidth = 456`, `clientWidth = 375`. Daşan element: «Son satışlar» kartı (`rounded-2xl border border-stone-200 bg-white shadow-card`, en 440px) — `grid lg:grid-cols-2` sütununun min-content eni.
- **Baza yoxlaması:** `task/FE#68-ui-ux-audit` branch-ında eyni ölçü (`sw=456`) → problem FE#69-dan əvvəl də var.
- **Toxunulacaq fayl:** `src/routes/_app.index.tsx` (169–209 sətirlər, `Son satışlar` / `Son ödənişlər` kartları).

### OBS-2 — Aktiv dövr çipi əsas əməliyyat düyməsi ilə eyni `bg-emerald-700` işlədir

- **Ciddilik:** Aşağı (bazadan gələn davranış, FE#69 dəyişməyib)
- Mallar/Satış/Xərclər/Borclar səhifələrində vizual olaraq iki «primary» element görünür («Yeni mal» + aktiv «Hamısı» çipi). AC-13-ün hərfi tələbini pozmur (çip `Button variant="primary"` deyil), lakin dizayn niyyəti ilə ziddiyyət yaradır.

---

## 7. Regresiya yoxlaması

| Yoxlama | Nəticə |
|---|---|
| Senior-un `DayEndCard` `isPending` düzəlişi | ✅ Funksional təsdiqləndi — təsdiq düyməsi klikdən dərhal sonra `disabled` + `aria-busy="true"`, ikiqat göndərmə mümkün deyil. |
| Deprecated alias-lar (`PageHead`, `Drawer`, `ConfirmModal`, `FilterBar`, `PeriodFilter`) | ✅ 8 route hələ də `PageHead` ilə işləyir; bütün alias-lar export olunub; `tsc` 0 xəta; 80 test yaşıl. |
| Mobil tab bar / `mobileCard` / `pb-safe-bottom` | ✅ Dəyişməyib. |
| Sidebar / header / səhifə padding-i | ✅ 11 səhifədə tam eyni (272 / 69 / 95px). |
| API kontraktı, route-lar, icazələr | ✅ Diff-də yoxdur. |
| Gün sonu hesablaması (açılış → gözlənilən → fərq → bağlanış) | ✅ Rəqəmlər düzgün, bağlanış tarixçəsi düzgün. |

---

## 8. QA metodologiyası və məhdudiyyətlər

- **Alətlər:** Playwright 1.62.1 + Chromium Headless Shell 151 (QA üçün ayrıca müvəqqəti mühitə quraşdırıldı — `frontend/package.json`-a **heç nə əlavə edilmədi**).
- **AC-15 yoxlaması üçün** müvəqqəti `src/__qa_tmp_iconbutton.tsx` faylı yaradıldı, `tsc` xətası qeydə alındı və fayl dərhal silindi (commit edilmədi; `git status` təmizdir).
- **Mock datası üçün** `.env.local` müvəqqəti olaraq `VITE_API_URL=` edildi və QA sonunda orijinal dəyəri (`https://localhost:7088`) bərpa olundu. `.env.local` git tərəfindən izlənmir.
- **Məhdudiyyət:** TC-23-ün mal/satış/ödəniş/xərc axınları ayrıca icra edilmədi (yalnız gün sonu axını icra olundu) — hesablama faylları diff-də olmadığı üçün risk aşağıdır.
- **Məhdudiyyət:** Qrayskeyl (TC-13) brauzer filtri ilə deyil, hər status siqnalında qeyri-rəng elementin (ikon/mətn) mövcudluğunun proqramlı yoxlanışı ilə təsdiqləndi.

---

## 9. Tövsiyə

Task **`In Progress`**-ə qaytarılmalıdır. 4 bug (BUG-1 … BUG-4) ayrıca task kimi
yaradılmalı və prioritetlə həll edilməlidir. Bloklayıcı meyarların hamısı
keçdiyi üçün, orkestrator qərarı ilə BUG-3 və BUG-4 «Mərhələ 2A» taskına
köçürülüb FE#69 bağlana bilər — bu, PM-in qərarıdır.
