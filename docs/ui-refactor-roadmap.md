# UI Refactor Yol Xəritəsi — Sədərək Anbar (FE#68)

## Məqsəd

Bu sənəd `docs/ui-ux-current-state-audit.md` sənədindəki 52 tapıntının (`F-01` … `F-52`) **mərhələli, müstəqil test edilə bilən** implementasiya planıdır. Hər mərhələ ayrıca branch + PR + yoxlama ilə bağlana bilər və **digər mərhələnin yarımçıq işindən asılı deyil**.

Risk qiymətləndirmələri üçün bax: `docs/ui-ux-risk-register.md` (`R-01` … `R-52` — hər tapıntı üçün bir risk sətri, 1:1 uyğunluq).
Təklif olunan bütün etiket dəyişiklikləri: audit sənədinin «Etiket və mətn dəyişiklikləri» cədvəli (`E-01` … `E-22`).

## Necə oxumalı

1. **Mərhələ xülasəsi** cədvəlindən başla — hansı mərhələdə hansı tapıntılar var və zəhmət nə qədərdir.
2. Hər mərhələ bölməsində 7 hissə var: **məqsəd · görüləcək işlər (`F-xx` + `E-xx` ilə) · toxunulacaq fayllar · gözlənilən nəticə · müstəqil yoxlama üsulu · geri qaytarma (rollback) · asılılıq və zəhmət**.
3. **Müstəqil yoxlama üsulu** cədvəli birbaşa QA test ssenarisi kimi istifadə olunur — mərhələ yalnız bu cədvəlin hər bəndi keçdikdən sonra bağlanır.
4. Mərhələlər bir-birindən **asılı deyil**: hər mərhələnin «Asılılıq» bölməsində bu açıq yazılıb və eyni komponentə toxunan işlərin niyə toqquşmadığı izah olunub.
5. Sonda **çarpaz istinad** cədvəlləri var: tapıntı → mərhələ və mərhələ üzrə ciddilik paylanması (prioritet qaydasının yoxlanması üçün).

## Prinsiplər (hər mərhələ üçün məcburi)

1. **Biznes məntiqinə toxunulmur.** Düsturlar, API kontraktları, backend davranışı, route-lar, icazələr, data modelləri və mövcud iş axınları dəyişmir.
2. **Heç bir funksiya və data silinmir.** Yalnız ölü kod (`F-46`) — istifadə olunmadığı `tsc` ilə təsdiqlənəndən sonra — silinir.
3. **Backend property/API sahə adları dəyişmir.** Bütün normalizasiyalar (məs. rol adları) yalnız təqdimat qatındadır.
4. **Yeni böyük UI framework quraşdırılmır.** Mövcud stack: Tailwind 3.4 + lucide-react + TanStack + zustand.
5. **Hər mərhələ `npm run build` (`tsc && vite build`) və `npm test` (vitest) yaşıl olmadan bağlanmır.**
6. **Hər etiket dəyişikliyi audit cədvəlindəki `E-xx` sətrinə istinad edir** — cədvəldən kənar mətn dəyişikliyi tətbiq edilmir.

## Mərhələ xülasəsi

| Mərhələ | Ad | Tapıntılar | Ciddilik tərkibi | Zəhmət | Asılılıq |
|---|---|---|---|---|---|
| **1** | Pul həqiqəti və bloklayıcı vəziyyətlər | F-01, F-02, F-03, F-04, F-22, F-27 | Kritik ×3, Yüksək ×3 | **M** | Yoxdur |
| **2A** | Etiket və təqdimat aydınlığı | F-07, F-09, F-13, F-26, F-34, F-44 | Yüksək ×6 | **M** | Yoxdur |
| **2B** | Kassa tempi və əlçatanlıq bazası | F-11, F-12, F-37, F-38, F-50 | Yüksək ×5 | **L** | Yoxdur |
| **3** | KPI, filtr və terminologiya dilinin bərabərləşdirilməsi | F-05, F-06, F-08, F-14, F-15, F-16, F-18, F-19, F-21, F-23, F-28, F-47, F-52 | Orta ×12, Aşağı ×1 (`F-23`) | **L** | Yoxdur |
| **4** | Responsive, mobil kart tamlığı və əlçatanlıq detalları | F-17, F-24, F-25, F-29, F-30, F-31, F-32, F-35, F-36, F-39, F-40, F-48 | Orta ×12 | **L** | Yoxdur |
| **5** | Vəziyyət (state) dili və overlay davranışı | F-41, F-42, F-43, F-51 | Orta ×4 | **M** | Yoxdur |
| **6** | Təmizlik və incə detallar | F-10, F-20, F-33, F-45, F-46, F-49 | Aşağı ×6 | **M** | Yoxdur |

**Prioritet yoxlaması:** bütün `Kritik` tapıntılar (F-01, F-02, F-03) **Mərhələ 1**-dədir. Bütün `Yüksək` tapıntılar (F-04, F-07, F-09, F-11, F-12, F-13, F-22, F-26, F-27, F-34, F-37, F-38, F-44, F-50) **Mərhələ 1–2** aralığındadır. Heç bir `Kritik` tapıntı `Orta`/`Aşağı` tapıntılardan sonrakı mərhələyə düşməyib.

---

## Mərhələ 1 — Pul həqiqəti və bloklayıcı vəziyyətlər

**Məqsəd:** İstifadəçinin pul barədə YANLIŞ qərar verməsinə səbəb olan bütün təqdimat problemlərini aradan qaldırmaq və iki əsas ekranın xəta halında istifadə olunmaz vəziyyətə düşməsinin qarşısını almaq.

**Daxil olan tapıntılar:** `F-01` (Kritik), `F-02` (Kritik), `F-03` (Kritik), `F-04` (Yüksək), `F-22` (Yüksək), `F-27` (Yüksək).
**Bağlı risklər:** `R-01` (F-01), `R-02` (F-02), `R-03` (F-03), `R-04` (F-04), `R-05` (F-22), `R-06` (F-27).

### Görüləcək işlər

| # | İş | Tapıntı | Etiket |
|---|---|---|---|
| 1.1 | Sidebar və Gün Sonu «Kassada olmalı» etiketləri fərqləndirilsin; hər ikisinə mənbə/əhatə izahı əlavə edilsin; Gün Sonu kartına maaş ödənişlərinin daxil olmadığını bildirən statik qeyd sətri qoyulsun | F-01 | `E-01`, `E-02` |
| 1.2 | Gün sonu fərq bannerı, bağlanmış gün xülasəsi və `ClosingHistory` «Fərq» sütununda müsbət fərq **kəhrəba + xəbərdarlıq ikonu** ilə göstərilsin; yalnız `diff === 0` uğur rəngində qalsın | F-02 | `E-03`, `E-22` |
| 1.3 | Dashboard və Hesabatlar səhifələrinə `isError` budağı + `refetch()` ilə «Yenidən» düyməsi əlavə edilsin | F-03 | — |
| 1.4 | `StatCard`, `KpiCard`, `StatCluster` və `DebtsKpiCards` dəyər bloklarına `min-w-0` + `overflow-hidden` + `truncate` + `title` (tam dəyər) əlavə edilsin | F-04 | — |
| 1.5 | Xərc məbləği 7 yerdə vahid işarə qaydasına salınsın və `fmtMoneySigned` helper-i ilə tətbiq edilsin | F-22 | — |
| 1.6 | Hesabatlardakı «Xalis qazanc» etiketi dəqiqləşdirilsin və `sub` sahəsində xərcin çıxılmadığı bildirilsin | F-27 | `E-05` |

