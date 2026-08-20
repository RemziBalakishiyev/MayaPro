# QA Hesabatı — FE#80 (Ayarlar səhifəsi — dizayn sisteminə keçid, mərhələ 11)

| | |
|---|---|
| **Task** | FE#80 |
| **PR** | https://github.com/RemziBalakishiyev/MayaPro/pull/173 |
| **Branch** | `task/FE-80-ayarlar-ui` → `main` (hələ merge olunmayıb) |
| **HEAD commit** | `48ee929` — "refactor(ui): FE#80 ayarlar sehifesi - a11y yaxsilasdirmalari" |
| **QA tarixi** | 2026-08-07 |
| **Mühit** | Windows 11 · Node/Vite 6.4.3 · Vitest 4.1.10 · statik kod analizi (headless brauzer mühiti mövcud deyil — əvvəlki FE#7x/#8x QA dövrlərində istifadə olunan eyni metodologiya: kod oxunuşu + unit/komponent testlər + build) |

---

## 1. Yekun verdikt

> ### PASS

Bütün 15 acceptance criteria kod səviyyəsində müstəqil təsdiqləndi və PR-dakı
komponent test dəsti (`_app.ayarlar.test.tsx`, 15 test) hər bəndi ayrıca
yoxlayır — hamısı yaşıldır. `npm run build` 0 xəta ilə bitir.
TOXUNULMAZ qaydası pozulmayıb: `api.ts`, `queries.ts`, `store.ts`
dəyişməyib (müstəqil `git diff` ilə təsdiqləndi). Tam layihə üzrə `npx vitest
run` zamanı 1 uyğunsuz test tapıldı (`PeriodFilter.test.tsx`), lakin bu test
FE#80-in toxunduğu heç bir fayla aid deyil (diff = 0 sətir, `origin/main`-də
də mövcuddur) — FE#80 üçün blokverici deyil, gate-dən kənar pre-existing
məsələ kimi qeyd olunur (aşağıda §4).

| Kateqoriya | Keçdi | Keçmədi |
|---|---|---|
| Acceptance Criteria (15) | 15 | 0 |
| TOXUNULMAZ qaydası (api/queries/store/validator) | PASS | — |
| Build | PASS | — |
| FE#80-ə aid testlər (29) | 29 | 0 |
| Tam repo testləri (351) | 350 | 1 (əlaqəsiz) |

---

## 2. Build və test nəticəsi

```
npm run build                                              → PASS, exit 0 (5.07s, 2819 modul)
npx vitest run _app.ayarlar.test.tsx settings/lib.test.ts   → PASS, 2 fayl / 29 test yaşıl (2.91s)
npx vitest run (tam repo)                                   → 46 fayl PASS, 1 fayl FAIL (350/351 test)
```

`git diff origin/main...HEAD --stat`:
```
docs/pages/settings-ui-refactor.md | 130 +++++++++++++
src/features/settings/lib.test.ts  | 115 +++++++++++
src/features/settings/lib.ts       |  65 ++++++-
src/routes/_app.ayarlar.test.tsx   | 309 ++++++++++++++++++++++++++++
src/routes/_app.ayarlar.tsx        | 242 +++++++++++++++++------
```
`git diff origin/main -- src/features/settings/api.ts src/features/settings/queries.ts src/features/settings/store.ts` → **boş çıxış** (0 fayl dəyişib). Backend `UpdateSettingsValidator.cs` ayrı repodadır və bu PR-da toxunmur (yalnız `lib.ts`-də şərhlə istinad olunur, qaydalar güzgülənir, dəyişdirilmir).

---

## 3. Acceptance Criteria nəticələri (15 bənd)

