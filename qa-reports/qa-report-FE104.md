# QA Report — FE#104 (Part A): FE#69 changelog-i post-QA commit-lərlə sinxronlaşdır

**Tarix:** 2026-08-06
**QA Agent:** qa-tester
**Test edilən PR:** https://github.com/RemziBalakishiyev/MayaPro/pull/109 (branch `task/FE#104-docs-sync`, base `task/FE#69-ui-primitives`)
**Commit:** `6603c24` — `docs(FE#104): FE#69 changelog-i post-QA commit-lerle sinxronlasdir`
**Dəyişən fayllar (1):** `docs/ui-ux-global-refactor-changelog.md` (73 additions, 3 deletions — GitHub PR metadata ilə təsdiqləndi)
**Kod dəyişikliyi:** Yoxdur — bu tapşırıq yalnız sənəd (docs) yeniləməsidir. Backend/frontend kodu heç toxunulmayıb.

---

## Scope qeydi

Bu tapşırıq (FE#104) iki hissəyə bölünmüşdür:

- **Part A (bu PR-ın əhatəsi, test edilib):** `docs/ui-ux-global-refactor-changelog.md`-a FE#69 branch-ında QA-dan sonra əlavə olunan 3 commit-in (`f120226`, `c772418`, `204ab55` — FE#87/FE#94) sənədləşdirilməsi.
- **Part B / AC-5 (bloklanıb, bu QA sessiyasında qiymətləndirilməyib):** `docs/ui-terminology.md`-ın yenilənməsi — FE#96-dakı həll olunmamış merge-conflict riskinə görə **qəsdən** bu PR-dan kənarda saxlanılıb. Bu, tapşırığın FAIL olması demək deyil; Part B ayrıca izlənilir və bu report-da qiymətləndirilməyib.

---

## Metodologiya

Docs-only dəyişiklik olduğu üçün test aşağıdakı üsullarla aparıldı:

1. `git -C frontend fetch origin "task/FE#104-docs-sync"` + checkout, real PR commit-i üzərində iş.
2. `git diff <PR-in parent commiti>..<PR commiti> --stat` / `--name-only` ilə PR-ın **yalnız** `docs/ui-ux-global-refactor-changelog.md`-a toxunduğunu təsdiqləndi (kod faylı yoxdur, `docs/ui-terminology.md` yoxdur).
3. `grep -n` ilə hər 3 commit hash-inin sənəddə olduğunu və düzgün bölmədə göründüyünü yoxlandı.
4. Sənəddəki hər commit-in izahının (nə dəyişdi, toxunulan səhifələr) **faktiki** `git show <hash> --stat` və commit mesajı ilə üst-üstə düşdüyü yoxlandı (sənəddə yazılan iddia ilə real kod dəyişikliyi arasında uyğunsuzluq axtarıldı).
5. `gh pr view 109/92/95` ilə PR metadata-sı (additions/deletions, fayl siyahısı, referans edilən PR-ların merge statusu) təsdiqləndi.
6. "Yekun" bölməsindəki "Köçürülən səhifələr" siyahısının əvvəl/sonra fərqi `git diff` ilə sətir-sətir müqayisə edildi.

---

## Acceptance Criteria nəticələri (Part A)

| AC | Təsvir | Nəticə | Sübut / qeyd |
|---|---|---|---|
| **AC-1** | `f120226` üçün ayrıca bölmə — `DataTable.isError`/`InlineError`/`onRetry` qoşulması (FE#87), toxunulan səhifələr: Mallar, Müştərilər, Nisyə Borclar, Təchizatçılar, Satış jurnalı, Xərclər | ✅ Pass | Sənəddə **7.1** bölməsi (sətir 177-200): `### 7.1 — \`f120226\` — ...`. "Toxunulan səhifələr: Mallar, Müştərilər, Nisyə Borclar (hər iki rejim), Təchizatçılar, Satış jurnalı, Xərclər." — tələb olunan 6 səhifənin hamısı var. `git show f120226 --stat` ilə çarpaz yoxlanıldı: faktiki toxunulan fayllar `ProductsTable.tsx`, `CustomersTable.tsx`, `OpenDebtsTable.tsx`, `OpenDebtsView.tsx`, `SuppliersTable.tsx`, `SalesJournal.tsx`, `_app.borclar.tsx`, `_app.mallar.tsx`, `_app.musteriler.tsx`, `_app.tedarukculer.tsx`, `_app.xercler.tsx` — sənəddəki səhifə siyahısı ilə **tam uyğundur**. |
| **AC-2** | `c772418` üçün ayrıca bölmə — `xercler.tsx` InlineError mesaj uyğunlaşdırılması (FE#87), toxunulan səhifə: Xərclər | ✅ Pass | Sənəddə **7.2** bölməsi (sətir 202-212). "Toxunulan səhifələr: Xərclər." `git show c772418 --stat` → yalnız `src/routes/_app.xercler.tsx` dəyişib (7 sətir) — sənədlə tam uyğundur. |
| **AC-3** | `204ab55` üçün ayrıca bölmə — Nisyə Borclar "Müştəri üzrə" rejiminin lokal axtarış placeholder-i (FE#94), toxunulan səhifə: Nisyə Borclar | ✅ Pass | Sənəddə **7.3** bölməsi (sətir 214-228). "Toxunulan səhifələr: Nisyə Borclar (\"müştəri\" rejimi)." `git show 204ab55 --stat` → `src/routes/_app.borclar.tsx` + `docs/ui-terminology.md` (bu commit əvvəllər, FE#104-dən **kənar**, artıq mövcud idi — bax aşağıdakı qeyd) dəyişib; sənəddəki səhifə iddiası (Nisyə Borclar) düzgündür. |
| **AC-4** | "Yekun" bölməsinin "Köçürülən səhifələr" siyahısına Təchizatçılar və Xərclər əlavə olunub, əvvəlki 6 giriş (Mallar, Müştərilər, Nisyə Borclar, Gün Sonu, Login, Satış) silinməyib/qırılmayıb | ✅ Pass | Diff: köhnə sətir — "Mallar · Müştərilər · Nisyə Borclar · Gün Sonu · Login · Satış (ödəniş təsdiqi)." Yeni sətir — "Mallar · Müştərilər · Nisyə Borclar · Təchizatçılar · Xərclər · Satış jurnalı · Gün Sonu · Login · Satış (ödəniş təsdiqi)." Bütün 6 orijinal giriş **qorunub**, Təchizatçılar + Xərclər əlavə olunub. Əlavə olaraq "Satış jurnalı" da əlavə edilib (AC-4-də tələb olunmayıb, amma f120226 faktiki `SalesJournal.tsx`-ə toxunduğu üçün əsaslıdır — bax QEYD-1, bug sayılmır). |

---

## Test Case nəticələri

| TC | Ssenari | Nəticə | Sübut |
|---|---|---|---|
| **TC-1** | `grep -n "f120226" docs/ui-ux-global-refactor-changelog.md` — sətir tapılmalı; bölmə Mallar/Müştərilər/Nisyə Borclar/Təchizatçılar/Satış jurnalı/Xərclər-i qeyd etməli | ✅ Pass | 2 uyğunluq tapıldı: sətir 24 (üst xülasə cədvəli) və sətir 177 (7.1 başlığı). Bölmə (sətir 197-198) bütün 6 səhifəni sadalayır. |
| **TC-2** | `grep -n "c772418"` — sətir tapılmalı; bölmə Xərclər-i qeyd etməli | ✅ Pass | 2 uyğunluq: sətir 25, sətir 202. Bölmə (sətir 212) "Xərclər" qeyd edir. |
| **TC-3** | `grep -n "204ab55"` — sətir tapılmalı; bölmə Nisyə Borclar-ı qeyd etməli | ✅ Pass | 2 uyğunluq: sətir 26, sətir 214. Bölmə (sətir 226) "Nisyə Borclar (\"müştəri\" rejimi)" qeyd edir. |
| **TC-4** | "Yekun"/"Köçürülən səhifələr" siyahısını əvvəl/sonra diff et — Təchizatçılar+Xərclər əlavə, orijinal 6 silinməyib | ✅ Pass | `git diff 0ee9197..6603c24` (sətir 246-248) — yalnız əlavə, heç bir orijinal giriş silinməyib/dəyişməyib. |
| **TC-5** | Commit hash-ləri tam düzgündür (f120226, c772418, 204ab55), kəsilməyib/səhv deyil | ✅ Pass | `git show <hash>` ilə tam hash-lər yoxlanıldı: `f1202262295cc60560ee187a6efaad537dc41c12`, `c77241860eaa34446a173efbf60cd218134d21ce`, `204ab55308599a63e86c1317a898049bc1de8a13` — hər üçünün 7-simvollu prefiksi sənəddəki yazılışla **tam uyğundur** və mövcud sənəd üslubu (digər commit-lər də 7 simvol) ilə tutarlıdır. Əlavə referanslar da yoxlanıldı: `b591e45` (QA report commit) → `b591e45104692e36aeebffc0b4b25fbab4ee6eee` ✔ düzgün; PR #92/#95 referansları `gh pr view` ilə təsdiqləndi — hər ikisi `MERGED`, düzgün başlıq/branch. |

---

## Scope nəzarəti (əlavə sanity yoxlaması)

| Yoxlama | Nəticə | Sübut |
|---|---|---|
| PR yalnız `docs/ui-ux-global-refactor-changelog.md`-a toxunur | ✅ Pass | `git diff 0ee9197..6603c24 --stat` → `1 file changed, 73 insertions(+), 3 deletions(-)`. `gh pr view 109` metadata-sı: `additions:73, deletions:3`, `files:[{"path":"docs/ui-ux-global-refactor-changelog.md",...}]` — tam üst-üstə düşür. |
| `docs/ui-terminology.md` bu PR-da dəyişməyib | ✅ Pass | Fayl siyahısında yoxdur (`git diff --name-only` → yalnız changelog faylı). |
| Heç bir kod faylı (`.ts`/`.tsx`) dəyişməyib | ✅ Pass | Fayl siyahısında yalnız `.md` faylı var. |

---

## Tapılan problemlər

**Heç bir bug tapılmadı.** Sənəd dəyişikliyi AC-1…AC-4-ün hamısını tam və dəqiq təmin edir, bütün commit hash/referanslar faktiki tarixçə ilə üst-üstə düşür.

### QEYD-1 — [Məlumat] "Yekun" siyahısına AC-4-də tələb olunmayan "Satış jurnalı" da əlavə olunub

- **Severity:** Info (bug deyil)
- **Aidiyyatı:** AC-4
- **Təsvir:** AC-4 yalnız Təchizatçılar+Xərclər-in əlavə olunmasını tələb edir, lakin developer "Satış jurnalı"nı da əlavə edib. Bu, faktiki doğrudur — `f120226` commit-i `SalesJournal.tsx`-ə toxunub (7.1 bölməsində də qeyd olunub) və "Satış jurnalı" siyahıda "Satış (ödəniş təsdiqi)"-dən fərqli, ayrıca giriş kimi görünür (heç bir dublikasiya/ziddiyyət yoxdur). Sənədin daha dəqiq olması müsbətdir, tövsiyə edilmir düzəliş.

### QEYD-2 — [Məlumat] Part B (`docs/ui-terminology.md`) qiymətləndirilməyib

- FE#104-ün orijinal tələbindəki `docs/ui-terminology.md` yeniləməsi bu PR-a daxil deyil — FE#96-dakı merge-conflict riskinə görə qəsdən bloklanıb və ayrıca izlənilir. Bu QA sessiyası **yalnız Part A**-nı (bu PR-ın əhatəsini) qiymətləndirir; Part B üçün AC/TC bu report-da yoxdur və "blocked" statusu ilə kənarda saxlanılıb.

---

## Yekun

**Nəticə: PASS.** 4 AC-nin hamısı (AC-1…AC-4) tam keçir, 5 TC-nin hamısı (TC-1…TC-5) Pass. PR ciddi şəkildə scope-a sadiqdir — yalnız `docs/ui-ux-global-refactor-changelog.md` dəyişib, kod və `docs/ui-terminology.md` toxunulmayıb. Sənəddəki bütün faktiki iddialar (commit hash-lər, toxunulan səhifələr, PR referansları) real git tarixçəsi və GitHub metadata-sı ilə çarpaz yoxlanılıb və tam uyğun tapılıb.

**Tövsiyə:** FE#104 (Part A) → **Done**. Part B (`docs/ui-terminology.md`, FE#96 asılılığı) ayrıca izlənilməlidir, bu report-un əhatəsində deyil.