### Toxunulacaq fayllar

```
src/routes/_app.tsx
src/routes/_app.index.tsx
src/routes/_app.hesabatlar.tsx
src/routes/_app.xercler.tsx
src/components/ui/StatCard.tsx
src/components/ui/KpiCard.tsx
src/features/customers/components/DebtsKpiCards.tsx
src/features/day-end/components/DayEndCard.tsx
src/features/day-end/components/ClosingHistory.tsx
src/features/expenses/components/ExpensesTable.tsx
src/features/expenses/components/ExpenseDetailDrawer.tsx
src/features/reports/components/SignatureBand.tsx
```

### Gözlənilən nəticə

- «Kassada olmalı» iki yerdə fərqli etiketlə və izahla görünür; istifadəçi hansı rəqəmin nəyi əhatə etdiyini oxuya bilir.
- Müsbət kassa fərqi artıq uğur kimi görünmür — yoxlama tələb edən vəziyyət kimi işarələnir.
- Dashboard/Hesabatlar sorğu xətasında xəta mesajı + «Yenidən» düyməsi göstərir, spinner-də donmur.
- 375px-də 8 rəqəmli məbləğ kartın kənarından çıxmır (kəsilir və `title`-də tam görünür).
- Xərc məbləği bütün 7 yerdə eyni işarə qaydası ilə göstərilir.

### Müstəqil yoxlama üsulu

| # | Yoxlama | Gözlənilən |
|---|---|---|
| 1 | `npm run build` | exit 0, TypeScript xətası yoxdur |
| 2 | `npm test` | mövcud testlər yaşıl (`KpiCard.test.tsx`, `DebtsKpiCards.test.tsx`, `ProductsKpiCards.test.tsx` daxil) |
| 3 | Mock rejimdə Gün Sonu → faktiki sayıma gözləniləndən **böyük** məbləğ yazılsın | Banner yaşıl deyil, kəhrəba + xəbərdarlıq ikonu ilə görünür |
| 4 | Gün Sonu → gözləniləndən **kiçik** məbləğ | Banner qırmızı qalır (regresiya yoxdur) |
| 5 | Gün Sonu → dəqiq bərabər məbləğ | Banner uğur rəngindədir |
| 6 | DevTools → şəbəkəni oflayn et → Dashboard və Hesabatlar açılsın | Sonsuz spinner yoxdur; xəta mesajı + «Yenidən» görünür; onlayn olub «Yenidən» basıldıqda məlumat yüklənir |
| 7 | DevTools → 375px; mock DB-də bir mala böyük məbləğ (məs. 12 345 678) verilsin | KPI rəqəmi kartın içində qalır, qonşu karta daşmır |
| 8 | Xərclər səhifəsi → cədvəl, mobil kart, detal draweri, alt cəm; Dashboard «Bugünkü xərc»; Gün Sonu «Günlük xərclər»; `ClosingHistory` «Xərc» | 7 yerin hamısında eyni işarə qaydası |
| 9 | Hesabatlar → KPI sırası | «Xalis qazanc» etiketi yeni mətndədir və `sub`-da izah var |
| 10 | `git diff main --stat` | Yalnız yuxarıdakı 12 fayl; API/queries/lib faylları dəyişməyib |

### Geri qaytarma (rollback)

Mərhələ tək PR ilə birləşdirilir; problem aşkarlansa `git revert <merge-commit>` kifayətdir. Dəyişikliklər yalnız CSS sinifləri, etiket sətirləri və render budaqlarıdır — heç bir data miqrasiyası, API çağırışı və ya store sxemi dəyişmədiyi üçün geri qaytarma yan təsirsizdir. Alt-səviyyə rollback: hər iş bəndi (1.1 … 1.6) ayrıca commit-dir, ona görə tək bənd də `git revert` edilə bilər.

### Asılılıq

**Yoxdur.** Bu mərhələ heç bir digər mərhələnin yarımçıq işini tələb etmir. Mərhələ 3-də planlaşdırılan KPI kompozisiya dəyişikliyi bu mərhələdəki `F-04` overflow düzəlişini **əvəz etmir** — düzəliş paylaşılan komponentlərdə edildiyi üçün sonrakı yenidən qruplaşdırma zamanı da qüvvədə qalır.

### Zəhmət

**M** (təxminən 6 kiçik commit; ən böyük hissə xərc işarəsinin 7 yerdə vahidləşdirilməsidir).

---

## Mərhələ 2A — Etiket və təqdimat aydınlığı

**Məqsəd:** İstifadəçinin mənanı səhv başa düşməsinə səbəb olan yüksək ciddilikli etiket/təqdimat problemlərini həll etmək və şəbəkə xətasının «boş anbar» kimi görünməsinin qarşısını almaq.

**Daxil olan tapıntılar:** `F-07`, `F-09`, `F-13`, `F-26`, `F-34`, `F-44` (hamısı Yüksək).
**Bağlı risklər:** `R-07` (F-07), `R-08` (F-09), `R-09` (F-13), `R-10` (F-26), `R-11` (F-34), `R-12` (F-44).

### Görüləcək işlər

| # | İş | Tapıntı | Etiket |
|---|---|---|---|
| 2A.1 | «Qazanc %» etiketi dəqiqləşdirilsin, 3 yerdə eyni format tətbiq edilsin, cədvəl başlığına `title` izahı əlavə olunsun | F-07 | `E-04` |
| 2A.2 | Qismən ödəniş jurnalda, mobil kartda və detal draweri-də eyni cütlə göstərilsin; badge yanına qismən ödəniş nişanı; sütun başlığı dəqiqləşdirilsin | F-13 | `E-09`, `E-10` |
| 2A.3 | Hesabatlar `PeriodFilter`-ə keçirilsin (`defaultKey="month"`); `inPeriod` → `isoInRange`; köhnə `?period` URL-i zod sxemində qəbul edilməyə davam etsin | F-26 | — |
| 2A.4 | Paylaşılan `ErrorState` komponenti yaradılsın; 6 siyahı səhifəsinə `isError` budağı əlavə edilsin | F-44 | — |
| 2A.5 | Mock rejimdə işləməyən 6 düymə `aria-disabled` + `title` səbəbi ilə göstərilsin; toast mətni dəqiqləşdirilsin | F-09 | `E-21` |
| 2A.6 | Login `Field` + `Input` + `Button` komponentlərinə keçirilsin; başlıq `storeName`-ə bağlansın. **`PhoneInput` bu mərhələdə tətbiq EDİLMİR** (bax `R-11`, risk reyestri bölmə 6) | F-34 | `E-17` |

