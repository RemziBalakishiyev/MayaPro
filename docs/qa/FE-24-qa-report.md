# QA Report — FE#24: Satış detal draweri: yenidən dizayn, sətirdən açılma, WhatsApp menyusu

**Tarix:** 2026-07-31
**QA Agent:** qa-tester
**Test edilən PR:** https://github.com/RemziBalakishiyev/MayaPro/pull/32 (branch `task/FE#24-satis-detal-drawer`, base `task/FE#23-satis-duzelisler`, commit range `origin/task/FE#23-satis-duzelisler...HEAD`, son commit `57eeef1`)
**Dəyişən fayllar:** `src/components/ui/ActionMenu.tsx`, `src/components/ui/DataTable.tsx`, `src/features/sales/components/SaleDetailDrawer.tsx`, `src/features/sales/components/SalesJournal.tsx`, `src/features/sales/lib.ts`
**Backend:** `backend/` yalnız oxundu və lokal işə salındı (`dotnet run`, `http://localhost:8080`), heç bir fayl dəyişdirilmədi.

## Mühit və məhdudiyyət (AÇIQ QEYD)

Bu sessiyada işlətdiyim alət dəstində (Read/Grep/Glob/Bash/Write) **brauzer avtomatlaşdırması yoxdur** (Playwright/Cypress quraşdırılmayıb, layihədə ümumiyyətlə test framework yoxdur — `package.json`-da yalnız `dev`/`build`/`preview` scriptləri var). Əlavə olaraq, bu sandbox mühitində şəbəkə əmrləri (`curl`, `node -e fetch(...)`, `netstat`) təsdiq tələb edir və avtomatik verilmədi — ona görə backend-i lokal işə salsam belə (`dotnet run --urls http://localhost:8080` uğurla başladı, `backend/backend_run.log`-da "Now listening on: http://localhost:8080" görünür), frontend dev server-i açıb brauzerdə addım-addım klikləmək/DevTools ilə şəbəkəni izləmək **mümkün olmadı**.

Buna görə:
- **TC-15 (build)** və **regression-un statik/deterministik hissəsi** həqiqətən icra edilib, nəticələr real və verifikasiya olunub.
- **TC-01…TC-13** (sətirdən klik, hesab riyaziyyatı, WhatsApp axını, tooltip, responsive 375px, icazə davranışı) üçün **canlı brauzer/interaktiv test aparıla bilmədi**. Bunları "keçdi" kimi işarələmirəm — aşağıdakı cədvəldə **⚠️ Blocked (canlı təsdiq yoxdur)** kimi göstərilib, hər sətirdə isə statik kod analizinin (və mövcud olduğu yerdə, mock seed data ilə əl ilə yoxlanmış ədədi hesablamaların) nəticəsi ayrıca qeyd olunub.
- Mock seed-dəki real ədədlərlə (`src/mocks/seed.ts`) hesab riyaziyyatını əl ilə yoxladım (aşağıda TC-02/TC-03-də göstərilib) — bu, canlı UI render testi deyil, amma faktiki ədədlər üzərində riyazi ardıcıllığın doğruluğunu təsdiqləyir.

## Xülasə

| Göstərici | Dəyər |
|---|---|
| Ümumi test case | 15 |
| ✅ Pass (real icra ilə təsdiqlənib) | 2 (TC-14 regression — statik/deterministik, TC-15 build) |
| ❌ Fail | 0 |
| ⚠️ Blocked (canlı mühit tələb edir, bu sessiyada əlçatan olmadı) | 13 (TC-01…TC-13) |
| Statik kod analizində aşkarlanan bug | 0 |
| Yaradılan bug sayı | 0 |
| **Yekun qərar** | **Statusu "Done"-a keçirmirəm.** Kod səviyyəsində bug tapılmadı və bütün AC-lər koda düzgün implementasiya olunub kimi görünür, lakin TEST SAHƏLƏRİ 1–6-nın (klik-açılma, riyaziyyat, WhatsApp, icazə, responsive) əksəriyyəti canlı mühitdə hələ təsdiqlənməyib. Tövsiyə: mövcud statusu ("QA Testing") saxlayıb, bir insan/başqa QA sessiyasında brauzer əlçatan olan mühitdə TC-01…TC-13-ü qısa smoke-test etmək (~15-20 dəq), sonra "Done"-a keçirmək. |

