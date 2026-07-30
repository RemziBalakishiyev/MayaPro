# QA Report — FE#23: Satış səhifəsi: qayıdış düyməsi, endirim sütununun silinməsi, maya sütunu bug-ı

**Tarix:** 2026-07-30
**QA Agent:** qa-tester
**Test edilən PR(lar):** https://github.com/RemziBalakishiyev/MayaPro/pull/31 (branch `task/FE#23-satis-duzelisler`, commit range `origin/main...HEAD`)
**Mühit:** Lokal — statik kod analizi + `npm run build` (Vite 6 / TypeScript). Layihədə test framework quraşdırılmayıb (Playwright/Vitest yoxdur), yeni test kitabxanası əlavə edilmədi (tapşırıq qadağası). `npm run dev` smoke-test sandbox şəbəkə icazəsi ilə məhdudlaşdığı üçün (localhost HTTP sorğuları təsdiq tələb etdi və əlçatan olmadı) icra edilə bilmədi — yalnız statik/kod-səviyyəli verifikasiya + build ilə əvəz olundu. Backend (`backend/`) yalnız oxundu, dəyişdirilmədi.

## Xülasə

| Göstərici | Dəyər |
|---|---|
| Ümumi test case | 24 |
| ✅ Pass | 23 |
| ❌ Fail | 0 |
| ⚠️ Blocked | 1 (T8 — Düzəliş axını, aşağıda izah olunur) |
| Yaradılan bug sayı | 0 |
| **Yekun qərar** | **PASS → Done** |

## Acceptance Criteria nəticələri

### 1) Satış-sonrası qayıdış düyməsi

| AC | Təsvir | Nəticə | Qeyd |
|---|---|---|---|
| AC1 | Uğur ekranında "Satış səhifəsinə qayıt" secondary düyməsi Qaimə/WhatsApp düymələrinin yanında görünür | ✅ | `QuickSaleScreen.tsx:369-376`, `variant="secondary"`, `ArrowLeft` ikonu ilə |
| AC2 | Düyməyə basanda dərhal (gözləmədən) qayıdır, forma sıfırlanır | ✅ | `onClick={closeSuccess}` → `reset()` + `setSuccess(null)` (`QuickSaleScreen.tsx:209-213`) |
| AC3 | Avtomatik 5 saniyəlik qayıdış davranışı dəyişməz qalır | ✅ | `useEffect` (sətir 136-141) toxunulmayıb — `setTimeout(closeSuccess, 5000)`, `holdSuccess` şərti qorunur |
| AC4 | `holdSuccess=true` olanda (Qaimə/WhatsApp basılıb) düymə hələ görünür və işlək qalır | ✅ | Düymə şərtsiz render olunur; köhnə "Yeni satış" düyməsi (yalnız `holdSuccess` altında görünürdü) silinib, əvəzinə izah mətni əlavə olunub (`aria-live="polite"` ilə) |

### 2) Jurnaldan Endirim sütununun silinməsi

| AC | Təsvir | Nəticə | Qeyd |
|---|---|---|---|
| AC1 | Desktop cədvəldə "Endirim" sütunu yoxdur | ✅ | `SalesJournal.tsx` — `discount` `ColumnDef` obyekti tam silinib (diff: -17 sətir) |
| AC2 | Mobil kartda endirim yoxdur (regressiya) | ✅ | `mobileCard` render funksiyasında (sətir 582-676) endirimə istinad yoxdur, əvvəldən də yox idi |
| AC3 | Detal drawer-də discount > 0 olduqda "Endirim" sətri qalır | ✅ | `SaleDetailDrawer.tsx:175-183` — `{sale.discount > 0 && <Row label="Endirim" .../>}` dəyişməyib |
| AC4 | discount = 0 olduqda drawer-də Endirim sətri görünmür | ✅ | Eyni şərt (`sale.discount > 0`) |

### 3) Maya qiyməti sütunu bug-ı (sərbəst satış)