### Toxunulacaq fayllar

```
src/components/ui/ErrorState.tsx            (yeni)
src/routes/login.tsx
src/routes/_app.hesabatlar.tsx
src/routes/_app.mallar.tsx
src/routes/_app.musteriler.tsx
src/routes/_app.borclar.tsx
src/routes/_app.tedarukculer.tsx
src/routes/_app.mallar_.$id.tsx
src/features/products/components/ProductsTable.tsx
src/features/products/components/ProductForm.tsx
src/features/sales/components/SalesJournal.tsx
src/features/sales/components/SaleDetailDrawer.tsx
src/features/sales/components/QuickSaleScreen.tsx
src/features/sales/useInvoiceDownload.ts
src/features/sales/useInvoiceWhatsApp.ts
src/features/day-end/components/ClosingHistory.tsx
src/features/employees/components/EmployeesTable.tsx
```

### Gözlənilən nəticə

- «Qazanc %»-in mayaya görə olduğu etiketdən və tooltip-dən aydındır; format hər üç yerdə eynidir.
- Qismən ödənişli satış hər yerdə «ödənilib + qalıq» cütü ilə göstərilir.
- Hesabatlar da digər 4 səhifə ilə eyni dövr filtrini işlədir; sərbəst tarix aralığı mümkündür.
- Şəbəkə xətasında siyahı səhifələri «boş» yox, «yüklənmədi + Yenidən» göstərir.
- Demo rejimdə işləməyən düymələr səbəbi ilə birlikdə deaktiv görünür.
- Login qalan tətbiqlə eyni forma dilində və 44px+ toxunma sahələri ilədir.

### Müstəqil yoxlama üsulu

| # | Yoxlama | Gözlənilən |
|---|---|---|
| 1 | `npm run build` və `npm test` | exit 0; mövcud testlər yaşıl |
| 2 | Yeni unit test: `inPeriod` vs `isoInRange` sərhəd günləri (ayın 1-i, sonu, bugün) | Eyni giriş → eyni nəticə (bu test `R-10` üçün bloklayıcıdır) |
| 3 | Hesabatlar → «Bu ay» seçimi; dəyişiklikdən əvvəlki rəqəmlərlə müqayisə | Satış / qazanc / xərc rəqəmləri eynidir |
| 4 | Hesabatlar → köhnə URL `?period=week` ilə açılsın | Səhifə sınmır (zod `catch`), dövr düzgün tətbiq olunur |
| 5 | Mallar / Müştərilər / Nisyə Borclar / Təchizatçılar → şəbəkə oflayn | «Yüklənmədi» + «Yenidən»; «boş siyahı» mesajı GÖRÜNMÜR |
| 6 | Mock rejim (`VITE_API_URL` boş) → Mallar «Excel export», Satış «Qaimə» | Düymələr deaktiv görünür, `title`-də səbəb var |
| 7 | Satış → qismən ödənişli satış yaradılsın; jurnal, mobil kart və detal draweri açılsın | Hər üçündə eyni «ödənilib + qalıq» cütü |
| 8 | Login → 375px, klaviatura ilə Tab | Sahələr 48px, düymə 52px; fokus görünür; giriş uğurlu, `phone` dəyəri dəyişməyib |
| 9 | `git diff main --stat` | Yalnız yuxarıdakı fayllar; `src/features/*/api.ts` və `queries.ts` faylları dəyişməyib |

### Geri qaytarma (rollback)

Hər iş bəndi ayrıca commit-dir. Ən həssas bənd `2A.3`-dür (`R-10`): əgər hesabat rəqəmlərində sürüşmə aşkarlansa **yalnız** həmin commit `git revert` edilir — qalan 5 bənd müstəqildir və qüvvədə qalır. `ErrorState` yeni fayldır: geri qaytarıldıqda ondan istifadə edən budaqlar da eyni commit-də geri qayıdır, ona görə qalıq import qalmır (`tsc` təsdiqləyir).

### Asılılıq

**Yoxdur.** Mərhələ 1 tətbiq olunmasa belə bu mərhələ tam işləyir. `ErrorState` komponenti Mərhələ 1-də əlavə olunan Dashboard/Hesabatlar `isError` budağı ilə **üst-üstə düşmür** (orada `KpiCard.onRetry` naxışı istifadə olunur); Mərhələ 1 və 2A eyni vaxtda paralel də aparıla bilər, yeganə toxunma nöqtəsi `_app.hesabatlar.tsx`-dir və orada dəyişikliklər fərqli bloklardadır (KPI etiketi vs dövr filtri).

### Zəhmət

**M** (6 commit; ən böyük hissə `2A.3` dövr filtri keçidi və `2A.4` xəta budaqlarıdır).

---

## Mərhələ 2B — Kassa tempi və əlçatanlıq bazası

**Məqsəd:** Gündəlik iş sürətini birbaşa artırmaq (barkod + toxunuş sayı) və klaviatura/toxunma ilə işi mümkün edən əlçatanlıq bazasını qurmaq.

**Daxil olan tapıntılar:** `F-11`, `F-12`, `F-37`, `F-38`, `F-50` (hamısı Yüksək).
**Bağlı risklər:** `R-13` (F-11), `R-14` (F-12), `R-15` (F-37), `R-16` (F-38), `R-17` (F-50).

### Görüləcək işlər

| # | İş | Tapıntı | Etiket |
|---|---|---|---|
| 2B.1 | Kassa axtarış inputuna `Enter` idarəsi: tək nəticə və ya tam barkod uyğunluğu → mövcud `selectProduct` çağırılsın | F-11 | — |
| 2B.2 | Ödəniş modalında sonuncu `paidVia` seçimi xatırlansın (zustand, `drawer-store` naxışı); modalda `Enter` təsdiqi bütün hallarda işləsin. **«Tam/Qismən/Ödəmədi» seçimi defolt qoyulmur** (bax `R-14`, risk reyestri bölmə 6) | F-12 | — |
| 2B.3 | `src/index.css`-də vahid fokus tokeni; `Button`, `Input`, `Textarea`, `Select`, `PeriodFilter` çipləri, `DataTable` səhifələməsi eyni `focus-visible` naxışına gətirilsin | F-37 | — |
| 2B.4 | Mobil ölçüdə əsas toxunma hədəfləri ≥44px-ə çatdırılsın (çiplər, cədvəl sətir düymələri, `ActionMenu` trigger, `Modal`/`Drawer` bağlama, `CopyablePhone` zəng ikonu, `SalaryCard` düymələri) | F-38 | — |
| 2B.5 | `FilterBar`-ın axtarış hissəsi `SearchInput` kimi ixrac olunsun; Nisyə Borclar («Borclar» rejimi) və Müştərilər ona keçirilsin; topbar axtarışı vizual olaraq «qlobal» kimi fərqləndirilsin | F-50 | — |

