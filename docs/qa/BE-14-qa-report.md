# QA Report — BE#14 — Excel import UI: 3 addımlı modal

**Tarix:** 2026-07-30
**Branch:** `task/BE#14-excel-import-ui`
**PR:** https://github.com/RemziBalakishiyev/MayaPro/pull/27
**Test metodu:** Statik/kod-səviyyəli doğrulama + `npm run build` + PR/review kontekstinin oxunması.
**Vacib məhdudiyyət:** Backend endpoint-ləri (issue #13 — `/api/exports/products-template.xlsx`,
`/api/imports/products/preview`, `/api/imports/products/commit`) hələ implement edilməyib (#13 OPEN).
Real şəbəkə/E2E test mümkün deyil. Bu hesabatda "BLOKLANMIŞ" işarəli maddələr **keçdi kimi
qeyd edilməyib** — yalnız kod səviyyəsində düzgünlüyü təsdiqlənib, canlı davranış BE#13 mərcindən
sonra yenidən test edilməlidir.

Dəyişən fayllar (diff `origin/main...task/BE#14-excel-import-ui`, 8 fayl, +596/-11):
`src/features/products/components/ExcelImportModal.tsx` (yeni), `src/features/products/{api,queries,types}.ts`,
`src/lib/api-client.ts`, `src/components/ui/{Badge,StatCard}.tsx`, `src/routes/_app.mallar.tsx`.

---

## 1. Build / tip yoxlaması (AC-13)

```
> sederek-sistem@0.0.0 build
> tsc && vite build

vite v6.4.3 building for production...
✓ 2773 modules transformed.
dist/index.html                  0.83 kB │ gzip:   0.44 kB
dist/assets/index-DrsGic8g.css   43.73 kB │ gzip:   7.86 kB
dist/assets/index-DBav1u-p.js  1,152.21 kB │ gzip: 322.51 kB
(!) Some chunks are larger than 500 kB after minification...
✓ built in 6.70s
```

**Nəticə: KEÇDİ.** `tsc` sıfır xəta, `vite build` uğurlu. Chunk-size xəbərdarlığı bu PR-dan əvvəl
də mövcud olan, əlaqəsiz bir vəziyyətdir (layihədə code-splitting yoxdur), regressiya deyil.

---

## 2. AC nəticələri

| AC | Təsvir | Nəticə | Qeyd / sətir |
|---|---|---|---|
| AC-1 | real rejimdə `uiOnly` çağırılmır, modal açılır | **KEÇDİ (kod)** | `_app.mallar.tsx:124-130` — `openImport` birbaşa `setImportOpen(true)`, `uiOnly` yalnız "Barkod/QR çap" düyməsində qalıb |
| AC-2 | `USE_MOCK===true` → modal açılmır, info toast, sorğu yox | **KEÇDİ (kod)** | `_app.mallar.tsx:125-128`; `USE_MOCK` true olduqda `setImportOpen` heç çağırılmır → `ExcelImportModal` `open=false` qalır, heç bir `fetch` tetiklənmir |
| AC-3 | "Şablonu endir" → `downloadFile("/api/exports/products-template.xlsx", ...)` | **KEÇDİ (kod)** | `ExcelImportModal.tsx:171-174` |
| AC-4 | >5MB → sorğu yox, "Fayl 5MB-dan böyük ola bilməz" | **KEÇDİ (kod)** — mətn fərqi var, aşağı bax | `ExcelImportModal.tsx:146-149`: mesaj faktiki **"Fayl 5 MB-dan böyük ola bilməz"** (boşluqla) — AC mətni boşluqsuz "5MB". Funksional davranış düzgündür (client-side guard, sorğu getmir), yalnız mesaj tipoqrafiyası fərqlidir. Bax aşağıda Bug/Qeyd #1 (low). |
| AC-5 | `.xlsx` olmayan fayl rədd, sorğu yox | **KEÇDİ (kod)** | `ExcelImportModal.tsx:140-144`, `.toLowerCase()` ilə `.XLSX` də qəbul olunur (case-insensitive) |
| AC-6 | avtomatik preview, spinner, düymələr deaktiv | **KEÇDİ (kod-quruluşu) / BLOKLANMIŞ (canlı davranış BE#13)** | avtomatik trigger: `handleFileSelected` → `void runPreview(file)` (sətir 152, əlavə klik yoxdur); spinner: `previewMut.isPending` (sətir 251-264); dropzone düyməsi `disabled={previewMut.isPending}` (233), şablon düyməsi də (287). Addım 2-yə keçid real backend cavabı tələb edir → tam E2E BLOKLANMIŞ |
| AC-7 | 4 kart + sətir cədvəli, rowNumber/status/error rəngləri | **KEÇDİ (kod-quruluşu) / BLOKLANMIŞ (real data ilə render)** | 4 `StatCard` (creates yaşıl `tone="green"`, updates mavi `tone="sky"`, errors qırmızı `tone="red"`, newCategories siyahı `tone="amber"`) sətir 302-332; cədvəl sətir 344-409, `error` mətni qırmızı sətir 396-403 |
| AC-8 | `errors>0` → xəbərdarlıq mətni | **KEÇDİ (kod) / BLOKLANMIŞ (real data)** | `ExcelImportModal.tsx:412-416`, mətn dəqiq uyğundur |
| AC-9 | `creates+updates===0` → idxal düyməsi deaktiv, "Geri" aktiv | **KEÇDİ (kod) / BLOKLANMIŞ (real data)** | `importableCount` (208-210), düymə `disabled={commitMut.isPending || importableCount === 0}` (429); "Geri" yalnız `commitMut.isPending` zamanı deaktivdir (423) → `importableCount===0` halında aktiv qalır ✓ |
| AC-10 | "Geri" → Addım 1, fayl/preview təmizlənir | **KEÇDİ (kod)** | `resetToStep1` (88-96) `step`, `fileError`, `dragActive`, `preview`, `previewMut`, `commitMut` hamısını sıfırlayır; "Geri" `onClick={resetToStep1}` (422) |
| AC-11 | bağlananda `["products"]`,`["categories"]`,`["dashboard"]`,`["activity"]` invalidate | **KEÇDİ (kod)** | `queries.ts:109-117` `useInvalidateAfterImport` dəqiq bu 4 key-i invalidate edir; `ExcelImportModal.tsx:107-115` yalnız `step===3 && commitResult` şərtində çağırır (uğursuz/yarımçıq commit-də lazımsız invalidasiya yoxdur — AC-dən artıq korrektlik) |
| AC-12 | 410 → backend mesajı ilə toast + avtomatik Addım 1, state sıfırlanır | **KEÇDİ (kod) / BLOKLANMIŞ (real 410 cavabı)** | `handleCommit` catch bloku (194-204): `e instanceof ApiError && e.status === 410` → `toast.error(e.message)` + `resetToStep1()` + `setFileError(e.message)` |
| AC-13 | build xətasız, `postForm` mövcud metodlara toxunmur | **KEÇDİ** | bax bölmə 1 və bölmə 4 (reqressiya analizi) |

---

## 3. Test Case nəticələri

| TC | Təsvir | Nəticə |
|---|---|---|
| TC-1 | Happy path (3 addım, invalidate) | **BLOKLANMIŞ — BE#13 gözlənilir** (məntiq kod səviyyəsində doğrulandı, real preview/commit cavabı yoxdur) |
| TC-2 | Mock rejim — modal açılmır, toast, sorğu yox | **KEÇDİ** — şəbəkə tələb etmir, tam kod-səviyyəli təsdiqlənə bilər |
| TC-3 | >5MB fayl rədd | **KEÇDİ** — client-side guard, sorğu heç göndərilmir |
| TC-4 | Yanlış format (.csv/.docx) rədd | **KEÇDİ** — client-side guard, sorğu heç göndərilmir |
| TC-5 | Bütün sətirlər xətalı → idxal düyməsi deaktiv | **BLOKLANMIŞ — BE#13 gözlənilir** (deaktiv məntiqi `importableCount===0` kod səviyyəsində düzgündür, amma real "hamısı xəta" preview cavabı yoxdur) |
| TC-6 | 410 token vaxtı keçib | **BLOKLANMIŞ — BE#13 gözlənilir** (catch bloku kod səviyyəsində düzgündür) |
| TC-7 | Boş fayl → backend 400 | **BLOKLANMIŞ — BE#13 gözlənilir** |
| TC-8 | Yanlış başlıqlar → backend 400 | **BLOKLANMIŞ — BE#13 gözlənilir** |
| TC-9 | "Geri" naviqasiyası → state təmizlənir | **KEÇDİ (kod)** — funksiya çağırışı client-side, addım-2-yə çatmaq real preview tələb etsə də, `resetToStep1` funksiyasının özü müstəqil şəkildə doğrulandı |
| TC-10 | Şablon endirmə | **KEÇDİ (çağırış kontraktı)** / endirmənin faktiki nəticəsi BLOKLANMIŞ (backend endpoint yoxdur) |
| TC-11 | Build/tip yoxlaması | **KEÇDİ** |

**Yekun say:** KEÇDİ 6, BLOKLANMIŞ 5, SINDI 0 (TC səviyyəsində).
AC səviyyəsində: 13/13 kod baxışında KEÇDİ, 6-dan (AC-6,7,8,9,12 + TC-lərin real-data hissəsi) tam canlı təsdiq BE#13-dən sonra lazımdır.

---

## 4. Reqressiya yoxlamaları (senior review-dan sonrakı riskli sahələr)

1. **`api-client.ts` `request()` FormData dəstəyi** — **KEÇDİ, reqressiya YOXDUR.**
   Diff (`git diff origin/main...HEAD -- src/lib/api-client.ts`) göstərir ki, dəyişiklik minimaldır:
   `isForm = body instanceof FormData`; `Content-Type` yalnız `hasBody && !isForm` olanda qoyulur;
   `body: hasBody ? (isForm ? body : JSON.stringify(body)) : undefined`.
   - JSON çağırışları (`post`/`put`) əvvəlki kimi `Content-Type: application/json` + `JSON.stringify` alır (dəyişməyib).
   - FormData halında `Content-Type` qoyulmur (boundary qorunur) ✓.
   - `body === undefined` halı: `hasBody=false` → header qoyulmur, `body: undefined` — əvvəlki davranışla eynidir ✓.
   - `getBlob`/`requestBlob` funksiyasına heç toxunulmayıb (diff-də görünmür) ✓.
   - Bütün digər feature `api.ts` fayllarında (`suppliers`, `reports`, `expenses`, `customers`, `sales`, `categories`, `day-end`, `auth`, `settings`, `expense-types`) `apiClient.post/put/get/del` istifadəsi dəyişməyib, build xətasız keçib.

2. **`Badge.tsx` yeni status açarları** — **KEÇDİ, toqquşma YOXDUR.**
   Yeni açarlar `"İdxal: Yeni"`, `"İdxal: Yenilənəcək"`, `"İdxal: Xəta"` prefiksli olduğu üçün mövcud
   açarlarla (`Stokda var`, `Azalır`, `Bitib`, `Aktiv`, `Deaktiv`, `Nağd`, `Kart`, `Nisyə`, `Borclu`,
   `Ödənilib`, `Ümumi`, `Mala bağlı` və s.) heç bir string üst-üstə düşmür. `Badge` digər istifadəçiləri
   (`ProductStatusBadge.tsx`, `SalesJournal.tsx`, `ExpensesTable.tsx`, `CustomersTable.tsx`, s.) `tone`
   dəyərini `productStatus`/`paymentType` kimi başqa domenlərdən alır — toqquşma riski yoxdur.

3. **`StatCard.tsx` `sky` tone** — **KEÇDİ, geriyə uyğun.**
   `StatTone` union-a `"sky"` əlavə olunub (mövcud dəyərlər `default/green/red/amber/indigo` saxlanılıb),
   `TONE` map-də yeni açar əlavə edilib, mövcud istifadəçilər (`_app.index.tsx` — `green/red/indigo/amber`)
   toxunulmayıb, `tone` prop-suz çağırış `default`-a düşür (dəyişməyib).

4. **`_app.mallar.tsx` "Excel import" düyməsinin `canWrite` ilə qapadılması** — bu AC-lərdə (AC-1..13)
   göstərilməyib, lakin PR-a əlavə edilmiş senior review şərhində (GitHub PR #27, comment
   `IC_kwDOTUaPDc8AAAABMWuRvA`) açıq şəkildə **qəsdli düzəliş** kimi qeyd olunub: "`products.write`
   icazəsi yoxlanmırdı... `satici` roluna da görünürdü, halbuki əməliyyat mal yazır. Düymə 'Yeni mal'
   ilə eyni şəkildə `canWrite` ilə qapandı." Bu, mövcud "Yeni mal" düyməsinin davranışı ilə tutarlıdır
   (h. 188 `{canWrite && (...Yeni mal...)}`) və "Excel export" (yalnız oxu əməliyyatı, gate-siz qalıb)
   ilə ziddiyyət təşkil etmir — məntiqi tutarlıdır. **Bug deyil, scope-dan bir qədər kənar amma
   sənədləşdirilmiş və məqsədəuyğun dəyişiklikdir.**

5. **`closedRef` / `requestIdRef` guard-ları** — **KEÇDİ, kritik bug YOXDUR.**
   `useEffect(() => { if (!open) return; closedRef.current = false; resetToStep1(); setCommitResult(null); }, [open])`
   (sətir 99-105) modal HƏR dəfə `open=true` olanda `closedRef.current`-i yenidən `false`-a sıfırlayır —
   deməli modal bağlanıb yenidən açılanda ikinci dəfə problemsiz işləyəcək. `requestIdRef` hər yeni
   `runPreview` çağırışında artırılır (118) və köhnə cavablar `stale()` yoxlaması ilə (120) atılır.
   Commit zamanı modal bağlanarsa (`closedRef.current===true`), nəticə ekranı göstərilmir, lakin
   `invalidateAfterImport()` yenə də çağırılır (186-191) ki, DB-yə yazılmış məlumat üçün keş köhnəlməsin —
   bu, PR-ın senior review qeydində (madda 1, "Yüksək") xüsusi düzəldilmiş problemdir və kodda düzgün
   görünür.

6. **`<input type="file">` `value` sıfırlanması** — **KEÇDİ.**
   `onInputChange` (155-159): `e.target.value = ""` fayl oxunduqdan DƏRHAL sonra (validasiyadan
   ƏVVƏL) təyin olunur → eyni faylın təkrar seçilməsinə imkan verir, `handleFileSelected` çağırışına
   təsir etmir (fayl referansı əvvəlcədən dəyişənə saxlanılıb).

---

## 5. Tapılan bug/qeydlər

Kritik/yüksək/orta səviyyəli **heç bir funksional bug tapılmadı**. Bir aşağı-səviyyəli tipoqrafiya
qeydi var:

### Qeyd #1 (low, kosmetik — bug task tövsiyə edilmir)
- **Başlıq:** AC-4 mesaj mətnində boşluq fərqi
- **Fayl:sətir:** `src/features/products/components/ExcelImportModal.tsx:147`
- **Təsvir:** Kod `"Fayl 5 MB-dan böyük ola bilməz"` (boşluqla "5 MB") göstərir, AC-4 mətni
  `"Fayl 5MB-dan böyük ola bilməz"` (boşluqsuz "5MB") yazır. Funksionallıq tam düzgündür (limit,
  guard, sorğunun getməməsi) — yalnız görsəl mətn fərqidir, Az dilində hər ikisi düzgün oxunur.
- **Gözlənilən:** AC mətni ilə bit-bit uyğunluq (əgər tələb dəqiq mətndirsə).
- **Faktiki:** Sözarası boşluq var.
- **Ciddiyyət:** Low/kosmetik — funksionallığa təsiri yoxdur, blocking deyil, ayrıca bug task
  tövsiyə OLUNMUR (istəyə görə orchestrator qərar verə bilər).

### Qeyd #2 (informational, bug deyil)
- `rowDisplayName` (`ExcelImportModal.tsx:55-58`) `data.name / data.Name / data["Mal adı"] / data.title`
  açarlarını yoxlayır — bu, backend hələ mövcud olmadığı üçün fərziyyədir. Backend başqa açar adı
  qaytararsa "Mal" sütunu "—" göstərəcək. Bu, PR-ın öz "Qalan risklər" bölməsində də qeyd olunub.
  BE#13 merge olandan sonra real cavabla yoxlanılmalıdır — hazırda bug deyil, sadəcə izlənməli məqam.

---

## 6. Yekun

- **Statik/kod-səviyyəli doğrulama:** 13/13 AC koda uyğun implementasiya olunub, məntiqi baxımdan
  düzgün. Regressiya riskləri (1-6) yoxlanıldı — heç biri sınmayıb.
- **Build:** `npm run build` xətasız (tsc + vite build).
- **Bloklanan hissə:** AC-6/7/8/9/12 və TC-1,5,6,7,8-in tam canlı (real backend cavabı ilə) davranışı
  BE#13 (backend endpoint-ləri) implement olunmadan **test edilə bilmir**. Bu, frontend kodunun
  keyfiyyətsizliyi deyil, xarici asılılıqdır.
- **Bug sayı:** 0 funksional bug (kritik/yüksək/orta/aşağı-funksional). 1 kosmetik/low mətn fərqi
  qeydi (bug task tövsiyə edilmir, orchestrator qərar versin).

**Tövsiyə:** Task "Done"-a keçirilməsin — QA statusunda "BE#13 gözlənilir" qeydi ilə saxlanılsın
(və ya orchestrator uyğun gördüyü status ilə işarələsin). Kod özü buraxılışa hazırdır; BE#13 merge
olan kimi TC-1, TC-5, TC-6, TC-7, TC-8 real backend ilə təkrar test edilməlidir ki, tam "Done" statusu
verilə bilsin.
