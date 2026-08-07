# UI/UX refactor silsiləsi — yekun changelog (FE#69 → FE#81)

«Sədərək Anbar» frontend-inin tam UI/UX yenidənqurma silsiləsinin bağlanış
sənədi. Mənbələr: `docs/pages/*-ui-refactor.md` (12 sənəd),
`docs/ui-ux-global-refactor-changelog.md`, `git log`, GitHub PR-ları.

**Silsilənin əsas prinsipi (bütün mərhələlərdə eyni):** yeni funksiya ƏLAVƏ
OLUNMUR, biznes məntiqi və backend kontraktı DƏYİŞMİR — yalnız mövcud
məlumatın təqdimatı, terminologiya və vəziyyət idarəsi standartlaşdırılır.

---

## 1. Mərhələlərin xəritəsi

| Task | Mərhələ | Əhatə | Sənəd | PR |
|---|---|---|---|---|
| **FE#68** | 0 | UI/UX audit + refactor yol xəritəsi | `ui-ux-current-state-audit.md`, `ui-refactor-roadmap.md`, `ui-ux-risk-register.md` | #82 |
| **FE#69** | 1 | **Qlobal UI/UX təməli** — dizayn sistemi + 22 paylaşılan primitiv | `design-system.md`, `ui-terminology.md`, `ui-component-inventory.md` | #83 |
| **FE#70** | 2 | Mallar / Anbar | `pages/inventory-ui-refactor.md` | #163 |
| **FE#71** | 2 | Satış (POS) | `pages/sales-ui-refactor.md` | #164 |
| **FE#72** | 3 | Ana səhifə (Dashboard) | `pages/dashboard-ui-refactor.md` | #165 |
| **FE#73** | 4 | Müştərilər | `pages/customers-ui-refactor.md` | #166 |
| **FE#74** | 5 | Nisyə Borclar | `pages/customer-debts-ui-refactor.md` | #167 |
| **FE#75** | 6 | Təchizatçılar | `pages/suppliers-ui-refactor.md` | #168 |
| **FE#76** | 7 | Xərclər | `pages/expenses-ui-refactor.md` | #169 |
| **FE#77** | 8 | Gün Sonu Bağlanış | `pages/day-closing-ui-refactor.md` | #170 |
| **FE#78** | 9 | Hesabatlar | `pages/reports-ui-refactor.md` | #171 |
| **FE#79** | 10 | İşçilər / Maaşlar | `pages/employees-ui-refactor.md` | #172 |
| **FE#80** | 11 | Ayarlar | `pages/settings-ui-refactor.md` | #173 |
| **FE#81** | 12 | **Yekun regressiya və ardıcıllıq yoxlaması** | `final-ui-ux-regression-report.md`, `ui-ux-known-limitations.md`, bu fayl | *(bu PR)* |

---

## 2. FE#69 — Qlobal təməl (silsilənin əsası)

Bütün sonrakı mərhələlərin dayandığı qat.

**Yaradılan / normallaşdırılan 20 paylaşılan primitiv** (`design-system.md` §2):
`AppShell` · `Sidebar` · `TopHeader` · `PageHeader` · `GlobalProductSearch` ·
`LocalTableSearch` · `Button` · `IconButton` · `SegmentedDateFilter` ·
`StatCard` · `KpiCard`/`StatCluster`/`AlertPill` · `DataTable` ·
`TableToolbar` · `TablePagination` · `FilterBar` · `Drawer` · `ConfirmDialog` ·
`EmptyState` · `LoadingSkeleton` · `InlineError` · `Toast`.

**Yeni köməkçi modullar:** `lib/ui-tokens.ts` (spacing/radius/tipoqrafiya/ton
token-ları) · `components/ui/dialog-layer.ts` (Modal + Drawer üçün ortaq arxa
fon kilidi) · `features/day-end/components/cash-diff-presentation.ts`.

**Təsbit olunan qaydalar:**
- Layout: sidebar `16rem`, header `4rem`, səhifə padding-i `px-4 lg:px-8` —
  hamısı **TƏK yerdə** (`AppShell` + `--app-*` CSS dəyişənləri).
- Fokus tokeni: `focus-ring` / `focus-ring-inset` / `focus-ring-dark`.
- Kontrol hündürlükləri: `sm` ≥40px · `md` ≥44px · `lg` ≥52px.
- Maliyyə rəqəmi: `.money` (`min-w-0 + overflow-hidden + truncate + tabular-nums`).
- **KRİTİK R-02:** müsbət kassa fərqi yaşıl «uğur» DEYİL — kəhrəba
  «yoxlanmalı uyğunsuzluq».
