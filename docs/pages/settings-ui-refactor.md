# Ayarlar səhifəsi — dizayn sisteminə keçid (FE#80)

Bu sənəd FE#80 çərçivəsində **yalnız "Ayarlar"** səhifəsində aparılan
dəyişiklikləri, qərarları və əsaslandırmalarını qeydə alır. Referans:
`docs/design-system.md` (FE#69), `docs/ui-refactor-roadmap.md` — "Ayarlar
sticky saxlama zolağı (F-32)". Asılıdır: FE#79 (Done, merged).

**TOXUNULMAZ qalıb:** bütün ayar açarları (`storeName`, `ownerName`,
`address`, `phone`, `whatsappTemplate`, `currency`, `defaultMinStock`,
`language`), API kontraktı (`GET/PUT /api/settings`, `settingsApi`,
`useSettings`/`useUpdateSettings`), backend validasiya qaydaları
(`UpdateSettingsValidator`) və yadda saxlama davranışı (mutasiya →
`useSettingsStore.update` + `queryClient.setQueryData`). Bütün dəyişikliklər
YALNIZ təqdimat (UI) qatındadır.

---

## 1. Dəyişən komponentlər

| Fayl | Nə dəyişdi |
|---|---|
| `src/routes/_app.ayarlar.tsx` | Tam UI refactor: sahələr 6 kart bölməsinə qruplandı (aşağıya bax); köhnə yuxarı `PageHead actions` Save düyməsi silindi — TƏK yadda saxlama nöqtəsi sticky zolaqdır; dirty-state izləmə (`baseline` vs draft `f`), inline sahə xətaları (`Field error`), WhatsApp canlı önizləməsi, `useBlocker` ilə naviqasiya bloklaması |
| `src/features/settings/lib.ts` | **YENİ** — `validateSettings()` (backend `UpdateSettingsValidator` ilə eyni qaydaları güzgüləyir), `buildWhatsappPreview()` (`{debt}` → nümunə məbləğ), `areSettingsEqual()` (dirty-state müqayisəsi) |
| `src/features/settings/lib.test.ts` | **YENİ** — yuxarıdakı üç funksiyanın unit testləri |
| `src/routes/_app.ayarlar.test.tsx` | **YENİ** — səhifə səviyyəli testlər: qruplama, sabit valyuta/dil mətn sətri, dirty-state, sticky zolaq, "Ləğv et", inline xəta, WhatsApp önizləmə, uğur/xəta vəziyyətləri, arxa-fon refetch-in draftı əzmədiyi, `useBlocker` inteqrasiyası, icazə qapısı |

**Toxunulmayıb:** `src/features/settings/api.ts`, `src/features/settings/queries.ts`,
`src/features/settings/store.ts` (heç bir açar, sorğu, ya da yadda saxlama
məntiqi dəyişməyib).

---

## 2. Bənd-bənd qərarlar

### 1-3. Kart bölmələri, etiket yerləşməsi, köməkçi mətnlər

Sahələr 6 aydın karta qruplandı: **Mağaza məlumatları** (ad, sahibkar) ·
**Qaimə məlumatları** (ünvan, telefon — hər ikisinin hint-i "Qaimə
başlığında görünəcək") · **Pul və stok parametrləri** (valyuta sabit mətn +
default min stok) · **Dil** (sabit mətn) · **WhatsApp borc xatırlatma
şablonu** (şablon + canlı önizləmə) · **İşçi icazələri** (mövcud statik rol
siyahısı, DƏYİŞMƏYİB). Bütün sahə etiketləri (`Field label`) inputun
ÜSTÜNDƏ qalır (`Field` primitivinin mövcud strukturu). Köməkçi mətnlər
(`hint`) qısa saxlanıb, əvvəlki mətnlərlə eyni məzmunda.

### 4-5. Valyuta və dil — sabit mətn sətri

`Select disabled` ƏVƏZİNƏ (dropdown görünüşü, istifadəçini yanlış "başqa
seçim var" təsəvvürünə apara bilər) sadə mətn sətri: "AZN (tezliklə əlavə
valyutalar)" və "Azərbaycanca (tezliklə əlavə dillər)". Heç bir interaktiv
kontrol (button/select) render olunmur — `[aria-haspopup="listbox"]`
elementi bu iki sahə üçün DOM-da yoxdur (test bunu yoxlayır).

### 6-8. Dirty-state və sticky yadda saxlama zolağı

`baseline` (sonuncu bilinən saxlanmış vəziyyət) və `f` (cari draft) ayrı
`useState`-lərdə saxlanılır; `dirty = !areSettingsEqual(f, baseline)`.
`dirty === true` olduqda səhifənin altında **sticky** zolaq görünür:
"Dəyişikliklər yadda saxlanılmayıb" + `[Ləğv et]` (draftı `baseline`-a
qaytarır) `[Yadda saxla]`. Köhnə yuxarı `PageHead` Save düyməsi silinib —
TƏK yadda saxlama nöqtəsi budur (heç bir təkrarlanma yoxdur).

Server sorğusu (`useSettings`) arxa-fonda yenidən yüklənəndə (məs. pəncərə
fokusu) draft YALNIZ dirty olmadıqda server dəyəri ilə sinxronlaşdırılır —
istifadəçinin yadda saxlanılmamış redaktəsi arxa-fon refetch-i ilə İTMİR
(`dirtyRef` ilə idarə olunur, test: "arxa-fon server refetch draftı ƏZMİR").

### 9-10. Validasiya və inline sahə xətaları

`validateSettings()` backend `UpdateSettingsValidator`-dəki qaydaları
BİRƏBİR güzgüləyir (yeni qayda YOXDUR, mövcud server qaydası daha erkən
göstərilir): mağaza adı və WhatsApp şablonu məcburidir (boş ola bilməz),
uzunluq limitləri (200/200/300/30/1000 simvol) və minimum stok mənfi ola
bilməz. "Yadda saxla" basılanda xətalar `Field error` mexanizmi ilə aid
sahənin altında göstərilir (`role="alert"`), sorğu göndərilmir. Xəta aid
sahə redaktə olunanda avtomatik təmizlənir.

### 11-13. WhatsApp şablonu və canlı önizləmə

`{debt}` şablon dəyişəni saxlanma/göndərmə məntiqində TOXUNULMAYIB. Şablon
sahəsinin altında redaktə-olunmayan önizləmə paneli `buildWhatsappPreview()`
ilə `{debt}`-i nümunə "250.00" məbləği ilə əvəz edərək canlı göstərir
(lokal `f.whatsappTemplate` draft-dan oxunur). Saxlanan şablon (server/
`baseline`) yalnız "Yadda saxla" uğurla bitəndə dəyişir — önizləmə heç vaxt
saxlanmamış mətni backend-ə göndərmir.

### 14. Vəziyyətlər

Saxlanılır → "Yadda saxla" düyməsi `Button loading` (spinner, təkrar klik
bloklanır). Uğur → mövcud `toast.success("Ayarlar yadda saxlandı")`,
`baseline`/`f` server cavabı ilə sinxronlaşır, sticky zolaq bağlanır. API
xətası → mövcud `toast.error(mesaj)`, draft VƏ sticky zolaq açıq qalır ki,
istifadəçi məlumatını itirmədən yenidən cəhd edə bilsin.

### 15. Naviqasiya bloklaması — `useBlocker` TƏTBİQ OLUNDU

Layihədə TanStack Router `^1.87.0` istifadə olunur və bu versiya
`useBlocker({ shouldBlockFn, enableBeforeUnload, withResolver: true })`
API-sini dəstəkləyir (`node_modules/@tanstack/react-router/dist/esm/useBlocker.d.ts`).
Arxitektura bunu TƏHLÜKƏSİZ dəstəklədiyi üçün bənd TƏTBİQ EDİLDİ:

- `shouldBlockFn: () => dirty` — yadda saxlanılmamış dəyişiklik varkən daxili
  router naviqasiyası (menyu linki, geri düyməsi və s.) bloklanır.
- `enableBeforeUnload: dirty` — brauzer tab bağlanması/yenilənməsi zamanı
  standart brauzer xəbərdarlığı göstərilir.
- `withResolver: true` — bloklanan zaman mövcud `ConfirmDialog`
  (`src/components/ui/ConfirmModal.tsx`) ilə "Yadda saxlanmamış
  dəyişikliklər" təsdiqi göstərilir: "Bəli, çıx" → `blocker.proceed()`,
  "İmtina" → `blocker.reset()`. Yeni overlay komponenti YARADILMADI —
  mövcud paylaşılan `ConfirmDialog` istifadə olundu.

Test: `src/routes/_app.ayarlar.test.tsx` — `shouldBlockFn` dirty vəziyyətinə
görə düzgün `true`/`false` qaytarır, `blocked` statusda dialoq göstərir və
`proceed`/`reset` düzgün çağırılır (`@tanstack/react-router` modulu
testlərdə `createFileRoute`/`useBlocker` stub-ları ilə əvəzlənib, çünki
real router konteksti olmadan `useBlocker` invariant xətası atır — digər
route testlərində istifadə olunan mövcud naxış).

### Responsive (1280/1440/375px)

Kartlar `grid gap-5 lg:grid-cols-2` (Tailwind defolt `lg` = 1024px) — 1280 və
1440-da 2 sütun, 375px-də 1 sütun tam en. Sticky zolaq `-mx-4/-mb-28
lg:-mx-8/lg:-mb-10` ilə `AppShell`-in mövcud səhifə padding-inə uyğun tam
enə uzanır (sidebar offseti `AppShell`-in özündə həll olunduğu üçün əlavə
hesablama tələb olunmur); düymələr 375px-də `flex-1` (tam en), `sm`-dən
`sm:flex-none`.

### Build

`npm run build` (`tsc && vite build`) xətasız keçir.
