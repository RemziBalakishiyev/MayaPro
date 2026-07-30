# QA Report — FE#25: Ödəniş modalı (kassa üslubu, qismən ödəniş)

**Tarix:** 2026-07-31
**QA Agent:** qa-tester
**Test edilən PR:** https://github.com/RemziBalakishiyev/MayaPro/pull/33 (branch `task/FE#25-odenis-modali`, base `task/FE#24-satis-detal-drawer`, son commit `766b62e` — "refactor: FE#25 review duzelisleri")
**Dəyişən fayllar (19):** `src/components/ui/Modal.tsx`, `src/features/customers/api.ts`, `src/features/reports/{api,lib,queries}.ts`, `src/features/sales/api.ts`, `src/features/sales/components/{CustomerSelectBlock.tsx (yeni), PaymentConfirmModal.tsx (yeni), QuickSaleScreen.tsx, SaleDetailDrawer.tsx, SaleEditDrawer.tsx, SalesJournal.tsx}`, `src/features/sales/lib.ts`, `src/features/sales/types.ts`, `src/lib/format.ts`, `src/mocks/{handlers.ts,seed.ts}`, `src/routes/_app.hesabatlar.tsx`, `src/types/index.ts`
**Backend:** `backend/` yalnız oxundu (frontend↔backend kontraktını təsdiqləmək üçün: `SaleWriteValidator.cs`, `SalePaymentPlan.cs`, `CreateSaleCommand.cs`, `SaleDto.cs`, `UpdateSaleHandler.cs`). Heç bir fayl dəyişdirilmədi.

## Mühit və məhdudiyyət (AÇIQ QEYD)

Bu sessiyada işlətdiyim alət dəstində (Read/Grep/Glob/Bash/Write) **brauzer avtomatlaşdırması yoxdur** (Playwright/Cypress quraşdırılmayıb, layihədə ümumiyyətlə test framework yoxdur). Ona görə klik/hover/toxunma/375px-vizual kimi **canlı interaktiv testlər aparıla bilmədi** — bunlar aşağıda **⚠️ Blocked (canlı)** kimi işarələnib.

Bunun əvəzinə, riyaziyyat/vəziyyət (state) məntiqli AC/TC-lər üçün **dəqiq kod izləməsi (trace)** aparıldı — `PaymentConfirmModal.tsx`-in bütün branch-ları əl ilə hər giriş dəyəri üçün simulyasiya edildi (bax aşağıda "Kod trace nəticələri") — və **frontend↔backend kontraktı sətir-sətir tutuşduruldu** (`resolveSalePaymentPlan` (FE) ↔ `SalePaymentPlan.Resolve` (BE), `SaleWriteValidator.cs`). Bu üsul, canlı brauzer olmadan da, dəyər səviyyəsində yüksək əminliklə "PASS (kod)" vermək üçün kifayət etdi — sadəcə fiziki render/görünüş (rənglər, 375px kəsişmə, fokus keçidi) təsdiqlənmədi.

## Xülasə

| Göstərici | Dəyər |
|---|---|
| Ümumi AC | 10 |
| Ümumi TC | 10 |
| ✅ Pass (kod trace / build / kontrakt təsdiqi ilə) | AC: 9, TC: 9 |
| ⚠️ Blocked (yalnız canlı vizual/toxunma təsdiqi çatışmır, kod düzgün görünür) | AC10 (qismən — 375px vizual), TC8 (qismən — vizual) |
| ❌ Fail / Bug tapıldı | 1 (aşağıda BUG-1, TC5-in genişləndirilmiş əhatəsində) |
| **Yekun qərar** | **Statusu "Done"-a keçirmirəm.** 1 real (kod trace ilə sübut olunmuş, canlı mühit tələb etməyən) bug tapıldı: "Qismən ödədi" seçilib məbləğ sahəsi **toxunulmadan/boş** buraxılanda "Təsdiqlə" bloklanmır — sahə səhv işarələnmir və satış səssizcə `paidAmount=0` (`Ödəmədi` ilə eyni nəticə) kimi göndərilir. Qalan bütün AC/TC-lər (o cümlədən senior review-un qeyd etdiyi bütün risk sahələri — vergüllü input, yekundan çox, 0, mənfi, abc, SaleEditDrawer regressiyası, pul bölgüsü kontraktı) kod trace və backend kontraktı ilə **PASS** təsdiqləndi. |

## Acceptance Criteria nəticələri