## Acceptance Criteria nəticələri (koda əsasən)

| AC | Təsvir | Nəticə | Qeyd |
|---|---|---|---|
| 1.1 | Sətirə klik → drawer açılır | ⚠️ Blocked (canlı) | `SalesJournal.tsx:617` → `onRowClick={(s) => setDetailId(s.id)}`; `DataTable.tsx:212-214` (desktop `tr`) və `:107-109` (mobil kart) `onClick`-i `onRowClick`-ə bağlayır. Kod zənciri tamdır. |
| 1.2 | `role=button`, `tabIndex=0`, `cursor-pointer`, `hover:bg-stone-50`, Enter/Space | ⚠️ Blocked (canlı) | `DataTable.tsx:210-233` (desktop) `role={onRowClick?"button":undefined}`, `tabIndex`, `hover:bg-stone-50` (mövcud sinif toxunulmayıb), `onKeyDown` Enter/Space-i `onRowClick`-ə bağlayır; eyni naxış mobil kartda (`:105-126`). |
| 1.3 | Qaimə/menyu `stopPropagation` | ⚠️ Blocked (canlı klik) | `SalesJournal.tsx:300-304` (desktop hüceyrə), `:675-677` (mobil kart əməliyyat sahəsi) — `onClick={(e)=>e.stopPropagation()}` bütün wrapper div-ə tətbiq olunub. Klaviatura üçün də `DataTable`-in `onKeyDown`-u `e.target!==e.currentTarget` yoxlaması ilə qorunur (nested düymə fokusdaykən sətir açılmır). |
| 1.4 | Mobil kartda toxunma → detal, düymələr stopPropagation | ⚠️ Blocked (canlı, 375px) | Yuxarıdakı 1.1/1.3 ilə eyni mexanizm mobil kart üçün də tətbiq olunub. |
| 1.5 | Mövcud "Detal" düyməsi qalır | ✅ (kod) | `SalesJournal.tsx:679-685` (mobil) — "Detal" düyməsi saxlanılıb, `setDetailId` çağırır (desktop-da ayrıca "göz" ikonlu düymə də var, `:310-320` ətrafı). |
| 2.1 | Başlıq zolağı: mal adı + badge, sağda YEKUN + ödəniş badge | ⚠️ Blocked (canlı görüntü) | `SaleDetailDrawer.tsx` — başlıq div-i `productName` (text-xl font-bold) + kateqoriya/Sərbəst badge solda, sağda `fmtMoney(totalAmount)` (text-2xl) + `Badge tone={paymentType}`. |
| 2.2 | Hesab kartı: Satış qiyməti×Say→Cəm→Endirim(qırmızı)→qalın YEKUN | ⚠️ Blocked (canlı görüntü) | Kod ardıcıllığı: `Row label="Satış qiyməti × Say"` → `Row label="Cəm" value=subtotal` → (əgər `discount>0`) qırmızı `−discount` → `border-t-2` altında qalın `YEKUN=totalAmount`. Riyazi ardıcıllıq mock data ilə əl ilə də yoxlanıldı (aşağıda TC-02). |
| 2.3 | Boz blok: Maya (vahid), xərc, sərbəstdə xərc sətirləri, QAZANC yaşıl/qırmızı/boz | ⚠️ Blocked (canlı görüntü) | `rounded-xl bg-stone-50` blok: Maya qiyməti (vahid) → (qty>1-də) Maya cəmi → Bu satışa düşən xərc → (`isManual && expenseItems.length>0`) sətirlər → QAZANC (`profit==null`→boz "naməlum", `profit<0`→qırmızı, əks halda yaşıl). |
| 2.4 | Müştəri kartı yalnız `customerId` varsa; ad/telefon/borc | ⚠️ Blocked (canlı) | `{customerId && (<Card title="Müştəri">...)}`. Nisyə blokunda "Bu satışdan borc"=`fmtMoney(totalAmount)`, "Cari ümumi qalıq borc"=`matchedCustomer.remainingDebt`. |
| 2.5 | Məlumat kartı: satıcı, tarix-saat, satış № | ⚠️ Blocked (canlı) | `Card title="Məlumat"` → `seller`, `saleDateTime(createdAt)`, `saleInvoiceNumber(sale)` ("SF-yyyyMMdd-XXXXXX" formatı, `lib.ts:60-65`). |
| 2.6 | Alt sticky panel (Drawer `footer` prop), Düzəliş/Sil `sales.manage` ilə | ⚠️ Blocked (canlı scroll) | `Drawer.tsx` (dəyişməyib) — `footer` verildikdə panel `flex flex-col`, orta hissə `overflow-y-auto`, footer `shrink-0` (sabit qalır). `SaleDetailDrawer` footer-də 4 düymə, Düzəliş/Sil `{canManage && (...)}` ilə şərtlənib. |
| 2.7 | WhatsApp deaktiv, `title` ilə səbəb | ⚠️ Blocked (canlı hover) | `canWa=!!customerId && !!phone.trim()`; `waDisabledReason` — müştəri yoxdursa/telefon yoxdursa fərqli mətn; düymədə native `disabled` **yoxdur** (qəsdən), `aria-disabled` + `title` + klik-mühafizəsi. |
| 3.1 | ActionMenu-da "WhatsApp-la göndər", `useInvoiceWhatsApp().send()` | ✅ (kod) | `SalesJournal.tsx:113-152` `buildMenuItems` — `WhatsAppIcon`, `onClick: () => void sendInvoiceWa(...)`, `useInvoiceWhatsApp` hook-u dəyişməyib (mövcud, əvvəlki tapşırıqlarda test edilib). |
| 3.2 | Müştəri/telefon yoxdursa deaktiv + tooltip | ⚠️ Blocked (canlı hover) | `disabled: !canWa || waSending`, `title` müştəri/telefon fərqinə görə mətn seçir. `ActionMenu.tsx` review düzəlişi (bax aşağı) tooltipin faktiki görünməsini təmin edir. |
| 3.3 | `USE_MOCK`-da info toast | ⚠️ Blocked (canlı+mock rejim) | `useInvoiceWhatsApp.ts:48-51` — dəyişməyib, `USE_MOCK` true-dursa `push("info", ...)`. |
| 4.1 | `npm run build` xətasız | ✅ Pass | Aşağıda — real icra edildi. |
| 4.2 | Filtr/axtarış/PDF/Düzəliş/Sil pozulmayıb | ✅ Pass (statik) | Bu fayllarda filtr/axtarış/PDF/Düzəliş/Sil-ə aid kod məntiqi bu PR-da dəyişməyib (diff-də yalnız yuxarıdakı sətirlər var); `ActionMenu`/`DataTable` API-ları geriyə uyğun (aşağıdakı regression bölməsinə bax). |
| 4.3 | 375px-də başlıq/kartlar tam eni, alt panel sticky | ⚠️ Blocked (canlı, 375px) | Tailwind class-ları mövcuddur (`w-full` strukturu, `footerBtnCls="w-full min-w-0 px-3 text-sm"`, `min-h-[52px]`, `pb-[calc(env(safe-area-inset-bottom)+0.75rem)]`) — review commit-də "375px alt panel daşması" ayrıca düzəldilib (bax review qeydi), amma faktiki 375px render skrinşotla yoxlanmadı. |