- Rəng heç vaxt yeganə status siqnalı deyil — ikon və/və ya mətn müşayiət edir.
- `IconButton.label` **tip səviyyəsində məcburidir** → izahsız yalnız-ikon
  düymə kompilyasiya olunmur.
- Vəziyyət prioriteti: **xəta → yüklənmə → boş → məlumat**.
- Terminologiya: 70 sətirlik köhnə→yeni cədvəli (`ui-terminology.md`).

---

## 3. Səhifə-səhifə əsas nəticələr

### FE#70 — Mallar / Anbar
- `TableToolbar` + `LocalTableSearch` + `PeriodFilter` naxışının **birinci
  tətbiqi** (sonrakı bütün siyahı səhifələri bunu təkrarladı).
- Başlıqdakı 3 ikinci dərəcəli düymə → **«Digər əməliyyatlar»** menyusu
  (səhifədə BİR dominant əməliyyat qaldı).
- «Alış» / «Real maya» / «Maya üzərindən qazanc %» sütunlarına izah
  tooltip-ləri (düsturlar dəyişmədən).
- Boş dəyərlər gizlədilmir: `—` + izahedici `aria-label` (`EmptyValue`).
- «Stok» sətir əməliyyatı → «Stok artır» / «Stok azalt» (yalnız ikon/rəng
  fərqi ilə kifayətlənilmədi).

### FE#71 — Satış (POS)
- Mal/barkod axtarışı səhifənin **ən dominant** elementi oldu; «Sərbəst satış»
  qəsdən ikinci dərəcəli ghost düyməyə endirildi.
- Axtarış placeholder-i «Mal adı və ya barkod — satış üçün» → qlobal
  axtarışdan mətnlə də fərqlənir.
- Sətir əməliyyatları mətnli etiketə keçdi: «Detala bax» / «Qaimə» / «Digər».
- Jurnal sütunları PM prioritetinə salındı (8 sütun); «Maya qiyməti»/«Xərc»
  `SaleDetailDrawer`-in «Hesab» kartına köçdü — **data itmədi, yeri dəyişdi**.

### FE#72 — Ana səhifə (Dashboard)
- `R-19`/`F-06` həlli: eyni rəqəmin iki adı («Bugünkü qazanc» + «Kağız
  üzərində qazanc») → TƏK ad: **«Bugünkü real qazanc»**.
- Yeni ② bölmə: **«İndi nə etməliyəm?»** — diqqət tələb edən siqnallar
  (gün bağlanış statusu, nisyə payı, azalan stok) + müsbət boş vəziyyət.
- Chart-larda «boş» ilə «az data» fərqləndirildi: «Hələ kifayət qədər məlumat
  yoxdur» + nə vaxt qayıtmalı olduğu.

### FE#73 — Müştərilər
- «Yalnız borclular» checkbox-ı → `role="tablist"` seqment düymələri
  («Hamısı» / «Borcu olanlar»), URL sxemi dəyişmədən.
- `Badge` borc statusu 3 pilləyə bölündü: **Borclu** (sky) · **Gecikmiş borc**
  (60+ gün, amber) · **Kritik borc** (120+ gün, red) — əvvəl HƏR borclu
  qırmızı idi.
- Sıfır borc `—` yerinə `0.00 ₼` (sıfır real dəyərdir, «naməlum» deyil).
- «Ödəniş» → «Borc ödənişi al» (əməliyyat mətndən aydın).

### FE#74 — Nisyə Borclar
- Ödəniş modalına **borc mənbəyi konteksti** (hansı mal/tarix) və FIFO
  izahı sadə dillə — bölüşdürmə məntiqi (backend) toxunulmadan.
- «Müştəri üzrə» / «Borclar» rejimləri arasında vahid axtarış dili.

