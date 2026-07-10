# MayaPro — Sədərək Anbar Sistemi

Bazar/anbar biznesi üçün mal, satış, borc və hesabat idarəetmə sistemi (frontend).

## Stack

React 18 · Vite · TypeScript · Tailwind CSS · TanStack Router/Query/Table · Zustand · React Hook Form · Zod · Recharts

## Başlanğıc

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # produksiya build-i (tsc + vite)
npm run preview  # build-in önizləməsi
```

## Arxitektura

Feature-based struktur — hər biznes modulu (`mallar`, `satış`, `borclar`...) `src/features/` altında öz qovluğunda yaşayır. Server datası yalnız TanStack Query üzərindən keçir; backend gələnə qədər mock qatı `src/mocks/` (localStorage + süni 300ms gecikmə) işləyir. `VITE_API_URL` təyin olunanda mock qatı avtomatik sönür.

Ətraflı: [`docs/frontend-arxitektura.md`](docs/frontend-arxitektura.md)

## Qovluq strukturu

```
src/
├── routes/       # TanStack Router — file-based routing
├── features/     # Biznes modulları (products, sales, customers...)
├── components/   # Paylaşılan UI primitivləri + layout
├── lib/          # Utility-lər (format, cn)
├── mocks/        # localStorage mock DB + seed
└── types/        # Ortaq tiplər
```

Bütün UI mətnləri Azərbaycancadır.