### Toxunulacaq fayllar

```
src/index.css
src/components/ui/Button.tsx
src/components/ui/Input.tsx
src/components/ui/Textarea.tsx
src/components/ui/Select.tsx
src/components/ui/PeriodFilter.tsx
src/components/ui/DataTable.tsx
src/components/ui/FilterBar.tsx
src/components/ui/Modal.tsx
src/components/ui/Drawer.tsx
src/components/ui/ActionMenu.tsx
src/components/ui/CopyablePhone.tsx
src/routes/_app.tsx
src/routes/_app.borclar.tsx
src/routes/_app.musteriler.tsx
src/features/sales/components/QuickSaleScreen.tsx
src/features/sales/components/PaymentConfirmModal.tsx
src/features/sales/components/SalesJournal.tsx
src/features/customers/components/CustomersTable.tsx
src/features/customers/components/OpenDebtsTable.tsx
src/features/expenses/components/ExpensesTable.tsx
src/features/employees/components/SalaryCard.tsx
```

### Gözlənilən nəticə

- Barkod skan edildikdə (mətn + `Enter`) mal avtomatik seçilir; toxunuş tələb olunmur.
- Nağd satışda ödəniş üsulu hazır seçilmiş gəlir; bir satış 5 əvəzinə 4 toxunuşa düşür (məbləğ qərarı yenə şüurludur).
- Tab ilə naviqasiyada hər fokuslanan element aydın görünür (vahid halqa).
- Mobil ölçüdə heç bir əsas düymə/çip 44px-dən kiçik deyil.
- Səhifədaxili axtarışlar eyni görünür və eyni davranır; topbar axtarışının «başqa səhifəyə keçdiyi» vizual olaraq aydındır.

### Müstəqil yoxlama üsulu

| # | Yoxlama | Gözlənilən |
|---|---|---|
| 1 | `npm run build`, `npm test` | exit 0; mövcud testlər yaşıl |
| 2 | Satış → axtarışa mövcud barkod yazılıb `Enter` | Mal seçilir, detallar ekranı açılır |
| 3 | Satış → 2+ nəticə verən mətn + `Enter` | Heç nə seçilmir (səhv seçimin qarşısı alınır); kart siyahısı qalır |
| 4 | Satış → stokda olmayan malın barkodu + `Enter` | Seçilmir (`selectProduct` mövcud `quantity <= 0` qoruyucusu işləyir) |
| 5 | Nağd satış tamamlansın; dərhal ikinci satış | Ödəniş modalında «Nağd» seçili gəlir, «Tam/Qismən/Ödəmədi» isə **boşdur** və «Təsdiqlə» deaktivdir |
| 6 | Klaviatura ilə Tab: Dashboard → Mallar → Satış | Hər fokuslanan element eyni görünüşlü halqa ilə işarələnir |
| 7 | DevTools 375px + toxunma emulyasiyası; `PeriodFilter` çipləri, cədvəl sətir düymələri | Bütün hədəflər ≥44×44px (DevTools ölçmə ilə) |
| 8 | Nisyə Borclar «Borclar» rejimi və Müştərilər axtarışları | Hündürlük, ikon və placeholder qaydası `FilterBar` ilə eynidir |
| 9 | `git diff main --stat` | `src/features/*/api.ts`, `queries.ts`, `lib.ts` faylları dəyişməyib |

### Geri qaytarma (rollback)

`2B.1`, `2B.2`, `2B.5` ayrıca commit-lərdir və müstəqil geri qaytarıla bilər. `2B.3` (fokus tokeni) və `2B.4` (toxunma ölçüləri) yalnız CSS sinifləridir — geri qaytarma vizual vəziyyəti dərhal əvvəlki halına qaytarır. `2B.2` üçün əlavə təhlükəsizlik: `paidVia` yaddaşı zustand store-dadır (persist edilmir), ona görə revert-dən sonra heç bir qalıq vəziyyət saxlanılmır.

### Asılılıq

**Yoxdur.** Mərhələ 1 və 2A tətbiq olunmasa belə işləyir. `2B.5` Mərhələ 3-dəki `F-16`/`F-19` işlərini **asanlaşdırır**, lakin onları tələb etmir və onlardan asılı deyil.

### Zəhmət

**L** (5 commit; `2B.4` bir çox faylda kiçik dəyişikliklər tələb edir və ən çox vaxt aparan hissədir).

---

## Mərhələ 3 — KPI, filtr və terminologiya dilinin bərabərləşdirilməsi

**Məqsəd:** Səhifədən-səhifəyə dəyişən KPI kompozisiyasını, filtr naxışını və terminologiyanı vahid dilə gətirmək; kassa ekranını sadələşdirmək.

**Daxil olan tapıntılar:** `F-05`, `F-06`, `F-08`, `F-14`, `F-15`, `F-16`, `F-18`, `F-19`, `F-21`, `F-28`, `F-47`, `F-52` (Orta) və `F-23` (Aşağı — Xərclər/Nisyə Borclar «filtrlənmiş cəm» naxışı `F-23` ilə eyni işdə həll olunduğu üçün bu mərhələyə salınıb).
**Bağlı risklər:** `R-18` … `R-29` (Orta) və `R-46` (Aşağı — `F-23`).

### Görüləcək işlər

