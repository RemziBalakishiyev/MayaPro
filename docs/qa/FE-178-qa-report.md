# QA Report — FE#178: lokal axtarış terminologiyası — qalan "Mal axtar" formaları

**Tarix:** 2026-08-07
**QA Agent:** qa-tester
**Test edilən PR:** https://github.com/RemziBalakishiyev/MayaPro/pull/180 (branch `task/FE-178-search-terminology`, base `main`)
**Əlaqəli task:** https://github.com/RemziBalakishiyev/MayaPro/issues/178 (FE#81 QA dövründə aşkarlanan BUG-2-nin düzəlişi, bax `docs/qa/FE-81-qa-report.md` §5 BUG-2)
**Mühit:** lokal (Windows), `npx vitest run` + `npm run build`

---

## Xülasə

| Göstərici | Dəyər |
|---|---|
| Ümumi AC sayı | 5 |
| ✅ Pass | 5 |
| ❌ Fail | 0 |
| ⚠️ Blocked | 0 |
| Yaradılan bug sayı | 0 |
| **Yekun qərar** | **PASS → Done** |

---

## Acceptance Criteria nəticələri

| AC | Təsvir | Nəticə | Qeyd |
|---|---|---|---|
| AC-1 | 3 girişin placeholder/`aria-label` mətnləri `ui-terminology.md`-yə uyğundur | ✅ | `ExpenseForm.tsx:357` `aria-label="Bu siyahıda axtar"` (§3 sətir 5 formatı), `:360` `placeholder="Bu siyahıda axtar..."` (§3 sətir 4 formatı); `LabelPrintModal.tsx:153` `placeholder="Bu siyahıda axtar... (ad və ya barkod)"` — §3-ün "Bu siyahıda axtar... (əhatə mötərizədə)" qaydasına dəqiq uyğundur (müq. et sətir 6/7/23: `Bu siyahıda axtar... (ad və ya telefon)`). `grep -rn "Mal axtar" src/` → yalnız `LabelPrintModal.tsx:55` JSDoc şərhi qalıb (UI mətni deyil, kod-şərhdir) → xam qalıq **0**. |
| AC-2 | Lokal axtarış vizual olaraq qlobal axtarışdan fərqlənir | ✅ | `GlobalProductSearch.tsx:52`: `rounded-full`, `bg-stone-100`, üst zolaqda (topbar). `ExpenseForm`-da istifadə olunan paylaşılan `Input` (`components/ui/Input.tsx:12`): `rounded-control`, `bg-white`, kart daxilində. `LabelPrintModal.tsx:160`: `rounded-xl`, `bg-white`. Hər iki lokal giriş vizual olaraq (forma/kart daxilində, düzbucaqlı, ağ fon) qlobaldan (yumru, boz fon, topbar) aydın fərqlənir — bu PR bu stilə TOXUNMAYIB, yalnız mətn dəyişib, amma stil əvvəldən də fərqli olduğu üçün AC ödənilir. |
| AC-3 | Axtarış məntiqi/filtr/debounce dəyişməyib | ✅ | `git diff origin/main..task/FE-178-search-terminology -- src/` yalnız 3 sətirlik mətn dəyişikliyi göstərir (2 fayl, +3/−3): `aria-label`, `placeholder` × 2. `onChange`, `value`, state (`productSearch`/`setProductSearch`, `query`/`setQuery`), filtr funksiyaları (`filteredProducts`, `filtered`) və `onKeyDown` məntiqi baytbabayt EYNİ qalıb — diff-də bu sətirlərə toxunulmayıb. |
| AC-4 | `docs/final-ui-ux-regression-report.md`-də AC5 sətri faktiki vəziyyətə yenilənib | ✅ | Sətir 40 (YOXLA #5) indi `**KEÇDİ (FE#178-də düzəldildi — bax qeyd)**` və qısa izahla köhnə səhvi ("FE#81-də səhvən KEÇDİ yazılmışdı") + düzəlişin təfərrüatını (fayl/sətir, yeni mətn) verir. Əlavə olaraq §15 (sətir 426-433) ayrıca bölmə kimi bu sənədin PR#176 (hələ merge olunmamış) üzərində yaradıldığını və merge ardıcıllığı riskini sənədləşdirir. |
| AC-5 | `npx vitest run` reqressiyasız, `npm run build` 0 xəta | ✅ | Aşağıya bax. |

---

## Test case nəticələri

| # | Ssenari | Nəticə | Faktiki davranış / Qeyd |
|---|---|---|---|
| TC1 | `ExpenseForm.tsx` mal seçici axtarış `aria-label` yoxlanışı | ✅ | `"Bu siyahıda axtar"` — `ui-terminology.md` §3 sətir 5 ilə uyğundur |
| TC2 | `ExpenseForm.tsx` mal seçici axtarış `placeholder` yoxlanışı | ✅ | `"Bu siyahıda axtar..."` — §3 sətir 4 ilə uyğundur |
| TC3 | `LabelPrintModal.tsx` (`ProductPicker`) axtarış `placeholder` yoxlanışı | ✅ | `"Bu siyahıda axtar... (ad və ya barkod)"` — §3-ün "əhatə mötərizədə" qaydasına uyğundur, əhatə mətni (`ad və ya barkod`) itməyib |
| TC4 | Kod bazasında qalan xam "Mal axtar" izi | ✅ | `grep -rn "Mal axtar" src/` → yalnız `LabelPrintModal.tsx:55` JSDoc şərhi (UI-a çıxmır) |
| TC5 | Diff əhatəsi — yalnız mətn dəyişib, funksional kod toxunulmayıb | ✅ | `git diff origin/main..HEAD -- src/` = 2 fayl, 6 sətir (3 əlavə/3 silmə), hamısı `aria-label`/`placeholder` sətirləridir |
| TC6 | Vizual fərqləndirmə — lokal vs qlobal stil siniflər | ✅ | Lokal: `rounded-control`/`rounded-xl` + `bg-white`; Qlobal: `rounded-full` + `bg-stone-100`. Fərq PR-dan əvvəl də mövcud idi, bu PR-da qorunub |
| TC7 | `docs/final-ui-ux-regression-report.md` AC5 sətrinin yenilənməsi | ✅ | Sətir 40 yeni statusu və izahı əks etdirir |
| TC8 | Bilinən risk — sənədin öz mənbəyi (PR#176) hələ merge olunmayıb | ⚠️ qeyd (bug DEYİL) | Aşağıdakı "Qeydlər" bölümünə bax — task təsvirinə görə bu FE#178-in əhatəsindən kənardır, Senior Frontend artıq §15-də sənədləşdirib |
| TC9 | `npx vitest run` | ✅ | 47 fayl / 354 test, 0 fail |
| TC10 | `npm run build` (`tsc && vite build`) | ✅ | 0 TypeScript xətası, 0 build xətası (yalnız mövcud/əlaqəsiz chunk-size xəbərdarlığı) |

---

## Tapılan buglar

Yoxdur. Bütün AC-lər pass oldu, funksional reqressiya tapılmadı.

---

## İcra olunan test əmrləri

```bash
git -C frontend status
git -C frontend fetch origin
git -C frontend diff origin/main..task/FE-178-search-terminology --stat
git -C frontend diff origin/main..task/FE-178-search-terminology -- src/
gh pr list --state open --repo RemziBalakishiyev/MayaPro

npx vitest run
# → Test Files  47 passed (47)
# → Tests  354 passed (354)

npm run build
# → tsc: 0 xəta
# → vite build: ✓ built in 6.08s (yalnız chunk-size xəbərdarlığı, əlaqəsiz)
```

---

## Qeydlər (bug DEYİL, sənədləşdirmə üçün)

- `docs/final-ui-ux-regression-report.md` PR #180-də **yeni fayl** kimi görünür, çünki əsl
  mənbəyi (FE#81, PR #176, branch `task/FE81-final-ui-ux-regression`) hələ `main`-ə merge
  olunmayıb. FE#178 branch-i `origin/main`-dən açıldığı üçün bu fayl orada mövcud olmayıb,
  developer PR#176-nın versiyasını əsas götürüb və üzərinə yalnız AC5 sətrini düzəldib. Bu,
  FE#178-in test dairəsinə aid deyil — Senior Frontend bu riski artıq faylın öz içində
  (§15, sətir 426-433) sənədləşdirib. Orchestrator səviyyəsində diqqət tələb edən yeganə
  məqam: **PR#176 və PR#180 merge ardıcıllığı** — PR#176 əvvəl merge olunmalı, sonra PR#180
  (və ya PR#180 rebase/merge zamanı `docs/final-ui-ux-regression-report.md` üzərində konflikt
  yoxlanmalıdır ki, PR#176-nın gətirdiyi digər 14 sətirlik dəyişiklik itməsin).
- `gh pr list --state open` yoxlaması: hazırda yalnız PR#180 (bu task) və PR#176 (FE#81, əlaqəli
  amma ayrı task) açıqdır. PR#180-in özünə aid sahibsiz başqa açıq PR yoxdur.

---

## Tövsiyələr

- Bu PR (#180) mündəricə baxımından təmizdir və `main`-ə merge üçün hazırdır.
- Merge zamanı **PR#176-nın əvvəl (və ya konfliktsiz) merge olunmasına** diqqət edilsin ki,
  `docs/final-ui-ux-regression-report.md` faylının FE#81-ə aid digər hissələri itməsin (orchestrator
  qeydinə bax, "Qeydlər" bölməsi).
- Əlavə funksional/regresiya riski yoxdur; yeni test yazılmasına ehtiyac görünmür (mətn-yalnız
  dəyişiklik, mövcud 354 test dəyişmədən keçir).