| AC | Təsvir | Nəticə | Qeyd |
|---|---|---|---|
| AC1 | "SATIŞI TAMAMLA" → birbaşa göndərmir, kassa üslubu modal açılır, yuxarıda nəhəng YEKUN | ✅ Pass (kod) | `QuickSaleScreen.tsx` `onComplete` → `profit<0` olmayanda `setPaymentModalOpen(true)` (əvvəl birbaşa `complete()` çağırılırdı, indi çağırılmır — `complete` yalnız modal `onConfirm`-dən çağırılır). `PaymentConfirmModal.tsx` başlıqda `text-4xl/5xl font-extrabold` ilə `fmtMoney(net)`. |
| AC2 | "Tam ödədi" → `paidAmount=net`, Nağd/Kart toggle, Təsdiqlə yalnız via seçilibsə aktiv | ✅ Pass (kod trace) | `choice==='full'` → `paidAmount=net`, `customerVisible=false` (müştəri tələb olunmur), `viaRequired=true` → `canConfirm` yalnız `!!via` ilə şərtlənir. Trace: via seçilməyibsə buton deaktiv (`disabled={!canConfirm}`). |
| AC3 | "Qismən ödədi" → böyük `inputmode=decimal` input, Nağd/Kart toggle, canlı "Qalıq borc: X manat" qırmızı | ✅ Pass (kod trace) | `input inputMode="decimal"`; `RemainingBanner` (`bg-red-50 text-red-700`) `choice && remaining>0`-da göstərilir, hər dəyişiklikdə `partialValue`→`partialPaid`→`remaining` yenidən hesablanır (React state, canlı). |
| AC4 | Qismən/Ödəmədidə hələ müştəri yoxdursa CustomerPicker+"Yeni müştəri" görünür, seçilənədək Təsdiqlə deaktiv (backend qaydası: qalıq > 0 → müştəri məcburi) | ✅ Pass (kod+kontrakt) | `customerVisible = partial\|\|unpaid`; `customerRequired = customerVisible && remaining>0` — bu, backend `SaleWriteValidator.HaveCustomerWhenBalanceRemains` (`plan.Remaining<=0 \|\| CustomerId!=null`) ilə **sözbəsöz eynidir** (FE `resolveSalePaymentPlan` BE `SalePaymentPlan.Resolve`-un JS portu). |
| AC5 | "Ödəmədi" → `paidAmount=0`, canlı "Qalıq borc: {yekun}", müştəri seçilməyibsə Təsdiqlə bloklanır | ✅ Pass (kod trace) | `choice==='unpaid'` → `paidAmount=0`, `remaining=net`, `customerRequired=true` (net>0-da), `viaRequired=false` (Ödəmədidə üsul soruşulmur — düzgün, pul alınmayıb). |
| AC6 | Təsdiqlə → `paidAmount/paidVia/remainingAmount` ilə göndərilir, uğur ekranı açılır, qalıqlı satışda "Qalıq borc: X manat — Nisyə Borclarda görünəcək" sətri | ✅ Pass (kod) | `complete()` → `createSale({..., paidAmount, paidVia})`; uğur state-i `remainingAmount: created.remainingAmount` saxlayır; `success.remainingAmount>0` şərtilə `bg-orange-50` xəbərdarlıq sətri göstərilir — mətn tələb olunan formatla üst-üstə düşür. |
| AC7 | Köhnə Nağd/Kart/Nisyə 3 düyməsi formadan tamamilə çıxıb | ✅ Pass (kod) | `QuickSaleScreen.tsx` diff-i: `PAY_TYPES` massivi, `payType` state-i və `PaymentBlock` komponenti **tamamilə silinib**; `grep PAY_TYPES\|payType` bu fayldan heç nə qaytarmır (aşağıya bax). Yerinə `CustomerSelectBlock` (yalnız müştəri, ödəniş seçimi yoxdur) qoyulub. |
| AC8 | Qismən ödənilmiş satışda Yekunun yanında boz "{paidAmount} ödənilib", badge "Nisyə" qalır | ✅ Pass (kod) | `SalesJournal.tsx` (desktop+mobil sətir) və `SaleDetailDrawer.tsx` — `remainingAmount>0 && paidAmount>0` şərtilə `text-stone-400` kiçik mətn; badge sütunu (`paymentType`) dəyişməyib — qismən ödənişdə `plan.paymentType==="Nisyə"` olduğu üçün badge avtomatik "Nisyə" qalır. |
| AC9 | 500 manatlıq satış, 300 qismən ödəniş → Müştərilər +500 ümumi alış, Nisyə Borclarda qalıq 200, gün sonunda nağd +300 | ✅ Pass (kod+kontrakt, canlı UI ilə əlavə təsdiq tövsiyə olunur) | **Backend:** `CreateSaleHandler.cs:39` → `SalePaymentPlan.Resolve` → `plan.PaidAmount=300`, `plan.Remaining=200`; müştəri borcu yalnız `plan.Remaining`(200) qədər artır (`IncreaseDebtAsync(..., plan.Remaining, ...)`); `TotalPurchases` (backend `GetCustomersHandler.cs`) bu PR-da toxunulmayıb, hər zaman `totalAmount` cəmindən (500) hesablanır. **Frontend (mock):** `salesMoneySplit()` tək mənbədən Dashboard/Hesabatlar/Gün sonu-nun **hamısında** istifadə olunur (`reports/api.ts`, `reports/lib.ts`, `reports/queries.ts`, `routes/_app.hesabatlar.tsx`, `mocks/handlers.ts` closing) — 5 yerin də eyni funksiyaya bağlı olması ədədi uyğunsuzluğu strukturca əngəlləyir. Canlı brauzerdə 3 ekranın eyni anda yan-yana yoxlanması (skrinşot) aparılmadı. |
| AC10 | 375px-də 3 kart/input/toggle-lar 44-48px, responsiv, scroll problemsiz | ⚠️ Pass (kod) / Blocked (canlı vizual) | `CHOICES` kartları `min-h-[84px]`, `ViaToggle` `min-h-[56px]`, `Button size="lg"` = `min-h-[52px]` (`Button.tsx:26`) — hamısı 44-48px hədəfindən yuxarıda. `Modal.tsx` `max-h-[92vh] overflow-y-auto`, footer `sticky bottom-0` + `pb-[calc(env(safe-area-inset-bottom)+0.75rem)]`. Struktur tam uyğundur, lakin faktiki 375px render/kəsişmə skrinşotla yoxlanmadı. |

