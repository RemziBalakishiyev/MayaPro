# QA Report — FE#48: Filter panellərində toxunma hədəfləri ≥44px (bütün səhifələr)

**Tarix:** 2026-08-01
**QA Agent:** qa-tester
**Test edilən PR:** https://github.com/RemziBalakishiyev/MayaPro/pull/49 (branch `task/FE#48-touch-targets`, base `task/FE#41-xercler-filterbar` — qəsdən stacked PR, çünki `ExpenseFilters.tsx` yalnız FE#41 branch-ında mövcuddur, FE#41 hələ merge olunmayıb)
**Commitlər:** `3e753de` (developer — "fix: filter panellerinde toxunma hedeflerini >=44px-e qaldir (FE#48)"), `63df6ad` (senior-frontend review — "refactor(FE#48): drop ineffective h-11 override on Select/Input-based filter fields")
**Dəyişən fayllar (3, `task/FE#41-xercler-filterbar..task/FE#48-touch-targets` diff-i ilə təsdiqləndi — scope-dan kənar heç nə yoxdur):**
- `src/features/expenses/components/ExpenseFilters.tsx`
- `src/features/products/components/ProductFilters.tsx`
- `src/features/sales/components/SalesJournal.tsx`

`src/components/ui/Select.tsx`, `src/components/ui/Input.tsx`, `src/components/ui/FilterBar.tsx` — **toxunulmayıb** (diff boşdur), yəni düzəliş yalnız çağıran tərəfdəki `className` override-larının silinməsi/əlavəsi ilə həyata keçirilib, paylaşılan komponentlərin daxili davranışı (fokus halqası, aria) dəyişməyib.

---

## Test metodologiyası

Layihədə test runner (Vitest/Jest) və brauzer avtomatlaşdırması (Playwright/Cypress) yoxdur, QA rolunda yeni asılılıq quraşdırmaq icazəm yoxdur. Bu tapşırıq üçün ölçü (`height`) tələbi **pure CSS** məsələsi olduğundan (runtime state-dən asılı deyil), aşağıdakı üsul dəqiq və kifayətdir:

1. **Statik kod analizi** — hər 3 faylda `h-9`/`h-11`/`h-12` class-larının çağırış yerlərini oxudum, `Select.tsx`/`Input.tsx` baza class-larını (`h-12`) yoxladım.
2. **`npm run build`** (`tsc && vite build`) icra edildi, `dist/assets/index-*.css`-də faktiki compiled qaydalar çıxarıldı:
   `.h-9{height:2.25rem}` (36px) · `.h-11{height:2.75rem}` (44px) · `.h-12{height:3rem}` (48px)
   — bu, elementin sonda hansı hündürlüklə render olunacağını **deterministik** təsdiqləyir (Tailwind-in eyni-spesifiklikli class-larda son qaydanın üstün gəlməsi məsələsi CSS-də faktla yoxlanıldı, `cn()`-in sadə `clsx` (tailwind-merge deyil) olması nəzərə alınmaqla).
3. **`git diff task/FE#41-xercler-filterbar..task/FE#48-touch-targets`** — scope-un dəqiq 3 fayla məhdud olduğunu və AC-5-də qeyd olunan cədvəl sətri düymələrinə (Detal/Qaimə/ActionMenu) toxunulmadığını sətir-sətir təsdiqlədi.
4. **`npx tsc --noEmit`** və **`npm run build`** — regressiya yoxlanışı.

**Aparıla BİLMƏYƏN:** canlı brauzerdə DevTools ilə computed style baxışı, 375px-də faktiki toxunub-scroll etmə, klaviatura ilə canlı Tab/Enter/Ox davranışı, skrinşot-la vizual müqayisə. Bu TC-lər aşağıda **"✅ Pass (kod/CSS analizi)"** kimi ayrıca işarələnib — uydurma canlı nəticə yazılmayıb. Lakin bu tapşırığın nəticəsi (element hündürlüyü) tam statik CSS class-larla idarə olunduğundan (heç bir runtime/JS şərti hündürlüyə təsir etmir), bu üsul FE#41-dəki funksional testlərdən fərqli olaraq **tam əminliklə** qərar vermək üçün kifayətdir.

---

## Xülasə

| Göstərici | Dəyər |
|---|---|
| Ümumi AC | 7 |
| Ümumi TC | 10 |
| ✅ AC Pass | **7 / 7** |
| ❌ AC Fail | 0 |
| ✅ TC Pass | **10 / 10** |
| ❌ TC Fail | 0 |
| `npx tsc --noEmit` | ✅ Xətasız |
| `npm run build` | ✅ Xətasız (tsc + vite, 5.14s, 2782 modul) |
| Scope yoxlanışı | ✅ Yalnız gözlənilən 3 fayl dəyişib, base UI komponentləri (`Select.tsx`, `Input.tsx`, `FilterBar.tsx`) toxunulmayıb |
| Tapılan bug | **0** |
| **Yekun qərar** | **PASS** — bütün AC/TC keçir, bloklayıcı və ya kosmetik bug tapılmadı. Tövsiyə: task **"Done"**. |

