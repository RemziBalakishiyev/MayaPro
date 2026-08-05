# UI Terminologiyası — köhnə → yeni (FE#85)

Bu sənəd hazırda YALNIZ FE#85 (bax: https://github.com/RemziBalakishiyev/MayaPro/issues/85)
çərçivəsində edilən mətn dəyişikliklərini qeydə alır. Cədvəldən kənar mətn
dəyişikliyi kodda YOXDUR.

> **Qeyd:** Bu faylın daha geniş versiyası (FE#69 çərçivəsindəki bütün
> UI-mətn dəyişiklikləri — topbar `GlobalProductSearch`, `Toast`/`Modal`/
> `Drawer` aria-label-ləri, `DataTable` xəta vəziyyəti və s.) `task/FE#69-ui-primitives`
> branşında (PR #83) hazırlanır. FE#69 `main`-ə merge olunanda həmin
> dəyişikliklər öz tam siyahısı ilə bu fayla əlavə olunacaq; aşağıdakı 3
> sətir onun üzərinə əlavə ediləcək, təkrarlanmayacaq (bax: FE#89).

İstinad sütunu:
- `T-15` — FE#69 task mətnindəki 15-ci dizayn tələbi (qlobal/lokal axtarış
  mətnləri task tərəfindən birbaşa təyin olunub);
- `AC-xx` — PM-in qəbul meyarı (FE#69/FE#85 üçün).

Dil qaydası: bütün mətnlər **Azərbaycanca**dır; ingiliscə qalıq mətn yoxdur
(kod identifikatorları istisna).

---

## 1. Dəyişən mətnlər

| # | Yer (fayl) | Köhnə | Yeni | Səbəb | İstinad |
|---|---|---|---|---|---|
| 1 | `src/features/products/components/ProductFilters.tsx` — lokal axtarış placeholder-i | `Ad, kateqoriya, xüsusiyyət üzrə axtar...` | `Bu siyahıda axtar...` | Lokal cədvəl axtarışı qlobal axtarışla eyni terminologiyaya uyğunlaşdırılsın (`FilterBar` defolt mətni ilə üst-üstə düşsün) | T-15, AC-14 |
| 2 | `src/features/expenses/components/ExpenseFilters.tsx` — lokal axtarış placeholder-i | `Xərc adı və ya qeyd üzrə axtar...` | `Bu siyahıda axtar...` | Eyni səbəb | T-15, AC-14 |
| 3 | `src/features/sales/components/SalesJournal.tsx` — lokal axtarış placeholder-i | `Axtar...` | `Bu siyahıda axtar...` | Eyni səbəb | T-15, AC-14 |
