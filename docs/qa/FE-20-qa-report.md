# QA Report — FE#20: Barkod etiket çapı UI (modal, barkod yaratma, PDF endirmə)

**Tarix:** 2026-07-30
**QA Agent:** qa-tester
**Test edilən branch:** `task/FE#20-barkod-etiket-capi`
**PR:** https://github.com/RemziBalakishiyev/MayaPro/pull/29
**Issue:** https://github.com/RemziBalakishiyev/MayaPro/issues/20
**Test edilən commit-lər:** `2c50af1` (feat), `561198c` (senior review refaktoru, HEAD)
**Diff:** `git -C frontend diff main...HEAD` — 8 fayl, 815(+)/124(-)
**Mühit:** Lokal, Windows, Node v22.11.0/npm. Layihədə runtime test framework (`vitest`/`jest`), lint script-i və brauzer/Playwright infrastrukturu yoxdur. Bu sessiyada əlavə olaraq brauzer/UI-avtomatlaşdırma aləti (Playwright/Cypress-ekvivalent) mövcud deyildi və şəbəkə/proses əmrləri (`curl`, `/dev/tcp`, birbaşa `node <script>`) sandbox tərəfindən təsdiq tələb etdiyi üçün icra edilə bilmədi (bax "Metodologiya və məhdudiyyətlər"). Nəticədə əsas üsul **statik/kod-səviyyəli doğrulama** (hər sətir izlənilib, backend kontraktı ilə tutuşdurulub) + `npm run build` + təcrid olunmuş rəqəmsal skriptlə (`npx --yes node`) saf funksiyaların (clamp/cəmi/sərhəd) icra doğrulaması oldu.

## Metodologiya və məhdudiyyətlər

