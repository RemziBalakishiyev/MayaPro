# Satış səhifəsi — dizayn sisteminə keçid (FE#71, mərhələ 2)

Bu sənəd FE#71 çərçivəsində **yalnız "Satış" səhifəsində** aparılan
dəyişiklikləri, verilən qərarları və onların əsaslandırmasını qeydə alır.
Referans: `docs/design-system.md` (FE#69), `docs/pages/inventory-ui-refactor.md`
(FE#70 — eyni naxışların birinci tətbiqi: `TableToolbar`, `PeriodFilter`,
"Digər" mətnli menyu, sütun prioritetlə responsiv görünürlük), `docs/ui-terminology.md`.

**TOXUNULMAZ qalıb (dəyişməyib):** `netTotal`, `saleProfit`, `isLossSale`,
`calcRealCost`, `saleBatchExpense`, `saleDateTime`, `saleInvoiceNumber`
(`src/features/sales/lib.ts`); `useCreateSale`, `useDeleteSale`,
`useSalesJournal`, `useSaleDetail`, `useUpdateSale` sorğuları; `useCan()
("sales.manage")` icazə şərti; barkod skaner/Enter emalı (`search` state-i
sadə `onChange` ilə dolur, heç bir `<form>`/submit yoxdur); `PaymentConfirmModal`,
`LossConfirmModal`, `useInvoiceDownload`, `useInvoiceWhatsApp` axınları.

---

## 1. Dəyişən fayllar

| Fayl | Nə dəyişdi |
|---|---|
| `src/features/sales/components/QuickSaleScreen.tsx` | Mal/barkod axtarışı vizual olaraq dominant edildi (böyük kart, h-16/h-20 input); "Sərbəst satış" ikinci dərəcəli ghost düyməyə endirildi; placeholder mətni "Mal adı və ya barkod — satış üçün"; avtofokus effekti mobil (<640px) və modal/drawer açıq olduqda söndürülür (AC-1, AC-2, AC-4, AC-5) |
| `src/features/sales/components/SalesKpiCards.tsx` | Birinci səviyyə panel TƏK `StatCluster`-ə sadələşdirildi (Satış sayı · Ümumi satış · Ümumi qazanc · Orta satış — əvvəl "Orta satış" ayrıca yan `KpiCard`-da idi); Nağd/Kart/Nisyə bölgüsü kiçik ikinci dərəcəli panelə köçürüldü (text-sm, əsas paneldən vizual kiçik) (AC-6, AC-7) |
| `src/features/sales/components/SalesJournal.tsx` | Axtarış + filtr toqql + "PDF hesabat" `TableToolbar`-a köçürüldü (AC-10); sütun sırası dəqiqləşdirildi, "Maya qiyməti"/"Xərc" sütunları çıxarıldı, "Qazanc" ayrıca sütun olmaqdan çıxıb "Yekun" altında yığcam sətrə keçdi (AC-11, AC-12, AC-13); sətir əməliyyatları mətnli etiketlərə keçdi: "Detala bax"/"Qaimə"/"Digər" (AC-14); müştəri adı ikon+rənglə kateqoriyadan ayrıldı (AC-16) |
| `src/features/sales/components/SaleDetailDrawer.tsx` | **Dəyişmədi** — "Maya qiyməti (vahid)" və "Bu satışa düşən xərc" sətirləri artıq mövcud idi, cədvəldən çıxarılan datanın yeganə yeri budur (AC-12) |
| `docs/ui-terminology.md` | Bu taskda dəyişən/əlavə olunan mətnlər cədvələ əlavə olundu |

`src/routes/_app.satis.tsx`, `PaymentConfirmModal.tsx`, `LossConfirmModal.tsx`,
`CustomerSelectBlock.tsx`, `SaleEditDrawer.tsx`, `QtyStepper.tsx` dəyişməyib —
kassa axını (axtar → seç → ödəniş modalı → təsdiq → qaimə) və biznes
hesablamaları bu taskın əhatəsindən kənardadır (TOXUNULMAZ).

---

## 2. Bənd-bənd qərarlar

### 1–5. Kassa zonası: dominant axtarış + ikinci dərəcəli "Sərbəst satış"

Əvvəllər axtarış inputu (h-11) və "Sərbəst satış" düyməsi (dolu emerald fon)
eyni kiçik zolaqda, təxminən bərabər vizual çəkidə idi. İndi axtarış öz
böyük kartındadır (border-2, shadow-card, h-16 mobil / h-20 `sm:`+, text-lg/xl,
emerald axtarış ikonu), "Sərbəst satış" isə kartın altında kiçik, çərçivəsiz
mətn düyməsidir (h-10, ghost stil) — iki əməliyyat arasındakı iyerarxiya
birmənalı görünür (AC-1, AC-4).

Placeholder mətni hərfi olaraq (AC-5): **"Mal adı və ya barkod — satış
üçün"** — `GlobalProductSearch`-in "Bütün sistemdə mal axtar..." mətnindən
həm yerlə (səhifə daxili, header-də deyil), həm görünüşlə (düzbucaqlı,
böyük, ağ fon), həm mətnlə aydın fərqlənir.

**Avtofokus (AC-2/AC-3):** əvvəlki HTML `autoFocus` atributu (şərtsiz,
mobildə də klaviatura sıçradan) silinib, YERİNƏ effekt-əsaslı fokus qoyulub:

```ts
useEffect(() => {
  if (showDetails || success) return;
  if (newCusOpen || confirmOpen || paymentModalOpen) return;
  if (typeof window !== "undefined" && window.innerWidth < 640) return;
  searchRef.current?.focus();
}, [showDetails, success, newCusOpen, confirmOpen, paymentModalOpen]);
```

`640px` — layihənin `sm` breakpoint-i (Tailwind defolt). Barkod skaner/Enter
emalı məntiqinə (kod səviyyəsində) TOXUNULMAYIB: `search` state-i sadə
`onChange` ilə dolur, `<input>` `<form>` daxilində deyil, heç bir yeni
submit/keydown handler əlavə olunmayıb (AC-3, R-06).

### 6–7. Birinci səviyyə xülasə sadələşməsi + ikinci dərəcəli ödəniş bölgüsü

Əvvəlki kompozisiya 3 ayrı panel idi: 3-göstəricili `StatCluster` (Satış
sayı/Ümumi satış/Ümumi qazanc), 3-göstəricili ikinci `StatCluster` (Nağd/
Kart/Nisyə qazanc) və ayrıca yan `KpiCard` ("Orta satış") — vizual olaraq
"Orta satış" ödəniş bölgüsü ilə eyni səviyyədə görünürdü, PM-in tələb etdiyi
TƏK-panel-4-göstərici quruluşu yox idi.

**Qərar:** "Orta satış" birinci `StatCluster`-in 4-cü elementi olaraq
köçürüldü (Satış sayı · Ümumi satış · Ümumi qazanc · Orta satış — TƏK panel,
AC-6). Nağd/Kart/Nisyə qazanc bölgüsü ayrıca, görünüşcə açıq-aydın kiçik
paneldədir: `text-sm font-bold` (əsas paneldəki `text-xl lg:text-2xl`-dən
DƏFƏLƏRLƏ kiçik), boz arxa fonlu (`bg-stone-50/60`), yuxarıda kiçik "Ödəniş
növü üzrə qazanc" etiketi ilə (AC-7). Loading/error vəziyyəti hər iki panel
üçün eyni sorğudan (`useSalesKpi`) gəldiyi üçün paralel göstərilir —
mövcud `StatCluster` skeleton/error davranışı əsas paneldə saxlanılıb, ikinci
dərəcəli panel özünün kiçik ekvivalent skeleton/error zolağını göstərir.

### 8. Hesablamalar dəyişməz

`netTotal`, `saleProfit`, `isLossSale`, `useSalesKpi` funksiyalarına heç bir
toxunuş edilməyib — yalnız NƏTİCƏLƏRİN göstərildiyi UI konteyneri dəyişib
(AC-8, AC-R1).

### 9. Vahid dövr seçimi

Artıq (FE#56-dan bəri) TƏK `PeriodFilter` (`SegmentedDateFilter`) komponenti
KPI-ları və jurnal siyahısını birgə idarə edirdi — bu taskda YOXLANILDI,
dəyişiklik edilmədi (AC-9).

### 10. TableToolbar: axtarış + filtr + PDF hesabat

Əvvəllər axtarış `FilterBar` daxilində idi (axtarış + filtr toqql tək
komponentdə), "PDF hesabat" isə həmin sətirdə ayrıca `Button` idi. İndi
struktur `src/features/products/components/ProductFilters.tsx` (FE#70)
naxışı ilə eynidir: `TableToolbar`-ın `search` sıxacında paylaşılan
`LocalTableSearch`, `actions` sıxacında "Filterlər" toqql düyməsi (aktiv
sayğacla) VƏ "PDF hesabat" `Button`-u yan-yana. Açılan filtr paneli (Ödəniş/
Min-Max qazanc/Min-Max say) və aktiv filtr çipləri toolbar-ın altında,
vizual olaraq əvvəlki `FilterBar` ilə demək olar eynidir — yalnız axtarışın
və PDF düyməsinin DOM yeri dəyişib, heç bir mövcud primitiv (`FilterBar`,
`Select`) yenidən yazılmayıb (AC-10).

### 11. Sütun prioriteti

PM-in tələb etdiyi sıra tətbiq olundu: **Mal · Say · Satış qiyməti · Yekun ·
Ödəniş · Satıcı · Tarix · Əməliyyat** (AC-11). "Satıcı" əvvəlki kimi yalnız
`lg+` (≥1024px) ekranlarda görünür (`hidden lg:table-cell`) — 1280/1366/1440/
1920px test enləri hamısı bundan böyükdür, ona görə AC-B1/AC-B2 ssenarilərində
bu sütun görünəcək.

### 12. Maya/xərc/qazanc → mövcud detal draverinə

Əvvəlki cədvəldə "Maya qiyməti" və "Xərc" iki ayrıca sütun idi (yalnız
`lg+`-də görünürdü). Bu iki sütun **TAMAMILƏ çıxarıldı** — YENİ paralel
drawer yaradılmadı, çünki mövcud `SaleDetailDrawer`-in "Hesab" kartında bu
məlumat artıq var idi (dəyişməyib):

- `Row label="Maya qiyməti (vahid)" value={sale.purchasePricePerUnit}`
- `Row label="Bu satışa düşən xərc" value={batchExpense}` (`saleBatchExpense()`)

**"Qazanc" sütununun taleyi** (PM-in açıq soruşduğu qərar nöqtəsi): PM-in
sütun prioritet siyahısında (bənd 11) "Qazanc" adı YOXDUR — yalnız "Yekun"
var. Bunu iki oxşar seçim arasında qərarlaşdırdıq:

1. Qazancı tamamilə cədvəldən çıxarıb yalnız drawer-ə saxlamaq, YA DA
2. Tələbin bəndinin özündəki icazəyə əsasən ("Qazanc istəsən yığcam ikinci
   sətir kimi Yekun altında qala bilər") "Yekun" xanasının altına köçürmək.

**Qərar: 2-ci seçim.** Səbəb — qazanc gündəlik kassa nəzarəti üçün ən çox
baxılan sahələrdən biridir (mövcud mobil kartda onsuz da miqdar×qiymət
yanında görünürdü); onu TAM gizlətmək "heç nə itmir" prinsipini (bənd 13)
məcburi drawer açılışına bağlayardı. Ona görə "Yekun" xanası indi iki
sətirdən ibarətdir: böyük `totalAmount` rəqəmi + altında kiçik (`text-xs`)
işarəli qazanc (`fmtMoneySigned`, yaşıl/qırmızı) və (qismən ödənişdə) "N ₼
ödənilib" sətri. `accessorKey: "profit"` ayrıca sütun DEYİL, ayrıca sıralama
başlığı da yoxdur — bu, cədvəldə 8-ci sütundan artıq element olmasının
qarşısını alır və PM-in dəqiq sıra tələbini (bənd 11) pozmur.

### 13. Heç bir data itmir

Əvvəlki cədvəldə göstərilən HƏR sahə hazırda əlçatandır:

| Sahə | Yeni yeri |
|---|---|
| Maya qiyməti (`purchasePricePerUnit`) | `SaleDetailDrawer` → "Hesab" kartı |
| Xərc (`saleBatchExpense`) | `SaleDetailDrawer` → "Hesab" kartı |
| Qazanc (`profit`) | "Yekun" xanasının altında (cədvəl) + drawer-də "QAZANC" sətri |
| Digər bütün sahələr (Mal, Say, Satış qiyməti, Yekun, Ödəniş, Satıcı, Tarix) | Dəyişmədən cədvəldə qalır |

### 14. Sətir əməliyyatları — mətnli etiketlər

Əvvəllər "Detal" (mətnli), "Qaimə" ikon-yalnız (yalnız `title="Qaimə (PDF)"`)
və ikon-yalnız "⋯" `ActionMenu` idi. İndi hər üçü mətnlidir: **"Detala
bax"**, **"Qaimə"** (ikon + mətn, `aria-label="{mal} — Qaimə (PDF)"`), və
**"Digər"** (`ActionMenu`-nun mövcud `triggerLabel` prop-u ilə — yeni
komponent yaradılmadı, `src/components/ui/ActionMenu.tsx`-in artıq dəstəklədiyi
seçim işə salındı). Həm masaüstü cədvəldə, həm `mobileCard` görünüşündə eyni
etiketlər istifadə olunur (AC-14). "Qaimə" (yox "Qəbz") termini artıq
`docs/ui-terminology.md`-də qəbul edilmişdi — yalnız etiket mətnli formaya
keçdi, termin dəyişmədi.

### 15. Ödəniş badge-ləri

`Badge tone={paymentType}` dəyişməyib — rəng + mətn (`{pt}`) birlikdə
göstərilməyə davam edir. Qismən ödənişli satışlarda "Yekun" altındakı "{N}
₼ ödənilib" sətri qorunub (indi "Qazanc" sətri ilə yanaşı, eyni kiçik blokda)
(AC-15).

### 16. Nisyə müştərisi ↔ mal kateqoriyası ayrımı

Əvvəllər müştəri adı yalnız rənglə (`text-emerald-700`) kateqoriya
mətnindən (`text-stone-400`) fərqlənirdi — eyni tipoqrafiya ölçüsü və ikonsuz.
İndi müştəri adının yanında kiçik `User` ikonu (lucide-react, 11px) var —
rəng + ikon birlikdə fərqi bildirir (yalnız rəng deyil), kateqoriya/"Sərbəst"
mətni öz sətrində qalır (AC-16). Dəyişiklik həm desktop cədvəldə, həm
`mobileCard`-da tətbiq olunub.

### 17–18. Sütun eni və daxili scroll

Əvvəlki kimi `DataTable`-ın cədvəl konteyneri `overflow-x-auto`-dur və hər
`<td>`/`<th>` `whitespace-nowrap`-dır (FE#69-dan bəri dəyişməyib) — mətn heç
vaxt kəsilmir/sıxılmır, əvəzinə (yalnız çox dar ekranlarda, `md`-dən aşağı
`mobileCard` işə düşdüyü üçün əslində praktikada) cədvəl ÖZÜ daxili üfüqi
sürüşə bilər, səhifə özü daşmır. Sütun sayı 11-dən 8-ə (AC-12 ilə 2 sütun,
AC-11/AC-12 ilə 1 "Qazanc" sütunu çıxarılaraq) düşdüyü üçün 1280px+
ekranlarda daxili scroll-a demək olar heç vaxt ehtiyac qalmır (AC-17, AC-18).

---

## 3. Yekun (build/test/responsive)

- `npm run build` (`tsc && vite build`) — **0 xəta**.
- `npx vitest run` — **167/167 test yaşıl** (mövcud 143 + bu taskda əlavə
  olunan 24 yeni test: `QuickSaleScreen.test.tsx` — AC-1/2/3/4/5;
  `SalesKpiCards.test.tsx` — AC-6/7/18 + loading/error; `SalesJournal.test.tsx`
  — AC-10/11/12/14/15/16 + AC-R3 regressiya).
- Responsive: kod səviyyəsində 1280/1366/1440/1920px üçün Tailwind
  breakpoint sinifləri yoxlanıldı (`hidden lg:table-cell` — Satıcı sütunu;
  axtarış kartı `sm:h-20`/`sm:text-xl` yalnız genişlənir, daralmır); 375px
  üçün mövcud `mobileCard` (dəyişməyib, yalnız düymə mətnləri və müştəri
  ikonu əlavə olunub) davam edir, axtarış avtofokusu mobil ölçüdə söndürülüb
  (klaviatura sıçramır, AC-B2). Headless brauzer mühiti mövcud olmadığı üçün
  vizual skrinşot yoxlaması aparılmayıb — CSS/breakpoint səviyyəsində
  təsdiqləndi (`docs/pages/inventory-ui-refactor.md`-də FE#70-də istifadə
  olunan eyni metodologiya).
- Kassa axını (axtar → seç → miqdar/qiymət → "SATIŞI TAMAMLA" →
  `PaymentConfirmModal` → "Təsdiqlə" → uğur ekranı → "Qaimə çıxar") kod
  səviyyəsində yoxlanıldı: `QuickSaleScreen.tsx`-in bu axına aid state/handler
  (`selectProduct`, `trySubmit`, `complete`, `PaymentConfirmModal`,
  `useInvoiceDownload`) TOXUNULMAYIB, yalnız mal seçim ekranının yuxarı hissəsi
  (axtarış+"Sərbəst satış") yenidən tərtib olunub (AC-R4).
