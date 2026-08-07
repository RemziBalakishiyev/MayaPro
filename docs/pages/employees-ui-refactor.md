# İşçilər səhifəsi — dizayn sisteminə keçid (FE#79)

Bu sənəd FE#79 çərçivəsində **yalnız "İşçilər"** səhifəsində aparılan
dəyişiklikləri, qərarları və əsaslandırmalarını qeydə alır. Referans:
`docs/design-system.md` (FE#69), `docs/ui-refactor-roadmap.md` (Mərhələ 10),
naxış nümunəsi: `src/features/customers/components/DebtViewToggle.tsx`
(Nisyə Borclar səhifəsi, FE#74).

**Bu, MALİYYƏ BAXIMINDAN HƏSSAS bir iş axınıdır.** TOXUNULMAZ qalıb
(dəyərlər/hesablama məntiqi/API sorğu kontraktı DƏYİŞMƏYİB): maaş, avans,
tutulma, tarixçə, rollar və fəaliyyət jurnalı MƏNTİQİ — o cümlədən
`salaryProgressPercent()`, `remaining`/artıq-ödəniş (`remaining < 0`)
hesablanması, `useSalaryEntries`/`useCreateSalaryEntry`/`useSetEmployeeSalary`/
`useSalarySummary` çağırış kontraktları, backend sorğuları
(`GET/POST /api/employees/{id}/salary-entries`, `PUT
/api/employees/{id}/salary`) və "Fəaliyyət" jurnalının məlumat mənbəyi
(`useActivity`). Bütün dəyişikliklər YALNIZ təqdimat (UI) qatındadır.

---

## 1. Dəyişən komponentlər

| Fayl | Nə dəyişdi |
|---|---|
| `src/features/employees/components/EmployeesViewToggle.tsx` | **YENİ** — `_app.iscilar.tsx`-dəki 2 böyük kart naxışı ƏVƏZİNƏ `DebtViewToggle` ilə EYNİ seqmentli vizual dil (`rounded-control` çərçivə, `rounded-chip` seqmentlər, aktiv seqment `bg-emerald-700`, ox düymələri ilə keçid, `min-h-[40px]`); semantika `role="tablist"`/`role="tab"`/`aria-selected` (AC-1) |
| `src/routes/_app.iscilar.tsx` | `TABS`/ad-hoc `role="tablist"` bloku `EmployeesViewToggle`-a köçürüldü; URL sxemi (`?tab=maaslar|faaliyyet`, `?month=yyyy-MM`) **bit-bədit** qorunub; satıcı üçün maaş rejimi tamamilə gizlənir (`canSeeSalary`, mövcud davranış, AC-14) |
| `src/features/employees/components/SalaryCard.tsx` | Tam UI refactor: 3 standart göstərici "Aylıq maaş"/"Bu ay ödənilib"/"Qalıq məbləğ" (əvvəl "Maaş"/"Verilib"/"Qalıb", AC-3); artıq-ödəniş halında "Qalıq məbləğ" ƏVƏZİNƏ "Artıq ödəniş" (narıncı, proqres 100% narıncı qalır, AC-4); maaş 0-dırsa proqres YOX + "Maaş təyin olunmayıb" + (yalnız `canSetSalary`-də) inline redaktəyə keçid (AC-5); rol nişanı `employeeRoleLabel()` ilə oxunaqlı Azərbaycanca etiketdə (AC-6); "Pul ver" → **"Maaş ödə"** əsas əməliyyat (dolu, tam en, digərlərindən qabarıq, AC-7); "Tutulma əlavə et"/"Tarixçəyə bax" tam mətnli, zəif tonlu (AC-8) |
| `src/features/employees/components/SalaryPayModal.tsx` | İki addımlı axına keçdi: 1) forma (canlı "Qalıq: əvvəl → sonra" önizləməsi + kassa qeydi əməliyyatdan ƏVVƏL görünür, AC-11), 2) paylaşılan `ConfirmModal`/`ConfirmDialog` ilə son təsdiq (AC-9); təsdiq məzmunu `SalaryConfirmSummary` ilə: işçi · ay · məbləğ · qalıq (əvvəl→sonra) + artıq-ödəniş narıncı xəbərdarlığı (AC-10); ad "Pul ver" → "Maaş ödə" |
| `src/features/employees/components/SalaryDeductionModal.tsx` | Eyni iki-addımlı axına keçdi (əvvəl ad-hoc submit idi) — "Tutulma əlavə et" də paylaşılan `ConfirmDialog` ilə təsdiqlənir (AC-9); kassaya təsir ETMƏDİYİ üçün kassa qeydi göstərilmir (`SalaryConfirmSummary`-nin `affectsCash={false}` — defolt) |
| `src/features/employees/components/SalaryConfirmSummary.tsx` | **YENİ** — "Maaş ödə" və "Tutulma əlavə et" arasında PAYLAŞILAN təsdiq məzmunu (AC-9/AC-10): işçi/ay/məbləğ/qalıq (əvvəl→sonra) + şərti artıq-ödəniş və kassa təsiri sətirləri |
| `src/features/employees/components/SalaryBoard.tsx` | Xəta vəziyyəti (`isError`) ad-hoc qırmızı qutu ƏVƏZİNƏ paylaşılan `InlineError` (mətn + "Yenidən", AC-12); başlıq sətri 375px-də sətirlərə bölünür (AC-15) |
| `src/features/employees/components/EmployeesTable.tsx` | "Rol" sütunu `employeeRoleLabel()` ilə oxunaqlı etiketdə (AC-6, "Fəaliyyət" rejimindəki cədvəl də daxil) |
| `src/components/ui/Badge.tsx` | `STATUS_STYLE`-a işçi rolu tonları əlavə olundu: `Sahibkar` (violet), `Menecer`/`Kassir` (sky), `Satıcı` (teal) — hər rol HƏMİŞƏ eyni tonda (AC-6) |
| `src/features/employees/lib.ts` | **YENİ** `employeeRoleLabel()` — backend-in kiçik hərfli rol kodunu (`sahib`/`menecer`/`kassir`/`satici`) sabit Azərbaycanca etiketə çevirir; artıq oxunaqlı mətnlə gələn mock/fixture dəyərləri olduğu kimi saxlanır |
| `docs/ui-terminology.md` | "Pul ver" → "Maaş ödə" dəyişikliyi qeydə alındı |

