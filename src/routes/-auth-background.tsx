/**
 * FE#187 — login (`/login`) və qeydiyyat (`/qeydiyyat`) səhifələri eyni
 * vizual ailəyə aiddir: incə isti fon (radial parıltı + şəbəkə naxışı).
 * İki səhifə arasında keçən istifadəçi eyni "hiss"i alsın deyə paylaşılan
 * tək komponent (əvvəllər hər iki fayldı ayrı-ayrı təkrarlanırdı).
 *
 * `-` prefiksi: TanStack Router file-based routing bu faylı marşrut kimi
 * QƏBUL ETMİR (bax `-login.test.tsx` konvensiyası), sadəcə paylaşılan UI-dır.
 */
export function AuthBackground() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(65%_50%_at_50%_0%,rgba(16,185,129,0.14),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,#065f46_1px,transparent_1px),linear-gradient(to_bottom,#065f46_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(60%_45%_at_50%_10%,black,transparent)]"
      />
    </>
  );
}