## Test case nəticələri

| TC | Qısa təsvir | Nəticə | Kod trace / tapıntı |
|---|---|---|---|
| TC1 | Happy path — Tam ödəmə | ✅ Pass (kod) | `choice=full, via=Nağd` → `confirm()`: `fullyPaid=true` (remaining=0) → `paymentType: via="Nağd"`, `paidAmount=net`, `paidVia="Nağd"` (paidAmount>0). Uğur ekranında `remainingAmount=0` → xəbərdarlıq sətri göstərilmir. |
| TC2 | Happy path — Qismən ödəmə (500→300 Nağd, müştəri seçili) | ✅ Pass (kod) | `choice=partial, partialRaw="300", via=Nağd` → `partialValue=300`, `partialPaid=300`, `remaining=200`, `RemainingBanner` "Qalıq borc: 200.00 ₼" göstərir; `customerRequired=true` → müştəri seçiləndə `canConfirm=true`; `confirm()` → `paymentType:"Nisyə"`, `paidAmount:300`, `paidVia:"Nağd"`, `customerId`. Bax AC9 — kontrakt backend ilə üst-üstə düşür. |
| TC3 | Ödəmədi, müştəri seçilməyib | ✅ Pass (kod) | `choice=unpaid` → `customerRequired=true` (remaining=net>0), `customerId=""` → `canConfirm=false` → "Təsdiqlə" `disabled`. `CustomerSelectBlock` `missing=true` → `border-amber-300 bg-amber-50` + `requiredHint` mətni göstərilir ("Qalıq borc üçün müştəri seçilməlidir — «Təsdiqlə» bloklanıb."). |
| TC4 | Qismən ödəmədə 600 (yekundan çox, net=500) | ✅ Pass (kod) | `partialValue=600`, `partialError=null` (600>0 doğrudur), amma `partialOverLimit=true` → sarı ipucu "Yekundan çox ola bilməz — 500.00 ₼ qəbul olunacaq"; `partialPaid=Math.min(600,500)=500` → `remaining=0` → menfi qalıq **mümkün deyil**, müştəri bloku avtomatik götürülür (`remaining<=0`), satış tam ödəniş kimi (`paymentType=via`) göndərilir — TC-nin tələb etdiyi "menfi qaliq gosterilmemeli" davranışı dəqiq təmin olunur. |
| TC5 | "abc" / "-50" / genişləndirilmiş: "0", boşluq | ⚠️ Qismən Fail — bax **BUG-1** | `"abc"`→`parseMoneyInput` regex uğursuz→`null`→qırmızı sahə + "Yalnız rəqəm yazın..." mesajı, `canConfirm=false`. `"-50"`→eyni (regex `-` işarəsini rədd edir). `"0"`→`partialValue=0`→`partialError="Məbləğ 0-dan böyük olmalıdır..."`, bloklanır. **Bunların hamısı düzgün işləyir (PASS).** LAKİN sahə **toxunulmadan boş/yalnız boşluq** buraxılanda (`partialRaw.trim()===""`) → `partialTouched=false` → `partialError=null` (səhv kimi işarələnmir!) → `canConfirm` yalnız via+müştəri seçilməsini tələb edir, məbləğ heç yoxlanmır → "Təsdiqlə" **aktiv olur** və satış səssizcə `paidAmount=0` (`Ödəmədi` ilə fərqsiz) kimi göndərilir. Bax BUG-1. |
| TC6 | Köhnə Nağd/Kart/Nisyə 3 düyməsinin silinməsi | ✅ Pass (kod) | Bax AC7 — `PAY_TYPES`/`payType`/`PaymentBlock` `QuickSaleScreen.tsx`-dən tam silinib, forma indi yalnız mal/say/qiymət/xərc/müştəri(istəyə bağlı)/qeyd sahələrindən ibarətdir. |
| TC7 | Jurnal/detal göstərimi (qismən ödəniş) | ✅ Pass (kod) | Bax AC8 — `SalesJournal.tsx` (desktop `cell`, mobil kart) və `SaleDetailDrawer.tsx` hər ikisində `{paidAmount} ödənilib` boz mətn şərtli render olunur, badge sütunu `paymentType="Nisyə"` olaraq qalır (dəyişməyib). |
| TC8 | Mobil rahatlıq (375px) | ⚠️ Pass (kod) / Blocked (canlı) | Bax AC10. Toxunma ölçüləri kodda təmin olunub, canlı 375px render/scroll testi bu sessiyada aparılmadı. |
| TC9 | `npm run build` | ✅ Pass | Aşağıda tam çıxış — xətasız, 5.32s. |
| TC10 | Uğur ekranı — qalıqlı satış | ✅ Pass (kod) | Bax AC6 — `success.remainingAmount>0` şərtilə `"Qalıq borc: {fmtMoney(remainingAmount)} — Nisyə Borclarda görünəcək"` sətri `QuickSaleScreen.tsx:321-327`-də mövcuddur, mətn tələblə üst-üstə düşür. |