## Test case nəticələri

| TC | Qısa təsvir | Nəticə | Statik analiz / faktiki tapıntı |
|---|---|---|---|
| TC-01 | Desktop sətirdən açılma | ⚠️ Blocked (canlı) | Kod zənciri tam (bax AC 1.1). Brauzer klik testi edilmədi. |
| TC-02 | Hesab riyaziyyatı (endirimli, isManual=false) | ⚠️ Blocked (canlı) | Mock seed nümunəsi (`seed.ts:456-490`, `i===2`, `discount=5`) əl ilə hesablandı: `salePrice×q=subtotal=Cəm`; `Cəm−5=totalAmount=YEKUN`; `Maya cəmi=purchasePricePerUnit×q`, `Xərc=(costPerUnit−purchasePricePerUnit)×q` ⇒ `Maya cəmi+Xərc=costPerUnit×q` ⇒ `YEKUN−(Maya cəmi+Xərc)=totalAmount−costPerUnit×q=profit` — seed-dəki `profit: total - p.realCostPerUnit * q` düsturu ilə **dəqiq üst-üstə düşür**. Riyazi ardıcıllıq düzgündür, amma real ekranda rəqəmlərin göründüyü təsdiqlənmədi. |
| TC-03 | Sərbəst mal xərc sətirləri | ⚠️ Blocked (canlı) | Mock nümunə (`seed.ts:526-538`: alış=5, xərc=[Yol pulu 4, Paket/Qutu 2]=6, q=2, salePrice=15): `YEKUN=30`, `Maya cəmi=5×2=10`, `Xərc=6`, `30−10−6=14`, seed-dəki `profit:(15-8)*2=14` ilə **üst-üstə düşür**. `SaleDetailDrawer.tsx:277-291` xərc sətirlərini ayrıca sadalayır. |
| TC-04 | Müştəri kartı + Nisyə borc | ⚠️ Blocked (canlı) | Kod düzgün bağlanıb (AC 2.4), mock-da Nisyə nümunəsi var (`seed.ts:458`, `cus:"cus_1"`), amma canlı ekranda görünüş yoxlanmadı. |
| TC-05 | Alt sticky panel, scroll | ⚠️ Blocked (canlı scroll) | `Drawer.tsx` flex-column + `shrink-0` naxışı (dəyişməyib, pre-existing infra) — struktur olaraq düzgündür. |
| TC-06 | WhatsApp jurnal menyusundan | ⚠️ Blocked (canlı+şəbəkə) | `useInvoiceWhatsApp.ts` dəyişməyib; `POST /api/sales/{id}/invoice-link` → `wa.me` axını kod səviyyəsində mövcud. Sandbox şəbəkə icazəsi olmadığı üçün real çağırış/yeni tab açılması test edilmədi. |
| TC-07 | Müştərisiz WhatsApp deaktiv + tooltip | ⚠️ Blocked (canlı hover) | `ActionMenu.tsx` diff-i **dəqiq bu tələbi** həll edir: native `disabled` atributu silinib (çünki brauzerlərdə disabled düymələr `title` tooltip-ini göstərmir və fokus almır), `aria-disabled` + `title={item.title}` + `onClick` daxilində `if (isDisabled) return;` qorunması əlavə olunub. Kod düzəlişi məntiqən doğrudur, amma faktiki hover-də tooltip-in görünməsi brauzerdə test edilmədi. |
| TC-08 | Düymələr drawer açmır (stopPropagation) | ⚠️ Blocked (canlı klik) | Kod: hər iki (desktop/mobil) əməliyyat sahəsi `stopPropagation` ilə bürünüb (bax AC 1.3). |
| TC-09 | Naməlum qazanc (profit==null) | ⚠️ Blocked (canlı) | Mock nümunəsi mövcuddur (`seed.ts:504-514`, `profit:null`). Kod: `sale.profit==null ? "naməlum"(text-stone-400) : ...` — rənglənmə yoxdur, "0" ilə qarışdırılmır (AC-yə tam uyğun). |
| TC-10 | Silinmiş müştəri (Nisyə) | ⚠️ Blocked (canlı) | `deletedCustomer` şərti FE#23-dən dəyişməyib, sadəcə yeni "Müştəri" kartına köçürülüb. Mövcud mock seed-də bu konkret ssenari (customerId dolu, customerName boş) üçün hazır nümunə tapılmadı — kod məntiqi statik oxundu, amma nə mock, nə canlı backend ilə faktiki render yoxlanmadı. |
| TC-11 | Mobil 375px toxunma | ⚠️ Blocked (canlı, viewport) | Kod strukturu (AC 1.4/4.3) uyğundur, faktiki 375px skrinşot/toxunma testi edilmədi. |
| TC-12 | WhatsApp linki alınmadı (xəta) | ⚠️ Blocked (canlı+şəbəkə) | `useInvoiceWhatsApp.ts` `catch` blokunda `push("error", ...)` — kod məntiqi doğrudur, real xəta ssenarisi simulyasiya edilmədi. |
| TC-13 | `sales.manage` yoxdursa | ⚠️ Blocked (canlı, fərqli rol) | `SaleDetailDrawer.tsx` footer-də Düzəliş/Sil `{canManage && (...)}` ilə tamamilə gizlədilir (deaktiv deyil, render olunmur — AC tələbinə uyğun "gorunmur/deaktivdir" hər ikisini əhatə edir), Qaimə/WhatsApp şərtsiz qalır. `useCan()("sales.manage")` dəyişməyib. Fərqli rollu istifadəçi ilə canlı login test edilmədi. |
| TC-14 | Regression (filtr/axtarış/PDF/Düzəliş/Sil, digər cədvəllər) | ✅ Pass (statik, yüksək əminlik) | `grep onRowClick` → yalnız `DataTable.tsx` və `SalesJournal.tsx`-də (Customers/Products/Expenses/Suppliers cədvəlləri `onRowClick` verib istifadə etmir → `role`/`tabIndex`/`onClick`/`onKeyDown` bu cədvəllərdə `undefined` olaraq qalır, DOM-a əlavə olunmur). `grep disabled:` (ActionMenu item) → yalnız `SalesJournal.tsx`-də (WhatsApp bəndi) — digər 4 cədvəlin `ActionMenu` çağırışlarında `disabled` heç yerdə göndərilmir, deməli `ActionMenu`-nun `visible`-filter-dən `items.length===0` yoxlamasına keçidi onlara təsir etmir (bütün item-lar əvvəlki kimi görünür/aktivdir). Filtr/axtarış/PDF/Düzəliş/Sil-in öz məntiqi bu PR-nın diff-ində yoxdur (yalnız `buildMenuItems` refaktoru — eyni `Düzəliş`/`Sil` `onClick`-ləri saxlanılıb). Bu, kodun statik/deterministik təhlili ilə tam əminliklə təsdiqlənə bilən bir sahədir (canlı render tələb etmir). |
| TC-15 | `npm run build` | ✅ Pass | Aşağıda tam çıxış. |

