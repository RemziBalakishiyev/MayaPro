# Mallar / Anbar səhifəsi — dizayn sisteminə keçid (FE#70)

Bu sənəd FE#70 çərçivəsində **yalnız "Mallar / Anbar" səhifəsində** aparılan
dəyişiklikləri, verilən qərarları və onların əsaslandırmasını qeydə alır.
Referans: `docs/design-system.md` (FE#69), `docs/ui-refactor-roadmap.md`,
`docs/ui-terminology.md`.

**TOXUNULMAZ qalıb (dəyişməyib):** `productStatus()`, `profitPercent()`,
`hasNoBatchExpense()`, `calcRealCost()` və digər `src/features/products/lib.ts`
hesablamaları; `useProducts`, `useDeleteProduct`, `useProductsKpi`,
`useAdjustStock`, `useCreateProduct`, `useUpdateProduct` API çağırışları;
`useCan("products.write")` icazə şərti; Excel import/export və Barkod/QR çap
funksional axınları (`ExcelImportModal`, `LabelPrintModal`, `downloadFile`).

---

## 1. Dəyişən fayllar

| Fayl | Nə dəyişdi |
|---|---|
| `src/features/products/components/ProductsKpiCards.tsx` | Azalan stok çipinin mətni "N mal azalır" → "N malın stoku azalır" (AC-3) |
| `src/features/products/components/ProductFilters.tsx` | Lokal axtarış `TableToolbar` + `LocalTableSearch` daxilinə köçürüldü; placeholder dəqiqləşdirildi; filtr toqql düyməsi + panel + çiplər eyni görünüşdə saxlanıldı (AC-5, AC-6, AC-7) |
| `src/features/products/components/ProductsTable.tsx` | Sütun başlıqlarına kömək tooltip-ləri (AC-8/AC-9), Kateqoriya üçün `EmptyValue` (AC-10), sütun sırası/görünürlüyü (AC-11), mal adı klikinin redaktə formuna keçidi (AC-16), "Stok artır"/"Stok azalt" mətnli düymələr (AC-13), sticky başlıq (AC-17), çağıran tərəfin `emptyState` ötürə bilməsi (AC-19) |
| `src/components/ui/DataTable.tsx` | Yeni **opt-in** `stickyHeader?: boolean` prop-u (defolt `false` — mövcud səhifələrə TƏSİR ETMİR) |
| `src/routes/_app.mallar.tsx` | `ProductsTable`-a axtarış/filtr aktiv olduqda fərqli `emptyState` ötürülür (AC-19/TC-28) |
| `docs/ui-terminology.md` | Bu taskda dəyişən mətnlər cədvələ əlavə olundu |

`src/routes/_app.mallar_.$id.tsx`, `ProductForm.tsx`, `StockAdjustModal.tsx`,
`LabelPrintModal.tsx`, `ExcelImportModal.tsx`, `ProductStatusBadge.tsx`
dəyişməyib — bu komponentlər artıq FE#69/FE#61/FE#56/FE#65-də dizayn
sisteminə uyğunlaşdırılmışdı (bax `_app.mallar.tsx`-dəki mövcud şərhlər).

---

## 2. Bənd-bənd qərarlar

### 1–2. Tək əsas əməliyyat + "Digər əməliyyatlar" menyusu

Artıq FE#69/FE#61-dən tətbiq olunmuşdu (`PageHeader.primaryAction` = "Yeni
mal", `moreActions` = Excel import/export + Barkod/QR çap). Bu taskda əlavə
dəyişiklik edilmədi — davranış/icazə şərtləri yoxlanıldı və dəyişməz qaldığı
təsdiqləndi (AC-1, AC-2, AC-R3, AC-R4).

### 3. Azalan stok → kliklənən sürətli filtr

`AlertPill` artıq (FE#61) kliklənən `<button>` idi və status filtrini
`Azalır`a keçirirdi (`focusLowStock`, `_app.mallar.tsx`). Bu taskda YALNIZ
mətn PM nümunəsinə uyğunlaşdırıldı: **"N mal azalır" → "N malın stoku
azalır"**. Klik davranışı, URL parametri (`status=Azalır`) və fokus/klaviatura
davranışı dəyişməyib.

### 4. Vahid dövr seçimi

Artıq tək `PeriodFilter`/`SegmentedDateFilter`-dədir, dəyişiklik edilmədi.

### 5–7. TableToolbar + LocalTableSearch + aktiv filtr sayğacı

`ProductFilters` yenidən qurulub: əvvəllər axtarış `FilterBar` daxilində idi
(axtarış + filtr toqqlu tək komponent); indi axtarış paylaşılan
`TableToolbar`-ın `search` sıxacında, filtr toqql düyməsi `actions`
sıxacındadır — `src/routes/_app.musteriler.tsx` naxışı ilə eyni struktur
(AC-5). Açılan panel (kateqoriya/status/anbar seçimləri) və aktiv filtr
çipləri `TableToolbar`-ın altında, cədvəldən dərhal əvvəl göstərilir —
vizual görünüş əvvəlki `FilterBar` ilə demək olar eynidir (yalnız axtarışın
DOM yeri dəyişib), heç bir mövcud primitiv yenidən yazılmayıb.

Placeholder mətni hərfi olaraq (AC-6):
**"Bu siyahıda mal adı, kateqoriya və xüsusiyyət üzrə axtar"**.

Filtr toqql düyməsində aktiv filtr sayı bədge kimi göstərilir (AC-7) —
əvvəlki `FilterBar`-dakı eyni bədge dizaynı saxlanılıb: heç bir filtr
seçilməyəndə bədge YOXDUR (0 göstərilmir).

**Qərar:** `FilterBar` primitivi özü DƏYİŞDİRİLMƏYİB (digər səhifələr —
Borclar, s. — onu olduğu kimi istifadə etməyə davam edir); yalnız Mallar
səhifəsinin öz `ProductFilters.tsx` komponenti yenidən tərtib olunub.

### 8. "Qazanc %" izahı

Başlıq **"Qazanc %" → "Maya üzərindən qazanc %"**, yanında kömək ikonu
(`HelpCircle`) və `title` tooltip-i: *"Satış qiyməti ilə real maya arasındakı
fərqin mayaya nisbəti"*. `profitPercent()` funksiyası və göstərilən faiz
dəyəri **bit-bit dəyişməyib** (AC-8, AC-R2 — unit testlə əhatə olunur:
`profitPercent` heç bir yeni koda köçürülmür, birbaşa `../lib`-dən import
olunur).

### 9. "Alış" / "Real maya" fərqinin izahı

Hər iki başlığa (`Alış`, `Real maya`) kömək tooltip-i əlavə olundu:
- **Alış**: "Təchizatçıya ödənən alış qiyməti. Partiya xərci yoxdursa, real
  maya ilə eynidir (aşağıda «—»)."
- **Real maya**: "1 ədədin faktiki dəyəri: alış qiyməti + bu partiyaya aid
  əlavə xərclər (nəqliyyat, gömrük və s.)."

Alış = real maya olduqda (`hasNoBatchExpense()` — DƏYİŞMƏYİB) Alış xanasında
"—" göstərilir; tooltip/aria-label mətni PM nümunəsinə uyğunlaşdırıldı:
**"Xərc yoxdur — maya alışa bərabərdir"** (əvvəlki "...alış qiymətinə
bərabərdir" versiyasından yalnız söz seçimi cəhətdən dəqiqləşdirilib, MƏNA və
ŞƏRT eynidir). Alış ≠ maya olan mallarda faktiki alış qiyməti dəyişmədən
göstərilir.

### 10. Boş dəyər üçün vahid "—"

Kateqoriya sütununa da (əvvəllər xam boş sətir göstərilirdi) `EmptyValue`
tətbiq olundu: boş kateqoriyalı mal "—" + `title`/`aria-label`
("Kateqoriya təyin edilməyib") ilə göstərilir. Alış sütununda mövcud
`EmptyValue` davranışı (bənd 9) saxlanıldı.

### 11. Sütun prioriteti və responsive görünürlük

PM-in tələb etdiyi sıra tətbiq olundu: **Mal · Kateqoriya · Real maya ·
Satış qiyməti · Stok · Status · Əməliyyat** (bu 7 sütun bütün ekran
enlərində görünür).

**Qərar (audit tövsiyəsinə uyğun):**
- **Kateqoriya** əvvəllər `hidden 2xl:table-cell` idi (yalnız ≥1536px);
  indi PM-in prioritet siyahısında #2 yer aldığı üçün məhdudiyyət
  GÖTÜRÜLDÜ — bütün ekran enlərində (mobil kart istisna, o, kateqoriyanı
  göstərmir) görünür.
- **Alış** ikinci dərəcəli sütun olaraq qalır, lakin YALNIZ `lg+`
  (≥1024px) ekranlarda görünür (`hidden lg:table-cell`) — bənd 9-dakı
  "—" + izah davranışı ilə birlikdə. 1280/1366/1440/1920px test enləri
  hamısı `lg`-dən (1024px) böyükdür, ona görə bu sütun AC-B1/AC-B2 test
  ssenarilərində görünəcək.
- **"Qazanc %"** bənd 8-in tələbinə görə (aydınlaşdırılsın, silinməsin)
  bütün ekranlarda görünməyə davam edir — PM-in prioritet siyahısında
  açıq yer almasa da, "data gizlədilmir" prinsipinə uyğun saxlanılıb.
- `DataTable`-ın cədvəl konteyneri artıq (FE#69) `overflow-x-auto`-dur:
  əgər çox enli monitor deyil, kiçik `lg` ekranında (1024–1279px) bütün
  sütunlar sıxışsa, CƏDVƏL ÖZÜ daxili üfüqi sürüşə bilər — SƏHİFƏ isə
  AC-B1-in tələb etdiyi kimi daşmır (`AppShell` konteyneri `w-full`
  saxlanılır).

### 12. İkinci dərəcəli mal məlumatları

Anbar yeri, barkod, xüsusiyyətlər və təchizatçı `ProductForm`-un "Yer"
(`Accordion`) və "Mal haqqında" bölmələrində artıq mövcuddur — DƏYİŞİKLİK
edilmədi. Yeni paralel detal draweri YARADILMADI.

### 13. "Stok artır" əsas əməliyyatı

Sətir düyməsinin mətni **"Stok" → "Stok artır"** (desktop cədvəl) və mobil
kartda **"Stok" → "Stok artır" / "Stok azalt"** olaraq dəqiqləşdirildi —
əvvəllər hər iki mobil düymə "Stok" adlanırdı, yalnız ikon rəngi ilə
fərqlənirdi; indi mətn özü də fərqi göstərir. `onAdjust(product, "add"/"sub")`
çağırışı və `StockAdjustModal` axını dəyişməyib.

### 14. Barkod ikon əməliyyatı

Sətirdəki barkod/etiket çap ikon düyməsi artıq (FE#69) `aria-label` +
`title` ilə etiketlidir (`"{ad} — barkod/QR etiket çap et"`) — dəyişiklik
edilmədi, yalnız yoxlanıldı.

### 15. "Digər" mətnli menyu

`ActionMenu` bəndləri artıq mətnlidir: "Detal", "Stok azalt", "Redaktə et"
(icazə varsa), "Sil" (icazə + handler varsa) — trigger düyməsi `aria-label`
ilə etiketlidir (`"{ad} əməliyyatları"`). Dəyişiklik edilmədi.

### 16. Mal adı sahəsi → redaktə forması

**Əsas davranış dəyişikliyi**: əvvəllər mal adı xanası (ikon + ad + alt mətn)
`<Link to="/mallar/$id">` idi və ayrıca detal SƏHİFƏSİNƏ aparırdı. İndi bu
sahənin BÜTÖVÜ `<button onClick={() => onEdit(product)}>`-dir və
`ProductForm`-u redaktə rejimində açır (`title` — ad + anbar yeri; `aria-label`
— `"{ad} — redaktə et"`). Bu, tələbin 12-ci bəndindəki qaydaya uyğundur:
mal üçün "detal" faktiki redaktə formudur, YENİ paralel drawer
yaradılmayıb.

`/mallar/$id` detal SƏHİFƏSİ ÖZÜ SİLİNMƏYİB — "Digər" menyusundaki "Detal"
bəndi hələ də ora keçid edir (əl ilə açıla bilən alternativ, mal adına
avtomatik klik artıq bura getmir).

### 17. Sticky cədvəl başlığı

`DataTable`-a **opt-in** `stickyHeader?: boolean` prop-u əlavə olundu
(defolt `false`, digər 10+ siyahı səhifəsinə TƏSİR ETMİR). `true`
verildikdə cədvəlin xarici konteyneri `max-h-[70vh] overflow-y-auto`
alır və `thead` bu konteynerin daxilində `sticky top-0 z-10` ilə
sabitlənir. `ProductsTable` bu prop-u həmişə `true` ötürür.

**Qərar:** sticky başlıq PƏNCƏRƏ/SƏHİFƏ scroll-una deyil, CƏDVƏLİN ÖZ
daxili sürüşməsinə bağlanıb (data-grid naxışı) — çünki mövcud `overflow-x-auto`
konteynerinin üzərinə əlavə `overflow-y-auto` qoymadan brauzerlərdə
`position: sticky` pəncərə scroll-una nisbətən düzgün işləmir (CSS Overflow
spesifikasiyasına görə `overflow-x: auto` olan konteyner avtomatik
`overflow-y: auto` alır və sticky-nin "containing block"-u bu konteynerin
öz scroll sahəsi olur). Bu yanaşma həm AC-17-ni (uzun siyahılarda sabit
başlıq) təmin edir, həm də AC-B1-ə (səhifə özü daşmır — daxili sürüşmə
icazəlidir) tam uyğundur.

### 18. Sıralama və səhifələmə

Dəyişiklik edilmədi — `DataTable`-ın mövcud `useReactTable`
sıralama/səhifələmə məntiqi toxunulmadı (AC-18, AC-R1).

### Əlavə: vəziyyət primitivləri (AC-19)

`ProductsTable` `emptyState` prop-u ilə çağıran tərəfin fərqli boş-nəticə
mesajı ötürməsinə icazə verir (`musteriler.tsx` naxışı). `_app.mallar.tsx`
axtarış (`q`) və ya hər hansı filtr (`cat`/`status`/`loc`) aktivdirsə
**"Filterə uyğun mal yoxdur"** göstərir, əks halda defolt **"Mal
tapılmadı"** qalır. `TableSkeleton` (yüklənmə), `InlineError` + "Yenidən"
(xəta) və `EmptyState` (boş) `DataTable` tərəfindən idarə olunur —
dəyişiklik edilmədi.

### Əlavə: Barkod skaner + Enter (AC-20)

`LocalTableSearch`-in `<input>`-u `<form>` daxilində DEYİL — barkod skanerin
göndərdiyi `Enter` heç bir form submit-i və ya səhifə yenilənməsi
tətikləmir; yazılan mətn `onChange` vasitəsilə dərhal cari siyahını süzür
(URL `q` parametri). Satış ekranındakı (`QuickSaleScreen`) barkod-Enter
axını tamamilə ayrı komponentdədir və bu dəyişiklikdən təsirlənmir (kod
səviyyəsində yoxlanıldı — heç bir qlobal keydown listener əlavə
olunmayıb).

---

## 3. Yekun (build/responsive)

- `npm run build` — 0 xəta (TypeScript + bundling).
- `npx vitest run` — 143/143 test yaşıl (mövcud 108 + bu taskda əlavə
  olunan 35 yeni test).
- Responsive: kod səviyyəsində 1280/1366/1440/1920px üçün `lg`/`xl`
  Tailwind sinifləri yoxlanıldı (`hidden lg:table-cell` Alış sütunu üçün);
  375px üçün mövcud `mobileCard` (dəyişməyib, yalnız düymə mətnləri
  dəqiqləşdirilib) davam edir. Headless brauzer mühiti mövcud olmadığı
  üçün vizual skrinşot yoxlaması aparılmayıb — CSS/breakpoint səviyyəsində
  təsdiqləndi.
