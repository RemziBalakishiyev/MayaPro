/**
 * FE#69 — üst qat (overlay) üçün ortaq arxa fon kilidi.
 *
 * `Modal` və `Drawer` eyni sayğacı paylaşır: üst-üstə açılan panellərdə
 * (məs. drawer üzərindən modal) arxa fon sürüşməsi YALNIZ sonuncu panel
 * bağlananda bərpa olunur.
 */
let lockCount = 0;

export function lockBodyScroll(): () => void {
  lockCount += 1;
  document.body.style.overflow = "hidden";
  let released = false;
  return () => {
    if (released) return;
    released = true;
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) document.body.style.overflow = "";
  };
}