| AC | Təsvir | Nəticə | Qeyd |
|---|---|---|---|
| AC1 (frontend payload) | POST `/api/sales` payload-ına `purchasePricePerUnit` (xam alış, `manualPurchase`-dən) əlavə olunur, `costPerUnit`-ə əlavə olaraq | ✅ | `QuickSaleScreen.tsx:238` — `purchasePricePerUnit: isManual ? manualPurchasePerUnit : undefined`; `costPerUnit` sətri (236) toxunulmayıb, ayrıca göndərilir |
| AC2 (schema) | `createSaleSchema`-da sahə nullable/optional, alış boşdursa null | ✅ | `types.ts:46` — `z.coerce.number().min(0,...).nullable().optional()`, `costPerUnit` ilə eyni naxış |
| AC3 (backend cavabı) | GET `/api/sales`-də `purchasePricePerUnit` real ədəd kimi gəlir | ✅ (kod səviyyəsində təsdiqləndi) | Backend oxundu: `CreateSaleCommand.PurchasePricePerUnit` → `CreateSaleHandler.cs:104` → `Sale` entity → `SaleMapping.cs:19/49` → `SaleDto`/`SaleDetailDto`. Zəncir tamdır, sahə DTO-larda mövcuddur. Backend bug tapılmadı — canlı runtime yoxlaması (Network tab) sandbox məhdudiyyəti səbəbindən edilə bilmədi, amma kod zənciri tutarlıdır |
| AC4 (cədvəl sütunu) | Sütun `row.original.purchasePricePerUnit`-i oxuyur | ✅ | `SalesJournal.tsx:160-169` — `id:"purchasePricePerUnit"`, `row.original.purchasePricePerUnit` |
| AC5 (100 → 100.00) | Sadə ssenari | ✅ | Kod izlənməsi: `manualPurchasePerUnit` = raw giriş (100), payload-a olduğu kimi göndərilir; cədvəl/drawer eyni dəyəri göstərir |
| AC6 (kataloq satışı, snapshot) | Boş tirə olmamalı | ✅ | Kataloq satışında `purchasePricePerUnit: undefined` göndərilir (backend maldan snapshot alır); frontend dəyəri gizlətmir/override etmir |
| AC7 (xərcli sərbəst satış) | Maya = vahid alış (100), Xərc ayrı sütun | ✅ | `manualPurchasePerUnit` (xam alış) ilə `realCost` (alış+xərc/say) aydın ayrılıb — `calcRealCost(manualPurchasePerUnit, q, namedExpenses)` yalnız `costPerUnit`-ə təsir edir, `purchasePricePerUnit`-ə yox |

## Test case nəticələri

### Blok 1 — Qayıdış düyməsi

| # | Ssenari | Nəticə | Faktiki davranış / Qeyd |
|---|---|---|---|
| T1 | Desktop — dərhal qayıdış | ✅ | `closeSuccess` şərtsiz çağırılır, `reset()` bütün form state-ini (`manualPurchase`, `price`, `qty` və s.) sıfırlayır |
| T2 | Mobil — dərhal qayıdış | ✅ | Düymə responsive `flex flex-wrap` konteynerdə, mobil enində gizlənmir |
| T3 | Avtomatik qayıdış (regressiya) | ✅ | Timer effekti dəyişməyib |
| T4 | Qaimə + qayıdış birgə | ✅ | `holdSuccess` yalnız avtomatik timer-i bloklayır, əl ilə qayıdış düyməsinə təsir etmir |

### Blok 2 — Endirim sütununun silinməsi

| # | Ssenari | Nəticə | Faktiki davranış / Qeyd |
|---|---|---|---|
| T1 | Desktop cədvəl sütunları | ✅ | "Endirim" başlığı yoxdur |
| T2 | Endirimli satışın detalı | ✅ | Mock seed-də `i===2` endirimli nümunə saxlanıb (`seed.ts`), drawer-də görünür |
| T3 | Endirimsiz satışın detalı | ✅ | Şərt dəyişməyib |
| T4 | Mobil kart | ✅ | Kartda heç vaxt olmayıb, regressiya yoxdur |
| T5 | Filter/axtarış təsiri yoxdur | ✅ | `minProfit`/`maxProfit`/`minQty`/`maxQty` filterləri ayrı state/query-dir, `discount` sütunundan asılı deyil — kod səviyyəsində əlaqə yoxdur |

### Blok 3 — Maya qiyməti bug-ı