| # | İş | Tapıntı | Etiket |
|---|---|---|---|
| 3.1 | `DebtsKpiCards` inline panelləri `StatCluster`/`KpiCard` ilə əvəz olunsun; `ErrorBlock` nüsxəsi silinsin | F-47 | — |
| 3.2 | Dashboard KPI sırası `StatCluster` + `KpiCard` + `AlertPill` ilə qruplaşdırılsın | F-05 | — |
| 3.3 | Hesabatlar KPI sırası eyni dilə gətirilsin | F-28 | — |
| 3.4 | Dashboard-dakı «Bugünkü qazanc» / «Kağız üzərində qazanc» adı vahidləşdirilsin | F-06 | `E-06` |
| 3.5 | Mallarda `PeriodFilter` + «Bu dövrdə…» sətri tək «Dövr:» konteynerinə salınsın (Nisyə Borclar naxışı) | F-08 | — |
| 3.6 | Nisyə Borclarda hər iki rejim üçün eyni `FilterBar`; «Son əməliyyat» filtri `PeriodFilter` çip dilinə gətirilsin | F-19 | — |
| 3.7 | Nisyə Borclarda «Ümumi qalıq» altına mənbə qeydi (`KpiCard.sub`) | F-18 | — |
| 3.8 | Paylaşılan «görünən cəm» komponenti; Xərclər, Nisyə Borclar (2 yer) ona keçirilsin | F-23 | `E-11` |
| 3.9 | Müştərilər səhifəsinə `FilterBar` + `StatCluster` | F-16 | — |
| 3.10 | Təchizatçılar səhifəsinə `FilterBar` + `KpiCard`/`StatCluster` | F-21 | — |
| 3.11 | Satış jurnalı boş axtarışda yığcam başlasın («Bütün jurnalı aç» keçidi ilə) | F-14 | — |
| 3.12 | Uğur ekranına görünən geri sayım; qalıq borcu olan satışlarda avtomatik bağlanma tətbiq edilməsin | F-15 | — |
| 3.13 | Terminologiya vahidləşdirilməsi | F-52 | `E-07`, `E-08`, `E-12`, `E-13`, `E-14`, `E-16` |

### Toxunulacaq fayllar

```
src/components/ui/VisibleTotal.tsx           (yeni — "görünən cəm" sətri)
src/components/ui/FilterBar.tsx
src/components/ui/KpiCard.tsx
src/routes/_app.index.tsx
src/routes/_app.hesabatlar.tsx
src/routes/_app.mallar.tsx
src/routes/_app.musteriler.tsx
src/routes/_app.borclar.tsx
src/routes/_app.tedarukculer.tsx
src/routes/_app.xercler.tsx
src/features/customers/components/DebtsKpiCards.tsx
src/features/customers/components/OpenDebtsView.tsx
src/features/products/components/ProductsKpiCards.tsx
src/features/sales/components/QuickSaleScreen.tsx
src/features/sales/components/SalesJournal.tsx
src/features/reports/components/SignatureBand.tsx
src/features/suppliers/components/SuppliersTable.tsx
```

### Gözlənilən nəticə

- Bütün 6 KPI-lı səhifə eyni kompozisiya dilində (`StatCluster` / `KpiCard` / `AlertPill`).
- Dövr filtri hər səhifədə eyni yerdə, eyni görünüşdə və əhatəsi vizual olaraq aydındır.
- Müştərilər və Təchizatçılar səhifələrində axtarış və ümumi rəqəmlər var.
- Kassa ekranı defolt olaraq sadədir; hesabat yalnız istənildikdə açılır.
- Terminlər bütün ekranlarda eynidir.

### Müstəqil yoxlama üsulu

