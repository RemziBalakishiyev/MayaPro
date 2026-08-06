# QA Report — FE#73: Müştərilər səhifəsi — dizayn sisteminə keçid (mərhələ 4)

**Tarix:** 2026-08-06
**QA Agent:** qa-tester
**Test edilən PR:** https://github.com/RemziBalakishiyev/MayaPro/pull/166 (branch `task/FE73-musteriler-refactor`, HEAD `fba9b94`)
**Baza:** `origin/main` @ `7845518`
**Mühit:** Windows 11, Node/Vite 6.4.3, Vitest 4.1.10. Playwright/Cypress/Puppeteer bu mühitdə quraşdırılmayıb (`package.json`-da yoxdur) — real brauzerdə piksel-səviyyəli vizual QA (1280/1440/1920/375px) APARILMADI. Bütün aşağıdakı nəticələr: (a) şəxsən icra edilmiş `npm run build` / `npx vitest run`, (b) `git diff origin/main...HEAD` ilə fayl-fayl müstəqil kod oxunuşu, (c) mövcud/yeni unit testlərin oxunub məntiqinin doğrulanmasına əsaslanır.

> **Proses qeydi:** PR #166-ya developer tərəfindən özü `docs/qa/FE-73-qa-report.md` (PASS verdiktli) commit edib (son commit `fba9b94`). Bu, müstəqil QA dövrünü əvəz etmir. Mən bu sənədə etibar ETMƏDİM — bütün AC-lər və ötəri iddialar (build/test nəticələri, "diff boşdur" iddiaları) tərəfimdən sıfırdan, şəxsən yenidən icra/oxunaraq doğrulandı. Tövsiyə: gələcəkdə developer/PR-ın öz-özünə QA sign-off sənədi commit etməsinin qarşısı alınsın (proses riski, bu PR-ın məzmununu FAIL etmir).

## Xülasə

