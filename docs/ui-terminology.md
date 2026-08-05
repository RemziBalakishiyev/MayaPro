# UI Terminologiyası — köhnə → yeni (FE#69)

Bu sənəd FE#69 çərçivəsində **UI-da dəyişən HƏR etiket/placeholder/tooltip
mətnini** qeydə alır. Cədvəldən kənar mətn dəyişikliyi kodda YOXDUR.

İstinad sütunu:
- `E-xx` — `docs/ui-ux-current-state-audit.md` «Etiket və mətn dəyişiklikləri»
  cədvəlindəki sətir;
- `T-15` — FE#69 task mətnindəki 15-ci dizayn tələbi (qlobal/lokal axtarış
  mətnləri task tərəfindən birbaşa təyin olunub);
- `AC-xx` — PM-in qəbul meyarı (yeni əlavə olunan izah/tooltip mətnləri).

Dil qaydası: bütün mətnlər **Azərbaycanca**dır; ingiliscə qalıq mətn yoxdur
(kod identifikatorları istisna).

---

## 1. Dəyişən mətnlər

| # | Yer (fayl) | Köhnə | Yeni | Səbəb | İstinad |
|---|---|---|---|---|---|
| 1 | `src/routes/_app.tsx` → topbar axtarışı (indi `GlobalProductSearch`) | `Mal axtar... (Enter)` | `Bütün sistemdə mal axtar...` | Qlobal axtarışın əhatəsi placeholder-dən görünsün | T-15, AC-14 |
| 2 | `GlobalProductSearch` — yeni ipucu nişanı | *(yox idi)* | `Mallar səhifəsi` (Enter ikonu ilə) | `Enter`-in başqa səhifəyə apardığı əvvəlcədən bildirilir | AC-14 |
| 3 | `GlobalProductSearch` — `aria-label` | *(yox idi)* | `Bütün sistemdə mal axtar` | Ekran oxuyucusu üçün ad | AC-14 |
| 4 | `src/components/ui/FilterBar.tsx` — defolt placeholder | `Axtar...` | `Bu siyahıda axtar...` | Lokal axtarış qlobaldan fərqlənsin | T-15, AC-14 |
| 5 | `src/components/ui/FilterBar.tsx` — defolt `aria-label` | `Axtar` | `Bu siyahıda axtar` | Eyni səbəb | T-15 |
| 6 | `src/routes/_app.musteriler.tsx` | `Ad və ya telefon üzrə axtar...` | `Bu siyahıda axtar... (ad və ya telefon)` | Lokal axtarış dili vahidləşdi (əhatə mötərizədə saxlanıldı) | T-15, AC-14 |
| 7 | `src/routes/_app.borclar.tsx` («Borclar» rejimi) | `Ad, telefon və ya mal adı üzrə axtar...` | `Bu siyahıda axtar... (ad, telefon və ya mal)` | Eyni səbəb | T-15, AC-14 |
| 8 | `LocalTableSearch` — təmizləmə düyməsi | *(yox idi)* | `Axtarışı təmizlə` (aria-label + tooltip) | Yalnız-ikon düymə izahsız qalmasın | AC-15 |
| 9 | `src/features/day-end/components/DayEndCard.tsx` — müsbət fərq bannerı | `Kassada artıq məbləğ: X` | `Kassa uyğun gəlmir — X artıq çıxdı, yoxlayın` | Müsbət fərq uğur deyil, yoxlanmalı uyğunsuzluqdur | **E-03**, AC-12 |
| 10 | `DayEndCard` — müsbət fərq izah sətri | *(yox idi)* | `Artıq məbləğ də uyğunsuzluqdur: sayımı və qeydə alınmamış əməliyyatları yoxlayın.` | Rəng tək siqnal olmasın; nə etməli olduğu yazılsın | AC-10, AC-12 |
| 11 | `DayEndCard` — bağlanmış gün «Fərq» kartının alt sətri | *(yox idi)* | `Yoxlanmalı uyğunsuzluq (artıq məbləğ)` / `Kassada çatışmazlıq` / `Kassa düz gəlir` | Rəngin mənası mətnlə də verilsin | AC-10, AC-12 |
| 12 | `src/features/day-end/components/ClosingHistory.tsx` — «Fərq» sütunu tooltip-i | *(yox idi)* | `Yoxlanmalı uyğunsuzluq (artıq məbləğ)` / `Kassada çatışmazlıq` / `Kassa düz gəlib` | Eyni səbəb | AC-10, AC-12 |
| 13 | `src/components/ui/Toast.tsx` — bağlama düyməsi | *(etiketsiz idi)* | `Bildirişi bağla` (aria-label + tooltip) | Yalnız-ikon düymə izahsız qalmasın (F-39) | AC-15 |
| 14 | `src/components/ui/Toast.tsx` — növ prefiksi (yalnız ekran oxuyucusu) | *(yox idi)* | `Uğurlu:` / `Xəta:` / `Məlumat:` | Toast növü yalnız rənglə bildirilməsin | AC-10 |
| 15 | `src/components/ui/Modal.tsx`, `Drawer.tsx` — bağlama düyməsi | `Bağla` (yalnız `aria-label`) | `Bağla` (aria-label **+** tooltip) | `IconButton` qaydası: izah məcburidir | AC-15 |
| 16 | `src/components/layout/TopHeader.tsx` — menyu düyməsi | `Menyu` (yalnız `aria-label`) | `Menyu` (aria-label **+** tooltip) | Eyni səbəb | AC-15 |
| 17 | `src/components/ui/TablePagination.tsx` — səhifələmə düymələri | *(tooltip yox idi)* | `Əvvəlki səhifə` / `Bu, ilk səhifədir` · `Növbəti səhifə` / `Bu, son səhifədir` | Deaktiv vəziyyətin səbəbi izah olunsun | AC-9 |
| 18 | `src/components/ui/DataTable.tsx` — xəta mətni | *(xəta vəziyyəti yox idi)* | `Siyahı yüklənmədi` + `Şəbəkə və ya server cavab vermədi.` + `Yenidən` | Şəbəkə xətası «boş siyahı» kimi görünməsin (F-44) | AC-1 |
| 19 | `src/components/ui/LoadingSkeleton.tsx` | *(yox idi)* | `Məlumat yüklənir...` (ekran oxuyucusu üçün) | Yüklənmə vəziyyəti elan olunsun | AC-9 |
| 20 | `src/components/layout/Sidebar.tsx` — azalan mal sayı nişanı | *(tooltip yox idi)* | `N mal azalır` | Rəngli nişanın mənası mətnlə də verilsin | AC-10 |
| 21 | `src/routes/_app.mallar.tsx` — başlıqdakı 3 ikinci dərəcəli düymə | *(ayrı-ayrı düymələr)* | `Digər əməliyyatlar` menyusu (bəndlərin adları dəyişməyib: `Excel import`, `Excel export`, `Barkod/QR çap`) | Səhifədə bir əsas əməliyyat qalsın | AC-13 |
| 22 | `src/routes/_app.mallar.tsx` — export gözləmə bəndi | `Excel export` | `Excel export (gözləyin...)` — yalnız yüklənərkən | Menyu bəndində gözləmə vəziyyəti göstərilsin | AC-9 |
| 23 | `src/routes/_app.borclar.tsx` («Müştəri üzrə» rejimi, `FilterBar`) | `Ad və ya telefon üzrə axtar...` | `Bu siyahıda axtar... (ad və ya telefon)` | FE#69 taskı yalnız «Borclar» rejimini (sətir 7) əhatə etmişdi; «Müştəri üzrə» rejim FE#69 re-QA-da (FE#94) aşkarlanıb və eyni standarta uyğunlaşdırılıb | T-15, AC-14 |
| 24 | `src/features/products/components/ProductsTable.tsx:294` | *(xəta vəziyyəti göstərilmirdi)* | `Mallar yüklənmədi` | Səhifə-spesifik xəta mətni (Mallar) — `DataTable`-ın ümumi mətni (sətir 18) əvəzinə real `isError`/`onRetry` ilə göstərilir | AC-1, FE#87 (Addım 7.1) |
| 25 | `src/features/customers/components/CustomersTable.tsx:126` | *(xəta vəziyyəti göstərilmirdi)* | `Müştərilər yüklənmədi` | Səhifə-spesifik xəta mətni (Müştərilər) | AC-1, FE#87 (Addım 7.1) |
| 26 | `src/features/customers/components/OpenDebtsTable.tsx:172` | *(xəta vəziyyəti göstərilmirdi)* | `Borclar yüklənmədi` | Səhifə-spesifik xəta mətni (Nisyə Borclar) | AC-1, FE#87 (Addım 7.1) |
| 27 | `src/features/suppliers/components/SuppliersTable.tsx:180` | *(xəta vəziyyəti göstərilmirdi)* | `Təchizatçılar yüklənmədi` | Səhifə-spesifik xəta mətni (Təchizatçılar) | AC-1, FE#87 (Addım 7.1) |
| 28 | `src/features/sales/components/SalesJournal.tsx:621` | *(xəta vəziyyəti göstərilmirdi)* | `Satış jurnalı yüklənmədi` | Səhifə-spesifik xəta mətni (Satış jurnalı) | AC-1, FE#87 (Addım 7.1) |
| 29 | `src/routes/_app.xercler.tsx:171` | `error.message` (xam brauzer mətni, məs. `Failed to fetch`) | `Xərclər yüklənmədi` | Xam şəbəkə xətası istifadəçiyə mənasız görünürdü; digər səhifələrlə (Mallar/Müştərilər/Təchizatçılar/Satış) eyni sabit mətn naxışına uyğunlaşdırıldı | AC-1, FE#87 (Addım 7.2) |
| 30 | `src/features/products/components/ProductFilters.tsx` — lokal axtarış placeholder-i | `Ad, kateqoriya, xüsusiyyət üzrə axtar...` | `Bu siyahıda axtar...` | Lokal cədvəl axtarışı qlobal axtarışla eyni terminologiyaya uyğunlaşdırılsın (`FilterBar` defolt mətni ilə üst-üstə düşsün) | T-15, AC-14 |
| 31 | `src/features/expenses/components/ExpenseFilters.tsx` — lokal axtarış placeholder-i | `Xərc adı və ya qeyd üzrə axtar...` | `Bu siyahıda axtar...` | Eyni səbəb | T-15, AC-14 |
| 32 | `src/features/sales/components/SalesJournal.tsx` — lokal axtarış placeholder-i | `Axtar...` | `Bu siyahıda axtar...` | Eyni səbəb | T-15, AC-14 |