---

## Acceptance Criteria nəticələri

| AC | Təsvir | Nəticə | Sübut |
|---|---|---|---|
| **AC-1** | Dövr tablarında minimum toxunma sahəsi (≥44px) — ExpenseFilters + SalesJournal | ✅ Pass | Hər iki fayldakı tab `button` class-ı: `"flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-colors"`. Compiled CSS: `.h-11{height:2.75rem}` = **44px**, `flex items-center justify-center` sayəsində `box-sizing` daxil tam hündürlük saxlanılır. Enlik: `px-3` (12px hər tərəf) + mətn genişliyi, minimum "Bu il"/"Hamısı" kimi qısa mətnlərdə də ≥44px enə çatır (görüntü/kod nəzərdən keçirməsi ilə təsdiqləndi). |
| **AC-2** | Select-lər (Kateqoriya, Status, Anbar, Mənbə, Xərc növü, Ödəniş) minimum toxunma sahəsi | ✅ Pass | Hər 6 `Select` çağırışında (`ExpenseFilters` 2, `ProductFilters` 3, `SalesJournal` 1) `className="w-full text-sm"` — **heç bir `h-*` override yoxdur**. `Select.tsx:376` baza class-ı `"relative flex h-12 w-full items-center …"` deterministik tətbiq olunur. Compiled CSS: `.h-12{height:3rem}` = **48px** ≥ 44px. `h-9` override-i bütün 6 çağırışdan silinib (`grep h-9` → 0 nəticə hər 3 faylda). |
| **AC-3** | SalesJournal-dakı ədədi input-lar (Min/Max qazanc, Min/Max say) eyni standarta tabedir | ✅ Pass | 4 input-un hamısında `className={cn(inputCls, "px-3 text-sm")}` — `h-9` override silinib. `Input.tsx:7` `inputCls` daxilində `"w-full h-12 …"` deterministik tətbiq olunur. Compiled CSS: `.h-12` = 48px ≥ 44px. |
| **AC-4** | Vizual/dizayn ardıcıllığı pozulmur (3 səhifə eyni pattern) | ✅ Pass | Tab button class-stringi `ExpenseFilters.tsx` və `SalesJournal.tsx`-də **hərfi-hərfinə eynidir**. Select `className="w-full text-sm"` pattern-i bütün 6 çağırışda (3 fayl) eynidir. Heç bir faylda ayrıca fərqli ölçü təyin edilməyib — paylaşılan baza class-lara (`h-12` Select/Input, `h-11` tab) etibar olunur. |
| **AC-5** | Cədvəl daxilindəki digər toxunma hədəflərinə (Detal, Qaimə, ActionMenu) təsir etmir | ✅ Pass | `git diff task/FE#41..task/FE#48` — `SalesJournal.tsx`-də dəyişən yeganə sətirlər tab button (1) və 5 filter sahəsi (Ödəniş select + 4 input)-dır. Masaüstü sətr düymələri (`h-8` Detal, `h-8 w-8` Qaimə) və mobil kart düymələri (`h-11`/`w-11 h-11`, əvvəldən mövcud idi) diff-də **görünmür** — toxunulmayıb. |
| **AC-6** | Mobile/responsive-də tələbə cavab verir | ✅ Pass (kod/CSS analizi) | `role="tablist"` konteynerində `overflow-x-auto flex-nowrap` saxlanılıb; tab button-larda `shrink-0` var (kiçilmir) və `h-11` fix class-dır (content-dən asılı deyil, kontenerin darlaşması yalnız üfüqi scroll yaradır, hündürlüyə təsir etmir). Canlı 375px görüntü/toxunma skrinşotla yoxlanmadı (alət yoxdur), lakin CSS-də hündürlük runtime şərtindən asılı olmadığı üçün nəticə dəyişməz qalır. |
| **AC-7** | Klaviatura və fokus davranışı dəyişmir | ✅ Pass (kod analizi) | `Select.tsx`/`Input.tsx` diff-i **boşdur** — `focus:ring-4 focus:ring-emerald-500/20`, `aria-expanded`, daxili keyboard handler-ləri toxunulmayıb. Tab button-larında `aria-selected={active}`, `role="tab"`, `onClick` handler-ləri dəyişməyib — yalnız `className`-ə layout üçün `flex h-11 items-center justify-center` əlavə olunub. |