| AC | Nəticə | Sübut |
|---|---|---|
| 1 — Sahələr kart bölmələrinə qruplanıb (6 kart) | PASS | `_app.ayarlar.tsx:136-275` — "Mağaza məlumatları", "Qaimə məlumatları", "Pul və stok parametrləri", "Dil", "WhatsApp borc xatırlatma şablonu", "İşçi icazələri" (statik siyahı, dəyişməyib). Test: "bənd 1" → yaşıl. |
| 2 — Etiketlər inputun üstündə | PASS | `components/ui/Field.tsx:16-21` — `label` span `children`-dən əvvəl render olunur (dəyişməyib, mövcud primitiv). |
| 3 — Köməkçi mətnlər qısa/praktik | PASS | Hint-lər əvvəlki mətnlərlə eyni məzmunda saxlanıb ("Qaimə başlığında görünəcək", "{debt} yazdığınız yerə borc məbləği...əlavə olunacaq"). |
| 4-5 — Valyuta/dil sabit mətn sətri (dropdown deyil) | PASS | `_app.ayarlar.tsx:185-223` — `Select disabled` silinib, sadə `<p>` mətni: "AZN (tezliklə əlavə valyutalar)", "Azərbaycanca (tezliklə əlavə dillər)". Test aşkar yoxlayır: `[aria-haspopup="listbox"]` DOM-da yoxdur. |
| 6 — Dirty-state izlənir | PASS | `baseline` vs `f` `useState`, `dirty = !areSettingsEqual(f, baseline)` (`lib.ts:53-64`); arxa-fon refetch `dirtyRef` ilə draftı əzmir (`_app.ayarlar.tsx:72-78`, ayrıca test var). |
| 7 — Sticky yadda saxlama zolağı ("Dəyişikliklər yadda saxlanılmayıb" + Ləğv et/Yadda saxla) | PASS | `_app.ayarlar.tsx:278-307`; "Ləğv et" `baseline`-a qaytarır (test yaşıl). |
| 8 — Köhnə yuxarı Save düyməsi silinib | PASS | Köhnə versiyada (`origin/main`) `PageHead actions` daxilində Save düyməsi var idi (git diff ilə təsdiqləndi) — yeni versiyada `PageHead`-də `actions` prop-u ümumiyyətlə yoxdur. |
| 9 — Mövcud validasiya qaydaları işləyir | PASS | `lib.ts` `validateSettings()` — məcburi mağaza adı/WhatsApp şablonu, uzunluq limitləri (200/200/300/30/1000), min stok ≥0 — backend validator qaydalarını güzgüləyir, YENİ qayda yoxdur (şərhlə aşkar bəyan edilib). |
| 10 — Inline xətalar sahənin yanında | PASS | `Field error` prop-u ilə hər sahədə `role="alert"` göstərilir (`Field.tsx:22-29`); test "bənd 9-10" boş mağaza adı ilə xətanı yoxlayır. |
| 11 — `{debt}` şablon dəyişəni qorunub | PASS | Saxlama/göndərmə məntiqi dəyişməyib, `payload` birbaşa `f.whatsappTemplate`-i göndərir. |
| 12 — Canlı, redaktə-olunmaz önizləmə ({debt} → "250.00 AZN") | PASS | `buildWhatsappPreview()` (`lib.ts:47-50`) + `_app.ayarlar.tsx:241-255` — `<p>` (redaktə olunmur), nümunə "250.00" mətni ilə. |
| 13 — Önizləmə lokal state-dən, saxlanan şablon yalnız "Yadda saxla"da dəyişir | PASS | `preview = buildWhatsappPreview(f.whatsappTemplate)` (draft `f`-dən, `baseline`-dan yox); test "bənd 11-12-13" `mutateAsync` çağırılmadığını yoxlayır. |
| 14 — Vəziyyətlər: spinner/toast/API xəta | PASS | `Button loading={updateSettings.isPending}` (`:300`), uğurda `toast.success` + sticky bağlanır, xətada `toast.error` + sticky açıq qalır (draft itmir) — hər ikisi üçün ayrıca test yaşıl. |
| 15 — `useBlocker` ilə çıxış xəbərdarlığı (ConfirmDialog) | PASS | `useBlocker({ shouldBlockFn: () => dirty, enableBeforeUnload: dirty, withResolver: true })` (`:114-118`) + `ConfirmDialog` (`:309-317`, "Bəli, çıx"→`proceed()`, "İmtina"→`reset()`). 3 ayrıca test (`shouldBlockFn`, proceed, reset) yaşıl. |

---

## 4. TOXUNULMAZ qaydası

- `src/features/settings/api.ts`, `queries.ts`, `store.ts` — **dəyişməyib** (`git diff origin/main` boş nəticə verdi, §2-yə bax).
- Backend `UpdateSettingsValidator.cs` ayrı repoda, bu PR-da yoxdur.
- Ayar açarları (`storeName`, `ownerName`, `address`, `phone`,
  `whatsappTemplate`, `currency`, `defaultMinStock`, `language`) və save
  axını (`updateSettings.mutateAsync` → `useSettingsStore`) dəyişməyib —
  yalnız təqdimat qatı (JSX/kart strukturu, dirty-state, inline xəta,
  önizləmə) əlavə olunub.

## 5. Əlaqəsiz tapıntı (bloklayıcı deyil)

Tam repo test icrası zamanı `src/components/ui/PeriodFilter.test.tsx` →
"AC3 — bir çipə klikləyəndə yalnız o aktiv olur" testi uğursuz oldu
(`aria-selected` gözlənilən "true" əvəzinə "false"). Bu fayl FE#80 PR
diff-ində YOXDUR (`git diff origin/main -- src/components/ui/PeriodFilter*`
→ 0 sətir) və test təkrar icrada da eyni şəkildə uğursuz olur — yəni FE#80
tərəfindən yaradılmayıb, `main`-də onsuz da mövcud bug-dır. FE#80 üçün
QA nəticəsinə təsir etmir, lakin izlənmək üçün ayrıca bug taskı açılması
tövsiyə olunur (aşağıya bax).

---

## 6. Bug tapıntıları

FE#80-ə aid heç bir bug tapılmadı.

Əlaqəsiz, mövcud (pre-existing) bug: `PeriodFilter` komponentində çip
seçimi `aria-selected` düzgün yenilənmir — ayrıca bug task yaradıldı:
**BUG-ID: aşağıya bax (task_manager ilə yaradılıb)**.

---

## 7. Nəticə

FE#80 üçün 15/15 AC keçdi, TOXUNULMAZ qaydası qorunub, build və PR-a aid
testlər (29/29) yaşıldır. Tapılan tək məsələ FE#80-dən asılı olmayan,
`main`-də onsuz da mövcud olan `PeriodFilter` reqressiyasıdır — bu, FE#80-i
`Done`-a keçirməyə mane olmur.
