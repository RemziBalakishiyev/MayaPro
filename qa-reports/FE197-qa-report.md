# QA Report — FE#197: `weeklySeries` testini real tarixdən asılı olmaqdan çıxar (time-bomb fix)

**Tarix:** 2026-08-23
**QA Agent:** qa-tester
**Test edilən PR:** https://github.com/RemziBalakishiyev/MayaPro/pull/198 (branch `task/FE197-fix-weekly-series-test`, base `main`)
**Commit:** `51f3c10` — `fix(reports): weeklySeries testini real tarixdən asili olmaqdan cixar`
**Dəyişən fayllar (1):** `src/features/reports/lib.test.ts` (+8/-1 — `git diff origin/main task/FE197-fix-weekly-series-test --stat` və `gh pr view 198` metadata-sı ilə təsdiqləndi)
**Əlaqəli issue:** #197 — `[BUG][FE#189] weeklySeries testi real tarixe baglidir - cari tarixde ugursuz olur`

---

## Kontekst / Kök səbəb (issue-dan)

`src/features/reports/lib.test.ts` içindəki `weeklySeries — FE#78 bənd #6` describe blokunda "qazanc dəyəri dövrün satışlarından hesablanır..." testi sabit `createdAt: "2026-08-01T10:00:00.000Z"` tarixli satışlar istifadə edirdi. `weeklySeries(sales, 1)` daxilindəki `daysAgoISO(...)` funksiyası REAL `new Date()` əsasında "son 7 gün" pəncərəsini hesablayır. Cari tarix (2026-08-23) sabit `2026-08-01`-dən 22 gün uzaqda olduğundan, satış artıq "son 1 həftə" pəncərəsinə düşmür → `qazanc` gözlənilən 80 əvəzinə 0 qayıdırdı. FE#189 QA sessiyasında aşkarlanıb, FE#189-un öz kodu/testi ilə əlaqəsi yoxdur (fayl FE#78-dən (commit 4d6c39a) bəri dəyişməmişdi).

## Fix-in təsviri

Commit `51f3c10` yalnız `src/features/reports/lib.test.ts`-də bir testi dəyişir:

```diff
-    const sales = [sale({ profit: 50 }), sale({ profit: 30 })];
+    const today = new Date().toISOString().slice(0, 10);
+    const sales = [
+      sale({ profit: 50, createdAt: `${today}T10:00:00.000Z` }),
+      sale({ profit: 30, createdAt: `${today}T10:00:00.000Z` }),
+    ];
```

`createdAt` artıq sabit keçmiş tarix deyil, test icra anındakı **real "bugün"ə** (`new Date().toISOString().slice(0, 10)`) nisbətən dinamik hesablanır. Bu, "bugün" həmişə özünün "son 1 həftə" pəncərəsi daxilində olduğu üçün test hansı tarixdə icra olunursa olunsun keçəcək — sabit gələcək tarix deyil, dolayısı ilə yeni bir "time-bomb" yaratmır. Bu pattern faylın özündəki mövcud `dailySeries` testlərində (sətir 86, 100) artıq istifadə olunan yanaşma ilə eynidir — yeni ad-hoc həll deyil, mövcud konvensiyaya uyğunluqdur.

---

## Metodologiya

1. `gh issue view 197 --repo RemziBalakishiyev/MayaPro` ilə tam issue mətni və AC oxundu.
2. Branch `task/FE197-fix-weekly-series-test` (artıq checkout olunmuş) üzərində `git show 51f3c10` ilə tam diff şəxsən oxundu.
3. `src/features/reports/lib.test.ts` faylının tam məzmunu oxundu — dəyişikliyin `dailySeries` testlərindəki mövcud dinamik-tarix pattern-i ilə uyğunluğu təsdiqləndi (hardcoded başqa tarix DEYİL, `vi.setSystemTime` alternativi əvəzinə "real bugün"ə nisbətən hesablama seçilib, hər ikisi qəbul edilən həlldir).
4. `npx vitest run src/features/reports/lib.test.ts` icra edildi.
5. `npx vitest run` (tam suite) icra edildi.
6. `git diff origin/main task/FE197-fix-weekly-series-test --stat` ilə diff əhatəsi yoxlanıldı.
7. `gh pr view 198` ilə PR metadata-sı (additions/deletions/files, state, CI statusu) çarpaz yoxlanıldı.

---

## Acceptance Criteria nəticələri