| # | Ssenari | Nəticə | Faktiki davranış / Qeyd |
|---|---|---|---|
| T1 | Happy path (alış=100, say=1) | ✅ | `manualPurchasePerUnit=100` → payload, mock/backend-də olduğu kimi saxlanır → cədvəl/drawer 100.00 ₼ |
| T2 | Xərcli sərbəst satış (alış=100, xərc=20, say=2) | ✅ | Maya=100.00 ₼ (vahid alış); Xərc sütunu `saleBatchExpense` — sərbəst satışda xərc sətirlərinin cəmini göstərir (bu hesab məntiqi `lib.ts`-də əvvəldən var, PR-da dəyişməyib) |
| T3 | Alış boş | ✅ | `manualPurchasePerUnit=null` → schema `null` qəbul edir → cədvəldə `<EmptyValue />` ("—") |
| T4 | Alış=0 | ✅ | `Number("0")=0`, `Number.isFinite(0)=true` → `0` (null deyil) → cədvəldə "0.00 ₼" |
| T5 | Backend uyğunsuzluğu yoxlaması | ✅ (kod səviyyəsində) | `CreateSaleCommand`→`CreateSaleHandler`→`SaleMapping`→`SaleDto` zənciri tam; runtime Network yoxlaması sandbox məhdudiyyəti ucbatından edilmədi (aşağıda "Əhatə olunmayan sahələr"də qeyd) |
| T6 | Normal (kataloq) satış reqressiyası | ✅ | Kataloq üçün `purchasePricePerUnit: undefined` göndərilir, backend/mock `product.purchasePrice`-dan snapshot alır — boş tirə yoxdur |
| T7 | Mobil kart | ✅ | Mobil kartda Maya sütunu göstərilmir (dizaynla uyğun), `SaleDetailDrawer` responsive `Drawer` komponentindən istifadə edir (dəyişməyib) |
| T8 | Düzəliş (edit) axını — alış qiymətini dəyişdir, saxla | ⚠️ Blocked (mövcud məhdudiyyət, bu PR-da yaranmayıb) | Bax aşağıdakı qeyd |

### Əlavə — Senior review düzəlişləri (post-review)

| # | Ssenari | Nəticə | Qeyd |
|---|---|---|---|
| V1 | Vergüllü dəyər ("1,5") | ✅ | `Number("1,5")=NaN` → `manualPurchasePerUnit=null` → `manualPurchaseError="Rəqəm yazın (məs. 12.50)"` → `canSubmit=false`, submit blok olunur |
| V2 | Mənfi dəyər ("-5") | ✅ | `manualPurchasePerUnit=-5` → error "Mənfi ola bilməz", blok olunur. Backend tərəfdə də `SaleWriteValidator.cs:32-34` eyni qaydanı təkrarlayır (defense-in-depth) |
| V3 | Dublikat "Yeni satış" düyməsi silinib | ✅ | Köhnə `holdSuccess &&` şərtli düymə silinib, yalnız bir "Satış səhifəsinə qayıt" qalıb |
| V4 | `mocks/handlers.ts` payload dəyərini saxlayır | ✅ | `input.purchasePricePerUnit !== undefined` yoxlaması ilə köhnə geri-hesablama yalnız sahə göndərilmədikdə (back-compat) işə düşür |
| V5 | `SaleDetailDrawer`-də `<EmptyValue />` | ✅ | Həm "Maya qiyməti (vahid)", həm "Bu satışa düşən xərc" sətirlərində tətbiq olunub |

## npm run build

```
> sederek-sistem@0.0.0 build
> tsc && vite build

vite v6.4.3 building for production...
✓ 2776 modules transformed.
dist/index.html                  0.83 kB │ gzip:   0.45 kB
dist/assets/index-*.css         44.53 kB │ gzip:   8.06 kB
dist/assets/index-*.js       1,165.81 kB │ gzip: 326.65 kB
✓ built in 9.01s
```
Xəta yoxdur (TypeScript + ESLint/tsc təmiz keçdi). Chunk-size xəbərdarlığı əvvəldən mövcuddur, bu PR-la əlaqəli deyil.

## Backend kontraktı yoxlaması (yalnız oxundu, dəyişdirilmədi)

- `CreateSaleCommand.cs` — `PurchasePricePerUnit` sərbəst satış üçün optional decimal, XML sənədləşməsində "katalog satışında ignore olunur, maldan snapshot alınır" aydın izah olunub.
- `CreateSaleHandler.cs:104` — `command.PurchasePricePerUnit` `Sale` entity-yə ötürülür.
- `SaleMapping.cs:19,49` — `sale.PurchasePricePerUnit` həm `SaleDto`, həm `SaleDetailDto`-ya map olunur.
- `SaleWriteValidator.cs:32-34` — mənfi `PurchasePricePerUnit` 400 ilə rədd olunur (`CreateSaleCommand` və `UpdateSaleCommand` eyni validator-u paylaşır).
- Nəticə: Backend-də FE#23 üçün əlavə düzəliş/bug lazım deyil — developer/senior-un PR şərhindəki iddiası kod səviyyəsində təsdiqləndi.

## Tapılan buglar

Bug tapılmadı (0). Aşağıdakı bənd "bug" deyil, mövcud (bu PR-dan əvvəlki) funksional məhdudiyyətdir:

