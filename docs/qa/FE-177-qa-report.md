# QA Report — FE#177: Loader/Button loading propu düzəlişi

- **Task:** FE#177
- **Issue:** https://github.com/RemziBalakishiyev/MayaPro/issues/177
- **PR:** https://github.com/RemziBalakishiyev/MayaPro/pull/181 (branch: `task/FE177-loader-button-fix`)
- **Test edən commit:** `256fc7c` (fix(ui): FE#177 - Button loading propunu 4 qalıq düymədə tətbiq et)
- **QA tarixi:** 2026-08-07
- **Nəticə: PASS**

## Kontekst

4 paylaşılan `<Button>` istifadəsi əl ilə `icon={pending ? <Loader2/> : <Icon/>}` + əl ilə
`disabled={pending}` naxışı işlədirdi, `Button`-un daxili `loading` propu əvəzinə. Bu, bu 4
düymədə `aria-busy` atributunun olmamasına səbəb olurdu. Fix bu naxışı `Button`-un `loading`
propuna keçirir.

## AC üzrə nəticələr

| AC | Təsvir | Status | Qeyd |
|----|--------|--------|------|
| AC-1 | 4 düymənin hamısı `Button`-un `loading` propuna keçirilib | ✅ PASS | `QuickSaleScreen.tsx` (Qaimə çıxar), `SalesJournal.tsx` (PDF hesabat), `LabelPrintModal.tsx` (PDF hazırla), `SaleDetailDrawer.tsx` (Qaimə PDF) — hər 4-də əl ilə `icon={pending ? <Loader2/> : <Icon/>}` silinib, `loading={...}` əlavə olunub. |
| AC-2 | `aria-busy` bütün 4 halda mövcuddur | ✅ PASS | `src/components/ui/Button.tsx:75` — `aria-busy={loading || undefined}` mərkəzləşdirilmiş şəkildə tətbiq olunur, 4 çağırış nöqtəsi bundan avtomatik faydalanır. |
| AC-3 | Deaktivlik davranışı dəyişmir | ✅ PASS | `Button.tsx:74` — `disabled={disabled || loading}`. `LabelPrintModal.tsx`-də `pdfDisabled`-dan `submitting` çıxarılıb, əvəzinə `loading={submitting}` verilib → effektiv nəticə eynidir (`pdfDisabled || submitting`). Digər 3 fayl (`QuickSaleScreen`, `SaleDetailDrawer`, `SalesJournal`) əl ilə `disabled={pending}` silinib, `loading={pending}` ilə əvəzlənib → eyni effektiv nəticə. |
| AC-4 | `docs/final-ui-ux-regression-report.md` §3.3 və `docs/ui-ux-final-changelog.md:185` yenilənir | ⚠️ N/A — blocker asılılığı | Yoxlandı: hər iki fayl nə `origin/main`-də, nə də bu branch-də mövcud deyil (`git show origin/main:docs/final-ui-ux-regression-report.md` → "does not exist"). Bu sənədlər yalnız hələ merge olunmamış PR #176 (FE#81) daxilindədir. Bug DEYİL — asılılıq PR #176 merge olandan sonra ayrıca task kimi ediləcək. |
| AC-5 | `npx vitest run` reqressiyasız, `npm run build` 0 xəta | ✅ PASS | Aşağıya bax. |
| AC-6 | `package.json` toxunulmur, biznes məntiqi dəyişmir | ✅ PASS | `git diff origin/main -- package.json package-lock.json` → boş. Yalnız 4 target fayl dəyişib (`git diff origin/main --stat`), 9 sətir əlavə, 33 sətir silinib — sırf refactor, biznes məntiqi (mal/satış hesablamaları) toxunulmayıb. |

## Kod baxışı təfərrüatları

`src/components/ui/Button.tsx` (dəyişməyib, mövcud implementasiya yoxlanıldı):
```tsx
disabled={disabled || loading}
aria-busy={loading || undefined}
...
{loading ? <Loader2 ... className="animate-spin" aria-hidden /> : icon}
```

Diff (`git diff origin/main --stat`):
```
src/features/products/components/LabelPrintModal.tsx | 12 +++---------
src/features/sales/components/QuickSaleScreen.tsx    | 10 ++--------
src/features/sales/components/SaleDetailDrawer.tsx   | 10 ++--------
src/features/sales/components/SalesJournal.tsx       | 10 ++--------
4 files changed, 9 insertions(+), 33 deletions(-)
```

Qalıq `Loader2` importları hər 4 faylda yoxlanıldı — bu fayllardakı digər `Loader2` istifadələri
(məs. cədvəl daxili xam `<button>` elementləri, barkod yaratma düyməsi, siyahı sətri gözləmə
göstəriciləri) paylaşılan DS `<Button>` komponentindən İSTİFADƏ ETMİR və bu task-ın əhatə
dairəsindən kənardır — imports əsassız silinməyib, doğru qərar.

## Test / Build nəticələri

- `npx vitest run` → **47 fayl PASS / 354 test PASS, 0 fail** (baza ilə tam üst-üstə düşür, reqressiya yoxdur).
  - Duration: 19.35s
- `npm run build` (`tsc && vite build`) → **0 xəta**, uğurla tamamlandı.
  - Yalnız pre-existing "chunk size > 500kB" xəbərdarlığı (bu PR ilə əlaqəli deyil, blocker deyil).

## Digər yoxlamalar

- `gh pr view 181` → `mergeable: MERGEABLE`, `state: OPEN`, dəyişən fayllar dəqiq 4 target fayl ilə üst-üstə düşür.
- Senior-frontend review (PR #181 daxilində) müstəqil QA nəticəsi ilə tam üst-üstə düşür: APPROVED, AC-1/2/3/6 PASS, AC-4 N/A (asılılıq).

## Yekun

**PASS** — bütün tətbiq oluna bilən AC-lər (AC-1, AC-2, AC-3, AC-5, AC-6) keçir. AC-4 "N/A — blocker
asılılığı" statusundadır (PR #176 / FE#81 merge olunana qədər), bug hesab edilmir. Bug tapılmadı.

Tövsiyə: PR #181 merge edilə bilər, task "Done" statusuna keçirilə bilər.
