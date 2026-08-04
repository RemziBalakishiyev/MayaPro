# MayaPro — Sədərək Anbar Sistemi

Bazar/anbar biznesi üçün mal, satış, nisyə borc, təchizatçı, xərc, gün sonu və hesabat idarəetmə sistemi (frontend). Sistemin fərqi «real pul» (kassada olmalı nağd) ilə «kağız üzərində qazanc» (nisyə daxil) arasındakı fərqi daim göz önündə saxlamasıdır. Bütün interfeys Azərbaycancadır və pul `fmtMoney()` ilə "1,250.00 AZN" formatında göstərilir.

## Quraşdırma

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # produksiya build-i (tsc + vite)
npm run preview  # build-in önizləməsi
```

Giriş: login səhifəsində istənilən istifadəçi adı/şifrə ilə daxil olmaq olur (mock auth).

## Texnologiyalar

React 18 · Vite · TypeScript · Tailwind CSS · TanStack Router / Query / Table · Zustand · React Hook Form · Zod · Recharts · lucide-react · date-fns

## Qovluq strukturu

```
src/
├── routes/        # TanStack Router — file-based routing (__root, login, _app.*)
├── features/      # Biznes modulları (öz api/queries/lib/components ilə):
│                  #   products, sales, customers, suppliers, expenses,
│                  #   day-end, reports, employees, settings, auth
├── components/
│   ├── ui/        # Paylaşılan UI primitivləri (Button, Modal, DataTable...)
│   └── layout/    # PageHead və s.
├── lib/           # Qlobal utility-lər (format, cn)
├── mocks/         # localStorage mock DB (db, seed, handlers)
└── types/         # Ortaq tiplər
```

Arxitektura **feature-based**-dır: hər modul öz qovluğunda yaşayır, modullararası əlaqə yalnız `types/` və `components/ui/` üzərindən gedir. Server datası (mallar, satışlar, borclar...) yalnız TanStack Query üzərindən keçir — birbaşa state-də saxlanmır. Biznes qaydaları (satış zənciri, xərc→maya, gün sonu) `src/mocks/handlers.ts`-də mərkəzləşib; backend gələndə bu məntiq serverə köçəcək.

## Mock rejim və backend-ə keçid

Backend hazır olana qədər data `src/mocks/db.ts` vasitəsilə **localStorage**-da saxlanılır və hər əməliyyat süni **300ms** gecikmə ilə real şəbəkə hissi verir (loading/error state-ləri əvvəldən düzgün test olunur).

`.env`-də `VITE_API_URL` təyin edildikdə hər feature-in `api.ts`-indəki `USE_MOCK` sönür və çağırışlar real API-yə yönəlir (komponentlərə toxunmadan):

```bash
# .env
VITE_API_URL=http://localhost:8080/api
```

## Datanı sıfırlama

Seed data ilk açılışda avtomatik yüklənir və `sederek-db-version` açarı ilə versiyalanır. Datanı sıfırdan yükləmək üçün brauzerin konsolunda:

```js
import { resetDb } from "@/mocks/db"; // (və ya localStorage-i təmizləyin)
resetDb();
```

Ən sadə yol: DevTools → Application → Local Storage → `sederek-db` və `sederek-db-version` açarlarını silin və səhifəni yeniləyin.
