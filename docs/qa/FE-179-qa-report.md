# QA Report — FE#179 (§1 say cədvəli / §2 / §5 uzlaşdırılması)

**Task:** FE#179 (GitHub issue #179)
**PR:** https://github.com/RemziBalakishiyev/MayaPro/pull/182
**Branch:** `task/FE179-doc-count-fix`
**Commit:** `e514faf fix(docs): FE#179 - say cədvəlini §2/§5 ilə uzlaşdır`
**Skoup:** Yalnız sənəd yoxlanışı (`docs/final-ui-ux-regression-report.md`), kod dəyişikliyi edilməyib.
**Tarix:** 2026-08-07

## Nəticə: **PASS** — bütün 5 AC keçdi

---

## AC-1: §1 say cədvəli §2 və §5 ilə rəqəm-rəqəm uzlaşdırılıb

**Metod:** §2-dəki 16 sətrin (AC1–AC16) hər birinin statusu əl ilə çıxarıldı,
üstünə §1-də AC17–AC20 üçün istifadə olunan meta-mənbələr (§7/§9/§11/§14)
əlavə edildi, sonra §1 cədvəli ilə tutuşduruldu.

| Kateqoriya | §1-dəki siyahı | §2/§5-dən çıxarılan faktiki siyahı | Uyğunluq |
|---|---|---|---|
| KEÇDİ (10) | AC1,3,4,5,7,12,13,17,19,20 | Eyni 10 (§2 sətir 1,3,4,5,7,12,13 = "KEÇDİ"; AC17/19/20 meta-KEÇDİ) | ✅ |
| KƏSİLDİ (düzəldilib, 7 tapıntı / 6 AC) | AC2,8,9b,10(×2),14,15 | §3.1(AC2), §3.2(AC8+AC15=2 tapıntı), §3.3/§3.5/§3.6(AC10=2 tapıntı), §3.4(AC9b), §3.7(AC14) → 7 tapıntı, 6 fərqli AC | ✅ |
| KƏSİLDİ (düzəldilməyib, 7 tapıntı) | F-1(AC11), F-2(AC16), F-3(AC6), F-4, F-5, F-6, F-7 | §5 cədvəlində F-1…F-7 = düz 7 sətir | ✅ |
| İCRA EDİLƏ BİLMƏDİ | AC18 | §11-dəki TC24–TC29 + AC18 | ✅ |

**Cəm yoxlaması:** 10 + 6 + 3 + 1 = 20 AC (§1-in "20 AC-dən..." abzası ilə üst-üstə düşür).
§5-dəki tapıntı sayı (F-1…F-7 = 7) § 1-in "KƏSİLDİ (düzəldilməyib)" sətrindəki
"7 tapıntı" rəqəmi ilə **dəqiq üst-üstə düşür** (əvvəlki versiyada bu sətir
"4 tapıntı" yazırdı, halbuki §5-də 7 tapıntı var idi — bu, FE#179-un düzəltdiyi
əsas kəsr idi, bax `git diff` sübutu aşağıda).

**Sübut (diff, düzəlişdən əvvəl/sonra):**
```diff
-| **KEÇDİ** | 12 YOXLA bəndi · AC1, AC3, AC4, AC5, AC6, AC11(qismən), AC12, AC13, AC15, AC17, AC19, AC20 |
+| **KEÇDİ** | 10 YOXLA bəndi · AC1, AC3, AC4, AC5, AC7, AC12, AC13, AC17, AC19, AC20 |
 | **KƏSİLDİ (düzəldilib)** | 7 tapıntı — AC2, AC8, AC9b, AC10 (×2), AC14, AC15 |
-| **KƏSİLDİ (düzəldilməyib — davranış/backend tələb edir)** | 4 tapıntı — AC11 ... |
+| **KƏSİLDİ (düzəldilməyib — davranış/backend tələb edir)** | 7 tapıntı (§5 F-1…F-7) — F-1 AC11 ... F-4 ... F-5 ... F-6 ... F-7 ... |
-**AC-lər üzrə:** 20 AC-dən 14-ü tam keçdi, 5-i düzəlişdən sonra keçdi, 1-i (AC18) icra edilə bilmədi.
+**AC-lər üzrə:** 20 AC-dən 10-u tam keçdi, 6-sı ... düzəlişdən sonra keçdi (cəmi 7 tapıntı), 3-ü ... açıq qüsurla düzəlişsiz qalıb, 1-i (AC18) icra edilə bilmədi.
```
Köhnə versiyada AC6 və AC11 həm "KEÇDİ" siyahısında (sətir 1), həm də
§5-dəki tapıntılarda (AC6/F-3, AC11/F-1) görünürdü — bu, məhz AC-2-nin
pozulması idi və indi düzəldilib (aşağı bax). Həmçinin köhnə "14-ü tam keçdi"
ifadəsi "12 YOXLA bəndi" siyahısı ilə (12 element) uyğun deyildi — bu ədədi
uyğunsuzluq da aradan qalxıb.