---

## 2. Dəyişməyən (qəsdən saxlanılan) mətnlər

| Mətn | Səbəb |
|---|---|
| `Kassada olmalı` (sidebar) və `Kassada olmalı məbləğ` (Gün Sonu) | `E-01`/`E-02` Mərhələ 1 işidir — FE#69 təməl taskının əhatəsində deyil |
| `Filterlər` / `Filterləri təmizlə` | `E-08` (F-52) sonrakı mərhələdə |
| `Tarix seç` | `E-19` sonrakı mərhələdə |
| `Detal` | `E-20` sonrakı mərhələdə |
| `Gözlənilən` / `Faktiki` / `Fərq` | `E-22` sonrakı mərhələdə (yalnız RƏNG semantikası FE#69-da düzəldildi) |
| `Bu funksiya backend ilə əlavə olunacaq` | `E-21` sonrakı mərhələdə |
| Bütün API sahə adları, tip adları, kod identifikatorları | Backend kontraktı dəyişmir |

---

## 3. Söz seçimi qaydaları (FE#69-dan sonra)

| Anlayış | Qəbul edilmiş forma |
|---|---|
| Qlobal axtarış | «Bütün sistemdə mal axtar...» |
| Səhifədaxili axtarış | «Bu siyahıda axtar...» (əhatə mötərizədə: «(ad və ya telefon)») |
| Xəta + təkrar cəhd | «… yüklənmədi» + «Yenidən» |
| Boş nəticə | «… yoxdur» + nə etməli olduğunu deyən ipucu |
| Yalnız-ikon düymə | Həmişə felin məsdər/əmr forması: «Bağla», «Sil», «Axtarışı təmizlə» |
| Kassa fərqi (müsbət) | «Kassa uyğun gəlmir — … artıq çıxdı, yoxlayın» |
| İkinci dərəcəli əməliyyat menyusu | «Digər əməliyyatlar» |
