# UI Komponent İnventarı — Sədərək Anbar (FE#68)

## Məqsəd

Bu sənəd `sederek-sistem` frontend tətbiqindəki **bütün paylaşılan UI komponentlərini** və onların istifadə xəritəsini qeydə alır: hansı komponent haradadır, hansı variantları/props-ları var, hansı səhifələrdə işlədilir və hansı qeydlər/risklər onunla bağlıdır.

İkinci hissədə **təkrarlanan və paralel implementasiyalar** qruplaşdırılıb: eyni işi görən fərqli komponentlər, hansının qalmalı olduğu və müvafiq tapıntı (`F-xx`) istinadı.

Sənəd `docs/ui-ux-current-state-audit.md` ilə eyni F-xx nömrələmə sistemindən istifadə edir.

**Qeyd:** Bu task kod dəyişmir. İnventar mövcud vəziyyəti təsvir edir.

## Necə oxumalı

| Bölmə | Nə verir |
|---|---|
| **1. Dizayn sistemi əsasları** | Rəng/tipoqrafiya/radius/breakpoint qərarlarının harada yaşadığı və hansının token olmadığı |
| **2. Paylaşılan komponentlər** | `src/components/ui/` altındakı HƏR komponent: fayl yolu · təyinat · variantlar/props · istifadə olunduğu səhifələr · qeydlər |
| **3. Feature komponentləri** | `src/features/*/components/` üzrə istifadə xəritəsi və hər komponentə bağlı `F-xx` tapıntıları |
| **4. İstifadə tezliyi** | Dəyişikliyin təsir dairəsini qiymətləndirmək üçün (hansı komponentə toxunmaq nə qədər geniş təsir edir) |
| **5. Təkrarlanma və paralel implementasiyalar** | 10 qrup: eyni işi görən fərqli implementasiyalar, «hansı qalmalı» tövsiyəsi və `F-xx` istinadı |
| **6. Xülasə** | Saylar, ölü kod və test əhatəsi |

**Əhatə təsdiqi:** `src/components/ui/` qovluğundakı **30 mənbə faylının** (test faylları istisna) hamısı bölmə 2 və 2.1-də sətirlə təmsil olunub; `src/features/*/components/` altındakı komponentlərin hamısı isə bölmə 3-də adı ilə keçir. Əskik komponent: **0**.

---

## 1. Dizayn sistemi əsasları