### FE#75 — Təchizatçılar
- Müştərilər (FE#73) ilə **eyni vizual dil**: `TableToolbar` + seqment
  görünüş («Hamısı» / «Borcum olanlar»).

### FE#76 — Xərclər
- **Rəng qaydasının ən önəmli tətbiqi:** xərc məbləğlərindən `text-red-600` +
  əl ilə `−` prefiksi çıxarıldı → neytral, işarəsiz rəqəm + kiçik boz
  «çıxış» ikon/mətni (`amount-presentation.tsx` — tək mənbə).
  Səbəb: xərc gündəlik NORMAL əməliyyatdır, ziyan/xəta deyil.
- Xam şəbəkə xətası (`Failed to fetch`) → «Xərclər yüklənmədi» + «Yenidən».

### FE#77 — Gün Sonu Bağlanış
- `R-01`/`F-01` ambiqivliyi həll edildi: sidebar «Kassada olmalı (ümumi)» +
  «Son bağlanışdan bəri» vs Gün Sonu «Bu günün sonunda kassada olmalı».
  (Audit sənədinin təklifi kod yoxlaması ilə **tərsinə** çıxdı və düzəldildi.)
- Mühasibat terminləri sadə bazar dilinə: «Gözlənilən»/«Faktiki» →
  **«Olmalı idi»/«Sayıldı»**.
- 3 mərhələli axın + strukturlaşdırılmış son təsdiq (`ConfirmModal`-da
  Olmalı idi / Sayıldı / Fərq / Tarix + dəyişdirilməzlik xəbərdarlığı).
- «Qeyd (istəyə bağlı)» sahəsi — backend `Closing.Note` artıq mövcud idi,
  heç bir UI onu göndərmirdi.
- Deaktiv düymənin səbəbi həmişə yazılı: «Faktiki məbləği yazın» / «Bu gün
  artıq bağlanıb».
- `cashDiffPresentation()` «artıq bağlanıb» xülasə kartına da tətbiq edildi
  (əvvəl orada paralel inline ternar var idi) → **DRY, tək mənbə**.

### FE#78 — Hesabatlar
- Standart `PeriodFilter` köhnə düymə qrupunu əvəz etdi.
- Hər chartın altında **«Cədvəl kimi bax»** (`ChartDataTable`) — chart-lar
  ekran oxuyucusu üçün decorative olduğundan əlçatan alternativ.

### FE#79 — İşçilər / Maaşlar
- «Pul ver» → **«Maaş ödə»**; kartın ən qabarıq əməliyyatı oldu.
- Qısaldılmış etiketlər tam formaya: «Maaş»/«Verilib»/«Qalıb» →
  «Aylıq maaş»/«Bu ay ödənilib»/«Qalıq məbləğ».
- Maaş 0-dırsa `0.00 ₼` əvəzinə «Maaş təyin olunmayıb».
- Xam rol kodu (`sahib`) → «Sahibkar»/«Menecer»/«Kassir»/«Satıcı» + sabit
  `Badge` tonu.
- «Tutulma yaz» birbaşa submit-dən **iki-addımlı `ConfirmDialog`** naxışına
  keçdi (`SalaryPayModal` ilə eyni).

### FE#80 — Ayarlar
- Sticky «Dəyişikliklər yadda saxlanılmayıb» zolağı + `useBlocker` ilə
  naviqasiya qoruması (F-32).
- Səhifə səviyyəli test dəsti (`_app.ayarlar.test.tsx`).

---

## 4. Aralıq düzəliş taskları (silsilə ilə paralel)

| Task | Nəticə |
|---|---|
| FE#84 · FE#99 · FE#100 · FE#101 · FE#102 · FE#113 · FE#117 · FE#119 · FE#141 · FE#152 · FE#154 | **40px minimum toxunma hədəfi** — bütün interaktiv kontrollar mərhələ-mərhələ uyğunlaşdırıldı (FilterBar çipləri, PeriodFilter aralıq təmizləmə, ImageUpload, LabelPrintModal, DebtsKpiCards retry, ProductForm, login) |
| FE#85 · FE#122 | Lokal cədvəl axtarışının qlobaldan fərqləndirilməsi |
| FE#142 | Şəbəkə xətası artıq sonsuz spinner və ya yanıldıcı boş siyahı kimi görünmür → `InlineError` + `StaleDataBanner`; ortaq `PageSkeleton` |
| FE#143 | İstifadəsiz `PageToolbar` / `StatusBadge` primitivləri silindi |
| FE#144 · FE#161 | `design-system.md` iddiaları ilə koddakı JSDoc-ların sinxronlaşdırılması |
| FE#174 | `PeriodFilter` `aria-selected` — ay/həftə aralıq toqquşması |

---

## 5. FE#81 — bağlanış taskı (bu PR)

**Yoxlanan:** 13 route · 20 AC · 29 TC · 4 meyar sənəd dəsti.
**Nəticə:** 12 YOXLA bəndi keçdi · 7 tapıntı düzəldildi · 4 tapıntı
sənədləşdirildi (davranış/backend tələb edir) · 6 TC icra edilə bilmədi
(canlı backend).

**8 düzəliş commit-i:**

1. `fix(ui): catismayan tooltip (title) ve fokus tokeni` — 15 ikon-yalnız
   düyməyə `title`; `QtyStepper`-də əvəzsiz silinmiş fokus göstəricisi
   bərpa olundu + input etiketi. *(AC8, AC15)*
2. `fix(ui): deprecated PageHead alias evezine PageHeader` — 4 route
   deprecated alias-dan standart ada keçdi. *(AC2)*
3. `fix(ui): catismayan loading veziyyeti (Button loading propu)` — 12 submit
   düyməsi spinner + `aria-busy` aldı; əl ilə `Loader2` naxışı silindi. *(AC7, AC10)*
4. `fix(ui): ufuqi dasma qorumasi - DebtsKpiCards money sinfi` — FE#69-dan
   ötürülən AC-17 qalığı bağlandı. *(AC14)*
5. `fix(ui): reng semantikasi - Gun Sonu xercleri artiq qirmizi deyil` —
   FE#76 qaydası Gün Sonuna da tətbiq olundu (eyni anlayış artıq iki
   səhifədə iki rəngdə deyil). *(AC9)*
