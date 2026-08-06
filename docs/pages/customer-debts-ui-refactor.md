# Nisyə Borclar səhifəsi — dizayn sisteminə keçid (FE#74)

Bu sənəd FE#74 çərçivəsində **yalnız "Nisyə Borclar" səhifəsində** aparılan
dəyişiklikləri, verilən qərarları və əsaslandırmalarını qeydə alır. Asılılıq:
FE#73 (Done, `main`-ə merge olunub — "Müştərilər" səhifəsi, bax
`docs/pages/customers-ui-refactor.md`). Referans: `docs/design-system.md`
(FE#69), `docs/ui-refactor-roadmap.md`.

**TOXUNULMAZ qalıb (dəyişməyib):** borc yaranması, qalıq hesablanması (FIFO),
ödəniş bölüşdürülməsi və müştəri üzrə cəmləmə məntiqi — bunların hamısı
backend-də (`GET /api/customers/open-debts`, `POST /api/customers/{id}/payments`)
və mövcud `useOpenDebts`/`useAddCustomerPayment` sorğularındadır, bu taskda
HEÇ BİR API çağırışı əlavə/dəyişdirilməyib. `PaymentModal`-ın forma
sahələri/validasiyası/submit axını (`useAddCustomerPayment`) — **dəyişməyib**,
yalnız kontekst məlumatı əlavə olunub (bax §2.7). `waLink()` və WhatsApp
şablon əvəzləmə məntiqi — bit-bədit qorunub, yalnız görünüş (etiket) dəyişib.

---

## 1. Dəyişən komponentlər

| Fayl | Nə dəyişdi |
|---|---|
| `src/features/customers/components/DebtViewToggle.tsx` | 2 böyük radio-kart → **BİR sətirlik seqment kontrolu** (AC1); ox düymələri ilə naviqasiya (`move()`) FE#40-dan bəri dəyişməyib; izah mətni seqmentin altında TƏK kiçik sətirdə, seçilən rejimə görə (AC3) |
| `src/features/customers/components/OpenDebtsTable.tsx` | Borc yaşı 3 pilləli ciddilik tonuna keçdi (`neutral`/`warn`/`critical`, AC7-AC9); kritik pillədə ikon (`AlertTriangle`) əlavə olundu; "Ödəniş al" dolu yaşıl (əsas əməliyyat, AC12), "Xatırlat" (əvvəlki yalnız-ikon WhatsApp `<a>` → ikon + görünən mətn, AC10); `onPay` indi borc mənbəyi konteksti (`{description, sourceDate}`) ötürür (AC13) |
| `src/features/customers/components/OpenDebtsView.tsx` | `onPay` prop tipində kontekst parametri əlavə olundu (sadəcə ötürmə, məntiq dəyişmədi) |
| `src/features/customers/components/PaymentModal.tsx` | **YENİ** `context?: DebtPaymentContext` propu — açıq olduqda borc mənbəyi (mal adı/tarix) sətri göstərilir; hər zaman FIFO izahı ("Ödəniş ümumi borcdan silinir (əvvəl köhnə borclar)") göstərilir (AC13/AC14) |
| `src/features/customers/lib.ts` | **YENİ**: `DEBT_AGE_WARN=30`, `DEBT_AGE_CRITICAL=60` sabitləri + `debtAgeTone()` funksiyası (AC8/AC9); **YENİ**: `DebtPaymentContext` interfeysi (AC13) |
| `src/routes/_app.borclar.tsx` | Axtarış `TableToolbar`-ın `search` slotuna köçürüldü (hər iki rejimdə, AC6); "Ən çox borclu" klik davranışı — `customers` siyahısında ad üzrə axtarır, tapılarsa `CustomerDrawer` açır, tapılmazsa/birqiymətli deyilsə əvvəlki fallback (axtarış) işə düşür (AC5); "Ödəniş al" çağırışları indi `openPayment()` vasitəsilə kontekstlə `PaymentModal`-a ötürülür |
| `src/features/customers/lib.test.ts` | **YENİ** — `debtAgeTone`/sabitlər/`waLink` üçün unit testlər |
| `src/features/customers/components/DebtViewToggle.test.tsx` | **YENİ** — seqment render/keçid/klaviatura testləri |
| `src/features/customers/components/OpenDebtsTable.test.tsx` | **YENİ** — yaş tonu/ikon, "Xatırlat" etiketi, "Ödəniş al" konteksti, boş/xəta vəziyyətləri |
| `src/features/customers/components/PaymentModal.test.tsx` | **YENİ** — kontekstli/kontekstsiz render, FIFO izahı, validasiya regressiyası |

**Toxunulmayıb:** `DebtsKpiCards.tsx` (klik çağırışının məntiqi yalnız route
faylında dəyişdi — bu komponentin özü, `onSelectDebtor` interfeysi daxil,
AYNEN qalır), `CustomersTable.tsx`, `CustomerDrawer.tsx`, `TableToolbar.tsx`,
`FilterBar.tsx` (yalnız mövcud `hideSearch` propundan istifadə olundu, fayl
özü dəyişmədi).

---

## 2. Bənd-bənd qərarlar

### 1. Seqment kontrolu (AC1/AC2/AC3)

`DebtViewToggle` əvvəllər `ExpenseForm`-dakı `SourcePicker` ilə eyni 2 böyük
radio-kart naxışını təkrarlayırdı (hər biri ikon + başlıq + uzun izah mətni).
İndi DS-in seqmentli kontrol dilinə keçdi: `rounded-control` xarici çərçivə +
`rounded-chip` seqmentlər, aktiv seqment `bg-emerald-700 text-white`
(status/fəaliyyət tab-larında istifadə olunan eyni vizual dil), hər seqment
`min-h-[40px]` (AC-8 uyğunluğu). `role="radiogroup"`/`role="radio"` semantikası
və `ArrowLeft`/`ArrowRight` ilə dövrə vurma (`move()`) FE#40-dan bəri **bit-bədit**
qorunub — yalnız görünüş dəyişib. İzah mətni indi seqmentin altında TƏK kiçik
sətirdə (`text-xs text-stone-500`), seçilən rejimə görə mətn dəyişir; iki ayrı
böyük təsvir kartı YOXDUR.

### 2. Dövr filtri (AC4)

`PeriodFilter` (alias `SegmentedDateFilter`) yerində, dəyişdirilmədən qalır —
kontentdən əvvəl, başlığın altında (DS §1.9). Heç bir dəyişiklik edilmədi,
sadəcə yoxlanıldı.

### 3. "Ən çox borclu" klik davranışı (AC5) — BACKEND DƏYİŞİKLİYİ TƏLƏB OLUNMUR

**Qərar: `CustomerDrawer` açılır (bilinən müştərilər üçün).** `DebtsKpiCards`-dəki
mini-kart onsuz da kliklənən idi (FE#63), lakin `onSelectDebtor(name)` yalnız
axtarış zolağını doldururdu — çünki KPI endpoint-i (`useDebtsKpi`) `topDebtor`
üçün `customerId` qaytarmır, yalnız `{ name, amount }`. `BorclarPage` isə
`useCustomers()` ilə bütün müştəri siyahısını (`id` daxil) onsuz da yükləyib —
ona görə **yeni backend sorğusu əlavə etmədən** ad üzrə uyğun müştəri bu
siyahıda axtarılır:

```ts
const selectDebtor = (name: string) => {
  const matches = customers.filter((c) => c.name === name);
  if (matches.length === 1) {
    setSelected(matches[0]); // → CustomerDrawer açılır
  } else {
    setQ(name); // fallback: FE#63-dəki əvvəlki davranış (axtarışı doldur)
  }
};
```

- **Tam olaraq BİR uyğun müştəri tapılarsa** → `CustomerDrawer` birbaşa açılır,
  axtarış zolağı toxunulmaz qalır (TC10).
- **Heç bir uyğun müştəri tapılmazsa** (silinib, adı fərqlidir) VƏ YA **birdən
  çox müştəriyə uyğun gəlirsə** (ad üst-üstə düşür, birqiymətli deyil) →
  əvvəlki FE#63 fallback-ı işə düşür: axtarış zolağı həmin adla doldurulur
  (TC11). Bu, ehtiyatlı seçimdir — ad üst-üstə düşdükdə səhv müştərinin
  drawer-ini açmaqdansa, istifadəçiyə axtarış nəticəsini göstərmək daha
  təhlükəsizdir.
- **`topDebtor` yoxdursa** (`null`) — `DebtsKpiCards` (dəyişməyib) düyməni
  onsuz da `disabled` saxlayır (TC12).

### 4. Axtarış — `TableToolbar` daxilində (AC6)

Hər iki rejimdə axtarış artıq `TableToolbar`-ın `search` slotunda, cədvəlin
bilavasitə üstündədir:

- **"Borclar" rejimi** — `LocalTableSearch` birbaşa `TableToolbar`-a keçdi
  (əvvəllər sərbəst sətirdə idi).
- **"Müştəri üzrə" rejimi** — axtarış da `TableToolbar`-a keçdi; filtr paneli
  (Status/Son əməliyyat/Min-Max/Telefon/İlkin borclu) və aktiv filtr çipləri
  paylaşılan `FilterBar`-da qalır, YALNIZ `hideSearch` propu ilə (bu prop
  FE#69-dan bəri məhz bu naxış — "axtarışsız rejim" — üçün mövcuddur, `FilterBar.tsx`
  özü DƏYİŞMƏYİB). Nəticədə iki ayrı qutu göstərilir: axtarış (`TableToolbar`)
  + filtr toqql/panel (`FilterBar`) — hər ikisi eyni axtarış dəyərinə
  (`search.q`) bağlıdır, davranış (ad/telefon/mal üzrə filtr) dəyişməyib.

### 5. Borc yaşı — sadə dil + 3 pilləli ciddilik (AC7/AC8/AC9)

"N gün əvvəl" mətn formatı (`daysOldLabel`) dəyişməyib. Rəng/vurğu qaydası
indi mərkəzləşdirilmiş sabitlərə əsaslanır (`src/features/customers/lib.ts`):

```ts
export const DEBT_AGE_WARN = 30;
export const DEBT_AGE_CRITICAL = 60;

export function debtAgeTone(daysOld: number): DebtAgeTone {
  if (daysOld >= DEBT_AGE_CRITICAL) return "critical";
  if (daysOld >= DEBT_AGE_WARN) return "warn";
  return "neutral";
}
```

| Pillə | Şərt | Görünüş |
|---|---|---|
| `neutral` | `daysOld < 30` (təzə) | `text-stone-400`, ikon yoxdur |
| `warn` | `30 <= daysOld < 60` (köhnə) | `text-amber-600` (narıncı), ikon yoxdur |
| `critical` | `daysOld >= 60` (çox köhnə) | `text-red-600` + `AlertTriangle` ikonu + mətn ("N gün əvvəl") müşayiəti |

QIRMIZI rəng YALNIZ `critical` pillədə istifadə olunur və hər zaman mətn (+
ikon) ilə müşayiət olunur — rəng tək göstərici deyil (DS 9-cu qayda). Bu
sabitlər əvvəlki kod bazasındaki `>= 60`/`>= 30` hardcode ədədlərini əvəz
edir — **dəyərlər dəyişməyib** (əvvəlki `daysOldTone` funksiyası da 30/60
həddindən istifadə edirdi), yalnız BİR yerdə adlandırılıb və şərhlənib.
Heç bir yeni backend/API çağırışı əlavə olunmayıb.

**Diqqət (qarışdırılmasın):** bu sabitlər `debt-presentation.ts`-dəki
müştəri-üzrə CƏM borc yaşı həddlərindən (`OVERDUE_DAYS=60`/`CRITICAL_DAYS=120`,
FE#73) FƏRQLİDİR — həmin modul "Müştəri üzrə" görünüşünə (`CustomersTable`/
`CustomerDrawer`) aiddir və mənbə-üzrə DƏQİQ `daysOld` DEYİL, müştərinin son
ödəniş/alış tarixindən hesablanan TƏXMİNİ yaşdır. Bu tapşırıqdakı sabitlər isə
`OpenDebt.daysOld`-un (mənbə-üzrə DƏQİQ yaş) TƏQDİMAT həddidir. İkisi qəsdən
ayrı saxlanılıb — birləşdirmək fərqli semantikalı iki dəyəri qarışdırardı.

### 6. WhatsApp — "Xatırlat" açıq etiketi (AC10/AC11)

Masaüstü sətir əməliyyatındakı yalnız-ikon `<a>` (`MessageCircle` + `aria-label`)
ƏVƏZİNƏ ikon + görünən **"Xatırlat"** mətni olan link göstərilir. Mobil kart
görünüşündəki mövcud "WhatsApp" mətnli variant **"Xatırlat"** etiketinə
uyğunlaşdırıldı (masaüstü ilə terminologiya vahidliyi üçün) — hər iki yerdə
indi eyni "Xatırlat" sözü işlədilir. `waLink()` çağırışı və
`useSettingsStore().whatsappTemplate` + `{debt}` əvəzləmə məntiqi **bit-bədit**
qorunub, yalnız görünüş (etiket) dəyişib.

### 7. "Ödəniş al" — əsas əməliyyat vurğusu (AC12)

Əvvəllər "Ödəniş al" və WhatsApp düymələri eyni vizual çəkiyə malik idi
(hər ikisi `bg-emerald-50 text-emerald-700`). İndi "Ödəniş al" dolu yaşıl fon
(`bg-emerald-600 text-white`) ilə birinci dərəcəli əməliyyat kimi seçilir,
"Xatırlat" isə neytral (`bg-stone-100 text-stone-700`) ikinci dərəcəli qalır —
sıralama (əvvəlcə Ödəniş al, sonra Xatırlat) dəyişmədi. Bu dəyişiklik YALNIZ
`OpenDebtsTable`-ə (həm masaüstü, həm mobil kart) aiddir — `CustomersTable`-ın
"Borc ödənişi al" sətir düyməsi (Müştərilər səhifəsi ilə paylaşılır) bu taskın
əhatəsində DEYİL, TOXUNULMAYIB (Müştərilər səhifəsi reqressiyaya uğramasın
deyə).

### 8. `PaymentModal` konteksti (AC13/AC14)

`PaymentModal` "Ödəniş al" ilə açılanda indi göstərir:

1. Müştərinin adı (dəyişməyib).
2. **YENİ** — borc mənbəyi konteksti (mal adı + tarix), YALNIZ "Borclar"
   cədvəlindən konkret bir sətirdən açılıbsa: "Mənbə: **{description}** ·
   {tarix}".
3. Müştərinin ÜMUMİ qalıq borcu (`customer.remainingDebt`) — mətn "ümumi
   qalıq borc" olaraq dəqiqləşdirildi (əvvəlki sadəcə "qalıq borc").
4. **YENİ** — FIFO izahı sadə dillə, HƏR ZAMAN göstərilir: "Ödəniş ümumi
   borcdan silinir (əvvəl köhnə borclar)."

Kontekst `OpenDebtsTable`-dan `onPay(customer, { description, sourceDate })`
ilə ötürülür; "Müştəri üzrə" rejimindən (`CustomersTable`) və ya
`CustomerDrawer`-dən açılanda kontekst ötürülmür (`context` propu
`undefined`/`null`) — modal bu sətirsiz, xətasız açılır (AC14). Modalın forma
sahələri (məbləğ/qeyd), validasiyası (`max`, `tooMuch`) və submit axını
(`useAddCustomerPayment`) **dəyişməyib** — yalnız yuxarıdaki kontekst
məlumatı əlavə olunub. `_app.musteriler.tsx`-dəki `PaymentModal` çağırışı
`context` propunu ötürmür (optional prop, defolt `undefined`) — Müştərilər
səhifəsi TƏSİRLƏNMİR.

### 9. Rəng qaydası — borc müsbətdirsə YAŞIL DEYİL (AC15)

"Qalıq" sütunu/mobil kart rəqəmi əvvəlki kimi `text-red-600` qalır — heç vaxt
`emerald`/yaşıl (uğur tonu) istifadə olunmayıb, yoxlanıldı, dəyişiklik
edilmədi.

### 10. Loading/boş/nəticəsiz/xəta vəziyyətləri (AC16)

`OpenDebtsView`/`OpenDebtsTable` və `CustomersTable` üçün mövcud `DataTable`
prioritet qaydası (xəta → yüklənmə → boş → məlumat) və paylaşılan
`TableSkeleton`/`InlineError`/`EmptyState` primitivləri artıq düzgün
işləyirdi (FE#40/FE#63/FE#87) — bu taskda struktur dəyişmədi, yalnız
regressiya testləri ilə yoxlanıldı (`OpenDebtsTable.test.tsx`).

---

## 3. Yekun (build/test/responsive)

- `npm run build` (`tsc && vite build`) — **0 xəta**.
- `npx vitest run` — bütün mövcud testlər YAŞIL (o cümlədən
  `OpenDebtsView.test.tsx`, `DebtsKpiCards.test.tsx`, `CustomersTable.test.tsx`
  — regressiya yoxdur) + bu taskda əlavə olunan yeni testlər:
  `lib.test.ts` (yaş sabitləri/tonu, `waLink`), `DebtViewToggle.test.tsx`
  (seqment render/keçid/klaviatura), `OpenDebtsTable.test.tsx` (yaş tonu/ikon,
  "Xatırlat", "Ödəniş al" konteksti, boş/xəta vəziyyətləri),
  `PaymentModal.test.tsx` (kontekstli/kontekstsiz render, FIFO izahı,
  validasiya regressiyası).
- Responsive: kod səviyyəsində 1280/1440/1920px üçün seqment kontrolunun
  (`sm:w-auto`/`sm:flex-initial`) və `TableToolbar`-ın mövcud
  `flex-col sm:flex-row` naxışının uyğunluğu yoxlanıldı; 375px üçün seqment
  kontrolu tam-en (`w-full`, hər seqment `flex-1`) göstərilir, iki qısa
  etiket ("Borclar"/"Müştəri üzrə") daşma yaratmır, mobil kartdaki "Ödəniş
  al"/"Xatırlat" düymələri `flex-1` daxilində qalır (dəyişməyib). Headless
  brauzer mühiti mövcud olmadığı üçün (FE#70/FE#71/FE#73-də də qeyd olunan
  eyni məhdudiyyət) piksel-səviyyəli skrinşot yoxlaması aparılmayıb — CSS/
  breakpoint səviyyəsində, mövcud `DataTable`/`mobileCard` naxışı (FE#69-dan
  bəri dəyişməyib) üzərində təsdiqləndi.
- Müştərilər səhifəsi (paylaşılan komponentlər): `CustomersTable.tsx`,
  `CustomerDrawer.tsx`, `TableToolbar.tsx`, `FilterBar.tsx` fayllarının
  özlərinə TOXUNULMAYIB; `PaymentModal`-a əlavə olunan `context` propu
  optional-dır və `_app.musteriler.tsx` bu propu ötürmür — mövcud testlər
  (`CustomersTable.test.tsx`) və `npm run build` YAŞIL, reqressiya yoxdur.

## 4. Tam icra edilə bilməyən/güzəştə gedilən tələblər

- **Vizual (piksel-səviyyəli) skrinşot yoxlaması** aparılmadı — headless
  brauzer mühiti mövcud deyil (əvvəlki FE#70/FE#71/FE#73-də də eyni
  məhdudiyyət qeyd olunub); responsive yoxlama kod/CSS səviyyəsindədir.
- **"Ən çox borclu" klik davranışı** ad üzrə (case-sensitive, dəqiq) uyğunluğa
  əsaslanır — backend `customerId` qaytarmadığı üçün bu, TAM dəqiq (ID-əsaslı)
  həll deyil, lakin PM-in təsdiqlədiyi güzəştdir (bax §2.3); ad üst-üstə
  düşən nadir hallarda fallback (axtarış) işə düşür, xəta atılmır.
- **`OpenDebtsTable`-in "Ödəniş al"/"Xatırlat" vizual vurğusu**
  `CustomersTable`-ın "Borc ödənişi al" düyməsi ilə TAM unifikasiya EDİLMƏDİ —
  bu taskın əhatəsi ciddi şəkildə "yalnız Nisyə Borclar səhifəsi" olduğu üçün
  qəsdən toxunulmayıb (FE#73-dəki əks simmetrik qərara bax).