| Göstərici | Dəyər |
|---|---|
| Ümumi Acceptance Criteria | 13 |
| PASS | 13 |
| FAIL | 0 |
| BLOCKED | 0 (yalnız piksel-səviyyəli real-brauzer vizual QA mühit məhdudiyyətinə görə aparılmadı — aşağı bax) |
| Yaradılan bug sayı | 0 |
| **Yekun qərar** | **PASS** (kod/build/test səviyyəsində) — Merge qapısı qaydasına görə (Qızıl qayda #5) task yalnız PR #166 MERGE olduqdan sonra "Done" ola bilər |

## Acceptance Criteria nəticələri (müstəqil doğrulama)

| AC | Təsvir | Nəticə | Doğrulama üsulu |
|---|---|---|---|
| AC-1 | "Yeni müştəri" əsas əməliyyat qalır | PASS | `_app.musteriler.tsx:117-129` — `PageHeader.primaryAction`, dəyişməyib |
| AC-2 | Axtarış + sürətli filtrlər BİR standart toolbar-da | PASS | `_app.musteriler.tsx:137-189` — tək `<TableToolbar search=… actions=…>` bloku |
| AC-3 | Checkbox → [Hamısı]/[Borcu olanlar] seqment, URL-də | PASS | `role="tablist"`/`role="tab"` + `aria-selected`; `navigate({ search: (prev)=>({...prev, onlyDebtors: key||undefined}) })` — `onlyDebtors` search-param sxemi qorunub; checkbox tam silinib (kodda görünmür) |
| AC-4 | Ad/telefon axtarışı qorunur | PASS | `filtered` `useMemo` (sətir 66-80) — `c.name`/`c.phone`+`phoneDigits` filtrasiya məntiqi diff-də dəyişməyib, yalnız toolbar görünüşü (AC-3) dəyişib |
| AC-5 | Ad sahəsinin bütövü kliklənən → CustomerDrawer | PASS | `CustomersTable.tsx:190-203` (desktop) və `:330-339` (mobil) — `<button onClick={()=>onView(c)}>` + `aria-label`/`title`. Unit test "ad sahəsinə klik onView-i çağırır" şəxsən `npx vitest run` ilə yaşıl |
| AC-6 | Mövcud CustomerDrawer reuse, tərkib standart kart üslubunda (əlaqə/alış/borc/ödəniş) | PASS | Eyni `CustomerDrawer.tsx` faylı (yeni komponent yaradılmayıb). "Əlaqə" indi başlıqlı `rounded-card` panel, "Aldığı mallar" (alış tarixçəsi) və "Borc / ödəniş tarixçəsi" (vahid xronoloji, `docs/pages/customers-ui-refactor.md` §2.6-da əsaslandırılıb) mövcuddur. Qərar (ayrı siyahılara bölünməmək) məntiqlidir və sənədləşdirilib |
| AC-7 | Sətir "Ödəniş" → "Borc ödənişi al" | PASS | `CustomersTable.tsx:150-159` (desktop), `:361-368` (mobil) — mətn dəyişib, `aria-label`+`title` var. Test: `within(table).queryByText("Ödəniş")` → `not.toBeInTheDocument()` |
| AC-8 | Yeni ödəniş axını yoxdur, mövcud PaymentModal | PASS | `git diff origin/main...HEAD -- src/features/customers/components/PaymentModal.tsx` → BOŞ ÇIXIŞ (şəxsən icra edildi). `onPay→setPayFor→<PaymentModal>` axını `_app.musteriler.tsx`-də dəyişməyib |
| AC-9 | Borc rəngi: neytral+badge / gecikmiş (60+ gün) narıncı / kritik yalnız qırmızı | PASS | `debt-presentation.ts` — 4 dərəcəli `debtTone()`: none(boz)/normal(tünd neytral + sakit sky "Borclu" badge)/overdue(60-119 gün, kəhrəba)/critical(120+ gün, qırmızı YALNIZ bu halda). `Badge.tsx` `STATUS_STYLE.Borclu` qırmızıdan sky-a keçib, "Gecikmiş borc"/"Kritik borc" yeni açarlar var. Sərhəd dəyərləri (`debtTone(150,59)="normal"`, `debtTone(150,60)="overdue"`, `debtTone(150,119)="overdue"`, `debtTone(150,120)="critical"`) `debt-presentation.test.ts`-də test olunub və şəxsən yaşıl görüldü |
| AC-10 | "0.00 ₼" və "—" vizual fərqlidir | PASS | `CustomersTable.tsx` `DebtAmount` — `tone==="none"` halında `fmtMoney(debt)` → "0.00 ₼" (`text-stone-500`), "—" DEYİL. `EmptyValue.tsx` (`text-stone-300`, "—"+`sr-only`) yalnız "Son alış"/"Son əməliyyat" kimi mövcud olmayan tarix xanalarında istifadə olunur — rəng və məzmun baxımından iki hal aydın fərqlidir |
| AC-11 | Üç-nöqtə/ikon əməliyyatları tooltip+aria-label ilə əlçatandır | PASS | "Borc ödənişi al" düyməsi, ad düyməsi, mobil "Detal" düyməsi: `aria-label`+`title` cütü. `ActionMenu` triqqeri: `aria-label` ötürülür və `ActionMenu.tsx:199` (`title={triggerLabel ? undefined : ariaLabel}`) qaydası ilə `title` avtomatik `ariaLabel`-dən dolur (kodda təsdiqləndi). WhatsApp qaimə düyməsi və "Nisyə borcu sil" düyməsi `aria-label`-lidir |
| AC-12 | Səhifələmə/nəticə sayı TablePagination ilə standartlaşıb | PASS | `CustomersTable` `hidePagination` prop-unu `DataTable`-a ötürmür → defolt `false` → `TablePagination` (`DataTable.tsx:347-349`) avtomatik render olunur. Ayrı "Görünən: N müştəri · X ₼" xülasə sətri cədvəldən KƏNARDA, fərqli məqsədlə (cari filtrə uyğun sayı) göstərilir — `TablePagination`-ın ümumi sayı ilə qarışdırılmır |
| AC-13 | Loading/boş/nəticəsiz/xəta paylaşılan primitivlərlə | PASS | `DataTable.tsx` — `TableSkeleton`/`InlineError`/`EmptyState` mövcud primitivlər, `CustomersTable` yeni/təkrar primitiv yaratmır. FE#87 şəbəkə-xətası regressiya testləri (`CustomersTable.test.tsx` mövcud `describe` bloku) şəxsən yaşıl icra edildi |

## Nisyə Borclar (`_app.borclar.tsx`) — müstəqil regressiya yoxlaması

Aşağıdakı `git diff origin/main...HEAD -- <fayl>` sorğuları ŞƏXSƏN icra edildi:

- `src/routes/_app.borclar.tsx` → BOŞ ÇIXIŞ (route dəyişməyib)
- `src/features/customers/components/PaymentModal.tsx` → BOŞ ÇIXIŞ
- `src/features/customers/components/OpenDebtsTable.tsx` → BOŞ ÇIXIŞ
- `src/features/customers/components/OpenDebtsView.tsx` → BOŞ ÇIXIŞ
- `src/features/customers/components/DebtsKpiCards.tsx` → BOŞ ÇIXIŞ
- `src/features/customers/components/DebtViewToggle.tsx` → BOŞ ÇIXIŞ

`CustomersTable`/`CustomerDrawer` prop kontraktı `_app.borclar.tsx`-də oxundu — ötürülən bütün proplar (`customers`, `isLoading`, `isError`, `onRetry`, `canEdit`, `canDelete`, `embedded`, `onView`, `onPay`, `onEdit`, `onDelete`, `emptyState`) dəyişməyib. `variant` prop-u Borclar səhifəsindən ötürülmür → defolt `"debtors"` işə düşür, "Qalıq borc" sütununda badge TƏKRARLANMIR (`withBadge={variant==="all"}` yalnız Müştərilər səhifəsində `true`), Status sütunu ayrıca göstərir. Bu, `CustomersTable.test.tsx`-dəki "'debtors' variantında... TƏKRARLANMIR" testi ilə (şəxsən icra edilib) təsdiqləndi.

**Qeyd (gözlənilən, bug deyil):** paylaşılan `Badge`/`debtTone` dəyişikliyi (AC-9) `CustomersTable`/`CustomerDrawer` vasitəsilə Borclar səhifəsinin "Müştəri üzrə" tabına da tətbiq olunur (kod paylaşıldığı üçün qaçılmazdır) — bu, "kodca pozulma" DEYİL, çünki tələb olunan şey prop-kontraktın və JSX-in qorunmasıdır, vizual token-lərin tam eyni qalması deyil. `OpenDebtsTable.tsx` (Borclar-ın "Borclar" tabı, ayrı fayl) toxunulmayıb və köhnə "Ödəniş al" mətnini saxlayır — iki səhifə arasında incə terminoloji fərq ("Borc ödənişi al" / "Ödəniş al") qalır, lakin task əhatəsi ("yalnız Müştərilər səhifəsi") baxımından qəbul edilə bilər, bug deyil.

**Nəticə:** kod-səviyyəli regressiya tapılmadı.

## İcra olunan test əmrləri (şəxsən, bu sessiyada)

```
npm run build
→ tsc && vite build — 0 TS xətası, 2813 modul, built in 5.26s

npx vitest run
→ Test Files 25 passed (25) | Tests 194 passed (194) | Duration 10.25s

npx vitest run src/features/customers
→ Test Files 4 passed (4) | Tests 38 passed (38)

git diff origin/main...HEAD --stat
→ 10 fayl dəyişib (musteriler route, CustomersTable, CustomerDrawer, Badge,
  yeni debt-presentation.ts/.test.ts, docs/pages/customers-ui-refactor.md,
  docs/ui-terminology.md, docs/qa/FE-73-qa-report.md, CustomersTable.test.tsx)

git diff origin/main...HEAD -- src/routes/_app.borclar.tsx
git diff origin/main...HEAD -- src/features/customers/components/PaymentModal.tsx \
  src/features/customers/components/OpenDebtsTable.tsx \
  src/features/customers/components/OpenDebtsView.tsx \
  src/features/customers/components/DebtsKpiCards.tsx \
  src/features/customers/components/DebtViewToggle.tsx
→ hər ikisi BOŞ ÇIXIŞ

grep -rn "\"Borclu\"" src/
→ yalnız _app.borclar.tsx (Borclar-özəl mode-key, ayrı obyekt), CustomersTable.test,
  debt-presentation(.ts/.test), OpenDebtsView.test — Badge tone yayılması başqa
  modula (SaleDetailDrawer və s.) sızmır
```

## Sənədləşmə yoxlaması

- `docs/pages/customers-ui-refactor.md` — MÖVCUDDUR, 13 bənd üzrə qərarlar + "TOXUNULMAZ qalıb" siyahısı + §2.6-da AC-6 (vahid tarixçə) əsaslandırması + Nisyə Borclara təsir qeydləri mövcuddur. PASS
- `docs/ui-terminology.md` — sətir 75-80 (bənd 54-59) 6 yeni mətn dəyişikliyi qeydə alınıb (seqment, "Borc ödənişi al", ad kliki, Badge tonları, "0.00 ₼"/"—" fərqi). PASS

## Tapılan buglar

**Heç bir bug tapılmadı.** Aşağıdakılar bug deyil, sənədləşdirilmiş dizayn qərarları/limitasiyalardır:

1. "60+ gün gecikmiş" yaş hesablaması müştəri-aqreqat sahələrindən (`lastPaymentDate`/`lastPurchaseDate`/`createdAt`) gəlir, backend-in mənbə-üzrə dəqiq `OpenDebt.daysOld`-undan yox. Nadir kənar hallarda (məs. köhnə son ödəniş amma təzə açılan borc) badge faktiki ən yeni borcun yaşından fərqli görünə bilər. Funksional qırılma yoxdur — PM təsdiqi tövsiyə olunur.
2. "120 gün kritik" həddi PM tələbində ədəd kimi verilməyib, 60-ın qatı olaraq seçilib — DS-ə uyğundur, amma rəsmi təsdiqi yoxdur.
3. `OpenDebtsTable`-in "Ödəniş al" mətni Müştərilər səhifəsindəki "Borc ödənişi al"la unifikasiya edilməyib (qəsdən, task əhatəsi xaricində) — iki səhifə arasında kiçik terminoloji fərq qalır, gələcək unifikasiya namizədi.

## Piksel-səviyyəli vizual QA (1280/1440/1920/375px) — BLOCKED, mühit məhdudiyyəti

Bu QA sessiyasında (əvvəlki sessiyalarda olduğu kimi) Playwright/Cypress/Puppeteer quraşdırılmayıb və headless brauzer ekran görüntüsü alma imkanı yoxdur. Bu hissə kod-səviyyəli (Tailwind sinifi/struktur/rol) analizlə əvəzləndi (yuxarıdakı AC nəticələrinə bax) və yüksək etibarla "struktur pozulması yoxdur" göstərir, lakin aşağıdakılar gələcək (Playwright quraşdırılan) dövrdə TƏSDİQLƏNMƏLİDİR:

- "Kritik borc"/"Gecikmiş borc" badge-lərinin Borclar səhifəsinin Status sütununda sətir hündürlüyünü pozmadığı;
- 375px-də "Borc ödənişi al" mətninin mobil kart düyməsində sətirlənmə yaratmadığı;
- Seqment düymələrinin (`role="tablist"`) toolbar-da axtarış input-u ilə kiçik ekranlarda üst-üstə düşmədiyi.

## Tövsiyələr

- PM təsdiqi: "60+/120+ gün" hesablama mənbəyi və hədd dəyərləri (məhsul qərarı, bug deyil).
- Real brauzer/Playwright mövcud olan mühitdə 1280/1440/1920/375px vizual QA planlaşdırılsın.
- Proses: developerin öz PR-na özü "QA PASS" sənədi commit etməsi təkrarlanmasın (yuxarı "Proses qeydi"nə bax).
- Regressiya riski aşağıdır: dəyişikliklər yalnız Müştərilər səhifəsinə aid görünüş qatındadır; `remainingDebt`/`totalDebt`/`paidAmount` hesablamalarına və API sorğularına toxunulmayıb.

## Yekun qərar

**PASS** — bütün 13 AC kod/build/test səviyyəsində keçib, bug tapılmayıb, Nisyə Borclar səhifəsi pozulmayıb. Qızıl qayda #5-ə görə: task "Done" statusuna YALNIZ PR #166 `MERGED` olduqdan sonra keçirilməlidir; PR açıq qaldığı müddətcə tövsiyə olunan status "Code Review" (və ya PR merge prosesini gözləyən aralıq status)dir.