6. `fix(ui): Satis basliginin tipoqrafiya/bosluq uygunlasdirmasi` *(AC1)*
7. `fix(ui): Gun Sonu kartinda catismayan xeta veziyyeti` — maliyyə baxımından
   ən həssas ekranda `useSummary` xətası səssizcə `0` göstərirdi. *(AC10)*
8. `fix(ui): Fealiyyet jurnalinda xeta/yuklenme veziyyeti` *(AC10)*

**Açıq qalan yüksək prioritetli iş** (`ui-ux-known-limitations.md`):
L-11 (4 maliyyə əməliyyatı təsdiqsiz) · L-12 (barkod/Enter axını yoxdur).

---

## 6. Silsilənin ölçülə bilən nəticəsi

| Göstərici | FE#68 (audit) | FE#81 (yekun) |
|---|---|---|
| Paylaşılan primitiv | inventarda 32 komponent, ad-hoc təkrarlarla | **20 standart primitiv**, 2-si silindi (FE#143) |
| Səhifə karkası | hər route öz padding/başlıq strukturu | **TƏK `AppShell` + `PageHeader`** (10/10 route) |
| Dövr filtri | səhifəyə görə fərqli tab/select | **TƏK `PeriodFilter`** (6/6 səhifə) |
| Xəta vəziyyəti | əksər səhifədə yox (F-44) | **13/13 səhifə-panel** `InlineError` + «Yenidən» |
| Yalnız-ikon izahsız düymə | çoxsaylı | **0** (tip səviyyəsində + skan ilə təsdiq) |
| Müsbət kassa fərqi | yaşıl «uğur» | **kəhrəba «yoxlanmalı»**, tək mənbədən |
| Xərc rəngi | qırmızı (yanlış siqnal) | **neytral**, hər iki səhifədə |
| Köhnə terminologiya qalığı | 70 sətir | **0** |
| Müsbət `tabIndex` | — | **0** |
| Test dəsti | — | **47 fayl / 354 test, 0 fail** |
| `npm run build` | — | **0 xəta** |

---

## 7. Silsilədən sonra tövsiyə olunan istiqamət

1. **Davranış boşluqları** (L-11, L-12) — bu ikisi UI/UX səviyyəsində qalan
   yeganə **yüksək prioritetli** işdir.
2. **Vizual regressiya təməli** (L-01) — Playwright + baseline seti; bundan
   sonra hər UI taskı vizual diff ilə yoxlana bilər.
3. **Canlı QA dövrü** (L-04) — 6 kritik axın real backend ilə.
4. **Sənəd/kod sinxronizasiyası** (L-06…L-10) — `design-system.md` və
   `ui-terminology.md` bu hesabatdakı tapıntılarla yenilənsin.
5. **Təmizlik** (L-15) — istifadəsiz `PageHead.tsx` alias-ının silinməsi.
