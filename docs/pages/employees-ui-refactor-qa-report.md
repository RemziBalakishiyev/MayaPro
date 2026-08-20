# QA Report — FE#79 "İşçilər" Səhifəsi Dizayn Sistemi Refactoru

- **Issue:** https://github.com/RemziBalakishiyev/MayaPro/issues/79
- **PR:** https://github.com/RemziBalakishiyev/MayaPro/pull/172 (branch `task/FE79-isciler-sehifesi`)
- **QA tarixi:** 2026-08-07
- **Test metodu:** statik kod analizi (bütün dəyişən komponentlər tam oxundu),
  `git diff HEAD~1..HEAD` ilə fayl-səviyyəli dəyişiklik təsdiqi, `npm run build`,
  `npx vitest run src/features/employees`. Layihədə Playwright/Cypress
  konfiqurasiyası yoxdur, ona görə responsive/vizual TC-lər kod səviyyəsində
  (Tailwind sinifləri, conditional render) yoxlanıldı, canlı brauzer
  screenshot-ı alınmadı.

## Ümumi nəticə

**Bütün 16 AC və 16 TC PASS.** Tapılan bug YOXDUR.

- `npm run build` → xətasız keçdi (tsc + vite build, 2818 module, 5.55s).
- `npx vitest run src/features/employees` → **28/28 PASS** (6 test faylı, 5-i FE#79 üçün yeni: `EmployeesViewToggle.test.tsx`, `SalaryCard.test.tsx`, `SalaryPayModal.test.tsx`, `SalaryDeductionModal.test.tsx`, `lib.test.ts`).
- `git diff HEAD~1..HEAD -- src/features/employees/queries.ts src/features/employees/api.ts` → **boş** (heç bir dəyişiklik yoxdur) → AC-13 toxunulmazlığı təsdiqlənir.

## AC nəticələri

| AC | Status | Qeyd |
|---|---|---|
| AC-1 | PASS | `EmployeesViewToggle.tsx` `role="tablist"/"tab"`/`aria-selected` ilə, `DebtViewToggle.tsx` ilə eyni konteyner/seqment sinifləri (`rounded-control`, `rounded-chip`, `bg-emerald-700 text-white`, `min-h-[40px]`) — vizual olaraq identik. `tab=maaslar\|faaliyyet` URL sxemi `_app.iscilar.tsx`-də qorunub. |
| AC-2 | PASS | `_app.iscilar.tsx` sətir 64-70: `activeTab === "maaslar" ? <SalaryBoard .../> : <div>...Fəaliyyət...</div>` — **conditional render**, `display:none` yoxdur. `SalaryMonthSwitcher` yalnız `SalaryBoard` daxilindədir, `SalaryBoard` özü isə yalnız `maaslar` rejimində montaj olunur → Fəaliyyət rejimində DOM-dan tam çıxır. `month` parametri `ActivityLog`-a ötürülmür (fəaliyyət jurnalı ayrı komponentdir, ay asılılığı yoxdur). |
| AC-3 | PASS | `SalaryCard.tsx` sətir 99: `grid grid-cols-3 gap-2`, hər sütun eyni struktur (etiket + dəyər), dəyərlər `tabular-nums` sinfi ilə (sətir 117, 187, 200). Test: `SalaryCard.test.tsx` "AC-3" case-i 3 etiketi və 3 dəyəri təsdiqləyir. |
| AC-4 | PASS | `SalaryCard.tsx` sətir 195-206: `overpaid` olduqda etiket "Artıq ödəniş"ə, rəng `text-orange-600`-a keçir; `Math.abs(remaining)` ilə mənfi işarə gizlədilir; progress bar (sətir 210-217) `overpaid ? "bg-orange-500"` tonunda 100%-də qalır — hesablama (`remaining`, `progress`) dəyişmir. Test: `SalaryCard.test.tsx` "AC-4" case-i "Qalıq məbləğ" YOX, "Artıq ödəniş" VAR, mənfi işarəsiz `100.00 ₼` təsdiqlənib. |
| AC-5 | PASS | `salaryUnset = monthlySalary===0` (sətir 81), progress bar `!salaryUnset &&` şərti ilə render olunmur (sətir 210). "Maaş təyin olunmayıb" mətni `canSetSalary` true/false-a görə düymə/adi mətn kimi göstərilir (sətir 141-158). Testlər hər iki halı ("Sahibkar üçün keçid var" / "canSetSalary=false — keçid yoxdur") ayrıca yoxlayır. |
| AC-6 | PASS | `Badge tone={roleLabel}` (`SalaryCard.tsx` sətir 95) + `employeeRoleLabel()` (`lib.ts` sətir 87-97) sabit `ROLE_LABELS` cədvəli ilə raw kodu (`sahib`/`kassir`/`satici`) AZ etiketə çevirir; `Badge.tsx`-də `STATUS_STYLE` cədvəlinə FE#79 üçün 4 sabit ton əlavə olunub (Sahibkar=violet, Menecer/Kassir=sky, Satıcı=teal) — hər rol həmişə eyni tonda. `EmployeesTable.tsx`-də də (Fəaliyyət rejimi cədvəli) eyni `employeeRoleLabel`/`tone` istifadə olunur, ardıcıllıq qorunur. |
| AC-7 | PASS | "Maaş ödə" düyməsi `variant="primary"`, tam en (`w-full`), `SalaryCard.tsx` sətir 230-241; digər iki düymə `secondary`/`ghost` və qrid daxilində yarım-enli — vizual iyerarxiya aydındır. `docs/ui-terminology.md` sətir 86-da "Pul ver" → "Maaş ödə" qeydə alınıb (FE#79, AC-7). |
| AC-8 | PASS | "Tutulma əlavə et" və "Tarixçəyə bax" tam mətnli etiketlərlə (`<span className="truncate">...</span>`), yalnız-ikon deyil; `variant="secondary"`/`"ghost"` ilə əsas əməliyyatdan zəif. |
| AC-9 | PASS | Həm `SalaryPayModal.tsx`, həm `SalaryDeductionModal.tsx` son təsdiq üçün paylaşılan `ConfirmModal` (= `ConfirmDialog`, `components/ui/ConfirmModal.tsx`) istifadə edir; ad-hoc submit yoxdur — iki addımlı axın (forma → `openConfirm()` → `ConfirmModal.onConfirm=submit`). |
| AC-10 | PASS | `SalaryConfirmSummary.tsx` işçi adı/ay/məbləğ/`Qalıq: X ₼ → Y ₼` sətirlərini göstərir (sətir 60-67); `remainingAfter < 0` olduqda narıncı `role="alert"` xəbərdarlıq mətni əlavə olunur (sətir 69-77). Format testlərlə də təsdiqlənib (`SalaryPayModal.test.tsx`: `"600.00 ₼ → 500.00 ₼"`, `"bu ödənişlə maaşdan artıq veriləcək"`). |
| AC-11 | PASS | "Kassadan çıxacaq — gün sonunda nəzərə alınır" mətni forma addımında (`SalaryPayModal.tsx` sətir 121-125, submit-dən ƏVVƏL) VƏ təsdiq dialoqunda (`SalaryConfirmSummary` `affectsCash` propu, sətir 79-84) göstərilir — yalnız toast-da deyil. Test `AC-11` case-i bunu təsdiqləyir. |
| AC-12 | PASS | Yüklənmə: `Spinner` (`SalaryBoard.tsx` sətir 44); Boş: `EmptyState` (sətir 55-59); Göndərilir: `ConfirmModal`-da `loading={isPending}` + `disabled={isPending}` (`ConfirmModal.tsx` sətir 75-82) təkrar klikin qarşısını alır; Xəta: `InlineError` + `onRetry` (sətir 49-53), mövcud `isError` yolu qorunub. |
| AC-13 | PASS | `git diff HEAD~1..HEAD -- queries.ts api.ts` **boş** — heç bir hesablama funksiyası/sorğu kontraktı dəyişməyib. `lib.ts` diff-i yalnız ƏLAVƏ (`employeeRoleLabel`, şərh) — mövcud `salaryProgressPercent` funksiyası toxunulmayıb. |
| AC-14 | PASS | `_app.iscilar.tsx` sətir 46-47: `canSeeSalary = user?.role !== "satici"`; `activeTab = canSeeSalary ? tab : "faaliyyet"` — Satıcı üçün URL-də `?tab=maaslar` olsa belə `activeTab` məcburən `"faaliyyet"`-ə düşür. Seqment kontrolu özü `{canSeeSalary && (...)}` şərti ilə tamamilə render olunmur (sətir 53-62). Bu, mövcud `canSeeSalary` davranışının dəqiq davamıdır (dəyişməyib). |
| AC-15 | PASS (kod səviyyəsində) | `SalaryBoard.tsx` sətir 61: `grid gap-3 sm:grid-cols-2 xl:grid-cols-3` — 375px-də defolt 1 sütun, ≥640px-də 2, ≥1280px-də 3 (1440/1920-də də 3, əlavə breakpoint tələb olunmur, AC mətni əlavə sütun artımını tələb etmir). `EmployeesViewToggle` konteyneri `flex-nowrap` + `w-full sm:w-auto` ilə kiçik enlərdə daşmır. Canlı brauzer screenshot testi bu QA dövründə aparılmadı (Playwright/Cypress mövcud deyil) — tövsiyə: gələcək manual/vizual QA zamanı 4 enin skrinşotu ilə əlavə təsdiq. |
| AC-16 | PASS | `npm run build` xətasız (yuxarıda göstərilib). `docs/pages/employees-ui-refactor.md` mövcuddur (161 sətir). `docs/ui-terminology.md` sətir 86-da "Pul ver" → "Maaş ödə" qeydi var. |

## TC nəticələri

| TC | Status | Qeyd |
|---|---|---|
| TC-1 | PASS | AC-1/AC-3 statik təhlili ilə üst-üstə düşür; `SalaryBoard`/`SalaryCard` kod baxışı standart görünüşü təsdiqləyir. |
| TC-2 | PASS | AC-2 conditional render — ay seçici DOM-dan tam çıxır, `ActivityLog` `month`-dan asılı deyil. |
| TC-3 | PASS | `SalaryCard.test.tsx` "AC-4" case-i eyni ssenarini (`remaining: -100`) unit testlə əhatə edir. |
| TC-4 | PASS | `SalaryCard.test.tsx` "AC-5 — Sahibkar üçün keçid var" case-i. |
| TC-5 | PASS | `SalaryCard.test.tsx` "AC-5 — canSetSalary=false — keçid yoxdur" case-i. |
| TC-6 | PASS | `SalaryPayModal.test.tsx` "AC-9/AC-10" case-i əvvəl→sonra qalığı və kassa qeydini submit-dən ƏVVƏL doğrulayır; narıncı xəbərdarlıq bu ssenaridə YOXDUR (yalnız TC-7-də). |
| TC-7 | PASS | `SalaryPayModal.test.tsx` "AC-10 — nəticədə qalıq mənfi olacaqsa" case-i. |
| TC-8 | PASS | `SalaryDeductionModal.tsx`/`.test.tsx` — `variant="secondary"` + eyni `SalaryConfirmSummary` istifadəsi. |
| TC-9 | PASS | `ConfirmModal.tsx` `loading={isPending}` + `disabled={isPending}` — `Button` primitivi loading zamanı deaktivdir (kod səviyyəsində təsdiqlənib, `Button.tsx` `loading` propu standart DS naxışıdır). |
| TC-10 | PASS | `InlineError` + `onRetry` — `isError` yolu (sətir 45-53) qorunub. |
| TC-11 | PASS | `EmptyState` (sətir 54-59) `rows.length === 0` şərtində. |
| TC-12 | PASS | AC-14 ilə eyni — `activeTab` məcburi `"faaliyyet"`, seqment göstərilmir, URL-ə əl ilə `?tab=maaslar` yazılsa belə `canSeeSalary` false olduğu üçün `activeTab` təsirlənmir. |
| TC-13 | PASS (kod səviyyəsində) | Defolt (375px, `sm` breakpoint-dən aşağı) 1 sütun, `EmployeesViewToggle` `w-full` + `flex-nowrap`. |
| TC-14 | PASS (kod səviyyəsində) | `sm:grid-cols-2 xl:grid-cols-3` — 1280/1440/1920 hamısı `xl` aralığında, 3 sütun sabit qalır (daşma riski yoxdur, sütunlar `min-w-0` ilə). |
| TC-15 | PASS | AC-6 ilə eyni — sabit `ROLE_LABELS`/`STATUS_STYLE` cədvəli. |
| TC-16 | PASS | `npm run build` xətasız (yuxarıda). |

## Toxunulmazlıq təsdiqi (AC-13 üçün əlavə dəlil)

```
git diff HEAD~1..HEAD -- src/features/employees/queries.ts src/features/employees/api.ts
# çıxış: boş (heç bir sətir dəyişməyib)
```

`lib.ts` diff-i yalnız yeni `employeeRoleLabel` funksiyası əlavə edir; mövcud
`salaryProgressPercent`, `SALARY_MONTH_RE`, `currentSalaryMonth`,
`shiftSalaryMonth`, `isFutureSalaryMonth`, `composeDeductionNote`
funksiyalarının heç biri dəyişməyib.

## Tapılan bug-lar

Yoxdur.

## Yekun qərar

**Bütün 16 AC və 16 TC PASS.** Bug tapılmayıb — QA nöqteyi-nəzərindən task
`Done` statusuna keçə bilər (PR #172 artıq `main`-ə merge olunmaq üçün hazırdır).