| AC | Təsvir | Nəticə | Sübut |
|---|---|---|---|
| AC-1 | "qazanc dəyəri dövrün satışlarından hesablanır..." testi cari tarixdən asılı olmadan həmişə keçir | ✅ Pass | `npx vitest run src/features/reports/lib.test.ts` → 10/10 keçdi, əvvəllər uğursuz olan test (sətir 55-də AssertionError verən) indi yaşıldır. Test bugünkü real tarixə (2026-08-23, orijinal sabit tarixdən 22 gün sonra) qarşı icra edildi və PASS oldu — məhz bu ssenari FE#189-da uğursuz olurdu. |
| AC-2 | Həll `vi.setSystemTime`/`vi.useFakeTimers()` VƏ YA satışın `createdAt`-i test icra anına nisbətən dinamik hesablanması ilə edilib (yeni sabit tarix DEYİL) | ✅ Pass | Diff oxunuşu: `const today = new Date().toISOString().slice(0, 10)` — real, sistemin cari vaxtına əsaslanan dinamik hesablama. Heç bir yeni hardcoded tarix əlavə olunmayıb. Mövcud `dailySeries` testlərindəki (sətir 86, 100) eyni pattern ilə tutarlıdır. |
| AC-3 | Fix yalnız bu testə aiddir, əlaqəsiz dəyişiklik yoxdur | ✅ Pass | `git diff origin/main task/FE197-fix-weekly-series-test --stat` → `src/features/reports/lib.test.ts \| 9 ++++++++- / 1 file changed, 8 insertions(+), 1 deletion(-)`. `gh pr view 198 --json files` → yalnız bu 1 fayl, `additions:8, deletions:1` — tam üst-üstə düşür. |
| AC-4 | Regressiya yoxdur — qalan bütün testlər (fayl daxilində və tam suite) keçir | ✅ Pass | Fayl daxili: 10/10. Tam suite: 413/413 (aşağı bax). |

---

## İcra olunan test əmrləri (şəxsən, bu sessiyada)

```
npx vitest run src/features/reports/lib.test.ts
→ Test Files  1 passed (1)
  Tests  10 passed (10)

npx vitest run
→ Test Files  57 passed (57)
  Tests  413 passed (413)
  Duration  27.23s

git diff origin/main task/FE197-fix-weekly-series-test --stat
→ src/features/reports/lib.test.ts | 9 ++++++++-
  1 file changed, 8 insertions(+), 1 deletion(-)

gh pr view 198 --json state,mergeable,statusCheckRollup,additions,deletions,files
→ state: OPEN, mergeable: MERGEABLE, additions: 8, deletions: 1,
  files: [{"path":"src/features/reports/lib.test.ts","changeType":"MODIFIED"}]
```

---

## CI qeydi (bloklayıcı deyil)

PR #198-in "Build and Deploy Job" (Azure Static Web Apps CI/CD) check-i **FAILURE** statusundadır. Bu, kodla/testlə əlaqəli deyil — Azure Static Web Apps-in "maximum number of staging environments" kvota məhdudiyyətinə görə baş verən infra problemidir (mövcud açıq PR-ların sayına görə staging mühiti yaradıla bilmir). Kod dəyişikliyi ilə heç bir əlaqəsi yoxdur, bu QA sessiyasının FAIL qərarına səbəb olmur.

---

## Tapılan problemlər

**Heç bir bug tapılmadı.** Fix issue-da təsvir olunan kök səbəbi düzgün aradan qaldırır, mövcud kod konvensiyasına (`dailySeries` testlərindəki dinamik-tarix pattern) uyğundur və yeni bir "time-bomb" yaratmır (sabit gələcək tarix əvəzinə, hər zaman "bugün"ə nisbətən doğru olan hesablama istifadə olunur).

---

## Yekun

**Nəticə: PASS.** 4 AC-nin hamısı keçir. `src/features/reports/lib.test.ts`: 10/10, tam suite: 413/413. Diff yalnız 1 fayla (`src/features/reports/lib.test.ts`, +8/-1) məhduddur, əlaqəsiz dəyişiklik yoxdur. Fix `vi.setSystemTime` əvəzinə real-vaxta-nisbətən dinamik `createdAt` yanaşmasını seçib — bu da qəbul edilən, artıq faylda mövcud olan pattern-dir və testi genuinely tarixdən asılı olmayan hala gətirir.

**Tövsiyə:** Qızıl qayda #5-ə görə (Merge qapısı) FE#197 statusu yalnız PR #198 `MERGED` olduqdan sonra **Done**-a keçirilə bilər. PR hazırda `OPEN` (mergeable: MERGEABLE, yalnız Azure infra CI check-i uğursuzdur — kodla əlaqəsi yoxdur) — merge gözlənilir.