**Yeni testlər:** `EmployeesViewToggle.test.tsx`, `SalaryCard.test.tsx`,
`SalaryPayModal.test.tsx`, `SalaryDeductionModal.test.tsx`,
`src/features/employees/lib.test.ts`.

**Toxunulmayıb:** `src/features/employees/queries.ts`, `src/features/employees/api.ts`
(heç bir sorğu/endpoint/parametr dəyişməyib), `SalaryMonthSwitcher.tsx`,
`SalaryHistoryDrawer.tsx` (tarixçə siyahısı və silmə axını dəyişməyib),
`ActivityLog.tsx` (Fəaliyyət jurnalı).

---

## 2. Bənd-bənd qərarlar

### 1. Rejim seçimi (AC-1)

Əvvəlki 2 böyük kart (`grid-cols-2`, hər biri ikon + başlıq) `DebtViewToggle`
ilə EYNİ seqmentli vizual dilə keçdi: `rounded-control` xarici çərçivə +
`rounded-chip` seqmentlər, aktiv seqment `bg-emerald-700 text-white`, ox
düymələri ilə keçid (`ArrowLeft`/`ArrowRight`). Semantika fərqlidir:
`DebtViewToggle` `role="radiogroup"`/`role="radio"` istifadə edir (eyni
cədvəlin filtr rejimini seçir), `EmployeesViewToggle` isə
`role="tablist"`/`role="tab"`/`aria-selected` (iki tam fərqli görünüş —
"Maaşlar" kart grid-i və "Fəaliyyət" cədvəl+jurnal — arasında keçir, bu da
tab semantikasına uyğundur). URL sxemi (`?tab=maaslar|faaliyyet`) **bit-bədit**
qorunub.

### 2. Ay seçimi (AC-2)

`SalaryMonthSwitcher` strukturca YALNIZ `SalaryBoard` daxilində render olunur,
`SalaryBoard` isə YALNIZ `activeTab === "maaslar"` olduqda mount olunur (route
faylında şərti render, `display:none` DEYİL) — "Fəaliyyət" rejimində ay
seçici DOM-da HEÇ YOXDUR. `month` axtarış parametri `ActivityLog`/`useActivity`
tərəfindən oxunmur, ona görə Fəaliyyət nəticəsinə təsir etmir.

### 3. Standart göstəricilər (AC-3)

`SalaryCard`-dakı 3 sütun (`grid grid-cols-3 gap-2`) bərabər genişlikdə,
etiketlər HƏR kartda eyni sırada: "Aylıq maaş" · "Bu ay ödənilib" · "Qalıq
məbləğ" (əvvəlki qısaldılmış "Maaş"/"Verilib"/"Qalıb" adlandırmaları
əvəzləndi). Bütün rəqəm dəyərləri `tabular-nums`.

### 4. Artıq ödəniş (AC-4)

`overpaid = summary.remaining < 0` şərti DƏYİŞMƏYİB. Yalnız 3-cü sütunun
etiketi ("Qalıq məbləğ" → "Artıq ödəniş") və rəngi (narıncı) dəyişir, rəqəmin
özü (`Math.abs(remaining)`) və proqres zolağının 100%-də narıncı qalması
əvvəlki kimidir.

### 5. Maaş təyin olunmayıb (AC-5)

`summary.monthlySalary === 0` olduqda proqres zolağı şərti render-dən
çıxarılıb (tamamilə DOM-da yoxdur, `display:none` deyil). "Aylıq maaş"
sütununda "Maaş təyin olunmayıb" mətni göstərilir; `canSetSalary === true`
olduqda bu mətn mövcud inline-redaktə triggerinə (`setEditing(true)`)
fokuslanan kliklənən düymədir (Pencil ikonu ilə), `canSetSalary === false`
olduqda sadə mətndir (kliklənən element YOXDUR).

### 6. Rol nişanı (AC-6)

