# Sədərək Sistem — Frontend

## Mənbələr

- Arxitektura: docs/frontend-arxitektura.md — qovluq strukturuna DƏQIQ əməl et
- Referans UI/məntiq: docs/sederek-mvp.jsx — dizayn və biznes qaydaları buradan götürülür

## Stack

React 18 + Vite + TypeScript + Tailwind + TanStack Router/Query/Table + Zustand + RHF + Zod

## Qaydalar

- Bütün UI mətnləri Azərbaycanca
- Pul formatı: fmtMoney() → "1,250.00 AZN"
- Server datası (mallar, satışlar...) yalnız TanStack Query üzərindən — birbaşa state-də saxlama
- Mock data localStorage-da (mocks/db.ts), süni 300ms gecikmə ilə
- Hər addımdan sonra: npm run build xətasız keçməlidir