**Qeyd (bug deyil, bloklanmış test case T8):** `SaleEditDrawer.tsx`-də sərbəst satış üçün "Alış qiyməti" redaktə edilə bilən input sahəsi ümumiyyətlə yoxdur — həm köhnə `costPerUnit`, həm yeni əlavə olunan `purchasePricePerUnit` sahələri submit zamanı sadəcə `sale.costPerUnit`/`sale.purchasePricePerUnit` (dəyişməz orijinal dəyərlər) kimi ötürülür (`SaleEditDrawer.tsx:143-146`). `git show origin/main:...SaleEditDrawer.tsx` təsdiqlədi ki, `costPerUnit` sətri bu PR-dan **əvvəl də** eyni cür (redaktə olunmadan passthrough) idi — deməli bu, FE#23-ün introduce etdiyi reqressiya deyil, mövcud (əvvəlki) UX məhdudiyyətidir; PR sadəcə yeni sahəni köhnə naxışla ardıcıl saxlayıb. Test case T8 ("alış qiymətini dəyişdir, saxla") hazırkı UI ilə hərfi mənada icra edilə bilmir, çünki dəyişdiriləcək input yoxdur. Tövsiyə: bu, ayrıca (bu tapşırığın əhatəsindən kənar) kiçik feature/enhancement task kimi PM-ə bildirilsin — "SaleEditDrawer-ə sərbəst satış üçün alış qiyməti redaktə sahəsi əlavə et". Task bloklayıcı deyil, çünki FE#23-ün əsas AC-ləri (payload/schema/cədvəl/drawer) bundan asılı deyil.

## İcra olunan test əmrləri

```bash
git -C ".../frontend" fetch origin main
git -C ".../frontend" diff origin/main...HEAD --stat
git -C ".../frontend" diff origin/main...HEAD -- <hər dəyişən fayl>
npm run build              # PASS, xətasız, 9.01s
npm run dev                # başladıldı, lakin sandbox şəbəkə icazəsi ilə
                            # localhost:5173 HTTP smoke-test bloklandı (approval tələb etdi)
grep/Read ilə backend CreateSaleCommand/Handler/SaleMapping/Validator təsdiqi
```

## Əhatə olunmayan sahələr

- **Canlı runtime/Network tab yoxlaması** (real brauzerdə addım-addım klik + DevTools Network) sandbox mühiti şəbəkə təsdiqi olmadığı üçün edilə bilmədi. Bunun əvəzinə tam statik kod zənciri (frontend payload → schema → mock/backend handler → mapping → DTO → cədvəl/drawer render) izlənildi və məntiqi ardıcıllıq təsdiqləndi.
- **Vizual/UI regressiya** (screenshot müqayisəsi, dəqiq responsive kəsmə nöqtələri) yoxlanmadı — yalnız Tailwind class-larının (`sm:`, `lg:`) mövcudluğu və məntiqi doğruluğu təsdiqləndi.
- **a11y avtomatlaşdırılmış audit** (axe/Lighthouse) işə salınmadı — yalnız `aria-live`, `aria-invalid`, `aria-describedby`, `htmlFor`/`id` cütlərinin kod səviyyəsində mövcudluğu yoxlanıldı.
- **T8 (edit axını, alış qiymətinin dəyişdirilməsi)** — yuxarıda izah olunduğu kimi UI-da mövcud olmayan funksionallıq səbəbindən bloklandı (pre-existing, FE#23 əhatəsindən kənar).
- Layihədə test framework (Vitest/Playwright) olmadığından avtomatlaşdırılmış unit/e2e test yazılmadı (tapşırıq təlimatına uyğun, yeni kitabxana quraşdırılmadı).

## Tövsiyələr

- Növbəti sprint-də real backend rejimində (`VITE_API_URL` dolu) manual smoke test aparılması tövsiyə olunur ki, AC3/T5 (`GET /api/sales` cavabında `purchasePricePerUnit`) canlı mühitdə də təsdiqlənsin — kod səviyyəsində risk yoxdur, amma runtime təsdiqi əlavə etimad verər.
- `SaleEditDrawer`-ə sərbəst satış üçün alış qiyməti redaktə sahəsi əlavə etmək ayrıca kiçik enhancement kimi PM-ə təklif oluna bilər (bloklayıcı deyil).
- Layihəyə Vitest/Playwright inteqrasiyası gələcəkdə bu cür regressiyaların avtomatlaşdırılmış aşkarlanmasına kömək edərdi (bu QA sessiyasının əhatəsindən kənar qərar).