`employeeRoleLabel()` backend-in kiçik hərfli rol kodunu (`sahib`, `menecer`,
`kassir`, `satici`) sabit Azərbaycanca etiketə (`Sahibkar`, `Menecer`,
`Kassir`, `Satıcı`) çevirir; mock/test fixture-larında artıq oxunaqlı mətnlə
gələn dəyərlər olduğu kimi saxlanır. `Badge`-in `STATUS_STYLE` cədvəlinə hər
rol üçün sabit ton əlavə olunub ki, eyni rol HƏR kartda/cədvəldə HƏMİŞƏ eyni
rəngdə görünsün (`SalaryCard` və `EmployeesTable` hər ikisi).

### 7-8. Əməliyyat iyerarxiyası (AC-7/AC-8)

Kartın əməliyyat bloku iki sıraya bölündü: yuxarıda tam-enli **"Maaş ödə"**
(`variant="primary"`, dolu yaşıl — köhnə "Pul ver"i əvəz edir), altında
`grid-cols-2` içində "Tutulma əlavə et" (`secondary`) və "Tarixçəyə bax"
(`ghost`) — hər ikisi tam mətnli etiketlə (yalnız-ikon deyil) və vizual
olaraq əsas əməliyyatdan zəif.

### 9-11. Paylaşılan təsdiq axını (AC-9/AC-10/AC-11)

Həm "Maaş ödə", həm "Tutulma əlavə et" iki addımlı axına keçdi: forma →
paylaşılan `ConfirmModal`/`ConfirmDialog` (əvvəllər "Tutulma əlavə et" ad-hoc
modal daxilində birbaşa submit edirdi). Hər iki modalın təsdiq məzmunu ORTAQ
`SalaryConfirmSummary` komponentindən gəlir: işçi adı · ay · məbləğ ·
əməliyyatdan SONRAKI qalıq (`"Qalıq: 470 ₼ → 370 ₼"` formatında). Nəticə
mənfi olacaqsa (artıq ödəniş/tutulma), eyni dialoqda narıncı xəbərdarlıq
göstərilir (ödəniş üçün "Bu ödənişlə maaşdan artıq veriləcək.", tutulma üçün
"Bu tutulma ilə maaşdan artıq veriləcək."). "Maaş ödə" axınında kassa təsiri
qeydi ("Kassadan çıxacaq — gün sonunda nəzərə alınır") HƏM forma addımında
(əməliyyatdan əvvəl), HƏM də təsdiq dialoqunda göstərilir — yalnız uğur
toast-ında DEYİL. Tutulma kassaya təsir ETMƏDİYİ üçün bu sətir göstərilmir.
Hər iki modal `ConfirmModal`-ın `Promise`-based `onConfirm`/F-43 naxışını
istifadə edir: xəta halında dialoq açıq qalır və mesaj `error` propu ilə
göstərilir.

### 12. Vəziyyətlər (AC-12)

`SalaryBoard`-da 4 vəziyyət: yüklənmə → `Spinner`; boş (`rows.length === 0`)
→ `EmptyState`; xəta (`isError`) → paylaşılan `InlineError` (mətn + "Yenidən",
əvvəlki ad-hoc qırmızı qutunu əvəz etdi, mövcud `isError`/`error` mənbəyi
DƏYİŞMƏDİ); göndərilir — `ConfirmModal`-ın `isPending`/`loading` propları
düymələri avtomatik `disabled`+`aria-busy` edir, təkrar klik bloklanır (Button
primitivinin mövcud davranışı).

### 13. Toxunulmazlıq (AC-13)

Heç bir hesablama funksiyası (`salaryProgressPercent`, `remaining`/artıq-ödəniş
şərti) və heç bir sorğu/mutasiya kontraktı (`useSalaryEntries`,
`useCreateSalaryEntry`, `useSetEmployeeSalary`, `useSalarySummary`) dəyişməyib
— unit testlər (`lib.test.ts`) bunu TC səviyyəsində qoruyur.

### 14. Satıcı rolu (AC-14)

`_app.iscilar.tsx`-dəki `canSeeSalary = user?.role !== "satici"` şərti
dəyişməyib — Satıcı üçün `EmployeesViewToggle` özü belə render olunmur,
səhifə birbaşa "Fəaliyyət" görünüşünə düşür.

### 15. Responsive (AC-15)

`EmployeesViewToggle` 375px-də tam en (`w-full`, `sm:w-auto`-dan əvvəl),
`SalaryCard` grid-i `sm:grid-cols-2 xl:grid-cols-3` ilə 375/1280/1440/1920
enlərində düzgün sıxlaşır; `SalaryBoard` başlıq sətri (`Aylıq maaş
hesablanması...` + ay seçici) 375px-də `flex-col`, `sm`-dən `flex-row`-a
keçir ki, ay seçici kəsilməsin/daşmasın.

### 16. Build və sənədləşdirmə (AC-16)

`npm run build` (`tsc && vite build`) xətasız keçir. Bu sənəd və
`docs/ui-terminology.md`-dəki "Pul ver" → "Maaş ödə" qeydi əlavə olunub.