**Status: ✅ PASS**

---

## AC-2: Heç bir AC iki kateqoriyada eyni anda sayılmır

Əl ilə AC1→AC20 üzrə tək-tək yoxlanıldı (yekun §1 versiyası üzərində):

| AC | Kateqoriya |
|---|---|
| 1 | KEÇDİ |
| 2 | KƏSİLDİ (düzəldilib) |
| 3 | KEÇDİ |
| 4 | KEÇDİ |
| 5 | KEÇDİ |
| 6 | KƏSİLDİ (düzəldilməyib) |
| 7 | KEÇDİ |
| 8 | KƏSİLDİ (düzəldilib) |
| 9 | KƏSİLDİ (düzəldilib) — AC9b konkret |
| 10 | KƏSİLDİ (düzəldilib) — 2 tapıntı |
| 11 | KƏSİLDİ (düzəldilməyib) |
| 12 | KEÇDİ |
| 13 | KEÇDİ |
| 14 | KƏSİLDİ (düzəldilib) |
| 15 | KƏSİLDİ (düzəldilib) |
| 16 | KƏSİLDİ (düzəldilməyib) |
| 17 | KEÇDİ |
| 18 | İCRA EDİLƏ BİLMƏDİ |
| 19 | KEÇDİ |
| 20 | KEÇDİ |

Hər AC yalnız **bir** sətirdə görünür, üst-üstə düşmə **yoxdur**. Köhnə
versiyada AC6 və AC11 ikiqat sayılırdı (həm KEÇDİ, həm "düzəldilməyib
tapıntı") — bu, indi silinib (AC6/AC11 yalnız "KƏSİLDİ (düzəldilməyib)"
qrupundadır, KEÇDİ siyahısından çıxarılıb).

**Status: ✅ PASS**

---

## AC-3: "İcra edilə bilmədi" (AC18/TC24-29) ayrıca sətirdə qalır

§1 cədvəlinin son sətri: `| **İCRA EDİLƏ BİLMƏDİ** | AC18 + 6 TC (TC24–TC29) — canlı backend əlçatmazdır |`
— bu sətir KEÇDİ və ya KƏSİLDİ sətirləri ilə birləşdirilməyib, ayrıca sətirdə
qalıb (dəyişməyib, FE179 bu sətrə toxunmayıb). §11-dəki TC24–TC29 cədvəli
də eyni "icra edilə bilmədi" statusunu təkrarlayır, "kəsildi" kimi
işarələnməyib (§11 başlığı: "Bu sessiyada... Aşağıdakılar «kəsildi»
SAYILMIR — icra edilə bilmədi").

**Status: ✅ PASS**

---

## AC-4: FE#178 mərgə olunub

```
$ git -C frontend log origin/main --oneline | grep -i 178
4664ca0 FE#178: lokal axtarış terminologiyası - qalan 'Mal axtar' formaları (#180)
```
Commit `origin/main` tarixçəsində mövcuddur → FE#178 `main`-ə merge olunub.

**Status: ✅ PASS**

---

## AC-5: Yalnız sənəd dəyişikliyi

```
$ git -C frontend diff origin/main --stat
 docs/final-ui-ux-regression-report.md | 13 +++++++++----
 1 file changed, 9 insertions(+), 4 deletions(-)
```
Yalnız `docs/final-ui-ux-regression-report.md` (bir `.md` faylı) dəyişib,
başqa heç bir fayl toxunulmayıb. Kod, konfiq, test faylı — heç biri diff-də
yoxdur.

**Status: ✅ PASS**

---

## Yekun

| AC | Status |
|---|---|
| AC-1 | ✅ PASS |
| AC-2 | ✅ PASS |
| AC-3 | ✅ PASS |
| AC-4 | ✅ PASS |
| AC-5 | ✅ PASS |

**5/5 AC keçdi. Bug tapılmadı.**

### Qeyd (informativ, bug DEYİL — AC əhatəsindən kənar)

Sənəddə (FE#81-dən miras qalan, FE179-un skoupuna aid olmayan) kiçik bir
üslub uyğunsuzluğu müşahidə olundu: §2-nin 1-ci sətri (AC1, AppShell) və
7-ci sətri (AC7, Düymə iyerarxiyası) "KEÇDİ" kimi yekunlaşdırılıb, lakin
§3.8 və §3.3-dəki commit izahatları həmin AC-lərlə əlaqəli tapıntı+düzəliş
təsvir edir (yekun vəziyyət "düzəlişdən sonra KEÇDİ" mənasındadır, §2/§1
"post-fix final status" prinsipi ilə uyğundur). Bu, §1↔§2↔§5 rəqəm
uzlaşmasına (AC-1..AC-5-in tələb etdiyi əhatəyə) təsir etmir, ona görə FAIL
səbəbi hesab edilmədi — sadəcə gələcək sənəd təmizliyi üçün qeyd olunur.