| Element | Mənbə | Cari vəziyyət |
|---|---|---|
| Rəng dili | Birbaşa Tailwind sinifləri | Brend: `emerald-*` (700/800/950); neytral: `stone-*`; siqnal: `red-*`, `amber-*`, `orange-*`, `sky-*`, `indigo-*`, `rose-*`. **Semantik token yoxdur** — `tailwind.config.ts`-də `colors` genişləndirilməyib |
| Tipoqrafiya | `src/index.css:15-23`, `tailwind.config.ts:7-18` | Inter; baza 16px mobil / 17px `lg`-dən; `tabular-nums` pul sütunları üçün |
| Kölgə | `tailwind.config.ts:19-22` | `shadow-soft`, `shadow-card` (kartlarda `shadow-card` üstünlük təşkil edir) |
| Radius | Konvensiya (token yoxdur) | Kartlar `rounded-2xl`, inputlar/düymələr `rounded-xl`, kiçik elementlər `rounded-lg`, badge `rounded-md` |
| Boşluq | Konvensiya | Kart daxili `p-4`/`p-5`, grid aralığı `gap-3`/`gap-4`/`gap-5` — vahid deyil |
| Safe area | `tailwind.config.ts:23-25` | `spacing.safe-bottom` = `env(safe-area-inset-bottom)`; `pb-safe-bottom` yalnız mobil tab bar-da |
| İkon dəsti | `lucide-react@0.468` | Yeganə istisna: `src/components/ui/icons/WhatsAppIcon.tsx` (öz SVG) |
| Breakpoint | Tailwind defoltu | `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280 (override edilməyib) |
| Fokus | — | **Vahid token yoxdur** (`F-37`) — `focus-visible` cəmi 11 faylda |
| Hərəkət | — | Overlay-lərdə keçid yoxdur; `prefers-reduced-motion` idarə olunmur (`F-45`) |

---

## 2. Paylaşılan komponentlər — `src/components/ui/`

| # | Komponent | Fayl yolu | Təyinat | Variantlar / əsas props | İstifadə olunduğu səhifələr | Qeydlər |
|---|---|---|---|---|---|---|
| 1 | **Accordion** | `src/components/ui/Accordion.tsx` | Açılıb-bağlanan bölmə; bağlı vəziyyətdə açıq-aşkar «düymə» görünüşü, mətnli «Aç/Bağla» göstəricisi | `icon?`, `title`, `summary?`, `desc?`, `open`, `onToggle`, `children`, `className?` | Mallar (`ProductForm`), Satış (`ExpenseRows` vasitəsilə) | `grid-template-rows` keçidi ilə açılır, məzmun DOM-dan çıxmır (RHF sahələri sıfırlanmır). `aria-expanded`/`aria-controls` düzgün. Cəmi 2 istifadəçi: `ProductForm.tsx:523`, `ExpenseRows.tsx:93` |
| 2 | **ActionMenu** | `src/components/ui/ActionMenu.tsx` | Cədvəl sətirlərində ikincil əməliyyatlar üçün «⋯» menyusu (portal) | `items: ActionMenuItem[]` (`label`, `icon?`, `onClick?`, `href?`, `tone: default\|danger\|success`, `disabled?`, `title?`), `aria-label?` | Satış (jurnal + mobil kart), Müştərilər, Nisyə Borclar, Xərclər, Təchizatçılar, Mallar | Portal + mövqe hesablaması (`placement: top\|bottom`). Trigger toxunma sahəsi 44px-dən kiçikdir (`F-38`). `disabled` bəndlər gizlədilmir — səbəb `title`-də göstərilir (yaxşı naxış) |
| 3 | **Badge** | `src/components/ui/Badge.tsx` | Status/kateqoriya nişanı; mətn açar kimi rəngi seçir | `children`, `tone?` (açar), `className?`; `STATUS_STYLE` 20 açar + `FALLBACK` | Bütün cədvəllər, Dashboard, Ayarlar, Satış detalı, İşçilər, `ExcelImportModal` | Açar tapılmayanda səssizcə boz `FALLBACK`-a düşür — rol dəyərləri məhz bura düşür (`F-29`). Ödəniş növü, mal statusu, borc statusu, xərc mənbəyi, idxal sətir statusu üçün ortaq |
| 4 | **Button** | `src/components/ui/Button.tsx` | Əsas düymə primitivi | `variant`: `primary\|secondary\|danger\|ghost\|warn`; `size`: `sm` (38px) / `md` (44px) / `lg` (52px); `icon?`; bütün native `button` atributları | Demək olar bütün səhifələr və modal/drawer-lər | **`loading` propu yoxdur** → `Loader2` naxışı 9 faylda əl ilə təkrarlanır (`F-42`). **`focus-visible` sinfi yoxdur** (`F-37`). `active:` yalnız fon rəngi dəyişir — basma hissi zəifdir |
| 5 | **Card** | `src/components/ui/Card.tsx` | Başlıqlı panel (başlıq sətri + `action` slotu + məzmun) | `title?`, `action?`, `children`, `className?` | Dashboard, Hesabatlar, Gün Sonu, Ayarlar, İşçilər (Fəaliyyət) | Detal drawer-lərində istifadə **olunmur** — orada lokal `Card` nüsxələri var (`F-49`) |
| 6 | **ConfirmModal** | `src/components/ui/ConfirmModal.tsx` | `Modal` üzərində qurulmuş təsdiq dialoqu | `open`, `onClose`, `onConfirm`, `title?`, `message?`, `confirmText?`, `danger?` | Mallar, Satış, Müştərilər, Nisyə Borclar, Təchizatçılar, Xərclər, Gün Sonu | `onConfirm(); onClose();` — async bitmədən bağlanır; `isPending`/`error` propu yoxdur (`F-43`). Silmə mesajları kontekstə görə dəyişir (yaxşı naxış: borclu müştəri xəbərdarlığı) |
| 7 | **CopyablePhone** | `src/components/ui/CopyablePhone.tsx` | Zəng linki + klikləyəndə kopyalanan nömrə | `phone`, `className?` | Müştərilər, Nisyə Borclar (hər iki görünüş) | Nömrə yoxdursa `null` qaytarır (boş xana — qəsdli qərar). `toStoredPhone` ilə normallaşdırma. Zəng ikonu `h-6 w-6` = 24px (`F-38`). `EmployeesTable`-də istifadə **olunmur** (`F-31`). Test faylı var: `CopyablePhone.test.tsx` |
| 8 | **CustomerPicker** | `src/components/ui/CustomerPicker.tsx` | Müştəri autocomplete: ad/telefon üzrə süzgəc, ↑↓/Enter naviqasiyası, tapılmayanda yeni müştəri yaratma | `customers`, `value`, `onChange`, `onCreateNew`, `placeholder?`, `className?` | Satış (`CustomerSelectBlock` → kassa + `PaymentConfirmModal`), Satış düzəliş draweri | Yalnız 2 birbaşa istifadəçi: `CustomerSelectBlock.tsx:65`, `SaleEditDrawer.tsx:310`. Tətbiqdəki 6 axtarış naxışından biri (`F-50`) |
| 9 | **DataTable** | `src/components/ui/DataTable.tsx` | TanStack Table əsaslı cədvəl: sıralama, səhifələmə, mobil kart görünüşü, boş vəziyyət | `columns`, `data`, `isLoading?`, `emptyState?`, `pageSize?` (10), `hidePagination?`, `embedded?`, `onRowClick?`, `mobileCard?`; `ColumnMeta.className` ilə responsiv sütun gizlətmə | Satış, Mallar, Müştərilər, Nisyə Borclar, Xərclər, Təchizatçılar, İşçilər, Gün Sonu, `ExcelImportModal` | `isLoading` → bütün cədvəl `Spinner`-lə əvəz olunur, skeleton yoxdur (`F-41`). `mobileCard` yalnız `md`-dən aşağı (`F-36`). Xəta vəziyyəti yoxdur — boş nəticə kimi görünür (`F-44`). Sətir kliki üçün klaviatura dəstəyi düzgün qurulub |
| 10 | **Drawer** | `src/components/ui/Drawer.tsx` | Sağdan açılan panel; genişlət/daralt, sabit footer | `open`, `onClose`, `title?`, `children` (`ReactNode \| (isExpanded) => ReactNode`), `footer?`, `wide?`, `expandable?` (defolt `true`); `useDrawerExpanded()` hook-u | Satış (detal + düzəliş), Mallar (`ProductForm`), Xərclər (detal + forma), Müştərilər/Nisyə Borclar (`CustomerDrawer`), Təchizatçılar (`SupplierDrawer`), İşçilər (`SalaryHistoryDrawer`) | `aria-modal="true"` elan edir, lakin **body scroll kilidi və fokus tələsi yoxdur** (`F-51`). Footer-də `env(safe-area-inset-bottom)` düzgün istifadə olunur. Genişlənmə vəziyyəti qlobaldır (`drawer-store`). Açılış animasiyası yoxdur (`F-45`) |
| 11 | **EmptyState** | `src/components/ui/EmptyState.tsx` | Boş nəticə bloku: ikon + başlıq + ipucu + opsional əməliyyat | `icon?` (defolt `Package`), `title`, `hint?`, `action?` | `DataTable` daxilində (bütün cədvəllər), Dashboard kartları, Hesabatlar kartları, Mal detalı, `SalaryBoard` | Kəsikli çərçivə (`border-dashed`) — `embedded` cədvəllərdə xarici kartın içində ikinci çərçivə yaradır. Xəta vəziyyəti üçün analoq yoxdur (`F-44`) |
| 12 | **EmptyValue** | `src/components/ui/EmptyValue.tsx` | Hesablana bilməyən dəyər üçün vahid «—» + ekran oxuyucusu izahı | `label?` (defolt «məlum deyil»), `title?` | Satış (jurnal + detal draweri), Xərclər (detal draweri) | `text-stone-300` — kontrast çox aşağı (`F-40`). `CustomersTable`-də isə eyni məqsədlə xam `<span>—</span>` yazılıb (`F-17`) |
| 13 | **ExpenseRows** | `src/components/ui/ExpenseRows.tsx` | Dinamik partiya xərci sətirləri: növ `Select` + ad `Input` + məbləğ; cəm və validasiya | `value: ExpenseRowValue[]`, `onChange`, `error?`; ixrac: `rowsTotal()`, `incompleteExpenseIndexes()` | Mallar (`ProductForm`), Satış (sərbəst satış) | `Accordion` içində qurulub; mərkəzi xərc növləri siyahısından (`useExpenseTypes`) qidalanır, «xüsusi» dəyər dəstəklənir. Pure helper-lər ayrıca ixrac olunub (test üçün əlverişli) |
| 14 | **Field** | `src/components/ui/Field.tsx` | Forma sahəsi karkası: label + slot + hint/error | `label`, `children`, `hint?`, `required?`, `error?` | Ayarlar, Gün Sonu, bütün modal formaları (müştəri, təchizatçı, xərc, maaş, stok) | Xəta `role="alert"` ilə (düzgün). `<label>` bütün sahəni əhatə edir. Login-də və Gün Sonu «Başlanğıc kassa» sətrində istifadə **olunmur** (`F-34`, `F-25`) |
| 15 | **FilterBar** | `src/components/ui/FilterBar.tsx` | Vahid filtr kartı: axtarış + «Filterlər · N» toqqlu panel + aktiv filtr çipləri + təmizlə | `searchValue`, `onSearchChange`, `searchPlaceholder?`, `searchAriaLabel?`, `activeCount`, `activeFilters?`, `onRemoveFilter?`, `children`, `onClear?`, `clearLabel?`, `label?`, `className?` | Mallar (`ProductFilters`), Satış (jurnal), Xərclər (`ExpenseFilters`), Nisyə Borclar (yalnız «Müştəri üzrə» rejimi) | Layihənin **rəsmi** filtr naxışı. `focus-visible` düzgün tətbiq olunub. Müştərilər və Təchizatçılar səhifələrində istifadə olunmur (`F-16`, `F-21`); Nisyə Borclarda yalnız bir rejimdə (`F-19`) |
| 16 | **FilterPanel** | `src/components/ui/FilterPanel.tsx` | Axtarışsız, yalnız açılıb-bağlanan filtr paneli | `activeCount`, `children`, `onClear?`, `clearLabel?`, `label?`, `className?` | **Heç bir yerdə** | **ÖLÜ KOD** — `src/` boyu heç bir fayldan import edilmir. `FilterBar` onu əvəz edib (`F-46`) |
| 17 | **ImageUpload** | `src/components/ui/ImageUpload.tsx` | Cloudinary şəkil yükləmə; konfiqurasiya yoxdursa URL inputuna düşür | `value`, `onChange`, `disabled?` | Mallar (`ProductForm`) | `CLOUDINARY_ENABLED` sərhədi — mock/demo pozulmur. 5MB limiti util-də. Yeganə istifadəçi: `ProductForm.tsx:377` |
| 18 | **Input** | `src/components/ui/Input.tsx` | Mətn inputu primitivi; `inputCls` sinfi ayrıca ixrac olunur | Bütün native `input` atributları; `inputCls` = `h-12 rounded-xl border-stone-300 focus:ring-4` | Ayarlar, bütün modal formaları, `ExpenseRows`, `PhoneInput`; `inputCls` isə Satış jurnalı, Nisyə Borclar, Müştərilər, `FilterBar`, `PeriodFilter` filtrlərində | `outline-none` qoyur, `focus-visible` vermir (`F-37`). `inputCls`-in xam `<input>`-larda geniş yayılması dizayn sistemindən yayınmanın əsas kanalıdır |
| 19 | **KpiCard** | `src/components/ui/KpiCard.tsx` | Tək dəyərli KPI kartı; öz skeleton/xəta/retry vəziyyətini idarə edir | `label`, `value?`, `sub?`, `tone: default\|amber`, `isLoading?`, `isError?`, `onRetry?`, `className?` | Mallar (`ProductsKpiCards`), Satış (`SalesKpiCards`) | FE#61 KPI dilinin əsas komponenti. `whitespace-nowrap` + overflow idarəsi yoxdur (`F-04`). Test faylı: `KpiCard.test.tsx` |
| 19a | **StatCluster** | `src/components/ui/KpiCard.tsx:105-163` | Bir panel içində əlaqəli rəqəmlər (mobil şaquli / `sm`-dən üfüqi, `divide` ayırıcılı) | `items: StatClusterItem[]` (`key`, `label`, `value?`, `sub?`), `isLoading?`, `isError?`, `onRetry?`, `className?` | Mallar, Satış | Eyni sorğudan gələn rəqəmlər üçün ortaq skeleton/xəta vəziyyəti |
| 19b | **AlertPill** | `src/components/ui/KpiCard.tsx:176-189` | Kliklənə bilən yığcam xəbərdarlıq çipi | `children`, `onClick?`, `className?` | Mallar (azalan stok → status filtri) | `active:scale-[0.98]` ilə toxunma hissi — layihədə nadir «basma feedback-i» nümunəsi |
| 20 | **Modal** | `src/components/ui/Modal.tsx` | Mərkəzi dialoq (mobildə aşağıdan qalxan vərəq) | `open`, `onClose`, `title?`, `children`, `wide?` | Satış (ödəniş, ziyan təsdiqi), Müştərilər/Nisyə Borclar (yeni/düzəliş/ödəniş), Təchizatçılar (4 modal), Mallar (stok, etiket, Excel), İşçilər (maaş/tutulma), `ConfirmModal` | Yığın idarəsi (`openStack`), body scroll kilidi, fokus tələsi — **düzgün qurulub**. Bağlama düyməsi 40px (`F-38`). Açılış animasiyası yoxdur (`F-45`) |
| 21 | **PeriodFilter** | `src/components/ui/PeriodFilter.tsx` | Paylaşılan dövr filtri: 6 hazır çip + «Tarix seç» popover (son 12 ay + sərbəst aralıq) | `value: PeriodRange`, `onChange`, `defaultKey?` (`all`), `className?`; `isoInRange` yenidən ixrac olunur | Mallar, Satış (jurnal), Nisyə Borclar, Xərclər | FE#56-nın rəsmi dövr dili. **Hesabatlar səhifəsinə tətbiq olunmayıb** (`F-26`). Çip toxunma sahəsi ≈30px (`F-38`), `focus-visible` yoxdur (`F-37`). Popover fokus/klaviatura idarəsi düzgün. Testlər: `PeriodFilter.test.tsx`, `period-filter-lib.test.ts` |
| 22 | **PhoneInput** | `src/components/ui/PhoneInput.tsx` | Sabit `+994` prefiksi + `50 123 45 67` maskası | `value` (saxlanılan format `994XXXXXXXXX`), `onChange`, digər `input` atributları | Müştərilər/Nisyə Borclar (yeni + düzəliş modalları), Təchizatçılar (yeni + düzəliş modalları) | `focus-within` halqası düzgün. **Login səhifəsində istifadə olunmur** (`F-34`) |
| 23 | **Select** | `src/components/ui/Select.tsx` | `<option>` uşaqlarını oxuyan xüsusi listbox (portal, klaviatura naviqasiyası) | Native `select` props (`value`, `onChange`, `disabled`, `aria-label`) + `className` | Ayarlar, `ProductFilters`, `ExpenseFilters`, Satış jurnalı filtrləri, `ExpenseRows`, `CategoryField`, `ExpenseTypeField`, forma modalları | 409 sətir — layihənin ən mürəkkəb primitivi. `outline-none` + öz `focus` üslubu (`F-37` çərçivəsində vahidləşdirilməlidir). Trigger `h-12` (44px+) — toxunma sahəsi uyğun |
| 24 | **Spinner** | `src/components/ui/Spinner.tsx` | Mərkəzləşdirilmiş dairəvi yükləmə göstəricisi (`py-16`) | Props yoxdur | Dashboard, Hesabatlar, `DataTable`, `SalaryBoard`, `SaleDetailDrawer`, Mal detalı | Ölçü/rəng parametrləşdirilməyib; skeleton dili ilə paralel yaşayır (`F-41`). `prefers-reduced-motion` idarə olunmur (`F-45`) |
| 25 | **StatCard** | `src/components/ui/StatCard.tsx` | İkonlu statistik kart (köhnə KPI dili) | `label`, `value`, `sub?`, `icon?` (Lucide), `tone`: `default\|green\|red\|amber\|indigo` | Dashboard (10 ədəd), Hesabatlar (6 ədəd), Mal detalı (4 ədəd), Gün Sonu (bağlanmış gün, 3 ədəd), `ExcelImportModal` | `whitespace-nowrap`, overflow idarəsi yoxdur (`F-04`). `KpiCard` ilə paralel mövcuddur (`F-47`) |
| 26 | **Textarea** | `src/components/ui/Textarea.tsx` | Çoxsətirli mətn sahəsi | Native `textarea` props; `rows` defolt 3; `min-h-[96px]` | Ayarlar (WhatsApp şablonu), Müştərilər (yeni/düzəliş/ödəniş qeydi), Xərclər (`ExpenseForm`), İşçilər (`SalaryPayModal`) | `Input` ilə eyni fokus naxışı — eyni `F-37` problemi |
| 27 | **Toast / Toasts** | `src/components/ui/Toast.tsx` | Sağ-aşağı küncdə bildiriş siyahısı | `kind`: `success\|error\|info`; `main.tsx`-də bir dəfə render olunur | Bütün səhifələr (`useToast()` vasitəsilə) | `aria-live`/`role` yoxdur, 3 saniyəyə avtomatik bağlanır (xətalar da), bağlama düyməsində `aria-label` yoxdur, animasiya yoxdur (`F-39`, `F-45`) |
| 28 | **WhatsAppIcon** | `src/components/ui/icons/WhatsAppIcon.tsx` | Brend WhatsApp SVG ikonu | `size?` | Satış (jurnal `ActionMenu`, detal draweri, uğur ekranı) | Müştərilər və Nisyə Borclar səhifələrində əvəzinə lucide `MessageCircle` işlədilir (`F-20`) |

### 2.1 Store və pure kitabxanalar (`src/components/ui/`)

| # | Modul | Fayl yolu | Təyinat | İxraclar | İstifadə olunduğu səhifələr | Qeydlər |
|---|---|---|---|---|---|---|
| 29 | **toast-store** | `src/components/ui/toast-store.ts` | Bildiriş vəziyyəti (zustand) | `useToastStore`, `useToast()`, `Toast`, `ToastKind` | Bütün səhifələr | `AUTO_DISMISS_MS = 3000` bütün növlər üçün eynidir — xəta mesajları üçün qısadır (`F-39`) |
| 30 | **drawer-store** | `src/components/ui/drawer-store.ts` | Bütün drawer-lər üçün ortaq «genişləndirilmiş» seçimi (zustand) | `useDrawerExpandStore` | `Drawer` istifadə edən bütün səhifələr | Qəsdən `localStorage`-a yazılmır (sessiya daxilində yaşayır). `F-12`-də təklif olunan «sonuncu ödəniş üsulu» seçimi üçün eyni naxış təkrarlana bilər |
| 31 | **period-filter-lib** | `src/components/ui/period-filter-lib.ts` | `PeriodFilter`-in xalis hesablamaları (React-dən asılı deyil) | `PeriodRange`, `QuickPeriodKey`, `QUICK_PERIODS`, `quickPeriodRange()`, `matchQuickPeriod()`, `monthRange()`, `last12Months()`, `formatRangeChip()`, `validateRange()`, `isoInRange()` | Mallar, Satış, Nisyə Borclar, Xərclər (+ `reports/api.ts` mock qolları) | Test olunub (`period-filter-lib.test.ts`). `F-26`-da Hesabatlar səhifəsinin `inPeriod`-dan buraya keçirilməsi təklif olunur |

### 2.2 Layout komponenti

| # | Komponent | Fayl yolu | Təyinat | Props | İstifadə olunduğu səhifələr | Qeydlər |
|---|---|---|---|---|---|---|
| 32 | **PageHead** | `src/components/layout/PageHead.tsx` | Səhifə başlığı: `h1` + subtitle + `actions` slotu | `title`, `subtitle?`, `actions?` | Dashboard, Mallar, Müştərilər, Nisyə Borclar, Təchizatçılar, Xərclər, Gün Sonu, Hesabatlar, İşçilər, Ayarlar | Satış səhifəsi `PageHead` istifadə **etmir** — öz `h1`-ini yazır (`QuickSaleScreen.tsx:410-412`). Sticky deyil → uzun formalarda `actions` düymələri ekrandan çıxır (`F-32`). Subtitle sahəsi bəzi səhifələrdə KPI rəqəmlərini daşıyır (`F-16`, `F-21`) |

---

## 3. Feature komponentləri — istifadə xəritəsi

### 3.1 `src/features/sales/components/`

| Komponent | Təyinat | Səhifə | Qeydlər |
|---|---|---|---|
| `QuickSaleScreen` | Kassa ekranı: axtarış → mal kartları → detallar → cəmi paneli → uğur ekranı | Satış | 905 sətir — layihənin ən böyük komponenti. Barkod `Enter` idarəsi yoxdur (`F-11`), 5 toxunuşlu axın (`F-12`), boş axtarışda tam jurnal (`F-14`), uğur ekranı 5s (`F-15`) |
| `SalesJournal` | Dövr + KPI + filtr + 10 sütunlu cədvəl + mobil kart | Satış | 744 sətir. `F-13`, `F-14`, `F-36`, `F-38`, `F-40`, `F-48` |
| `SalesKpiCards` | `StatCluster` ×2 + `KpiCard` | Satış | FE#61 KPI dilinin etalon tətbiqi |
| `SaleDetailDrawer` | Satış detalı: hesab, müştəri, məlumat kartları + 4 footer düyməsi | Satış | Lokal `Card`/`Row` nüsxələri (`F-49`). WhatsApp düyməsində `aria-disabled` + `title` naxışı — `F-09` üçün etalon |
| `SaleEditDrawer` | Satış düzəlişi | Satış | `CustomerPicker` istifadəçisi |
| `PaymentConfirmModal` | Kassa üslubu ödəniş təsdiqi (Tam/Qismən/Ödəmədi + Nağd/Kart) | Satış | Layihədə **əlçatanlıq baxımından ən yaxşı** komponent (bax audit bölmə 11). `F-12` |
| `LossConfirmModal` | Ziyana satış xəbərdarlığı | Satış | `Modal` üzərində |
| `CustomerSelectBlock` | `CustomerPicker` + «Yeni müştəri» düyməsi sarğısı | Satış (kassa + ödəniş modalı) | `required`/`requiredHint` propları ilə blok səbəbini izah edir |
| `QtyStepper` | Miqdar artır/azalt + xam input | Satış | Daxili input `outline-none`, fokus halqası yoxdur (`F-37`) |
| `SaleCalculator` | — | **Heç bir yerdə** | **ÖLÜ KOD** (`F-46`) |

### 3.2 `src/features/products/components/`

| Komponent | Təyinat | Səhifə | Qeydlər |
|---|---|---|---|
| `ProductsTable` | Mal cədvəli + mobil kart | Mallar | «Qazanc %» sütunu (`F-07`), `title` tooltip-i yoxdur |
| `ProductsKpiCards` | `StatCluster` + `KpiCard` + `AlertPill` + «Bu dövrdə…» sətri | Mallar | FE#61/FE#65 etalonu; test faylı var |
| `ProductFilters` | `FilterBar` sarğısı (kateqoriya/status/anbar) | Mallar | Rəsmi filtr naxışı |
| `ProductForm` | 624 sətirlik `Drawer` forması + canlı nəticə footer-i | Mallar | «Qazanc %» (`F-07`), `Accordion` + `ExpenseRows` + `ImageUpload` istifadəçisi |
| `StockAdjustModal` | Stok artır/azalt | Mallar, Mal detalı | `Modal` üzərində |
| `LabelPrintModal` | Barkod/QR etiket çapı | Mallar | Yalnız real rejimdə açılır (`F-09`) |
| `ExcelImportModal` | 3 addımlı Excel idxalı + önizləmə cədvəli | Mallar | Önizləmə cədvəlində `mobileCard` yoxdur; yalnız real rejimdə (`F-09`) |
| `ProductStatusBadge` | Mal statusu → `Badge` | Mallar, Mal detalı | `productStatus()` pure funksiyası ilə |

### 3.3 `src/features/customers/components/`

| Komponent | Təyinat | Səhifə | Qeydlər |
|---|---|---|---|
| `CustomersTable` | Müştəri cədvəli, `variant: debtors\|all` | Müştərilər, Nisyə Borclar | Mobil kart `variant`-a reaksiya vermir (`F-17`); `MessageCircle` ikonu (`F-20`) |
| `OpenDebtsTable` | Mənbə-üzrə açıq borc sətirləri + mobil kart | Nisyə Borclar | `MessageCircle` ikonu (`F-20`), `CopyablePhone` istifadəçisi |
| `OpenDebtsView` | `OpenDebtsTable` + «Görünən: …» alt sətri | Nisyə Borclar | `F-18`, `F-23`; test faylı var |
| `DebtsKpiCards` + `DebtsPeriodLine` | Borc vəziyyəti paneli + «Ən çox borclu» mini-kartı + dövr sətri | Nisyə Borclar | `KpiCard`/`StatCluster` istifadə **etmir**, eyni dili inline təkrarlayır, öz `ErrorBlock`-u var (`F-47`); test faylı var |
| `DebtViewToggle` | 2 böyük radio-kart (Borclar / Müştəri üzrə) | Nisyə Borclar | `role="radiogroup"` + ox naviqasiyası — düzgün əlçatanlıq |
| `CustomerDrawer` | Müştəri detalı + tarixçə | Müştərilər, Nisyə Borclar | `Drawer` istifadəçisi |
| `PaymentModal`, `NewCustomerModal`, `EditCustomerModal` | Ödəniş və müştəri formaları | Müştərilər, Nisyə Borclar, Satış | `Modal` + `Field` + `PhoneInput` + `Textarea` |

### 3.4 `src/features/expenses/`, `day-end/`, `employees/`, `suppliers/`, `reports/`

| Komponent | Fayl | Səhifə | Qeydlər |
|---|---|---|---|
| `ExpensesTable` | `src/features/expenses/components/ExpensesTable.tsx` | Xərclər | Mənfi işarəli məbləğ (`F-22`), mobil kart var |
| `ExpenseDetailDrawer` | `src/features/expenses/components/ExpenseDetailDrawer.tsx` | Xərclər | İşarəsiz məbləğ (`F-22`), lokal `Card`/`Row` (`F-49`) |
| `ExpenseForm` | `src/features/expenses/components/ExpenseForm.tsx` | Xərclər | 394 sətir; `SourcePicker` radio-kart naxışı (`DebtViewToggle` ilə eyni dil) |
| `ExpenseFilters` | `src/features/expenses/components/ExpenseFilters.tsx` | Xərclər | `FilterBar` sarğısı |
| `DayEndCard` | `src/features/day-end/components/DayEndCard.tsx` | Gün Sonu | `F-01`, `F-02`, `F-22`, `F-25`; lokal `Row` variantı (`F-49`) |
| `ClosingHistory` | `src/features/day-end/components/ClosingHistory.tsx` | Gün Sonu | Mobil kart yoxdur (`F-24`), müsbət fərq yaşıl (`F-02`), işarəsiz xərc (`F-22`) |
| `SalaryBoard` | `src/features/employees/components/SalaryBoard.tsx` | İşçilər | Layihədə xəta vəziyyəti olan 2 yerdən biri (`F-44` üçün etalon) |
| `SalaryCard` | `src/features/employees/components/SalaryCard.tsx` | İşçilər | `F-29`, `F-30`; proqres zolağı naxışı (`F-15` üçün təkrar istifadə oluna bilər) |
| `SalaryMonthSwitcher`, `SalaryPayModal`, `SalaryDeductionModal`, `SalaryHistoryDrawer` | `src/features/employees/components/` | İşçilər | `Modal`/`Drawer`/`Field` istifadəçiləri |
| `EmployeesTable` | `src/features/employees/components/EmployeesTable.tsx` | İşçilər | Mobil kart yoxdur (`F-31`), rol badge boz (`F-29`), `CopyablePhone` yoxdur |
| `ActivityLog` | `src/features/employees/components/ActivityLog.tsx` | İşçilər | `Card` içində siyahı |
| `SuppliersTable` | `src/features/suppliers/components/SuppliersTable.tsx` | Təchizatçılar | Mobil kart var (`F-48` etalonlarından biri) |
| `SupplierDrawer`, `NewSupplierModal`, `EditSupplierModal`, `DebtModal`, `PayModal` | `src/features/suppliers/components/` | Təchizatçılar | `Modal`/`Drawer`/`PhoneInput` istifadəçiləri |
| `SignatureBand` | `src/features/reports/components/SignatureBand.tsx` | Dashboard | `F-01`, `F-06`; tünd fonlu «imza» bloku — tətbiqdə unikal vizual dil |
| `DailyBarChart`, `TrendLineChart`, `ExpensePie`, `TopProductsBar`, `PaymentBreakdown` | `src/features/reports/components/` | Dashboard, Hesabatlar | recharts sarğıları; `PIE_COLORS` paleti `ExpensePie`-də təyin olunub və `PaymentBreakdown`-da təkrar istifadə edilir |
| `CategoryField` | `src/features/categories/components/CategoryField.tsx` | Mallar, Satış (sərbəst) | `Select` + sərbəst dəyər |
| `ExpenseTypeField` | `src/features/expense-types/components/ExpenseTypeField.tsx` | Xərclər | `CategoryField` ilə eyni naxış — iki paralel implementasiya (bax qrup 5.6) |

---

## 4. İstifadə tezliyi xülasəsi

| Komponent | Birbaşa import sayı (təxmini) | Qiymətləndirmə |
|---|---|---|
| `Button` | 30+ | Əsas primitiv — dəyişiklik geniş təsir edir (`F-42`) |
| `Modal` | 15+ (birbaşa + `ConfirmModal` vasitəsilə) | Sabit, keyfiyyətli |
| `DataTable` | 10 | Mərkəzi cədvəl qatı — `F-36`, `F-41`, `F-44` buradan həll olunur |
| `Badge` | 15+ | Rəng xəritəsi genişləndirilməlidir (`F-29`) |
| `Drawer` | 8 | `F-51` |
| `Field` / `Input` / `Select` / `Textarea` | 10–20 | Forma dili sabitdir; login istisnadır (`F-34`) |
| `FilterBar` | 4 | Rəsmi filtr naxışı, lakin 4 səhifədə tətbiq olunmayıb |
| `PeriodFilter` | 4 | 5-ci səhifəyə (Hesabatlar) tətbiq olunmalıdır (`F-26`) |
| `KpiCard` / `StatCluster` | 3 | Yeni KPI dili — Dashboard, Hesabatlar, Nisyə Borclar hələ kənardadır |
| `StatCard` | 5 | Köhnə KPI dili (`F-47`) |
| `Accordion`, `ImageUpload`, `CustomerPicker` | 2 | Dar, ixtisaslaşmış istifadə — normaldır |
| `FilterPanel`, `SaleCalculator` | 0 | **Ölü kod** (`F-46`) |

---

## 5. Təkrarlanma və paralel implementasiyalar

Aşağıda eyni işi görən fərqli implementasiyalar qruplaşdırılıb. Hər qrupda **hansı qalmalı / hansı birləşdirilməli** tövsiyəsi və tapıntı istinadı var.

### Qrup 1 — KPI/statistik kart dili (4 paralel implementasiya) → `F-47`, `F-04`

| Variant | Fayl | Vizual dil |
|---|---|---|
| `StatCard` | `src/components/ui/StatCard.tsx` | İkonlu, `tone` rəngli, `p-5`, `text-2xl/3xl`, adi etiket |
| `KpiCard` | `src/components/ui/KpiCard.tsx:21-79` | İkonsuz, `p-4`, `text-xl/2xl`, `uppercase tracking-wide` etiket, skeleton + xəta + retry |
| `StatCluster` | `src/components/ui/KpiCard.tsx:105-163` | Tək panel, `divide`-lı çoxlu dəyər, ortaq skeleton |
| `DebtsKpiCards` inline panelləri | `src/features/customers/components/DebtsKpiCards.tsx:98-191` | `KpiCard`/`StatCluster` dilini **əl ilə** təkrarlayan JSX + öz `ErrorBlock`-u (`:49-63`) |

**Tövsiyə:** `KpiCard` + `StatCluster` + `AlertPill` **əsas dil** kimi saxlanılsın. `DebtsKpiCards` inline panelləri bu komponentlərə köçürülsün (mövcud testlər qorunmaqla). `StatCard` ya `KpiCard`-ın rəsmi «ikonlu variantı» kimi sənədləşdirilsin, ya da mərhələli şəkildə əvəz olunsun. Overflow düzəlişi (`F-04`) hər üç paylaşılan komponentdə eyni anda tətbiq edilsin.

### Qrup 2 — Filtr qabığı (2 implementasiya, biri ölü) → `F-46`, `F-19`, `F-16`, `F-21`

| Variant | Fayl | Vəziyyət |
|---|---|---|
| `FilterBar` | `src/components/ui/FilterBar.tsx` | Aktiv; axtarış + panel + çiplər + təmizlə |
| `FilterPanel` | `src/components/ui/FilterPanel.tsx` | **İstifadə olunmur** — axtarışsız variant |
| Səhifədaxili xam filtr blokları | `src/routes/_app.borclar.tsx:359-534` (status/son əməliyyat tab qrupları, min/max, telefon, checkbox), `src/routes/_app.musteriler.tsx:136-158` («yalnız borclular» checkbox) | Qismən `FilterBar` içində, qismən kənarda |

**Tövsiyə:** `FilterBar` qalsın. `FilterPanel` silinsin — əvvəlcə onun yeganə fərqi (axtarışsız rejim) `FilterBar`-a opsional prop kimi əlavə edilsin. Müştərilər və Təchizatçılar səhifələri `FilterBar`-a keçirilsin.

### Qrup 3 — Dövr filtri (2 konsepsiya) → `F-26`, `F-19`

| Variant | Fayl | URL kontraktı | Vizual |
|---|---|---|---|
| `PeriodFilter` (yeni, FE#56) | `src/components/ui/PeriodFilter.tsx` | `?from`/`?to` | `rounded-xl border p-1` konteyner, 6 çip + «Tarix seç» popover |
| `BasePeriod` tab qrupu (köhnə) | `src/routes/_app.hesabatlar.tsx:132-150` (`PERIOD_LABELS`, `inPeriod` — `src/features/reports/lib.ts`) | `?period` | `rounded-lg bg-stone-100 p-0.5` konteyner, 4 tab |
| Köhnə qalıq: «Son əməliyyat» filtri | `src/routes/_app.borclar.tsx:402-431` | `?activity` | `PeriodFilter` ilə eyni səhifədə, lakin köhnə `BasePeriod` dəyərləri ilə |

**Tövsiyə:** `PeriodFilter` qalsın. Hesabatlar səhifəsi ona keçirilsin (`inPeriod` → `isoInRange`, sərhəd davranışı testlə təsdiqlənməklə). Nisyə Borclardakı «Son əməliyyat» filtri ya `PeriodFilter` çip dilinə salınsın, ya da adı ilə fərqli əhatəsi aydınlaşdırılsın.

### Qrup 4 — Üst qat (overlay): `Modal` vs `Drawer` vs `ConfirmModal` → `F-51`, `F-43`

| Variant | Fayl | Body scroll kilidi | Fokus tələsi | Yığın idarəsi | Animasiya |
|---|---|---|---|---|---|
| `Modal` | `src/components/ui/Modal.tsx` | ✅ | ✅ | ✅ (`openStack`) | ❌ |
| `Drawer` | `src/components/ui/Drawer.tsx` | ❌ | ❌ | ❌ | yalnız `max-width` |
| `ConfirmModal` | `src/components/ui/ConfirmModal.tsx` | `Modal`-dan miras | `Modal`-dan miras | `Modal`-dan miras | ❌ |

**Tövsiyə:** Hər üçü qalsın (fərqli semantika: mərkəzi dialoq / yan panel / təsdiq). Lakin `Modal`-dakı layer məntiqi (`openStack` + scroll kilidi + fokus tələsi) ortaq `useDialogLayer` hook-una çıxarılsın və `Drawer` də ondan istifadə etsin — `aria-modal="true"` vədi hər ikisində eyni davranışla dəstəklənsin. `ConfirmModal`-a `isPending`/`error` propları əlavə olunsun.

### Qrup 5 — Cədvəl mobil kartları (6 əl ilə yazılmış nüsxə) → `F-48`, `F-24`, `F-31`, `F-17`

| Nüsxə | Fayl | Karkas |
|---|---|---|
| Satış jurnalı | `src/features/sales/components/SalesJournal.tsx:629-717` | `rounded-xl … p-3.5` |
| Müştərilər | `src/features/customers/components/CustomersTable.tsx:249-329` | `rounded-2xl … p-4 shadow-card` |
| Açıq borclar | `src/features/customers/components/OpenDebtsTable.tsx:173-238` | `rounded-2xl … p-4 shadow-card` |
| Xərclər | `src/features/expenses/components/ExpensesTable.tsx:189-245` | `rounded-2xl … p-4 shadow-card` |
| Mallar | `src/features/products/components/ProductsTable.tsx` (mobileCard bloku) | `rounded-2xl … p-4 shadow-card` |
| Təchizatçılar | `src/features/suppliers/components/SuppliersTable.tsx:173-243` | `rounded-2xl … p-4 shadow-card` |
| **Mobil kartı OLMAYAN cədvəllər** | `ClosingHistory.tsx`, `EmployeesTable.tsx`, `ExcelImportModal.tsx` önizləməsi | — |

**Tövsiyə:** Slot-lu paylaşılan `MobileCard` karkası (`title` / `amount` / `meta` / `actions`) yaradılsın; 6 nüsxə ona köçürülsün, mobil kartı olmayan 3 cədvəl də eyni karkasla tamamlansın. Ölçülər (radius, padding, düymə hündürlüyü) tək yerdən idarə olunsun.

### Qrup 6 — Axtarış təcrübəsi (6 paralel implementasiya) → `F-50`

| Nüsxə | Fayl | Davranış |
|---|---|---|
| Topbar qlobal axtarış | `src/routes/_app.tsx:238-250` | `Enter` → `/mallar` səhifəsinə **naviqasiya** |
| `FilterBar` axtarışı | `src/components/ui/FilterBar.tsx:69-82` | Yazdıqca süzgəc, `h-12 pl-8 text-sm` |
| Nisyə Borclar «Borclar» rejimi | `src/routes/_app.borclar.tsx:333-345` | Xam input, `inputCls h-12 pl-8 text-sm` |
| Müştərilər | `src/routes/_app.musteriler.tsx:119-134` | Xam input, `inputCls pl-8` (hündürlük təyin edilməyib) |
| `CustomerPicker` | `src/components/ui/CustomerPicker.tsx` | Autocomplete, ↑↓/Enter, «yeni yarat» |
| Kassa axtarışı | `src/features/sales/components/QuickSaleScreen.tsx:417-440` | `h-11`, çərçivəsiz, `focus-within` halqalı qutu; `Enter` idarə olunmur (`F-11`) |

**Tövsiyə:** `FilterBar`-ın axtarış hissəsi ayrıca `SearchInput` kimi ixrac olunsun və 3-cü, 4-cü nüsxə ona keçirilsin. `CustomerPicker` və kassa axtarışı ixtisaslaşmış qalsın, lakin eyni ölçü/ikon dilini işlətsin. Topbar axtarışı vizual olaraq «qlobal» kimi fərqləndirilsin.

### Qrup 7 — Detal paneli sətir/kart helper-ləri (3 nüsxə) → `F-49`

| Nüsxə | Fayl | Fərq |
|---|---|---|
| `Card` + `Row` | `src/features/sales/components/SaleDetailDrawer.tsx:31-64` | `Row`-da `min-w-0` yoxdur |
| `Card` + `Row` | `src/features/expenses/components/ExpenseDetailDrawer.tsx:35-68` | `Row`-da `shrink-0`/`min-w-0` var |
| `Row` | `src/features/day-end/components/DayEndCard.tsx:16-43` | `bold`/`tone` propları, `border-b` ayırıcı |

**Tövsiyə:** `DetailCard` + `DetailRow` paylaşılan komponentləri `src/components/ui/`-yə çıxarılsın (`bold`/`tone` propları ilə hər üç halı əhatə etsin). Mövcud `src/components/ui/Card.tsx` (başlıqlı panel) ADI VƏ DAVRANIŞI DƏYİŞMİR.

### Qrup 8 — Sahə seçici (2 eyni naxış) → yeni: `F-52` konteksti

| Nüsxə | Fayl | Təyinat |
|---|---|---|
| `CategoryField` | `src/features/categories/components/CategoryField.tsx` | Kateqoriya siyahısı + sərbəst dəyər |
| `ExpenseTypeField` | `src/features/expense-types/components/ExpenseTypeField.tsx` | Xərc növü siyahısı + sərbəst dəyər |

**Tövsiyə:** İkisi də qalsın (fərqli data mənbələri var), lakin ortaq `TaxonomyField` karkasına köçürülsün — `Select` + «xüsusi dəyər» məntiqi bir yerdə yaşasın. Aşağı prioritetli, `F-52` mərhələsində birlikdə aparıla bilər.

### Qrup 9 — Xəta bloku (3 nüsxə) → `F-44`

| Nüsxə | Fayl | Görünüş |
|---|---|---|
| `KpiCard`/`StatCluster` daxili | `src/components/ui/KpiCard.tsx:45-58, 119-132` | «Yüklənmədi» + `RefreshCw` «Yenidən» |
| `DebtsKpiCards.ErrorBlock` | `src/features/customers/components/DebtsKpiCards.tsx:49-63` | Yuxarıdakının **əl ilə kopyası** |
| Səhifə xəta zolağı | `src/routes/_app.xercler.tsx:164-167`, `src/features/employees/components/SalaryBoard.tsx:44-47` | `rounded-2xl border-red-200 bg-red-50` + mesaj, **retry yoxdur** |

**Tövsiyə:** Paylaşılan `ErrorState` komponenti yaradılsın (mesaj + `onRetry`); `DebtsKpiCards.ErrorBlock` silinsin; iki səhifə zolağı və gələcəkdə əlavə olunacaq bütün səhifə xəta budaqları ona keçirilsin.

### Qrup 10 — Ölü kod (2 fayl) → `F-46`

| Fayl | Sətir | Əvəzedici |
|---|---|---|
| `src/components/ui/FilterPanel.tsx` | 90 | `FilterBar` |
| `src/features/sales/components/SaleCalculator.tsx` | 96 | `QuickSaleScreen` daxilindəki `TotalContent` |

**Tövsiyə:** Hər ikisi silinsin. `tsc` (`npm run build`) qalıq importu dərhal aşkarlayacaq, ona görə risk minimaldır.

---

## 6. İnventar üzrə xülasə

| Kateqoriya | Say |
|---|---|
| `src/components/ui/` paylaşılan komponentləri | 28 (25 komponent + `StatCluster`/`AlertPill` alt-komponentləri + `WhatsAppIcon`) |
| `src/components/ui/` store və pure kitabxanaları | 3 |
| `src/components/layout/` | 1 |
| Feature komponentləri | 60+ (`src/features/*/components/`) |
| Route (səhifə) komponentləri | 14 (`src/routes/`) |
| **İstifadə olunmayan (ölü) komponentlər** | **2** — `FilterPanel`, `SaleCalculator` |
| Təkrarlanma/paralel implementasiya qrupları | **10** |
| Vahid komponent testi olan komponentlər | 5 (`KpiCard`, `CopyablePhone`, `PeriodFilter`, `period-filter-lib`, + feature: `DebtsKpiCards`, `OpenDebtsView`, `ProductsKpiCards`) |

---

## 7. Komponent → tapıntı tərs xəritəsi

Bu cədvəl «bu komponentə toxunsam hansı tapıntılar bağlanır?» sualına cavab verir. Yol xəritəsində mərhələ planlaşdırarkən eyni komponentə toxunan işləri bir commit-də toplamaq üçün istifadə olunur.

| Komponent / fayl | Bağlı tapıntılar | Mərhələ(lər) |
|---|---|---|
| `src/components/ui/StatCard.tsx` | `F-04`, `F-47` | 1, 3 |
| `src/components/ui/KpiCard.tsx` (+ `StatCluster`, `AlertPill`) | `F-04`, `F-47` | 1, 3 |
| `src/components/ui/DataTable.tsx` | `F-36`, `F-38`, `F-41`, `F-44` | 2B, 4, 5 |
| `src/components/ui/Button.tsx` | `F-37`, `F-38`, `F-42` | 2B, 5 |
| `src/components/ui/Input.tsx` / `Textarea.tsx` / `Select.tsx` | `F-37` | 2B |
| `src/components/ui/FilterBar.tsx` | `F-16`, `F-19`, `F-21`, `F-46`, `F-50`, `F-52` | 2B, 3, 6 |
| `src/components/ui/PeriodFilter.tsx` | `F-26`, `F-37`, `F-38` | 2A, 2B |
| `src/components/ui/Modal.tsx` | `F-38`, `F-45`, `F-51` | 2B, 5, 6 |
| `src/components/ui/Drawer.tsx` | `F-38`, `F-45`, `F-51` | 2B, 5, 6 |
| `src/components/ui/ConfirmModal.tsx` | `F-43` | 5 |
| `src/components/ui/Toast.tsx` + `toast-store.ts` | `F-39`, `F-45` | 4, 6 |
| `src/components/ui/Badge.tsx` | `F-29` | 4 |
| `src/components/ui/EmptyValue.tsx` | `F-17`, `F-40` | 4 |
| `src/components/ui/CopyablePhone.tsx` | `F-31`, `F-38` | 2B, 4 |
| `src/components/ui/ActionMenu.tsx` | `F-38` | 2B |
| `src/components/ui/FilterPanel.tsx` | `F-46` (silinir) | 6 |
| `src/components/ui/EmptyState.tsx` | `F-44` | 2A |
| `src/features/sales/components/QuickSaleScreen.tsx` | `F-11`, `F-12`, `F-14`, `F-15`, `F-35`, `F-50`, `F-52` | 2B, 3, 4 |
| `src/features/sales/components/SalesJournal.tsx` | `F-13`, `F-14`, `F-36`, `F-38`, `F-40`, `F-48`, `F-52` | 2A, 2B, 3, 4 |
| `src/features/sales/components/SaleDetailDrawer.tsx` | `F-13`, `F-40`, `F-49` | 2A, 4, 6 |
| `src/features/sales/components/PaymentConfirmModal.tsx` | `F-12` | 2B |
| `src/features/day-end/components/DayEndCard.tsx` | `F-01`, `F-02`, `F-22`, `F-25`, `F-49` | 1, 4, 6 |
| `src/features/day-end/components/ClosingHistory.tsx` | `F-02`, `F-22`, `F-24`, `F-44` | 1, 4 |
| `src/features/customers/components/DebtsKpiCards.tsx` | `F-04`, `F-18`, `F-47` | 1, 3 |
| `src/features/customers/components/CustomersTable.tsx` | `F-17`, `F-20`, `F-38`, `F-48` | 2B, 4, 6 |
| `src/features/customers/components/OpenDebtsTable.tsx` | `F-20`, `F-38`, `F-48` | 2B, 4, 6 |
| `src/features/customers/components/OpenDebtsView.tsx` | `F-18`, `F-23` | 3 |
| `src/features/expenses/components/ExpensesTable.tsx` | `F-22`, `F-38`, `F-40`, `F-48` | 1, 2B, 4 |
| `src/features/expenses/components/ExpenseDetailDrawer.tsx` | `F-22`, `F-49` | 1, 6 |
| `src/features/products/components/ProductsTable.tsx` | `F-07`, `F-48` | 2A, 4 |
| `src/features/products/components/ProductForm.tsx` | `F-07` | 2A |
| `src/features/employees/components/EmployeesTable.tsx` | `F-29`, `F-31`, `F-44` | 2A, 4 |
| `src/features/employees/components/SalaryCard.tsx` | `F-29`, `F-30`, `F-38` | 2B, 4 |
| `src/features/suppliers/components/SuppliersTable.tsx` | `F-21`, `F-48` | 3, 4 |
| `src/features/reports/components/SignatureBand.tsx` | `F-01`, `F-06` | 1, 3 |
| `src/routes/_app.tsx` | `F-01`, `F-35`, `F-50`, `F-52` | 1, 2B, 4 |
| `src/routes/_app.index.tsx` | `F-03`, `F-04`, `F-05`, `F-06`, `F-22`, `F-40`, `F-52` | 1, 3, 4 |
| `src/routes/_app.hesabatlar.tsx` | `F-03`, `F-04`, `F-26`, `F-27`, `F-28`, `F-40` | 1, 2A, 3, 4 |
| `src/routes/_app.mallar.tsx` | `F-08`, `F-09`, `F-44` | 2A, 3 |
| `src/routes/_app.mallar_.$id.tsx` | `F-07`, `F-10` | 2A, 6 |
| `src/routes/_app.borclar.tsx` | `F-18`, `F-19`, `F-23`, `F-44`, `F-50`, `F-52` | 2A, 2B, 3 |
| `src/routes/_app.musteriler.tsx` | `F-16`, `F-44`, `F-50` | 2A, 2B, 3 |
| `src/routes/_app.tedarukculer.tsx` | `F-21`, `F-44` | 2A, 3 |
| `src/routes/_app.xercler.tsx` | `F-22`, `F-23`, `F-52` | 1, 3 |
| `src/routes/_app.ayarlar.tsx` | `F-32`, `F-33` | 4, 6 |
| `src/routes/_app.iscilar.tsx` | `F-29`, `F-30`, `F-31`, `F-44` | 2A, 2B, 4 |
| `src/routes/login.tsx` | `F-34`, `F-37`, `F-42` | 2A, 2B, 5 |
| `src/index.css` | `F-35`, `F-37`, `F-45` | 2B, 4, 6 |