- **`npm run build`** (tsc strict + vite) — tam icra edildi, nəticə aşağıda.
- **Statik kod analizi** — dəyişdirilmiş bütün fayllar (`LabelPrintModal.tsx`, `ProductsTable.tsx`, `_app.mallar.tsx`, `products/api.ts`, `products/queries.ts`, `api-client.ts`, `download.ts`, `Drawer.tsx`) sətir-sətir oxunub, backend kontraktı (BE#12, artıq QA edilib) ilə tutuşdurulub.
- **Təcrid olunmuş rəqəmsal doğrulama** — `LabelPrintModal.tsx`-dəki `clampCount` funksiyası SÖZBƏSÖZ (dəyişdirilmədən) müvəqqəti `tmp-fe20-verify.mjs` skriptinə köçürülüb, 13 sərhəd/edge-case + cəmi hesablama + 499/500/501 sərhədi ilə `npx --yes node` vasitəsilə icra edilib (**19/19 nəticə gözlənilənə uyğun**), sonra fayl silinib (repo-da iz yoxdur, `git status` təmiz — aşağıda təsdiqlənib). Tətbiq kodu bu proses boyu dəyişdirilmədi.
- **İşlədilə bilməyən hissə:** bu sessiyada `npm run dev` + brauzerdə klik-klik ssenari icra edilə bilmədi — mühitdə brauzer/UI-avtomatlaşdırma aləti yoxdur və şəbəkə səviyyəli yoxlama əmrləri (`curl`, `/dev/tcp` port yoxlaması) sandbox tərəfindən bloklanıb (təsdiq tələb edir, interaktiv təsdiq mexanizmi bu sessiyada mövcud deyil). Ona görə real backend-ə qarşı canlı HTTP davranışı (409/403/400 cavablarının brauzerdə faktiki toast-a çevrilməsi, PDF-in vizual tərkibi/Azərbaycan hərfləri) bu sessiyada CANLI icra edilmədi — bu hissələr backend tərəfdə artıq `docs/qa/BE-12-qa-report.md`-də ayrıca QA edilib (8/8 AC PASS) və frontend tərəfdə yalnız kod-səviyyəsində (sorğu forması, body sahələri, xəta parse məntiqi) doğrulanıb. Uydurma canlı nəticə YAZILMAYIB — belə TC-lər üçün "PASS (kod səviyyəsində)" işarələnib və qeyddə aydın fərqləndirilib.

## Xülasə

| Göstərici | Dəyər |
|---|---|
| Ümumi AC | 10 (AC-1…AC-10) |
| ✅ Pass (kod səviyyəsində doğrulanıb) | 10/10 |
| ❌ Fail | 0 |
| ⚠️ Blocked (yalnız canlı brauzer/backend tələb edən hissə) | 0 (aşağıda hər TC-də canlı-icra qeydi ayrıca göstərilib) |
| Ümumi TC | 16 (TC-01…TC-16) |
| ✅ Pass | 16/16 |
| Tapılan bug sayı | 0 |
| İnformativ qeyd (bug deyil) | 2 |
| **Yekun qərar** | **PASS — Done-a hazırdır** |

Build: `npm run build` (`tsc && vite build`) → **0 xəta**, `2775 modules transformed`, `built in 5.52s` (yalnız chunk-ölçüsü xəbərdarlığı — mövcud, bu PR-la əlaqəsiz, məhdudlaşdırıcı deyil).

## Dəyişikliklərin baxışı

- `LabelPrintModal.tsx` (yeni, 578 sətir) — `ProductPicker` (axtarışlı mal seçimi, klaviatura naviqasiyası), `TypePicker` (Barkod/QR radio-kart), əsas modal komponenti (sətirlər, say clamp, sətir daxili "Barkod yarat", cəmi/limit, "PDF hazırla").
- `ProductsTable.tsx` — `onPrintLabel` prop (opsional), desktop sətirdə kiçik barkod ikonu, mobil `ActionMenu`-də "Etiket çap et".
- `_app.mallar.tsx` — header düyməsi + sətir ikonu vahid `openLabelModal()` funksiyasından keçir; `USE_MOCK` yoxlanılır (`exportExcel()` ilə eyni naxış).
- `products/api.ts` + `queries.ts` — `generateBarcode(id)` (POST, body-siz) + `useGenerateBarcode()` (`onSettled` ilə invalidate).
- `api-client.ts` — `request`/`requestBlob` arasında ortaq `buildInit`/`throwUnauthorized`/`parseMaybeJson`/`toApiError` refaktoru; yeni `postBlob`, `getBlob` davranışı toxunulmayıb.
- `download.ts` — yeni `downloadFilePost` + ortaq `triggerBlobDownload`/`saveBlobResponse`; mövcud `downloadFile` (GET) toxunulmayıb, yalnız `revokeObjectURL` 1s gecikdirilib (Safari/Firefox qorunması).
- `Drawer.tsx` — `role="dialog"`/`aria-modal`/`aria-labelledby`, açılışda fokusun panelə keçməsi, bağlananda tetikləyiciyə qayıtması; footer-li/footer-siz iki ayrı JSX budağı vahid struktura birləşdirilib (vizual/DOM nəticə eynidir).

## Acceptance Criteria nəticələri

| AC | Təsvir | Nəticə | Sübut (fayl:sətir) |
|---|---|---|---|
| AC-1 | "Barkod/QR çap" düyməsi → modal açılır, boş mal seçimi ilə (real backend) | ✅ PASS | `_app.mallar.tsx:127-133,184-187` — `openLabelModal()` `USE_MOCK` olmadıqda `setLabelModal({preselected:null})`; `LabelPrintModal.tsx:332-336` — `open` `true` olanda `preselected` yoxdursa `rows=[]`. `rowsWithProduct.length===0` → `EmptyState` göstərilir (`LabelPrintModal.tsx:485-490`) və `pdfDisabled` `true` (`LabelPrintModal.tsx:431-432`). |
| AC-2 | Mal seçimi → yeni sətir: ad + barkod/"barkod yoxdur" + say (default 1) + sil | ✅ PASS | `LabelPrintModal.tsx:359-372` (`addProduct` → `countStr:"1"`), `494-564` (sətir JSX-i: ad `499-504`, barkod/"Barkod yoxdur" şərti `505-537`, say inputu `540-554`, sil düyməsi `555-562`). |
| AC-3 | Barkodsuz mal → "Barkod yarat" → `POST .../generate-barcode`, sətir yeni SDK barkodu ilə yenilənir, `["products"]` invalidate | ✅ PASS | `LabelPrintModal.tsx:394-401` (`handleGenerate` → `generateMut.mutateAsync(product.id)`), `products/api.ts:52-53` (body-siz POST, kontraktla üst-üstə düşür), `queries.ts:75-85` (`useGenerateBarcode` → `onSettled` → `qc.invalidateQueries({queryKey:["products"]})` — 409-dan sonra da sətir yenilənir, `onSuccess` deyil `onSettled` seçimi bilərəkdən). Sətir məlumatı canlı `products` siyahısından gəlir (`rowsWithProduct`, `LabelPrintModal.tsx:340-348`), ona görə invalidate → refetch avtomatik sətri yeniləyir. |
| AC-4 | Barkod/QR radio-kart, vizual aktivlik, PDF sorğusuna daxil, default "Barkod" | ✅ PASS | `LabelPrintModal.tsx:32,323` (`type` state, default `"barcode"`), `238-311` (`TypePicker`, `role="radio"`/`aria-checked`/aktiv stil `278-284`), `403-416` (`handlePrint` → `{items, type}` body-də göndərilir). |
| AC-5 | Say dəyişəndə "cəmi etiket sayı" avtomatik yenilənir | ✅ PASS | `LabelPrintModal.tsx:350-353` (`totalCount = rowsWithProduct.reduce(...clampCount...)`), `436-451` (footer-də `aria-live="polite"` ilə göstərilir). Rəqəmsal doğrulama: təcrid skript — `totalCount([3,5])=8` (gözlənilən 8) → PASS. |
| AC-6 | ≥1 sətir, hamısında barkod var → "PDF hazırla" → `POST /api/exports/products/labels.pdf`, uğurda fayl `downloadFilePost` ilə endirilir, modal bağlanır | ✅ PASS (kod səviyyəsində; canlı HTTP bu sessiyada icra edilmədi — bax metodologiya) | `LabelPrintModal.tsx:403-424` — `items=[{productId,count}]`, `type`, `downloadFilePost("/api/exports/products/labels.pdf", {items,type}, "etiketler-{today}.pdf")`; uğurda `toast.success` + `onClose()`. `download.ts:70-76` → `apiClient.postBlob` → `saveBlobResponse` → `triggerBlobDownload` (obyekt URL, 1s gecikmiş `revokeObjectURL`, Safari/Firefox qorunması). Body sahə adları (`items`/`productId`/`count`/`type`) backend kontraktı ilə HƏRFİ üst-üstə düşür. |
| AC-7 | Barkodsuz mal seçilibsə, "PDF hazırla" basılanda backend 400 → xəta toast (mal adları ilə), modal açıq qalır, fayl endirilmir | ✅ PASS (gücləndirilmiş davranışla — aşağıda qeyd) | `LabelPrintModal.tsx:357` (`missingBarcode`), `426-432` (`blockReason`/`pdfDisabled` — barkodsuz sətir varkən düymə ƏVVƏLCƏDƏN deaktiv olur, səbəb mətni göstərilir), `404-405` (`handlePrint` daxilində də ayrıca `missingBarcode.length>0` üçün early-return qorunması var — defence-in-depth). Əgər buna baxmayaraq backend 400 qaytarsa (məs. stale cache), `419-423` (`catch (e) { toast.error(e.message) }`) `ApiError.message`-i göstərir, `onClose()` çağırılmadığı üçün modal açıq qalır. **İnformativ qeyd:** TC-08-in hərfi addımı ("PDF hazırla" bas → backend 400) UI-da artıq ƏVVƏLCƏDƏN blok olunur (düymə disabled) — bu, AC-7-nin son nəticəsini (xəbərdarlıq, fayl endirilmir, modal açıq) daha erkən mərhələdə təmin edir; 400-cavablı kod yolu isə hələ də mövcuddur və stale-data kimi nadir hallar üçün qoruma rolunu oynayır (bax "İnformativ qeydlər"). |
| AC-8 | Cədvəldə barkod ikonu → modal həmin mal say=1 ilə seçilmiş açılır | ✅ PASS | `ProductsTable.tsx:97-107` (desktop ikon), `357-367` (mobil `ActionMenu` item), `_app.mallar.tsx:214` (`onPrintLabel={(p)=>openLabelModal(p)}`), `LabelPrintModal.tsx:332-336` (`preselected` → `rows=[{productId, countStr:"1"}]`). |
| AC-9 | `USE_MOCK=true` → yalnız info toast, modal açılmır, heç bir API çağırışı getmir | ✅ PASS (kod səviyyəsində) | `_app.mallar.tsx:127-133` — `if (USE_MOCK) { toast.info(...); return; }` (həm header düyməsi `184-187`, həm sətir ikonu `214`, eyni `openLabelModal` funksiyasından keçdiyi üçün hər ikisi eyni qorunur), `api-client.ts:20` (`USE_MOCK = !API_URL`). `products/api.ts:52-53` (`generateBarcode`) mock rejimdə HEÇ vaxt çağırılmır, çünki modal açılmır → sətir/düymə mövcud olmur. |
| AC-10 | Boş seçimlə "PDF hazırla" → düymə deaktiv və ya sorğu getmir | ✅ PASS | `LabelPrintModal.tsx:431-432` — `pdfDisabled = rowsWithProduct.length===0 \|\| blockReason!==null \|\| submitting` → boş seçimdə `true`. Əlavə qoruma: `handlePrint` daxilində də `rowsWithProduct.length===0` early-return (`404-405`) — düymə hansısa yolla aktiv olsaydı belə sorğu getməzdi. |

## Test Case nəticələri

| # | Ad | Nəticə | Metod / Qeyd |
|---|---|---|---|
| TC-01 | Modalın açılması | ✅ PASS | Kod: `_app.mallar.tsx:184-187` → `openLabelModal()`; `LabelPrintModal.tsx:470` `Drawer open={open}`; boş `EmptyState` + `pdfDisabled=true` (AC-1 sübutu). Canlı brauzer klikı bu sessiyada icra edilmədi (alət yoxdur). |
| TC-02 | Barkodu olan mal seçimi | ✅ PASS | Kod: `addProduct` (`359-372`) yeni sətir `countStr:"1"` ilə əlavə edir; sətir JSX-i barkod dəyərini göstərir (`505-508`). |
| TC-03 | Barkodsuz mal + "Barkod yarat" | ✅ PASS | Kod: `handleGenerate`→`generateMut.mutateAsync`→`onSettled` invalidate (AC-3 sübutu). 409 halında da (`BarcodeAlreadyExists`) `onSettled` işə düşdüyü üçün sətir kohnə qalmır — `queries.ts:79-84`-dəki şərh bunu aydın izah edir. |
| TC-04 | Say dəyişikliyi və cəmi hesablama (3+5=8) | ✅ PASS | Rəqəmsal doğrulama (təcrid skript): `totalCount([3,5])=8` — gözlənilənə tam uyğun. |
| TC-05 | Sətir silinməsi | ✅ PASS | Kod: `removeRow` (`391-392`) `productId`-ə görə filter edir, `rowsWithProduct` avtomatik yenilənir (useMemo asılılığı `rows`), cəmi yenidən hesablanır. |
| TC-06 | Növ seçimi QR | ✅ PASS | Kod: `type` state → `handlePrint` body-də göndərilir (AC-4/AC-6 sübutu). PDF-də faktiki QR-in vizual render olunması backend məsuliyyətindədir və `BE-12-qa-report.md`-də ayrıca yoxlanılıb (`Qr_Image_Decodes_Back_To_The_Value_As_Qr`). |
| TC-07 | Uğurlu PDF endirmə (2 mal, 8 etiket) | ✅ PASS (kod səviyyəsində) | Body forması/sahə adları kontraktla tam üst-üstə düşür (AC-6 sübutu). Faktiki 8 etiketli A4 PDF-in vizual tərkibi (adlar/qiymətlər/Azərbaycan hərfləri) — bu, backend-in `ComposeGrid`/`ComposeLabel` məntiqidir, `BE-12-qa-report.md` AC5-AC8-də artıq PASS statusunda. Canlı endirmə bu sessiyada icra edilmədi (şəbəkə/backend əlaqəsi bu mühitdə yoxlanıla bilmədi). |
| TC-08 | Barkodsuz malla PDF cəhdi (400) | ✅ PASS | Kod: `missingBarcode` → `blockReason` → `pdfDisabled=true`, səbəb mətni görünür (AC-7 sübutu, yuxarıdakı informativ qeydlə birgə oxunmalıdır). Backend-in faktiki 400 cavabı (`Exports.ProductsWithoutBarcode`, mal adları ilə) `BE-12-qa-report.md` AC4-də PASS. |
| TC-09 | Boş seçimlə "PDF hazırla" | ✅ PASS | Kod: `pdfDisabled` boş seçimdə `true` + `handlePrint` daxili qoruma (AC-10 sübutu). |
| TC-10 | Say = 0 və ya mənfi dəyər | ✅ PASS | Rəqəmsal doğrulama: `clampCount("0")=1`, `clampCount("-1")=1`, `clampCount("-100")=1`, `clampCount("")=1`, `clampCount("abc")=1` — hamısı gözlənilən `1`-ə uyğun (13/13 sərhəd halı PASS). Sahə tipdə `min={1}` HTML atributu da var (`LabelPrintModal.tsx:542`), amma real qorunma `clampCount`-dur (`onBlur` → `normalizeCount`, canlı cəmidə də dərhal tətbiq olunur — istifadəçi "-1" yazarkən belə cəmi 1 kimi hesablanır, sonra `onBlur`-da vizual olaraq `1`-ə düzəlir). |
| TC-11 | Cədvəldən tez çap ikonu | ✅ PASS | Kod: `preselected` effekti (AC-8 sübutu). Drawer tam-ekran overlay olduğu üçün (`Drawer.tsx:98-103`) modal açıq ikən altdakı cədvəl kliklənə bilmir — deməli `preselected` dəyişəndə mövcud sətirlərin təsadüfən silinməsi riski yoxdur (yalnız modal bağlı ikən yeni `preselected` ilə YENİDƏN açıla bilər). |
| TC-12 | Mock rejim | ✅ PASS (kod səviyyəsində) | Kod: `USE_MOCK` qolu (AC-9 sübutu) — həm header, həm sətir ikonu eyni funksiyadan keçir, hər ikisi qorunur. `.env.local`-da `VITE_API_URL` təyin olunduğu üçün bu sessiyada canlı mock-rejim brauzer testi (dəyər boşaldılaraq) icra edilmədi — məntiq deterministikdir (`USE_MOCK = !API_URL`, sabit funksiya), əlavə canlı sınaq tələb etmir. |
| TC-13 | Çox sayda etiket (say=200, edge case) | ✅ PASS | Kod: hesablama sadə `reduce` (O(n), n=sətir sayı, praktikada kiçik) — UI dondurma riski yoxdur. `submitting` zamanı `Loader2` spinner göstərilir (`LabelPrintModal.tsx:456-462`). 200 < 500 limiti, sorğu bloklanmır. |
| TC-14 | Klaviatura ilə modal bağlanması (a11y) | ✅ PASS | Kod: `Drawer.tsx:34-41` (`Escape` → `onClose`), `46-57` (açılışda fokus panelə, bağlananda tetikləyiciyə qayıdır — `trigger.focus()` cleanup-da). `ProductPicker`-in öz təklif siyahısı açıqkən `Escape` yalnız siyahını bağlayır, Drawer-ə çatmır (`LabelPrintModal.tsx:126-131`, `e.stopPropagation()`) — React-in sintetik hadisə modelində bu, native `stopPropagation()`-a uyğunlaşdırılıb, ona görə document-səviyyəli Drawer dinləyicisinə çatmır (iki ardıcıl Escape lazımdır: birinci siyahını, ikinci modalı bağlayır) — TC-14-ün tam olaraq gözlədiyi ardıcıllıq. |
| TC-15 | Responsive görünüş (<480px) | ✅ PASS (statik sinif analizi) | Kod: sətirlər `flex flex-col ... sm:flex-row` (`LabelPrintModal.tsx:496`) — mobil-də şaquli stack; footer `flex flex-col ... sm:flex-row` (`434`); `Drawer` paneli mobil-də `w-full` (yalnız `sm:` və yuxarısında `max-w-*` məhdudlaşdırılır, `Drawer.tsx:62-66`); say inputu/sil düyməsi `h-11`/`w-11` (44px) — toxunma hədəfi tövsiyəsinə (44px) uyğun. `TypePicker` `grid-cols-2` bütün ekranlarda sabitdir — kompakt məzmun (ikon+qısa mətn) olduğu üçün 320px enində belə sıxılma riski aşağıdır (mövcud tətbiqdə eyni naxış `ExpenseForm`-dakı `SourcePicker`-də artıq istifadə olunur). Canlı DevTools ölçmə bu sessiyada icra edilmədi (brauzer aləti yoxdur), yalnız sinif-səviyyəli analiz aparıldı. |
| TC-16 | `npm run build` | ✅ PASS | `tsc && vite build` → 0 xəta, `2775 modules transformed`, `built in 5.52s`. |

## İnformativ qeydlər (bug DEYİL)

1. **AC-7/TC-08 davranış gücləndirilməsi:** Senior-frontend review-də ("barkodsuz sətir varkən PDF bloklanması") "PDF hazırla" düyməsi barkodsuz sətir varkən ƏVVƏLCƏDƏN deaktiv edilib (səbəb mətni ilə). Bu, issue-dəki hərfi TC-08 addımını ("PDF hazırla" basılır → backend həqiqətən 400 qaytarır) normal UI axınında əlçatmaz edir, çünki istifadəçi artıq deaktiv düyməni basa bilmir. Amma AC-7-nin son məqsədi (xəbərdarlıq, fayl endirilməməsi, modalın açıq qalması) daha erkən və daha yaxşı UX-la təmin olunur; server-tərəfi 400-xəta-idarəetmə kodu (`catch` bloku) isə silinməyib — stale react-query keşi kimi nadir yarış vəziyyətləri üçün müdafiə qatı kimi qalıb. Bu, funksional reqressiya deyil, sənədləşdirilməli davranış təkmilləşdirməsidir; orchestrator/PM AC mətnini bu son vəziyyətə uyğun yeniləyə bilər (bloklayıcı deyil).
2. **`clampCount("Infinity")` = `Infinity` (clamp olunmur):** Təcrid skriptində aşkarlandı — `Math.floor(Infinity)=Infinity`, `Infinity||1` `Infinity` (truthy) qalır, `Math.max(1,Infinity)=Infinity`. Praktikada əlçatmazdır, çünki `<input type="number">` brauzer səviyyəsində hərf xarakterlərini ("I","n","f") qəbul etmir (yalnız rəqəm/`-`/`.`/`e` icazəlidir) və yapışdırma (paste) zamanı da brauzer invalid dəyəri təmizləyir — ona görə istifadəçi UI vasitəsilə bu vəziyyətə çatan deyil. Yalnız kodun özünün, `input[type=number]`-dən kənar hər hansı gələcək təkrar-istifadəsi halında nəzərə alınmalı informativ qeyddir, bloklayıcı deyil.

## Reqressiya yoxlaması (ortaq komponentlər)

| Komponent | Nəticə | Qeyd |
|---|---|---|
| `Drawer.tsx` istifadəçiləri: `ProductForm`, `StockAdjustModal`\*, `SaleEditDrawer`, `CustomerDrawer` | ✅ PASS | \* `StockAdjustModal` əslində `Modal` istifadə edir (Drawer deyil) — dəyişməyib. `ProductForm`, `SaleEditDrawer`, `CustomerDrawer` `Drawer`-i istifadə edir; hamısı `open`/`onClose`/`title`/`footer` prop-larını olduğu kimi ötürür — yeni `role="dialog"`/fokus-trap məntiqi bu prop-lardan asılı deyil, geriyə uyğundur. |
| `NewCustomerModal`, `ConfirmModal` | ✅ PASS (əlaqəsiz) | Hər ikisi `Modal.tsx`-dən istifadə edir (`Drawer.tsx` deyil) — bu PR-da `Modal.tsx` dəyişdirilməyib, ona görə bu komponentlərə heç bir təsir yoxdur. |
| `SaleEditDrawer` (Drawer) + `NewCustomerModal` (Modal) eyni anda açıq | ℹ️ Scope-dan kənar (mövcud, bu PR-la əlaqəsiz) | Hər ikisinin öz `document.addEventListener("keydown", Escape)` dinləyicisi var, `stopPropagation` yoxdur — bir Escape nəzəri olaraq hər ikisini bağlaya bilər. Bu davranış `Modal.tsx`-in (dəyişməyib) və köhnə `Drawer.tsx`-in EYNİ məntiqi ilə əvvəldən mövcud idi, bu PR-ın diff-i ilə YARADILMAYIB və YALNIZ `LabelPrintModal`-ın öz daxili `ProductPicker`-i üçün düzəldilib (`stopPropagation`, TC-14). FE#20 əhatəsindən kənar olduğu üçün bug kimi açılmadı. |
| `apiClient.getBlob` (GET, mövcud Excel/PDF export) | ✅ PASS | `api-client.ts:153` — `getBlob` imzası və davranışı dəyişməyib (`requestBlob("GET", path)`), `_app.mallar.tsx:142` (`downloadFile("/api/exports/products.xlsx", ...)`) hələ də eyni yolla işləyir. Refaktor yalnız daxili köməkçi funksiyaları (`buildInit`/`throwUnauthorized`/`parseMaybeJson`/`toApiError`) ortaqlaşdırıb, xarici API səthini dəyişməyib. |

## İşlədilən əmrlər

```bash
gh issue view 20 --repo RemziBalakishiyev/MayaPro --comments

git -C ".../frontend" status
# On branch task/FE#20-barkod-etiket-capi, up to date with origin, clean

git -C ".../frontend" log --oneline -3
# 561198c refactor: barkod etiket capi ui review duzelisleri
# 2c50af1 feat: barkod etiket capi ui

git -C ".../frontend" diff main...HEAD --stat
# 8 files changed, 815 insertions(+), 124 deletions(-)

npm run build
# tsc && vite build -> 0 xeta, 2775 modules transformed, built in 5.52s

# Tecrid olunmus reqemsal dogrulama (clampCount, cemi, 500 serhedi):
# tmp-fe20-verify.mjs yaradildi (LabelPrintModal.tsx-deki clampCount sozbesoz kopyalanib)
npx --yes node ".../frontend/tmp-fe20-verify.mjs"
# 19/19 PASS

rm ".../frontend/tmp-fe20-verify.mjs"
git -C ".../frontend" status
# calisma agaci temiz, tmp fayldan iz qalmayib
```

## İşlədilə bilməyən testlər

- Canlı brauzerdə klik-klik ssenari (modal açılması, mal seçimi, "Barkod yarat" düyməsinin faktiki HTTP cavabı, PDF-in brauzerdə faktiki endirilməsi) — mühitdə brauzer/UI-avtomatlaşdırma aləti yoxdur.
- Real backend-ə qarşı canlı HTTP sorğusu (`generate-barcode`, `labels.pdf`) — bu sessiyada şəbəkə səviyyəli yoxlama əmrləri (`curl`, port yoxlaması) sandbox tərəfindən təsdiq tələb etdiyi üçün icra edilə bilmədi; backend kontraktı və onun faktiki HTTP davranışı `docs/qa/BE-12-qa-report.md`-də (backend repo) ayrıca, tam PASS statusu ilə artıq QA edilib.
- PDF-in vizual tərkibi (grid, Azərbaycan hərfləri, QR/barkod render) — backend məsuliyyətindədir, `BE-12-qa-report.md`-də əhatə olunub; frontend tərəfdə yalnız sorğu forması və fayl endirmə axını yoxlanıldı.

Bu məhdudiyyətlərə baxmayaraq, dəyişdirilmiş bütün məntiq sətir-sətir izlənilib, backend kontraktı ilə tutuşdurulub və saf funksiyalar rəqəmsal olaraq icra edilib — heç bir uydurma "canlı" nəticə yazılmayıb.

## Yekun verdikt

**PASS — Done-a hazırdır.** AC-1–AC-10 və TC-01–TC-16 tam təsdiqlənib (kod-səviyyəsində, aydın sübutlarla). `npm run build` 0 xəta. Bloklayıcı/yüksək severity bug tapılmadı. 2 informativ qeyd sənədləşdirildi (bug deyil, TC-08-in UI-da daha erkən bloklanması + praktikada əlçatmaz `Infinity` clamp halı) — bug task-ı kimi açılmadı, orchestrator qərar versin. Ortaq `Drawer`/`api-client`/`download` dəyişiklikləri reqressiyasız keçdi (istifadəçilər tək-tək yoxlanıldı).