## npm run build

```
> sederek-sistem@0.0.0 build
> tsc && vite build

vite v6.4.3 building for production...
✓ 2778 modules transformed.
dist/index.html                  0.83 kB │ gzip:   0.45 kB
dist/assets/index-*.css         45.33 kB │ gzip:   8.17 kB
dist/assets/index-*.js       1,177.77 kB │ gzip: 329.95 kB
✓ built in 5.32s
```
Xəta yoxdur (yalnız pre-existing "chunk > 500kB" xəbərdarlığı — bu PR-a aid deyil, əvvəlki QA report-larda da eyni xəbərdarlıq qeyd olunub).

## Frontend↔Backend kontraktı — təsdiq

| Sahə | Frontend | Backend | Uyğunluq |
|---|---|---|---|
| Sorğu sahələri | `paidAmount?: number`, `paidVia?: "Nağd"\|"Kart"` (`types.ts` `createSaleSchema`) | `CreateSaleCommand(..., decimal? PaidAmount, string? PaidVia)` | ✅ Ad/tip/optional-lıq eyni |
| Cavab sahələri | `Sale.paidAmount/remainingAmount/paidVia` (məcburi) + `toPaymentFields()` normalizasiyası köhnə backend üçün | `SaleDto(..., decimal PaidAmount, decimal RemainingAmount, string PaidVia)` — System.Text.Json defolt camelCase → `paidAmount/remainingAmount/paidVia` | ✅ |
| Hesablama qaydası | `resolveSalePaymentPlan()` (`sales/lib.ts`) | `SalePaymentPlan.Resolve()` (`Domain/SalePaymentPlan.cs`) | ✅ Hər iki tərəfdə: `remaining>0 → paymentType="Nisyə"` məcburi; `paidVia` yalnız Nağd/Kart, "Nisyə" atılır və Cash-ə düşür |
| Müştəri məcburiliyi | `customerRequired = remaining>0` | `HaveCustomerWhenBalanceRemains`: `plan.Remaining<=0 \|\| CustomerId!=null` | ✅ Sözbəsöz eyni şərt |
| PaidAmount üst hədd | FE: `Math.min(partialValue, net)` — inputu **səssiz məhdudlaşdırır**, heç vaxt `net`-dən çox göndərmir | BE: `PaidAmount <= Total(command)` — əks halda **400 validasiya xətası** ("Ödənilən məbləğ ümumi məbləğdən çox ola bilməz") | ✅ FE heç vaxt bu limiti aşan dəyər göndərmədiyi üçün bu BE qaydası normal axında heç vaxt tetiklənmir (TC4 ilə uzlaşır) |
| SaleEditDrawer | `keepPartialPayment = payType===sale.paymentType && sale.remainingAmount>0 && sale.paidAmount>0` — yalnız HƏQİQƏTƏN qismən ödənilmiş satışda `paidAmount` saxlanılır (yeni `net`-ə görə `Math.min` ilə məhdudlaşdırılır); tam ödənilmiş satışda `paidAmount: undefined` göndərilir | `UpdateSaleHandler.cs`: `PaidAmount` `null`-dursa `SalePaymentPlan.Resolve` defoltu tətbiq edir (Nağd/Kart→tam yeni total) | ✅ Əvvəlki bug (tam ödənilmiş Nağd satışın qiyməti artırılanda 400 "Qalıq borc üçün müştəri seçilməlidir") FE tərəfində düzgün həll olunub — kod trace ilə təsdiqləndi |