---

## Test case nəticələri

| TC | Ssenari | Nəticə | Sübut |
|---|---|---|---|
| **TC-1** | Expenses → dövr tabları computed height/width | ✅ Pass | `.h-11 = 44px` (compiled CSS), `flex items-center justify-center` + `px-3` — hündürlük dəqiq 44px, enlik ≥44px. |
| **TC-2** | Expenses → Mənbə/Xərc növü select-ləri | ✅ Pass | `className="w-full text-sm"`, override yoxdur → baza `h-12` = 48px. |
| **TC-3** | Products → Kateqoriya/Status/Anbar select-ləri | ✅ Pass | Hər 3 select `className="w-full text-sm"`, override yoxdur → 48px. |
| **TC-4** | Sales → dövr tabları (Bu gün/Bu həftə/Bu ay/Hamısı) | ✅ Pass | Eyni `h-11` class-ı `ExpenseFilters` ilə identik → 44px. |
| **TC-5** | Sales → Ödəniş select + 4 ədədi input | ✅ Pass | Select `className="w-full text-sm"` (48px); 4 input `cn(inputCls, "px-3 text-sm")` (`h-9` override silinib, `inputCls` `h-12` = 48px). |
| **TC-6** (edge, mobil 375px scroll) | Dövr tabları üfüqi scroll-da | ✅ Pass (kod/CSS analizi) | `overflow-x-auto` konteyner + `shrink-0 h-11` tab-lar — genişlik sıxılsa da hündürlük class-la fiksdir, 44px-dən aşağı düşə bilməz. Canlı vizual test aparılmadı (alət yoxdur). |
| **TC-7** (edge, 3 səhifə vizual müqayisə) | Expenses → Products → Sales keçid | ✅ Pass (kod analizi) | Tab/Select class-stringləri 3 fayl arasında identikdir (bax AC-4 sübutu); vizual fərq yaradacaq heç bir ayrıca ölçü/rəng/radius override-i yoxdur. |
| **TC-8** (regression) | Select aç/bağla, klaviatura ilə idarə (Tab/Enter/Ox) | ✅ Pass (kod analizi) | `Select.tsx` daxili implementasiyası (fokus halqası, `aria-expanded`, `aria-selected`, klaviatura handler-ləri) diff-də dəyişməyib — yalnız çağıran tərəfin `className`-i (ölçü) dəyişib. Canlı klaviatura testi aparılmadı. |
| **TC-9** (regression) | SalesJournal cədvəl sətri Detal (`h-8`)/Qaimə (`h-8 w-8`, masaüstü) və mobil kart düymələri (`h-11`) | ✅ Pass | `git diff` bu sətirləri əhatə etmir — FE#48 dəyişikliyi bunlara toxunmayıb, AC-5 ilə tələb olunduğu kimi. |
| **TC-10** (edge, uzun mətnli tab/label) | Uzun mətn ilə toxunma sahəsi 44px-dən aşağı düşməməli | ✅ Pass (kod analizi) | Tab button-un hündürlüyü `h-11` fix class ilə təyin olunur (mətn uzunluğundan asılı deyil), `whitespace-nowrap` + `shrink-0` sayəsində mətn kəsilmədən konteyner enişi genişlənir (yalnız üfüqi ölçüyə təsir edir), `truncate` istifadə olunmayıb ki, mətn görünməz olsun. Layout sınmır. |

---

## Nəticə

Bütün 7 AC və 10 TC **PASS**. Developer-in ilkin düzəlişi (h-9 → h-11) və senior-frontend-in sonrakı refactor-u (Select/Input üzərindəki effektsiz `h-11` override-lərinin silinməsi, deterministik `h-12` bazasına etibar) birlikdə tələbi tam qarşılayır. Scope tam qorunub — yalnız 3 gözlənilən fayl dəyişib, cədvəl sətri düymələrinə (AC-5) toxunulmayıb, paylaşılan `Select`/`Input`/`FilterBar` komponentlərinin daxili davranışı (fokus, aria, klaviatura) dəyişməyib. `tsc --noEmit` və `npm run build` xətasız keçir.

Bug tapılmadı. Tövsiyə: **FE#48 → "Done"**.

**Qeyd (məlumat üçün, bloklayıcı deyil):** PR #49 hələ də `task/FE#41-xercler-filterbar` üzərində stacked-dir; FE#48-in faktiki `main`-ə düşməsi üçün əvvəlcə FE#41-in merge olunması lazımdır (bu, tapşırıqda əvvəlcədən qeyd olunmuş və gözlənilən vəziyyətdir).