| # | Yoxlama | Gözlənilən |
|---|---|---|
| 1 | `npm run build`, `npm test` | exit 0; `DebtsKpiCards.test.tsx`, `ProductsKpiCards.test.tsx`, `KpiCard.test.tsx` yaşıl (3.1 üçün bloklayıcı) |
| 2 | 6 səhifədə KPI blokları vizual müqayisə edilsin | Etiket üslubu (`uppercase`), rəqəm ölçüsü və skeleton davranışı eynidir |
| 3 | Nisyə Borclar → dövr çipi dəyişdirilsin | Yalnız «Bu dövrdə…» sətri yenilənir, snapshot panellər sabit qalır (FE#65 davranışı qorunur) |
| 4 | Mallar → dövr çipi dəyişdirilsin | «Bu dövrdə…» sətri dövr konteynerindədir; cədvəlin dəyişmədiyi vizual olaraq aydındır |
| 5 | Müştərilər / Təchizatçılar → axtarış və filtrlər | `FilterBar` işləyir, URL search params yenilənir, F5 sonrası vəziyyət qalır |
| 6 | Satış → boş axtarış | Yığcam jurnal görünür; «Bütün jurnalı aç» tam görünüşü açır |
| 7 | Satış → qalıq borclu satış tamamlansın | Uğur ekranı avtomatik bağlanmır; əl ilə bağlanır |
| 8 | Bütün səhifələrdə etiket yoxlaması | `E-06`, `E-07`, `E-08`, `E-11`, `E-12`, `E-13`, `E-14`, `E-16` cədvəldəki mətnlərə uyğundur |
| 9 | `git diff main --stat` | `src/features/*/api.ts`, `queries.ts` faylları dəyişməyib |

### Geri qaytarma (rollback)

13 iş bəndi ən azı 6 müstəqil commit-də qruplaşdırılır (KPI dili · dövr/filtr · yeni səhifə filtrləri · kassa sadələşdirməsi · görünən cəm · terminologiya). Hər qrup ayrıca revert edilə bilər. `3.1` üçün əlavə təhlükəsizlik: mövcud `DebtsKpiCards.test.tsx` testləri dəyişdirilmədən saxlanılır — revert halında test yenidən köhnə struktura uyğun gəlir.

### Asılılıq

**Yoxdur.** Mərhələ 1 və 2 tətbiq olunmasa belə işləyir. `3.1`–`3.3` işləri Mərhələ 1-dəki `F-04` overflow düzəlişi ilə eyni komponentlərə toxunur, lakin fərqli sətirlərə (kompozisiya vs dəyər bloku sinifləri) — merge konflikti riski aşağıdır və hər iki dəyişiklik bir-birini əvəz etmir.

### Zəhmət

**L** (13 iş bəndi, ≥6 commit; ən böyük hissə `3.9`/`3.10` — iki səhifəyə tam filtr+KPI dili gətirilməsi).

---

## Mərhələ 4 — Responsive, mobil kart tamlığı və əlçatanlıq detalları

**Məqsəd:** Telefon və planşetdə məlumatın tam və oxunaqlı görünməsini təmin etmək; kontrast və bildiriş əlçatanlığını düzəltmək.

**Daxil olan tapıntılar:** `F-17`, `F-24`, `F-25`, `F-29`, `F-30`, `F-31`, `F-32`, `F-35`, `F-36`, `F-39`, `F-40`, `F-48` (hamısı Orta).
**Bağlı risklər:** `R-30` … `R-41`.

### Görüləcək işlər

| # | İş | Tapıntı | Etiket |
|---|---|---|---|
| 4.1 | Paylaşılan `MobileCard` karkası (`title`/`amount`/`meta`/`actions` slotları) yaradılsın; 6 mövcud mobil kart ona köçürülsün | F-48 | — |
| 4.2 | `ClosingHistory`, `EmployeesTable`, `ExcelImportModal` önizləməsinə mobil kart əlavə edilsin | F-24, F-31 | — |
| 4.3 | `CustomersTable` mobil kartı `variant`-a reaksiya versin; sıfır borc üçün `EmptyValue` istifadə olunsun | F-17 | — |
| 4.4 | `DataTable`-a opsional `mobileCardBreakpoint` propu (`md` defolt, `lg` seçimi); Satış jurnalı `lg`-yə keçirilsin | F-36 | — |
| 4.5 | Rol → görünən ad xəritəsi; `Badge.STATUS_STYLE`-a 3 rol tonu | F-29 | `E-18` |
| 4.6 | `SalaryCard` düymələri mobil ölçüdə `grid-cols-2 sm:grid-cols-3` + `size="md"`; maaş sahəsinə görünən redaktə göstəricisi | F-30 | — |
| 4.7 | Gün Sonu «Başlanğıc kassa» `Field` + `Input` + `aria-label` ilə | F-25 | — |
| 4.8 | Ayarlar formasının altında sticky saxlama zolağı; dirty/pending vəziyyəti | F-32 | — |
| 4.9 | Tab bar hündürlüyü CSS dəyişəni ilə; satış cəmi panelinə `safe-area` | F-35 | — |
| 4.10 | Toast konteynerinə `aria-live`/`role`; xəta müddəti uzadılsın; bağlama düyməsinə `aria-label` | F-39 | — |
| 4.11 | Əsas məlumat daşıyan mətnlər `text-stone-400`/`300` → `text-stone-500` | F-40 | — |

### Toxunulacaq fayllar

```
src/components/ui/MobileCard.tsx             (yeni)
src/components/ui/DataTable.tsx
src/components/ui/Badge.tsx
src/components/ui/Toast.tsx
src/components/ui/toast-store.ts
src/components/ui/EmptyValue.tsx
src/index.css
src/routes/_app.tsx
src/routes/_app.ayarlar.tsx
src/routes/_app.index.tsx
src/routes/_app.hesabatlar.tsx
src/features/sales/components/SalesJournal.tsx
src/features/sales/components/SaleDetailDrawer.tsx
src/features/sales/components/QuickSaleScreen.tsx
src/features/customers/components/CustomersTable.tsx
src/features/customers/components/OpenDebtsTable.tsx
src/features/expenses/components/ExpensesTable.tsx
src/features/products/components/ProductsTable.tsx
src/features/products/components/ExcelImportModal.tsx
src/features/suppliers/components/SuppliersTable.tsx
src/features/day-end/components/ClosingHistory.tsx
src/features/day-end/components/DayEndCard.tsx
src/features/employees/components/EmployeesTable.tsx
src/features/employees/components/SalaryCard.tsx
```

### Gözlənilən nəticə

- 375px-də heç bir cədvəl üfüqi sürüşmə tələb etmir; bütün cədvəllərin mobil kartı var.
- Mobil kart desktop cədvəli ilə eyni məlumatı verir (`variant` fərqləri daxil).
- Rol badge-i rəngli və vahid Azərbaycanca addadır.
- Ayarlar saxlama düyməsi həmişə əlçatandır və vəziyyəti göstərir.
- Toast-lar ekran oxuyucusuna elan olunur; xətalar tez itmir.
- Əsas mətnlərin kontrastı WCAG AA həddindədir.

### Müstəqil yoxlama üsulu

| # | Yoxlama | Gözlənilən |
|---|---|---|
| 1 | `npm run build`, `npm test` | exit 0; mövcud testlər yaşıl |
| 2 | DevTools 375px → 9 cədvəlin hamısı | Kart görünüşü; üfüqi sürüşmə yoxdur |
| 3 | DevTools 820px (planşet) → Satış jurnalı | Kart görünüşü (yeni `lg` sərhədi); sağ sütunlar kəsilmir |
| 4 | Müştərilər 375px → müştəri kartı | «Ümumi alış», «Alış sayı», «Son alış» görünür; sıfır borc «—» kimi |
| 5 | İşçilər → rol badge-ləri | Rəngli və Azərbaycanca; mock və real rejimdə eyni mətn |
| 6 | Ayarlar → aşağı sürüşdürülsün | Saxlama zolağı görünür; dəyişiklik yoxdursa düymə deaktiv; klik → gözləmə göstəricisi |
| 7 | iOS Safari emulyasiyası → Satış detalları | «SATIŞI TAMAMLA» tam görünür, tab bar altında qalmır |
| 8 | Ekran oxuyucusu (NVDA/VoiceOver) → hər hansı əməliyyat | Toast mesajı səsləndirilir |
| 9 | Kontrast yoxlayıcı (DevTools) → satış jurnalı mobil kartı, xərc qeydi | ≥4.5:1 |
| 10 | `git diff main --stat` | `src/features/*/api.ts`, `queries.ts`, `lib.ts` dəyişməyib |

### Geri qaytarma (rollback)

`4.1` (yeni `MobileCard`) və ona keçidlər tək commit-də aparılır ki, revert zamanı qalıq import qalmasın (`tsc` təsdiqləyir). Qalan 10 bənd ayrıca commit-lərdir. `4.4` (`DataTable` yeni propu) geriyə uyğundur — prop verilməzsə mövcud `md` davranışı qalır, ona görə revert riski minimaldır.

### Asılılıq

**Yoxdur.** `2B.4` (toxunma ölçüləri) tətbiq olunmasa belə bu mərhələ işləyir; `4.1` `MobileCard` karkası içində 44px düymə hündürlüyünü **artıq mövcud olan** `h-11` naxışı ilə saxlayır.

### Zəhmət

**L** (11 iş bəndi, ≥8 commit; ən böyük hissə `4.1` — 6 mobil kartın ortaq karkasa köçürülməsi).

---

## Mərhələ 5 — Vəziyyət (state) dili və overlay davranışı

**Məqsəd:** Yükləmə, gözləmə və təsdiq vəziyyətlərini vahid dilə gətirmək; `Drawer`-in `aria-modal` vədini real davranışla uzlaşdırmaq.

**Daxil olan tapıntılar:** `F-41`, `F-42`, `F-43`, `F-51` (hamısı Orta).
**Bağlı risklər:** `R-42`, `R-43`, `R-44`, `R-45`.

### Görüləcək işlər

| # | İş | Tapıntı |
|---|---|---|
| 5.1 | `DataTable`-a skeleton sətirləri (başlıqlar yerində qalmaqla); tam ekran `Spinner` yalnız ilk yüklənmədə | F-41 |
| 5.2 | `Button`-a opsional `loading?: boolean` propu (`Loader2` + `disabled` + `aria-busy`); 9 fayl mərhələli köçürülsün | F-42 |
| 5.3 | `ConfirmModal`-a opsional `isPending?` və `error?` propları; `onConfirm` `Promise` qaytardıqda modal yalnız uğurda bağlansın | F-43 |
| 5.4 | `Modal` layer məntiqi (`openStack` + body scroll kilidi + fokus tələsi) ortaq `useDialogLayer` hook-una çıxarılsın; `Drawer` də istifadə etsin | F-51 |

### Toxunulacaq fayllar

```
src/components/ui/useDialogLayer.ts          (yeni)
src/components/ui/Modal.tsx
src/components/ui/Drawer.tsx
src/components/ui/ConfirmModal.tsx
src/components/ui/Button.tsx
src/components/ui/DataTable.tsx
src/routes/login.tsx
src/routes/_app.mallar.tsx
src/features/sales/components/SalesJournal.tsx
src/features/sales/components/SaleDetailDrawer.tsx
src/features/sales/components/QuickSaleScreen.tsx
src/features/sales/components/PaymentConfirmModal.tsx
src/features/customers/components/CustomerDrawer.tsx
src/features/products/components/ExcelImportModal.tsx
src/features/products/components/LabelPrintModal.tsx
```

### Gözlənilən nəticə

- Cədvəl yüklənərkən başlıqlar yerində qalır; düzülüş sıçramır.
- Bütün düymələrdə gözləmə vəziyyəti eyni görünür.
- Silmə/bağlama təsdiqi əməliyyat bitənə qədər açıq qalır və xətanı modal daxilində göstərir.
- Drawer açıqkən arxa səhifə sürüşmür və Tab drawer daxilində dövr edir.

### Müstəqil yoxlama üsulu

| # | Yoxlama | Gözlənilən |
|---|---|---|
| 1 | `npm run build`, `npm test` | exit 0; mövcud testlər yaşıl |
| 2 | DevTools → şəbəkəni «Slow 3G» et → Mallar açılsın | Cədvəl başlıqları görünür, sətirlər skeleton kimi; yükləndikdə sıçrama yoxdur |
| 3 | Hər hansı mutasiya düyməsi (Excel export, qaimə, satış təsdiqi) | Eyni görünüşlü gözləmə göstəricisi; ikinci klik təsirsizdir |
| 4 | Satış → sətir sil → şəbəkə oflayn | Modal açıq qalır, daxildə xəta mesajı görünür; «İmtina» ilə bağlanır |
| 5 | Satış → sətir sil → uğurlu | Modal bağlanır, sətir siyahıdan çıxır, toast görünür |
| 6 | Hər hansı drawer açılsın → arxa səhifə sürüşdürülməyə çalışılsın | Arxa fon sürüşmür |
| 7 | Drawer açıqkən Tab basılsın (dövrə tamamlanana qədər) | Fokus drawer daxilində qalır, arxadakı elementlərə keçmir |
| 8 | Drawer bağlanandan sonra | Fokus onu açan düyməyə qayıdır (mövcud davranış qorunur) |
| 9 | `git diff main --stat` | `src/features/*/api.ts`, `queries.ts` dəyişməyib |

### Geri qaytarma (rollback)

`5.2` və `5.3` **geriyə uyğun** dəyişikliklərdir (yeni proplar opsionaldır) — revert edilsə çağırış yerləri köhnə formada işləməyə davam edir. `5.4` üçün: `useDialogLayer` yeni fayldır və `Modal`/`Drawer` eyni commit-də ona keçir, ona görə revert bütöv və qalıqsızdır. `5.1` yalnız `DataTable` daxilindədir.

### Asılılıq

**Yoxdur.** Mərhələ 2B-dəki fokus tokeni tətbiq olunmasa belə `useDialogLayer` fokus **tələsi** (Tab dövrü) müstəqil işləyir — fokusun *görünüşü* və *tələsi* ayrı məsələlərdir.

### Zəhmət

**M** (4 iş bəndi, ≥4 commit; `5.2`-də 9 faylın köçürülməsi mexaniki, lakin geniş).

---

## Mərhələ 6 — Təmizlik və incə detallar

**Məqsəd:** Ölü kodu təmizləmək, təkrarlanan helper-ləri birləşdirmək və qalan incə problemləri həll etmək.

**Daxil olan tapıntılar:** `F-10`, `F-20`, `F-33`, `F-45`, `F-46`, `F-49` (hamısı Aşağı).
**Bağlı risklər:** `R-47` … `R-52`.

### Görüləcək işlər

| # | İş | Tapıntı |
|---|---|---|
| 6.1 | `FilterPanel`-in axtarışsız rejimi `FilterBar`-a opsional prop kimi əlavə edilsin, sonra `FilterPanel.tsx` və `SaleCalculator.tsx` silinsin | F-46 |
| 6.2 | `DetailCard` + `DetailRow` paylaşılan komponentləri çıxarılsın; 3 lokal nüsxə ona keçirilsin | F-49 |
| 6.3 | Mal detalında `isError` budağı (xəta ≠ «mal silinib») | F-10 |
| 6.4 | Bütün WhatsApp keçidlərində `WhatsAppIcon` istifadə olunsun | F-20 |
| 6.5 | Ayarlarda tək variantlı «Valyuta»/«Dil» sahələri statik dəyər kimi göstərilsin | F-33 |
| 6.6 | `Modal`/`Drawer`/`Toasts` üçün qısa `ease-out` keçid; `src/index.css`-də qlobal `prefers-reduced-motion` bloku | F-45 |

### Toxunulacaq fayllar

```
src/components/ui/DetailCard.tsx             (yeni)
src/components/ui/FilterBar.tsx
src/components/ui/FilterPanel.tsx            (silinir)
src/components/ui/Modal.tsx
src/components/ui/Drawer.tsx
src/components/ui/Toast.tsx
src/index.css
src/routes/_app.ayarlar.tsx
src/routes/_app.mallar_.$id.tsx
src/features/sales/components/SaleCalculator.tsx   (silinir)
src/features/sales/components/SaleDetailDrawer.tsx
src/features/expenses/components/ExpenseDetailDrawer.tsx
src/features/day-end/components/DayEndCard.tsx
src/features/customers/components/CustomersTable.tsx
src/features/customers/components/OpenDebtsTable.tsx
```

### Gözlənilən nəticə

- `src/`-də istifadə olunmayan komponent qalmır.
- Detal panellərində sətir/kart üslubu tək mənbədən idarə olunur.
- Mal detalında şəbəkə xətası «silinmiş mal» kimi göstərilmir.
- WhatsApp hər yerdə eyni ikonla.
- Dəyişməyən sahələr açılan siyahı kimi görünmür.
- Modal/drawer/toast yumşaq açılır; hərəkətə həssas istifadəçilər üçün animasiyalar söndürülür.

### Müstəqil yoxlama üsulu

| # | Yoxlama | Gözlənilən |
|---|---|---|
| 1 | `npm run build` | exit 0 — silinmiş fayllara qalıq import olsaydı `tsc` xəta verərdi (bu, `6.1` üçün əsas qoruyucudur) |
| 2 | `npm test` | mövcud testlər yaşıl |
| 3 | Satış detalı və Xərc detalı drawer-ləri yan-yana müqayisə edilsin | Sətir aralıqları və etiket üslubu eynidir |
| 4 | Mal detalı → şəbəkə oflayn | Xəta mesajı görünür; «Mal tapılmadı» GÖRÜNMÜR |
| 5 | Müştərilər, Nisyə Borclar, Satış → WhatsApp keçidləri | Hamısında eyni brend ikonu |
| 6 | Ayarlar → «Valyuta»/«Dil» | Açılan siyahı deyil, statik dəyər + kilid göstəricisi |
| 7 | Hər hansı modal/drawer açılıb-bağlansın | Yumşaq keçid; «sıçrayış» yoxdur |
| 8 | OS-da «reduce motion» aktiv edilsin → eyni yoxlama | Keçidlər və `animate-*` söndürülüb |
| 9 | `git diff main --stat` | 2 fayl silinib; `src/features/*/api.ts`, `queries.ts` dəyişməyib |

### Geri qaytarma (rollback)

`6.1` (fayl silinməsi) tək commit-dədir — `git revert` faylları geri qaytarır. Qalan 5 bənd müstəqil commit-lərdir. `6.6` (animasiya) yalnız CSS-dir və dərhal geri qaytarıla bilər; `prefers-reduced-motion` bloku isə heç bir davranışı pozmadan əlavə olunur.

### Asılılıq

**Yoxdur.** `6.2` Mərhələ 4-dəki `MobileCard` işindən asılı deyil (fərqli komponentlər: detal paneli sətirləri vs cədvəl mobil kartları).

### Zəhmət

**M** (6 iş bəndi, ≥6 commit).

---

## Çarpaz istinad: tapıntı → mərhələ

Aşağıdakı cədvəl auditdəki **hər** `F-xx` tapıntısının hansı mərhələdə həll olunduğunu göstərir. Yol xəritəsində auditdə mövcud olmayan `F-xx` istinadı **yoxdur** (orfan istinad = 0).

| Tapıntı | Ciddilik | Mərhələ | Tapıntı | Ciddilik | Mərhələ |
|---|---|---|---|---|---|
| F-01 | Kritik | 1 | F-27 | Yüksək | 1 |
| F-02 | Kritik | 1 | F-28 | Orta | 3 |
| F-03 | Kritik | 1 | F-29 | Orta | 4 |
| F-04 | Yüksək | 1 | F-30 | Orta | 4 |
| F-05 | Orta | 3 | F-31 | Orta | 4 |
| F-06 | Orta | 3 | F-32 | Orta | 4 |
| F-07 | Yüksək | 2A | F-33 | Aşağı | 6 |
| F-08 | Orta | 3 | F-34 | Yüksək | 2A |
| F-09 | Yüksək | 2A | F-35 | Orta | 4 |
| F-10 | Aşağı | 6 | F-36 | Orta | 4 |
| F-11 | Yüksək | 2B | F-37 | Yüksək | 2B |
| F-12 | Yüksək | 2B | F-38 | Yüksək | 2B |
| F-13 | Yüksək | 2A | F-39 | Orta | 4 |
| F-14 | Orta | 3 | F-40 | Orta | 4 |
| F-15 | Orta | 3 | F-41 | Orta | 5 |
| F-16 | Orta | 3 | F-42 | Orta | 5 |
| F-17 | Orta | 4 | F-43 | Orta | 5 |
| F-18 | Orta | 3 | F-44 | Yüksək | 2A |
| F-19 | Orta | 3 | F-45 | Aşağı | 6 |
| F-20 | Aşağı | 6 | F-46 | Aşağı | 6 |
| F-21 | Orta | 3 | F-47 | Orta | 3 |
| F-22 | Yüksək | 1 | F-48 | Orta | 4 |
| F-23 | Aşağı | 3 | F-49 | Aşağı | 6 |
| F-24 | Orta | 4 | F-50 | Yüksək | 2B |
| F-25 | Orta | 4 | F-51 | Orta | 5 |
| F-26 | Yüksək | 2A | F-52 | Orta | 3 |

**Yekun:** 52 tapıntı → 7 mərhələ. Əhatə olunmamış tapıntı: **0**. Auditdə olmayan `F-xx` istinadı: **0**.

### Mərhələ üzrə ciddilik paylanması (AC-10 yoxlaması)

| Mərhələ | Kritik | Yüksək | Orta | Aşağı | Cəmi |
|---|---|---|---|---|---|
| 1 | **3** | 3 | 0 | 0 | 6 |
| 2A | 0 | **6** | 0 | 0 | 6 |
| 2B | 0 | **5** | 0 | 0 | 5 |
| 3 | 0 | 0 | 12 | 1 (`F-23`) | 13 |
| 4 | 0 | 0 | 12 | 0 | 12 |
| 5 | 0 | 0 | 4 | 0 | 4 |
| 6 | 0 | 0 | 0 | 6 | 6 |
| **Cəmi** | **3** | **14** | **28** | **7** | **52** |

Bu bölgü audit sənədindəki «Tapıntıların yekun bölgüsü» cədvəli ilə tam üst-üstə düşür (Kritik 3 · Yüksək 14 · Orta 28 · Aşağı 7). Yeganə qeyd: `F-23` (Aşağı) Mərhələ 3-ə salınıb, çünki onun həlli (`paylaşılan «görünən cəm» komponenti`) məhz həmin mərhələdəki `F-18` və `F-21` işləri ilə eyni fayllara toxunur — Aşağı tapıntının daha erkən mərhələyə salınması prioritet qaydasını pozmur (qadağan olunan hal yalnız Kritik/Yüksək tapıntının gecikdirilməsidir).

**Nəticə:** Bütün Kritik tapıntılar (`F-01`, `F-02`, `F-03`) Mərhələ 1-də; bütün Yüksək tapıntılar Mərhələ 1, 2A və 2B aralığında; heç bir Kritik və ya Yüksək tapıntı Orta/Aşağı tapıntılardan sonrakı mərhələyə düşməyib.

---

## Ümumi icra qaydası

1. Hər mərhələ üçün ayrıca task açılsın: `task/FE#XX-ui-<mərhələ-adı>`.
2. Branch adı: `task/FE#XX-<qısa-ad>`; birbaşa `main`-ə push qadağandır.
3. Hər iş bəndi ayrıca commit; commit mesajında `F-xx` ID-si göstərilsin (izlənilə bilənlik üçün).
4. PR açılmazdan əvvəl: `npm run build` (exit 0) + `npm test` (yeni fail yoxdur) + mərhələnin «Müstəqil yoxlama üsulu» cədvəlindəki bütün bəndlər.
5. PR təsvirində: həll olunan `F-xx` siyahısı, tətbiq olunan `E-xx` etiket dəyişiklikləri, yoxlama nəticələri və `git diff main --stat` çıxışı.
6. QA mərhələsində mərhələnin yoxlama cədvəli test ssenarisi kimi istifadə olunsun.