## Tapılan buglar

### BUG-1 (MEDIUM) — "Qismən ödədi" seçilib məbləğ sahəsi boş/toxunulmadan buraxılanda "Təsdiqlə" bloklanmır

**Component:** `src/features/sales/components/PaymentConfirmModal.tsx`

**Reproduksiya addımları:**
1. QuickSaleScreen-də satış detallarını doldur, "SATIŞI TAMAMLA" bas.
2. Ödəniş modalında "Qismən ödədi" kartını seç.
3. "Nə qədər verdi?" sahəsinə **heç nə yazma** (və ya yalnız boşluq yaz, sonra sil).
4. "Necə ödədi?"-də "Nağd" (və ya "Kart") seç.
5. Müştəri seç (qalıq > 0 olduğu üçün tələb olunur).
6. "Təsdiqlə" düyməsinə diqqət yetir.

**Gözlənilən nəticə:** Sahə boş olduğu üçün "Təsdiqlə" deaktiv qalmalı (və ya sahə səhv/xəbərdarlıq kimi işarələnməlidir) — çünki istifadəçi "Qismən ödədi" seçib, amma faktiki heç bir məbləğ göstərməyib.

**Faktiki nəticə:** "Təsdiqlə" düyməsi **aktivdir** və basılanda satış `paidAmount=0`, `paymentType="Nisyə"`, `paidVia=undefined` ilə göndərilir — yəni nəticə "Ödəmədi" seçimi ilə **fərqsizdir**, amma istifadəçi "Qismən ödədi" seçdiyini düşünür və heç bir xəbərdarlıq/blok görmür.

**Kök səbəb (kod):** `PaymentConfirmModal.tsx:112-120`
```ts
const partialTouched = partialRaw.trim() !== "";
const partialValue = parseMoneyInput(partialRaw);
const partialError: string | null = !partialTouched
  ? null   // ← sahə "toxunulmayıb" sayılanda HEÇ bir yoxlama edilmir
  : partialValue == null
    ? "Yalnız rəqəm yazın (məs. 300 və ya 300,50)"
    : partialValue <= 0
      ? "Məbləğ 0-dan böyük olmalıdır — pul verilməyibsə «Ödəmədi» seçin"
      : null;
```
`canConfirm` (sətir 141-145) yalnız `partialError==null` şərtini yoxlayır; `partialTouched`/`partialValue>0` şərti yoxdur, ona görə "toxunulmamış" (boş) sahə "səhvsiz" sayılır.

