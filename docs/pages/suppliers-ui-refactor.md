# Təchizatçılar səhifəsi — dizayn sisteminə keçid (FE#75)

Bu sənəd FE#75 çərçivəsində **yalnız "Təchizatçılar" səhifəsində** aparılan
dəyişiklikləri, verilən qərarları və əsaslandırmalarını qeydə alır. Asılılıq:
FE#74 (Done, `main`-ə merge olunub — "Nisyə Borclar" səhifəsi, bax
`docs/pages/customer-debts-ui-refactor.md`). Referans: `docs/design-system.md`
(FE#69), `docs/ui-refactor-roadmap.md` (Mərhələ 3, iş bəndi 3.10).

**TOXUNULMAZ qalıb (dəyişməyib):** təchizatçı yaradılması/redaktəsi/silinməsi,
mal alışı (`itemCount` mənbəyi), borc əlavəsi (ilkin borc/mal alışı) və
ödəniş məntiqi — bunların hamısı `src/features/suppliers/api.ts` və
`src/features/suppliers/queries.ts`-dədir, bu taskda HEÇ BİR API çağırışı
əlavə/dəyişdirilməyib. `DebtModal.tsx`, `NewSupplierModal.tsx`,
`EditSupplierModal.tsx` — fayllar tamamilə TOXUNULMAYIB (funksional + görünüş
dəyişmədi). `PayModal.tsx`-da YALNIZ modal başlığının mətni dəyişib
(§2.6) — forma sahələri/validasiya/submit axını (`usePaySupplier`) bit-bədit
qorunub.

---

## 1. Dəyişən komponentlər

| Fayl | Nə dəyişdi |
|---|---|
| `src/routes/_app.tedarukculer.tsx` | `PageHead` → `PageHeader`; lokal (client-side) axtarış (ad/telefon) + `[Hamısı]`/`[Borcum olanlar]` seqmenti `TableToolbar`-da (URL `search.q`/`search.onlyDebtors`, zod sxemi); "Görünən: N" xülasə sətri (Müştərilər/FE#73 naxışı) |
| `src/features/suppliers/components/SuppliersTable.tsx` | Sütun başlığı/tooltip "Bağlı mal sayı" / "Bu təchizatçıdan alınan mallar" (bənd 5); ad sahəsi tam kliklənən → `onView` (bənd 7); sətir/mobil-kart əməliyyatı "Ödəniş" → "Təchizatçıya ödəniş et" (bənd 6); borc rəqəmi/badge `debt-presentation.ts`-dəki 4 dərəcəli tona keçdi (bənd rəng qaydası); `emptyState` propu — axtarış/seqment nəticəsiz qaldıqda fərqli mesaj |
| `src/features/suppliers/components/SupplierDrawer.tsx` | `CustomerDrawer.tsx` (FE#73) ilə EYNİ standart naxışa keçdi: tone-lu "Cari borcum" əsas panel · "Əlaqə" kartı · "Bağlı mallar" kartı · vahid xronoloji "Alışlar (borc əlavələri) / ödəniş tarixçəsi" kartı; footer düymələri "Təchizatçıya ödəniş et" / "Borc əlavə et" |
| `src/features/suppliers/components/PayModal.tsx` | Modal başlığı "Ödəniş et — {ad}" → "Təchizatçıya ödəniş et — {ad}" (YALNIZ mətn, forma/validasiya/submit **dəyişməyib**) |
| `src/features/suppliers/components/debt-presentation.ts` | **YENİ** — `src/features/customers/components/debt-presentation.ts` (FE#73) ilə EYNİ naxış, mənbə tipi `Customer` → `Supplier` (bax §2.9) |
| `src/features/suppliers/components/debt-presentation.test.ts` | **YENİ** — `debtTone`/`debtAgeDays`/`DEBT_TONE_LABEL` unit testləri |
| `src/features/suppliers/components/SuppliersTable.test.tsx` | Mövcud FE#87 testləri saxlanılıb + **YENİ** FE#75 testləri: ad kliki (AC-7), "Bağlı mal sayı" başlıq/tooltip (AC-5), "Təchizatçıya ödəniş et" (AC-6), rəng/badge (AC-12), boş axtarış nəticəsi mesajı |

**Toxunulmayıb:** `src/features/suppliers/api.ts`, `src/features/suppliers/queries.ts`,
`DebtModal.tsx`, `NewSupplierModal.tsx`, `EditSupplierModal.tsx`,
`ConfirmModal`/`Drawer`/`DataTable`/`TableToolbar`/`LocalTableSearch`
primitivlərinin özləri.

---

## 2. Bənd-bənd qərarlar

### 1. "Yeni təchizatçı" əsas əməliyyat (bənd 1)

`PageHeader.primaryAction` slotunda, dəyişməz qalır — yalnız `PageHead` alias
`PageHeader`-ə keçdi (DS §4-dəki geriyə-uyğun alias, funksional fərq yoxdur).

### 2. Lokal axtarış (bənd 2, AC-2)

`_app.tedarukculer.tsx`-də `useMemo` ilə client-side süzülür — ad (substring,
case-insensitive) VƏ telefon (substring + rəqəm-yalnız müqayisə, `phoneDigits`
helper-i, Nisyə Borclar/Müştərilər ilə eyni naxış) üzrə. `useSuppliers()`
sorğusu dəyişmədi, YENİ API sorğusu ƏLAVƏ OLUNMADI.

### 3. Sürətli seqment görünüşlər (bənd 3, AC-3/AC-4)

`[Hamısı]` / `[Borcum olanlar]` — `role="tablist"`/`role="tab"` semantikası,
seçim `search.onlyDebtors` URL query parametrində saxlanılır (zod sxemi,
`validateSearch`), səhifə yenilənəndə (F5) itmir. **Mürəkkəb istifadəçi-adlı
saved view funksionallığı ƏLAVƏ OLUNMAYIB** — yalnız bu 2 sabit seqment.

### 4. "Mal sayı" etiketinin dəqiqləşdirilməsi (bənd 5, AC-5) — TAPINTI

**Yoxlama:** `itemCount` sahəsinin mənbəyi backend-də `SupplierDto`
proyeksiyasındadır — `Product.SupplierId`-ə görə bağlı mal sayı (bax
`src/features/suppliers/api.ts` başlığındakı mövcud şərh və
`SupplierDrawer.tsx`-dəki `allProducts.filter((p) => p.supplierId === supplier.id)`
eyni sahədən istifadə edir). Yəni bu, "bu təchizatçıdan nə qədər fərqli MAL
alınıb" — mal (məhsul) sayıdır, ƏMƏLİYYAT/alış sayı DEYİL.

**Qərar:** etiket **"Bağlı mal sayı"**, tooltip **"Bu təchizatçıdan alınan
mallar"** — task təsvirindəki tövsiyə ilə TAM üst-üstə düşür, fərqli
sadə-dil etiketi seçilməsinə ehtiyac olmadı. Tətbiq olunduğu yerlər:
`SuppliersTable.tsx` sütun başlığı (`<span title="...">`) + hüceyrə +
mobil kart alt sətri. Dəyər (`itemCount`) özü DƏYİŞMƏYİB.

### 5. "Ödəniş" → "Təchizatçıya ödəniş et" (bənd 6, AC-6)

Sətir əməliyyatı, mobil kart düyməsi, `SupplierDrawer` footer düyməsi və
`PayModal` başlığı — hamısı eyni mətnə keçdi. `PayModal`-ın forma
sahələri/validasiyası/submit axını (`usePaySupplier`) **dəyişməyib**.

### 6. Ad → `SupplierDrawer` (bənd 7, AC-7)

Cədvəldə təchizatçı adının BÜTÖVÜ (əvvəllər ayrıca "Detal" menyu bəndi ilə
açılırdı) indi kliklənən `<button>`-dir və birbaşa mövcud `SupplierDrawer`-i
açır — `Müştərilər` (FE#73) səhifəsindəki eyni naxış. `ActionMenu`-dakı
"Detal" bəndi də saxlanılıb (əlavə giriş nöqtəsi, zərər vermir).

### 7. Drawer məzmunu — yalnız mövcud data, kart üslubu (bənd 8, AC-8/AC-9)

`SupplierDrawer` `CustomerDrawer.tsx` (FE#73) ilə EYNİ struktur:

1. **Cari borcum** — tone-lu əsas panel (4 dərəcəli rəng, §2.9), altında
   "Toplam borc" / "Ödənilən" 2 sütunlu alt-məlumat (mövcud `totalDebt`/
   `paidAmount` sahələri).
2. **Əlaqə** — telefon (`CopyablePhone`), boşdursa "Telefon yoxdur".
3. **Bağlı mallar** — `useProducts()`-dan `supplierId` üzrə filtrlənmiş
   siyahı (mövcud sorğu, YENİ API YOXDUR), boşdursa `EmptyState`.
4. **Alışlar (borc əlavələri) / ödəniş tarixçəsi** — mövcud
   `useSupplierHistory` sorğusundan gələn VAHİD xronoloji siyahı (ilkin borc
   + ödənişlər), növünə görə ikon/rəng fərqlənir (ödəniş = yaşıl enmə oxu,
   borc = kəhrəba kitab ikonu). **Niyə ayrı-ayrı siyahılara BÖLÜNMƏDİ:** bir
   borc qeydi və onu söndürən ödəniş(lər) vaxt oxunda bir-birinin davamıdır;
   ayrılsa "bu borc artıq ödənilibmi?" sualına cavab üçün iki siyahı arasında
   əl ilə tarix müqayisəsi lazım gələrdi (Müştərilər/FE#73-dəki eyni qərar).

Genişlənmiş drawer (`isExpanded`) rejimində "Bağlı mallar" və tarixçə
`lg:grid-cols-2` ilə yan-yana göstərilir — en daha effektiv istifadə olunur
(bənd 9).

### 8. Enin effektiv istifadəsi (bənd 9, AC-9)

Cədvəl sütunları (Təchizatçı/Əlaqə/Bağlı mal sayı/Mənim borcum/Son ödəniş/
Əməliyyat) mövcud `DataTable` grid davranışını saxlayır — heç bir sütun sabit
px enində deyil, mətn `truncate`/`min-w-0` ilə uzun ad/telefon zamanı sətir
hündürlüyünü artırmır. Drawer-in genişlənmiş rejimi (mövcud `Drawer`
funksionallığı) 2 sütunlu grid ilə geniş ekranda boş sahəni azaldır.

### 9. Rəng qaydası (Rəng qaydası xatırlatması, AC-12)

`debt-presentation.ts` (təchizatçı) — `src/features/customers/components/debt-presentation.ts`
(Müştərilər/Nisyə Borclar, FE#73) ilə **eyni** 4 dərəcəli qayda, mənbə tipi
`Customer` → `Supplier`:

| Ton | Şərt | Rəqəm rəngi | Badge |
|---|---|---|---|
| `none` | `remainingDebt <= 0` | `text-stone-500` (drawer başlığında `emerald-700`, təsdiq) | yoxdur |
| `normal` | borc var, 60 gündən AZ hərəkətsiz | `text-stone-800` (neytral/tünd) | "Borclu" |
| `overdue` | 60–119 gün hərəkətsiz | kəhrəba (`TONE_TEXT.warning`) | "Gecikmiş borc" |
| `critical` | 120+ gün hərəkətsiz | **qırmızı** (`TONE_TEXT.danger`) | "Kritik borc" |

Qırmızı YALNIZ `critical` pillədə istifadə olunur və HƏR ZAMAN mətnli badge
ilə müşayiət olunur (DS 9-cu qayda — rəng tək göstərici deyil). "Hərəkətsizlik
yaşı" son ödəniş tarixindən, o yoxdursa yaradılma tarixindən hesablanır (bax
`debt-presentation.ts` başlığındakı ətraflı şərh — `Supplier` tipində
`Customer.lastPurchaseDate`-ə ekvivalent sahə olmadığı üçün bu, Müştəri
modulundan bir az daha kobud approximation-dır, lakin backend dəyişikliyi
tələb etməyən yeganə variant idi). Heç bir tarix yoxdursa yaş NAMƏLUM sayılır
və ən sakit (`normal`) tona düşür — məlumat çatışmazlığı YANLIŞLIQLA
"kritik" göstərilməsin deyə.

### 10. Vəziyyət idarəsi (bənd 10, AC-10)

`DataTable`-ın mövcud prioritet qaydası (xəta → yüklənmə → boş → məlumat) və
paylaşılan `TableSkeleton`/`InlineError`/`EmptyState` primitivləri artıq
düzgün işləyirdi (FE#87) — bu taskda struktur dəyişmədi:

- **Loading** → `TableSkeleton` (spinner deyil).
- **Boş (ümumiyyətlə təchizatçı yoxdur)** → "Hələ təchizatçı yoxdur" +
  "Yeni təchizatçı" CTA-sına işarə edən təsvir.
- **Axtarış/seqment nəticəsiz** → fərqli mesaj: "Filterə uyğun təchizatçı
  yoxdur" / "Axtarışı və ya «Borcum olanlar» görünüşünü dəyişin." (`emptyState`
  propu route-dan ötürülür).
- **Xəta** → `InlineError` + "Yenidən" (`onRetry={() => void refetch()}`,
  FE#87-dən bəri mövcud idi, dəyişmədi).

### 11. Səhifələmə (bənd 11, AC-11)

`SuppliersTable` `DataTable`-a keçir, `DataTable` daxilində mövcud
`TablePagination` komponenti istifadə olunur (digər bütün siyahı səhifələri
— Mallar/Müştərilər/Nisyə Borclar/Satış jurnalı — ilə EYNİ komponent, ayrıca
sətir yazılmayıb). Axtarış/seqment dəyişəndə `SuppliersTable`
`key={search.q|search.onlyDebtors}` ilə yenidən mount olunur → `DataTable`-ın
daxili səhifə state-i sıfırlanır, səhifə 1-ə qayıdır (`SalesJournal.tsx`-dəki
eyni naxış, FE#71).

---

## 3. Yekun (build/test/responsive)

- `npm run build` (`tsc && vite build`) — **0 xəta**.
- `npx vitest run` — bütün mövcud testlər YAŞIL (o cümlədən
  `SuppliersTable.test.tsx`-dəki FE#87 regressiya testləri) + bu taskda
  əlavə olunan yeni testlər: `debt-presentation.test.ts` (ton/yaş/badge
  mətni), `SuppliersTable.test.tsx`-ə əlavə olunan FE#75 bölməsi (ad kliki,
  "Bağlı mal sayı" başlıq/tooltip, "Təchizatçıya ödəniş et" mətni/klik,
  rəng/badge 3 pillə, boş axtarış nəticəsi mesajı). Qeyd: desktop `<table>`
  və mobil kart eyni anda DOM-a render olunduğu üçün (CSS `hidden md:block`/
  `md:hidden`) sətir-səviyyəli assert-lər `within(desktopTable(container))`
  ilə əhatələnib (`CustomersTable.test.tsx`-dəki eyni naxış) — çoxsaylı
  element xətasının qarşısı alınıb.
  `src/components/ui/PeriodFilter.test.tsx`-dəki 1 test bu taskdan ASILI
  OLMAYARAQ uğursuzdur (`PeriodFilter.tsx` bu PR-da toxunulmayıb, "Bu ay"
  çipinin defolt aktiv olması ilə bağlı əvvəldən mövcud tarix-asılı
  kövrəklikdir) — bu regressiya bu PR-ın əhatəsində DEYİL.
- Responsive: kod səviyyəsində 1280/1440/1920px üçün `DataTable`-ın mövcud
  masaüstü sütun grid-i (heç bir sabit px eni yoxdur, `truncate`/`min-w-0`
  ilə) və `TableToolbar`-ın `flex-col sm:flex-row` naxışı yoxlanıldı; 375px
  üçün `SuppliersTable`-ın mövcud `mobileCard` render-i (ad/telefon/bağlı mal
  sayı + borc rəqəmi/badge + "Təchizatçıya ödəniş et"/"Borc" düymələri,
  hər ikisi `h-11` ≥44px toxunma hədəfi) istifadə olunur — bu mobil kart
  strukturu FE#69-dan bəri mövcud idi, bu taskda YALNIZ məzmunu (etiketlər,
  rəng tonu) yeniləndi. Headless brauzer mühiti mövcud olmadığı üçün
  (FE#70/FE#71/FE#73/FE#74-də də qeyd olunan eyni məhdudiyyət) piksel-səviyyəli
  skrinşot yoxlaması aparılmayıb — CSS/breakpoint səviyyəsində, mövcud
  `DataTable`/`mobileCard`/`Drawer` (`isExpanded` genişlənmə) naxışı üzərində
  təsdiqləndi.
- `git diff main --stat` — yalnız yuxarıdakı 7 fayl (5 dəyişən + 2 yeni);
  `src/features/suppliers/api.ts`, `src/features/suppliers/queries.ts`,
  `DebtModal.tsx`, `NewSupplierModal.tsx`, `EditSupplierModal.tsx`
  dəyişməyib.

## 4. Tam icra edilə bilməyən/güzəştə gedilən tələblər

- **Vizual (piksel-səviyyəli) skrinşot yoxlaması** aparılmadı — headless
  brauzer mühiti mövcud deyil (əvvəlki FE#70/FE#71/FE#73/FE#74-də də eyni
  məhdudiyyət qeyd olunub); responsive yoxlama kod/CSS səviyyəsindədir.
- **Borc yaşı "hərəkətsizlik" hesablaması** (§2.9) `Supplier` tipində
  `Customer.lastPurchaseDate`-ə ekvivalent bir sahə olmadığı üçün TAM dəqiq
  deyil (son ödənişdən sonra yeni borc əlavə olunubsa, YENİ borcun deyil,
  son ödənişin yaşı göstərilir) — bu, backend dəyişikliyi tələb etməyən
  qəsdən seçilmiş güzəştdir (bax `debt-presentation.ts` başlığı).