## npm run build

```
> sederek-sistem@0.0.0 build
> tsc && vite build

vite v6.4.3 building for production...
✓ 2776 modules transformed.
dist/index.html                  0.83 kB │ gzip:   0.45 kB
dist/assets/index-*.css         44.76 kB │ gzip:   8.09 kB
dist/assets/index-*.js       1,168.61 kB │ gzip: 327.46 kB
✓ built in 4.86s
```
Xəta yoxdur. Qeyd: `package.json`-da ayrıca `lint` scripti yoxdur — `npm run build` yalnız `tsc` (TypeScript) + `vite build`-dən ibarətdir, literal ESLint addımı içərmir (PR şərhindəki "TypeScript + ESLint" ifadəsi bir qədər qeyri-dəqiqdir, amma bu bug deyil — layihənin əvvəlki vəziyyəti ilə eynidir, bu PR-a aid deyil).

## Kod baxışı ilə aşkarlanan əlavə müşahidələr (bug deyil, diqqətə çatdırılır)

1. **ConfirmModal + açıq Drawer eyni anda (z-index/DOM sırası asılılığı).** `SaleDetailDrawer`-in yeni "Sil" düyməsi indi `SaleDetailDrawer` açıq ikən `ConfirmModal`-ı (silmə təsdiqi) göstərir. Həm `Drawer.tsx`, həm `Modal.tsx` `fixed inset-0 z-50` istifadə edir — eyni z-index-də CSS stacking DOM sırasına görə həll olunur (`ConfirmModal` JSX-də `SaleDetailDrawer`-dən sonra render olunduğu üçün üstdə görünməlidir). Bu, əvvəllər (FE#24-dən əvvəl) test edilməmiş yeni kombinasiyadır (əvvəllər Sil düyməsi yalnız jurnal sətir menyusundan açılırdı, drawer arxa planda deyildi). Kod məntiqi düzgün görünür (DOM sırası dəstəkləyir), lakin canlı brauzerdə vizual təsdiqi tövsiyə olunur.
2. Silinən satış hazırda açıq detal draweri ilə eynidirsə, drawer avtomatik bağlanır (`SalesJournal.tsx` `handleDelete`-də `if (detailId === deleteTarget.id) setDetailId(null);`) — yaxşı tapılmış kənar hal, ayrıca test tələb edir (TC-13/TC-05-in davamı kimi canlı yoxlanmalıdır).

## Tapılan buglar

**0 bug.** Statik kod analizində, diff baxışında və mock seed data üzərində əl ilə edilmiş hesablamalarda heç bir uyğunsuzluq/defekt aşkarlanmadı.

## İcra olunan əmrlər

```bash
python scripts/task_manager.py get --id FE#24
gh issue view 24 --comments
git -C ".../frontend" fetch origin
git -C ".../frontend" diff origin/task/FE#23-satis-duzelisler...HEAD --stat
git -C ".../frontend" diff origin/task/FE#23-satis-duzelisler...HEAD -- <hər dəyişən fayl>
npm run build                       # PASS, xətasız, 4.86s
dotnet run --project backend/src/MayaPro.WarehouseApi.Api/... --urls http://localhost:8080
                                     # backend uğurla başladı ("Now listening on: http://localhost:8080")
curl / node fetch / netstat         # sandbox təsdiqi tələb etdi, avtomatik verilmədi → bloklandı
grep onRowClick / "disabled:" -r src  # regression üçün cədvəllər arası istifadə axtarışı
```

## Əhatə olunmayan sahələr

- **Canlı brauzer/interaktiv test** (sətirə klik, drawer açılışı, hover tooltip, scroll-da sticky panel, 375px viewport, WhatsApp yeni tab, toast-lar, rol dəyişərək icazə testi) — bu sessiyada əlçatan alət dəstində browser automation (Playwright/Cypress) yoxdur və şəbəkə əmrləri (curl/fetch/netstat) sandbox tərəfindən təsdiq tələb edərək bloklandı. TC-01…TC-13 buna görə "⚠️ Blocked" işarələnib, "keçdi" kimi qeyd edilməyib.
- **Backend runtime davranışı** — backend lokal işə salındı və uğurla dinləməyə başladı, lakin frontend dev server-dən ona real sorğu göndərilə bilmədi (şəbəkə bloku). Backend faylları oxunmadı/dəyişdirilmədi (tapşırığa uyğun).
- **Vizual/UI regressiya** (skrinşot müqayisəsi) aparılmadı.
- **a11y avtomatlaşdırılmış audit** (axe/Lighthouse) işə salınmadı — yalnız `role`/`tabIndex`/`aria-*` atributlarının koddakı mövcudluğu yoxlanıldı.
- Layihədə test framework (Vitest/Playwright) olmadığından avtomatlaşdırılmış unit/e2e test yazılmadı (tapşırıq təlimatına uyğun, yeni kitabxana quraşdırılmadı, tətbiq kodu dəyişdirilmədi).

## Tövsiyələr

- Bu PR-ı merge etməzdən əvvəl, brauzer/şəbəkə əlçatan olan mühitdə (developer maşını və ya CI) TC-01, TC-02, TC-06, TC-07, TC-11, TC-13-ü qısa (10-15 dəq) əl ilə smoke-test etmək tövsiyə olunur — bunlar istifadəçi təcrübəsinə birbaşa təsir edən, statik analizlə tam təmin oluna bilməyən sahələrdir.
- Yuxarıdakı "əlavə müşahidə #1" (ConfirmModal üzərində açıq Drawer) — Sil axınını canlı yoxlayarkən xüsusi diqqət yetirilsin (modal drawer arxasında/önündə düzgün görünürmü).
- Layihəyə gələcəkdə Playwright (heç olmasa smoke-test səviyyəsində) inteqrasiyası bu cür "sətirə klik → drawer" ssenarilərinin avtomatik regressiya nəzarətini əhəmiyyətli dərəcədə yaxşılaşdırardı (bu QA sessiyasının əhatəsindən kənar qərar).