**Təsir/Severity:** MEDIUM. Maliyyə datası itmir/korlanmır (nəticə hesablama baxımından düzgün — `paidAmount=0`, `remainingAmount=net`, müştəri məcburidir, backend qaydası ilə üst-üstə düşür), lakin istifadəçi UX-i çaşdırıcıdır: kassir "Qismən ödədi" düyməsinə basıb, məbləğ yazmağı unudub, heç bir xəbərdarlıq görmədən "Təsdiqlə"yə basa bilər və satış onun niyyətindən fərqli (tam nisyə, 0 ödənilib) qeydə alınar. Jurnalda/detalda "{paidAmount} ödənilib" sətri də göstərilmir (çünki `paidAmount>0` şərti yalan) — beləliklə istifadəçi bunun səhv olduğunu sonradan da görməyəcək.

**Tövsiyə olunan düzəliş:** `choice==='partial'` olduqda `canConfirm` həm də `partialTouched && partialValue!=null && partialValue>0` tələb etsin (və ya sahə boşdursa vizual `aria-invalid`/qırmızı halqa göstərilsin, məs. "Məbləğ daxil edin" mesajı ilə).

**Bug tapşırığı üçün başlıq təklifi:** `[BUG][FE#25] Qismən ödədi seçilib məbləğ boş buraxılanda Təsdiqlə bloklanmır`

## Kod baxışı ilə aşkarlanan əlavə müşahidələr (bug deyil, diqqətə çatdırılır)

1. `PaymentConfirmModal`-də "Qismən ödədi" seçilib boş buraxıldıqda "Necə ödədi?" (Nağd/Kart) toqqlusu hələ də **məcburi** göstərilir (`viaRequired = full||partial`), amma seçilən üsul faktiki göndərilmir (`paidVia: paidAmount>0 ? via : undefined` — `paidAmount=0` olduğu üçün discard olunur). Bu, BUG-1-in bir əlavə simptomudur — düzəliş edildikdə bu uyğunsuzluq da öz-özünə aradan qalxacaq.
2. `Modal.tsx`-in yeni fokus-tələsi/ESC-yığın (openStack) məntiqi DOM sırasına (JSX-də elan sırası) etibar edir — `PaymentConfirmModal` `QuickSaleScreen.tsx`-də `NewCustomerModal`-dan **əvvəl** elan olunub, ona görə "Yeni müştəri" hər zaman "üstdəki" panel kimi düzgün tanınır. Bu, konkret bu iki komponentin cari yerləşməsinə görə işləyir; gələcəkdə üçüncü səviyyəli modal (məs. modal içindən başqa modal) əlavə edilərsə, JSX sırası diqqətlə saxlanmalıdır (canlı test tövsiyə olunur).

## İcra olunan əmrlər

```bash
gh issue view 25 --repo RemziBalakishiyev/MayaPro --comments
gh pr view 33 --repo RemziBalakishiyev/MayaPro --comments
git -C ".../frontend" diff task/FE#24-satis-detal-drawer...task/FE#25-odenis-modali --stat
git -C ".../frontend" diff task/FE#24-satis-detal-drawer...task/FE#25-odenis-modali -- <hər dəyişən fayl>
npm run build                                        # PASS, xətasız, 5.32s
grep -rn "paidAmount|paidVia|remainingAmount" backend # kontrakt təsdiqi
```

## Əhatə olunmayan sahələr

- **Canlı brauzer/interaktiv test** (klik, hover, fokus keçidi, 375px vizual render, scroll, "Yeni müştəri" üzərindən ESC-in canlı sınağı) — bu sessiyada əlçatan alət dəstində browser automation yoxdur.
- **AC9/TC2/TC9-un tam e2e canlı icrası** (real backend + brauzerdə 500 manatlıq satış → Müştərilər/Nisyə Borclar/Gün sonu 3 ekranın yan-yana yoxlanması) — kod/kontrakt səviyyəsində tam təsdiqləndi, amma canlı vizual sınaq aparılmadı.
- Layihədə test framework (Vitest/Playwright) olmadığından avtomatlaşdırılmış unit/e2e test yazılmadı (tapşırıq təlimatına uyğun, tətbiq kodu dəyişdirilmədi).

## Tövsiyələr

- **BUG-1** developerə göndərilməlidir (aşağıda ayrıca bug tapşırığı formatında).
- Merge-dən əvvəl brauzer əlçatan mühitdə TC2/TC8/TC9-un qısa (10-15 dəq) canlı smoke-testi tövsiyə olunur (əsasən 375px vizual və "Yeni müştəri" üzərindən ESC ssenarisi üçün).
